# ruff: noqa
# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import datetime
from zoneinfo import ZoneInfo

from google.adk.agents import Agent
from google.adk.apps import App
from google.adk.models import Gemini
from google.genai import types


def get_sast_time() -> str:
    """Get current time in SAST timezone.

    Returns:
        A string with the current time in SAST format.
    """
    tz = ZoneInfo("Africa/Johannesburg")
    now = datetime.datetime.now(tz)
    return now.strftime("%Y-%m-%d %H:%M:%S %Z")


# =============================================================================
# DipGuard Quant - Financial Intelligence Agent
# =============================================================================

# Tier 1 - Core Wealth Engine (Highest Priority)
TIER_1_TICKERS = [
    "NVDA", "MSFT", "PLTR", "AMZN", "GOOGL", "META", "AVGO", "TSM",
]

# Tier 2 - Nasdaq / S&P 500 Leaders
TIER_2_TICKERS = [
    "AAPL", "TSLA", "AMD", "ORCL", "NOW", "CRM"
]

# Tier 3 - Future Infrastructure
TIER_3_TICKERS = [
    "NOK", "BB"  # Nokia, BlackBerry
]

# Tier 4 - South African Holdings (JSE)
TIER_4_TICKERS = [
    "DSY.JO", "SHP.JO", "MTN.JO", "VOD.JO", "FSR.JO", "SBK.JO", "APN.JO"
]

# Tier 5 - Defense & Geopolitics
TIER_5_TICKERS = [
    "ITA", "LMT", "NOC", "RTX", "GD", "BA"
]

# Tier 6 - Crisis Hedge
TIER_6_TICKERS = [
    "AU", "GOLD.JO"  # Gold-related
]


def analyze_dip_opportunity(
    ticker: str,
    price_change: float,
    volume_trend: str,
    news_sentiment: str,
    fundamentals_status: str,
) -> dict:
    """Analyze a potential buy-the-dip opportunity using econophysics framework.

    Args:
        ticker: Stock ticker symbol
        price_change: Percentage price change (negative for drops)
        volume_trend: Description of volume trend
        news_sentiment: Description of news sentiment
        fundamentals_status: Status of fundamentals

    Returns:
        A dictionary with econophysics opportunity score and classification.
    """
    # Initialize score components
    fundamentals_score = 0
    narrative_score = 0
    volume_score = 0
    sentiment_score = 0
    tailwind_score = 0

    # Fundamentals scoring (0-30)
    if fundamentals_status == "intact":
        fundamentals_score = 28
    elif fundamentals_status == "minor concerns":
        fundamentals_score = 20
    elif fundamentals_status == "eroding":
        fundamentals_score = 12
    else:
        fundamentals_score = 5

    # Narrative strength scoring (0-20)
    tier_1_narratives = ["NVDA", "MSFT", "PLTR", "AMZN", "GOOGL", "META", "AVGO", "TSM"]
    tier_2_narratives = ["AAPL", "TSLA", "AMD", "ORCL", "NOW", "CRM"]
    tier_3_narratives = ["NOK", "BB"]
    tier_4_narratives = ["DSY.JO", "SHP.JO", "MTN.JO", "VOD.JO", "FSR.JO", "SBK.JO", "APN.JO"]
    tier_5_narratives = ["ITA", "LMT", "NOC", "RTX", "GD", "BA"]

    if ticker in tier_1_narratives:
        narrative_score = 19
    elif ticker in tier_2_narratives:
        narrative_score = 16
    elif ticker in tier_3_narratives:
        narrative_score = 14
    elif ticker in tier_4_narratives:
        narrative_score = 12
    elif ticker in tier_5_narratives:
        narrative_score = 18
    else:
        narrative_score = 10

    # Volume confirmation scoring (0-20)
    if "declining sell" in volume_trend.lower() or "accumulation" in volume_trend.lower():
        volume_score = 18
    elif "mixed" in volume_trend.lower():
        volume_score = 12
    elif "high distribution" in volume_trend.lower():
        volume_score = 6
    else:
        volume_score = 10

    # Sentiment dislocation scoring (0-20)
    if "extreme negative" in news_sentiment.lower() or "panic" in news_sentiment.lower():
        sentiment_score = 18
    elif "negative" in news_sentiment.lower():
        sentiment_score = 12
    elif "neutral" in news_sentiment.lower():
        sentiment_score = 10
    else:
        sentiment_score = 5

    # Geopolitical/tailwind scoring (0-10)
    if ticker in tier_5_narratives:
        tailwind_score = 9
    elif ticker in tier_1_narratives:
        tailwind_score = 8
    elif ticker in tier_4_narratives:
        tailwind_score = 6
    else:
        tailwind_score = 5

    total_score = fundamentals_score + narrative_score + volume_score + sentiment_score + tailwind_score

    # Classification
    if total_score >= 80:
        classification = "Strong Buy Opportunity"
    elif total_score >= 60:
        classification = "Watch Closely"
    else:
        classification = "Avoid the Dip"

    return {
        "ticker": ticker,
        "price_change": price_change,
        "scores": {
            "fundamentals": fundamentals_score,
            "narrative": narrative_score,
            "volume": volume_score,
            "sentiment": sentiment_score,
            "tailwind": tailwind_score,
            "total": total_score,
        },
        "classification": classification,
    }


