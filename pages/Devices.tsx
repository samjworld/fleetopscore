
import React, { useState } from 'react';
import { Box, Wifi, WifiOff, Battery, BatteryCharging, Signal, RefreshCw, Plus, Search, MoreHorizontal, Radio } from 'lucide-react';
import { Device } from '../types.ts';

const MOCK_DEVICES: Device[] = [
    { id: 'dev_01', serialNumber: 'OBD-X9001', apiKey: '***', status: 'active', lastHeartbeat: new Date().toISOString() } as Device,
    { id: 'dev_02', serialNumber: 'OBD-X9002', apiKey: '***', status: 'active', lastHeartbeat: new Date(Date.now() - 60000).toISOString() } as Device,
    { id: 'dev_03', serialNumber: 'GPS-HARD-55', apiKey: '***', status: 'offline', lastHeartbeat: new Date(Date.now() - 86400000).toISOString() } as Device,
    { id: 'dev_04', serialNumber: 'OBD-X9005', apiKey: '***', status: 'active', lastHeartbeat: new Date().toISOString() } as Device,
    { id: 'dev_05', serialNumber: 'TEMP-SENS-01', apiKey: '***', status: 'active', lastHeartbeat: new Date().toISOString() } as Device,
];

export const Devices = () => {
  return (
    <div className="space-y-6 pb-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
           <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">IoT Terminals</h2>
           <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Manage global sensor network and asset telemetry nodes.</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-500/30 transition-all active:scale-95">
            <Plus size={18} /> Provision Terminal
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center gap-4">
         <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder="Search UUID, IMEI or API Key..." className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 dark:text-white transition-all shadow-inner" />
         </div>
         <div className="relative w-full md:w-auto">
             <select className="w-full md:w-auto appearance-none pl-5 pr-12 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer">
                <option>Global Status</option>
                <option>Online Nodes</option>
                <option>Offline Nodes</option>
             </select>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {MOCK_DEVICES.map(dev => (
            <div key={dev.id} className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden hover:shadow-2xl hover:border-blue-500 transition-all group relative">
                <div className="p-8">
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-4 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-2xl shadow-inner group-hover:scale-110 transition-transform duration-500">
                            <Box size={24} />
                        </div>
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border-2 shadow-sm ${
                            dev.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50' : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                        }`}>
                            {dev.status === 'active' ? <Wifi size={12} className="animate-pulse" /> : <WifiOff size={12} />}
                            <span>{dev.status}</span>
                        </div>
                    </div>
                    
                    <h3 className="font-black text-slate-900 dark:text-white text-lg tracking-tight uppercase mb-1">{dev.serialNumber}</h3>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono font-bold mb-6">TERMINAL_ID: {dev.id}</p>

                    <div className="grid grid-cols-2 gap-3 text-[10px] font-black text-slate-600 dark:text-slate-300 mb-6">
                        <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center gap-3 shadow-inner">
                            <Battery size={14} className="text-emerald-500" /> 98%
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center gap-3 shadow-inner">
                            <Signal size={14} className="text-blue-500" /> STRONG
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <span className="flex items-center gap-2"><RefreshCw size={12} className="text-blue-500" /> {dev.lastHeartbeat ? new Date(dev.lastHeartbeat).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</span>
                        <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"><MoreHorizontal size={18} /></button>
                    </div>
                </div>
            </div>
        ))}

        {/* Add New Placeholder */}
        <button className="border-4 border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem] p-8 flex flex-col items-center justify-center text-slate-300 dark:text-slate-700 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all min-h-[300px] group">
            <div className="w-16 h-16 rounded-[1.5rem] bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">
                <Plus size={32} />
            </div>
            <span className="font-black text-xs uppercase tracking-[0.2em] group-hover:text-blue-600">Register Node</span>
        </button>
      </div>
    </div>
  );
};
