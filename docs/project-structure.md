dipguard-os/
│
│   .env.example
│   .gitignore
│   README.md
│   Architecture.md
│   Skills Implementation.md
│   docker-compose.yml
│
├── frontend/                            # DipGuard Quant Frontend
│   │
│   │   index.html
│   │   package-lock.json
│   │   package.json
│   │   tsconfig.json
│   │   vite.config.ts
│   │
│   ├── assets/
│   │   └── .aistudio/
│   │       └── .gitignore
│   │
│   └── src/
│       │   App.tsx
│       │   index.css
│       │   main.tsx
│       │
│       ├── types/f
│       │   ├── alerts.ts
│       │   ├── portfolio.ts
│       │   ├── reports.ts
│       │   ├── agents.ts
│       │   └── index.ts
│       │
│       ├── services/
│       │   ├── api.ts
│       │   ├── alertService.ts
│       │   ├── portfolioService.ts
│       │   └── reportService.ts
│       │
│       └── components/
│           │   ActivityLogs.tsx
│           │   PlaygroundView.tsx
│           │
│           ├── dashboard/
│           │   ├── OpportunityRadar.tsx
│           │   ├── MarketOverview.tsx
│           │   └── RiskHeatmap.tsx
│           │
│           ├── alerts/
│           │   ├── AlertFeed.tsx
│           │   └── AlertCard.tsx
│           │
│           ├── portfolio/
│           │   ├── Holdings.tsx
│           │   ├── AllocationChart.tsx
│           │   └── ConcentrationRisk.tsx
│           │
│           └── reports/
│               ├── MorningBrief.tsx
│               ├── MiddayScan.tsx
│               ├── AfternoonDigest.tsx
│               └── EveningClose.tsx
│
├── backend/                             # DipGuard Node Backend
│   │   server.ts
│   │   metadata.json
│   │
│   ├── routes/
│   │   ├── alerts.ts
│   │   ├── portfolio.ts
│   │   ├── reports.ts
│   │   └── scanner.ts
│   │
│   ├── services/
│   │   ├── firebase.ts
│   │   ├── telegram.ts
│   │   ├── scheduler.ts
│   │   └── marketData.ts
│   │
│   ├── llm/
│   │   ├── base_provider.ts
│   │   ├── gemini_provider.ts
│   │   ├── replicate_provider.ts
│   │   └── prompt_templates/
│   │
│   └── config/
│
├── quant-engine/                        # EasyEquities Python Engine
│   │   config.py
│   │   main.py
│   │   requirements.txt
│   │
│   ├── alerts/
│   │       classifier.py
│   │       notifier_telegram.py
│   │       formatter.py
│   │
│   ├── engine/
│   │       econophysics.py
│   │       rebound.py
│   │       thesis.py
│   │       crash_mode.py
│   │       priority.py
│   │
│   ├── universe/
│   │       portfolio.py
│   │       watchlist.py
│   │
│   ├── utils/
│   │       helpers.py
│   │
│   └── agents/
│       ├── market_intelligence/
│       │   ├── agent.py
│       │   ├── market_feed.py
│       │   ├── news_ingestor.py
│       │   └── earnings_feed.py
│       │
│       ├── portfolio_mirror/
│       │   ├── agent.py
│       │   ├── holdings.py
│       │   └── exposure.py
│       │
│       ├── alert_engine/
│       │   ├── agent.py
│       │   ├── classifier.py
│       │   └── priority.py
│       │
│       ├── capital_allocator/
│       │   ├── agent.py
│       │   ├── allocation_engine.py
│       │   └── cash_manager.py
│       │
│       └── dashboard_agent/
│           ├── agent.py
│           └── dashboard_feed.py
│
├── cloud/
│   ├── firebase/
│   │   ├── firestore.rules
│   │   ├── firestore.indexes.json
│   │   └── firebase.json
│   │
│   ├── gcp/
│   │   ├── cloud-run.yaml
│   │   ├── cloudbuild.yaml
│   │   └── scheduler.yaml
│   │
│   └── docker/
│       ├── Dockerfile.backend
│       └── Dockerfile.quant
│
├── data/
│   ├── market/
│   ├── macro/
│   ├── earnings/
│   └── news/
│
└── docs/
    ├── architecture.md
    ├── deployment.md
    ├── migration-roadmap.md
    └── agent-skills.md