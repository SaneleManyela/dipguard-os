/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent } from 'react';
import { 
  TrendingDown, Globe, BookOpen, Sliders, DollarSign, Activity, 
  Layers, AlertTriangle, HelpCircle, ShieldAlert, Sparkles, 
  Search, Cpu, ArrowDownRight, Compass, CheckCircle2, ChevronRight, 
  ArrowUpRight, Info, RefreshCw, Layers3, Flame, Clock, Landmark, UploadCloud, FileText
} from 'lucide-react';
import { createWorker } from 'tesseract.js';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs';
import { OpportunityAlert, ScheduledReport, LiveActivityLog, BriefType } from './types/types';
import ActivityLogs from './components/ActivityLogs';
import PlaygroundView from './components/PlaygroundView';
import { fetchChatHistory, sendChatMessage, uploadChatAttachment } from './services/chatApi';

GlobalWorkerOptions.workerSrc = pdfjsWorker;

function extractTickersFromText(text: string) {
  const found = Array.from(text.matchAll(/\b[A-Z]{2,5}\b/g), (match) => match[0]);
  const exclude = new Set([
    'THE', 'AND', 'FOR', 'WITH', 'THIS', 'THAT', 'FROM', 'YOUR', 'THERE', 'WHICH', 'WHILE', 'WHERE', 'BUT', 'NOT',
    'ARE', 'HAS', 'HAVE', 'WAS', 'WILL', 'SHOULD', 'COULD', 'MAY', 'ETF', 'USD', 'ZAR', 'SAST', 'AI', 'GPU', 'CEO', 'CFO',
    'NASDAQ', 'JSE', 'NYSE', 'EQUITY', 'STOCK', 'MARKET', 'FUTURES', 'OPTIONS', 'NEWS', 'NOTE', 'DATA', 'RISK',
    'RATE', 'TAX', 'FEE', 'YIELD', 'BOND'
  ]);

  return Array.from(new Set(found.filter((ticker) => {
    if (exclude.has(ticker)) return false;
    if (ticker.length < 2 || ticker.length > 5) return false;
    return true;
  })));
}

async function extractTextFromPdf(file: File) {
  const raw = await file.arrayBuffer();
  const loadingTask = getDocument({ data: raw });
  const pdf = await loadingTask.promise;
  let fullText = '';
  for (let pageIndex = 1; pageIndex <= pdf.numPages; pageIndex += 1) {
    const page = await pdf.getPage(pageIndex);
    const content = await page.getTextContent();
    const pageText = content.items.map((item: any) => item.str || '').join(' ');
    fullText += pageText + '\n';
  }
  return fullText;
}

