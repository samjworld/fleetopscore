
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Package, Search, Plus, AlertTriangle, CheckCircle, ArrowRight, 
  Filter, Download, X, ShoppingCart, ShieldAlert,
  ScanBarcode, Truck, Barcode, Loader2, Edit3, Settings2, BellRing,
  Info, TrendingDown, Save, Layers, Box, Zap, ChevronDown, RotateCcw,
  Maximize, Camera, Smartphone, Scan
} from 'lucide-react';
import { MOCK_VEHICLES } from '../constants.ts';
import { api } from '../services/api.ts';
import toast from 'react-hot-toast';

// --- SUB-COMPONENTS ---

const KpiCard = ({ label, value, sub, icon: Icon, color, bg, onClick, active }: any) => (
  <button 
    onClick={onClick}
    className={`flex-1 min-w-[240px] text-left bg-white dark:bg-slate-800 rounded-2xl shadow-sm border p-6 transition-all relative overflow-hidden group ${
      active 
        ? 'ring-4 ring-blue-500/20 border-blue-500 shadow-blue-100 dark:shadow-blue-900/20' 
        : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md'
    }`}
  >
    <div className="relative z-10 flex justify-between">
      <div>
        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{label}</p>
        <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{value}</h3>
        <p className="text-xs mt-2 font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          {sub}
        </p>
      </div>
      <div className={`p-4 rounded-2xl ${bg} ${color} shadow-inner transition-transform group-hover:scale-110 duration-500`}>
        <Icon size={24} />
      </div>
    </div>
    <div className={`absolute -right-8 -bottom-8 w-32 h-32 rounded-full ${bg} opacity-5 group-hover:opacity-10 transition-opacity`}></div>
  </button>
);

