
import React, { useState, useRef } from 'react';
import { 
  X, FileSpreadsheet, Upload, CheckCircle2, AlertCircle, 
  Loader2, Cpu, Truck, Package, Users, ArrowRight, Zap, Info
} from 'lucide-react';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import { api } from '../services/api.ts';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

interface DetectedData {
  vehicles: any[];
  inventory: any[];
  personnel: any[];
}

export const ImportModal = ({ isOpen, onClose, onComplete }: ImportModalProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'upload' | 'scanning' | 'preview'>('upload');
  const [detectedData, setDetectedData] = useState<DetectedData>({ vehicles: [], inventory: [], personnel: [] });
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const detectType = (headers: string[]): 'vehicle' | 'inventory' | 'user' | null => {
    const h = headers.map(s => s.toLowerCase());
    if (h.includes('vin') || h.includes('serial number') || (h.includes('make') && h.includes('model'))) return 'vehicle';
    if (h.includes('sku') || h.includes('part number') || h.includes('stock')) return 'inventory';
    if (h.includes('email') && (h.includes('role') || h.includes('staff'))) return 'user';
    return null;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setStep('scanning');

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        
        const results: DetectedData = { vehicles: [], inventory: [], personnel: [] };

        // Scan all sheets in the Excel file
        wb.SheetNames.forEach(sheetName => {
          const ws = wb.Sheets[sheetName];
          const data = XLSX.utils.sheet_to_json(ws);
          if (data.length === 0) return;

          const headers = Object.keys(data[0] as object);
          const type = detectType(headers);

          if (type === 'vehicle') results.vehicles.push(...data);
          else if (type === 'inventory') results.inventory.push(...data);
          else if (type === 'user') results.personnel.push(...data);
        });

        // Simulate "Machine Learning" delay for UX
        await new Promise(r => setTimeout(r, 2000));
        
        setDetectedData(results);
        setStep('preview');
      } catch (err) {
        toast.error('Failed to parse Excel telemetry');
        setStep('upload');
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleCommit = async () => {
    setIsProcessing(true);
    try {
      // Direct call to stateful mock for persistent session update
      await api.post('/bulk-import', detectedData);
      toast.success('Registry successfully synchronized');
      onComplete();
      onClose();
    } catch (err) {
      toast.error('Commit protocol failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in duration-200">
        
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-500/20">
              <FileSpreadsheet size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Smart Importer</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-[0.2em] mt-1.5">Machine-detected bulk ingestion</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400"><X size={24}/></button>
        </div>

        <div className="p-10">
          {step === 'upload' && (
            <div className="space-y-8 text-center">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-4 border-dashed border-slate-100 dark:border-slate-800 rounded-[3rem] p-16 hover:border-blue-500 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-all cursor-pointer group"
              >
                <Upload size={48} className="mx-auto text-slate-300 group-hover:text-blue-500 group-hover:scale-110 transition-all mb-6" />
                <h4 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Drop Excel Source</h4>
                <p className="text-sm text-slate-500 mt-2 font-medium">Standard .xlsx or .xls files supported</p>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx, .xls" className="hidden" />
              </div>
              <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/10 p-5 rounded-2xl border border-blue-100 dark:border-blue-900/30 text-left">
                <Info size={20} className="text-blue-600 shrink-0" />
                <p className="text-[10px] font-bold text-blue-800 dark:text-blue-300 uppercase leading-relaxed">
                  Detection Engine: Our algorithms automatically identify headers like "VIN", "SKU", and "Email" to route data to the correct application modules.
                </p>
              </div>
            </div>
          )}

          {step === 'scanning' && (
            <div className="py-20 text-center space-y-8">
              <div className="relative inline-block">
                <div className="w-24 h-24 rounded-full border-4 border-blue-100 dark:border-blue-900/30 border-t-blue-600 animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-blue-600">
                  <Cpu size={32} className="animate-pulse" />
                </div>
              </div>
              <div>
                <h4 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Analyzing Payload</h4>
                <p className="text-sm text-slate-500 mt-2 font-mono">Running detection heuristics on sheets...</p>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Equipment', count: detectedData.vehicles.length, icon: Truck, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: 'Inventory', count: detectedData.inventory.length, icon: Package, color: 'text-purple-600', bg: 'bg-purple-50' },
                  { label: 'Staff Nodes', count: detectedData.personnel.length, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                ].map((stat, i) => (
                  <div key={i} className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-center">
                    <div className={`w-10 h-10 rounded-xl ${stat.bg} dark:bg-slate-950 ${stat.color} flex items-center justify-center mx-auto mb-3 shadow-inner`}><stat.icon size={20} /></div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                    <h5 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stat.count}</h5>
                  </div>
                ))}
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 rounded-3xl p-6 border-2 border-dashed border-slate-200 dark:border-slate-800">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                   <Zap size={14} className="text-blue-500" /> Data Classification Success
                 </h4>
                 <p className="text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed italic">
                   The machine has identified <span className="text-blue-600 font-bold">{detectedData.vehicles.length + detectedData.inventory.length + detectedData.personnel.length}</span> individual entities. 
                   Proceeding will synchronize these records with the production nexus.
                 </p>
              </div>

              <div className="flex gap-4">
                <button onClick={() => setStep('upload')} className="flex-1 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">Discard</button>
                <button 
                  onClick={handleCommit}
                  disabled={isProcessing}
                  className="flex-[2] py-5 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-blue-500/30 active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  {isProcessing ? <Loader2 className="animate-spin" size={18} /> : <Zap size={18} />}
                  EXECUTE SYNCHRONIZATION
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
