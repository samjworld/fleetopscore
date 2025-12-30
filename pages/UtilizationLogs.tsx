import React, { useState, useMemo, memo } from 'react';
import * as XLSX from 'xlsx';
import { FixedSizeList as List } from 'react-window';
import { 
  Upload, FileSpreadsheet, Download, RefreshCw, AlertCircle, CheckCircle2, 
  Fuel, Gauge, Plus, Info, Zap, TrendingDown, RotateCcw
} from 'lucide-react';
import { ProcessedUtilizationRecord } from '../types.ts';
import toast from 'react-hot-toast';

const HEADER_MAPPING: Record<string, keyof Partial<ProcessedUtilizationRecord>> = {
  'machinery': 'machineId',
  'machine': 'machineId',
  'number': 'machineId',
  'start': 'startReading',
  'opening': 'startReading',
  'closing': 'closingReading',
  'end': 'closingReading',
  'worked': 'totalWorked',
  'hours': 'totalWorked',
  'gasoil': 'fuelIssued',
  'fuel': 'fuelIssued',
  'issued': 'fuelIssued',
  'avg': 'avgConsumption',
  'consumption': 'avgConsumption'
};

const mapHeaders = (rawRow: any): Partial<ProcessedUtilizationRecord> => {
  const normalized: any = {};
  Object.keys(rawRow).forEach(key => {
    const lowerKey = key.toLowerCase();
    for (const [pattern, field] of Object.entries(HEADER_MAPPING)) {
      if (lowerKey.includes(pattern)) {
        normalized[field] = rawRow[key];
        break;
      }
    }
  });
  return normalized;
};

/**
 * Memoized Row Component for Virtualized Table
 */
const LogRow = memo(({ data, index, style }: { data: ProcessedUtilizationRecord[], index: number, style: any }) => {
  const rec = data[index];
  const isHighConsumption = rec.avgConsumption > 25; // Example threshold

  return (
    <div style={style} className={`flex items-center border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors px-8`}>
      <div className="w-48 pr-4 font-black text-xs uppercase tracking-tight text-slate-900 dark:text-white truncate">
        {rec.machineId}
      </div>
      <div className="w-40 pr-4 font-mono text-xs font-bold text-slate-600 dark:text-slate-400">
        {rec.startReading.toLocaleString()}
      </div>
      <div className="w-40 pr-4 font-mono text-xs font-bold text-slate-600 dark:text-slate-400">
        {rec.closingReading.toLocaleString()}
      </div>
      <div className="w-40 pr-4 font-black text-sm text-slate-900 dark:text-white">
        {rec.totalWorked} <span className="text-[10px] opacity-40 uppercase">Hrs</span>
      </div>
      <div className="w-40 pr-4 font-mono text-xs font-bold text-slate-600 dark:text-slate-400">
        {rec.fuelIssued.toLocaleString()} <span className="text-[10px] opacity-40">L</span>
      </div>
      <div className="w-48 pr-4">
        <span className={`font-black text-sm ${isHighConsumption ? 'text-red-500' : 'text-emerald-500'}`}>
          {rec.avgConsumption} <span className="text-[10px] opacity-40 uppercase">L/H</span>
        </span>
      </div>
      <div className="w-24 text-right">
        {rec.isValid ? (
          <CheckCircle2 size={16} className="text-emerald-500 ml-auto" />
        ) : (
          <AlertCircle size={16} className="text-red-600 ml-auto" />
        )}
      </div>
    </div>
  );
});

export const UtilizationLogs = () => {
  const [records, setRecords] = useState<ProcessedUtilizationRecord[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const processData = (rawData: any[]): ProcessedUtilizationRecord[] => {
    return rawData.map((raw, index) => {
      const mapped = mapHeaders(raw);
      const machineId = String(mapped.machineId || `M-${index + 1}`).toUpperCase();
      const start = Number(mapped.startReading || 0);
      const end = Number(mapped.closingReading || 0);
      const fuel = Number(mapped.fuelIssued || 0);
      const worked = Number(mapped.totalWorked) || Math.max(0, end - start);
      const avg = Number(mapped.avgConsumption) || (worked > 0 ? fuel / worked : 0);

      return {
        id: `rec_${Date.now()}_${index}`,
        machineId,
        startReading: start,
        closingReading: end,
        totalWorked: Number(worked.toFixed(2)),
        fuelIssued: Number(fuel.toFixed(2)),
        avgConsumption: Number(avg.toFixed(2)),
        isValid: machineId.length > 0 && worked >= 0,
      };
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        if (data.length === 0) throw new Error("Document payload is empty");
        const processed = processData(data);
        setRecords(processed);
        toast.success(`Ingested ${processed.length} terminal records`);
      } catch (err) {
        toast.error("Telemetry parsing failure.");
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const stats = useMemo(() => {
    if (records.length === 0) return null;
    const totalFuel = records.reduce((acc, r) => acc + r.fuelIssued, 0);
    const totalHours = records.reduce((acc, r) => acc + r.totalWorked, 0);
    const avgFleet = totalHours > 0 ? totalFuel / totalHours : 0;
    return { totalFuel, totalHours, avgFleet: avgFleet.toFixed(2) };
  }, [records]);

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-700 h-full flex flex-col">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none mb-2">Utilization Intel</h2>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium">Virtualized bulk ingestion nexus.</p>
        </div>
        <div className="flex items-center gap-3">
          {records.length > 0 && (
            <button onClick={() => setRecords([])} className="px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-500 shadow-sm">Reset</button>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col flex-1 min-h-0">
        {records.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-20 text-center space-y-8">
             <div className="relative group">
                <div className="w-32 h-32 rounded-[3rem] bg-slate-50 dark:bg-slate-800 border-4 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-300 group-hover:border-blue-500 transition-all">
                    {isProcessing ? <RefreshCw className="animate-spin" size={48} /> : <Upload size={48} />}
                </div>
                {!isProcessing && <input type="file" accept=".xlsx" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />}
             </div>
             <h4 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Initialize Registry Ingestion</h4>
          </div>
        ) : (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 shrink-0">
               <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">{fileName} ({records.length})</h3>
            </div>

            {/* Virtualized List Header */}
            <div className="bg-slate-50 dark:bg-slate-950 text-[9px] font-black text-slate-400 uppercase tracking-widest flex px-8 py-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="w-48">Asset Identity</div>
              <div className="w-40">Start Node</div>
              <div className="w-40">Closing Node</div>
              <div className="w-40">Total Work</div>
              <div className="w-40">Fuel Injected</div>
              <div className="w-48">Efficiency Rate</div>
              <div className="w-24 text-right">State</div>
            </div>

            {/* The Virtualized Body */}
            <div className="flex-1 min-h-0">
              <List
                height={500}
                itemCount={records.length}
                itemSize={64}
                width="100%"
                itemData={records}
                className="custom-scrollbar"
              >
                {LogRow}
              </List>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};