
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, Truck, Gauge, Battery, MapPin, Clock, 
  Settings, History, Briefcase, Activity, Info, 
  Zap, Wrench, Shield, ChevronRight, Share2, MoreHorizontal,
  ExternalLink, Calendar, Map as MapIcon, Loader2, Plus,
  FileText, Download, Filter, RefreshCw, LineChart as LineIcon,
  AlertTriangle, Play, Pause, Square, Timer, MousePointer2, AlertOctagon, Power,
  Maximize2, FastForward, SkipBack, SkipForward, Bell, ShieldAlert,
  ChevronDown, Layers, Scissors, Thermometer, Orbit
} from 'lucide-react';
import { 
  Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Line, Legend, ReferenceLine, ComposedChart,
  Brush, Bar, AreaChart, LineChart
} from 'recharts';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MOCK_VEHICLES, MOCK_MAINTENANCE_RECORDS, MOCK_JOBS } from '../constants.ts';
import { api } from '../services/api.ts';
import { JobStatus, MaintenanceType } from '../types.ts';
import toast from 'react-hot-toast';

// Leaflet Icon Fix
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

/**
 * Generates high-fidelity telemetry data with spatial-temporal path patterns.
 */
const generateHistory = (hours: number, baseLat = 34.0522, baseLng = -118.2437) => {
  const data = [];
  const now = new Date();
  let baseFuel = 85;
  let baseHours = 1240.5;
  let currentLat = baseLat;
  let currentLng = baseLng;
  let baseTemp = 82;

  for (let i = hours; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000);
    const hour = time.getHours();
    const isActive = (hour >= 7 && hour <= 12) || (hour >= 13 && hour <= 17);
    
    if (isActive) {
      baseFuel -= 1.5 + (Math.random() * 1.5);
      baseHours += 0.9 + (Math.random() * 0.1);
      baseTemp = 180 + (Math.random() * 20);
      currentLat += (Math.random() - 0.5) * 0.005;
      currentLng += (Math.random() - 0.5) * 0.005;
    } else {
      baseFuel -= 0.05 + (Math.random() * 0.1);
      baseTemp = 90 + (Math.random() * 10);
      if (Math.random() > 0.9) baseHours += 0.1;
      currentLat += (Math.random() - 0.5) * 0.0001;
      currentLng += (Math.random() - 0.5) * 0.0001;
    }
    
    if (baseFuel < 10) baseFuel = 98; 

    data.push({
      timestamp: time.toISOString(),
      displayTime: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      dateLabel: time.toLocaleDateString([], { month: 'short', day: 'numeric' }),
      fuel: Math.round(baseFuel * 10) / 10,
      speed: isActive ? Math.round(30 + Math.random() * 30) : 0,
      rpm: isActive ? Math.round(1800 + Math.random() * 600) : 800,
      temp: Math.round(baseTemp),
      engineHours: Math.round(baseHours * 10) / 10,
      lat: currentLat,
      lng: currentLng,
      event: (Math.random() > 0.98 && isActive) ? 'High Temp Alert' : (Math.random() > 0.99) ? 'Geofence Exit' : null,
      ignition: isActive
    });
  }
  return data;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-2xl animate-in zoom-in duration-200 z-[9999]">
        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">{label}</p>
        <div className="space-y-2">
          {payload.map((entry: any, i: number) => (
            <div key={i} className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }}></div>
                 <span className="text-[10px] font-black text-slate-300 uppercase tracking-tight">{entry.name}</span>
              </div>
              <span className="text-xs font-black text-white tabular-nums">
                {entry.value}{entry.name.includes('Fuel') ? '%' : entry.name.includes('Speed') ? ' km/h' : entry.name.includes('RPM') ? '' : entry.name.includes('Temp') ? '°F' : 'h'}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const MapFlyTo = ({ position }: { position: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.panTo(position, { animate: true, duration: 0.5 });
  }, [position, map]);
  return null;
};

