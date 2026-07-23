# DipGuard Quant — Financial Intelligence Buy-the-Dip Agent

**DipGuard Quant** is an autonomous financial intelligence system built on the principles of **Econophysics** (such as Benoit Mandelbrot's Fat Tails, Eugene Stanley's Volatility Clustering, and Jean-Philippe Bouchaud's Agent-Based Dynamics). Operating strictly under the **SAST (South Africa Standard Time)** timezone schedule, it filters market fear, macro noise, and sentiment dislocations to detect high-conviction buy-the-dip moments in global growth assets (NASDAQ, S&P 500) and premium South African companies (JSE-listed).

The system features dynamic server-side intelligence driven by the **Gemini 3.5 Flash** model with full fallback to an elegant sandboxed physics model in case of missing keys.

---

## 🚀 Technology Stack & Versions

- **Frontend & App Core**: React 19.x (TypeScript SPA template bundled via Vite 6.x)
- **Styling**: Tailwind CSS v4.x (using utility classes and modern modular configuration)
- **Backend App Server**: Node.js & Express 4.x configured in full-stack proxy architecture to isolate secrets (e.g. `GEMINI_API_KEY`) from browser access
- **Dev Compiler**: TypeScript TSX execution pipeline via `tsx`
- **Prod Bundler**: Vite 6.x (client bundle) + Esbuild 0.25 (bundled CJS Node server targeting `dist/server.cjs`)
- **Animation Framework**: Motion 12.x
- **Icons**: Lucide React 0.546.x

---

## 🛠️ Project Setup & Installation Guidelines

### Prerequisites
Make sure you have Node.js (v18.x or above) and `npm` installed on your machine.

### 1. Extract files
You can export this entire codebase as a portable ZIP archive from the **Settings / Export** menu inside Google AI Studio, or clone direct to your workspace.

### 2. Install Project Dependencies
In your workspace terminal, install the bundled npm dependencies:
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env` file at the root of the project copied from the provided example (`.env.example`):
```bash
cp .env.example .env
```
Populate your environment variables inside `.env`:
```env
# Required for actual live AI analyses
GEMINI_API_KEY="your-google-gemini-api-key"
APP_URL="http://localhost:3000"
```
*Note: If `GEMINI_API_KEY` is not present, the system will automatically fall back to an elegant offline mathematical simulation layer to maintain full prototype utility.*

### 4. Running the Development Server
Power on the dual full-stack environment using:
```bash
npm run dev
```
The server will boot and begin listening on **`http://localhost:3000`** (which serves both your API proxies and the Hot-Module Vite compiler to ensure no cross-origin errors).

### 5. Production Build and Run
To package files for secure container distribution or high-performance deployment:
```bash
npm run build
npm run start
```

---

## 🗺️ Application User Guide & Tab Architecture

DipGuard Quant's interface is divided into modular, high-conviction tabs designed for systematic buy-the-dip execution:

### 1. 🟢 Buy-The-Dip Alerts
- **Scoring Grid**: Displays premium opportunity cards ranked by their computed **Econophysics Score (0–100)**.
- **Deep Metrics**: Dissects the score into five core pillars: Fundamental Moats (30 pts), Narrative Coherence (20 pts), Volatility/Volume Confirmation (20 pts), Sentiment Dislocation (20 pts), and Geopolitical Tailwinds (10 pts).
- **Physical Analysis**: Explains the rationale under the Mandelbrot "Fat-Tail" extreme event model and the Stanley Stanley Volatility Clustering timeframe.

### 2. 📰 Intelligence briefs & Publications
- **Chronological Reports**: Access scheduled briefings published sequentially based on the SAST trading day:
  - **07:00 SAST** — Morning Brief: Asia reactions, overnight movers, and ZAR currency hedging dynamics.
  - **12:00 SAST** — Midday Scan: US open options, volatility shifts pre-market.
  - **15:00 SAST** — Afternoon Volatility: High liquidity spikes, peak market dislocations.
  - **18:00 SAST** — Evening Capital Allocation Strategy: Full daily close summary and scoring index.
- **On-Demand Generator**: Feed custom prompts or focal constraints (e.g. *"Focus on high-speed tech trade tariffs"*) into Gemini to generate tailored reports instantly.

### 3. 🔍 On-Demand Quant Scanner
- Enter any stock ticker (e.g., `AMD`, `TSLA`, `MTN`, `CPI`) from JSE or NASDAQ.
- Provide its priority tier, market, and recent drawdown level (e.g. `-12.5%`).
- Trigger the strategy scan to pull structural news, calculate raw volatility thresholds, and append the analyzed object directly to your primary watch feed.

### 4. 🎛️ Sandbox Playground
- Adjust sliders across the five econophysics metrics to stress-test theoretical selloffs.
- Interactively computes a real-time DipGuard Opportunity Score.
- Outputs dynamic Mandelbrot Extremity factors, Volatility cluster delays, and Phase Transition coefficients.

### 5. 💼 Capital Allocation & Portfolio Tracker
- **Wealth Portfolio**: Monitor your fictitious or actual assets loaded across South African (ZAR) and global (USD) counters.
- **ZAR/USD Dynamic Converter**: Calculate how currency depreciation impacts your offshore exposure using custom hedging coefficients.
- **Core Priority Ordering Order**: Follow the system's strict priority order for deploying monthly capital: *Existing Core Holdings -> Passive Index ETFs -> Big Tech Infrastructure -> Satellite/Telecom -> Defense Contractors -> Gold Hedges*.

### 6. 🎙️ Live Ingestion Feed & Injected Catalysts
- Located side-by-side with the main tabs, this log feed logs live news, SAST scheduling times, and model updates.
- Use the **Custom Catalyst Injector** at the bottom of the log module to simulate immediate macro changes (such as global tariff announcements or interest rate pivots) to see how the quant system responds.
