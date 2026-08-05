# DipGuard Quant

A highly specialized autonomous financial intelligence agent focused on identifying high-conviction buy-the-dip opportunities in quality growth companies and ETFs, particularly within NASDAQ, S&P 500, and JSE-listed assets.

Built with Google ADK (Agent Development Kit) and follows econophysics principles to detect temporary mispricings driven by sentiment, liquidity, or macro fear in businesses with intact long-term theses.

## Project Structure

```
dipguard-os/
├── app/         # Core agent code
│   ├── agent.py               # Main agent logic
│   ├── fast_api_app.py        # FastAPI Backend server
│   └── app_utils/             # App utilities and helpers
├── tests/                     # Unit, integration, and load tests
├── GEMINI.md                  # AI-assisted development guide
└── pyproject.toml             # Project dependencies
```

> 💡 **Tip:** Use [Antigravity CLI](https://antigravity.google/) for AI-assisted development - project context is pre-configured in `GEMINI.md`.

## Requirements

Before you begin, ensure you have:
- **uv**: Python package manager (used for all dependency management in this project) - [Install](https://docs.astral.sh/uv/getting-started/installation/) ([add packages](https://docs.astral.sh/uv/concepts/dependencies/) with `uv add <package>`)
- **agents-cli**: Agents CLI - Install with `uv tool install google-agents-cli`
- **Google Cloud SDK**: For GCP services - [Install](https://cloud.google.com/sdk/docs/install)


## Quick Start

Install `agents-cli` and its skills if not already installed:

```bash
uvx google-agents-cli setup
```

Install required packages:

```bash
agents-cli install
```

Test the agent with a local web server:

```bash
agents-cli playground
```

You can also use features from the [ADK](https://adk.dev/) CLI with `uv run adk`.

## Commands

| Command              | Description                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------- |
| `agents-cli install` | Install dependencies using uv                                                         |
| `agents-cli playground` | Launch local development environment                                                  |
| `agents-cli lint`    | Run code quality checks                                                               |
| `agents-cli eval`    | Evaluate agent behavior (generate, grade, analyze, and more — see `agents-cli eval --help`) |
| `uv run pytest tests/unit tests/integration` | Run unit and integration tests                                                        |
| `agents-cli deploy`  | Deploy agent to Agent Runtime                                                                |
| `agents-cli publish gemini-enterprise` | Register deployed agent to Gemini Enterprise                    || [A2A Inspector](https://github.com/a2aproject/a2a-inspector) | Launch A2A Protocol Inspector                                                        |

## 🛠️ Project Management

| Command | What It Does |
|---------|--------------|
| `agents-cli scaffold enhance` | Add CI/CD pipelines and Terraform infrastructure |
| `agents-cli infra cicd` | One-command setup of entire CI/CD pipeline + infrastructure |
| `agents-cli scaffold upgrade` | Auto-upgrade to latest version while preserving customizations |

---

## Development

Edit your agent logic in `app/agent.py` and test with `agents-cli playground` - it auto-reloads on save.

## Deployment

### Backend

```bash
gcloud config set project <your-project-id>
agents-cli deploy
```

To add CI/CD and Terraform, run `agents-cli scaffold enhance`.
To set up your production infrastructure, run `agents-cli infra cicd`.

### Frontend on Cloudflare Pages

This app is well suited for Cloudflare Pages as a static React/Vite frontend.

- Build command: `npm install && npm run build`
- Publish directory: `dist`
- Environment variable: `VITE_API_URL=https://<your-render-backend>.onrender.com/api`

When the frontend is deployed, set the Render backend env var:
- `ALLOW_ORIGINS=https://<your-pages-site>.pages.dev`

If you host the backend on Render and frontend on Cloudflare Pages, the frontend will call the backend through `VITE_API_URL` and Render will allow the Pages origin via `ALLOW_ORIGINS`.

## Features

### Econophysics Opportunity Scoring

The agent computes an **Econophysics Opportunity Score** (0-100) for every potential dip:

| Component | Weight | Description |
|-----------|--------|-------------|
| Fundamentals | 0-30 | Revenue growth, margins, guidance, competitive moat, thesis intact |
| Narrative Strength | 0-20 | AI, defense, sovereign projects, space, telecom, gold |
| Volume Confirmation | 0-20 | Declining sell volume, buyer appearance, institutional signals |
| Sentiment Dislocation | 0-20 | Extreme negative news/sentiment vs. strong underlying business |
| Geopolitical/Tailwind | 0-10 | Defense spending, policy support, infrastructure |

### Priority Tiers

- **Tier 1**: NVIDIA, Microsoft, Palantir, Amazon, Alphabet, Meta, Broadcom, TSMC
- **Tier 2**: Apple, Tesla, AMD, Oracle, ServiceNow, Salesforce
- **Tier 3**: Nokia, BlackBerry - satellite, telecom, cybersecurity, space economy
- **Tier 4**: Discovery Limited, Shoprite, MTN, Vodacom, FirstRand, Standard Bank, Aspen Pharmacare
- **Tier 5**: Defense & Geopolitics
- **Tier 6**: Gold (AngloGold Ashanti, NewGold ETF), inflation hedges

### Scheduled Reports

The agent operates on a strict daily schedule (SAST timezone):
- 07:00 - Morning brief: Overnight global news, pre-market movers
- 12:00 - Midday scan: US open reactions, intra-day volatility
- 15:00 - Afternoon digest: Key earnings reactions, volume confirmation
- 18:00 - Evening close: Full daily summary, capital allocation recommendations

## Observability

Built-in telemetry exports to Cloud Trace, BigQuery, and Cloud Logging.

## A2A Inspector

This agent supports the [A2A Protocol](https://a2aprotocol.org/). Use the [A2A Inspector](https://github.com/a2aproject/a2a-inspector) to test interoperability.
See the [A2A Inspector docs](https://github.com/a2aproject/a2a-inspector) for details.

## Deploying the Backend to Render.com

Render can host the backend as a Web Service directly from the repository.

1. Push this repository to GitHub or GitLab.
2. Create a new Web Service in Render and connect your repo.
3. Set the service root to `backend`.
4. Use these commands:
   - Build command: `npm install`
   - Start command: `npm run start`
   - Health check path: `/health`
5. Set required environment variables in Render:
   - `GEMINI_API_KEY` (optional; use for Gemini API access)
   - `GOOGLE_CLOUD_PROJECT`
   - `GOOGLE_CLOUD_LOCATION`
   - `APP_URL` (your Render service URL)
   - `ALLOW_ORIGINS` (optional; e.g. `https://<your-frontend>.onrender.com`)

> If you want only the backend on Render, host the frontend separately and point `ALLOW_ORIGINS` to the frontend URL.
