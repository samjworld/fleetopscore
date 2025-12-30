
import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  AlertTriangle, CheckCircle, Clock, Filter, Search, ShieldAlert, X, Eye, 
  AlertOctagon, Loader2, MessageSquare, Siren, Activity, ChevronLeft, ChevronRight,
  ShieldCheck, ShieldInfo, ShieldX, ShieldAlert as ShieldAlertIcon,
  ArrowUpDown, ChevronDown, ListFilter, SortAsc, Truck
} from 'lucide-react';
import { io } from 'socket.io-client';
import { Alert } from '../types.ts';
import { api } from '../services/api.ts';
import toast from 'react-hot-toast';

const socket = io('http://localhost:3001', { autoConnect: true, reconnectionAttempts: 3 });

interface AlertsResponse {
    data: Alert[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export const Alerts = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1');
  const statusFilter = searchParams.get('status') || 'all';
  const severityFilter = searchParams.get('severity') || 'all';
  const sortOrder = searchParams.get('sort') || 'time'; // 'time' or 'severity'

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['alerts', page, statusFilter, severityFilter, sortOrder],
    queryFn: () => api.get<AlertsResponse>(`/alerts?page=${page}&limit=10&status=${statusFilter}&severity=${severityFilter}&sort=${sortOrder}`),
  });

  useEffect(() => {
    const handleNewAlert = (newAlert: Alert) => {
        toast(`New Alert: ${newAlert.message}`, { icon: '⚠️' });
        refetch();
    };

    socket.on('alert', handleNewAlert);
    window.addEventListener('mock-socket-alert', handleNewAlert as any);

    return () => { 
        socket.off('alert', handleNewAlert);
        window.removeEventListener('mock-socket-alert', handleNewAlert as any);
    };
  }, [refetch]);

  const handleStatusUpdate = async (id: string, status: Alert['status']) => {
    try {
        await api.patch(`/alerts/${id}/status`, { status });
        toast.success(`Alert marked as ${status}`);
        refetch();
    } catch (err) {
        toast.error('Failed to update alert status');
    }
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

  const setSeverity = (s: string) => {
      setSearchParams(prev => {
          prev.set('severity', s);
          prev.set('page', '1');
          return prev;
      });
  };

  const setSort = (s: string) => {
    setSearchParams(prev => {
        prev.set('sort', s);
        prev.set('page', '1');
        return prev;
    });
  };

  const alerts = data?.data || [];
  const meta = data?.meta || { total: 0, totalPages: 1 };

  const getSeverityStyles = (severity: string, status: string) => {
    const isNew = status === 'new';
    switch(severity) {
      case 'critical': 
        return isNew ? 'border-red-600 bg-red-50 dark:bg-red-950/20 shadow-inner border-2' : 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-50 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-50 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const severityLevels = [
    { id: 'all', label: 'All Severities', color: 'bg-slate-400' },
    { id: 'low', label: 'Low', color: 'bg-blue-500' },
    { id: 'medium', label: 'Medium', color: 'bg-yellow-500' },
    { id: 'high', label: 'High', color: 'bg-orange-500' },
    { id: 'critical', label: 'Critical', color: 'bg-red-600' },
  ];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500 flex flex-col h-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shrink-0">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter flex items-center gap-3">
             <div className="p-2 bg-red-600 text-white rounded-xl shadow-lg shadow-red-500/20">
                <ShieldAlert size={24} />
             </div>
             Alert Monitor
          </h2>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-[0.2em] mt-2 italic">Monitoring {meta.total} organizational risk events in real-time.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-2 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm shrink-0">
            <div className="text-center px-6 border-r border-gray-100 dark:border-slate-700">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Integrity</p>
                <p className="text-xl font-black text-emerald-600">88%</p>
            </div>
            <button 
                onClick={() => refetch()} 
                className="p-3 text-slate-400 hover:text-blue-600 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl transition-all group"
                title="Force Telemetry Sync"
            >
                {isFetching ? <Loader2 size={18} className="animate-spin text-blue-600" /> : <Clock size={18} className="group-hover:rotate-12 transition-transform" />}
            </button>
        </div>
      </div>

      {/* Control Console */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-700 space-y-4 shrink-0 animate-in slide-in-from-bottom-2 duration-500">
          <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
              {/* State & Severity Filters */}
              <div className="flex flex-col sm:flex-row gap-6 w-full lg:w-auto">
                  <div className="space-y-2">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Lifecycle State</span>
                    <div className="flex gap-1 bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-slate-100 dark:border-slate-900 overflow-x-auto custom-scrollbar no-scrollbar">
                        {['all', 'new', 'acknowledged', 'resolved'].map(f => (
                            <button 
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                                    statusFilter === f 
                                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-md ring-1 ring-slate-100 dark:ring-slate-700' 
                                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                                }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Severity Buffer</span>
                    <div className="flex gap-1 bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-slate-100 dark:border-slate-900 overflow-x-auto custom-scrollbar no-scrollbar">
                        {severityLevels.map(s => (
                            <button 
                                key={s.id}
                                onClick={() => setSeverity(s.id)}
                                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${
                                    severityFilter === s.id 
                                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-md ring-1 ring-slate-100 dark:ring-slate-700' 
                                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                                }`}
                            >
                                <div className={`w-1.5 h-1.5 rounded-full ${s.color}`}></div>
                                {s.label}
                            </button>
                        ))}
                    </div>
                  </div>
              </div>

              {/* Sort Engine */}
              <div className="flex items-center gap-3 w-full lg:w-auto self-end lg:self-center">
                  <div className="flex-1 lg:flex-none relative group">
                      <select 
                        value={sortOrder}
                        onChange={(e) => setSort(e.target.value)}
                        className="w-full lg:w-48 appearance-none bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-2xl pl-10 pr-10 py-3.5 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-blue-500/10 cursor-pointer transition-all dark:text-white"
                      >
                        <option value="time">Time (Newest)</option>
                        <option value="severity">Priority (High)</option>
                      </select>
                      <ArrowUpDown size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-blue-600 transition-colors" />
                      <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
              </div>
          </div>
      </div>

      {/* Alerts Ledger */}
      <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col flex-1 min-h-0 animate-in fade-in duration-700 delay-200">
        <div className="flex-1 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-700/50 custom-scrollbar">
            {isLoading ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 py-32">
                    <Loader2 className="animate-spin mb-4 text-blue-500" size={48} />
                    <p className="text-[11px] font-black uppercase tracking-[0.4em] animate-pulse">Syncing Priority Ledger...</p>
                </div>
            ) : alerts.length === 0 ? (
                <div className="p-32 text-center flex flex-col items-center justify-center opacity-30">
                    <ShieldCheck size={80} strokeWidth={1} className="mb-6 text-emerald-500" />
                    <h3 className="text-xl font-black uppercase tracking-[0.2em]">Registry Clear</h3>
                    <p className="text-[10px] uppercase tracking-widest mt-2">Zero incidents matching the current buffer parameters.</p>
                </div>
            ) : (
                alerts.map((alert, idx) => (
                    <div 
                        key={alert.id} 
                        className={`p-8 transition-all border-l-8 group animate-in slide-in-from-left duration-500 ${getSeverityStyles(alert.severity, alert.status)}`}
                        style={{ animationDelay: `${idx * 40}ms` }}
                    >
                        <div className="flex flex-col sm:flex-row gap-6 sm:items-center">
                            <div className="flex items-start gap-6 flex-1 min-w-0">
                                <div className={`w-14 h-14 rounded-2xl shrink-0 flex items-center justify-center shadow-xl transition-transform group-hover:scale-110 ${alert.severity === 'critical' ? 'bg-red-600 text-white shadow-red-500/30 animate-pulse' : 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-blue-600'}`}>
                                    {alert.type === 'emergency' ? <Siren size={28} /> : <AlertOctagon size={28} />}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-3 mb-2">
                                        <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-lg border shadow-sm ${
                                            alert.severity === 'critical' ? 'bg-red-50 text-red-700 border-red-100' :
                                            alert.severity === 'high' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                                            alert.severity === 'medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                                            'bg-blue-50 text-blue-700 border-blue-100'
                                        }`}>
                                            {alert.severity}
                                        </span>
                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${
                                            alert.status === 'new' ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-900 border-slate-950' : 'bg-slate-100 text-slate-500 border-slate-200'
                                        }`}>
                                            {alert.status}
                                        </span>
                                    </div>
                                    <h4 className="text-lg font-black tracking-tight text-slate-900 dark:text-white uppercase truncate group-hover:text-blue-600 transition-colors">
                                        {alert.message}
                                    </h4>
                                    <div className="flex flex-wrap gap-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-3">
                                        <span className="flex items-center gap-2"><Clock size={14} className="text-blue-500" /> {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                                        {/* Fix: Added missing 'Truck' icon import from lucide-react */}
                                        <span className="flex items-center gap-2"><Truck size={14} className="text-indigo-500" /> {alert.vehicleName || 'SYSTEM NODE'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 pl-20 sm:pl-0">
                                {alert.status === 'new' && (
                                    <button 
                                        onClick={() => handleStatusUpdate(alert.id, 'acknowledged')} 
                                        className="px-6 py-3 bg-blue-600 text-white text-[10px] font-black rounded-xl uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all hover:bg-blue-700"
                                    >
                                        Acknowledge
                                    </button>
                                )}
                                {alert.status !== 'resolved' && (
                                    <button 
                                        onClick={() => handleStatusUpdate(alert.id, 'resolved')} 
                                        className="px-6 py-3 bg-emerald-600 text-white text-[10px] font-black rounded-xl uppercase tracking-widest shadow-xl shadow-emerald-500/20 active:scale-95 transition-all hover:bg-emerald-700"
                                    >
                                        Resolve
                                    </button>
                                )}
                                <button className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl text-slate-400 hover:text-blue-600 transition-all shadow-sm"><Eye size={20} /></button>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
        
        {/* Command Footer */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-6 bg-slate-50/50 dark:bg-slate-950/50">
            <button 
                disabled={page === 1 || isLoading}
                onClick={() => setPage(page - 1)}
                className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 dark:text-slate-300 hover:bg-slate-50 disabled:opacity-30 transition-all active:scale-95 shadow-sm"
            >
                <ChevronLeft size={18} /> PREVIOUS
            </button>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-4">
                LEDGER NODE <span className="text-slate-900 dark:text-white bg-white dark:bg-slate-800 px-5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-inner font-mono">{page} / {meta.totalPages}</span>
            </span>
            <button 
                disabled={page >= meta.totalPages || isLoading}
                onClick={() => setPage(page + 1)}
                className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 dark:text-slate-300 hover:bg-slate-50 disabled:opacity-30 transition-all active:scale-95 shadow-sm"
            >
                NEXT <ChevronRight size={18} />
            </button>
        </div>
      </div>
    </div>
  );
};
