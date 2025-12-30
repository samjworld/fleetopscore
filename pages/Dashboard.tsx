
import React, { useMemo, memo, useState, useEffect } from 'react';
import { 
  Users, Truck, AlertTriangle, Activity, 
  Fuel, Wrench, BadgeCheck, 
  MapPin, Clock, ArrowRight, TrendingUp,
  ShieldAlert, ChevronRight, Loader2, Download, 
  Calendar, Construction, ClipboardList, PlayCircle, Coffee, X, Edit3, CheckCircle2, FileText, Check, ChevronDown, Database,
  Briefcase, Siren, BarChart3, Zap, LineChart as LineIcon, Timer, FileSpreadsheet, Search,
  Box, Layers, Barcode, ShoppingCart, Package, HeartPulse, History,
  Info, FileUp, Gauge, CalendarDays, PlusCircle, Plus, Bell, Trash2, ChevronLeft, Save, Terminal, Monitor, RefreshCw,
  Star, Target, Shield, HardHat, AlertOctagon, Hammer, Settings2, Send
} from 'lucide-react';
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, Radar
} from 'recharts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import { Role, MaintenanceType, MaintenanceRecord, OperatorReminder, ReminderCategory, ReminderPriority } from '../types.ts';
import { Link, useNavigate } from 'react-router-dom';
import { MOCK_VEHICLES, API_BASE_URL } from '../constants.ts';
import { ImportModal } from '../components/ImportModal.tsx';
import toast from 'react-hot-toast';

// --- MOCK DATA SETS ---
const FLEET_TRENDS = [
  { name: 'Mon', active: 38, maintenance: 4, idle: 8, avgSpeed: 42, avgFuel: 72, fuelConsumed: 450, utilization: 82 },
  { name: 'Tue', active: 42, maintenance: 5, idle: 3, avgSpeed: 45, avgFuel: 68, fuelConsumed: 420, utilization: 88 },
  { name: 'Wed', active: 45, maintenance: 2, idle: 3, avgSpeed: 40, avgFuel: 65, fuelConsumed: 480, utilization: 91 },
  { name: 'Thu', active: 40, maintenance: 8, idle: 2, avgSpeed: 38, avgFuel: 60, fuelConsumed: 510, utilization: 85 },
  { name: 'Fri', active: 48, maintenance: 1, idle: 1, avgSpeed: 44, avgFuel: 58, fuelConsumed: 390, utilization: 94 },
  { name: 'Sat', active: 20, maintenance: 15, idle: 15, avgSpeed: 30, avgFuel: 75, fuelConsumed: 250, utilization: 45 },
  { name: 'Sun', active: 10, maintenance: 20, idle: 20, avgSpeed: 25, avgFuel: 82, fuelConsumed: 180, utilization: 22 },
];

// --- SUB-COMPONENTS ---

const DashboardHeader = ({ title, subtitle, actions }: { title: string, subtitle: string, actions?: React.ReactNode }) => (
  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8 animate-in fade-in slide-in-from-top-1 duration-500">
    <div className="max-w-2xl">
      <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none mb-2">{title}</h2>
      <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium italic opacity-80">{subtitle}</p>
    </div>
    <div className="flex items-center gap-2 w-full lg:w-auto">{actions}</div>
  </div>
);

const KpiCard = memo(({ label, value, sub, icon: Icon, color, bg, trend, onClick }: any) => (
  <div onClick={onClick} className={`bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-5 flex items-start justify-between hover:shadow-xl dark:hover:shadow-blue-500/10 hover:border-blue-500/50 transition-all relative overflow-hidden group ${onClick ? 'cursor-pointer active:scale-95' : ''}`}>
    <div className="relative z-10">
      <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">{label}</p>
      <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">{value}</h3>
      {sub && (
        <p className={`text-[9px] mt-3 font-black uppercase tracking-widest flex items-center gap-1.5 ${trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-red-500' : 'text-slate-400'}`}>
          {trend === 'up' && <TrendingUp size={12} />} {sub}
        </p>
      )}
    </div>
    <div className={`p-3 rounded-xl ${bg} ${color} group-hover:scale-110 transition-transform duration-500 shadow-inner`}><Icon size={22} /></div>
    <div className={`absolute -right-8 -bottom-8 w-32 h-32 rounded-full ${bg} opacity-5 group-hover:opacity-10 transition-opacity`}></div>
  </div>
));

const ChartContainer = ({ title, children, className = "", icon: Icon }: { title: string, children?: React.ReactNode, className?: string, icon?: any }) => (
  <div className={`bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col hover:shadow-lg dark:hover:shadow-slate-900/50 transition-all duration-300 ${className}`}>
    <div className="flex items-center justify-between mb-8">
      <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-3 uppercase tracking-tight text-[11px]">
        <div className="w-1.5 h-4 bg-blue-600 rounded-full shadow-lg shadow-blue-500/20"></div> 
        {title}
      </h3>
      {Icon && <Icon size={16} className="text-slate-300 dark:text-slate-600" />}
    </div>
    <div className="h-[260px] w-full flex-1">{children}</div>
  </div>
);