const StockProgress = ({ current, min }: { current: number, min: number }) => {
  const percentage = Math.min((current / (min * 1.5 || 1)) * 100, 100);
  const isCritical = current <= 0;
  const isLow = current < min;

  let colorClass = "bg-blue-500";
  if (isCritical) colorClass = "bg-red-600 animate-pulse";
  else if (isLow) colorClass = "bg-amber-500";

  return (
    <div className="w-full">
      <div className="flex justify-between items-end mb-1.5">
        <span className={`text-base font-black ${isLow ? 'text-red-600' : 'text-slate-900 dark:text-white'}`}>
          {current} <span className="text-[10px] font-bold text-slate-400 uppercase">Qty</span>
        </span>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Min: {min}</span>
      </div>
      <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden shadow-inner">
        <div 
          className={`h-full rounded-full transition-all duration-700 ease-out ${colorClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

// --- INITIAL DATA ---

const INITIAL_INVENTORY_SEED = [
  { id: 1, name: 'Oil Filter X500', sku: 'OF-500', category: 'Filters', vehicle: 'Excavator X1', stock: 12, min: 20, value: 15.99, status: 'low' },
  { id: 2, name: 'Brake Pad Set', sku: 'BP-202', category: 'Brakes', vehicle: 'All Trucks', stock: 2, min: 10, value: 89.50, status: 'critical' },
  { id: 3, name: 'Air Filter 2020', sku: 'AF-100', category: 'Filters', vehicle: 'Dozer D5', stock: 35, min: 15, value: 22.00, status: 'ok' },
  { id: 4, name: 'Synthetic Oil', sku: 'OIL-5W30', category: 'Fluids', vehicle: 'General', stock: 50, min: 20, value: 45.00, status: 'ok' },
  { id: 5, name: 'Spark Plug', sku: 'SP-900', category: 'Ignition', vehicle: 'Loader L4', stock: 8, min: 12, value: 8.50, status: 'low' },
  { id: 6, name: 'Hydraulic Fluid', sku: 'HF-5G', category: 'Fluids', vehicle: 'Crane C2', stock: 18, min: 10, value: 120.00, status: 'ok' },
  { id: 7, name: 'HD Battery', sku: 'BAT-HD', category: 'Batteries', vehicle: 'Excavator X1', stock: 0, min: 5, value: 210.00, status: 'critical' },
  { id: 8, name: 'Wiper Blade', sku: 'WB-24', category: 'Exterior', vehicle: 'Truck Fleet', stock: 15, min: 10, value: 12.50, status: 'ok' },
  { id: 9, name: 'Alternator 12V', sku: 'ALT-12', category: 'Electrical', vehicle: 'Backhoe B1', stock: 1, min: 3, value: 145.00, status: 'critical' },
];

const CATEGORIES = ['Filters', 'Fluids', 'Brakes', 'Ignition', 'Batteries', 'Electrical', 'Exterior', 'Tires', 'General'];

export const Inventory = () => {
  // Persistence using LocalStorage to ensure "added parts" don't disappear
  const [inventory, setInventory] = useState<any[]>(() => {
    const saved = localStorage.getItem('fleetops_inventory');
    return saved ? JSON.parse(saved) : INITIAL_INVENTORY_SEED;
  });

  useEffect(() => {
    localStorage.setItem('fleetops_inventory', JSON.stringify(inventory));
  }, [inventory]);

  const [activeList, setActiveList] = useState<'total' | 'restock' | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerLoading, setScannerLoading] = useState(false);
  
  const [categoryThresholds, setCategoryThresholds] = useState<Record<string, number>>({
      'Filters': 15,
      'Fluids': 20,
      'General': 5
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [newItem, setNewItem] = useState({
    name: '',
    sku: '',
    category: 'General',
    vehicle: '',
    stock: 0,
    min: 5,
    value: 0
  });

  const triggerStockAlert = async (item: any) => {
      if (item.stock <= item.min) {
          const severity = item.stock <= 0 ? 'critical' : 'high';
          const msg = `INVENTORY: ${item.name} is below threshold (${item.stock} unit/s left)`;
          try {
              await api.post('/alerts', { message: msg, type: 'inventory_low', severity, timestamp: new Date().toISOString() });
              toast(`Stock Alert Logged: ${item.name}`, { icon: '🚨' });
          } catch (e) {}
      }
  };

  const calculateStatus = (stock: number, min: number) => {
      if (stock <= 0) return 'critical';
      if (stock < min) return 'low';
      return 'ok';
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const itemToAdd = { id: Date.now(), ...newItem, status: calculateStatus(newItem.stock, newItem.min) };
    setInventory(prev => [itemToAdd, ...prev]);
    triggerStockAlert(itemToAdd);
    setShowAddModal(false);
    setNewItem({ name: '', sku: '', category: 'General', vehicle: '', stock: 0, min: 5, value: 0 });
    toast.success('SKU added to global registry');
    
    // Auto-clear active filters if we added an item so it's likely visible
    if (activeList === 'restock' && itemToAdd.status === 'ok') {
        toast('Note: Item hidden by active "Restock" filter', { icon: 'ℹ️' });
    }
  };

  const handleUpdateItem = (e: React.FormEvent) => {
      e.preventDefault();
      const updated = inventory.map(item => {
          if (item.id === editingItem.id) {
              const updatedItem = { ...item, ...editingItem, status: calculateStatus(editingItem.stock, editingItem.min) };
              if (updatedItem.stock <= updatedItem.min && item.stock > item.min) triggerStockAlert(updatedItem);
              return updatedItem;
          }
          return item;
      });
      setInventory(updated);
      setShowEditModal(false);
      toast.success('Record updated');
  };

  const applyCategoryThresholds = () => {
      const updated = inventory.map(item => {
          const threshold = categoryThresholds[item.category];
          if (threshold !== undefined) {
              return { ...item, min: threshold, status: calculateStatus(item.stock, threshold) };
          }
          return item;
      });
      setInventory(updated);
      setShowConfig(false);
      toast.success('Policy applied');
  };

  const filteredMainTable = useMemo(() => {
    return inventory.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.vehicle?.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (activeList === 'restock') {
          return matchesSearch && (item.status === 'low' || item.status === 'critical');
      }
      return matchesSearch;
    });
  }, [inventory, searchTerm, activeList]);

  const handleMockScan = () => {
    setScannerLoading(true);
    // Simulate a scan duration
    setTimeout(() => {
        const randomItem = inventory[Math.floor(Math.random() * inventory.length)];
        setSearchTerm(randomItem.sku);
        setScannerLoading(false);
        setIsScannerOpen(false);
        toast.success(`Scanned: ${randomItem.sku}`);
    }, 1500);
  };

  return (
    <div className="space-y-6 md:space-y-8 pb-12 animate-in fade-in duration-500 px-1 sm:px-0 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
           <div className="flex items-center gap-3 mb-1">
             <div className="p-2 bg-blue-600 text-white rounded-xl shadow-lg">
               <Package size={20} />
             </div>
             <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">Inventory Command</h2>
           </div>
           <p className="text-[11px] md:text-sm text-slate-500 dark:text-slate-400 font-medium">Logistics, procurement, and asset-specific parts management.</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
            <button onClick={() => setShowConfig(true)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 active:scale-95 shadow-sm transition-all"><Settings2 size={16} /> Policies</button>
            <button onClick={() => setShowAddModal(true)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 shadow-xl active:scale-95 transition-all"><Plus size={16} /> New Entry</button>
        </div>
      </div>

      {/* KPI Stripe */}
      <div className="flex flex-nowrap overflow-x-auto gap-4 md:gap-6 pb-4 custom-scrollbar shrink-0 px-1">
        <KpiCard label="Registry" value={inventory.length} sub="Active SKUs cataloged" icon={Barcode} color="text-blue-600" bg="bg-blue-50 dark:bg-blue-900/20" onClick={() => setActiveList(activeList === 'total' ? null : 'total')} active={activeList === 'total'}/>
        <KpiCard label="Low Stock" value={inventory.filter(i => i.status === 'low' || i.status === 'critical').length} sub="Action required" icon={BellRing} color="text-red-600" bg="bg-red-50 dark:bg-red-900/20" onClick={() => setActiveList(activeList === 'restock' ? null : 'restock')} active={activeList === 'restock'}/>
        <KpiCard label="Valuation" value={`$${inventory.reduce((acc, i) => acc + (i.stock * i.value), 0).toLocaleString()}`} sub="Total stock value" icon={TrendingDown} color="text-emerald-600" bg="bg-emerald-50 dark:bg-emerald-900/20"/>
      </div>

      {/* Filter Info Bar */}
      {activeList && (
          <div className="flex items-center justify-between bg-blue-50/50 dark:bg-blue-900/10 px-4 py-2 rounded-xl border border-blue-100 dark:border-blue-900/30">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 tracking-widest">
                  <Info size={14} /> Viewing {activeList === 'restock' ? 'Low Stock Exceptions' : 'Complete Registry'}
              </div>
              <button onClick={() => setActiveList(null)} className="text-[10px] font-black uppercase text-slate-400 hover:text-red-500 transition-colors">Reset View</button>
          </div>
      )}

      {/* Main Grid */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl md:rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden mx-1">
         <div className="px-4 md:px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex flex-col lg:flex-row gap-4 items-center justify-between bg-slate-50/30 dark:bg-slate-900/30">
            <div className="flex-1 flex items-center gap-3 w-full lg:max-w-xl">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input 
                      type="text" 
                      placeholder="Search SKU, Name, or Asset allocation..." 
                      value={searchTerm} 
                      onChange={(e) => setSearchTerm(e.target.value)} 
                      className="w-full pl-11 pr-6 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all dark:text-white shadow-sm" 
                    />
                </div>
                <button 
                  onClick={() => setIsScannerOpen(true)}
                  className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:border-blue-300 transition-all shadow-sm group/scan"
                  title="Scan Barcode"
                >
                  <ScanBarcode size={20} className="group-hover/scan:scale-110 transition-transform" />
                </button>
            </div>
            <div className="flex gap-2 w-full lg:w-auto">
                <button className="flex-1 lg:flex-none px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-2 shadow-sm"><Filter size={14} /> Filter</button>
                <button className="flex-1 lg:flex-none px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-2 shadow-sm"><Download size={14} /> Export</button>
            </div>
         </div>

         <div className="overflow-x-auto custom-scrollbar min-h-[300px]">
            <table className="min-w-[800px] w-full text-left border-separate border-spacing-0">
                <thead className="bg-slate-50 dark:bg-slate-900/80 sticky top-0 z-10">
                    <tr>
                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700">Identification</th>
                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700">Class & Site</th>
                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700 min-w-[160px]">Stock Integrity</th>
                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700">Health</th>
                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700 text-right">Ops</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {filteredMainTable.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-all group">
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400 border border-slate-100 dark:border-slate-700 shadow-inner group-hover:text-blue-500 transition-colors shrink-0"><Layers size={16} /></div>
                                  <div className="min-w-0">
                                      <p className="font-black text-slate-900 dark:text-white tracking-tight text-xs mb-0.5 truncate">{item.name}</p>
                                      <p className="text-[9px] text-slate-400 font-mono font-bold uppercase truncate">{item.sku}</p>
                                  </div>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex flex-col min-w-0">
                                    <span className="text-xs text-slate-700 dark:text-slate-300 font-bold flex items-center gap-1 truncate"><Truck size={12} className="text-slate-400 shrink-0" /> {item.vehicle || 'Global Pool'}</span>
                                    <span className="text-[8px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 mt-1">{item.category}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <StockProgress current={item.stock} min={item.min} />
                            </td>
                            <td className="px-6 py-4">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-[0.1em] border-2 ${
                                    item.status === 'ok' ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400' :
                                    item.status === 'low' ? 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400' :
                                    'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-400'
                                }`}>
                                    {item.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                    <button onClick={() => { setEditingItem(item); setShowEditModal(true); }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"><Edit3 size={16} /></button>
                                    <button className="px-3 py-1.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg text-[8px] font-black uppercase tracking-widest active:scale-95 transition-all">Order</button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
         </div>
         {filteredMainTable.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-32 bg-slate-50/20 dark:bg-slate-900/20">
                <Box size={60} className="mb-4 opacity-10" />
                <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter">Zero Results Detected</h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Adjust search or filters to visualize data</p>
                <button 
                    onClick={() => { setSearchTerm(''); setActiveList(null); }}
                    className="mt-8 flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                >
                    <RotateCcw size={14} /> Clear All Parameters
                </button>
            </div>
         )}
      </div>

      {/* --- SCANNER MODAL --- */}
      {isScannerOpen && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[3000] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-800 animate-in zoom-in duration-200">
                <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
                    <div>
                        <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                           <Scan size={20} className="text-blue-500" /> Barcode Terminal
                        </h3>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-1">Align barcode within the markers</p>
                    </div>
                    <button onClick={() => setIsScannerOpen(false)} className="p-3 hover:bg-slate-800 rounded-full transition-colors text-slate-400"><X size={24}/></button>
                </div>
                
                <div className="p-8">
                   <div className="relative aspect-square w-full max-w-[320px] mx-auto bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 group">
                      {/* Simulated Camera Feed */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-30 grayscale group-hover:grayscale-0 transition-all duration-700">
                         <div className="w-full h-full bg-[radial-gradient(circle_at_center,_#1e293b_0%,_#020617_100%)]"></div>
                         <Smartphone size={120} className="text-slate-700 absolute" />
                      </div>

                      {/* Scanning Line Overlay */}
                      <div className="absolute inset-x-0 h-1 bg-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.5)] top-1/2 -translate-y-1/2 animate-[bounce_3s_infinite] z-20"></div>

                      {/* Corners */}
                      <div className="absolute top-8 left-8 w-12 h-12 border-t-4 border-l-4 border-blue-500 rounded-tl-xl opacity-50"></div>
                      <div className="absolute top-8 right-8 w-12 h-12 border-t-4 border-r-4 border-blue-500 rounded-tr-xl opacity-50"></div>
                      <div className="absolute bottom-8 left-8 w-12 h-12 border-b-4 border-l-4 border-blue-500 rounded-bl-xl opacity-50"></div>
                      <div className="absolute bottom-8 right-8 w-12 h-12 border-b-4 border-r-4 border-blue-500 rounded-br-xl opacity-50"></div>

                      {/* Loading State */}
                      {scannerLoading && (
                        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm z-30 flex flex-col items-center justify-center">
                           <Loader2 className="animate-spin text-blue-500 mb-4" size={48} />
                           <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">Processing SKU...</p>
                        </div>
                      )}
                   </div>

                   <div className="mt-10 space-y-4">
                      <button 
                        onClick={handleMockScan}
                        disabled={scannerLoading}
                        className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-blue-500/40 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                      >
                         <Camera size={20} /> Initialize Scan Sequence
                      </button>
                      <button 
                        onClick={() => setIsScannerOpen(false)}
                        className="w-full py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-slate-300 transition-colors"
                      >
                         Cancel Terminal Session
                      </button>
                   </div>
                </div>
            </div>
        </div>
      )}

      {/* --- ADD MODAL --- */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[1000] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in duration-200">
                <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/50">
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">New Registry Entry</h3>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-[0.2em] mt-1">Cataloging individual component</p>
                    </div>
                    <button onClick={() => setShowAddModal(false)} className="p-3 hover:bg-white dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400"><X size={24}/></button>
                </div>
                <form onSubmit={handleAddItem} className="p-10 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Item Name</label>
                            <input required type="text" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-sm font-black text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm" placeholder="Component Designation" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">SKU / Serial</label>
                            <div className="relative">
                                <input required type="text" value={newItem.sku} onChange={e => setNewItem({...newItem, sku: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 pr-10 text-sm font-black text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm" placeholder="ID-0000" />
                                <Barcode size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Asset Allocation</label>
                            <div className="relative">
                                <select value={newItem.vehicle} onChange={e => setNewItem({...newItem, vehicle: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-sm font-black text-slate-900 dark:text-white appearance-none cursor-pointer focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm">
                                    <option value="">Global Stock</option>
                                    {MOCK_VEHICLES.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
                                </select>
                                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Category</label>
                            <div className="relative">
                                <select value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-sm font-black text-slate-900 dark:text-white appearance-none cursor-pointer focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm">
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-950 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-inner">
                        <div>
                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Current Qty</label>
                            <input required type="number" min="0" value={newItem.stock} onChange={e => setNewItem({...newItem, stock: parseInt(e.target.value) || 0})} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-black text-slate-900 dark:text-white focus:border-blue-500 outline-none shadow-sm" />
                        </div>
                        <div>
                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Safety Min</label>
                            <input required type="number" min="1" value={newItem.min} onChange={e => setNewItem({...newItem, min: parseInt(e.target.value) || 1})} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-black text-slate-900 dark:text-white focus:border-blue-500 outline-none shadow-sm" />
                        </div>
                        <div>
                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Unit Value ($)</label>
                            <input required type="number" min="0" step="0.01" value={newItem.value} onChange={e => setNewItem({...newItem, value: parseFloat(e.target.value) || 0})} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-black text-slate-900 dark:text-white focus:border-blue-500 outline-none shadow-sm" />
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Discard</button>
                        <button type="submit" className="flex-[2] py-5 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl active:scale-95 transition-all">Authorize Entry</button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* --- EDIT MODAL --- */}
      {showEditModal && editingItem && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[1000] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in duration-200">
                <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/50">
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Edit Record</h3>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-[0.2em] mt-1">Updating ID: {editingItem.sku}</p>
                    </div>
                    <button onClick={() => setShowEditModal(false)} className="p-3 hover:bg-white dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400"><X size={24}/></button>
                </div>
                <form onSubmit={handleUpdateItem} className="p-10 space-y-6">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Item Name</label>
                        <input required type="text" value={editingItem.name} onChange={e => setEditingItem({...editingItem, name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-sm font-black text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm" />
                    </div>

                    <div className="grid grid-cols-3 gap-6 bg-blue-50/30 dark:bg-blue-900/10 p-6 rounded-3xl border border-blue-100 dark:border-blue-900/30">
                        <div>
                            <label className="block text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2 text-center">Stock Level</label>
                            <input required type="number" value={editingItem.stock} onChange={e => setEditingItem({...editingItem, stock: parseInt(e.target.value) || 0})} className="w-full bg-white dark:bg-slate-900 border-2 border-blue-100 dark:border-blue-900 rounded-xl p-3 text-center text-lg font-black text-slate-900 dark:text-white focus:border-blue-500 outline-none shadow-sm" />
                        </div>
                        <div>
                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 text-center">Threshold</label>
                            <input required type="number" value={editingItem.min} onChange={e => setEditingItem({...editingItem, min: parseInt(e.target.value) || 1})} className="w-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl p-3 text-center text-lg font-black text-slate-900 dark:text-white focus:border-blue-500 outline-none shadow-sm" />
                        </div>
                        <div>
                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 text-center">Unit Cost</label>
                            <input required type="number" step="0.01" value={editingItem.value} onChange={e => setEditingItem({...editingItem, value: parseFloat(e.target.value) || 0})} className="w-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl p-3 text-center text-lg font-black text-slate-900 dark:text-white focus:border-blue-500 outline-none shadow-sm" />
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Abort</button>
                        <button type="submit" className="flex-[2] py-5 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl active:scale-95 transition-all">Apply Modification</button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* --- CONFIG MODAL --- */}
      {showConfig && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[1000] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in duration-200">
                <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/50">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-xl"><Settings2 size={24} /></div>
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Global Policies</h3>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-[0.2em] mt-1">Resource replenishment thresholds</p>
                        </div>
                    </div>
                    <button onClick={() => setShowConfig(false)} className="p-3 hover:bg-white dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400"><X size={24}/></button>
                </div>
                
                <div className="p-10 space-y-8">
                    <div className="space-y-4">
                        {CATEGORIES.map(category => (
                            <div key={category} className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 group hover:border-blue-200 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors shadow-sm"><Box size={18} /></div>
                                    <span className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-tight">{category}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Min Level</span>
                                    <input 
                                        type="number" 
                                        className="w-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-center text-xs font-black text-slate-900 dark:text-white focus:border-blue-500 outline-none"
                                        value={categoryThresholds[category] || 5}
                                        onChange={e => setCategoryThresholds({...categoryThresholds, [category]: parseInt(e.target.value) || 0})}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/10 border-2 border-dashed border-blue-200 dark:border-blue-900/40 p-6 rounded-3xl flex items-start gap-4">
                        <Zap className="text-blue-600 dark:text-blue-400 shrink-0 mt-1" size={24} />
                        <p className="text-xs text-blue-800 dark:text-blue-300 font-bold leading-relaxed">
                            Compliance: Applying these thresholds will trigger immediate safety alerts for all cataloged SKUs currently below the new designation limits.
                        </p>
                    </div>

                    <div className="pt-4 flex gap-4">
                        <button type="button" onClick={() => setShowConfig(false)} className="flex-1 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Abort</button>
                        <button onClick={applyCategoryThresholds} className="flex-[2] py-5 bg-slate-900 dark:bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl active:scale-95 transition-all">Implement Policy</button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
