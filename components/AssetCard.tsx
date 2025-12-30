
import React from 'react';
import { Truck, Gauge, Battery, ChevronRight, Activity, Wifi, WifiOff } from 'lucide-react';
import { Vehicle } from '../types.ts';

interface AssetCardProps {
  vehicle: Vehicle;
  onClick: (id: string) => void;
}

/**
 * Memoized Asset Card Component
 * Only re-renders if core telemetry or status attributes change.
 */
export const AssetCard = React.memo(({ vehicle, onClick }: AssetCardProps) => {
  const isCriticalFuel = vehicle.fuelLevel < 20;
  const isOffline = vehicle.status === 'offline';

  return (
    <div 
      onClick={() => onClick(vehicle.id)}
      className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden hover:shadow-xl dark:hover:shadow-blue-500/5 hover:border-blue-500 transition-all cursor-pointer group relative flex flex-col animate-in fade-in slide-in-from-bottom-2"
    >
      <div className="p-7 flex-1">
        <div className="flex justify-between items-start mb-6 gap-3">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-900 dark:text-white font-black text-lg border border-slate-100 dark:border-slate-800 shadow-inner group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0">
              {vehicle.make?.substring(0, 2).toUpperCase() || 'EQ'}
            </div>
            <div className="min-w-0">
              <h3 className="font-black text-slate-900 dark:text-white text-lg group-hover:text-blue-600 transition-colors tracking-tighter uppercase leading-none truncate text-left">
                {vehicle.name}
              </h3>
              <p className="text-[10px] text-slate-400 font-mono font-black tracking-widest uppercase mt-2 truncate text-left opacity-60">
                {vehicle.make} {vehicle.model}
              </p>
            </div>
          </div>
          <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border shadow-sm shrink-0 ${
            vehicle.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30' : 
            vehicle.status === 'maintenance' ? 'bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900/30' : 
            vehicle.status === 'idle' ? 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-orange-900/30' :
            'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
          }`}>
            {vehicle.status}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-inner group-hover:border-slate-200 dark:group-hover:border-slate-700 transition-all">
            <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
              <Gauge size={14} className="text-blue-500" /> Runtime
            </div>
            <div className="font-black text-slate-900 dark:text-white text-lg tracking-tighter text-left tabular-nums">
              {Number(vehicle.engineHours || 0).toLocaleString()} <span className="text-[10px] opacity-40">H</span>
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-inner group-hover:border-slate-200 dark:group-hover:border-slate-700 transition-all">
            <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
              <Battery size={14} className={isCriticalFuel ? 'text-red-500 animate-pulse' : 'text-emerald-500'} /> Energy
            </div>
            <div className={`font-black text-lg tracking-tighter text-left tabular-nums ${isCriticalFuel ? 'text-red-600' : 'text-slate-900 dark:text-white'}`}>
              {vehicle.fuelLevel || 0}%
            </div>
          </div>
        </div>
      </div>

      <div className="px-7 py-5 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`w-2.5 h-2.5 rounded-full ${isOffline ? 'bg-slate-400' : 'bg-emerald-500 animate-pulse'}`}></div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">
            {isOffline ? 'Link Terminated' : 'Satellite Link Active'}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest group-hover:translate-x-1 transition-transform">
          Mission Terminal <ChevronRight size={16} />
        </div>
      </div>
    </div>
  );
}, (prev, next) => {
  // Deep equality check: Only re-render if visual or critical telemetry properties change
  return (
    prev.vehicle.id === next.vehicle.id &&
    prev.vehicle.status === next.vehicle.status &&
    prev.vehicle.fuelLevel === next.vehicle.fuelLevel &&
    prev.vehicle.engineHours === next.vehicle.engineHours &&
    prev.vehicle.lastLat === next.vehicle.lastLat &&
    prev.vehicle.lastLng === next.vehicle.lastLng
  );
});
