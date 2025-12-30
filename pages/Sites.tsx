
import React, { useState, useMemo } from 'react';
import { 
  MapPin, Plus, Search, Filter, Download, MoreVertical, 
  ArrowUpRight, AlertTriangle, CheckCircle2, ShieldAlert,
  Loader2, Info, LayoutGrid, Users, Truck, Zap
} from 'lucide-react';
import { MOCK_SITES } from '../constants.ts';
import { Site } from '../types.ts';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

export const Sites = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sites, setSites] = useState<Site[]>(MOCK_SITES);

  const filteredSites = useMemo(() => {
    return sites.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.managerName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [sites, searchTerm]);

  const handleExport = () => {
    if (filteredSites.length === 0) return toast.error('Registry is empty');
    
    const exportData = filteredSites.map(s => ({
      'Site ID': s.id,
      'Zone Designation': s.name,
      'Geographic Location': s.location,
      'Lead Manager': s.managerName,
      'Active Asset Load': s.activeAssets,
      'Risk Classification': s.riskLevel.toUpperCase(),
      'Operational Status': s.status.toUpperCase()
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Logistic Zones");
    XLSX.writeFile(wb, `FleetOps_Sites_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Logistic Registry exported');
  };

  const getRiskStyle = (level: string) => {
    switch(level) {
      case 'high': return 'bg-red-50 text-red-700 border-red-100 dark:bg-red-950/20 dark:text-red-400';
      case 'medium': return 'bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-950/20 dark:text-orange-400';
      default: return 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400';
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
           <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter flex items-center gap-4 leading-none">
              <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-xl">
                <MapPin size={24} />
              </div>
              Logistic Zones
           </h2>
           <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium italic uppercase tracking-wider">Organizational work zones and staging sectors.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <button 
                onClick={handleExport}
                className="flex items-center gap-2 px-6 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white rounded-xl font-black hover:bg-slate-50 shadow-sm transition-all uppercase text-[10px] tracking-widest active:scale-95"
            >
                <Download size={18} /> Export Registry
            </button>
            <button className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-black hover:bg-blue-700 shadow-xl transition-all uppercase text-[10px] tracking-widest active:scale-95">
                <Plus size={18} /> Define Sector
            </button>
        </div>
      </div>

      {/* Filter Console */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row gap-4 items-center justify-between shrink-0">
        <div className="relative w-full lg:max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search Designation, Manager or Geographic node..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white transition-all shadow-inner"
          />
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse font-sans min-w-[1000px]">
                <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <th className="px-8 py-5">Zone Designation</th>
                        <th className="px-8 py-5">Geographic Location</th>
                        <th className="px-8 py-5">Lead Manager</th>
                        <th className="px-8 py-5">Asset Load</th>
                        <th className="px-8 py-5">Risk Matrix</th>
                        <th className="px-8 py-5">Status Registry</th>
                        <th className="px-8 py-5 text-right">Ops</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredSites.map((site) => (
                        <tr key={site.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group">
                            <td className="px-8 py-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center font-black shadow-inner shrink-0 group-hover:scale-110 transition-transform">
                                        <MapPin size={18} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-1.5">{site.name}</p>
                                        <p className="text-[9px] text-slate-400 font-bold uppercase">ID: {site.id}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="px-8 py-6">
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-tight">{site.location}</span>
                            </td>
                            <td className="px-8 py-6">
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-white">
                                    <Users size={14} className="text-blue-500" /> {site.managerName}
                                </div>
                            </td>
                            <td className="px-8 py-6">
                                <div className="flex items-center gap-2 text-xs font-mono font-black text-slate-900 dark:text-white">
                                    <Truck size={14} className="text-slate-400" /> {site.activeAssets}
                                </div>
                            </td>
                            <td className="px-8 py-6">
                                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border-2 shadow-sm ${getRiskStyle(site.riskLevel)}`}>
                                    {site.riskLevel}
                                </span>
                            </td>
                            <td className="px-8 py-6">
                                <div className="flex items-center gap-2">
                                    <div className={`w-1.5 h-1.5 rounded-full ${site.status === 'operational' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{site.status}</span>
                                </div>
                            </td>
                            <td className="px-8 py-6 text-right">
                                <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><ArrowUpRight size={18} /></button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};
