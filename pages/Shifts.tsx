
import React, { useState, useEffect, useMemo } from 'react';
import { 
  CalendarClock, Clock, User, Truck, MapPin, 
  Play, CheckCircle2, ChevronRight, X, AlertCircle, 
  RotateCcw, Info, Timer, Zap, History, Save, AlertTriangle, Hammer, Wrench,
  Ban, Filter, Search, ChevronDown, MoreHorizontal, Calendar, Eye, XCircle, FileText
} from 'lucide-react';
import { MOCK_SHIFTS } from '../constants.ts';
import { Shift, ShiftStatus, MaintenanceType, MaintenanceRecord, ShiftLog } from '../types.ts';
import toast from 'react-hot-toast';

export const Shifts = () => {
  const [shifts, setShifts] = useState<Shift[]>(() => {
    const saved = localStorage.getItem('fleetops_shifts');
    return saved ? JSON.parse(saved) : MOCK_SHIFTS;
  });

  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [showBreakdownDialog, setShowBreakdownDialog] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ShiftStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [detailTab, setDetailTab] = useState<'protocol' | 'chronicle'>('protocol');
  
  const [endForm, setEndForm] = useState({ workHours: 8, idleHours: 1 });
  
  // Breakdown Form State
  const [breakdownForm, setBreakdownForm] = useState({
    title: '',
    notes: ''
  });

  useEffect(() => {
    localStorage.setItem('fleetops_shifts', JSON.stringify(shifts));
  }, [shifts]);

  const addLog = (shiftId: string, event: string, status?: ShiftStatus, details?: string) => {
    const newLog: ShiftLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        event,
        status,
        details,
        actor: 'system_auth'
    };
    
    setShifts(prev => prev.map(s => 
        s.id === shiftId ? { ...s, logs: [newLog, ...(s.logs || [])] } : s
    ));
    
    if (selectedShift?.id === shiftId) {
        setSelectedShift(prev => prev ? ({ ...prev, logs: [newLog, ...(prev.logs || [])] }) : null);
    }
  };

  const handleStartShift = () => {
    if (!selectedShift) return;

    const actualStartTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const updatedShifts = shifts.map(s => 
      s.id === selectedShift.id 
        ? { ...s, status: 'in_progress' as ShiftStatus, actualStartTime } 
        : s
    );
    
    setShifts(updatedShifts);
    setSelectedShift({ ...selectedShift, status: 'in_progress', actualStartTime });
    addLog(selectedShift.id, 'Duty Cycle Activation', 'in_progress', `Activation timestamp: ${actualStartTime}`);
    toast.success('Shift In Progress: Operational log started.');
  };

  const handleEndShift = () => {
    if (!selectedShift) return;

    const actualEndTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const updatedShifts = shifts.map(s => 
      s.id === selectedShift.id 
        ? { 
            ...s, 
            status: 'completed' as ShiftStatus, 
            actualEndTime, 
            workHours: endForm.workHours, 
            idleHours: endForm.idleHours 
          } 
        : s
    );

    setShifts(updatedShifts);
    setSelectedShift(null);
    setShowEndDialog(false);
    addLog(selectedShift.id, 'Duty Termination', 'completed', `Final Runtime: ${endForm.workHours}h, Idle Delay: ${endForm.idleHours}h`);
    toast.success('Shift Completed: Metrics synchronized to nexus.');
  };

  const handleCancelShift = () => {
    if (!selectedShift) return;
    if (!window.confirm('Are you sure you want to terminate this planned shift assignment?')) return;

    const updatedShifts = shifts.map(s => 
      s.id === selectedShift.id 
        ? { ...s, status: 'cancelled' as ShiftStatus } 
        : s
    );

    setShifts(updatedShifts);
    addLog(selectedShift.id, 'Assignment Aborted', 'cancelled', 'Operator or supervisor initiated early termination.');
    setSelectedShift(null);
    toast.error('Shift Assignment Cancelled');
  };

  const openBreakdownModal = () => {
    if (!selectedShift) return;
    setBreakdownForm({
      title: `Breakdown Repair: ${selectedShift.operatorName} @ ${selectedShift.siteName}`,
      notes: `Operational breakdown reported during shift. Machine: ${selectedShift.vehicleName}.`
    });
    setShowBreakdownDialog(true);
  };

  const handleReportBreakdown = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShift) return;

    // Load existing maintenance records
    const savedMaintenance = localStorage.getItem('fleetops_maintenance');
    const records: MaintenanceRecord[] = savedMaintenance ? JSON.parse(savedMaintenance) : [];

    const newRecord: MaintenanceRecord = {
      id: `m-break-${Date.now()}`,
      machineId: selectedShift.vehicleId,
      type: MaintenanceType.BREAKDOWN,
      status: 'scheduled',
      title: breakdownForm.title,
      scheduledDate: new Date().toISOString(),
      costParts: 0,
      costLabor: 0,
      engineHoursAtService: 0, 
      checklist: [],
      tenantId: selectedShift.tenantId,
      version: 1,
      createdBy: 'supervisor',
      updatedBy: 'supervisor',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem('fleetops_maintenance', JSON.stringify([newRecord, ...records]));
    
    // Also cancel the shift since the machine is broken
    const updatedShifts = shifts.map(s => 
        s.id === selectedShift.id ? { ...s, status: 'cancelled' as ShiftStatus } : s
    );
    setShifts(updatedShifts);

    addLog(selectedShift.id, 'Critical Mechanical Failure', 'cancelled', breakdownForm.notes);
    setShowBreakdownDialog(false);
    setSelectedShift(null);
    toast.error('Breakdown Logged: Maintenance queue updated.', {
      icon: '🛠️',
      duration: 4000
    });
  };

  const filteredShifts = useMemo(() => {
    return shifts.filter(s => {
      const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
      const matchesSearch = s.operatorName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            s.vehicleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            s.siteName.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [shifts, statusFilter, searchTerm]);

  const getStatusColor = (status: ShiftStatus) => {
    switch (status) {
      case 'in_progress': return 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
      case 'completed': return 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800/50';
      case 'cancelled': return 'bg-red-50 text-red-700 border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800/50';
      case 'planned': return 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
      default: return 'bg-slate-50 text-slate-500 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-700 px-1 sm:px-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-in slide-in-from-top-1 duration-500">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter flex items-center gap-3 leading-none">
             <div className="p-2 bg-blue-600 rounded-xl text-white shadow-lg"><CalendarClock size={22} /></div>
             Shift Command
          </h2>
          <p className="text-[11px] md:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1.5 uppercase tracking-wide italic">Operational attendance and duty cycle monitor.</p>
        </div>
        <div className="flex items-center gap-2">
            <button className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm">
                <Calendar size={16} /> Scheduler
            </button>
        </div>
      </div>

      {/* Control Console */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row gap-4 items-center justify-between shrink-0 animate-in slide-in-from-bottom-2 duration-500">
        <div className="flex items-center gap-3 w-full lg:max-w-md">
            <div className="relative flex-1 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input 
                    type="text" 
                    placeholder="Search operator, machine, or site..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-12 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white transition-all shadow-inner"
                />
                {searchTerm && (
                    <button 
                        onClick={() => setSearchTerm('')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 dark:hover:text-slate-100 transition-colors"
                    >
                        <XCircle size={16} />
                    </button>
                )}
            </div>
            {searchTerm && (
                <div className="hidden sm:flex items-center px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-blue-100 dark:border-blue-800 shadow-sm animate-in zoom-in">
                    {filteredShifts.length}
                </div>
            )}
        </div>
        <div className="flex bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-slate-100 dark:border-slate-800 shadow-inner w-full lg:w-auto overflow-x-auto custom-scrollbar">
            {(['all', 'planned', 'in_progress', 'completed', 'cancelled'] as const).map(s => (
                <button 
                    key={s} 
                    onClick={() => setStatusFilter(s)}
                    className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${statusFilter === s ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                >
                    {s.replace('_', ' ')}
                </button>
            ))}
        </div>
      </div>

      {/* Shifts Table */}
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden animate-in slide-in-from-bottom-4">
        <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse font-sans">
                <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <th className="px-8 py-5">Personnel Node</th>
                        <th className="px-8 py-5">Asset Node</th>
                        <th className="px-8 py-5">Site / Sector</th>
                        <th className="px-8 py-5">Temporal Window</th>
                        <th className="px-8 py-5">Status Registry</th>
                        <th className="px-8 py-5 text-right">Ops</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredShifts.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="px-8 py-20 text-center text-slate-300 font-black uppercase tracking-[0.2em] italic">Zero Shifts Found In Buffer</td>
                        </tr>
                    ) : (
                        filteredShifts.map((shift, idx) => (
                            <tr key={shift.id} onClick={() => { setSelectedShift(shift); setDetailTab('protocol'); }} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all cursor-pointer group">
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center font-black shadow-inner shrink-0 group-hover:scale-110 transition-transform">
                                            {shift.operatorName.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">{shift.operatorName}</p>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase mt-1.5">ID: {shift.operatorId}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-2 uppercase tracking-tighter">
                                            <Truck size={14} className="text-blue-500" /> {shift.vehicleName}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tighter">
                                        <MapPin size={14} className="text-red-500" /> {shift.siteName}
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2 text-xs font-mono font-black text-slate-900 dark:text-white">
                                            <Clock size={12} className="text-slate-400" /> {shift.plannedStartTime} - {shift.plannedEndTime}
                                        </div>
                                        <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 tracking-widest">{shift.plannedDate}</p>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <span className={`inline-flex px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border-2 shadow-sm ${getStatusColor(shift.status)}`}>
                                        {shift.status.replace('_', ' ')}
                                    </span>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                        <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><Eye size={18} /></button>
                                        <button className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"><MoreHorizontal size={18} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
      </div>

      {/* DETAIL DRAWER / SLIDE-UP */}
      {selectedShift && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[6000] flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setSelectedShift(null)}>
           <div 
             className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-t-[3rem] sm:rounded-[3rem] shadow-2xl overflow-hidden border-t sm:border border-slate-100 dark:border-slate-800 animate-in slide-in-from-bottom-20 duration-500 h-[90vh] sm:h-auto"
             onClick={e => e.stopPropagation()}
           >
              <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/50">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-500/20"><Timer size={24} /></div>
                    <div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Shift Terminal</h3>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1.5">ID: {selectedShift.id}</p>
                    </div>
                 </div>
                 <button onClick={() => setSelectedShift(null)} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400"><X size={24}/></button>
              </div>

              {/* Detail Tabs */}
              <div className="flex border-b border-slate-50 dark:border-slate-800 bg-white dark:bg-slate-900 px-8 shrink-0">
                  <button 
                    onClick={() => setDetailTab('protocol')}
                    className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest border-b-4 transition-all ${detailTab === 'protocol' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}
                  >
                    Protocol
                  </button>
                  <button 
                    onClick={() => setDetailTab('chronicle')}
                    className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest border-b-4 transition-all ${detailTab === 'chronicle' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}
                  >
                    Chronicle Log
                  </button>
              </div>

              <div className="p-8 space-y-8 h-[calc(100%-180px)] sm:max-h-[60vh] overflow-y-auto custom-scrollbar">
                {detailTab === 'protocol' ? (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    {/* Operator Profile */}
                    <div className="p-6 bg-slate-50 dark:bg-slate-950 rounded-[2rem] border border-slate-100 dark:border-slate-800 flex items-center gap-6 shadow-inner">
                        <div className="w-16 h-16 rounded-[1.5rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center font-black text-blue-600 text-2xl shadow-sm">{selectedShift.operatorName.charAt(0)}</div>
                        <div>
                            <h4 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{selectedShift.operatorName}</h4>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-[0.2em]">Verified Field Node</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm group">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Target Asset</p>
                            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-black text-sm">
                                <Truck size={16} className="text-blue-500" /> {selectedShift.vehicleName}
                            </div>
                        </div>
                        <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm group">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Deployment Site</p>
                            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-black text-sm">
                                <MapPin size={16} className="text-red-500" /> {selectedShift.siteName}
                            </div>
                        </div>
                    </div>

                    {/* Status-specific Action View */}
                    <section className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                            <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Duty Cycle Protocol</h5>
                            <div className="flex items-center gap-2">
                               <div className={`w-2 h-2 rounded-full ${selectedShift.status === 'in_progress' ? 'bg-blue-600 animate-ping' : 'bg-slate-300'}`}></div>
                               <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${getStatusColor(selectedShift.status)}`}>
                                 {selectedShift.status}
                               </span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm font-black uppercase tracking-tight">
                                <div className="text-slate-400">Scheduled Window</div>
                                <div className="text-slate-900 dark:text-white tabular-nums">{selectedShift.plannedStartTime} - {selectedShift.plannedEndTime}</div>
                            </div>
                            
                            {selectedShift.actualStartTime && (
                               <div className="flex justify-between items-center text-sm font-black uppercase tracking-tight text-blue-600 dark:text-blue-400 animate-in fade-in duration-500">
                                    <div>Actual Activation</div>
                                    <div className="tabular-nums">{selectedShift.actualStartTime}</div>
                               </div>
                            )}
                            
                            {selectedShift.status === 'completed' && (
                               <>
                                 <div className="flex justify-between items-center text-sm font-black uppercase tracking-tight text-emerald-600 dark:text-emerald-400 animate-in fade-in duration-500">
                                    <div>Actual Termination</div>
                                    <div className="tabular-nums">{selectedShift.actualEndTime}</div>
                                 </div>
                                 <div className="p-5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800 rounded-2xl grid grid-cols-2 gap-6 text-center animate-in zoom-in duration-500">
                                    <div>
                                        <p className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Work Runtime</p>
                                        <p className="text-xl font-black text-emerald-700 dark:text-emerald-300 tabular-nums">{selectedShift.workHours}h</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Idle Delay</p>
                                        <p className="text-xl font-black text-emerald-700 dark:text-emerald-300 tabular-nums">{selectedShift.idleHours}h</p>
                                    </div>
                                 </div>
                               </>
                            )}
                        </div>
                    </section>

                    <div className="p-6 bg-blue-50 dark:bg-blue-900/10 rounded-[1.5rem] border border-blue-100 dark:border-blue-900/30 flex items-start gap-4">
                        <Zap size={20} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-blue-800 dark:text-blue-300 font-bold uppercase leading-relaxed">
                            Authorized State Transition: All logs are synchronized via secure organizational satellite nodes. Verification check required for all duty cycle termination requests.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="pt-8 flex flex-col gap-4">
                        {selectedShift.status === 'planned' && (
                            <div className="flex flex-col gap-3">
                                <button 
                                    onClick={handleStartShift}
                                    className="w-full py-6 bg-blue-600 text-white rounded-2xl font-black text-lg uppercase tracking-[0.2em] shadow-2xl shadow-blue-500/40 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4"
                                >
                                    <Play size={24} /> START SHIFT
                                </button>
                                <button 
                                    onClick={handleCancelShift}
                                    className="w-full py-4 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-2xl font-black text-xs uppercase tracking-[0.2em] border border-red-100 dark:border-red-900/30 hover:bg-red-100 transition-all flex items-center justify-center gap-3"
                                >
                                    <Ban size={18} /> CANCEL ASSIGNMENT
                                </button>
                            </div>
                        )}

                        {selectedShift.status === 'in_progress' && (
                            <div className="flex flex-col gap-4 animate-in slide-in-from-bottom-2">
                                <button 
                                    onClick={() => setShowEndDialog(true)}
                                    className="w-full py-6 bg-emerald-600 text-white rounded-2xl font-black text-lg uppercase tracking-[0.2em] shadow-2xl shadow-emerald-500/40 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4"
                                >
                                    <CheckCircle2 size={24} /> END SHIFT
                                </button>
                                
                                <div className="grid grid-cols-2 gap-3">
                                    <button 
                                        onClick={openBreakdownModal}
                                        className="py-5 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-2xl font-black text-xs uppercase tracking-[0.2em] border border-orange-100 dark:border-orange-900/30 hover:bg-orange-100 transition-all flex items-center justify-center gap-3"
                                    >
                                        <AlertTriangle size={18} /> BREAKDOWN
                                    </button>
                                    <button 
                                        onClick={handleCancelShift}
                                        className="py-5 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-2xl font-black text-xs uppercase tracking-[0.2em] border border-red-100 dark:border-red-900/30 hover:bg-red-100 transition-all flex items-center justify-center gap-3"
                                    >
                                        <Ban size={18} /> CANCEL
                                    </button>
                                </div>
                            </div>
                        )}

                        {(selectedShift.status === 'completed' || selectedShift.status === 'cancelled') && (
                            <div className="text-center py-6 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 animate-in zoom-in">
                               <p className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
                                 <CheckCircle2 size={16} className={selectedShift.status === 'completed' ? 'text-emerald-500' : 'text-red-500'} /> 
                                 Operational Record Sealed: {selectedShift.status.toUpperCase()}
                               </p>
                            </div>
                        )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8 animate-in fade-in duration-300">
                      <div className="flex items-center justify-between">
                         <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2"><History size={18} className="text-blue-600" /> Operational Chronicle</h4>
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-full">{selectedShift.logs?.length || 0} Entries</span>
                      </div>
                      
                      <div className="relative space-y-6 pl-4">
                         <div className="absolute left-6 top-2 bottom-2 w-0.5 bg-slate-100 dark:bg-slate-800"></div>
                         
                         {(selectedShift.logs && selectedShift.logs.length > 0) ? (
                            selectedShift.logs.map((log, idx) => (
                               <div key={log.id} className="relative pl-10 group animate-in slide-in-from-left duration-300" style={{ animationDelay: `${idx * 50}ms` }}>
                                  <div className={`absolute left-[-11px] top-1 w-5 h-5 rounded-full border-4 border-white dark:border-slate-900 z-10 ${
                                    log.status === 'completed' ? 'bg-emerald-500' : 
                                    log.status === 'cancelled' ? 'bg-red-500' : 
                                    log.status === 'in_progress' ? 'bg-blue-600 animate-pulse' : 'bg-slate-300'
                                  }`}></div>
                                  
                                  <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm group-hover:border-blue-500/30 transition-colors">
                                     <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                        <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{log.event}</p>
                                        <p className="text-[9px] font-mono text-slate-400 uppercase">{new Date(log.timestamp).toLocaleTimeString()}</p>
                                     </div>
                                     {log.details && (
                                        <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium italic border-l-2 border-slate-200 dark:border-slate-800 pl-3 mt-2">{log.details}</p>
                                     )}
                                     <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[8px] font-black uppercase tracking-widest text-slate-400">
                                        <span>Node: {log.actor}</span>
                                        <span>Status Trace: {log.status || 'N/A'}</span>
                                     </div>
                                  </div>
                               </div>
                            ))
                         ) : (
                            <div className="py-20 text-center opacity-20 flex flex-col items-center justify-center">
                                <FileText size={60} strokeWidth={1} className="mb-4" />
                                <p className="font-black uppercase tracking-[0.2em] text-xs">Awaiting Entry Sequence</p>
                            </div>
                         )}

                         {/* Initial Creation Log (Virtual) */}
                         <div className="relative pl-10">
                            <div className="absolute left-[-11px] top-1 w-5 h-5 rounded-full border-4 border-white dark:border-slate-900 z-10 bg-slate-200"></div>
                            <div className="bg-slate-50/50 dark:bg-slate-950/50 p-5 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                               <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Assignment Created in Nexus</p>
                               <p className="text-[9px] font-mono text-slate-300 mt-1 uppercase">Staged Registry Entry</p>
                            </div>
                         </div>
                      </div>
                  </div>
                )}
              </div>
           </div>
        </div>
      )}

      {/* BREAKDOWN MODAL */}
      {showBreakdownDialog && selectedShift && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-2xl z-[7000] flex items-center justify-center p-4 animate-in fade-in duration-300">
           <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl w-full max-md overflow-hidden border border-red-200 dark:border-red-900/30 animate-in zoom-in duration-200">
               <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-red-50/50 dark:bg-red-950/20 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                     <div className="p-3 bg-red-600 text-white rounded-2xl shadow-xl shadow-red-500/20"><Hammer size={24} /></div>
                     <div>
                        <h4 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Breakdown Event</h4>
                        <p className="text-[10px] text-red-600 font-black uppercase tracking-[0.2em] mt-1.5">Emergency Repair Request</p>
                     </div>
                  </div>
                  <button onClick={() => setShowBreakdownDialog(false)} className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400"><X size={20}/></button>
               </div>

               <form onSubmit={handleReportBreakdown} className="p-8 space-y-6">
                  <div className="space-y-4">
                     <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3 shadow-inner">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                           <span className="text-slate-400">Target Node</span>
                           <span className="text-blue-600 dark:text-blue-400">{selectedShift.vehicleName}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                           <span className="text-slate-400">Site Assignment</span>
                           <span className="text-slate-900 dark:text-white">{selectedShift.siteName}</span>
                        </div>
                     </div>

                     <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1">Maintenance Title</label>
                        <input 
                           required 
                           type="text" 
                           value={breakdownForm.title} 
                           onChange={e => setBreakdownForm({...breakdownForm, title: e.target.value})}
                           className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                        />
                     </div>

                     <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1">Fault Description (Notes)</label>
                        <textarea 
                           required 
                           rows={3}
                           value={breakdownForm.notes} 
                           onChange={e => setBreakdownForm({...breakdownForm, notes: e.target.value})}
                           placeholder="Describe the nature of the mechanical failure..."
                           className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all resize-none shadow-inner"
                        />
                     </div>
                  </div>

                  <div className="p-5 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30 flex items-start gap-4">
                     <Wrench size={18} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                     <p className="text-[10px] text-blue-800 dark:text-blue-300 font-bold leading-relaxed uppercase">
                        Protocol: This action will immediately inject a "Breakdown Repair" task into the Global Maintenance Queue. The shift will be marked as Cancelled.
                     </p>
                  </div>

                  <button 
                     type="submit"
                     className="w-full py-6 bg-slate-900 dark:bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3"
                  >
                     <Zap size={18}/> EXECUTE REPAIR REQUEST
                  </button>
               </form>
           </div>
        </div>
      )}

      {/* END SHIFT MODAL - METRICS INPUT */}
      {showEndDialog && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-2xl z-[7000] flex items-center justify-center p-4 animate-in fade-in duration-300">
           <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl w-full max-sm overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in duration-200">
               <div className="p-8 text-center space-y-6">
                  <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/30 rounded-[2rem] flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto border-2 border-emerald-100 dark:border-emerald-800 shadow-inner"><History size={40}/></div>
                  <div>
                    <h4 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Shift Summary</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Capture final operational metrics.</p>
                  </div>

                  <div className="space-y-6">
                    <div>
                        <div className="flex justify-between mb-3 px-2">
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Work Hours</span>
                            <span className="text-xs font-black text-blue-600 dark:text-blue-400">{endForm.workHours}h</span>
                        </div>
                        <input 
                            type="range" min="0" max="16" step="0.5" 
                            value={endForm.workHours} 
                            onChange={e => setEndForm({...endForm, workHours: parseFloat(e.target.value)})}
                            className="w-full accent-blue-600 h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                    <div>
                        <div className="flex justify-between mb-3 px-2">
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Idle Hours</span>
                            <span className="text-xs font-black text-amber-600 dark:text-amber-400">{endForm.idleHours}h</span>
                        </div>
                        <input 
                            type="range" min="0" max="8" step="0.5" 
                            value={endForm.idleHours} 
                            onChange={e => setEndForm({...endForm, idleHours: parseFloat(e.target.value)})}
                            className="w-full accent-amber-500 h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 pt-4">
                    <button 
                        onClick={handleEndShift}
                        className="w-full py-5 bg-slate-900 dark:bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                        <Save size={18}/> SUBMIT TO NEXUS
                    </button>
                    <button 
                        onClick={() => setShowEndDialog(false)}
                        className="w-full py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                        Dismiss
                    </button>
                  </div>
               </div>
           </div>
        </div>
      )}
    </div>
  );
};
