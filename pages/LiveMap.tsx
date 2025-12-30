import React, { useEffect, useState, useMemo, useCallback, memo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Circle, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import { Vehicle } from '../types.ts';
import { Loader2, Map as MapIcon, Cpu, Navigation, Activity } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  active: '#10b981',
  maintenance: '#f97316',
  idle: '#f59e0b',
  offline: '#64748b'
};

const getDefaultIcon = () => {
  if (typeof L === 'undefined' || !L.icon) return null;
  return L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

const createClusterCustomIcon = (cluster: any) => {
  const markers = cluster.getAllChildMarkers();
  const counts: Record<string, number> = { active: 0, maintenance: 0, idle: 0, offline: 0 };
  
  markers.forEach((m: any) => {
    const status = m.options.status || 'offline';
    counts[status] = (counts[status] || 0) + 1;
  });

  let predominant = 'active';
  let max = 0;
  ['active', 'maintenance', 'idle', 'offline'].forEach(s => {
    if (counts[s] >= max) {
      max = counts[s];
      predominant = s;
    }
  });

  const color = STATUS_COLORS[predominant];
  const size = markers.length < 10 ? 40 : markers.length < 50 ? 50 : 60;

  return L.divIcon({
    html: `
      <div class="relative flex items-center justify-center group" style="width: ${size}px; height: ${size}px;">
        <div class="absolute inset-0 rounded-full opacity-20 animate-pulse" style="background-color: ${color}; transform: scale(1.2);"></div>
        <div class="absolute inset-0 rounded-2xl shadow-2xl border-4 border-white dark:border-slate-900 transition-transform flex items-center justify-center font-black text-white" style="background-color: ${color};">
          <span class="text-xs tracking-tighter">${markers.length}</span>
        </div>
      </div>
    `,
    className: 'custom-marker-cluster',
    iconSize: L.point(size, size, true),
  });
};

/**
 * Performance-Optimized Memoized Marker
 */
const VehicleMarker = memo(({ v, icon }: { v: Vehicle, icon: L.Icon }) => (
  <Marker 
    position={[v.lastLat, v.lastLng]} 
    icon={icon}
    // @ts-ignore
    status={v.status}
  >
    <Popup className="custom-popup" minWidth={220}>
        <div className="p-3">
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
               <h3 className="font-black text-slate-900 text-sm uppercase tracking-tight truncate pr-2">{v.name}</h3>
               <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-lg border-2 ${
                   v.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-600 border-slate-100'
               }`}>{v.status}</span>
            </div>
            <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-400 font-bold uppercase tracking-tighter flex items-center gap-1"><Cpu size={12} /> Energy</span>
                    <span className={`font-black ${v.fuelLevel < 20 ? 'text-red-600 animate-pulse' : 'text-slate-900'}`}>{v.fuelLevel}%</span>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-400 font-bold uppercase tracking-tighter flex items-center gap-1"><Navigation size={12} /> Runtime</span>
                    <span className={`font-black text-slate-900`}>{v.engineHours}h</span>
                </div>
            </div>
        </div>
    </Popup>
  </Marker>
), (prev, next) => {
  // Deep equality check for performance: Only re-render if position or critical status changes
  return (
    prev.v.id === next.v.id &&
    prev.v.lastLat === next.v.lastLat &&
    prev.v.lastLng === next.v.lastLng &&
    prev.v.status === next.v.status &&
    prev.v.fuelLevel === next.v.fuelLevel
  );
});

const MapContent = ({ 
  vehicles, 
  showGeofences, 
  onViewportChange 
}: { 
  vehicles: Vehicle[], 
  showGeofences: boolean,
  onViewportChange: (bounds: L.LatLngBounds) => void 
}) => {
  const map = useMap();
  const icon = useMemo(() => getDefaultIcon(), []);

  useMapEvents({
    moveend: () => onViewportChange(map.getBounds()),
    zoomend: () => onViewportChange(map.getBounds())
  });

  if (!icon || !map) return null;

  return (
    <>
      <TileLayer
        attribution='&copy; OpenStreetMap'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {showGeofences && (
          <Circle 
              center={[34.0522, -118.2437]}
              radius={2000}
              pathOptions={{ color: '#3b82f6', fillOpacity: 0.1, weight: 2, dashArray: '5, 10' }}
          />
      )}

      <MarkerClusterGroup
        chunkedLoading={true} // Performance optimization for large datasets
        showCoverageOnHover={false}
        iconCreateFunction={createClusterCustomIcon}
        maxClusterRadius={80}
      >
        {vehicles.map((v) => (
            v.lastLat && v.lastLng && (
              <VehicleMarker key={v.id} v={v} icon={icon} />
            )
        ))}
      </MarkerClusterGroup>
    </>
  );
};

export const LiveMap = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [showGeofences, setShowGeofences] = useState(true);

  const fetchVisibleVehicles = useCallback(async (bounds: L.LatLngBounds) => {
    setLoading(true);
    try {
        const { MOCK_VEHICLES: mockDB } = await import('../constants.ts');
        const visible = mockDB.filter(v => 
             v.lastLat && v.lastLng &&
             bounds.contains([v.lastLat, v.lastLng])
        );
        setVehicles(visible);
    } finally {
        setLoading(false);
    }
  }, []);

  return (
    <div className="h-[calc(100vh-8rem)] w-full rounded-[2.5rem] overflow-hidden shadow-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 relative animate-in fade-in duration-700">
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-3 pointer-events-none w-auto sm:w-72">
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-6 rounded-[2rem] shadow-2xl border border-gray-200 dark:border-slate-800 pointer-events-auto">
            <div className="flex justify-between items-start mb-6">
                <h4 className="font-black text-slate-900 dark:text-white text-xs md:text-sm uppercase tracking-tight flex items-center gap-2">
                    <MapIcon size={16} className="text-blue-600" /> Site Intel
                </h4>
                {loading && <Loader2 className="animate-spin text-blue-600" size={16} />}
            </div>
            <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-inner">
                    <div className="text-[8px] uppercase text-slate-400 font-black tracking-widest mb-1.5 flex items-center gap-1"><Activity size={10} /> Nodes</div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums tracking-tighter">{vehicles.length}</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-inner">
                    <div className="text-[8px] uppercase text-slate-400 font-black tracking-widest mb-1.5">Operational</div>
                    <div className="text-2xl font-black text-emerald-600 tabular-nums tracking-tighter">
                        {vehicles.filter(v => v.status === 'active').length}
                    </div>
                </div>
            </div>
          </div>
      </div>

      <MapContainer center={[34.0522, -118.2437]} zoom={12} className="h-full w-full">
        <MapContent vehicles={vehicles} showGeofences={showGeofences} onViewportChange={fetchVisibleVehicles} />
      </MapContainer>
    </div>
  );
};