const TelemetryTrendChart = () => (
  <ChartContainer title="Fleet-wide Telemetry Health (7D)" icon={Activity}>
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={FLEET_TRENDS}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
        <XAxis 
          dataKey="name" 
          axisLine={false} 
          tickLine={false} 
          tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} 
        />
        <YAxis 
          axisLine={false} 
          tickLine={false} 
          tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} 
        />
        <Tooltip 
          contentStyle={{ borderRadius: '16px', border: 'none', background: '#0f172a', color: '#fff', fontSize: '10px' }} 
          itemStyle={{ textTransform: 'uppercase', fontWeight: 800 }}
        />
        <Legend 
          iconType="circle" 
          wrapperStyle={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', tracking: '0.1em', paddingTop: '20px' }} 
        />
        <Line 
          type="monotone" 
          dataKey="avgSpeed" 
          name="Avg Speed (km/h)" 
          stroke="#3b82f6" 
          strokeWidth={4} 
          dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} 
          activeDot={{ r: 6, strokeWidth: 0 }} 
        />
        <Line 
          type="monotone" 
          dataKey="avgFuel" 
          name="Fuel Level (%)" 
          stroke="#10b981" 
          strokeWidth={4} 
          dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} 
          activeDot={{ r: 6, strokeWidth: 0 }} 
        />
      </LineChart>
    </ResponsiveContainer>
  </ChartContainer>
);

// --- WORKER VIEW (Operator Terminal) ---

const CATEGORY_MAP: Record<ReminderCategory, { icon: any, color: string, label: string }> = {
  safety: { icon: Shield, color: 'text-red-500', label: 'Safety' },
  machine: { icon: HardHat, color: 'text-blue-500', label: 'Machine' },
  route: { icon: MapPin, color: 'text-emerald-500', label: 'Route' },
  personal: { icon: Star, color: 'text-purple-500', label: 'Personal' }
};