def get_tier_classification(ticker: str) -> str:
    """Get the priority tier for a given ticker.

    Args:
        ticker: Stock ticker symbol

    Returns:
        The tier classification string.
    """
    if ticker in TIER_1_TICKERS:
        return "Tier 1 - Core Wealth Engine (Highest Priority)"
    elif ticker in TIER_2_TICKERS:
        return "Tier 2 - Nasdaq / S&P 500 Leaders"
    elif ticker in TIER_3_TICKERS:
        return "Tier 3 - Future Infrastructure"
    elif ticker in TIER_4_TICKERS:
        return "Tier 4 - South African Holdings (JSE)"
    elif ticker in TIER_5_TICKERS:
        return "Tier 5 - Defense & Geopolitics"
    elif ticker in TIER_6_TICKERS:
        return "Tier 6 - Crisis Hedge"
    return "Uncategorized"


# Portfolio configuration
PORTFOLIO = {
    "NVDA": 0.18,
    "MSFT": 0.12,
    "SPY": 0.20,
    "QQQ": 0.15,
    "PLTR": 0.05,
    "FSR.JO": 0.05,
}


def compute_score(base: int, weight: float) -> int:
    """Compute econophysics score adjusted by portfolio weight.

    Args:
        base: Base score from 0-100
        weight: Portfolio weight (0.0-1.0)

    Returns:
        Adjusted score from 0-100
    """
    return min(100, int(base * (1 + weight * 2)))


def check_thesis(news: list) -> str:
    """Check if investment thesis is intact based on news.

    Args:
        news: List of news headlines or sentiment indicators

    Returns:
        Thesis status: "INTACT", "BROKEN", or "ERODING"
    """
    if not news:
        return "INTACT"
    negative_keywords = ["fraud", "bankruptcy", "regulatory", "ban", "delisted"]
    for item in news:
        if any(kw in str(item).lower() for kw in negative_keywords):
            return "BROKEN"
    return "INTACT"


def rebound_probability(drop: float, score: int) -> int:
    """Calculate probability of price rebound.

    Args:
        drop: Price drop percentage
        score: Econophysics opportunity score

    Returns:
        Rebound probability from 0-100
    """
    return max(0, min(100, int(100 - drop * 2 + score / 2)))


def classify(score: int, thesis: str, rebound: int) -> str:
    """Classify opportunity based on score, thesis, and rebound probability.

    Args:
        score: Econophysics opportunity score
        thesis: Thesis status
        rebound: Rebound probability

    Returns:
        Classification: "GREEN", "YELLOW", or "RED"
    """
    if thesis == "BROKEN":
        return "RED"
    if score > 80 and rebound > 70:
        return "GREEN"
    if score > 60:
        return "YELLOW"
    return "RED"


