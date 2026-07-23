import { useState } from 'react';
import { Sliders, RefreshCw, AlertCircle, Info, Zap, TrendingDown } from 'lucide-react';

export default function PlaygroundView() {
  const [ticker, setTicker] = useState('CUSTOM');
  const [fundamentals, setFundamentals] = useState(25);
  const [narrative, setNarrative] = useState(16);
  const [volume, setVolume] = useState(12);
  const [dislocation, setDislocation] = useState(14);
  const [tailwind, setTailwind] = useState(7);

  const total = fundamentals + narrative + volume + dislocation + tailwind;

  const getClassification = (score: number) => {
    if (score >= 80) return { label: '🟢 Strong Buy Opportunity', color: 'text-emerald-400 bg-emerald-950/20 border-emerald-900' };
    if (score >= 60) return { label: '🟡 Watch Closely', color: 'text-amber-400 bg-amber-950/20 border-amber-900' };
    return { label: '🔴 Avoid the Dip', color: 'text-rose-400 bg-rose-950/20 border-rose-900' };
  };

  const classification = getClassification(total);

  // Compute mock econophysics parameters
  const fatTailRisk = Math.min(100, Math.round((dislocation * 3.5) + (fundamentals * 0.8)));
  const stabilizationRate = Math.min(100, Math.round((volume * 4) + (tailwind * 2)));
  const memoryPersistence = fundamentals > 20 ? 'Strong Positive Trend' : 'Weakening Momentum';

  const resetSliders = () => {
    setFundamentals(20);
    setNarrative(14);
    setVolume(10);
    setDislocation(12);
    setTailwind(5);
  };

  return (
    <div className="space-y-6">
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div>
            <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-emerald-400" />
              <span>Econophysics Playground & Stress Sandbox</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Model hypothetical asset corrections and compute real-time DipGuard Opportunity Scores.
            </p>
          </div>
          <button
            onClick={resetSliders}
            className="text-xs bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset Sliders</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
          {/* Sliders Input Panel (Left) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">ASSET TICKER:</span>
              <input
                type="text"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase().slice(0, 10))}
                className="bg-zinc-900 border border-zinc-800 text-sm font-mono text-emerald-400 rounded px-2.5 py-1 w-28 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Slider: Fundamentals */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                  1. Fundamentals Moat <span className="text-zinc-500 font-normal">(Competitive moat, margin guidance)</span>
                </span>
                <span className="font-mono text-emerald-400 font-bold">{fundamentals} / 30</span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                value={fundamentals}
                onChange={(e) => setFundamentals(Number(e.target.value))}
                className="w-full h-1.5 bg-zinc-900 accent-emerald-500 rounded-lg cursor-pointer"
              />
            </div>

            {/* Slider: Narrative Strength */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                  2. Narrative Coherence <span className="text-zinc-500 font-normal">(AI demand, Defense supercycle)</span>
                </span>
                <span className="font-mono text-emerald-400 font-bold">{narrative} / 20</span>
              </div>
              <input
                type="range"
                min="0"
                max="20"
                value={narrative}
                onChange={(e) => setNarrative(Number(e.target.value))}
                className="w-full h-1.5 bg-zinc-900 accent-emerald-500 rounded-lg cursor-pointer"
              />
            </div>

            {/* Slider: Volume Confirmation */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                  3. Volume-Price Balance <span className="text-zinc-500 font-normal">(Slowing sell volume, buying block)</span>
                </span>
                <span className="font-mono text-emerald-400 font-bold">{volume} / 20</span>
              </div>
              <input
                type="range"
                min="0"
                max="20"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-full h-1.5 bg-zinc-900 accent-emerald-500 rounded-lg cursor-pointer"
              />
            </div>

            {/* Slider: Sentiment Dislocation */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                  4. Sentiment Dislocation <span className="text-zinc-500 font-normal">(Unjustified news panic over business value)</span>
                </span>
                <span className="font-mono text-emerald-400 font-bold">{dislocation} / 20</span>
              </div>
              <input
                type="range"
                min="0"
                max="20"
                value={dislocation}
                onChange={(e) => setDislocation(Number(e.target.value))}
                className="w-full h-1.5 bg-zinc-900 accent-emerald-500 rounded-lg cursor-pointer"
              />
            </div>

            {/* Slider: Geopolitical/Tailwind */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                  5. Macro / Geopolitical Bias <span className="text-zinc-500 font-normal">(Tariffs, defense spend, regulatory)</span>
                </span>
                <span className="font-mono text-emerald-400 font-bold">{tailwind} / 10</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={tailwind}
                onChange={(e) => setTailwind(Number(e.target.value))}
                className="w-full h-1.5 bg-zinc-900 accent-emerald-500 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Scores & Gauge Display (Right) */}
          <div className="lg:col-span-5 bg-zinc-900/60 p-5 rounded-xl border border-zinc-800 space-y-6">
            <div className="text-center py-4 border-b border-zinc-800">
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Computed Econophysics Opportunity Score</span>
              <div className="text-6xl font-black font-mono tracking-tight text-white mt-1">
                {total}
              </div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono mt-1">out of 100 max</div>

              <div className={`mt-4 px-3 py-2 rounded-lg border text-xs font-bold leading-relaxed uppercase tracking-wider inline-block ${classification.color}`}>
                {classification.label}
              </div>
            </div>

            <div className="space-y-4 font-mono text-xs">
              <h4 className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
                <span>Mandelbrot & Stanley State Metrics</span>
              </h4>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-950 p-2.5 rounded border border-zinc-800">
                  <div className="text-[10px] text-zinc-500 uppercase">Fat-Tail Divergence</div>
                  <div className="text-base font-bold text-zinc-100 mt-1">{fatTailRisk}%</div>
                  <div className="text-[9px] text-zinc-500 mt-0.5">Mandelbrot extremity factor</div>
                </div>

                <div className="bg-zinc-950 p-2.5 rounded border border-zinc-800">
                  <div className="text-[10px] text-zinc-500">Stabilization Speed</div>
                  <div className="text-base font-bold text-zinc-100 mt-1">{stabilizationRate}%</div>
                  <div className="text-[9px] text-zinc-500 mt-0.5">Stanley volatility cluster delay</div>
                </div>
              </div>

              <div className="bg-zinc-950/80 p-3 rounded border border-zinc-800 flex items-start gap-2">
                <Info className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-400 uppercase font-bold">Long-Memory Momentum Matrix</span>
                  <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                    Long range dependencies represent a status coefficient of <span className="font-mono text-emerald-400">{memoryPersistence}</span>. Under Sornette criteria, this setup represents a {total >= 80 ? 'highly persistent non-linear value basin.' : 'standard volatile recovery path.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