async function runPdfOcr(file: File) {
  const raw = await file.arrayBuffer();
  const loadingTask = getDocument({ data: raw });
  const pdf = await loadingTask.promise;
  const worker = (await createWorker()) as any;
  await worker.load();
  await worker.loadLanguage?.('eng');
  await worker.initialize?.('eng');

  let ocrText = '';
  const maxPages = Math.min(pdf.numPages, 6);
  for (let pageIndex = 1; pageIndex <= maxPages; pageIndex += 1) {
    const page = await pdf.getPage(pageIndex);
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const context = canvas.getContext('2d');
    if (context) {
      await page.render({ canvasContext: context, viewport, canvas }).promise;
      const result = await worker.recognize(canvas);
      ocrText += (result.data?.text || '') + '\n';
    }
  }

  await worker.terminate();
  return ocrText;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'alerts' | 'publications' | 'scanner' | 'playground' | 'portfolio' | 'reference' | 'chat'>('alerts');
  const [sastTime, setSastTime] = useState<string>('00:00:00');
  const [hasReplicateKey, setHasReplicateKey] = useState<boolean>(false);
  
  // Data State
  const [alerts, setAlerts] = useState<OpportunityAlert[]>([]);
  const [reports, setReports] = useState<ScheduledReport[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string>('report-morning');
  const [logs, setLogs] = useState<LiveActivityLog[]>([]);

  // Scanning Form Inputs
  const [scanTicker, setScanTicker] = useState('NVDA');
  const [scanName, setScanName] = useState('NVIDIA Corporation');
  const [scanTier, setScanTier] = useState(1);
  const [scanMarket, setScanMarket] = useState<'NASDAQ' | 'JSE' | 'ETF' | 'OTHER'>('NASDAQ');
  const [scanChange, setScanChange] = useState(-5.5);
  const [isScanning, setIsScanning] = useState(false);
  const [activeScanResult, setActiveScanResult] = useState<OpportunityAlert | null>(null);

  const [pdfUploadStatus, setPdfUploadStatus] = useState<string>('');
  const [trackedTickers, setTrackedTickers] = useState<string[]>([]);
  const [pdfExtractedSnippet, setPdfExtractedSnippet] = useState<string>('');
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);

  // Dynamic Brief State
  const [briefType, setBriefType] = useState<BriefType>('Morning Brief (07:00)');
  const [customFocus, setCustomFocus] = useState('');
  const [isGeneratingBrief, setIsGeneratingBrief] = useState(false);

  // Chat + Thesis Prompt Inputs
  const [thesisPrompt, setThesisPrompt] = useState<string>('');
  const [thesisDraft, setThesisDraft] = useState<string>('');
  const [chatInput, setChatInput] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<{ id?: string; role: 'user' | 'assistant'; content: string; attachments?: Array<{ id: string; filename: string; mimeType: string; url: string }>; }[]>([]);
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [chatAttachment, setChatAttachment] = useState<File | null>(null);
  const [chatUploadingAttachment, setChatUploadingAttachment] = useState(false);
  const [isUpdatingThesis, setIsUpdatingThesis] = useState(false);

  // Currency Converter Inputs
  const [randAmount, setRandAmount] = useState<string>('50000');
  const [usdZarRate, setUsdZarRate] = useState<number>(18.35);

  // Initial Seed logs with accurate South African times
  const initialLogs: LiveActivityLog[] = [
    {
      id: 'log-1',
      timestamp: '07:02 SAST',
      type: 'system',
      message: 'DipGuard Quant Core Bootloader initialized. Listening on live JSE Sens RSS feeds.'
    },
    {
      id: 'log-2',
      timestamp: '07:15 SAST',
      type: 'jensen_trump',
      message: 'Jensen Huang keynote scan: Blackwell production yields in full scaling. Sovereigns ordering heavily.'
    },
    {
      id: 'log-3',
      timestamp: '08:45 SAST',
      type: 'info',
      message: 'USD/ZAR testing critical resistance threshold at 18.35. Hedging coefficients shifted to USD overweight.'
    },
    {
      id: 'log-4',
      timestamp: '12:10 SAST',
      type: 'alert',
      message: 'ALERT: NASDAQ composite contracts show emotional sell-clustering. Fast-recovery triggers active on NVDA!'
    },
    {
      id: 'log-5',
      timestamp: '14:55 SAST',
      type: 'analysis',
      message: 'Sornette threshold phase-transition checked: S&P re-indexing represents non-structural narrative dislocation.'
    }
  ];

  // Tick-tock clock in Johannesburg SAST Timezone (GMT+2)
  useEffect(() => {
    const updateClock = () => {
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Africa/Johannesburg',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      };
      setSastTime(new Intl.DateTimeFormat('en-ZA', options).format(new Date()));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch configs and default mock/dynamic reports
  useEffect(() => {
    setLogs(initialLogs);
    
    // Status check
    fetch('/api/config-status')
      .then((res) => res.json())
      .then((data) => {
        setHasReplicateKey(data.hasReplicateKey);
      })
      .catch((err) => console.warn('Could not connect to config-status endpoint', err));

    // Historical reports
    fetch('/api/historical-reports')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setAlerts(data.alerts);
          setReports(data.reports);
          if (data.reports && data.reports.length > 0) {
            setSelectedReportId(data.reports[0].id);
          }
        }
      })
      .catch((err) => console.warn('Could not load historical alerts data', err));

    // Current shared thesis prompt
    fetch('/api/thesis')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setThesisPrompt(data.thesis || '');
          setThesisDraft(data.thesis || '');
        }
      })
      .catch((err) => console.warn('Could not load thesis prompt', err));

    // Chat history
    fetchChatHistory()
      .then((data) => {
        if (data.success) {
          setChatMessages(data.history || []);
        }
      })
      .catch((err) => console.warn('Could not load chat history', err));
  }, []);

  // Trigger Ticker Scan
  const performTickerScan = async (
    ticker: string,
    name: string,
    tier: number,
    market: 'NASDAQ' | 'JSE' | 'ETF' | 'OTHER',
    recentChange: number
  ) => {
    setIsScanning(true);
    setActiveScanResult(null);

    addNewLog(`Triggered custom client-side scan query on target asset: ${ticker} (${market})`, 'info');

    try {
      const response = await fetch('/api/scan-ticker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker,
          name,
          tier,
          market,
          recentChange,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setActiveScanResult(data.alert);
        setAlerts((prev) => [data.alert, ...prev]);

        addNewLog(
          `Opportunity scan complete: ${data.alert.ticker} scored ${data.alert.scores.total}/100. Status classification: [${data.alert.classification}]`,
          data.alert.classification === 'Strong Buy Opportunity' ? 'analysis' : 'info'
        );
      } else {
        addNewLog(`Scan failed: ${data.error || 'Server-side API failure'}`, 'alert');
      }
    } catch (err: any) {
      addNewLog(`Error dispatching pipeline scan: ${err.message}`, 'alert');
    } finally {
      setIsScanning(false);
    }
  };

  const handlePerformScan = async (e: FormEvent) => {
    e.preventDefault();
    await performTickerScan(scanTicker, scanName, scanTier, scanMarket, scanChange);
  };

  const handleScanTrackedTicker = async (ticker: string) => {
    await performTickerScan(ticker, ticker, 2, 'NASDAQ', -4.5);
  };

  const handleUploadPdf = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fileInput = form.elements.namedItem('pdfFile') as HTMLInputElement | null;
    const file = fileInput?.files?.[0];

    if (!file) {
      setPdfUploadStatus('Please select a PDF file to upload.');
      return;
    }

    setIsUploadingPdf(true);
    setPdfUploadStatus('Parsing PDF and extracting text from pages...');

    try {
      const pdfText = await extractTextFromPdf(file);
      const imageText = await runPdfOcr(file);
      const combinedText = [pdfText, imageText].filter(Boolean).join('\n');
      const tickers = extractTickersFromText(combinedText);

      setTrackedTickers(tickers);
      setPdfExtractedSnippet(combinedText.slice(0, 700));
      setPdfUploadStatus(
        tickers.length > 0
          ? `Detected ${tickers.length} potential tickers from PDF text and images.`
          : 'No valid ticker-like symbols found. Please verify the document contains uppercase stock symbols.'
      );
      addNewLog(`PDF parsed locally. Extracted ${tickers.length} candidate tickers from embedded text and images.`, 'system');
    } catch (err: any) {
      setPdfUploadStatus(`PDF parser error: ${err.message}`);
      addNewLog(`PDF extraction failed: ${err.message}`, 'alert');
    } finally {
      setIsUploadingPdf(false);
    }
  };

  const addChatMessage = (
    message: string,
    role: 'user' | 'assistant',
    attachments?: Array<{ id: string; filename: string; mimeType: string; url: string }>,
    id?: string
  ) => {
    setChatMessages((prev) => [...prev, { id, role, content: message, attachments }]);
  };

  const handleSendChat = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const messageToSend = chatInput.trim();
    addChatMessage(messageToSend, 'user');
    setChatInput('');
    setIsSendingChat(true);

    try {
      const data = await sendChatMessage(messageToSend);
      if (data.success) {
        addChatMessage(data.response, 'assistant');
      } else {
        addChatMessage(`Error: ${data.error || 'Failed to get a response.'}`, 'assistant');
      }
    } catch (err: any) {
      addChatMessage(`Chat service failed: ${err.message}`, 'assistant');
    } finally {
      setIsSendingChat(false);
    }
  };

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setChatAttachment(file);
  };

  const handleUploadAttachment = async () => {
    if (!chatAttachment) return;
    const latestMessage = chatMessages[chatMessages.length - 1];
    if (!latestMessage || latestMessage.role !== 'user' || !latestMessage.id) return;

    setChatUploadingAttachment(true);
    try {
      const data = await uploadChatAttachment(latestMessage.id, chatAttachment);
      if (data.success) {
        setChatMessages((prev) => prev.map((msg) => {
          if (msg.id === latestMessage.id) {
            return {
              ...msg,
              attachments: [...(msg.attachments || []), data.attachment]
            };
          }
          return msg;
        }));
      }
    } catch (err) {
      console.warn('Attachment upload failed', err);
    } finally {
      setChatUploadingAttachment(false);
      setChatAttachment(null);
    }
  };

  const handleUpdateThesis = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const draft = thesisDraft.trim();
    if (!draft) return;

    setIsUpdatingThesis(true);
    try {
      const response = await fetch('/api/thesis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thesis: draft }),
      });
      const data = await response.json();
      if (data.success) {
        setThesisPrompt(data.thesis);
        addNewLog('Updated chat thesis prompt for all future DipGuard interactions.', 'analysis');
      } else {
        addNewLog(`Unable to update thesis prompt: ${data.error || 'unknown error'}`, 'alert');
      }
    } catch (err: any) {
      addNewLog(`Thesis update failed: ${err.message}`, 'alert');
    } finally {
      setIsUpdatingThesis(false);
    }
  };

  // Trigger Custom Schedule Brief generation
  const handleGenerateBrief = async (e: FormEvent) => {
    e.preventDefault();
    setIsGeneratingBrief(true);

    addNewLog(`Requesting real-time generation: custom intelligence briefing [${briefType}]...`, 'system');

    try {
      const response = await fetch('/api/generate-briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          briefType,
          customFocus,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setReports((prev) => [data.report, ...prev]);
        setSelectedReportId(data.report.id);
        setCustomFocus('');
        addNewLog(`New scheduled publication injected successfully: "${briefType}" was calculated and compiled.`, 'analysis');
      } else {
        addNewLog(`Brief compilation failed: ${data.error || 'Unknown endpoint conflict'}`, 'alert');
      }
    } catch (err: any) {
      addNewLog(`Critical compilation lag event: ${err.message}`, 'alert');
    } finally {
      setIsGeneratingBrief(false);
    }
  };

  // Add custom ingestion log event helper
  const addNewLog = (msg: string, type: 'info' | 'alert' | 'analysis' | 'jensen_trump' | 'system') => {
    const timeOptions: Intl.DateTimeFormatOptions = { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit', 
      hour12: false, 
      timeZone: 'Africa/Johannesburg' 
    };
    const label = new Intl.DateTimeFormat('en-ZA', timeOptions).format(new Date());
    const newLogItem: LiveActivityLog = {
      id: 'custom-' + Date.now(),
      timestamp: `${label} SAST`,
      type,
      message: msg,
    };
    setLogs((prev) => [newLogItem, ...prev]);
  };

  const getAlertClassificationStyle = (cls: string) => {
    switch (cls) {
      case 'Strong Buy Opportunity':
        return 'text-emerald-400 bg-emerald-950/40 border-emerald-800/80';
      case 'Watch Closely':
        return 'text-amber-400 bg-amber-950/40 border-amber-800/80';
      default:
        return 'text-rose-400 bg-rose-950/40 border-rose-800/80';
    }
  };

  const selectedReport = reports.find((r) => r.id === selectedReportId);

  // Computed totals for rand converter
  const usdEquivalent = parseFloat(randAmount) > 0 ? (parseFloat(randAmount) / usdZarRate).toFixed(2) : '0.00';

  return (
    <div className="min-h-screen bg-[#05070a] text-zinc-100 font-sans selection:bg-emerald-500 selection:text-black">
      {/* Real-time Ticker Marquee */}
      <div className="bg-[#090d14] border-b border-zinc-800/50 py-2.5 px-4 overflow-hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs font-mono text-zinc-400">
          <div className="flex items-center gap-6 overflow-x-auto space-x-6 scrollbar-none">
            <span className="text-zinc-600 font-bold shrink-0">QUANT MATRIX LIVE:</span>
            <span className="flex items-center gap-1.5 shrink-0">
              <span className="text-zinc-200">NVDA/NASDAQ</span>
              <span className="text-rose-400 flex items-center">-6.42% <ArrowDownRight className="w-3.5 h-3.5 inline" /></span>
            </span>
            <span className="flex items-center gap-1.5 shrink-0">
              <span className="text-zinc-200">PLTR/NASDAQ</span>
              <span className="text-rose-400 flex items-center">-4.85% <ArrowDownRight className="w-3.5 h-3.5 inline" /></span>
            </span>
            <span className="flex items-center gap-1.5 shrink-0">
              <span className="text-zinc-200">SHP/JSE</span>
              <span className="text-rose-400 flex items-center">-3.20% <ArrowDownRight className="w-3.5 h-3.5 inline" /></span>
            </span>
            <span className="flex items-center gap-1.5 shrink-0">
              <span className="text-zinc-200">MSFT/NASDAQ</span>
              <span className="text-amber-400 flex items-center">-1.20% <ArrowDownRight className="w-3.5 h-3.5 inline" /></span>
            </span>
            <span className="flex items-center gap-1.5 shrink-0">
              <span className="text-zinc-200">ANG/JSE</span>
              <span className="text-emerald-400 flex items-center">+2.85% <ArrowUpRight className="w-3.5 h-3.5 inline" /></span>
            </span>
            <span className="flex items-center gap-1.5 shrink-0">
              <span className="text-zinc-200">ZAR/USD</span>
              <span className="text-zinc-300">R18.35</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-2 border-l border-zinc-800 pl-4 text-[11px] text-zinc-500 tracking-wider">
            <span>MODEL: IBM GRANITE 3.1 8B INSTRUCT</span>
          </div>
        </div>
      </div>

      {/* Main Premium Application Header */}
      <header className="border-b border-zinc-800 bg-[#070b12] py-6 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          
          {/* Logo & Agent Identity Title */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-[#0e4b30] flex items-center justify-center border border-emerald-500/30 shrink-0 shadow-lg shadow-emerald-950/20">
              <TrendingDown className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black tracking-tight text-white font-mono">
                  DIPGUARD <span className="text-emerald-400">QUANT</span>
                </h1>
                <span className="text-[10px] bg-emerald-900/30 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full font-mono font-bold tracking-widest uppercase">
                  ACTIVE AGENT
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1 max-w-xl font-medium">
                High-Conviction Buy-The-Dip Tactical Intelligence utilizing Benoit Mandelbrot's Econophysics, Volatility Clustering patterns, and Agent-Based Dynamics.
              </p>
            </div>
          </div>

          {/* Real-time SAST Clock & Ingestion Mode Container */}
          <div className="flex flex-wrap items-center gap-4 self-stretch md:self-auto bg-zinc-900/40 p-4 rounded-xl border border-zinc-800">
            <div className="flex items-center gap-3 pr-4 border-r border-zinc-800">
              <Clock className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <span className="block text-[9px] text-zinc-500 uppercase tracking-widest font-mono font-bold">SOUTH AFRICA (SAST)</span>
                <span className="text-lg font-bold font-mono text-zinc-200 tracking-wide">{sastTime}</span>
              </div>
            </div>

            <div>
              <span className="block text-[9px] text-zinc-500 uppercase tracking-widest font-mono font-bold">AI SYNAPSES ACTIVE</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`w-2.5 h-2.5 rounded-full ${hasReplicateKey ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'}`} />
                <span className="text-xs font-mono font-bold text-zinc-300 uppercase">
                  {hasReplicateKey ? 'Replicate Granite Mode' : 'Offline Sandboxed Hybrid'}
                </span>
              </div>
            </div>
          </div>

        </div>
      </header>

      {/* Structured Static Timetable Header */}
      <div className="bg-[#04060a] border-b border-zinc-800 py-3.5 px-4 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3 font-mono">
          <div className="flex items-center gap-2 text-zinc-500">
            <span className="text-zinc-400 font-bold uppercase tracking-wider text-[11px]">Daily Publication Schedule:</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-4 text-left">
            <div className="bg-zinc-950/80 p-2 rounded border border-zinc-800/80">
              <span className="block text-[9px] text-cyan-400 font-bold">07:00 SAST</span>
              <span className="text-zinc-300 text-[11px] block">Morning Macro Brief</span>
            </div>
            <div className="bg-zinc-950/80 p-2 rounded border border-zinc-800/80">
              <span className="block text-[9px] text-cyan-400 font-bold">12:00 SAST</span>
              <span className="text-zinc-300 text-[11px] block">US Pre-Open Scan</span>
            </div>
            <div className="bg-zinc-950/80 p-2 rounded border border-zinc-800/80">
              <span className="block text-[9px] text-cyan-400 font-bold">15:00 SAST</span>
              <span className="text-zinc-300 text-[11px] block">Afternoon Volatility</span>
            </div>
            <div className="bg-zinc-950/80 p-2 rounded border border-zinc-800/80">
              <span className="block text-[9px] text-cyan-400 font-bold">18:00 SAST</span>
              <span className="text-zinc-300 text-[11px] block">Evening Capital Alloc</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <nav className="bg-[#070b11] border-b border-zinc-800 px-4 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto flex overflow-x-auto scrollbar-none py-1.5">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('alerts')}
              className={`px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider rounded-lg transition-all border flex items-center gap-2 outline-none select-none ${
                activeTab === 'alerts' 
                  ? 'bg-emerald-600/10 border-emerald-500 text-emerald-400' 
                  : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <TrendingDown className="w-4 h-4" />
              <span>🟢 Buy-The-Dip Alerts ({alerts.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('publications')}
              className={`px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider rounded-lg transition-all border flex items-center gap-2 outline-none select-none ${
                activeTab === 'publications' 
                  ? 'bg-emerald-600/10 border-emerald-500 text-emerald-400' 
                  : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>📰 Intelligence briefs</span>
            </button>

            <button
              onClick={() => setActiveTab('scanner')}
              className={`px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider rounded-lg transition-all border flex items-center gap-2 outline-none select-none ${
                activeTab === 'scanner' 
                  ? 'bg-emerald-600/10 border-emerald-500 text-emerald-400' 
                  : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>🔍 On-Demand Quant Scanner</span>
            </button>

            <button
              onClick={() => setActiveTab('playground')}
              className={`px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider rounded-lg transition-all border flex items-center gap-2 outline-none select-none ${
                activeTab === 'playground' 
                  ? 'bg-emerald-600/10 border-emerald-500 text-emerald-400' 
                  : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>🎛️ Sandbox Playground</span>
            </button>

            <button
              onClick={() => setActiveTab('portfolio')}
              className={`px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider rounded-lg transition-all border flex items-center gap-2 outline-none select-none ${
                activeTab === 'portfolio' 
                  ? 'bg-emerald-600/10 border-emerald-500 text-emerald-400' 
                  : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>💼 Capital Allocation</span>
            </button>

            <button
              onClick={() => setActiveTab('reference')}
              className={`px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider rounded-lg transition-all border flex items-center gap-2 outline-none select-none ${
                activeTab === 'reference' 
                  ? 'bg-emerald-600/10 border-emerald-500 text-emerald-400' 
                  : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>📚 Econophysics Reference</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Layout Area */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Panel Span Column (col-span-8 or 12 depending on tab context) */}
          <section className="lg:col-span-8 space-y-6">

            {/* TAB 1: BUY-THE-DIP OPPORTUNITY ALERTS LIST */}
            {activeTab === 'alerts' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-extrabold text-white font-mono uppercase tracking-wide">
                      Active Opportunities sorted by Econophysics Score
                    </h2>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Updated in real-time based on local Volatility Clustering and Fat-Tail indices.
                    </p>
                  </div>
                  <div className="text-xs text-zinc-500 font-mono">
                    ({alerts.length} Assets Identified)
                  </div>
                </div>

                <div className="space-y-4">
                  {alerts.map((al) => (
                    <article key={al.id} className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-all shadow-md">
                      {/* Alert Card Header */}
                      <div className="p-5 border-b border-zinc-900/80 bg-zinc-900/20 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center font-mono font-bold text-emerald-400">
                            {al.ticker}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-extrabold text-zinc-100 font-mono text-sm leading-none">{al.name}</h3>
                              <span className="text-[9px] bg-zinc-900 text-zinc-400 border border-zinc-800 px-2 py-0.5 rounded font-mono uppercase">
                                TIER {al.tier} • {al.market}
                              </span>
                            </div>
                            <span className="text-[10px] text-zinc-500 font-mono uppercase block mt-1">
                              Ingested at: {new Date(al.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} SAST
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right font-mono">
                            <span className="block text-xs text-zinc-500 font-bold uppercase">PRICE & DELTA</span>
                            <span className="text-sm font-bold text-zinc-200">
                              {al.market === 'JSE' ? `ZAR ${al.price.toFixed(2)}` : `$${al.price.toFixed(2)}`}
                            </span>
                            <span className="block text-[11px] text-rose-400 font-bold mt-0.5">
                              {al.changePercent.toFixed(2)}%
                            </span>
                          </div>

                          <div className="text-center bg-[#070d14] p-2 rounded-lg border border-zinc-800">
                            <span className="block text-[8px] text-zinc-500 font-mono font-bold uppercase">DI_SCORE</span>
                            <span className="text-2xl font-black font-mono text-white leading-none">
                              {al.scores.total}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Score Metrics Table Matrix */}
                      <div className="p-5 bg-zinc-950 border-b border-zinc-900">
                        <span className="block text-[10px] text-zinc-400 uppercase font-mono font-bold mb-2.5">
                          Econophysics Opportunity Scoring Breakdown
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs font-mono text-zinc-300">
                          <div className="bg-zinc-900/40 p-2.5 rounded border border-zinc-800/60">
                            <span className="block text-[9px] text-zinc-500">Fundamentals</span>
                            <span className="text-sm font-bold text-zinc-200">{al.scores.fundamentals} <span className="text-[10px] text-zinc-600">/30</span></span>
                          </div>
                          <div className="bg-zinc-900/40 p-2.5 rounded border border-zinc-800/60">
                            <span className="block text-[9px] text-zinc-500">Narrative</span>
                            <span className="text-sm font-bold text-zinc-200">{al.scores.narrative} <span className="text-[10px] text-zinc-600">/20</span></span>
                          </div>
                          <div className="bg-zinc-900/40 p-2.5 rounded border border-zinc-800/60">
                            <span className="block text-[9px] text-zinc-500">Volume Confirmation</span>
                            <span className="text-sm font-bold text-zinc-200">{al.scores.volume} <span className="text-[10px] text-zinc-600">/20</span></span>
                          </div>
                          <div className="bg-zinc-900/40 p-2.5 rounded border border-zinc-800/60">
                            <span className="block text-[9px] text-zinc-500">Dislocation Gap</span>
                            <span className="text-sm font-bold text-zinc-200">{al.scores.dislocation} <span className="text-[10px] text-zinc-600">/20</span></span>
                          </div>
                          <div className="bg-zinc-900/40 p-2.5 rounded border border-zinc-800/60 col-span-2 sm:col-span-1">
                            <span className="block text-[9px] text-zinc-500">Geopolitics/Tailwind</span>
                            <span className="text-sm font-bold text-zinc-200">{al.scores.tailwind} <span className="text-[10px] text-zinc-600">/10</span></span>
                          </div>
                        </div>

                        {/* Recommendation Classification Ribbon */}
                        <div className="mt-4 flex items-center justify-between gap-4 flex-wrap border-t border-zinc-900 pt-3">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-zinc-500 uppercase font-mono font-bold">Decision recommendation:</span>
                            <span className={`px-2.5 py-1 text-xs font-bold border rounded font-mono leading-none ${getAlertClassificationStyle(al.classification)}`}>
                              {al.classification}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Technical Analysis Explainer Blocks */}
                      <div className="p-5 bg-zinc-900/10 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <span className="text-[10px] text-zinc-500 font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                              <span>Econophysics Paradigm Commentary</span>
                            </span>
                            <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                              {al.commentary}
                            </p>
                          </div>

                          <div className="space-y-3">
                            <div className="space-y-1">
                              <span className="text-[10px] text-zinc-500 font-mono font-bold uppercase tracking-wider block">
                                Volume-Price & Volatility Clustering Matrix
                              </span>
                              <p className="text-xs text-zinc-400 leading-normal">
                                {al.volumeAnalysis}
                              </p>
                            </div>

                            <div className="space-y-1">
                              <span className="text-[10px] text-zinc-500 font-mono font-bold uppercase tracking-wider block">
                                Systemic Narrative Status
                              </span>
                              <p className="text-xs text-zinc-400 leading-normal">
                                {al.narrativeAnalysis}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="text-xs bg-zinc-950 p-3 rounded-lg border border-zinc-900 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-emerald-500 shrink-0" />
                          <div className="text-[11px] text-zinc-400 font-mono">
                            <strong className="text-zinc-200">Tactical Playbook:</strong> {al.reason}
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: SCHEDULED PUBLICATIONS & GENERATOR */}
            {activeTab === 'publications' && (
              <div className="space-y-6">
                <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-xl space-y-6">
                  
                  {/* Compilation Interface Form */}
                  <form onSubmit={handleGenerateBrief} className="space-y-4 border-b border-zinc-800 pb-6">
                    <div>
                      <h3 className="text-lg font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-emerald-400" />
                        <span>Compile Real-Time Intelligence Publication</span>
                      </h3>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Demand immediate processing of global macro reports with customized focus areas.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] text-zinc-400 font-mono font-bold uppercase block">BRIEFING TYPE OUTLINE:</label>
                        <select
                          value={briefType}
                          onChange={(e) => setBriefType(e.target.value as BriefType)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-emerald-500"
                        >
                          <option value="Morning Brief (07:00)">Morning Brief (07:00) – Asia Open / Overnight Movers</option>
                          <option value="Midday Scan (12:00)">Midday Scan (12:00) – US Open Options Volatility</option>
                          <option value="Afternoon Digest (15:00)">Afternoon Digest (15:00) – US Liquidity / Spikes</option>
                          <option value="Evening Close (18:00)">Evening Close (18:00) – Strategy Scoring / Alloc</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-zinc-400 font-mono font-bold uppercase block">TAILORED MACRO FOCUS / CONSTRAINT:</label>
                        <input
                          type="text"
                          value={customFocus}
                          onChange={(e) => setCustomFocus(e.target.value)}
                          placeholder="e.g. Focus on US defense stocks / S&P tech selloffs"
                          className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={isGeneratingBrief}
                        className="bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-black px-5 py-2.5 rounded text-xs transition-colors flex items-center gap-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:opacity-40"
                      >
                        {isGeneratingBrief ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>PROCESSING INTEL AGENT SYNAPSE...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>COMPILE BRIEFING REPORT</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>

                  {/* Publications Selector Tabs */}
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {reports.map((rep) => (
                        <button
                          key={rep.id}
                          onClick={() => setSelectedReportId(rep.id)}
                          className={`px-3 py-2 rounded text-xs font-mono font-bold transition-all border ${
                            selectedReportId === rep.id
                              ? 'bg-emerald-950/40 border-emerald-500 text-emerald-400'
                              : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          {rep.type}
                        </button>
                      ))}
                    </div>

                    {selectedReport ? (
                      <div className="space-y-6 pt-2 font-mono">
                        
                        {/* Executive Summary Block */}
                        <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-xl space-y-3">
                          <h4 className="text-xs font-black uppercase text-emerald-400 flex items-center gap-2">
                            <Landmark className="w-4 h-4" />
                            <span>1. Executive summary & major moves</span>
                          </h4>
                          <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                            {selectedReport.executiveSummary}
                          </p>
                        </div>

                        {/* Grid breakdown sections */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          
                          {/* AI Boom Dynamics */}
                          <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-xl space-y-2.5">
                            <h4 className="text-xs font-black uppercase text-[#2be6ff] flex items-center gap-2">
                              <Cpu className="w-4 h-4 text-cyan-400" />
                              <span>2. AI boom & sovereign computing signals</span>
                            </h4>
                            <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                              {selectedReport.aiBoomNarratives}
                            </p>
                          </div>

                          {/* JSE Digest */}
                          <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-xl space-y-2.5">
                            <h4 className="text-xs font-black uppercase text-[#fcd34d] flex items-center gap-2">
                              <Globe className="w-4 h-4 text-amber-400" />
                              <span>3. JSE South African holding digest</span>
                            </h4>
                            <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                              {selectedReport.jseDigest}
                            </p>
                          </div>

                        </div>

                        {/* Allocation Guidelines */}
                        <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-xl space-y-3">
                          <h4 className="text-xs font-black uppercase text-white flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>4. Systemic Portfolio Allocation Guidance</span>
                          </h4>
                          <ul className="space-y-2 text-xs font-sans text-zinc-300">
                            {selectedReport.portfolioRecommendations.map((rec, i) => (
                              <li key={i} className="flex items-start gap-2.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5"></span>
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Watchlist & Risk Flags section */}
                        <div className="bg-zinc-900/40 border border-[#451214] p-5 rounded-xl space-y-3">
                          <h4 className="text-xs font-black uppercase text-rose-400 flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4" />
                            <span>5. Watchlist threshold & phase-transition risks</span>
                          </h4>
                          <ul className="space-y-2 text-xs font-sans text-zinc-300">
                            {selectedReport.watchlistRiskFlags.map((flag, i) => (
                              <li key={i} className="flex items-start gap-2.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-1.5"></span>
                                <span>{flag}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                      </div>
                    ) : (
                      <div className="text-center py-12 text-xs text-zinc-500">
                        No briefing report selected. Click one of the schedule buttons above to review data.
                      </div>
                    )}

                  </div>

                </div>
              </div>
            )}

            {/* TAB 2.5: THESIS-PRIMED CHAT INTERFACE */}
            {activeTab === 'chat' && (
              <div className="space-y-6">
                <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-xl space-y-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                        <Activity className="w-5 h-5 text-emerald-400" />
                        <span>Thesis-Primed Market Chat</span>
                      </h3>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Keep the whole DipGuard conversation anchored to your investment themes and ask questions in natural language.
                      </p>
                    </div>
                    <div className="text-xs text-zinc-500 font-mono">
                      Active thesis prompt loaded from server state.
                    </div>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
                    <div className="xl:col-span-5 space-y-4 bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl">
                      <h4 className="text-xs uppercase text-zinc-400 font-bold tracking-widest">Current Thesis Seed</h4>
                      <div className="text-[11px] text-zinc-300 leading-relaxed whitespace-pre-wrap font-sans">
                        {thesisPrompt || 'No thesis prompt loaded yet.'}
                      </div>
                      <form onSubmit={handleUpdateThesis} className="space-y-3">
                        <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Edit thesis seed for all future chats</label>
                        <textarea
                          value={thesisDraft}
                          onChange={(e) => setThesisDraft(e.target.value)}
                          rows={8}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 font-mono focus:outline-none focus:border-emerald-500"
                        />
                        <button
                          type="submit"
                          disabled={isUpdatingThesis}
                          className="w-full bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-black px-4 py-2 rounded text-xs transition-colors focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:opacity-40"
                        >
                          {isUpdatingThesis ? 'UPDATING THESIS...' : 'UPDATE THESIS PROMPT'}
                        </button>
                      </form>
                    </div>

                    <div className="xl:col-span-7 space-y-4">
                      <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl space-y-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <h4 className="text-sm font-bold text-white font-mono">DipGuard Chat Console</h4>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Ask about AI, semiconductors, cloud, defense, water, finance, property, gold, ETFs, and more.</p>
                          </div>
                          <span className="text-[10px] text-emerald-400 font-bold uppercase">Thesis-bound response mode</span>
                        </div>
                        <div className="space-y-3 h-[420px] overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-xs text-zinc-200">
                          {chatMessages.length === 0 ? (
                            <div className="text-zinc-500">No chat history yet. Send a message to begin the thesis-primed conversation.</div>
                          ) : (
                            chatMessages.map((msg, idx) => (
                              <div key={idx} className={`space-y-1 p-3 rounded-xl ${msg.role === 'assistant' ? 'bg-zinc-900 border border-emerald-900/30' : 'bg-zinc-950 border border-zinc-800'}`}>
                                <div className="flex items-center justify-between gap-2 text-[10px] uppercase tracking-widest font-bold text-zinc-500">
                                  <span>{msg.role === 'assistant' ? 'DipGuard' : 'You'}</span>
                                  <span>{msg.role === 'assistant' ? 'Thesis AI' : 'User'}</span>
                                </div>
                                <p className="text-xs leading-relaxed text-zinc-200 whitespace-pre-wrap">{msg.content}</p>
                                {msg.attachments?.length ? (
                                  <div className="pt-2 space-y-2">
                                    {msg.attachments.map((attachment) => (
                                      <a
                                        key={attachment.id}
                                        href={attachment.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-2 text-[10px] uppercase tracking-widest text-emerald-300 hover:bg-zinc-800"
                                      >
                                        <FileText className="w-3 h-3" />
                                        {attachment.filename}
                                      </a>
                                    ))}
                                  </div>
                                ) : null}
                              </div>
                            ))
                          )}
                        </div>
                        <form onSubmit={handleSendChat} className="space-y-3">
                          <textarea
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            rows={4}
                            placeholder="Ask DipGuard about the AI boom, defense demand, European cloud spend, semis supply, gold hedge, or global ETF rotation..."
                            className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 font-mono focus:outline-none focus:border-emerald-500"
                          />
                          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                            <div className="space-y-2">
                              <label className="block text-[10px] uppercase tracking-widest text-zinc-500">Attach image / PDF</label>
                              <input
                                type="file"
                                accept="image/*,.pdf"
                                onChange={handleAttachmentChange}
                                className="w-full rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-200"
                              />
                              {chatAttachment ? (
                                <div className="flex items-center justify-between gap-2 rounded border border-zinc-800 bg-zinc-900 px-3 py-2 text-[10px] text-zinc-300">
                                  <span>{chatAttachment.name}</span>
                                  <button
                                    type="button"
                                    onClick={() => setChatAttachment(null)}
                                    className="text-emerald-300 hover:text-white"
                                  >
                                    Clear
                                  </button>
                                </div>
                              ) : null}
                            </div>
                            <div className="space-y-2">
                              <button
                                type="button"
                                disabled={!chatAttachment || chatUploadingAttachment}
                                onClick={handleUploadAttachment}
                                className="w-full bg-sky-600 hover:bg-sky-500 text-zinc-950 font-black px-4 py-2 rounded text-xs transition-colors focus:ring-2 focus:ring-sky-500 focus:outline-none disabled:opacity-40"
                              >
                                {chatUploadingAttachment ? 'UPLOADING...' : 'UPLOAD ATTACHMENT'}
                              </button>
                              <button
                                type="submit"
                                disabled={isSendingChat}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-black px-4 py-2 rounded text-xs transition-colors focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:opacity-40"
                              >
                                {isSendingChat ? 'SYNTHESIZING RESPONSE...' : 'SEND MESSAGE'}
                              </button>
                            </div>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: TARGETED QUANT ASSET SCANNER */}
            {activeTab === 'scanner' && (
              <div className="space-y-6">
                <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-xl space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                      <Search className="w-5 h-5 text-emerald-400" />
                      <span>On-Demand Stock Dip Analyzer</span>
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Target any custom equity ticker and let DipGuard’s system calculate systemic Econophysics Opportunity Scores.
                    </p>
                  </div>

                  <form onSubmit={handlePerformScan} className="space-y-4 bg-zinc-900/40 p-5 rounded-xl border border-zinc-800">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                      
                      {/* Ticker Input */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-zinc-400 font-mono font-bold uppercase">Ticker:</label>
                        <input
                          type="text"
                          required
                          value={scanTicker}
                          onChange={(e) => setScanTicker(e.target.value.toUpperCase().slice(0, 10))}
                          placeholder="e.g. NVDA"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-100 font-mono focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      {/* Company Name */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-zinc-400 font-mono font-bold uppercase">Asset / Company Name:</label>
                        <input
                          type="text"
                          required
                          value={scanName}
                          onChange={(e) => setScanName(e.target.value)}
                          placeholder="e.g. Nvidia Corp"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      {/* Tier Selector */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-zinc-400 font-mono font-bold uppercase">Strategic Priority Tier:</label>
                        <select
                          value={scanTier}
                          onChange={(e) => setScanTier(Number(e.target.value))}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-xs text-zinc-100 font-mono focus:outline-none focus:border-emerald-500"
                        >
                          <option value="1">Tier 1 – Core Wealth Engine</option>
                          <option value="2">Tier 2 – Nasdaq Leaders</option>
                          <option value="3">Tier 3 – Future Infrastructure</option>
                          <option value="4">Tier 4 – South African (JSE)</option>
                          <option value="5">Tier 5 – Defense Contractors</option>
                          <option value="6">Tier 6 – Crisis Hedge (Gold)</option>
                        </select>
                      </div>

                      {/* Market / Country */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-zinc-400 font-mono font-bold uppercase">Market/Exchange:</label>
                        <select
                          value={scanMarket}
                          onChange={(e) => setScanMarket(e.target.value as any)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-xs text-zinc-100 font-mono focus:outline-none focus:border-emerald-500"
                        >
                          <option value="NASDAQ">NASDAQ</option>
                          <option value="JSE">Johannesburg Stock Exchange (JSE)</option>
                          <option value="ETF">ETF (Satrix/MSCI)</option>
                          <option value="OTHER">Other / Global</option>
                        </select>
                      </div>

                      {/* Change percentage */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-zinc-400 font-mono font-bold uppercase">Recent Drawdown Amount (%):</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={scanChange}
                          onChange={(e) => setScanChange(parseFloat(e.target.value))}
                          placeholder="e.g. -6.5"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-100 font-mono focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={isScanning}
                        className="bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-black px-6 py-2.5 rounded text-xs transition-colors flex items-center gap-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:opacity-40"
                      >
                        {isScanning ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>COMPUTING ECONOPHYSIC METRICS...</span>
                          </>
                        ) : (
                          <>
                            <Search className="w-3.5 h-3.5" />
                            <span>TRIGGER STRATEGY SCAN</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>

                  {/* Diagnostic Scan Output Display */}
                  {activeScanResult && (
                    <div className="bg-zinc-900 border-2 border-emerald-500/30 p-5 rounded-xl space-y-6">
                      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                        <div className="flex items-center gap-3">
                          <span className="text-xl font-mono font-black text-emerald-400 bg-emerald-950/40 border border-emerald-900/60 p-2.5 rounded-lg leading-none">
                            {activeScanResult.ticker}
                          </span>
                          <div>
                            <h4 className="text-base font-bold text-zinc-100 font-sans">{activeScanResult.name}</h4>
                            <span className="text-[10px] text-zinc-500 font-mono font-bold uppercase">
                              Ingested on-demand scan • {activeScanResult.market} • Tier {activeScanResult.tier}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-zinc-500 font-mono uppercase block">Total Opportunity Score</span>
                          <span className="text-4xl font-mono font-black text-white">{activeScanResult.scores.total} <span className="text-xs text-zinc-500">/100</span></span>
                        </div>
                      </div>

                      {/* Display Alert Outcome block */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                        <div className="md:col-span-8 space-y-4 text-xs">
                          
                          <div className="space-y-1">
                            <span className="font-bold text-zinc-300 uppercase font-mono block text-[10px]">Dip Reason Catalyst</span>
                            <p className="bg-zinc-950 p-3 rounded text-zinc-200 border border-zinc-800">
                              {activeScanResult.reason}
                            </p>
                          </div>

                          <div className="space-y-1">
                            <span className="font-bold text-zinc-300 uppercase font-mono block text-[10px]">Bouchaud & Stanley Volatility Profile</span>
                            <p className="text-zinc-400 leading-relaxed font-sans text-xs">
                              {activeScanResult.volumeAnalysis}
                            </p>
                          </div>

                          <div className="space-y-1">
                            <span className="font-bold text-zinc-300 uppercase font-mono block text-[10px]">Mandelbrot Long-Memory Narrative Coherence</span>
                            <p className="text-zinc-400 leading-relaxed font-sans text-xs">
                              {activeScanResult.narrativeAnalysis}
                            </p>
                          </div>

                        </div>

                        <div className="md:col-span-4 bg-zinc-950 p-4 border border-zinc-800 rounded-lg flex flex-col justify-between space-y-4">
                          <div>
                            <span className="text-[10px] font-mono text-zinc-500 uppercase block font-bold">Signal Recommendation</span>
                            <div className={`mt-2 p-2.5 rounded border font-mono text-xs text-center font-bold uppercase tracking-wider ${getAlertClassificationStyle(activeScanResult.classification)}`}>
                              {activeScanResult.classification}
                            </div>
                          </div>

                          <div className="border-t border-zinc-900 pt-3 text-[11px] font-sans text-zinc-400 space-y-2">
                            <div className="flex justify-between">
                              <span>Fundamentals:</span>
                              <span className="font-mono text-zinc-200 font-bold">{activeScanResult.scores.fundamentals}/30</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Narrative:</span>
                              <span className="font-mono text-zinc-200 font-bold">{activeScanResult.scores.narrative}/20</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Volume Confirmation:</span>
                              <span className="font-mono text-zinc-200 font-bold">{activeScanResult.scores.volume}/20</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Dislocation Factor:</span>
                              <span className="font-mono text-zinc-200 font-bold">{activeScanResult.scores.dislocation}/20</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Tailwind Multiplier:</span>
                              <span className="font-mono text-zinc-200 font-bold">{activeScanResult.scores.tailwind}/10</span>
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                  )}

                </div>
              </div>
            )}

            {/* TAB 4: INTERACTIVE STRESS PLAYGROUND */}
            {activeTab === 'playground' && (
              <PlaygroundView />
            )}

            {/* TAB 5: PORTFOLIO CAPITAL ALLOCATION */}
            {activeTab === 'portfolio' && (
              <div className="space-y-6">
                <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-xl space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-emerald-400" />
                      <span>DipGuard Systematic Capital Allocation Engine</span>
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Configure monthly capital distribution based on strict prioritizations and exchange rate adjustments.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <div className="bg-zinc-900/40 p-5 rounded-xl border border-zinc-800">
                      <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400 mb-4">
                        <UploadCloud className="w-4 h-4 text-emerald-400" />
                        <span>Upload PDF for stock tracking</span>
                      </div>

                      <form onSubmit={handleUploadPdf} className="space-y-4">
                        <div>
                          <label className="block text-[10px] text-zinc-400 uppercase font-mono font-bold mb-2">Upload document</label>
                          <input
                            type="file"
                            name="pdfFile"
                            accept="application/pdf"
                            className="w-full text-xs text-zinc-200 file:bg-zinc-900 file:border file:border-zinc-800 file:px-3 file:py-2 file:text-zinc-100 file:rounded-lg"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={isUploadingPdf}
                          className="w-full bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-black px-4 py-2.5 rounded text-xs transition-colors flex items-center justify-center gap-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:opacity-40"
                        >
                          {isUploadingPdf ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span>ANALYZING PDF...</span>
                            </>
                          ) : (
                            <>
                              <FileText className="w-4 h-4" />
                              <span>PARSE PDF & EXTRACT TICKERS</span>
                            </>
                          )}
                        </button>
                      </form>

                      <div className="mt-4 text-xs text-zinc-300 space-y-3">
                        <p className="text-zinc-400">{pdfUploadStatus || 'Upload a PDF containing your portfolio notes, watchlists, or stock research to extract ticker symbols automatically.'}</p>
                        {pdfExtractedSnippet && (
                          <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-lg text-[11px] text-zinc-300">
                            <div className="font-mono uppercase text-[9px] text-zinc-500 mb-2">Extracted PDF snippet</div>
                            <p className="whitespace-pre-line">{pdfExtractedSnippet}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-zinc-900/40 p-5 rounded-xl border border-zinc-800 space-y-4">
                      <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400">
                        <FileText className="w-4 h-4" />
                        <span>Tracked tickers from PDF</span>
                      </div>

                      {trackedTickers.length > 0 ? (
                        <div className="space-y-3">
                          {trackedTickers.map((ticker) => (
                            <div key={ticker} className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 flex items-center justify-between gap-3">
                              <div>
                                <div className="text-xs uppercase tracking-widest text-zinc-500 font-mono">Ticker</div>
                                <div className="text-lg font-bold text-white font-mono">{ticker}</div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleScanTrackedTicker(ticker)}
                                className="text-[10px] font-bold uppercase tracking-wider px-3 py-2 rounded border border-emerald-500 text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                              >
                                Scan Dip
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-zinc-500">
                          No tickers extracted yet. Upload a PDF and let DipGuard detect the symbols to track.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* USD/ZAR Currency impacts and converter interactive */}
                  <div className="bg-zinc-900/40 p-5 rounded-xl border border-zinc-800 space-y-4">
                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400">
                      <Landmark className="w-4 h-4 text-emerald-400" />
                      <span>LIVE USD/ZAR EXPOSURE CALCULATOR (OFFSHORE REBALANCING BUFFER)</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
                      <div className="space-y-1">
                        <label className="text-zinc-500 uppercase block font-bold text-[10px]">South African Rands (ZAR):</label>
                        <input
                          type="number"
                          value={randAmount}
                          onChange={(e) => setRandAmount(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 font-mono text-zinc-200 text-xs focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-zinc-500 uppercase block font-bold text-[10px]">Actual Exchange Rate (USD/ZAR):</label>
                        <input
                          type="number"
                          step="0.01"
                          value={usdZarRate}
                          onChange={(e) => setUsdZarRate(parseFloat(e.target.value) || 18.00)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 font-mono text-zinc-200 text-xs focus:outline-none"
                        />
                      </div>

                      <div className="bg-zinc-950/80 p-3 rounded border border-zinc-800 flex flex-col justify-between">
                        <span className="text-[9px] text-zinc-500 uppercase font-bold">Estimated Offshore Capital (USD):</span>
                        <span className="text-base font-bold text-emerald-400 font-mono mt-1">${usdEquivalent}</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                      💡 <strong className="text-zinc-300">Offshore Hedging Rule:</strong> When the ZAR is weak (&gt; R18.50 per USD), favor JSE-listed multinationals (Shoprite, Standard Bank) or local indices to avoid the "Rand Flight markup". If USD/ZAR &lt; R18.00, aggressively fund satrix Nasdaq 100 ETFs.
                    </p>
                  </div>

                  {/* Alloc Priorities list */}
                  <div className="space-y-3 font-sans text-xs">
                    <h4 className="text-xs text-zinc-300 font-mono font-bold uppercase tracking-wider">
                      Strategic Capital Priority Sequence order
                    </h4>

                    <div className="space-y-3">
                      <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800 flex gap-4 items-start">
                        <span className="w-7 h-7 rounded-full bg-emerald-950 text-emerald-400 font-bold font-mono text-xs flex items-center justify-center shrink-0 border border-emerald-800">
                          1
                        </span>
                        <div>
                          <strong className="text-zinc-200 block font-mono">Existing Growth Holdings (Intact Thesis)</strong>
                          <span className="text-zinc-400 text-[11px] block mt-0.5">
                            Always defend core holdings with high capital priority. If NVIDIA or Palantir experience a -5% tear on zero fundamental news, divert available cash buffers here first.
                          </span>
                        </div>
                      </div>

                      <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800 flex gap-4 items-start">
                        <span className="w-7 h-7 rounded-full bg-emerald-950 text-emerald-400 font-bold font-mono text-xs flex items-center justify-center shrink-0 border border-emerald-800">
                          2
                        </span>
                        <div>
                          <strong className="text-zinc-200 block font-mono">Core Index tracking ETFs</strong>
                          <span className="text-zinc-400 text-[11px] block mt-0.5">
                            Satrix Nasdaq 100 and Satrix MSCI World represent excellent pass-through vehicles to hedge ZAR capital erosion during high volatility global regime changes.
                          </span>
                        </div>
                      </div>

                      <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800 flex gap-4 items-start">
                        <span className="w-7 h-7 rounded-full bg-emerald-950 text-emerald-400 font-bold font-mono text-xs flex items-center justify-center shrink-0 border border-emerald-800">
                          3
                        </span>
                        <div>
                          <strong className="text-zinc-200 block font-mono">Future Infrastructure & sovereign Projects</strong>
                          <span className="text-zinc-400 text-[11px] block mt-0.5">
                            Sovereign governments globally are installing local GPU data systems. Focus on AMD, TSMC, and Palantir.
                          </span>
                        </div>
                      </div>

                      <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800 flex gap-4 items-start">
                        <span className="w-7 h-7 rounded-full bg-emerald-950 text-emerald-400 font-bold font-mono text-xs flex items-center justify-center shrink-0 border border-emerald-800">
                          4
                        </span>
                        <div>
                          <strong className="text-zinc-200 block font-mono">NATO Defense Contractors & Tacticals</strong>
                          <span className="text-zinc-400 text-[11px] block mt-0.5">
                            Drones, satellite links, electronic warfare components have high secular tailwinds (Tier 5 tailwinds).
                          </span>
                        </div>
                      </div>

                      <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800 flex gap-4 items-start">
                        <span className="w-7 h-7 rounded-full bg-emerald-950 text-emerald-400 font-bold font-mono text-xs flex items-center justify-center shrink-0 border border-emerald-800">
                          5
                        </span>
                        <div>
                          <strong className="text-zinc-200 block font-mono">Gold & Physical Crisis Hedges</strong>
                          <span className="text-zinc-400 text-[11px] block mt-0.5">
                            AngloGold Ashanti (JSE) and NewGold ETFs remain safe harbor instruments for volatility spikes above historical Benoit Mandelbrot clusters.
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* TAB 6: REFERENCE MANUAL */}
            {activeTab === 'reference' && (
              <div className="space-y-6">
                <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-xl space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-emerald-400" />
                      <span>DipGuard Econophysics Paradigm Reference Manual</span>
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Grounding financial strategy in non-linear dynamic science rather than fragile models.
                    </p>
                  </div>

                  <div className="space-y-5 text-xs text-zinc-300 font-sans leading-relaxed">
                    
                    <div className="p-4 bg-zinc-900/40 rounded-xl border border-zinc-800 space-y-2">
                      <h4 className="font-bold text-zinc-100 font-mono flex items-center gap-2">
                        <span className="w-2 h-2 rounded bg-emerald-400"></span>
                        <span>1. Fat Tails Theory (Benoit Mandelbrot)</span>
                      </h4>
                      <p className="text-zinc-400">
                        Financial distributions do not fit Gaussian bell-curves. Massive drawdowns (&gt; 5% in a single session) are statistically common and do not reflect catastrophic structural ruin for superior franchises. They are temporary liquidity-driven anomalies that create historical bargains.
                      </p>
                    </div>

                    <div className="p-4 bg-zinc-900/40 rounded-xl border border-zinc-800 space-y-2">
                      <h4 className="font-bold text-zinc-100 font-mono flex items-center gap-2">
                        <span className="w-2 h-2 rounded bg-emerald-400"></span>
                        <span>2. Volatility Clustering (Eugene Stanley)</span>
                      </h4>
                      <p className="text-zinc-400">
                        "High volatility follows high volatility, low volatility follows low volatility." Do not jump into a tumbling trade instantly. Wait for peak distribution intensity to fade and buy blocks on volume tapering, allowing the cluster to consolidate safely.
                      </p>
                    </div>

                    <div className="p-4 bg-zinc-900/40 rounded-xl border border-zinc-800 space-y-2">
                      <h4 className="font-bold text-zinc-100 font-mono flex items-center gap-2">
                        <span className="w-2 h-2 rounded bg-emerald-400"></span>
                        <span>3. Agent-Based Dynamics & Bouchaud Liquidity</span>
                      </h4>
                      <p className="text-[#9ca3af]">
                        Local prices depend on heterogeneous interactions. Dips occur when retail stop-losses trigger cascade selling, while multi-billion-dollar sovereign wealth quants quietly program block accumulation underneath. Identifying these buy blocks is the key to timing reversals.
                      </p>
                    </div>

                    <div className="p-4 bg-zinc-900/40 rounded-xl border border-zinc-800 space-y-2">
                      <h4 className="font-bold text-zinc-100 font-mono flex items-center gap-2">
                        <span className="w-2 h-2 rounded bg-emerald-400"></span>
                        <span>4. Narrative Detection (Didier Sornette)</span>
                      </h4>
                      <p className="text-zinc-400">
                        When fundamental growth parameters of secular tailwinds (Blackwell chip orders, tactical AI drones) remain unimpaired, but negative media reports trigger an emotional exit, an actionable "Sentiment Dislocation Gap" is created.
                      </p>
                    </div>

                  </div>
                </div>
              </div>
            )}

          </section>

          {/* RIGHT SIDEBAR PANEL: LIVE CATALYST & INGESTION BLOCK */}
          <aside className="lg:col-span-4 space-y-6">

            {/* Strategic Priorities At-A-Glance reference panel */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-4">
              <h4 className="text-xs font-mono font-bold text-zinc-100 uppercase tracking-widest flex items-center gap-2 border-b border-zinc-900 pb-3">
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>Monitoring Priority Tiers</span>
              </h4>

              <div className="space-y-3.5 text-xs font-sans">
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-zinc-200">Tier 1: Core Wealth</span>
                    <span className="text-[10px] text-emerald-400 font-mono uppercase bg-emerald-950/40 px-2 py-0.5 rounded">Highest</span>
                  </div>
                  <p className="text-zinc-400 leading-normal text-[11px]">
                    NVIDIA, Palantir, Microsoft, Azure Cloud, TSMC, Satrix Nasdaq 100
                  </p>
                </div>

                <div className="space-y-1 border-t border-zinc-900/60 pt-2.5">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-zinc-200">Tier 2: Nasdaq Leaders</span>
                    <span className="text-[10px] text-zinc-400 font-mono uppercase bg-zinc-900 px-2 py-0.5 rounded">High</span>
                  </div>
                  <p className="text-zinc-400 leading-normal text-[11px]">
                    Tesla, Apple, Salesforce, ServiceNow, Salesforce, Oracle AMD
                  </p>
                </div>

                <div className="space-y-1 border-t border-zinc-900/60 pt-2.5">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-zinc-200">Tier 3: Space & Cyb</span>
                    <span className="text-[10px] text-zinc-400 font-mono uppercase bg-zinc-900 px-2 py-0.5 rounded">Alpha</span>
                  </div>
                  <p className="text-zinc-400 leading-normal text-[11px]">
                    SpaceX (news-only), BlackBerry, Nokia Telecoms
                  </p>
                </div>

                <div className="space-y-1 border-t border-zinc-900/60 pt-2.5">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-zinc-200">Tier 4: South Africa JSE</span>
                    <span className="text-[10px] text-zinc-400 font-mono uppercase bg-zinc-900 px-2 py-0.5 rounded">Hedge</span>
                  </div>
                  <p className="text-zinc-400 leading-normal text-[11px]">
                    Shoprite, Discovery, Aspen Pharmacare, MTN, Vodacom, FirstRand, Standard Bank
                  </p>
                </div>

                <div className="space-y-1 border-t border-zinc-900/60 pt-2.5">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-zinc-200">Tier 5-6: Defense & Crisis</span>
                    <span className="text-[10px] text-zinc-400 font-mono uppercase bg-zinc-900 px-2 py-0.5 rounded">Defence</span>
                  </div>
                  <p className="text-zinc-400 leading-normal text-[11px]">
                    Aerospace index ETFs, Physical Gold, AngloGold Ashanti
                  </p>
                </div>
              </div>
            </div>

            {/* Live Activity Pipeline Event Injector Component */}
            <ActivityLogs logs={logs} onAddCustomEvent={addNewLog} />

            {/* Political Catalyst & Statements monitoring box */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-3.5">
              <h4 className="text-xs font-mono font-bold text-zinc-100 uppercase tracking-widest flex items-center gap-2 border-b border-zinc-900 pb-3">
                <Flame className="w-4 h-4 text-cyan-400" />
                <span>Huang & Trump Watch</span>
              </h4>

              <div className="space-y-3 text-[11.5px] font-sans">
                <div className="bg-zinc-900/40 p-3 rounded border border-zinc-800 space-y-1">
                  <strong className="text-cyan-400 block font-mono text-[10px] uppercase">Jensen Huang Statement:</strong>
                  <p className="text-zinc-300">
                    "Every nation needs its own Sovereign AI infrastructure. Generative capability is too precious to contract out."
                  </p>
                  <span className="text-[10px] text-zinc-500 font-mono tracking-wider block pt-1">TRANSCRIPT CHECK: CONFIRMED VERACITY</span>
                </div>

                <div className="bg-zinc-900/40 p-3 rounded border border-zinc-800 space-y-1">
                  <strong className="text-cyan-400 block font-mono text-[10px] uppercase">President Donald Trump Feed:</strong>
                  <p className="text-zinc-300">
                    "Tariffs are the greatest economic tools ever created. We will rebuild manufacturing and protect sovereign defense borders."
                  </p>
                  <span className="text-[10px] text-zinc-500 font-mono tracking-wider block pt-1">TRANSCRIPT CHECK: SEC REGULATION RISK ACTIVE</span>
                </div>
              </div>
            </div>

          </aside>

        </div>
      </main>

      <footer className="border-t border-zinc-800 py-12 px-6 bg-[#040608] text-xs font-mono text-zinc-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left space-y-1">
            <span className="block text-zinc-400 font-bold tracking-widest text-[13px]">DIPGUARD QUANT LTD SAST</span>
            <p className="text-[11px] leading-relaxed">
              Econophysics engine running under license of modern fat-tail non-gaussian models. No individual advisory claims generated.
            </p>
          </div>
          <div className="flex gap-4">
            <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider bg-emerald-950/20 px-3 py-1 rounded border border-emerald-900">
              Agent State: Operating
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