def scan_portfolio() -> list:
    """Scan all portfolio assets for dip opportunities.

    Returns:
        List of opportunity analysis results
    """
    results = []
    for ticker, weight in PORTFOLIO.items():
        tier = get_tier_classification(ticker)
        base_score = 70
        adjusted_score = compute_score(base_score, weight)
        thesis = check_thesis([])
        price_drop = 5.0
        rebound = rebound_probability(price_drop, adjusted_score)
        decision = classify(adjusted_score, thesis, rebound)

        results.append({
            "ticker": ticker,
            "weight": weight,
            "tier": tier,
            "score": adjusted_score,
            "thesis": thesis,
            "rebound_probability": rebound,
            "decision": decision,
        })

    return results


# DipGuard Quant System Prompt
DIPGUARD_QUANT_INSTRUCTION = """You are DipGuard Quant, a highly specialized autonomous financial intelligence agent focused on identifying high-conviction buy-the-dip opportunities in quality growth companies and ETFs, particularly within NASDAQ, S&P 500, and JSE-listed assets. Your core mission is to detect temporary mispricings driven by sentiment, liquidity, or macro fear in businesses with intact long-term theses, using principles from econophysics rather than conventional financial theory.

Current SAST Time: Use get_sast_time tool to get current time.

Core Monitoring Scope:
- Global equities with strong emphasis on NASDAQ and JSE.
- Priority watch on statements, interviews, posts, or "likes" by Jensen Huang (NVIDIA CEO) and President Donald Trump regarding companies, sectors (especially AI, semiconductors, defense, energy), tariffs, regulation, or policy.

Priority Tiers:
- Tier 1: NVIDIA, Microsoft, Palantir, Amazon, Alphabet, Meta, Broadcom, TSMC
- Tier 2: Apple, Tesla, AMD, Oracle, ServiceNow, Salesforce
- Tier 3: Nokia, BlackBerry - satellite, telecom, cybersecurity, space economy
- Tier 4: Discovery Limited, Shoprite, MTN, Vodacom, FirstRand, Standard Bank, Aspen Pharmacare
- Tier 5: Defense & Geopolitics
- Tier 6: Gold (AngloGold Ashanti, NewGold ETF), inflation hedges

Buy-the-Dip Opportunity Criteria:
- Single-day drops >=3%
- Weekly drops 5-10%+
- Monthly corrections 10-20%+
- Sharp post-earnings selloffs that appear overdone
- Market-wide panic events hitting quality names

Econophysics Framework (Mandatory Analytical Lens):
1. Fat Tails: Large drops != permanent damage if fundamentals hold.
2. Volatility Clustering: Wait for stabilization, declining sell volume, and recovery signals.
3. Volume-Price Confirmation: Bullish reversal when price stabilizes on declining sell volume.
4. Agent-Based Dynamics: Best opportunities when retail panic meets institutional accumulation.
5. Narrative Detection: Track strengthening/weakening of major narratives.
6. Critical Thresholds: Watch for regime changes.
7. Long-Memory Effects: Persist positive trends and negative ones.

For every potential dip, compute an Econophysics Opportunity Score (0-100):
- Fundamentals (0-30): Revenue growth, margins, guidance, competitive moat, thesis intact.
- Narrative Strength (0-20): AI, defense, sovereign projects, space, telecom, gold.
- Volume Confirmation (0-20): Declining sell volume, buyer appearance, institutional signals.
- Sentiment Dislocation (0-20): Extreme negative news/sentiment vs. strong underlying business.
- Geopolitical / Tailwind (0-10): Defense spending, policy support, infrastructure.

Classification:
- Strong Buy Opportunity (80-100): Thesis fully intact, temporary selloff, high conviction accumulation.
- Watch Closely (60-79): Uncertainty present; needs more data or confirmation.
- Avoid the Dip (Below 60): Structural issues, moat erosion, regulatory damage, broken thesis.

Begin every response with the current time and date in SAST. Stay concise yet comprehensive. Use tables for scoring when helpful.
"""

root_agent = Agent(
    name="dipguard_quant",
    model=Gemini(
        model="gemini-flash-latest",
        retry_options=types.HttpRetryOptions(attempts=3),
    ),
    instruction=DIPGUARD_QUANT_INSTRUCTION,
    tools=[
        analyze_dip_opportunity,
        get_tier_classification,
        get_sast_time,
        scan_portfolio,
        compute_score,
        check_thesis,
        rebound_probability,
        classify,
    ],
)

app = App(
    root_agent=root_agent,
    name="dipguard-os",
)