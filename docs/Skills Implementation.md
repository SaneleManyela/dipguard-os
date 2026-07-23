Each skill should have:

* `agent.py` → orchestrator
* `models.py` → data models
* `service.py` → business logic
* `prompts.py` → LLM prompts (if needed)

Example:

```text id="bmy6qs"
agents/
└── alert_engine/
    ├── agent.py
    ├── models.py
    ├── classifier.py
    ├── priority.py
    └── prompts.py
```

---

# Full Skill Implementation Plan

---

# Skill 1 — Market Intelligence Agent

Folder:

```text id="g1qyh7"
quant-engine/agents/market_intelligence/
```

Files:

```text id="6lbpnz"
agent.py
market_feed.py
news_ingestor.py
earnings_feed.py
macro_feed.py
models.py
```

Responsibilities:

* Pull live prices
* Pull market data
* Pull news
* Pull macro data

Example output:

```json id="gtig3q"
{
  "ticker": "NVDA",
  "price": 151.22,
  "changePercent": -8.3,
  "volumeSpike": true
}
```

---

# Skill 2 — Portfolio Mirror Agent

Folder:

```text id="7jjg13"
quant-engine/agents/portfolio_mirror/
```

Files:

```text id="txwlxp"
agent.py
holdings.py
allocation.py
exposure.py
models.py
```

Responsibilities:

* Mirror EasyEquities holdings
* Calculate weights
* Calculate exposure
* Detect concentration risk

Example output:

```json id="zzxh1p"
{
  "AI": 45,
  "Defense": 10,
  "Space": 15,
  "Cash": 30
}
```

---

# Skill 3 — Alert Engine

Folder:

```text id="1wjz7h"
quant-engine/agents/alert_engine/
```

Files:

```text id="k3xq7n"
agent.py
classifier.py
priority.py
thesis_validator.py
models.py
```

Responsibilities:

* Detect dips
* Classify opportunity
* Assign P1/P2/P3

Example output:

```json id="3ld1eu"
{
  "ticker": "PLTR",
  "classification": "Strong Buy Opportunity",
  "priority": "P1"
}
```

---

# Skill 4 — Capital Allocator

Folder:

```text id="1eh6cz"
quant-engine/agents/capital_allocator/
```

Files:

```text id="j84r98"
agent.py
allocation_engine.py
cash_manager.py
rules.py
models.py
```

Responsibilities:

* Allocate cash
* Suggest staged buys
* Enforce allocation rules

Example output:

```json id="hzl1oe"
{
  "cashAvailable": 5000,
  "allocations": [
    {"ticker":"NVDA","amount":1500},
    {"ticker":"QQQ","amount":1500}
  ]
}
```

---

# Skill 5 — Dashboard Agent

Folder:

```text id="f0b6bl"
quant-engine/agents/dashboard_agent/
```

Files:

```text id="n6dk4v"
agent.py
dashboard_feed.py
summary_builder.py
models.py
```

Responsibilities:

* Feed React dashboard
* Prepare dashboard summaries
* Aggregate agent outputs

---

# Skill 6 — LLM Reasoning Agent (New)

This is missing from earlier architecture and should exist.

Folder:

```text id="k0gmg7"
backend/llm/
```

Files:

```text id="m0zwz7"
base_provider.ts
gemini_provider.ts
replicate_provider.ts
prompt_templates/
```

Responsibilities:

* Explain signals
* Generate market commentary
* Generate reports
* Produce reasoning

Example prompt:

```text id="yo8evr"
Explain whether NVDA is a strong buy after a 9% selloff.
```

---

# Skill 7 — Cloud Ops Agent (New)

Folder:

```text id="y9wbos"
cloud/gcp/
```

Files:

```text id="k8g7lv"
scheduler.yaml
cloud-run.yaml
monitoring.yaml
```

Responsibilities:

* Deploy services
* Run schedules
* Monitor uptime
* Restart failed services
