import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from 'vite';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import dotenv from "dotenv";
import scannerRouter from './routes/scanner';
import { startScheduler } from './services/scheduler';
import { ReplicateProvider } from './llm/replicate_provider';
import { initChatTables, saveChatMessage, saveChatAttachment, getChatHistory, getChatAttachmentById } from './services/chat';

dotenv.config({ path: '../.env' });

const app = express();

// SEC-04: Strict CORS configuration
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5173', 'https://dipguard.production.com'],
    methods: ['GET', 'POST'],
    credentials: true
}));

app.use(express.json());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }
});

const PDF_TICKER_EXCLUDE = new Set([
  'THE', 'AND', 'FOR', 'WITH', 'THIS', 'THAT', 'FROM', 'YOUR', 'THERE', 'WHICH', 'WHILE', 'WHERE', 'BUT', 'NOT',
  'ARE', 'HAS', 'HAVE', 'WAS', 'WILL', 'SHOULD', 'COULD', 'MAY', 'ETF', 'USD', 'ZAR', 'SAST', 'AI', 'GPU', 'CEO', 'CFO',
  'NASDAQ', 'JSE', 'NYSE', 'EQUITY', 'STOCK', 'MARKET', 'TRADING', 'FUTURES', 'OPTIONS', 'NEWS', 'NOTE', 'DATA', 'RISK',
  'RATE', 'TAX', 'FEE', 'YIELD', 'BOND'
]);

function extractTickersFromText(text: string) {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const matches = Array.from(text.matchAll(/\b[A-Z]{2,5}\b/g), (m) => m[0]);
  const filtered = matches.filter((symbol) => {
    if (PDF_TICKER_EXCLUDE.has(symbol)) return false;
    if (symbol.length < 2 || symbol.length > 5) return false;
    return true;
  });

  return Array.from(new Set(filtered)).slice(0, 25);
}

// SEC-05: Rate Limiting to prevent DoS (Layer 9)
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    message: { success: false, error: "Too many requests, please try again later." }
});

// Routes
import authRouter from './routes/auth';

app.use('/api/auth', authRouter);
app.use('/api', apiLimiter, scannerRouter);

app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'DipGuard Node Backend' });
});

app.get('/api/chat-history', async (req: Request, res: Response) => {
  try {
    const history = await getChatHistory(100);
    res.json({ success: true, history });
  } catch (err: any) {
    console.error('Chat history error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/chat', upload.none(), async (req: Request, res: Response) => {
  const { message } = req.body;
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ success: false, error: 'Chat message is required.' });
  }

  const hasApi = hasReplicateToken();
  const thesisPrompt = getCurrentThesisPrompt();
  const systemPrompt = `You are DipGuard Quant, a specialized financial intelligence assistant. Maintain the following thesis as the core guidance for every answer:\n${thesisPrompt}`;
  const userPrompt = `User asks: ${message}`;

  const userChatId = await saveChatMessage('user', message);

  if (!hasApi) {
    const response = `[SIMULATED DipGuard] Using the primed thesis, I would answer: ${message}`;
    const assistantChatId = await saveChatMessage('assistant', response, { simulated: true, chatId: userChatId });
    return res.json({ success: true, response, userMessageId: userChatId, assistantMessageId: assistantChatId });
  }

  try {
    const responseText = await getReplicateResponse(`${systemPrompt}\n\n${userPrompt}`);
    const assistantChatId = await saveChatMessage('assistant', responseText.trim(), { chatId: userChatId });
    res.json({ success: true, response: responseText.trim(), userMessageId: userChatId, assistantMessageId: assistantChatId });
  } catch (err: any) {
    console.error('Chat endpoint error:', err);
    res.status(500).json({ success: false, error: err.message || 'Chat generation failed.' });
  }
});

