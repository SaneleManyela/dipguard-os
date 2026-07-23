export type MarketType = 'NASDAQ' | 'JSE' | 'ETF' | 'OTHER';

export type AlertClassification =
  | 'Strong Buy Opportunity'
  | 'Watch Closely'
  | 'Avoid the Dip';

export type PriorityLevel = 'P1' | 'P2' | 'P3';

export type ThesisState =
  | 'INTACT'
  | 'UNCERTAIN'
  | 'BROKEN';

export type CrashMode =
  | 'NORMAL'
  | 'CORRECTION'
  | 'BEAR'
  | 'PANIC';

export type AgentType =
  | 'market_intelligence'
  | 'portfolio_mirror'
  | 'alert_engine'
  | 'capital_allocator'
  | 'dashboard_agent'
  | 'llm_reasoning';

export interface EconophysicsScores {
  fundamentals: number;      // 0-30
  narrative: number;         // 0-20
  volume: number;            // 0-20
  dislocation: number;       // 0-20
  tailwind: number;          // 0-10
  total: number;             // 0-100
}

export interface OpportunityAlert {
  id: string;
  ticker: string;
  name: string;
  tier: number;
  market: MarketType;

  price: number;
  changePercent: number; // Example: -12.5

  scores: EconophysicsScores;
  classification: AlertClassification;
  priority: PriorityLevel;

  thesisState: ThesisState;
  reboundProbability: number; // 0-100
  crashMode: CrashMode;

  reason: string;
  commentary: string;
  volumeAnalysis: string;
  narrativeAnalysis: string;

  confidence: number; // 0-100
  triggeredBy: AgentType[];

  timestamp: string;
}

export type BriefType =
  | 'Morning Brief (07:00)'
  | 'Midday Scan (12:00)'
  | 'Afternoon Digest (15:00)'
  | 'Evening Close (18:00)';

export interface ScheduledReport {
  id: string;
  type: BriefType;
  timestamp: string;

  executiveSummary: string;

  alerts: OpportunityAlert[];

  aiBoomNarratives: string;
  jseDigest: string;

  portfolioRecommendations: string[];
  watchlistRiskFlags: string[];

  crashMode: CrashMode;
}

export interface PortfolioHolding {
  ticker: string;
  name: string;
  tier: number;
  shares: number;
  avgPrice: number;
  market: MarketType;

  currentPrice?: number;
  marketValue?: number;
  profitLoss?: number;
  weight?: number;
}

export interface CapitalAllocationPlan {
  cashAvailable: number;
  recommendations: AllocationRecommendation[];
  summary: string;
}

export interface AllocationRecommendation {
  ticker: string;
  amount: number;
  rationale: string;
  conviction: number; // 0-100
}

export interface AgentRun {
  id: string;
  agent: AgentType;
  startedAt: string;
  completedAt?: string;
  status: 'running' | 'success' | 'failed';
  summary?: string;
}

export interface LiveActivityLog {
  id: string;
  timestamp: string;
  type:
    | 'info'
    | 'alert'
    | 'analysis'
    | 'agent'
    | 'system';

  message: string;
}