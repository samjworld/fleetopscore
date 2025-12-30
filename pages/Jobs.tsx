
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Plus, MapPin, Truck, User, Clock, CheckCircle, Play, FileText, Check, 
  ChevronDown, X, LayoutList, History, Flag, Ban, Search, UserCheck, 
  MoreVertical, RotateCcw, ClipboardList, Zap, Loader2, ChevronLeft, ChevronRight,
  Briefcase, Info, Save, UserPlus, AlertCircle, Timer, Calendar, AlertOctagon,
  Target, ShieldAlert, Circle, Gauge, FileCheck, ExternalLink, Shield, Maximize2,
  Minimize2, Verified
} from 'lucide-react';
import { Job, JobStatus, Role, JobHistory } from '../types.ts';
import { API_BASE_URL, MOCK_DRIVERS, MOCK_VEHICLES } from '../constants.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import { api } from '../services/api.ts';
import toast from 'react-hot-toast';

const statusColors: Record<JobStatus, string> = {
  created: 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300',
  assigned: 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20',
  accepted: 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-900/20',
  in_progress: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20',
  cancelled: 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20',
};

const priorityConfig = {
  low: { color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-100 dark:border-emerald-800', icon: Circle },
  medium: { color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-100 dark:border-blue-800', icon: Info },
  high: { color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-100 dark:border-orange-800', icon: AlertCircle },
  critical: { color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-100 dark:border-red-800', icon: AlertOctagon },
};

interface JobsResponse {
    data: Job[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export const Jobs = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1');
  const statusFilter = searchParams.get('status') || 'all';
  const driverFilter = searchParams.get('driver') || '';

  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isFullPage, setIsFullPage] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newJob, setNewJob] = useState({
    title: '',
    description: '',
    vehicleId: '',
    driverName: '',
    location: '',
    priority: 'medium' as Job['priority'],
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    estimatedHours: 8
  });

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['jobs', page, statusFilter, driverFilter],
    queryFn: () => api.get<JobsResponse>(`/jobs?page=${page}&limit=8&status=${statusFilter}&driver=${driverFilter}`),
  });

  const jobs = data?.data || [];
  const meta = data?.meta || { total: 0, totalPages: 1 };

  const handleUpdateStatus = async (id: string, status: JobStatus) => {
    try {
        await api.patch(`/jobs/${id}/status`, { status });
        toast.success(`Mission: ${status.replace('_', ' ').toUpperCase()}`);
        refetch().then(res => {
            if (selectedJob?.id === id) {
                const updated = res.data?.data.find(j => j.id === id);
                if (updated) setSelectedJob(updated);
            }
        });
    } catch (e) { toast.error('Command Rejected'); }
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJob.title.trim()) return toast.error('Mission Identifier required');
    if (!newJob.vehicleId) return toast.error('Target Asset required');
    if (!newJob.driverName) return toast.error('Authorized Operator required');
    
    setIsSubmitting(true);
    try {
        const vehicle = MOCK_VEHICLES.find(v => v.id === newJob.vehicleId);
        await api.post('/jobs', {
            ...newJob,
            vehicleName: vehicle?.name || 'Unknown Asset',
            status: 'assigned',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
        toast.success('Mission Dispatched');
        setIsCreateModalOpen(false);
        setNewJob({ title: '', description: '', vehicleId: '', driverName: '', location: '', priority: 'medium', dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], estimatedHours: 8 });
        refetch();
    } catch (e) {
        toast.error('Dispatch Protocol Failure');
    } finally {
        setIsSubmitting(false);
    }
  };

  const getDaysLeft = (date: string) => {
      const due = new Date(date);
      const now = new Date();
      const diff = due.getTime() - now.getTime();
      return Math.ceil(diff / (1000 * 3600 * 24));
  };

  const setPage = (p: number) => {
    setSearchParams(prev => { prev.set('page', p.toString()); return prev; });
  };

  const setStatus = (s: string) => {
    setSearchParams(prev => { prev.set('status', s); prev.set('page', '1'); return prev; });
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 px-1">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-4 uppercase tracking-tighter leading-none">
             <div className="p-2.5 bg-blue-600 rounded-2xl text-white shadow-xl shadow-blue-500/20">
                <ClipboardList size={24} />
             </div>
             Dispatch Nexus
          </h2>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest mt-2 italic">Syncing {meta.total} operational workloads across the organizational grid.</p>
        </div>
        <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-blue-500/40 active:scale-95 transition-all flex items-center gap-3 w-full md:w-auto"
        >
            <Plus size={18} /> Execute Deployment
        </button>
      </div>

      {/* Filter Console */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 flex flex-wrap gap-4 shrink-0 animate-in slide-in-from-bottom-2 duration-500">
         <div className="relative group">
            <select 
              value={statusFilter}
              onChange={(e) => setStatus(e.target.value)}
              className="appearance-none bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl pl-5 pr-12 py-3 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-blue-500/10 cursor-pointer transition-all dark:text-white"
            >
              <option value="all">Global State</option>
              {Object.keys(statusColors).map(s => <option key={s} value={s}>{s.replace('_', ' ').toUpperCase()}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-blue-600" />
         </div>

         <div className="flex-1 min-w-[240px] relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
            <input type="text" placeholder="Filter by mission ID, specialist or logistics zone..." className="w-full pl-12 pr-6 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-blue-500/5 transition-all dark:text-white shadow-sm" />
         </div>
      </div>

      {/* Jobs Grid */}
      <div className="px-1">
        {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center py-20 animate-pulse">
                <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Accessing Dispatch Stream...</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 pb-8 animate-in fade-in duration-700">
                {jobs.map((job, idx) => {
                    const daysLeft = getDaysLeft(job.dueDate);
                    const prio = priorityConfig[job.priority || 'medium'];
                    const isCompleted = job.status === 'completed';
                    
                    return (
                    <div 
                        key={job.id} 
                        onClick={() => { setSelectedJob(job); setActiveTab('details'); setIsFullPage(false); }}
                        className={`p-8 rounded-[2.5rem] border shadow-sm hover:shadow-2xl transition-all cursor-pointer group flex flex-col h-full relative overflow-hidden animate-in slide-in-from-bottom-4 ${
                            isCompleted 
                                ? 'bg-slate-50 dark:bg-slate-900 border-emerald-100 dark:border-emerald-950 opacity-90' 
                                : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-blue-500'
                        }`}
                        style={{ animationDelay: `${idx * 50}ms` }}
                    >
                        {isCompleted && (
                            <div className="absolute -top-4 -right-4 p-8 opacity-10 group-hover:rotate-12 transition-transform">
                                <FileCheck size={120} className="text-emerald-600" />
                            </div>
                        )}
                        
                        <div className="flex justify-between items-start mb-8 relative z-10">
                            <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border-2 shadow-sm ${statusColors[job.status]}`}>
                                {job.status.replace('_', ' ')}
                            </span>
                            {!isCompleted && (
                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 ${prio.bg} ${prio.color} ${prio.border} text-[9px] font-black uppercase tracking-widest`}>
                                    <prio.icon size={12} className={job.priority === 'critical' ? 'animate-pulse' : ''} />
                                    {job.priority}
                                </div>
                            )}
                        </div>
                        
                        <h3 className={`font-black text-lg tracking-tighter uppercase line-clamp-1 mb-3 transition-colors leading-none relative z-10 ${
                            isCompleted ? 'text-slate-500 line-through decoration-slate-300' : 'text-slate-900 dark:text-white group-hover:text-blue-600'
                        }`}>
                            {job.title}
                        </h3>
                        <p className={`text-xs line-clamp-2 italic mb-8 flex-grow leading-relaxed relative z-10 ${isCompleted ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400'}`}>
                            "{job.description}"
                        </p>
                        
                        <div className={`space-y-4 p-6 rounded-[1.5rem] border shadow-inner mb-8 relative z-10 ${
                            isCompleted ? 'bg-slate-100/50 dark:bg-slate-950/20 border-emerald-50' : 'bg-slate-50 dark:bg-slate-950/50 border-slate-100 dark:border-slate-800'
                        }`}>
                            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-tighter">
                                <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300">
                                  <Truck size={16} className={isCompleted ? 'text-slate-400' : 'text-blue-500'} />
                                  <span className="truncate">{job.vehicleName}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-slate-400 font-mono">
                                  {job.estimatedHours}H
                                </div>
                            </div>
                            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-tighter">
                                <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300">
                                  <UserCheck size={16} className={isCompleted ? 'text-slate-400' : 'text-indigo-500'} />
                                  <span className="truncate">{job.driverName || 'UNASSIGNED'}</span>
                                </div>
                                {isCompleted ? (
                                    <div className="flex items-center gap-1.5 text-emerald-600">
                                        <Verified size={14} /> SEALED
                                    </div>
                                ) : (
                                    <div className={`flex items-center gap-1.5 font-mono ${daysLeft <= 1 ? 'text-red-500' : 'text-slate-400'}`}>
                                        <Calendar size={14} /> {daysLeft <= 0 ? 'OVERDUE' : `${daysLeft}D LEFT`}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-between group-hover:text-blue-600 transition-colors pt-6 border-t border-slate-50 dark:border-slate-700/50 relative z-10">
                            <div className="flex items-center gap-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                <MapPin size={14} className={isCompleted ? 'text-slate-300' : 'text-red-500'} /> {job.location}
                            </div>
                            {isCompleted ? <FileCheck size={18} className="text-emerald-500" /> : <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />}
                        </div>
                    </div>
                )})}
            </div>
        )}
      </div>

      {/* Pagination Command Stripe */}
      <div className="p-6 border-t border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-6 bg-white dark:bg-slate-900 rounded-[2.5rem] shrink-0 shadow-sm mx-1">
            <button 
                disabled={page === 1 || isFetching} 
                onClick={() => setPage(page - 1)} 
                className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 transition-all active:scale-95"
            >
                <ChevronLeft size={16}/> PREVIOUS
            </button>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-4">
                REGISTRY NODE <span className="text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 px-5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-inner font-mono">{page} / {meta.totalPages}</span>
            </span>
            <button 
                disabled={page >= meta.totalPages || isFetching} 
                onClick={() => setPage(page + 1)} 
                className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 transition-all active:scale-95"
            >
                NEXT <ChevronRight size={16}/>
            </button>
      </div>

      {/* Detail Panel / Mission Report */}
      {selectedJob && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[5000] flex justify-end" onClick={() => setSelectedJob(null)}>
            <div 
                className={`h-full bg-white dark:bg-slate-900 shadow-2xl animate-in slide-in-from-right duration-500 flex flex-col border-l dark:border-slate-800 transition-all ${isFullPage ? 'w-full' : 'w-full sm:max-w-xl'}`} 
                onClick={e => e.stopPropagation()}
            >
                {/* Panel Header */}
                <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 sticky top-0 z-50">
                    <div className="flex items-center gap-5 min-w-0">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl shrink-0 ${
                            selectedJob.status === 'completed' ? 'bg-emerald-600 text-white shadow-emerald-500/20' : 'bg-blue-600 text-white shadow-blue-500/20'
                        }`}>
                           {selectedJob.status === 'completed' ? <FileCheck size={28} /> : <LayoutList size={28} />}
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter truncate leading-none mb-2">{selectedJob.title}</h2>
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Master ID #{selectedJob.id.substring(0,8)}</span>
                                <div className="h-1 w-1 bg-slate-200 rounded-full"></div>
                                <span className={`text-[9px] font-black uppercase tracking-widest ${selectedJob.status === 'completed' ? 'text-emerald-500' : 'text-blue-500'}`}>{selectedJob.status}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <button 
                            onClick={() => setIsFullPage(!isFullPage)} 
                            className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400 hidden sm:block"
                            title={isFullPage ? "Collapse Panel" : "Expand to Mission Report"}
                        >
                            {isFullPage ? <Minimize2 size={24}/> : <Maximize2 size={24}/>}
                        </button>
                        <button onClick={() => setSelectedJob(null)} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400"><X size={28}/></button>
                    </div>
                </div>

                <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 px-6 shrink-0 sticky top-[116px] z-40 backdrop-blur-sm">
                    <button onClick={() => setActiveTab('details')} className={`px-8 py-5 text-[10px] font-black uppercase tracking-widest border-b-4 transition-all ${activeTab === 'details' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}>Parameters</button>
                    <button onClick={() => setActiveTab('history')} className={`px-8 py-5 text-[10px] font-black uppercase tracking-widest border-b-4 transition-all ${activeTab === 'history' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}>Audit Trace</button>
                </div>

                <div className={`flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar ${isFullPage ? 'bg-slate-50/10 dark:bg-slate-950/10' : ''}`}>
                    {activeTab === 'details' ? (
                        <div className={`space-y-12 animate-in fade-in duration-300 ${isFullPage ? 'max-w-4xl mx-auto' : ''}`}>
                            {selectedJob.status === 'completed' && (
                                <section className="bg-emerald-600 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md border border-white/20"><Zap size={18} /></div>
                                            <h4 className="text-xl font-black uppercase tracking-tighter">Mission Debrief</h4>
                                        </div>
                                        <p className="text-sm font-medium leading-relaxed italic opacity-90 mb-8">"Parameters satisfied. Asset operational cycles archived in compliance with site protocol. Final report hash: {Math.random().toString(36).substring(7).toUpperCase()}"</p>
                                        <div className="grid grid-cols-2 gap-4">
                                            <button className="flex items-center justify-center gap-2 py-3 bg-white text-emerald-700 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-50 transition-all"><FileText size={14}/> Audit Packet</button>
                                            <button className="flex items-center justify-center gap-2 py-3 bg-emerald-700 text-white border border-emerald-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-800 transition-all"><ExternalLink size={14}/> Data Feed</button>
                                        </div>
                                    </div>
                                    <CheckCircle size={200} className="absolute -right-20 -bottom-20 text-white/10 group-hover:scale-110 transition-transform duration-700" />
                                </section>
                            )}

                            <section>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block ml-1">Site Directives</label>
                                <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 italic text-sm text-slate-700 dark:text-slate-300 leading-relaxed shadow-sm">
                                    "{selectedJob.description}"
                                </div>
                            </section>

                            <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="p-8 bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm group hover:border-blue-500/30 transition-all">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><UserCheck size={12} className="text-indigo-500" /> Field Personnel</p>
                                    <h5 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter truncate leading-none">{selectedJob.driverName}</h5>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 tracking-widest">Authorized Specialist</p>
                                </div>
                                <div className="p-8 bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm group hover:border-blue-500/30 transition-all">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Truck size={12} className="text-blue-500" /> Organizational Asset</p>
                                    <h5 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter truncate leading-none">{selectedJob.vehicleName}</h5>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 tracking-widest">Terminal Registry ID</p>
                                </div>
                            </section>

                            <section>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block ml-1">Logistics & Chronometry</label>
                                <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm space-y-6">
                                    <div className="flex items-center justify-between pb-6 border-b border-slate-50 dark:border-slate-800">
                                        <div className="flex items-center gap-4 text-slate-600 dark:text-slate-300">
                                            <MapPin size={20} className="text-red-500" />
                                            <span className="text-xs font-black uppercase tracking-tight">Geographic Sector</span>
                                        </div>
                                        <span className="text-xs font-black text-slate-900 dark:text-white uppercase">{selectedJob.location}</span>
                                    </div>
                                    <div className="flex items-center justify-between pb-6 border-b border-slate-50 dark:border-slate-800">
                                        <div className="flex items-center gap-4 text-slate-600 dark:text-slate-300">
                                            <Calendar size={20} className="text-blue-500" />
                                            <span className="text-xs font-black uppercase tracking-tight">Temporal Deadline</span>
                                        </div>
                                        <span className="text-xs font-mono font-black text-slate-900 dark:text-white">{new Date(selectedJob.dueDate).toLocaleDateString([], {month: 'short', day: 'numeric', year: 'numeric'})}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4 text-slate-600 dark:text-slate-300">
                                            <Timer size={20} className="text-purple-500" />
                                            <span className="text-xs font-black uppercase tracking-tight">Active Work Cycles</span>
                                        </div>
                                        <span className="text-xs font-mono font-black text-slate-900 dark:text-white uppercase">{selectedJob.estimatedHours} Hours</span>
                                    </div>
                                </div>
                            </section>

                            {selectedJob.status !== 'completed' && (
                                <div className="pt-6 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <button 
                                            onClick={() => handleUpdateStatus(selectedJob.id, 'in_progress')}
                                            className="flex items-center justify-center gap-3 py-6 bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400 rounded-3xl text-[10px] font-black uppercase tracking-[0.2em] border border-amber-100 dark:border-amber-900/30 hover:bg-amber-100 transition-all active:scale-95"
                                        >
                                            <Play size={18} /> Initiate Loop
                                        </button>
                                        <button 
                                            onClick={() => handleUpdateStatus(selectedJob.id, 'completed')}
                                            className="flex items-center justify-center gap-3 py-6 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400 rounded-3xl text-[10px] font-black uppercase tracking-[0.2em] border border-emerald-100 dark:border-emerald-900/30 hover:bg-emerald-100 transition-all active:scale-95"
                                        >
                                            <Check size={18} /> Finalize Mission
                                        </button>
                                    </div>
                                    <button 
                                        onClick={() => handleUpdateStatus(selectedJob.id, 'cancelled')}
                                        className="w-full flex items-center justify-center gap-3 py-5 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-red-100 dark:border-red-900/30 hover:bg-red-100 transition-all"
                                    >
                                        <Ban size={18} /> Abort Operational Thread
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className={`space-y-10 animate-in fade-in duration-300 ${isFullPage ? 'max-w-4xl mx-auto' : ''}`}>
                            {selectedJob.statusHistory && selectedJob.statusHistory.length > 0 ? (
                                <div className="space-y-10">
                                    {selectedJob.statusHistory.map((entry, i) => (
                                        <div key={i} className="relative pl-14 group">
                                            {i !== selectedJob.statusHistory!.length - 1 && (
                                                <div className="absolute left-[23px] top-10 bottom-[-40px] w-1 bg-slate-100 dark:bg-slate-800" />
                                            )}
                                            
                                            <div className={`absolute left-0 top-1 w-12 h-12 rounded-[1.2rem] border-4 border-white dark:border-slate-900 flex items-center justify-center z-10 shadow-xl transition-transform group-hover:scale-110 ${
                                                i === selectedJob.statusHistory!.length - 1 ? 'bg-blue-600 text-white animate-pulse' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                                            }`}>
                                                {entry.status === 'completed' ? <CheckCircle size={20}/> : 
                                                 entry.status === 'in_progress' ? <Zap size={20}/> : 
                                                 <Target size={20}/>}
                                            </div>

                                            <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm group-hover:shadow-lg transition-all group-hover:border-blue-500/30">
                                                <div className="flex justify-between items-start mb-4">
                                                    <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border ${statusColors[entry.status as JobStatus] || 'bg-slate-100'}`}>
                                                        {entry.status.replace('_', ' ')}
                                                    </span>
                                                    <span className="text-[11px] font-mono text-slate-400 font-bold uppercase">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                                                </div>
                                                <p className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-tight mb-6 leading-relaxed italic">"{entry.description}"</p>
                                                <div className="flex items-center gap-4 pt-6 border-t border-slate-50 dark:border-slate-700">
                                                    <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-[11px] font-black text-blue-600 border border-slate-100 dark:border-slate-800 shadow-inner">
                                                        {entry.actorName.charAt(0)}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tighter">{entry.actorName}</span>
                                                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Authorized Site Node</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-40 text-center space-y-8 opacity-20">
                                   <History size={120} strokeWidth={1} />
                                   <p className="text-sm font-black uppercase tracking-[0.4em]">Zero Audit Metadata</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 sticky bottom-0 z-50">
                    <button 
                        onClick={() => setSelectedJob(null)} 
                        className="w-full py-6 bg-slate-950 dark:bg-white text-white dark:text-slate-900 rounded-3xl font-black text-[11px] uppercase tracking-[0.5em] hover:scale-[1.01] active:scale-95 transition-all shadow-2xl group flex items-center justify-center gap-4"
                    >
                        MINIMIZE REGISTRY <ChevronDown size={20} className="group-hover:translate-y-1 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Create Modal */}
      {isCreateModalOpen && (
          <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-[6000] flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in duration-200">
                  <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/50">
                      <div className="flex items-center gap-4">
                          <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-500/20"><Briefcase size={24} /></div>
                          <div>
                              <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Execute Dispatch</h3>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-[0.2em] mt-1.5">Provisioning Master Workload</p>
                          </div>
                      </div>
                      <button onClick={() => setIsCreateModalOpen(false)} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400"><X size={32}/></button>
                  </div>
                  <form onSubmit={handleCreateJob} className="p-10 space-y-8">
                      <div className="space-y-4">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mission Identifier</label>
                          <input required type="text" value={newJob.title} onChange={e => setNewJob({...newJob, title: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-sm font-black text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-blue-500/10 transition-all shadow-inner" placeholder="e.g. Sector 4 Debris Management" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div className="space-y-4">
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Asset Registry</label>
                              <div className="relative">
                                  <select required value={newJob.vehicleId} onChange={e => setNewJob({...newJob, vehicleId: e.target.value})} className="w-full appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-sm font-black text-slate-900 dark:text-white outline-none">
                                      <option value="">Select Equipment</option>
                                      {MOCK_VEHICLES.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                  </select>
                                  <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400" />
                              </div>
                          </div>
                          <div className="space-y-4">
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Operator Node</label>
                              <div className="relative">
                                  <select required value={newJob.driverName} onChange={e => setNewJob({...newJob, driverName: e.target.value})} className="w-full appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-sm font-black text-slate-900 dark:text-white outline-none">
                                      <option value="">Select Personnel</option>
                                      {MOCK_DRIVERS.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                                  </select>
                                  <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400" />
                              </div>
                          </div>
                      </div>
                      <div className="flex gap-4 pt-4">
                        <button type="button" onClick={() => setIsCreateModalOpen(false)} className="flex-1 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Abort</button>
                        <button type="submit" disabled={isSubmitting} className="flex-[2] py-5 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3">
                            {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Zap size={18}/>} AUTHORIZE DEPLOYMENT
                        </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};