const OperatorTerminal = ({ isSimulation, onExitSimulation }: { isSimulation?: boolean, onExitSimulation?: () => void }) => {
  const { user } = useAuth();
  
  const [reminders, setReminders] = useState<OperatorReminder[]>(() => {
    const saved = localStorage.getItem(`fleetops_reminders_${user?.id}`);
    return saved ? JSON.parse(saved) : [];
  });

  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [newReminderText, setNewReminderText] = useState('');
  const [newPriority, setNewPriority] = useState<ReminderPriority>('medium');
  const [newCategory, setNewCategory] = useState<ReminderCategory>('machine');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Issue Reporting State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportForm, setReportForm] = useState({
      type: 'mechanical' as 'safety' | 'mechanical' | 'electrical' | 'other',
      severity: 'medium' as 'low' | 'medium' | 'high' | 'critical',
      description: ''
  });

  useEffect(() => {
    localStorage.setItem(`fleetops_reminders_${user?.id}`, JSON.stringify(reminders));
  }, [reminders, user?.id]);

  const addReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminderText.trim()) return;
    const nr: OperatorReminder = {
      id: Date.now().toString(),
      date: selectedDate,
      text: newReminderText,
      completed: false,
      priority: newPriority,
      category: newCategory
    };
    setReminders([...reminders, nr]);
    setNewReminderText('');
    setIsAddModalOpen(false);
    toast.success('Reminder added to log');
  };

  const handleReportIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportForm.description.trim()) return;

    try {
        // 1. Log to system alerts
        await api.post('/alerts', {
            message: `[FIELD REPORT - ${user?.name}] ${reportForm.type.toUpperCase()} issue: ${reportForm.description}`,
            type: reportForm.type === 'safety' ? 'emergency' : 'maintenance',
            severity: reportForm.severity,
            timestamp: new Date().toISOString()
        });

        // 2. Log to maintenance queue if mechanical/electrical
        if (reportForm.type !== 'safety') {
            const savedMaintenance = localStorage.getItem('fleetops_maintenance');
            const records: MaintenanceRecord[] = savedMaintenance ? JSON.parse(savedMaintenance) : [];
            
            const newRecord: MaintenanceRecord = {
                id: `m-field-${Date.now()}`,
                machineId: '1', // Assumed current active machine
                type: reportForm.type === 'electrical' ? MaintenanceType.CORRECTIVE : MaintenanceType.INSPECTION,
                status: 'scheduled',
                title: `Field Report: ${reportForm.type.toUpperCase()} - ${reportForm.description.substring(0, 20)}...`,
                scheduledDate: new Date().toISOString(),
                costParts: 0,
                costLabor: 0,
                engineHoursAtService: 1250, // Mock current hours
                checklist: [],
                tenantId: user?.tenantId || 'mock-tenant-1',
                version: 1,
                createdBy: user?.id || 'operator',
                updatedBy: user?.id || 'operator',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            localStorage.setItem('fleetops_maintenance', JSON.stringify([newRecord, ...records]));
        }

        toast.success('Report transmitted to nexus');
        setIsReportModalOpen(false);
        setReportForm({ type: 'mechanical', severity: 'medium', description: '' });
    } catch (err) {
        toast.error('Transmission failure');
    }
  };

  const deleteReminder = (id: string) => {
    setReminders(reminders.filter(r => r.id !== id));
    toast.error('Reminder archived');
  };

  const toggleReminder = (id: string) => {
    setReminders(reminders.map(r => r.id === id ? { ...r, completed: !r.completed } : r));
  };

  const handleJumpToToday = () => {
    const today = new Date();
    setSelectedDate(today.toISOString().split('T')[0]);
    setCurrentMonth(today);
  };

  const dateFilteredReminders = useMemo(() => {
    return reminders.filter(r => r.date === selectedDate).sort((a, b) => {
        const priorityScore = { high: 3, medium: 2, low: 1 };
        return priorityScore[b.priority] - priorityScore[a.priority];
    });
  }, [reminders, selectedDate]);

  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(year, month, i);
      days.push({
        full: d.toISOString().split('T')[0],
        num: i
      });
    }
    return days;
  }, [currentMonth]);

  const changeMonth = (offset: number) => {
    const next = new Date(currentMonth);
    next.setMonth(currentMonth.getMonth() + offset);
    setCurrentMonth(next);
  };

  return (
    <div className="max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 px-2 pb-12">
      {/* Simulation Banner */}
      {isSimulation && (
        <div className="bg-amber-600 text-white rounded-2xl p-4 mb-8 flex items-center justify-between shadow-2xl animate-pulse">
           <div className="flex items-center gap-3">
              <Monitor size={20} />
              <div className="text-left">
                 <p className="text-[10px] font-black uppercase tracking-widest leading-none">Simulation Active</p>
                 <p className="text-[9px] font-medium opacity-80 mt-1 uppercase">Viewing Field Terminal As {user?.name}</p>
              </div>
           </div>
           <button 
            onClick={onExitSimulation}
            className="px-4 py-1.5 bg-white text-amber-700 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all"
           >
             Exit Simulation
           </button>
        </div>
      )}

      <div className="text-center mb-8">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase mb-2">Operator Terminal</h2>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">ID: <span className="text-blue-600 font-mono">{user?.name}</span></p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden mb-8 hover:shadow-blue-500/10 transition-all duration-500">
        <div className="p-8 md:p-10 relative">
          <div className="flex justify-between items-start mb-10">
            <div className="bg-blue-50 dark:bg-blue-900/30 px-4 py-1.5 rounded-full flex items-center gap-2 text-blue-600 dark:text-blue-400 font-black text-[9px] uppercase tracking-widest border border-blue-100 dark:border-blue-800">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping"></span> Active Duty
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl text-slate-400 border border-slate-100 dark:border-slate-800 shadow-inner"><Construction size={22} /></div>
          </div>
          <div className="mb-10 text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-widest mb-2 uppercase leading-none">EXC-01</h1>
            <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 font-medium italic">Excavator X1 | Sector B-4 Staging</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 shadow-inner">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Deployment Site</label>
              <div className="flex items-center gap-3 text-slate-900 dark:text-white font-black text-base"><MapPin size={18} className="text-red-500 shrink-0" /> Zone A Staging</div>
            </div>
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 shadow-inner">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Service Window</label>
              <div className="flex items-center gap-3 text-slate-900 dark:text-white font-black text-base"><Clock size={18} className="text-blue-500 shrink-0" /> 08:00 - 18:00</div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
              <button className="flex-[2] py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-lg shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 group uppercase tracking-widest">START DUTY <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" /></button>
              <button 
                onClick={() => setIsReportModalOpen(true)}
                className="flex-1 py-5 bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 border-2 border-red-100 dark:border-red-900/30 rounded-2xl font-black text-sm shadow-xl hover:bg-red-50 transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
              >
                  <AlertTriangle size={20} /> Report Issue
              </button>
          </div>
        </div>
      </div>

      {/* MISSION CALENDAR & REMINDERS */}
      <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-lg border border-slate-100 dark:border-slate-800 overflow-hidden mb-8 animate-in slide-in-from-bottom-2">
          <div className="p-6 border-b border-slate-50 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/30">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                <CalendarDays size={18} className="text-blue-500" /> Personal Mission Log
              </h3>
              <div className="flex items-center gap-2">
                <button 
                    onClick={handleJumpToToday}
                    className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-slate-50 transition-all text-slate-600 dark:text-slate-300 shadow-sm"
                >
                    Today
                </button>
                <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="p-2 bg-blue-600 text-white rounded-xl hover:scale-110 transition-all shadow-xl shadow-blue-500/20"
                >
                    <Plus size={20} />
                </button>
              </div>
          </div>
          
          <div className="p-6 space-y-8">
            <div className="space-y-4">
               <div className="flex items-center justify-between px-2">
                  <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-xs">
                    {currentMonth.toLocaleDateString([], { month: 'long', year: 'numeric' })}
                  </h4>
                  <div className="flex gap-2">
                     <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400"><ChevronLeft size={16}/></button>
                     <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400"><ChevronRight size={16}/></button>
                  </div>
               </div>

               <div className="grid grid-cols-7 gap-1">
                  {['S','M','T','W','T','F','S'].map(d => (
                    <div key={d} className="text-center text-[9px] font-black text-slate-300 dark:text-slate-600 py-1 uppercase">{d}</div>
                  ))}
                  {daysInMonth.map((d, i) => {
                    if (!d) return <div key={`pad-${i}`} className="h-10 w-full" />;
                    const isActive = selectedDate === d.full;
                    const isToday = new Date().toISOString().split('T')[0] === d.full;
                    const hasReminders = reminders.some(r => r.date === d.full);

                    return (
                      <button 
                        key={d.full}
                        onClick={() => setSelectedDate(d.full)}
                        className={`h-10 w-full rounded-xl flex flex-col items-center justify-center relative transition-all group ${
                          isActive 
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                            : isToday 
                              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 border border-blue-100 dark:border-blue-800' 
                              : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        <span className="text-xs font-black">{d.num}</span>
                        {hasReminders && (
                          <div className={`w-1 h-1 rounded-full absolute bottom-1.5 ${isActive ? 'bg-white' : 'bg-blue-500'}`}></div>
                        )}
                      </button>
                    );
                  })}
               </div>
            </div>

            <div className="space-y-4">
               <div className="flex items-center gap-3 px-1">
                  <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800"></div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{new Date(selectedDate).toLocaleDateString([], { month: 'short', day: 'numeric' })} Logs</span>
                  <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800"></div>
               </div>

               <div className="space-y-3 min-h-[140px]">
                  {dateFilteredReminders.length === 0 ? (
                    <div className="py-10 text-center opacity-30 flex flex-col items-center justify-center animate-in fade-in duration-500">
                        <Bell size={32} strokeWidth={1} className="mb-2" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Zero Private Notes</p>
                    </div>
                  ) : (
                    dateFilteredReminders.map(rem => {
                      const cat = CATEGORY_MAP[rem.category || 'machine'];
                      return (
                        <div key={rem.id} className="flex items-center gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 group animate-in slide-in-from-left duration-300 shadow-sm relative overflow-hidden">
                            {rem.priority === 'high' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>}
                            
                            <button 
                                onClick={() => toggleReminder(rem.id)}
                                className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 ${
                                rem.completed 
                                    ? 'bg-emerald-50 border-emerald-500 text-white' 
                                    : 'border-slate-200 dark:border-slate-700 hover:border-blue-500'
                                }`}
                            >
                                {rem.completed && <Check size={14} strokeWidth={4} />}
                            </button>
                            
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <cat.icon size={10} className={cat.color} />
                                    <span className={`text-[8px] font-black uppercase tracking-widest ${cat.color}`}>{cat.label}</span>
                                    {rem.priority === 'high' && <span className="text-[8px] font-black uppercase bg-red-50 dark:bg-red-900/30 text-red-600 px-1 rounded">Urgent</span>}
                                </div>
                                <p className={`text-[11px] font-bold tracking-tight uppercase leading-tight ${rem.completed ? 'line-through text-slate-400 italic' : 'text-slate-700 dark:text-slate-200'}`}>
                                    {rem.text}
                                </p>
                            </div>

                            <button 
                                onClick={() => deleteReminder(rem.id)}
                                className="p-2 text-slate-300 hover:text-red-500 transition-colors shrink-0"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                      );
                    })
                  )}
               </div>
            </div>
          </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-3"><div className="p-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg"><ClipboardList size={16} /></div> Operational Consistency</h3>
        {[ 'Pre-op checklist verified', 'Fuel levels cross-checked', 'Hazard mitigation active' ].map((task, i) => (
          <div key={i} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between group cursor-pointer hover:border-blue-500 dark:hover:border-blue-500 transition-all hover:translate-x-1">
            <div className="flex items-center gap-4 min-w-0"><div className="w-6 h-6 rounded-lg border-2 border-slate-200 dark:border-slate-700 group-hover:border-blue-500 group-hover:bg-blue-500/10 transition-all shrink-0 flex items-center justify-center text-transparent group-hover:text-blue-500"><Check size={14} strokeWidth={4} /></div><span className="text-slate-700 dark:text-slate-300 font-black text-[11px] truncate uppercase tracking-tight">{task}</span></div>
            <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-500 shrink-0 group-hover:translate-x-1 transition-all" />
          </div>
        ))}
      </div>

      {/* Add Reminder Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[5000] flex items-end sm:items-center justify-center p-0 sm:p-4">
           <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl border-t border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom-20 duration-500 overflow-hidden">
              <div className="p-8 space-y-6">
                 <div className="flex justify-between items-center">
                    <div>
                       <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">New Mission Note</h3>
                       <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Private Terminal Record</p>
                    </div>
                    <button onClick={() => setIsAddModalOpen(false)} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400"><X size={24} /></button>
                 </div>
                 
                 <form onSubmit={addReminder} className="space-y-6">
                    <div>
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Target Date</label>
                       <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] shadow-inner text-center text-xs">
                          {new Date(selectedDate).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Class</label>
                            <div className="relative">
                                <select 
                                    value={newCategory} 
                                    onChange={e => setNewCategory(e.target.value as ReminderCategory)}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-[10px] font-black uppercase tracking-widest outline-none appearance-none cursor-pointer"
                                >
                                    {Object.entries(CATEGORY_MAP).map(([key, val]) => (
                                        <option key={key} value={key}>{val.label.toUpperCase()}</option>
                                    ))}
                                </select>
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Priority</label>
                            <div className="relative">
                                <select 
                                    value={newPriority} 
                                    onChange={e => setNewPriority(e.target.value as ReminderPriority)}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-[10px] font-black uppercase tracking-widest outline-none appearance-none cursor-pointer"
                                >
                                    <option value="low">LOW</option>
                                    <option value="medium">MEDIUM</option>
                                    <option value="high">HIGH (URGENT)</option>
                                </select>
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    <div>
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Reminder Payload</label>
                       <textarea 
                        required
                        autoFocus
                        value={newReminderText}
                        onChange={e => setNewReminderText(e.target.value)}
                        placeholder="e.g. Verify fuel card for Sector C"
                        className="w-full p-5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all resize-none shadow-inner"
                        rows={3}
                       />
                    </div>

                    <div className="pt-2">
                       <button 
                        type="submit"
                        className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-blue-500/40 active:scale-95 transition-all flex items-center justify-center gap-3"
                       >
                         <Save size={18} /> Authorize Record
                       </button>
                    </div>
                 </form>
              </div>
           </div>
        </div>
      )}

      {/* Report Issue Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[5000] flex items-end sm:items-center justify-center p-0 sm:p-4">
           <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom-20 duration-500 overflow-hidden">
                <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-red-50/50 dark:bg-red-950/20 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-600 text-white rounded-2xl shadow-xl shadow-red-500/20"><Hammer size={24} /></div>
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Field Fault Report</h3>
                            <p className="text-[10px] text-red-600 font-black uppercase tracking-[0.2em] mt-1.5">Emergency maintenance / safety log</p>
                        </div>
                    </div>
                    <button onClick={() => setIsReportModalOpen(false)} className="p-3 hover:bg-white dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400"><X size={24}/></button>
                </div>
                
                <form onSubmit={handleReportIssue} className="p-10 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Fault Domain</label>
                            <div className="relative">
                                <select 
                                    value={reportForm.type}
                                    onChange={e => setReportForm({...reportForm, type: e.target.value as any})}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl pl-12 pr-12 py-4 text-sm font-black text-slate-900 dark:text-white appearance-none cursor-pointer focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all shadow-sm"
                                >
                                    <option value="mechanical">MECHANICAL</option>
                                    <option value="electrical">ELECTRICAL</option>
                                    <option value="safety">SAFETY INCIDENT</option>
                                    <option value="other">OTHER / LOGISTIC</option>
                                </select>
                                <Settings2 size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Field Severity</label>
                            <div className="relative">
                                <select 
                                    value={reportForm.severity}
                                    onChange={e => setReportForm({...reportForm, severity: e.target.value as any})}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl pl-12 pr-12 py-4 text-sm font-black text-slate-900 dark:text-white appearance-none cursor-pointer focus:ring-4 focus:ring-blue-500/10 focus:border-red-500 outline-none transition-all shadow-sm"
                                >
                                    <option value="low">LOW (OBSERVATION)</option>
                                    <option value="medium">MEDIUM (ACTION REQUIRED)</option>
                                    <option value="high">HIGH (IMMEDIATE ACTION)</option>
                                    <option value="critical">CRITICAL (SHUTDOWN)</option>
                                </select>
                                <AlertOctagon size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 ${reportForm.severity === 'critical' ? 'text-red-600 animate-pulse' : 'text-slate-400'}`} />
                                <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Technical Observation</label>
                        <textarea 
                            required
                            value={reportForm.description}
                            onChange={e => setReportForm({...reportForm, description: e.target.value})}
                            placeholder="Describe the failure, leak, or hazard in detail..."
                            className="w-full p-6 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl text-sm font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all resize-none shadow-inner"
                            rows={4}
                        />
                    </div>

                    <div className="p-6 bg-red-50 dark:bg-red-950/20 border-2 border-dashed border-red-200 dark:border-red-900/40 rounded-[2rem] flex items-start gap-4">
                        <Zap size={24} className="text-red-600 shrink-0 mt-1" />
                        <p className="text-[10px] text-red-800 dark:text-red-300 font-bold leading-relaxed uppercase">
                            Operational Protocol: Submitting this report will broadcast an immediate priority alert to all site supervisors and inject a service task into the global maintenance nexus.
                        </p>
                    </div>

                    <div className="flex gap-4 pt-4 sticky bottom-0 bg-white dark:bg-slate-900 py-4 border-t border-slate-50 dark:border-slate-800">
                        <button type="button" onClick={() => setIsReportModalOpen(false)} className="flex-1 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">Abort</button>
                        <button 
                            type="submit" 
                            className="flex-[2] py-5 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-red-500/40 active:scale-95 transition-all flex items-center justify-center gap-3"
                        >
                            <Send size={18} /> TRANSMIT FIELD REPORT
                        </button>
                    </div>
                </form>
           </div>
        </div>
      )}
    </div>
  );
};

// --- GLOBAL COMMAND VIEW (Super Admin / Tenant Admin) ---
const GlobalCommandDashboard = ({ onSimulate }: { onSimulate: () => void }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [dateRange, setDateRange] = useState<'day' | 'week' | 'month' | 'custom'>('week');
  const [customDates, setCustomDates] = useState({ start: '', end: '' });

  const { data: stats, isLoading } = useQuery({ queryKey: ['fleet-stats'], queryFn: () => api.get<any>('/stats') });
  
  const statusDist = useMemo(() => [
    { name: 'Active', value: stats?.active || 0, color: '#10b981' },
    { name: 'Idle', value: stats?.idle || 0, color: '#f59e0b' },
    { name: 'Service', value: stats?.maintenance || 0, color: '#ef4444' },
    { name: 'Offline', value: stats?.offline || 0, color: '#64748b' },
  ], [stats]);

  const handleExport = async () => {
    setExportLoading(true);
    try {
      let start = '';
      const now = new Date();
      if (dateRange === 'day') start = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      else if (dateRange === 'week') start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      else if (dateRange === 'month') start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      else if (dateRange === 'custom') {
        if (!customDates.start) {
            toast.error('Start date required for custom range');
            setExportLoading(false);
            return;
        }
        start = new Date(customDates.start).toISOString();
      }

      const end = (dateRange === 'custom' && customDates.end) ? new Date(customDates.end).toISOString() : now.toISOString();

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/analytics/export?start=${start}&end=${end}`, {
          headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Export service unavailable');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fleetops-audit-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Audit logs compiled and transmitted');
      setIsExportModalOpen(false);
    } catch (error) {
      toast.error('Audit export protocol failure');
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-700 space-y-8">
      <DashboardHeader 
        title="Global Mission Control" 
        subtitle="Consolidated organizational telemetry and enterprise risk assessment." 
        actions={
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
             <button onClick={onSimulate} className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 transition-all active:scale-95"><Terminal size={14} /> Simulate Node</button>
             <button onClick={() => setIsImportModalOpen(true)} className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95"><FileUp size={14} /> Smart Import</button>
             <button onClick={() => setIsExportModalOpen(true)} className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-700 dark:text-white shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95"><Download size={14} /> Audit</button>
          </div>
        } 
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-in slide-in-from-bottom-4 duration-500">
        <KpiCard label="Global Fleet" value={isLoading ? '-' : stats?.total} sub="Total Assets" icon={Truck} color="text-blue-600" bg="bg-blue-50 dark:bg-blue-950/20" onClick={() => navigate('/app/vehicles')}/>
        <KpiCard label="Peak Utilization" value="94.2%" sub="Efficiency Core" icon={TrendingUp} color="text-emerald-600" bg="bg-emerald-50 dark:bg-emerald-950/20" trend="up"/>
        <KpiCard label="Safety Alert Load" value={stats?.critical_alerts || 0} sub="Requiring Action" icon={ShieldAlert} color="text-red-600" bg="bg-red-50 dark:bg-red-950/20" onClick={() => navigate('/app/alerts')}/>
        <KpiCard label="Monthly Cost (Est)" value="$42.5K" sub="-2.4% vs Previous" icon={Fuel} color="text-indigo-600" bg="bg-indigo-50 dark:bg-indigo-950/20" trend="down"/>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <ChartContainer title="Organizational Throughput (Last 7 Days)" className="xl:col-span-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={FLEET_TRENDS}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', background: '#0f172a', color: '#fff', fontSize: '10px' }} />
              <Area type="stepAfter" dataKey="active" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} strokeWidth={4} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>

        <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col hover:shadow-lg dark:hover:shadow-slate-900/50 transition-all duration-300">
          <h3 className="font-black text-slate-900 dark:text-white mb-10 uppercase text-[11px] tracking-tight">Mission Readiness Profile</h3>
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="h-44 w-44 relative mb-10 group">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusDist} innerRadius={60} outerRadius={80} paddingAngle={8} dataKey="value" stroke="none">
                    {statusDist.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none group-hover:scale-110 transition-transform duration-500">
                <span className="text-3xl font-black text-slate-900 dark:text-white leading-none">
                  {stats ? Math.round((stats.active / stats.total) * 100) : 0}%
                </span>
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1.5">Operational</span>
              </div>
            </div>
            <div className="w-full grid grid-cols-2 gap-4">
              {statusDist.map((item, i) => (
                <div key={i} className="flex flex-col p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 hover:border-blue-500/30 transition-all">
                  <span className="flex items-center gap-2 text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></span> {item.name}
                  </span>
                  <span className="text-lg font-black text-slate-900 dark:text-white leading-none tabular-nums">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 animate-in fade-in duration-1000">
        <TelemetryTrendChart />
      </div>

      <ImportModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
        onComplete={() => {
          queryClient.invalidateQueries({ queryKey: ['fleet-stats'] });
          queryClient.invalidateQueries({ queryKey: ['vehicles'] });
        }} 
      />

      {/* Export Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[5000] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in duration-200">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/50">
               <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter flex items-center gap-3">
                    <FileSpreadsheet size={22} className="text-blue-600" /> Operational Audit
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-[0.2em] mt-1">Exporting telemetry and state logs</p>
               </div>
               <button onClick={() => setIsExportModalOpen(false)} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400"><X size={24}/></button>
            </div>
            
            <div className="p-10 space-y-8">
               <div className="space-y-4">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Temporal Window</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'day', label: 'Last 24 Hours', icon: Clock },
                      { id: 'week', label: 'Last 7 Days', icon: Activity },
                      { id: 'month', label: 'Last 30 Days', icon: Calendar },
                      { id: 'custom', label: 'Custom Range', icon: Edit3 },
                    ].map(opt => (
                      <button 
                        key={opt.id}
                        onClick={() => setDateRange(opt.id as any)}
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left group ${dateRange === opt.id ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/20 shadow-lg dark:shadow-blue-500/10' : 'border-slate-100 dark:border-slate-800 hover:border-blue-300'}`}
                      >
                        <opt.icon size={18} className={dateRange === opt.id ? 'text-blue-600' : 'text-slate-400'} />
                        <span className={`text-[10px] font-black uppercase tracking-tight ${dateRange === opt.id ? 'text-blue-700 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'}`}>{opt.label}</span>
                      </button>
                    ))}
                  </div>
               </div>

               {dateRange === 'custom' && (
                 <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Start Node</label>
                      <input 
                        type="date" 
                        value={customDates.start}
                        onChange={e => setCustomDates({...customDates, start: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-blue-500/10" 
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">End Node</label>
                      <input 
                        type="date" 
                        value={customDates.end}
                        onChange={e => setCustomDates({...customDates, end: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-blue-500/10" 
                      />
                    </div>
                 </div>
               )}

               <div className="bg-blue-50 dark:bg-blue-900/10 border-2 border-dashed border-blue-100 dark:border-blue-900/30 p-6 rounded-3xl flex items-start gap-4">
                  <Info className="text-blue-600 mt-1 shrink-0" size={18} />
                  <p className="text-[10px] text-blue-800 dark:text-blue-300 font-bold leading-relaxed uppercase">
                    Audit protocol: Export will generate a structured CSV document containing high-fidelity telemetry packets and operational state transitions for the selected period.
                  </p>
               </div>

               <div className="pt-4 flex gap-4">
                  <button onClick={() => setIsExportModalOpen(false)} className="flex-1 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-slate-600 transition-colors">Discard</button>
                  <button 
                    onClick={handleExport}
                    disabled={exportLoading}
                    className="flex-[2] py-5 bg-slate-900 dark:bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {exportLoading ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
                    INITIATE TRANSMISSION
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const InventoryManagerView = () => {
  const navigate = useNavigate();
  return (
    <div className="animate-in fade-in duration-700">
      <DashboardHeader title="Inventory Command" subtitle="Stock velocity and logistics pipeline nexus." actions={<button onClick={() => navigate('/app/inventory')} className="px-6 py-3 bg-purple-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-2xl hover:bg-purple-700 transition-all active:scale-95">SKU Registry</button>} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 animate-in slide-in-from-bottom-4 duration-500">
        <KpiCard label="Global Valuation" value="$242.5K" sub="Asset Capital" icon={Box} color="text-purple-600" bg="bg-purple-50 dark:bg-purple-950/20" />
        <KpiCard label="Low Stock SKUs" value="14" sub="Immediate Reorder" icon={AlertTriangle} color="text-red-600" bg="bg-red-50 dark:bg-red-950/20" trend="up" onClick={() => navigate('/app/inventory')}/>
        <KpiCard label="Turnover Rate" value="2.4" sub="Monthly Velocity" icon={Layers} color="text-blue-600" bg="bg-blue-50 dark:bg-blue-900/20"/>
        <KpiCard label="Procurement Open" value="5" sub="Awaiting Delivery" icon={ShoppingCart} color="text-emerald-600" bg="bg-emerald-50 dark:bg-emerald-950/20"/>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <ChartContainer title="SKU Velocity Pattern" className="xl:col-span-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[ { name: 'Filters', in: 150, out: 120 }, { name: 'Brakes', in: 40, out: 38 }, { name: 'Fluids', in: 200, out: 185 }, { name: 'Tires', in: 12, out: 14 } ]}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 800, fill: '#94a3b8' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 800, fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', background: '#0f172a', color: '#fff', fontSize: '10px' }} />
              <Bar dataKey="in" name="Restocked" fill="#818cf8" radius={[4, 4, 0, 0]} barSize={24} />
              <Bar dataKey="out" name="Deployed" fill="#fb7185" radius={[4, 4, 0, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
        <div className="bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-slate-800 p-8 shadow-sm hover:shadow-lg dark:hover:shadow-purple-500/5 transition-all">
          <h3 className="font-black text-slate-900 dark:text-white mb-8 uppercase text-[11px] tracking-tight flex items-center gap-3">
             <Barcode size={16} className="text-purple-500" /> Procurement Alert
          </h3>
          <div className="space-y-4">
            {[ { name: 'Oil Filter X500', qty: 2, min: 10 }, { name: 'Brake Pad Set', qty: 1, min: 5 } ].map((item, i) => (
              <div key={i} className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 flex justify-between items-center group cursor-pointer hover:scale-[1.02] transition-transform">
                <div><p className="text-[11px] font-black text-red-900 dark:text-red-400 uppercase tracking-tight">{item.name}</p><p className="text-[8px] text-red-400 font-bold mt-1 uppercase">Threshold: {item.min} units</p></div>
                <div className="text-right"><p className="text-xl font-black text-red-600">{item.qty}</p></div>
              </div>
            ))}
          </div>
          <button className="w-full mt-8 py-4 bg-purple-600 text-white rounded-xl font-black text-[9px] uppercase tracking-[0.2em] shadow-xl hover:bg-purple-700 transition-all">Bulk Procurement</button>
        </div>
      </div>
    </div>
  );
};

// Added missing FleetManagerDashboard component
const FleetManagerDashboard = () => {
  const navigate = useNavigate();
  return (
    <div className="animate-in fade-in duration-700 space-y-8">
      <DashboardHeader title="Fleet Operations" subtitle="Fleet-wide health and deployment logistics." actions={<button onClick={() => navigate('/app/vehicles')} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95">Vehicle Registry</button>} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Active Fleet" value="42" sub="In Operation" icon={Truck} color="text-blue-600" bg="bg-blue-50 dark:bg-blue-950/20" />
        <KpiCard label="Fuel Avg" value="68%" sub="Fleet Level" icon={Fuel} color="text-orange-600" bg="bg-orange-50 dark:bg-orange-950/20" />
        <KpiCard label="Utilization" value="88%" sub="Efficiency" icon={TrendingUp} color="text-emerald-600" bg="bg-emerald-50 dark:bg-emerald-950/20" trend="up" />
        <KpiCard label="Alerts" value="5" sub="Pending Action" icon={AlertTriangle} color="text-red-600" bg="bg-red-50 dark:bg-red-950/20" onClick={() => navigate('/app/alerts')} />
      </div>
      <div className="grid grid-cols-1 gap-6">
        <TelemetryTrendChart />
      </div>
    </div>
  );
};

// Added missing MaintenanceManagerDashboard component
const MaintenanceManagerDashboard = () => {
  const navigate = useNavigate();
  return (
    <div className="animate-in fade-in duration-700 space-y-8">
      <DashboardHeader title="Maintenance Control" subtitle="Predictive lifecycle and asset health monitoring." actions={<button onClick={() => navigate('/app/maintenance')} className="px-6 py-3 bg-orange-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-orange-500/20 hover:bg-orange-700 transition-all active:scale-95">Schedule Service</button>} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard label="In Service" value="12" sub="Current repairs" icon={Wrench} color="text-orange-600" bg="bg-orange-50 dark:bg-orange-950/20" />
        <KpiCard label="Planned" value="8" sub="Next 7 days" icon={Calendar} color="text-blue-600" bg="bg-blue-50 dark:bg-blue-950/20" />
        <KpiCard label="Safety Faults" value="3" sub="Critical" icon={AlertTriangle} color="text-red-600" bg="bg-red-50 dark:bg-red-950/20" onClick={() => navigate('/app/alerts')} />
        <KpiCard label="Parts Cost" value="$12.4K" sub="Current Month" icon={BarChart3} color="text-indigo-600" bg="bg-indigo-50 dark:bg-indigo-950/20" />
      </div>
    </div>
  );
};

// Added missing SiteManagerDashboard component
const SiteManagerDashboard = () => {
  const navigate = useNavigate();
  return (
    <div className="animate-in fade-in duration-700 space-y-8">
      <DashboardHeader title="Site Command" subtitle="Localized site efficiency and personnel coordination." actions={<button onClick={() => navigate('/app/map')} className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:bg-emerald-700 transition-all active:scale-95">Live Site Map</button>} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Operators" value="28" sub="On site" icon={Users} color="text-blue-600" bg="bg-blue-50 dark:bg-blue-950/20" />
        <KpiCard label="Work Orders" value="15" sub="Active today" icon={Briefcase} color="text-indigo-600" bg="bg-indigo-50 dark:bg-indigo-950/20" />
        <KpiCard label="Site Safety" value="99.8" sub="Index score" icon={ShieldAlert} color="text-emerald-600" bg="bg-emerald-50 dark:bg-emerald-950/20" trend="up" />
        <KpiCard label="SOS Alerts" value="0" sub="Zero incidents" icon={Siren} color="text-slate-600" bg="bg-slate-50 dark:bg-slate-950/20" />
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---
export const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Simulation Engine State
  const [debugRole, setDebugRole] = useState<Role | null>(null);

  const isAdmin = user?.role === Role.SUPER_ADMIN || user?.role === Role.TENANT_ADMIN;
  const currentRole = debugRole || user?.role;

  return (
    <div className="pb-10">
      {(() => {
        switch (currentRole) {
          case Role.DRIVER:
          case Role.MAINTENANCE_WORKER:
          case Role.INVENTORY_WORKER:
            return <OperatorTerminal isSimulation={!!debugRole} onExitSimulation={() => setDebugRole(null)} />;
          
          case Role.FLEET_MANAGER:
            return <FleetManagerDashboard />;
          
          case Role.MAINTENANCE_MANAGER:
          case Role.MAINTENANCE_LEAD:
            return <MaintenanceManagerDashboard />;

          case Role.INVENTORY_MANAGER:
            return <InventoryManagerView />; 
            
          case Role.SITE_MANAGER:
          case Role.SUPERVISOR:
            return <SiteManagerDashboard />;
          
          case Role.SUPER_ADMIN:
          case Role.TENANT_ADMIN:
          case Role.VIEWER: 
            return <GlobalCommandDashboard onSimulate={() => setDebugRole(Role.DRIVER)} />;
          
          default:
            return (
              <div className="flex flex-col items-center justify-center py-24 text-center px-6 animate-in zoom-in duration-700">
                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-900 rounded-3xl flex items-center justify-center text-slate-400 mb-8 border-2 border-dashed border-slate-200 dark:border-slate-800"><ShieldAlert size={40} /></div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter mb-3 uppercase">Access Point Restricted</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-10 max-w-sm font-medium leading-relaxed italic">Your organizational node does not have an active dashboard subscription. Contact command for authorization.</p>
                <button onClick={() => navigate('/app/map')} className="px-10 py-4 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-blue-500/40 hover:scale-105 active:scale-95 transition-all">Navigate to Site Map</button>
              </div>
            );
        }
      })()}
    </div>
  );
};