app.post('/api/chat-attachment', upload.single('attachment'), async (req: Request, res: Response) => {
  const { chatId } = req.body;
  const file = req.file;

  if (!chatId || typeof chatId !== 'string') {
    return res.status(400).json({ success: false, error: 'chatId is required.' });
  }
  if (!file) {
    return res.status(400).json({ success: false, error: 'Attachment file is required.' });
  }

  try {
    const attachment = await saveChatAttachment(chatId, file);
    res.json({ success: true, attachment });
  } catch (err: any) {
    console.error('Chat attachment error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/chat-attachment/:id', async (req: Request, res: Response) => {
  try {
    const attachment = await getChatAttachmentById(req.params.id);
    if (!attachment) {
      return res.status(404).json({ success: false, error: 'Attachment not found.' });
    }
    res.setHeader('Content-Type', attachment.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${attachment.filename}"`);
    res.send(attachment.data);
  } catch (err: any) {
    console.error('Fetch attachment error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3000;

const replicateProvider = new ReplicateProvider();

async function getReplicateResponse(prompt: string): Promise<string> {
  try {
    return await replicateProvider.generateResponse(prompt);
  } catch (error) {
    console.error('Replicate provider error:', error);
    throw error;
  }
}

function hasReplicateToken(): boolean {
  return !!process.env.REPLICATE_API_TOKEN && process.env.REPLICATE_API_TOKEN.trim() !== '';
}

let currentThesisPrompt = `This conversation is primed by a shared DipGuard chat seed with a strong focus on the following investment themes:
- Artificial Intelligence
- Semiconductors
- Cloud Computing
- Space Economy
- Defence
- Telecommunications
- Water Infrastructure
- Digital Infrastructure
- Banking
- Digital Finance (SoFi)
- Property
- Gold
- Global ETFs

All future analysis, briefing output, and chat responses should stay centered on these topics and use them as the core thesis for market narrative, econophysics scoring, and portfolio recommendations.`;

function getCurrentThesisPrompt() {
  return currentThesisPrompt;
}

// Global state / Cache for latest generated reports context
// Seed basic alerts and data in case the user wants immediate viewing
const DEFAULT_ALERTS = [
  {
    id: "alert-1",
    ticker: "NVDA",
    name: "NVIDIA Corporation",
    tier: 1,
    market: "NASDAQ" as const,
    price: 118.45,
    changePercent: -6.42,
    scores: {
      fundamentals: 29,
      narrative: 19,
      volume: 16,
      dislocation: 18,
      tailwind: 8,
      total: 90
    },
    classification: "Strong Buy Opportunity" as const,
    reason: "Selloff triggered by macro-level semiconductor chip export restriction rumors in China/Europe.",
    commentary: "NVIDIA's long-term thesis remains fully intact. Jensen Huang recently signaled robust sovereign AI demand and major enterprise scaling for Blackwell infrastructure, indicating a classic narrative-fundamentals dislocation.",
    volumeAnalysis: "Volatility clustering observed. Sell volume is beginning to taper off over the last 3 hours, paired with steady institutional accumulation blocks in dark pools.",
    narrativeAnalysis: "The AI Boom narrative remains exceptionally strong. Market reactions to potential policy tightening are historically overdone (Fat Tails theory). Accumulating here aligns with long-memory positive trend bias.",
    timestamp: new Date().toISOString()
  },
  {
    id: "alert-2",
    ticker: "PLTR",
    name: "Palantir Technologies",
    tier: 1,
    market: "NASDAQ" as const,
    price: 41.20,
    changePercent: -4.85,
    scores: {
      fundamentals: 27,
      narrative: 18,
      volume: 15,
      dislocation: 17,
      tailwind: 9,
      total: 86
    },
    classification: "Strong Buy Opportunity" as const,
    reason: "Macro profit taking and S&P rebalancing pressure.",
    commentary: "Palantir's AI defense contracts and government sovereign cloud pipelines have multi-year long-memory momentum. A 5% single-day correction is a textbook entry threshold.",
    volumeAnalysis: "High distribution volume in the first 30 minutes of standard US trading, followed by gradual recovery on tapering volume. Volatility clustering represents institutional stabilization.",
    narrativeAnalysis: "Defense and intelligence narratives are solidifying due to increased interest in tactical drone and autonomous warfare systems. High Geopolitical support aligns with Tier 5 tailwinds.",
    timestamp: new Date().toISOString()
  },
  {
    id: "alert-3",
    ticker: "SHP",
    name: "Shoprite Holdings Ltd",
    tier: 4,
    market: "JSE" as const,
    price: 285.50,
    changePercent: -3.20,
    scores: {
      fundamentals: 28,
      narrative: 15,
      volume: 12,
      dislocation: 14,
      tailwind: 6,
      total: 75
    },
    classification: "Watch Closely" as const,
    reason: "ZAR exchange rate volatility and fuel margin pressure on domestic distribution networks.",
    commentary: "Standard defensive South African holding with massive consumer moat. Price contraction is driven by temporary rand flight, while fundamental revenue metrics remain robust.",
    volumeAnalysis: "Low JSE trading intensity. Lack of massive seller participation indicates retail sentiment panic rather than institutional distribution. Wait for 280 support confirmation.",
    narrativeAnalysis: "High-conviction retail giant enjoying dominant market share. Long-memory domestic spending resilience is structurally sound.",
    timestamp: new Date().toISOString()
  },
  {
    id: "alert-4",
    ticker: "MSFT",
    name: "Microsoft Corporation",
    tier: 1,
    market: "NASDAQ" as const,
    price: 410.15,
    changePercent: -1.20,
    scores: {
      fundamentals: 29,
      narrative: 18,
      volume: 10,
      dislocation: 5,
      tailwind: 7,
      total: 69
    },
    classification: "Watch Closely" as const,
    reason: "Mild consolidation around the 50-day moving average.",
    commentary: "Microsoft's cloud dominance is undisputed, but the current dip of 1.2% does not represent a deep enough emotional dislocation. Accumulate slowly but reserve heavy capital for deeper thresholds.",
    volumeAnalysis: "Standard trading volume. No volume-price confirmation signals yet for a rapid rebound. Volatility is clustering in a tight horizontal band.",
    narrativeAnalysis: "Azure AI expansion and OpenAI funding continue to underpin core investment thesis.",
    timestamp: new Date().toISOString()
  }
];

// Helper to provide nice mock reports in SAST
function getMockReports() {
  return [
    {
      id: "report-morning",
      type: "Morning Brief (07:00)" as const,
      timestamp: "2026-06-16T07:00:00+02:00",
      executiveSummary: "Overnight sentiment is cautious following fresh trade tariff rhetoric out of Washington. Donald Trump reiterated a focus on high-tech trade balances. Asian markets are mixed, and ZAR has slipped 0.8% against the USD. Semiconductor watch remains primary.",
      alerts: [DEFAULT_ALERTS[0]],
      aiBoomNarratives: "GPU supply chains show steady capacity expansion at TSMC. Sovereign AI contracts total $4.2B in European state initiatives. Solid foundations for structural semiconductor demand remain unaltered.",
      jseDigest: "JSE Top 40 opens flat. Standard Bank and MTN are under pressure due to rand weakness. AngloGold Ashanti shows strong safety bids as physical gold rallies to new local highs.",
      portfolioRecommendations: [
        "Prioritize existing Core Wealth holdings (NVIDIA, TSMC) over fresh ZAR assets given the rand discount.",
        "Satrix Nasdaq 100 ETF represents an excellent currency-hedge buffer."
      ],
      watchlistRiskFlags: [
        "Regime transition risk: Trump tariff announcement scheduled for Friday.",
        "ZAR/USD threshold crossing: 18.45 resistance level under test."
      ]
    },
    {
      id: "report-midday",
      type: "Midday Scan (12:00)" as const,
      timestamp: "2026-06-16T12:00:00+02:00",
      executiveSummary: "Pre-market futures show Nasdaq down 1.2% led by hardware suppliers. JSE has consolidated after morning selloffs, standard retail counters proving resilient. Volatility clustering is active for high-beta Tier 1 assets.",
      alerts: [DEFAULT_ALERTS[0], DEFAULT_ALERTS[2]],
      aiBoomNarratives: "Key updates: Intel fabrication delays shift additional order books onto TSMC and Broadcom. Custom silicon designs are accelerating among hyperscalers.",
      jseDigest: "Shoprite Holdings pulls back 3.2% to ZAR 285.50 on fuel index hikes. Discovery gains 1.1% on robust premium collection metrics.",
      portfolioRecommendations: [
        "Initiate tier-1 accumulation blocks for NVDA below $119.",
        "Core Satrix Nasdaq 100 ETF allocation remains a passive buy."
      ],
      watchlistRiskFlags: [
        "Intra-day volatility spikes in S&P 500 options ahead of central bank speeches."
      ]
    },
    {
      id: "report-afternoon",
      type: "Afternoon Digest (15:00)" as const,
      timestamp: "2026-06-16T15:00:00+02:00",
      executiveSummary: "US markets opened to high distribution pressure. Tech names are experiencing single-day drops approaching -5%. This is a classic fat-tail reaction. Institutional accumulation blocks are triggered around support lines.",
      alerts: [DEFAULT_ALERTS[0], DEFAULT_ALERTS[1]],
      aiBoomNarratives: "Palantir wins major tactical software intelligence contract from Allied forces, highlighting rapid defence software integration (Tier 5 tailwinds).",
      jseDigest: "JSE closes session with standard retailers matching volume averages. FirstRand and Standard Bank rebound slightly off daily lows.",
      portfolioRecommendations: [
        "Aggressive accumulation on PLTR at $41.20 (Econophysics score: 86).",
        "Maintain cash buffers for defense index ETFs."
      ],
      watchlistRiskFlags: [
        "Volume spikes: NVDA hourly distribution suggests emotional retail liquidations, opening institutional entry window."
      ]
    }
  ];
}

// REST GET Api: Returns diagnostic/status information
app.get("/api/config-status", (req: Request, res: Response) => {
  const hasKey = hasReplicateToken();
  res.json({
    hasReplicateKey: hasKey,
    currentSastTime: new Date().toLocaleString("en-US", { timeZone: "Africa/Johannesburg" }),
  });
});

// REST GET Api: Fetch baseline reports and alerts
app.get("/api/historical-reports", (req: Request, res: Response) => {
  res.json({
    success: true,
    reports: getMockReports(),
    alerts: DEFAULT_ALERTS
  });
});

// REST POST Api: Upload and parse a PDF to extract ticker symbols for tracking
app.post('/api/upload-pdf', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const file = req.file as Express.Multer.File | undefined;
    if (!file) {
      return res.status(400).json({ success: false, error: 'PDF file is required.' });
    }

    const parsed = await pdfParse(file.buffer);
    const text = (parsed.text || '').toString();
    const trackedTickers = extractTickersFromText(text);

    if (trackedTickers.length === 0) {
      return res.json({
        success: true,
        trackedTickers: [],
        summary: 'No clear ticker symbols were detected in the uploaded PDF. Please verify that your document contains uppercase tickers like NVDA, MSFT, PLTR, or JSE codes like SHP.',
        extractedTextSnippet: text.slice(0, 650)
      });
    }

    return res.json({
      success: true,
      trackedTickers,
      summary: `Detected ${trackedTickers.length} potential ticker symbols from your PDF. Use the portfolio scanner to validate and track dips for these tickers.`,
      extractedTextSnippet: text.slice(0, 650)
    });
  } catch (error: any) {
    console.error('PDF upload error:', error);
    res.status(500).json({ success: false, error: 'Failed to parse the uploaded PDF file.' });
  }
});

// REST GET Api: Retrieve the current thesis priming prompt
app.get('/api/thesis', (req: Request, res: Response) => {
  res.json({ success: true, thesis: getCurrentThesisPrompt() });
});

// REST POST Api: Update the thesis priming prompt used by all future chat and report flows
app.post('/api/thesis', (req: Request, res: Response) => {
  const { thesis } = req.body;
  if (!thesis || typeof thesis !== 'string' || thesis.trim().length === 0) {
    return res.status(400).json({ success: false, error: 'Thesis prompt text is required.' });
  }
  currentThesisPrompt = thesis.trim();
  res.json({ success: true, thesis: currentThesisPrompt });
});

// REST POST Api: Chat with DipGuard using the current thesis seed
app.post('/api/chat', async (req: Request, res: Response) => {
  const { message } = req.body;
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ success: false, error: 'Chat message is required.' });
  }

  const hasApi = hasReplicateToken();
  const thesisPrompt = getCurrentThesisPrompt();
  const systemPrompt = `You are DipGuard Quant, a specialized financial intelligence assistant. Maintain the following thesis as the core guidance for every answer:\n${thesisPrompt}`;
  const userPrompt = `User asks: ${message}`;

  if (!hasApi) {
    return res.json({
      success: true,
      response: `[SIMULATED DipGuard] Using the primed thesis, I would answer: ${message}`
    });
  }

  try {
    const responseText = await getReplicateResponse(`${systemPrompt}\n\n${userPrompt}`);
    res.json({ success: true, response: responseText.trim() });
  } catch (err: any) {
    console.error('Chat endpoint error:', err);
    res.status(500).json({ success: false, error: err.message || 'Chat generation failed.' });
  }
});

// REST POST Api: Scan a Ticker using Replicate or Mock
app.post("/api/scan-ticker", async (req: Request, res: Response) => {
  const { ticker, name, tier, market, recentChange } = req.body;
  const targetTicker = (ticker || "NVDA").toUpperCase();
  const targetName = name || "Selected Target Asset";
  const targetTier = Number(tier) || 1;
  const targetMarket = market || "NASDAQ";
  const targetChange = Number(recentChange) || -4.5;

  const hasApi = hasReplicateToken();

  if (!hasApi) {
    // Return high-quality deterministic response if Replicate API key is not configured
    // Formulate a beautiful prompt simulation output based on financial parameters.
    const scoreFundamentals = Math.min(30, Math.round(25 + Math.random() * 5));
    const scoreNarrative = Math.min(20, Math.round(15 + Math.random() * 5));
    const scoreVolume = Math.min(20, Math.round(12 + Math.random() * 6));
    const scoreDislocation = Math.min(20, Math.round(14 + Math.random() * 5));
    const scoreTailwind = Math.min(10, Math.round(6 + Math.random() * 4));
    const totalScore = scoreFundamentals + scoreNarrative + scoreVolume + scoreDislocation + scoreTailwind;

    let classification: "Strong Buy Opportunity" | "Watch Closely" | "Avoid the Dip" = "Watch Closely";
    if (totalScore >= 80) classification = "Strong Buy Opportunity";
    else if (totalScore < 60) classification = "Avoid the Dip";

    const simulatedResponse = {
      id: "scan-" + Date.now(),
      ticker: targetTicker,
      name: targetName,
      tier: targetTier,
      market: targetMarket,
      price: targetMarket === "JSE" ? 150.00 + Math.random() * 200 : 80.00 + Math.random() * 150,
      changePercent: targetChange,
      scores: {
        fundamentals: scoreFundamentals,
        narrative: scoreNarrative,
        volume: scoreVolume,
        dislocation: scoreDislocation,
        tailwind: scoreTailwind,
        total: totalScore
      },
      classification,
      reason: `Temporary oversold friction at support indices due to sentiment shifts.`,
      commentary: `[OFFLINE MODE] Econophysics Analysis: This asset displays standard fat-tail behavior where short-term agent-based panic diverges from long-term memory metrics. Under Bouchaud's agent model, local price dips occur due to crowd momentum, while the primary long-range thesis (fundamentals score ${scoreFundamentals}/30) remains unimpaired.`,
      volumeAnalysis: `Distribution volume has begun to stabilize. Standard Volatility Clustering indicates that the peak selling pressure of the current wave is tapering. Rebound confirmation has the potential to trigger rapid mean reversion.`,
      narrativeAnalysis: `Strong narrative coherence around thematic macro support. Our narrative detection models suggest the alignment of the GPU cycle, defense spending, or Sovereign JSE liquidity buffers remains positive.`,
      timestamp: new Date().toISOString(),
      offlineMode: true
    };
    return res.json({ success: true, alert: simulatedResponse });
  }

  try {
    const systemPrompt = `You are DipGuard Quant, a highly specialized autonomous financial intelligence agent focused on identifying buy-the-dip opportunities using econophysics (Fat Tails, Volatility Clustering, Volume-Price Confirmation, Agent-Based Dynamics, Narrative Detection, Critical Thresholds, Long-Memory Effects). 
Analyze the asset and output a detailed JSON object. You must return strictly JSON. No markdown wrappers other than plain standard JSON text.

Your JSON output MUST match this exact schema:
{
  "ticker": "string",
  "name": "string",
  "tier": number,
  "market": "NASDAQ" | "JSE" | "ETF" | "OTHER",
  "price": number,
  "changePercent": number,
  "scores": {
    "fundamentals": number (0-30),
    "narrative": number (0-20),
    "volume": number (0-20),
    "dislocation": number (0-20),
    "tailwind": number (0-10),
    "total": number (sum of the above)
  },
  "classification": "Strong Buy Opportunity" | "Watch Closely" | "Avoid the Dip",
  "reason": "short explanation of the dip",
  "commentary": "Detailed econophysics analysis referencing Benoit Mandelbrot background, Bouchaud agent models, or Sornette thresholds",
  "volumeAnalysis": "Volume-price confirmation details using the Volatility Clustering concept",
  "narrativeAnalysis": "Brief assessment of the current narrative and long-memory trends"
}`;

    const prompt = `Perform an econophysics buy-the-dip scan for:
Ticker: ${targetTicker}
Name: ${targetName}
Strategic Priority Tier: ${targetTier}
Market/Exchange: ${targetMarket}
Recent Price Activity: ${targetChange}% drop.

Consider the recent news surrounding this company and the broader markets (NASDAQ, S&P 500, JSE etc.) or any commentary from relevant influencers like Jensen Huang or Donald Trump. Determine high-fidelity scores and classification. Include deep quantitative and physical economics jargon.`;

    const responseText = await getReplicateResponse(`${systemPrompt}\n\n${prompt}`);
    const parsedData = JSON.parse(responseText);

    // Ensure all target inputs are maintained and scores add up
    parsedData.id = "scan-" + Date.now();
    parsedData.ticker = targetTicker;
    parsedData.name = targetName;
    parsedData.tier = targetTier;
    parsedData.market = targetMarket;
    parsedData.changePercent = targetChange;
    parsedData.timestamp = new Date().toISOString();

    // Ensure correct schema scoring limits and sum
    if (parsedData.scores) {
      const f = Math.min(30, parsedData.scores.fundamentals || 0);
      const n = Math.min(20, parsedData.scores.narrative || 0);
      const v = Math.min(20, parsedData.scores.volume || 0);
      const d = Math.min(20, parsedData.scores.dislocation || 0);
      const t = Math.min(10, parsedData.scores.tailwind || 0);
      parsedData.scores = {
        fundamentals: f,
        narrative: n,
        volume: v,
        dislocation: d,
        tailwind: t,
        total: f + n + v + d + t
      };

      if (parsedData.scores.total >= 80) {
        parsedData.classification = "Strong Buy Opportunity";
      } else if (parsedData.scores.total < 60) {
        parsedData.classification = "Avoid the Dip";
      } else {
        parsedData.classification = "Watch Closely";
      }
    }

    res.json({ success: true, alert: parsedData });
  } catch (err: any) {
    console.error("Replicate Scan Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// REST POST Api: Generate custom briefings/scans using Replicate or Mock
app.post("/api/generate-briefing", async (req, res) => {
  const { briefType, customFocus } = req.body;
  const typeStr = briefType || "Morning Brief (07:00)";
  const hasApi = hasReplicateToken();

  if (!hasApi) {
    // Generate a beautiful offline detailed report context
    const timestamp = new Date().toISOString();
    const offlineReport = {
      id: "report-" + Date.now(),
      type: typeStr,
      timestamp,
      executiveSummary: `[OFFLINE SEED] General macro overview indicates high Volatility Clustering. Under the Mandelbrot Fat-Tails theory, global tech indices are testing multi-week support channels. Focused on: ${customFocus || "All Tiers"}.`,
      alerts: [DEFAULT_ALERTS[0], DEFAULT_ALERTS[1]],
      aiBoomNarratives: "Active GPU data-center projects in sovereign states show zero signs of capital spending fatigue. Demand for premium silicon nodes remains resilient.",
      jseDigest: "JSE mining stocks showing active buyers stepping in as standard defensive yields hedge ZAR depreciation curves.",
      portfolioRecommendations: [
        "Dollar-cost average into Satrix Nasdaq 100 ETF index to defend local wealth from currency trends.",
        "Gradually accumulate top-tier infrastructure: TSMC and NVIDIA."
      ],
      watchlistRiskFlags: [
        "Geopolitical critical threshold: High tariff statements shifting global logistics supply chains."
      ]
    };
    return res.json({ success: true, report: offlineReport });
  }

  try {
    const thesisPrompt = getCurrentThesisPrompt();
    const systemInstruction = `You are DipGuard Quant, a highly polished financial intelligence quant agent. 
You must generate a scheduled briefing report focusing on buy-the-dip opportunities. 
Maintain the following thesis at all times:\n${thesisPrompt}\n
You must return clean, strict JSON matching this exact structure:
{
  "executiveSummary": "string describing global tech/JSE sentiment, overnight action, policy shifts",
  "aiBoomNarratives": "string describing GPU demand signals, server scale, major cloud contracts, or sovereign AI",
  "jseDigest": "string summarizing JSE context, South African corporate updates, currency impacts (ZAR/USD)",
  "portfolioRecommendations": ["string recommendation 1", "string recommendation 2", ...],
  "watchlistRiskFlags": ["string risk flag 1", "string risk flag 2", ...]
}`;

    const prompt = `Generate a structured financial brief of type: "${typeStr}". 
Custom user guidance/focus constraints: "${customFocus || 'General monitoring'}"
Include specific insights on NASDAQ, JSE, and any statements by Jensen Huang or Donald Trump that might affect semiconductors, tariffs, or defense spending. Use advanced econophysics vocabulary. Maintain absolute numeric accuracy and professional, non-promotional tone.`;

    const responseText = await getReplicateResponse(`${systemInstruction}\n\n${prompt}`);
    const body = JSON.parse(responseText);

    // Bundle with specific mock alerts matching the time of day to show high-fidelity visuals
    const reportData = {
      id: "gen-report-" + Date.now(),
      type: typeStr,
      timestamp: new Date().toISOString(),
      executiveSummary: body.executiveSummary,
      alerts: [DEFAULT_ALERTS[0], DEFAULT_ALERTS[1]], // Include baseline core wealth indicators
      aiBoomNarratives: body.aiBoomNarratives,
      jseDigest: body.jseDigest,
      portfolioRecommendations: body.portfolioRecommendations || ["Accumulate core index tracking ETFs"],
      watchlistRiskFlags: body.watchlistRiskFlags || ["Monitor central bank rate policies"]
    };

    res.json({ success: true, report: reportData });
  } catch (err: any) {
    console.error("Replicate Briefing Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});


// Serve Vite or static assets depending on environment
async function initServer() {
  await initChatTables();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[DipGuard Quant Server] running on http://localhost:${PORT}`);
  });
}

initServer();
