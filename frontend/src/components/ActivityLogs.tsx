import { useState, useEffect, FormEvent } from 'react';
import { LiveActivityLog } from '../types/types';
import { Terminal, Send, AlertTriangle, ShieldCheck, Cpu } from 'lucide-react';

interface ActivityLogsProps {
  logs: LiveActivityLog[];
  onAddCustomEvent: (msg: string, type: 'info' | 'alert' | 'analysis' | 'jensen_trump' | 'system') => void;
}

export default function ActivityLogs({ logs, onAddCustomEvent }: ActivityLogsProps) {
  const [customInput, setCustomInput] = useState('');
  const [eventType, setEventType] = useState<'info' | 'alert' | 'analysis' | 'jensen_trump' | 'system'>('jensen_trump');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;
    onAddCustomEvent(customInput, eventType);
    setCustomInput('');
  };

  const getLogColorClass = (type: string) => {
    switch (type) {
      case 'alert':
        return 'text-rose-400 border-rose-950 bg-rose-950/20';
      case 'analysis':
        return 'text-emerald-400 border-emerald-950 bg-emerald-950/20';
      case 'jensen_trump':
        return 'text-cyan-400 border-cyan-950 bg-cyan-950/20';
      case 'system':
        return 'text-amber-400 border-amber-950 bg-amber-950/20';
      default:
        return 'text-zinc-300 border-zinc-800 bg-zinc-900/40';
    }
  };

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 font-mono">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <Terminal className="w-5 h-5 text-emerald-400" />
          <h3 className="text-sm font-semibold tracking-wider text-zinc-100 uppercase">
            Live Intelligence Ingestion Pipeline
          </h3>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>INGESTING REAL-TIME RSS & BLOCKS</span>
        </div>
      </div>

      {/* Terminal logs list */}
      <div className="my-4 h-64 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-zinc-800">
        {logs.map((log) => (
          <div
            key={log.id}
            className={`p-3 rounded border text-xs leading-relaxed flex flex-col gap-1 transition-all ${getLogColorClass(
              log.type
            )}`}
          >
            <div className="flex items-center justify-between gap-2 text-[10px] text-zinc-500 font-bold uppercase">
              <span className="flex items-center gap-1">
                {log.type === 'jensen_trump' && <Cpu className="w-3 h-3 text-cyan-400" />}
                {log.type === 'alert' && <AlertTriangle className="w-3 h-3 text-rose-400" />}
                {log.type === 'analysis' && <ShieldCheck className="w-3 h-3 text-emerald-400" />}
                <span>{log.type.replace('_', ' ')}</span>
              </span>
              <span>{log.timestamp}</span>
            </div>
            <p className="text-zinc-200 mt-0.5">{log.message}</p>
          </div>
        ))}
      </div>

      {/* Insert Custom Global Event Catalyst */}
      <form onSubmit={handleSubmit} className="mt-6 border-t border-zinc-800 pt-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">
              Inject Custom Narrative Catalyst (Sornette Threshold Phase-Transition)
            </label>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-500 uppercase">CLASSIFY:</span>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value as any)}
                className="bg-zinc-900 text-zinc-300 text-xs border border-zinc-800 rounded px-2 py-1 focus:outline-none focus:border-zinc-700"
              >
                <option value="jensen_trump">Huang & Trump Activity</option>
                <option value="alert">Sudden Selling Panic (Alert)</option>
                <option value="analysis">Econophysics Signal (Analysis)</option>
                <option value="info">General Macro / ZAR Indicator</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="e.g. Donald Trump posts warning about 15% universal semiconductor tariffs..."
              className="flex-1 bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 rounded px-3 py-2 focus:outline-none focus:border-emerald-500/80 font-mono placeholder:text-zinc-600"
            />
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold px-4 py-2 rounded text-xs transition-colors flex items-center gap-1.5 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            >
              <Send className="w-3 h-3" />
              <span>INJECT</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
