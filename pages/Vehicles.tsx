
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api.ts'; 
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Search, Plus, Battery, Gauge, 
  ChevronLeft, ChevronRight, Loader2, ChevronDown, Filter,
  Truck, XCircle, Download, Check, X
} from 'lucide-react';
import { Vehicle, FuelType } from '../types.ts';
import { PermissionGuard } from '../components/Guard.tsx';
import { AssetCard } from '../components/AssetCard.tsx';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

// --- DEBOUNCE HOOK ---
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

interface VehiclesResponse {
    data: Vehicle[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

const MultiStatusFilter = ({ 
  selected, 
  onChange 
}: { 
  selected: string[], 
  onChange: (statuses: string[]) => void 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const options = [
    { label: 'Active', value: 'active', color: 'bg-emerald-500' },
    { label: 'Idle', value: 'idle', color: 'bg-amber-500' },
    { label: 'Maintenance', value: 'maintenance', color: 'bg-orange-500' },
    { label: 'Offline', value: 'offline', color: 'bg-slate-400' }
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleStatus = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    if (selected.includes(normalizedStatus)) {
      onChange(selected.filter(s => s !== normalizedStatus));
    } else {
      onChange([...selected, normalizedStatus]);
    }
  };

  const handleSelectAll = () => {
    if (selected.length === options.length) {
      onChange([]);
    } else {
      onChange(options.map(o => o.value));
    }
  };

  const displayText = useMemo(() => {
    if (selected.length === 0) return 'All Operational States';
    if (selected.length === options.length) return 'Global Fleet';
    return `${selected.length} States Selected`;
  }, [selected, options.length]);

  return (
    <div className="relative w-full lg:w-72" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between pl-6 pr-5 py-3.5 bg-white dark:bg-slate-900 border rounded-2xl text-xs font-black uppercase tracking-[0.1em] focus:outline-none focus:ring-4 focus:ring-blue-500/10 cursor-pointer shadow-sm transition-all group ${
          selected.length > 0 
            ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
            : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white hover:border-blue-300 dark:hover:border-slate-600'
        }`}
      >
        <div className="flex items-center gap-3 truncate">
          <Filter size={18} className={selected.length > 0 ? 'text-blue-600' : 'text-slate-400'} />
          <span className="truncate">{displayText}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {selected.length > 0 && (
            <div className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-blue-600 text-white text-[9px] font-black shadow-lg shadow-blue-500/30">
              {selected.length}
            </div>
          )}
          <ChevronDown size={18} className={`text-slate-400 transition-transform duration-300 group-hover:text-blue-500 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl z-[100] py-3 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-50 dark:border-slate-800 mb-2 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/50">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Select Target States</span>
            <button 
              onClick={handleSelectAll}
              className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase hover:underline tracking-widest"
            >
              {selected.length === options.length ? 'Clear' : 'Select All'}
            </button>
          </div>
          
          <div className="px-2 space-y-1">
            {options.map((opt) => {
              const isActive = selected.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  onClick={() => toggleStatus(opt.value)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group ${
                    isActive 
                      ? 'bg-blue-50/50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400' 
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${
                      isActive 
                        ? 'bg-blue-600 border-blue-600 shadow-lg shadow-blue-500/30' 
                        : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 group-hover:border-blue-400'
                    }`}>
                      {isActive && <Check className="text-white" size={12} strokeWidth={4} />}
                    </div>
                    <div className="flex items-center gap-2">
                       <div className={`w-2 h-2 rounded-full ${opt.color}`}></div>
                       <span className="text-xs font-black uppercase tracking-widest">
                         {opt.label}
                       </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export const Vehicles = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const page = parseInt(searchParams.get('page') || '1');
  const querySearch = searchParams.get('search') || '';
  const [localSearch, setLocalSearch] = useState(querySearch);
  const debouncedSearch = useDebounce(localSearch, 500);

  const selectedStatuses = useMemo(() => 
    searchParams.get('status')?.split(',').filter(Boolean) || [],
    [searchParams]
  );
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  useEffect(() => {
    setLocalSearch(querySearch);
  }, [querySearch]);

  useEffect(() => {
    setSearchParams(prev => {
        const params = new URLSearchParams(prev);
        if (debouncedSearch) params.set('search', debouncedSearch);
        else params.delete('search');
        params.set('page', '1'); 
        return params;
    });
  }, [debouncedSearch, setSearchParams]);

  const setStatuses = (statuses: string[]) => {
      setSearchParams(prev => {
          const params = new URLSearchParams(prev);
          if (statuses.length === 0) params.delete('status');
          else params.set('status', statuses.join(','));
          params.set('page', '1');
          return params;
      });
  };

  const setPage = (p: number) => {
    setSearchParams(prev => {
      const params = new URLSearchParams(prev);
      params.set('page', p.toString());
      return params;
    });
  };
  
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['vehicles', page, querySearch, selectedStatuses],
    queryFn: async () => {
      const statusParam = selectedStatuses.length > 0 ? selectedStatuses.join(',') : 'all';
      return await api.get<VehiclesResponse>(`/vehicles?page=${page}&limit=12&search=${querySearch}&status=${statusParam}`);
    },
  });

  const vehicles = data?.data || [];
  const meta = data?.meta || { total: 0, totalPages: 1 };

  const handleExport = () => {
    if (vehicles.length === 0) return toast.error('No asset data available for export');
    
    const exportData = vehicles.map(v => ({
      'Asset ID': v.id,
      'Designation': v.name,
      'Make': v.make,
      'Model': v.model,
      'VIN': v.vin,
      'Status': v.status.toUpperCase(),
      'Fuel Type': v.fuelType,
      'Fuel Level (%)': v.fuelLevel,
      'Engine Hours': v.engineHours,
      'Last Seen': v.lastSeen
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Machine Registry");
    XLSX.writeFile(wb, `FleetOps_Machines_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Machine Registry exported');
  };

  const addVehicleMutation = useMutation({
    mutationFn: (newVehicle: Partial<Vehicle>) => api.post('/vehicles', newVehicle),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      setIsCreateModalOpen(false);
      toast.success('Asset Provisioned Successfully');
    },
    onError: () => toast.error('Provisioning Protocol Failure')
  });

  const [newVehicleForm, setNewVehicleForm] = useState({
    name: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    vin: '',
    fuelType: FuelType.DIESEL,
    status: 'active' as const
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addVehicleMutation.mutate(newVehicleForm);
  };

  const handleVehicleClick = (vehicleId: string) => {
    navigate(`/app/vehicles/${vehicleId}`);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-700">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 shrink-0 px-1 text-left animate-in slide-in-from-top-1 duration-500">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none mb-2">Fleet Registry</h2>
          <div className="flex items-center gap-2">
             <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
               {meta.total.toLocaleString()} Enterprise terminals identified in the current buffer.
             </p>
             {(isFetching || isLoading) && <Loader2 size={14} className="animate-spin text-blue-500"/>}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <button 
                onClick={handleExport}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white px-6 py-3.5 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 shadow-sm w-full lg:w-auto hover:bg-slate-50"
            >
                <Download size={16} /> Global Export
            </button>
            
            <PermissionGuard moduleId="vehicles">
                <button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3.5 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-blue-500/20 w-full lg:w-auto"
                >
                    <Plus size={16} /> Provision Asset
                </button>
            </PermissionGuard>
        </div>
      </div>

      {/* Filter Console */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row gap-4 items-center justify-between shrink-0 mx-1 sm:mx-0 animate-in slide-in-from-bottom-2 duration-500">
        <div className="relative w-full lg:max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Filter by VIN, Designation or Asset ID..." 
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white transition-all shadow-inner"
          />
          {localSearch && (
              <button 
                onClick={() => setLocalSearch('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 dark:hover:text-slate-100 transition-colors"
              >
                  <XCircle size={16} />
              </button>
          )}
        </div>
        <MultiStatusFilter selected={selectedStatuses} onChange={setStatuses} />
      </div>

      {/* Registry Grid */}
      <div className="px-1 sm:px-0">
          {isLoading && !data ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                 {[1,2,3,4,5,6,7,8].map(i => (
                     <div key={i} className="bg-white dark:bg-slate-800 rounded-[2rem] h-64 animate-pulse border border-slate-100 dark:border-slate-800 shadow-sm"></div>
                 ))}
              </div>
          ) : vehicles.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-24 text-center opacity-50 bg-white/50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 animate-in zoom-in duration-700">
               <div className="w-20 h-20 bg-slate-100 dark:bg-slate-900 rounded-3xl flex items-center justify-center text-slate-300 mb-6 border border-slate-100 dark:border-slate-800 shadow-inner">
                  <Truck size={40} />
               </div>
               <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Zero Match Protocol</h3>
               <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium max-w-xs mx-auto">No assets found matching the current telemetry filters. Try broadening your selection criteria.</p>
               <button 
                onClick={() => { setStatuses([]); setLocalSearch(''); }}
                className="mt-8 px-6 py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all"
               >
                 Clear Parameters
               </button>
            </div>
          ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 pb-8">
                {vehicles.map((vehicle) => (
                  <AssetCard 
                    key={vehicle.id} 
                    vehicle={vehicle} 
                    onClick={handleVehicleClick} 
                  />
                ))}
             </div>
          )}
      </div>

      <div className="py-5 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 bg-white dark:bg-slate-900 px-8 rounded-[2rem] shadow-sm mx-1 sm:mx-0 animate-in slide-in-from-bottom-2 duration-500">
          <button 
            disabled={page === 1 || isFetching}
            onClick={() => setPage(page - 1)}
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
          >
              <ChevronLeft size={16} /> PREVIOUS
          </button>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-4">
              REGISTRY NODE <span className="text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-4 py-1.5 rounded-lg font-mono border border-slate-200 dark:border-slate-700 shadow-inner">{page} / {meta.totalPages || 1}</span>
          </span>
          <button 
            disabled={page >= meta.totalPages || isFetching}
            onClick={() => setPage(page + 1)}
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
          >
              NEXT <ChevronRight size={16} />
          </button>
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[5000] flex items-center justify-center p-4 animate-in fade-in duration-300">
           <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in duration-200 text-left">
                <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/50">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-xl"><Truck size={24} /></div>
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Provision Asset</h3>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-[0.2em] mt-1.5">Adding high-value equipment to registry</p>
                        </div>
                    </div>
                    <button onClick={() => setIsCreateModalOpen(false)} className="p-3 hover:bg-white dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400"><X size={24}/></button>
                </div>
                
                <form onSubmit={handleAddSubmit} className="p-10 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Asset Designation</label>
                            <input required type="text" value={newVehicleForm.name} onChange={e => setNewVehicleForm({...newVehicleForm, name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-sm font-black text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-inner" placeholder="e.g. Excavator X1" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Manufacturer (Make)</label>
                            <input required type="text" value={newVehicleForm.make} onChange={e => setNewVehicleForm({...newVehicleForm, make: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-sm font-black text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-inner" placeholder="e.g. Caterpillar" />
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Equipment Model</label>
                            <input required type="text" value={newVehicleForm.model} onChange={e => setNewVehicleForm({...newVehicleForm, model: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-sm font-black text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-inner" placeholder="e.g. 320 GC" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Asset VIN / Serial</label>
                            <input required type="text" value={newVehicleForm.vin} onChange={e => setNewVehicleForm({...newVehicleForm, vin: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-sm font-mono font-black text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-inner" placeholder="ID-0000-XXXX" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Energy Variant</label>
                            <div className="relative">
                                <select value={newVehicleForm.fuelType} onChange={e => setNewVehicleForm({...newVehicleForm, fuelType: e.target.value as FuelType})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-sm font-black text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-blue-500/10 appearance-none cursor-pointer">
                                    {Object.values(FuelType).map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                                <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Initial Status</label>
                            <div className="relative">
                                <select value={newVehicleForm.status} onChange={e => setNewVehicleForm({...newVehicleForm, status: e.target.value as any})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-sm font-black text-slate-900 dark:text-white appearance-none cursor-pointer focus:ring-4 focus:ring-blue-500/10 appearance-none cursor-pointer">
                                    <option value="active">Active Duty</option>
                                    <option value="maintenance">Maintenance</option>
                                    <option value="offline">Offline / Staged</option>
                                </select>
                                <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button type="button" onClick={() => setIsCreateModalOpen(false)} className="flex-1 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">Discard</button>
                        <button type="submit" disabled={addVehicleMutation.isPending} className="flex-[2] py-5 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3">
                            {addVehicleMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <Check size={18}/>} AUTHORIZE PROVISIONING
                        </button>
                    </div>
                </form>
           </div>
        </div>
      )}
    </div>
  );
};
