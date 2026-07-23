# DipGuard OS Architecture

## Agentic Financial Intelligence Platform for EasyEquities

---

# Overview

DipGuard OS is a unified agentic financial intelligence platform built for long-term thematic investing via EasyEquities.

It merges two systems:

* **EasyEquities Opportunity Monitor** → Python-based quant intelligence engine
* **DipGuard Quant** → React + Node + AI-powered financial dashboard

The unified system provides:

* Portfolio-aware monitoring
* Real-time opportunity detection
* Econophysics scoring
* AI-powered reasoning
* Capital allocation recommendations
* Institutional dashboarding
* Automated alerts
* 24/7 cloud operation

---

# Key Architectural Decisions

## 1. LLM Layer Abstraction

Since the platform may move from Gemini to Replicate (IBM Granite or other models), LLM providers should never be hardwired into business logic.

Instead, use a provider abstraction layer.

```text
llm/
├── base_provider.ts
├── gemini_provider.ts
├── replicate_provider.ts
└── prompt_templates/
```

This allows switching between:

### Current

* Gemini

### Future

* Replicate
* IBM Granite
* OpenRouter
* Local Ollama

without rewriting application logic.

---

# Final Enterprise Project Tree

```text
dipguard-os/
│
├── frontend/
├── backend/
├── quant-engine/
├── cloud/
├── data/
├── docs/
├── .env.example
├── docker-compose.yml
├── README.md
└── .gitignore
```

---

## Frontend Layer (DipGuard Quant UI)

Responsibilities:

* Dashboard visualization
* Portfolio overview
* Opportunity scanner
* Risk heatmaps
* Reports and alerts

Key technologies:

* React
* TypeScript
* Vite
* Tailwind

---

## Backend Layer (API Gateway + Orchestration)

Responsibilities:

* API routes
* Scheduler orchestration
* Firebase integration
* Telegram integration
* LLM provider orchestration

Key technologies:

* Node.js
* Express
* TypeScript

---

## Quant Engine (Python Intelligence Core)

Responsibilities:

* Econophysics scoring
* Thesis integrity engine
* Rebound probability engine
* Crash mode detection
* Portfolio intelligence
* Capital allocation

Key technologies:

* Python
* Pandas
* NumPy

---

# Quant Engine Agent Skills

DipGuard OS uses an agentic architecture inspired by progressive disclosure.

Each agent loads only when needed.

---

## Market Intelligence Agent

### Trigger

Price movement or market news

### Responsibilities

* Ingest market prices
* Pull earnings data
* Pull macro data
* Pull news feeds

---

## Portfolio Mirror Agent

### Trigger

Portfolio requests

### Responsibilities

* Mirror EasyEquities holdings
* Track allocations
* Detect concentration risk

---

## Alert Engine Agent

### Trigger

Dip or market event detected

### Responsibilities

* Generate alerts
* Classify opportunities
* Assign priority levels

---

## Capital Allocator Agent

### Trigger

Cash available or opportunity detected

### Responsibilities

* Recommend capital deployment
* Suggest phased buying
* Enforce portfolio rules

---

## Dashboard Agent

### Trigger

Frontend requests

### Responsibilities

* Feed UI data
* Build dashboard summaries

---

## LLM Reasoning Agent

### Trigger

Narrative analysis required

### Responsibilities

* Explain opportunities
* Generate commentary
* Produce reports

---

# Agent Skill Mapping

| Skill               | Trigger               | Purpose           |
| ------------------- | --------------------- | ----------------- |
| Market Intelligence | Price movement / news | Ingest live data  |
| Portfolio Mirror    | Portfolio request     | Track holdings    |
| Alert Engine        | Dip detected          | Generate alerts   |
| Capital Allocator   | Cash available        | Allocate capital  |
| Dashboard Agent     | UI request            | Feed dashboard    |
| LLM Reasoning       | Narrative analysis    | Explain decisions |

---

# Type Models

## New Required Types

```typescript
export type PriorityLevel = 'P1' | 'P2' | 'P3';
export type ThesisState = 'INTACT' | 'UNCERTAIN' | 'BROKEN';
export type CrashMode = 'NORMAL' | 'CORRECTION' | 'BEAR' | 'PANIC';
```

---

## OpportunityAlert Enhancements

```typescript
priority: PriorityLevel;
thesisState: ThesisState;
reboundProbability: number;
crashMode: CrashMode;
```

These power:

* Priority alerts
* Thesis validation
* Rebound modeling
* Market regime awareness

---

# Firestore Collections

Recommended Firebase collections:

```text
alerts/
portfolio/
market_data/
reports/
activity_logs/
agent_runs/
```

---

# Cloud Architecture

DipGuard OS is designed for low-cost 24/7 deployment using Google Cloud and Firebase.

---

## Backend Hosting

* Google Cloud Run

Responsibilities:

* Run backend API
* Trigger quant engine
* Host microservices

---

## Scheduling

* Cloud Scheduler

Responsibilities:

* Morning brief
* Midday scan
* Afternoon digest
* Evening close
* Intraday dip detection

---

## Database

* Firebase Firestore

Responsibilities:

* Portfolio storage
* Alert history
* Market snapshots
* Agent execution history

---

## Frontend Hosting

* Firebase Hosting

Responsibilities:

* Host React dashboard
* Fast CDN delivery

---

# High-Level System Flow

```text
Market Data + News + Earnings
            ↓
   Quant Engine (Python)
            ↓
      Agent Skills
            ↓
 Backend API (Node/Express)
            ↓
 React Dashboard + Telegram
            ↓
 Firebase + Cloud Storage
```

---

# Maturity Assessment

## DipGuard Quant

~50% complete

Strengths:

* UI
* Dashboard
* User workflows

Weaknesses:

* Backend intelligence incomplete

---

## EasyEquities Monitor

~30% complete

Strengths:

* Quant architecture
* Monitoring logic

Weaknesses:

* No UI
* Limited orchestration

---

## Merged DipGuard OS

### Architecture

~80% designed

### Implementation

~25% complete

---

# Strategic Goal

Transform DipGuard OS into a true institutional-grade investment operating system capable of:

* Monitoring markets continuously
* Detecting high-conviction opportunities
* Recommending capital allocation
* Providing AI-enhanced financial reasoning
* Operating autonomously in cloud infrastructure

The end state is a full-stack agentic investment intelligence platform for EasyEquities.
