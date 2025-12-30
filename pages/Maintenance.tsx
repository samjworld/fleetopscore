
import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Wrench, Calendar, CheckCircle, AlertCircle, Clock, Plus, 
  Search, Filter, ChevronRight, Activity, Loader2, ChevronLeft,
  X, Truck, DollarSign, ClipboardList, Info, RotateCcw,
  Download, Settings2, Barcode, Gauge, History, MoreVertical,
  Check, FileText, TrendingUp, ChevronDown
} from 'lucide-react';
import { MaintenanceRecord, MaintenanceType } from '../types.ts';
import { MOCK_MAINTENANCE_RECORDS, MOCK_VEHICLES } from '../constants.ts';
import toast from 'react-hot-toast';

export const Maintenance = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1');
  const statusFilter = searchParams.get('status') || 'all';
  const searchTerm = searchParams.get('search') || '';
  const limit = 10;

  // Persistence layer for local session
  const [records, setRecords] = useState<MaintenanceRecord[]>(() => {
    const saved = localStorage.getItem('fleetops_maintenance');
    return saved ? JSON.parse(saved) : MOCK_MAINTENANCE_RECORDS;
  });

  useEffect(() => {
    localStorage.setItem('fleetops_maintenance', JSON.stringify(records));
  }, [records]);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    machineId: '',
    type: MaintenanceType.PREVENTATIVE,
    scheduledDate: new Date().toISOString().split('T')[0],
    costParts: 0,
    costLabor: 0,
    engineHoursAtService: 0
  });

  // Filter and Pagination Logic
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
      const vehicle = MOCK_VEHICLES.find(v => v.id === r.machineId);
      const matchesSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            r.machineId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (vehicle?.name.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesStatus && matchesSearch;
    });
  }, [records, statusFilter, searchTerm]);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredRecords.slice(start, start + limit);
  }, [filteredRecords, page]);

  const totalPages = Math.ceil(filteredRecords.length / limit) || 1;

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    const taskToAdd: MaintenanceRecord = {
      ...newTask,
      id: `m-${Date.now()}`,
      status: 'scheduled',
      checklist: [],
      tenantId: 'mock-tenant-1',
      version: 1,
      createdBy: 'system',
      updatedBy: 'system',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setRecords(prev => [taskToAdd, ...prev]);
    setIsAddModalOpen(false);
    toast.success('Service Mission Scheduled');
  };

  const setPage = (p: number) => {
    setSearchParams(prev => { prev.set('page', p.toString()); return prev; });
  };

  const setFilter = (s: string) => {
    setSearchParams(prev => { 
        prev.set('status', s); 
        prev.set('page', '1'); 
        return prev; 
    });
  };

  const handleSearch = (val: string) => {
    setSearchParams(prev => {
      if (val) prev.set('search', val);
      else prev.delete('search');
      prev.set('page', '1');
      return prev;
    });
  };

  return (
    <div className="space-y-6 md:space-y-8 pb-12 animate-in fade-in duration-500 px-1 sm:px-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
           <div className="flex items-center gap-3 mb-1">
             <div className="p-2 bg-blue-600 text-white rounded-xl shadow-lg">
               <Wrench size={20} />
             </div>
             <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none font-display">Maintenance Command</h2>
           </div>
           <p className="text-[11px] md:text-sm text-slate-500 dark:text-slate-400 font-medium">Predictive lifecycle management and asset health terminals.</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
            <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 active:scale-95 shadow-sm transition-all"><Download size={16} /> Audit Export</button>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-500/30 active:scale-95 transition-all"
            >
                <Plus size={16} /> Schedule Mission
            </button>
        </div>
      </div>

      {/* KPI Section */}
      <div className="flex flex-nowrap overflow-x-auto gap-4 md:gap-6 pb-4 custom-scrollbar shrink-0">
        <div className="flex-1 min-w-[240px] bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 relative overflow-hidden group">
           <div className="relative z-10 flex justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Compliance Rate</p>
                <h3 className="text-3xl font-black text-emerald-600 tracking-tight">94.2%</h3>
                <p className="text-xs mt-2 font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><TrendingUp size={14} className="text-emerald-500" /> Above Target</p>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 shadow-inner group-hover:scale-110 transition-transform duration-500"><CheckCircle size={24} /></div>
           </div>
        </div>
        <div className="flex-1 min-w-[240px] bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 relative overflow-hidden group">
           <div className="relative z-10 flex justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Active Backlog</p>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{records.filter(r => r.status !== 'completed').length}</h3>
                <p className="text-xs mt-2 font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><Clock size={14} /> Critical Tasks First</p>
              </div>
              <div className="p-4 rounded-2xl bg-orange-50 dark:bg-orange-900/20 text-orange-600 shadow-inner group-hover:scale-110 transition-transform duration-500"><AlertCircle size={24} /></div>
           </div>
        </div>
        <div className="flex-1 min-w-[240px] bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 relative overflow-hidden group">
           <div className="relative z-10 flex justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Monthly Cost (Est)</p>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">${records.reduce((acc, r) => acc + r.costParts + r.costLabor, 0).toLocaleString()}</h3>
                <p className="text-xs mt-2 font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><DollarSign size={14} className="text-blue-500" /> Operational CAPEX</p>
              </div>
              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 shadow-inner group-hover:scale-110 transition-transform duration-500"><Activity size={24} /></div>
           </div>
        </div>
      </div>

      {/* Main List Console */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl md:rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
         {/* Filter Console */}
         <div className="px-4 md:px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex flex-col lg:flex-row gap-4 items-center justify-between bg-slate-50/30 dark:bg-slate-900/30">
            <div className="flex-1 flex items-center gap-3 w-full lg:max-w-xl">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input 
                      type="text" 
                      placeholder="Search Mission, ID, or Machine allocation..." 
                      value={searchTerm} 
                      onChange={(e) => handleSearch(e.target.value)}
                      className="w-full pl-11 pr-6 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all dark:text-white shadow-sm font-sans" 
                    />
                </div>
            </div>
            <div className="flex gap-2 w-full lg:w-auto overflow-x-auto custom-scrollbar pb-1 lg:pb-0">
                {['all', 'scheduled', 'in_progress', 'completed'].map(f => (
                    <button 
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border whitespace-nowrap ${
                            statusFilter === f 
                            ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20' 
                            : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-100 dark:border-slate-800 hover:border-blue-400'
                        }`}
                    >
                        {f.replace('_', ' ')}
                    </button>
                ))}
            </div>
         </div>

         {/* Rich Table View */}
         <div className="overflow-x-auto custom-scrollbar min-h-[400px]">
            <table className="min-w-[1000px] w-full text-left border-separate border-spacing-0 font-sans">
                <thead className="bg-slate-50 dark:bg-slate-900/80 sticky top-0 z-10">
                    <tr>
                        <th className="px-6 py-5 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700">Service Designation</th>
                        <th className="px-6 py-5 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700">Asset Node</th>
                        <th className="px-6 py-5 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700">Telemetry Node</th>
                        <th className="px-6 py-5 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700">Cost Profile</th>
                        <th className="px-6 py-5 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700">Registry Status</th>
                        <th className="px-6 py-5 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700 text-right">Ops</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {paginatedData.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="py-32 text-center">
                                <div className="flex flex-col items-center justify-center opacity-20">
                                    <Wrench size={80} strokeWidth={1} className="mb-4" />
                                    <p className="text-xl font-black uppercase tracking-[0.2em]">Zero Missions Detected</p>
                                </div>
                            </td>
                        </tr>
                    ) : (
                        paginatedData.map(record => {
                            const vehicle = MOCK_VEHICLES.find(v => v.id === record.machineId);
                            return (
                                <tr key={record.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-all group">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 shrink-0 shadow-inner group-hover:scale-110 transition-all ${
                                                record.status === 'scheduled' ? 'border-blue-100 text-blue-500 bg-blue-50/30' :
                                                record.status === 'in_progress' ? 'border-amber-100 text-amber-500 bg-amber-50/30 animate-pulse' :
                                                'border-emerald-100 text-emerald-500 bg-emerald-50/30'
                                            }`}>
                                                <Wrench size={20} />
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="font-black text-slate-900 dark:text-white text-sm tracking-tight uppercase truncate leading-none mb-2">{record.title}</h4>
                                                <div className="flex items-center gap-2">
                                                    <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-950 text-[8px] font-black text-slate-500 uppercase tracking-widest border border-slate-200 dark:border-slate-800">{record.type}</span>
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Calendar size={10} /> {new Date(record.scheduledDate).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-slate-700 dark:text-slate-300 font-bold flex items-center gap-1.5 truncate"><Truck size={14} className="text-blue-500 shrink-0" /> {vehicle?.name || 'Unknown Asset'}</span>
                                            <span className="text-[9px] font-mono font-bold text-slate-400 uppercase mt-1">UUID: {record.machineId}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-mono font-black text-slate-600 dark:text-slate-400 flex items-center gap-1.5"><Gauge size={14} className="text-slate-400" /> {record.engineHoursAtService.toLocaleString()}</span>
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mt-1">Accumulated Hours</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-mono font-black text-slate-900 dark:text-white">${(record.costParts + record.costLabor).toLocaleString()}</span>
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mt-1">Parts + Labor</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border-2 shadow-sm ${
                                            record.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50' :
                                            record.status === 'in_progress' ? 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400' :
                                            'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20'
                                        }`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${record.status === 'completed' ? 'bg-emerald-500' : record.status === 'in_progress' ? 'bg-amber-500 animate-pulse' : 'bg-blue-500'}`}></div>
                                            {record.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                            <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all" title="Review Checklist"><ClipboardList size={18} /></button>
                                            <button className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"><MoreVertical size={18} /></button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
         </div>

         {/* Pagination Console */}
         <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/20 dark:bg-slate-900/20">
            <button 
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="w-full sm:w-auto flex items-center justify-center gap-3 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 transition-all active:scale-95"
            >
                <ChevronLeft size={16} /> Previous
            </button>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Registry node <span className="text-slate-900 dark:text-white bg-white dark:bg-slate-800 px-4 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-inner ml-2">{page} / {totalPages}</span></span>
            <button 
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="w-full sm:w-auto flex items-center justify-center gap-3 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 transition-all active:scale-95"
            >
                Next <ChevronRight size={16} />
            </button>
         </div>
      </div>

      {/* Add Task Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[2000] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in duration-200">
                <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/50">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-xl"><Calendar size={24} /></div>
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Schedule Service</h3>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-[0.2em] mt-1">Initiating asset maintenance protocol</p>
                        </div>
                    </div>
                    <button onClick={() => setIsAddModalOpen(false)} className="p-3 hover:bg-white dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400"><X size={24}/></button>
                </div>
                <form onSubmit={handleAddTask} className="p-10 space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Service Designation</label>
                            <input required type="text" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-sm font-black text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm" placeholder="e.g. Engine Oil Flush" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Target Asset</label>
                                <div className="relative">
                                    <select required value={newTask.machineId} onChange={e => setNewTask({...newTask, machineId: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-sm font-black text-slate-900 dark:text-white appearance-none cursor-pointer focus:ring-4 focus:ring-blue-500/10 outline-none">
                                        <option value="">Select ID</option>
                                        {MOCK_VEHICLES.map(v => <option key={v.id} value={v.id}>{v.name} ({v.id})</option>)}
                                    </select>
                                    <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Service Type</label>
                                <div className="relative">
                                    <select required value={newTask.type} onChange={e => setNewTask({...newTask, type: e.target.value as any})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-sm font-black text-slate-900 dark:text-white appearance-none cursor-pointer focus:ring-4 focus:ring-blue-500/10 outline-none">
                                        {Object.values(MaintenanceType).map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                                    </select>
                                    <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Deployment Date</label>
                                <input required type="date" value={newTask.scheduledDate} onChange={e => setNewTask({...newTask, scheduledDate: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-sm font-black text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-blue-500/10 shadow-sm" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Current Hours</label>
                                <div className="relative">
                                    <input type="number" value={newTask.engineHoursAtService} onChange={e => setNewTask({...newTask, engineHoursAtService: parseInt(e.target.value) || 0})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 pr-12 text-sm font-black text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-blue-500/10 shadow-sm" placeholder="0" />
                                    <Gauge size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-blue-50 dark:bg-blue-900/10 rounded-3xl border border-blue-100 dark:border-blue-900/30 flex items-center gap-6 shadow-inner">
                            <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm text-blue-600"><DollarSign size={20}/></div>
                            <div className="flex-1 grid grid-cols-2 gap-6">
                                <div>
                                    <p className="text-[8px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1.5 ml-1">Parts (Est)</p>
                                    <input type="number" value={newTask.costParts} onChange={e => setNewTask({...newTask, costParts: parseFloat(e.target.value) || 0})} className="w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl p-2.5 text-xs font-black text-slate-900 dark:text-white outline-none shadow-sm" />
                                </div>
                                <div>
                                    <p className="text-[8px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1.5 ml-1">Labor (Est)</p>
                                    <input type="number" value={newTask.costLabor} onChange={e => setNewTask({...newTask, costLabor: parseFloat(e.target.value) || 0})} className="w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl p-2.5 text-xs font-black text-slate-900 dark:text-white outline-none shadow-sm" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">Discard</button>
                        <button type="submit" className="flex-[2] py-5 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all">EXECUTE SCHEDULING</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};