export const VehicleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'telemetry' | 'maintenance' | 'jobs'>('overview');
  const [historyRange, setHistoryRange] = useState<24 | 48 | 72>(24);
  
  // Temporal Window State (Indices within historicalData)
  const [timeWindow, setTimeWindow] = useState<[number, number]>([0, 24]); 
  
  // Replay State
  const [replayIndex, setReplayIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1);
  const playbackRef = useRef<any>(null);

  // Alert Filter State
  const [alertTypeFilter, setAlertTypeFilter] = useState<string>('all');
  const [alertSeverityFilter, setAlertSeverityFilter] = useState<string>('all');

  const { data: vehicle, isLoading } = useQuery({
    queryKey: ['vehicle', id],
    queryFn: async () => MOCK_VEHICLES.find(v => v.id === id),
  });

  const historicalData = useMemo(() => generateHistory(72, vehicle?.lastLat, vehicle?.lastLng), [vehicle]);
  
  // Derived data based on history range selector
  const rangeBaseData = useMemo(() => historicalData.slice(-historyRange), [historicalData, historyRange]);

  // Handle auto-reset of time window when range changes
  useEffect(() => {
    setTimeWindow([0, rangeBaseData.length - 1]);
    setReplayIndex(null);
    setIsPlaying(false);
  }, [rangeBaseData.length]);

  // Data actually displayed in charts and map (The 'Selected Time Range')
  const currentViewData = useMemo(() => {
    return rangeBaseData.slice(timeWindow[0], timeWindow[1] + 1);
  }, [rangeBaseData, timeWindow]);

  // Handle Playback Logic
  useEffect(() => {
    if (isPlaying && replayIndex !== null) {
      playbackRef.current = setInterval(() => {
        setReplayIndex(prev => {
          if (prev === null || prev >= currentViewData.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000 / playSpeed);
    } else {
      if (playbackRef.current) clearInterval(playbackRef.current);
    }
    return () => { if (playbackRef.current) clearInterval(playbackRef.current); };
  }, [isPlaying, playSpeed, currentViewData.length]);

  const replayPoint = useMemo(() => 
    replayIndex !== null ? currentViewData[replayIndex] : null, 
  [replayIndex, currentViewData]);

  const timelineEvents = useMemo(() => {
    // Show events up to current replay position, or all in window if no replay active
    const source = replayIndex !== null ? currentViewData.slice(0, replayIndex + 1) : currentViewData;
    return source.slice().reverse().filter(d => d.event || (Math.random() > 0.90)).map((d) => {
        if (d.event) return { ...d, type: 'alert', label: d.event, icon: AlertOctagon, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950/30' };
        if (d.speed > 0) return { ...d, type: 'status', label: 'In Transit', icon: MapPin, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30' };
        return { ...d, type: 'packet', label: 'Idle Heartbeat', icon: Activity, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' };
    }).slice(0, 30);
  }, [currentViewData, replayIndex]);

  const allPossibleAlerts = useMemo(() => {
    const source = replayIndex !== null ? currentViewData.slice(0, replayIndex + 1) : currentViewData;
    return source.filter(d => d.event).map(d => ({
        id: `alert-${d.timestamp}`,
        message: d.event!,
        severity: d.event === 'High Temp Alert' ? 'high' : 'medium',
        timestamp: d.timestamp,
        timeLabel: d.displayTime
    })).reverse();
  }, [currentViewData, replayIndex]);

  const uniqueAlertTypes = useMemo(() => {
    const types = new Set<string>();
    rangeBaseData.forEach(d => { if (d.event) types.add(d.event); });
    return Array.from(types);
  }, [rangeBaseData]);

  const filteredAlerts = useMemo(() => {
    return allPossibleAlerts.filter(alert => {
      const typeMatch = alertTypeFilter === 'all' || alert.message === alertTypeFilter;
      const severityMatch = alertSeverityFilter === 'all' || alert.severity === alertSeverityFilter;
      return typeMatch && severityMatch;
    });
  }, [allPossibleAlerts, alertTypeFilter, alertSeverityFilter]);

  if (isLoading) {
    return (
      <div className="h-[60vh] w-full flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Syncing Asset Node...</p>
      </div>
    );
  }

  if (!vehicle) return null;

  const displayState = replayPoint || currentViewData[currentViewData.length-1];
  const currentPos: [number, number] = [displayState.lat, displayState.lng];
  const pathCoords = currentViewData.map(d => [d.lat, d.lng] as [number, number]);

  const togglePlayback = () => {
    if (replayIndex === null) setReplayIndex(0);
    setIsPlaying(!isPlaying);
  };

  const stopPlayback = () => {
    setIsPlaying(false);
    setReplayIndex(null);
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
        <div className="flex items-center gap-6 relative z-10">
          <Link to="/app/vehicles" className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl text-slate-400 hover:text-blue-600 transition-all border border-slate-100 dark:border-slate-700 shrink-0">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-5">
             <div className="w-16 h-16 rounded-3xl bg-blue-600 flex items-center justify-center text-white font-black text-2xl shadow-2xl shadow-blue-500/20">
                {vehicle.make?.substring(0, 2).toUpperCase()}
             </div>
             <div>
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-widest leading-none mb-2">{vehicle.name}</h1>
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border-2 shadow-sm flex items-center gap-2 ${
                    vehicle.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400' : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400'
                  }`}>
                      {displayState.ignition && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></div>}
                      {displayState.ignition ? 'ACTIVE' : 'IDLE'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono font-black uppercase tracking-widest">VIN: {vehicle.vin}</span>
                </div>
             </div>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto relative z-10">
           <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-slate-950 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95"><Settings size={16}/> Config</button>
           <button className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 hover:text-blue-600 transition-all"><Share2 size={20}/></button>
        </div>
        <Activity className="absolute -right-10 -bottom-10 text-slate-100 dark:text-slate-800 opacity-20" size={240} />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-t-[2.5rem] px-6 overflow-x-auto shrink-0 custom-scrollbar">
          {[
            { id: 'overview', label: 'Mission Overview', icon: Activity },
            { id: 'telemetry', label: 'Detailed Telemetry', icon: LineIcon },
            { id: 'timeline', label: 'Operational Ledger', icon: Timer },
            { id: 'maintenance', label: 'Service Log', icon: Wrench },
          ].map(t => (
            <button 
              key={t.id} 
              onClick={() => setActiveTab(t.id as any)} 
              className={`flex items-center gap-2 px-6 py-5 font-black text-[10px] uppercase tracking-widest border-b-4 transition-all whitespace-nowrap ${activeTab === t.id ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
                <t.icon size={16}/> {t.label}
            </button>
          ))}
      </div>

      <div className="animate-in fade-in duration-500">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             <div className="lg:col-span-2 space-y-6">
                {/* Real-time State Banner */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                   <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:border-blue-500/30 transition-all">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Ops Hours</p>
                      <h4 className="text-3xl font-black text-slate-900 dark:text-white tabular-nums tracking-tighter">{displayState.engineHours}h</h4>
                      <div className="mt-4 flex items-center gap-2 text-[9px] font-black text-emerald-600 uppercase">
                         <div className="w-1 h-3 bg-emerald-500 rounded-full"></div> Accumulated
                      </div>
                   </div>
                   <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Energy</p>
                      <h4 className={`text-3xl font-black tabular-nums tracking-tighter ${displayState.fuel < 20 ? 'text-red-600 animate-pulse' : 'text-slate-900 dark:text-white'}`}>{displayState.fuel}%</h4>
                      <div className="mt-4 flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase">
                         <Battery size={12} className="text-orange-500" /> {vehicle.fuelType}
                      </div>
                   </div>
                   <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Velocity</p>
                      <h4 className="text-3xl font-black text-slate-900 dark:text-white tabular-nums tracking-tighter">{displayState.speed} <span className="text-xs opacity-40">KM/H</span></h4>
                      <div className="mt-4 flex items-center gap-2 text-[9px] font-black text-blue-600 uppercase">
                         <Zap size={12} /> {displayState.ignition ? 'Engine On' : 'Stationary'}
                      </div>
                   </div>
                </div>

                {/* Vitals Overview Chart (Key Telemetry visualization) */}
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                   <div className="flex items-center justify-between mb-8">
                      <div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                          <Activity size={20} className="text-blue-600" /> Vitals Correlation
                        </h3>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1 italic">Mapping Energy Efficiency vs Operational Hours</p>
                      </div>
                      <div className="flex items-center gap-4">
                         <div className="flex items-center gap-2">
                           <div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div>
                           <span className="text-[9px] font-black text-slate-400 uppercase">Fuel (%)</span>
                         </div>
                         <div className="flex items-center gap-2">
                           <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>
                           <span className="text-[9px] font-black text-slate-400 uppercase">Hours (h)</span>
                         </div>
                      </div>
                   </div>
                   <div className="h-[250px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={currentViewData}>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.05} />
                           <XAxis 
                              dataKey="displayTime" 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} 
                              minTickGap={30}
                           />
                           <YAxis 
                              yAxisId="left" 
                              domain={[0, 100]} 
                              hide 
                           />
                           <YAxis 
                              yAxisId="right" 
                              orientation="right" 
                              domain={['dataMin - 1', 'dataMax + 1']} 
                              hide 
                           />
                           <Tooltip content={<CustomTooltip />} />
                           <Area 
                              yAxisId="left"
                              type="monotone" 
                              dataKey="fuel" 
                              name="Fuel Level" 
                              stroke="#f97316" 
                              strokeWidth={3} 
                              fill="url(#fuelGradient)" 
                              fillOpacity={1} 
                           />
                           <Line 
                              yAxisId="right"
                              type="monotone" 
                              dataKey="engineHours" 
                              name="Engine Hours" 
                              stroke="#2563eb" 
                              strokeWidth={3} 
                              dot={false}
                              activeDot={{ r: 6, strokeWidth: 0 }}
                           />
                           <defs>
                              <linearGradient id="fuelGradient" x1="0" y1="0" x2="0" y2="1">
                                 <stop offset="5%" stopColor="#f97316" stopOpacity={0.2}/>
                                 <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                              </linearGradient>
                           </defs>
                           {replayPoint && (
                             <ReferenceLine x={replayPoint.displayTime} stroke="#10b981" strokeWidth={2} strokeDasharray="3 3" />
                           )}
                        </ComposedChart>
                      </ResponsiveContainer>
                   </div>
                </div>

                {/* --- TEMPORAL WINDOW & REPLAY INTERFACE --- */}
                <div className="bg-slate-50 dark:bg-slate-950 p-1 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-inner overflow-hidden">
                   <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.2rem] shadow-sm border border-slate-100 dark:border-slate-800">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-10">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-500/20">
                                <History size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Mission Replay Control</h3>
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Temporal scrubbing & playback synchronization</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                             <div className="flex bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-slate-100 dark:border-slate-800 shrink-0">
                                {[24, 48, 72].map(h => (
                                  <button key={h} onClick={() => setHistoryRange(h as any)} className={`px-4 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${historyRange === h ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>{h}H</button>
                                ))}
                             </div>
                             <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                                {[1, 2, 4, 8].map(s => (
                                  <button key={s} onClick={() => setPlaySpeed(s)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${playSpeed === s ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>{s}x</button>
                                ))}
                             </div>
                          </div>
                      </div>

                      <div className="space-y-12">
                         {/* Mission Window Slider */}
                         <div className="space-y-4">
                            <div className="flex items-center justify-between ml-1">
                               <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                  <Scissors size={12} className="text-blue-500" /> Define Mission Window
                               </label>
                               <span className="text-[10px] font-mono text-slate-500 font-bold">
                                  {rangeBaseData[timeWindow[0]].dateLabel} {rangeBaseData[timeWindow[0]].displayTime} — {rangeBaseData[timeWindow[1]].dateLabel} {rangeBaseData[timeWindow[1]].displayTime}
                               </span>
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                               <input 
                                  type="range" min="0" max={rangeBaseData.length - 2} 
                                  value={timeWindow[0]} 
                                  onChange={e => {
                                    const val = parseInt(e.target.value);
                                    setTimeWindow([val, Math.max(val + 1, timeWindow[1])]);
                                  }}
                                  className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-blue-600"
                               />
                               <input 
                                  type="range" min="1" max={rangeBaseData.length - 1} 
                                  value={timeWindow[1]} 
                                  onChange={e => {
                                    const val = parseInt(e.target.value);
                                    setTimeWindow([Math.min(val - 1, timeWindow[0]), val]);
                                  }}
                                  className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-blue-600"
                               />
                            </div>
                         </div>

                         {/* Replay Scrubbing Slider */}
                         <div className="relative pt-6 border-t border-slate-50 dark:border-slate-800">
                            <div className="flex items-center justify-between mb-4">
                               <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                  <Timer size={12} className="text-emerald-500" /> Playhead Navigation
                               </label>
                               <div className="px-5 py-2 bg-slate-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl border border-slate-800 animate-in zoom-in duration-300">
                                 {replayPoint ? `${replayPoint.dateLabel} @ ${replayPoint.displayTime}` : 'SESSION END'}
                               </div>
                            </div>
                            <input 
                               type="range" 
                               min="0" 
                               max={currentViewData.length - 1} 
                               value={replayIndex ?? currentViewData.length - 1}
                               onChange={(e) => {
                                 setReplayIndex(parseInt(e.target.value));
                                 setIsPlaying(false);
                               }}
                               className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-emerald-500"
                            />
                         </div>

                         {/* Playback Controls */}
                         <div className="flex items-center justify-center gap-6">
                            <button onClick={() => setReplayIndex(Math.max(0, (replayIndex ?? 0) - 5))} className="p-4 text-slate-400 hover:text-blue-600 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-all"><SkipBack size={24}/></button>
                            <button 
                               onClick={togglePlayback}
                               className={`w-20 h-20 rounded-[2rem] flex items-center justify-center shadow-2xl transition-all hover:scale-105 active:scale-95 ${isPlaying ? 'bg-slate-900 text-white shadow-slate-500/20' : 'bg-blue-600 text-white shadow-blue-500/40'}`}
                            >
                               {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                            </button>
                            <button onClick={() => setReplayIndex(Math.min(currentViewData.length - 1, (replayIndex ?? 0) + 5))} className="p-4 text-slate-400 hover:text-blue-600 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-all"><SkipForward size={24}/></button>
                            <div className="w-px h-12 bg-slate-100 dark:bg-slate-800 mx-4"></div>
                            <button onClick={stopPlayback} className="p-4 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-2xl transition-all"><Square size={24}/></button>
                         </div>
                      </div>
                   </div>
                </div>

                {/* Map Display */}
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden h-[500px] relative group">
                   <div className="absolute top-4 left-4 z-[1000] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl pointer-events-none transition-opacity">
                      <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2"><MapIcon size={14} className="text-blue-600" /> Mission Trace Visualization</p>
                   </div>
                   
                   <MapContainer center={currentPos} zoom={14} style={{ height: '100%', width: '100%' }}>
                     <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                     <Polyline 
                        positions={pathCoords} 
                        pathOptions={{ color: '#3b82f6', weight: 4, opacity: 0.15, dashArray: '8, 8' }} 
                     />
                     <Polyline 
                        positions={pathCoords.slice(0, (replayIndex ?? currentViewData.length - 1) + 1)} 
                        pathOptions={{ color: '#10b981', weight: 6, opacity: 0.8 }} 
                     />
                     <Marker position={currentPos} icon={icon}>
                        <Popup>
                           <div className="p-2 space-y-3">
                              <h4 className="font-black text-xs uppercase border-b pb-2">{vehicle.name}</h4>
                              <div className="grid grid-cols-2 gap-4">
                                 <div>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase">Velocity</p>
                                    <p className="text-xs font-black">{displayState.speed} km/h</p>
                                 </div>
                                 <div>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase">Fuel</p>
                                    <p className="text-xs font-black">{displayState.fuel}%</p>
                                 </div>
                              </div>
                           </div>
                        </Popup>
                     </Marker>
                     <MapFlyTo position={currentPos} />
                   </MapContainer>
                </div>
             </div>

             {/* Right Col - Alerts and Vital Monitoring */}
             <div className="space-y-6">
                <section className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                   <div className="flex items-center justify-between mb-8">
                      <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-sm flex items-center gap-3"><Bell size={18} className="text-red-500" /> Active Faults</h3>
                      <span className="px-2 py-0.5 rounded bg-red-50 text-red-600 text-[9px] font-black uppercase border border-red-100">{filteredAlerts.length} Issues</span>
                   </div>

                   {/* Alert Filters */}
                   <div className="flex flex-col gap-3 mb-8">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="relative">
                          <select 
                            value={alertTypeFilter} 
                            onChange={e => setAlertTypeFilter(e.target.value)}
                            className="w-full appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl pl-8 pr-8 py-2 text-[8px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 outline-none focus:ring-2 focus:ring-blue-500/20"
                          >
                            <option value="all">All Types</option>
                            {uniqueAlertTypes.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                          </select>
                          <Filter size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <ChevronDown size={10} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                        <div className="relative">
                          <select 
                            value={alertSeverityFilter} 
                            onChange={e => setAlertSeverityFilter(e.target.value)}
                            className="w-full appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl pl-8 pr-8 py-2 text-[8px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 outline-none focus:ring-2 focus:ring-blue-500/20"
                          >
                            <option value="all">Severity</option>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                          </select>
                          <Shield size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <ChevronDown size={10} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                      </div>
                   </div>

                   <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                      {filteredAlerts.length === 0 ? (
                        <div className="text-center py-10 opacity-30 italic text-xs uppercase tracking-widest font-black">
                          {allPossibleAlerts.length === 0 ? 'Zero Active Faults' : 'No matches found'}
                        </div>
                      ) : (
                        filteredAlerts.map(alert => (
                          <div key={alert.id} className={`p-4 rounded-2xl border-l-4 shadow-sm animate-in slide-in-from-right ${alert.severity === 'high' ? 'bg-red-50 dark:bg-red-950/20 border-red-500' : 'bg-orange-50 dark:bg-orange-950/20 border-orange-500'}`}>
                             <div className="flex justify-between items-start gap-4">
                                <div className="min-w-0">
                                   <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">{alert.message}</p>
                                   <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Logged: {alert.timeLabel}</p>
                                </div>
                                <ShieldAlert size={16} className={alert.severity === 'high' ? 'text-red-600' : 'text-orange-600'} />
                             </div>
                          </div>
                        ))
                      )}
                   </div>
                </section>

                {/* Subsystem Monitoring */}
                <section className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                   <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-sm mb-8 flex items-center gap-3"><Activity size={18} className="text-blue-600" /> Vital Sensors</h3>
                   <div className="space-y-6">
                      {[
                        { label: 'Core Temperature', val: displayState.temp, max: 250, unit: '°F', color: displayState.temp > 210 ? 'bg-red-500' : 'bg-emerald-500' },
                        { label: 'Engine RPM', val: displayState.rpm, max: 3000, unit: '', color: 'bg-blue-500' },
                        { label: 'Transmission', val: 92, max: 100, unit: '%', color: 'bg-emerald-500' },
                      ].map(m => (
                        <div key={m.label} className="space-y-2">
                           <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                              <span className="text-slate-400">{m.label}</span>
                              <span className={m.color.includes('red') ? 'text-red-600 animate-pulse' : 'text-slate-900 dark:text-white'}>{m.val}{m.unit}</span>
                           </div>
                           <div className="h-1.5 w-full bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                              <div className={`h-full ${m.color} rounded-full transition-all duration-500`} style={{ width: `${(m.val/m.max)*100}%` }}></div>
                           </div>
                        </div>
                      ))}
                   </div>
                </section>
             </div>
          </div>
        )}

        {activeTab === 'telemetry' && (
          <div className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm">
             <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
                <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-widest">Temporal Analysis Node</h3>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Window: {rangeBaseData[timeWindow[0]].displayTime} — {rangeBaseData[timeWindow[1]].displayTime}</p>
                </div>
                <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-950 px-6 py-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-inner">
                    <div className="text-center px-4 border-r border-slate-200 dark:border-slate-700">
                        <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Peak Temp</p>
                        <p className="text-sm font-black text-red-500">{Math.max(...currentViewData.map(d => d.temp))}°F</p>
                    </div>
                    <div className="text-center px-4">
                        <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Max Speed</p>
                        <p className="text-sm font-black text-blue-600">{Math.max(...currentViewData.map(d => d.speed))} km/h</p>
                    </div>
                </div>
             </div>

             <div className="space-y-16">
                <div className="h-[250px] w-full">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Battery size={14} className="text-orange-500" /> Energy Drain Ratio (%)</p>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={currentViewData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.05} />
                      <XAxis dataKey="displayTime" hide />
                      <YAxis domain={[0, 100]} hide />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="fuel" name="Fuel Level" stroke="#f97316" strokeWidth={3} fill="#f97316" fillOpacity={0.1} />
                      {replayPoint && <ReferenceLine x={replayPoint.displayTime} stroke="#10b981" strokeWidth={2} strokeDasharray="3 3" />}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                   <div className="h-[250px]">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Orbit size={14} className="text-purple-500" /> Engine RPM Dynamics</p>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={currentViewData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.05} />
                          <XAxis dataKey="displayTime" hide />
                          <YAxis hide domain={[0, 3500]} />
                          <Tooltip content={<CustomTooltip />} />
                          <Line type="monotone" dataKey="rpm" name="Engine RPM" stroke="#a855f7" strokeWidth={2} dot={false} />
                          {replayPoint && <ReferenceLine x={replayPoint.displayTime} stroke="#10b981" strokeWidth={2} strokeDasharray="3 3" />}
                        </LineChart>
                      </ResponsiveContainer>
                   </div>
                   <div className="h-[250px]">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Thermometer size={14} className="text-red-500" /> Thermal State (°F)</p>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={currentViewData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.05} />
                          <XAxis dataKey="displayTime" hide />
                          <YAxis hide domain={[0, 250]} />
                          <Tooltip content={<CustomTooltip />} />
                          <Area type="monotone" dataKey="temp" name="Core Temp" stroke="#ef4444" strokeWidth={2} fill="#ef4444" fillOpacity={0.05} />
                          {replayPoint && <ReferenceLine x={replayPoint.displayTime} stroke="#10b981" strokeWidth={2} strokeDasharray="3 3" />}
                        </AreaChart>
                      </ResponsiveContainer>
                   </div>
                </div>

                <div className="h-[250px] w-full">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Zap size={14} className="text-blue-500" /> Operational Velocity (KM/H)</p>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={currentViewData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.05} />
                      <XAxis dataKey="displayTime" hide />
                      <YAxis hide />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="stepAfter" dataKey="speed" name="Ground Speed" stroke="#3b82f6" strokeWidth={2} fill="#3b82f6" fillOpacity={0.05} />
                      {replayPoint && <ReferenceLine x={replayPoint.displayTime} stroke="#10b981" strokeWidth={2} strokeDasharray="3 3" />}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="max-w-4xl mx-auto py-8 space-y-12">
             <div className="relative space-y-10">
                <div className="absolute left-6 top-2 bottom-2 w-1 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
                {timelineEvents.map((event, idx) => (
                    <div key={idx} className="relative pl-20 group animate-in slide-in-from-left duration-500" style={{ animationDelay: `${idx * 20}ms` }}>
                        <div className={`absolute left-0 top-0 w-12 h-12 rounded-2xl ${event.bg} border-4 border-white dark:border-slate-900 flex items-center justify-center z-10 shadow-2xl group-hover:scale-110 transition-all`}>
                           <event.icon size={20} className={event.color} />
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:border-blue-500/50 transition-all">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                               <div className="flex items-center gap-3">
                                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg border shadow-sm ${
                                    event.type === 'alert' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                                  }`}>{event.type}</span>
                                  <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-tight">{event.label}</h4>
                               </div>
                               <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">{event.dateLabel} @ {event.displayTime}</span>
                            </div>
                            <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-50 dark:border-slate-800">
                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                                    <Zap size={12} className="text-blue-500" /> {event.speed} km/h
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                                    <Battery size={12} className="text-orange-500" /> {event.fuel}%
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                                    <Orbit size={12} className="text-purple-500" /> {event.rpm} RPM
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                                    <Thermometer size={12} className="text-red-500" /> {event.temp}°F
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
             </div>
          </div>
        )}
        
        {activeTab === 'maintenance' && (
           <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden p-20 text-center flex flex-col items-center justify-center space-y-6">
              <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center text-slate-300">
                 <Wrench size={40} />
              </div>
              <p className="text-slate-400 font-black uppercase tracking-[0.4em]">Service Registry Sealed</p>
              <p className="text-xs text-slate-500 max-w-xs font-medium italic">No immediate preventative maintenance scheduled within the next operational cycle.</p>
           </div>
        )}
      </div>
    </div>
  );
};
