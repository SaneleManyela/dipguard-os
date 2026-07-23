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
"""
Unit tests for DipGuard Quant agent functionality.
Tests the econophysics opportunity scoring and tier classification.
"""

import pytest

from app.agent import (
    analyze_dip_opportunity,
    get_sast_time,
    get_tier_classification,
    compute_score,
    check_thesis,
    rebound_probability,
    classify,
    scan_portfolio,
    PORTFOLIO,
    TIER_1_TICKERS,
    TIER_2_TICKERS,
    TIER_3_TICKERS,
    TIER_4_TICKERS,
    TIER_5_TICKERS,
    TIER_6_TICKERS,
)


class TestGetSastTime:
    """Tests for SAST time function."""

    def test_returns_valid_format(self):
        """Test that get_sast_time returns a properly formatted time string."""
        result = get_sast_time()
        assert result is not None
        assert len(result) > 0
        # Should contain date and time components
        assert "-" in result  # Date separator
        assert ":" in result  # Time separator


class TestTierClassification:
    """Tests for tier classification function."""

    def test_tier_1_classification(self):
        """Test Tier 1 ticker classification."""
        for ticker in TIER_1_TICKERS:
            result = get_tier_classification(ticker)
            assert result == "Tier 1 - Core Wealth Engine (Highest Priority)"

    def test_tier_2_classification(self):
        """Test Tier 2 ticker classification."""
        for ticker in TIER_2_TICKERS:
            result = get_tier_classification(ticker)
            assert result == "Tier 2 - Nasdaq / S&P 500 Leaders"

    def test_tier_3_classification(self):
        """Test Tier 3 ticker classification."""
        for ticker in TIER_3_TICKERS:
            result = get_tier_classification(ticker)
            assert result == "Tier 3 - Future Infrastructure"

    def test_tier_4_classification(self):
        """Test Tier 4 ticker classification."""
        for ticker in TIER_4_TICKERS:
            result = get_tier_classification(ticker)
            assert result == "Tier 4 - South African Holdings (JSE)"

    def test_tier_5_classification(self):
        """Test Tier 5 ticker classification."""
        for ticker in TIER_5_TICKERS:
            result = get_tier_classification(ticker)
            assert result == "Tier 5 - Defense & Geopolitics"

    def test_tier_6_classification(self):
        """Test Tier 6 ticker classification."""
        for ticker in TIER_6_TICKERS:
            result = get_tier_classification(ticker)
            assert result == "Tier 6 - Crisis Hedge"

    def test_unknown_ticker(self):
        """Test unknown ticker returns Uncategorized."""
        result = get_tier_classification("UNKNOWN")
        assert result == "Uncategorized"


class TestAnalyzeDipOpportunity:
    """Tests for dip opportunity analysis."""

    def test_strong_buy_opportunity(self):
        """Test a strong buy opportunity scenario."""
        result = analyze_dip_opportunity(
            ticker="NVDA",
            price_change=-5.0,
            volume_trend="declining sell volume with accumulation",
            news_sentiment="extreme negative panic selling",
            fundamentals_status="intact",
        )
        assert result["ticker"] == "NVDA"
        assert result["price_change"] == -5.0
        assert result["scores"]["total"] >= 80
        assert result["classification"] == "Strong Buy Opportunity"

    def test_watch_closely_scenario(self):
        """Test a watch closely scenario."""
        result = analyze_dip_opportunity(
            ticker="AAPL",
            price_change=-3.0,
            volume_trend="mixed volume",
            news_sentiment="negative news",
            fundamentals_status="minor concerns",
        )
        assert result["ticker"] == "AAPL"
        assert 60 <= result["scores"]["total"] < 80
        assert result["classification"] == "Watch Closely"

    def test_avoid_dip_scenario(self):
        """Test an avoid the dip scenario."""
        result = analyze_dip_opportunity(
            ticker="UNKNOWN",
            price_change=-10.0,
            volume_trend="high distribution",
            news_sentiment="extreme negative",
            fundamentals_status="damaged",
        )
        assert result["ticker"] == "UNKNOWN"
        assert result["scores"]["total"] < 60
        assert result["classification"] == "Avoid the Dip"

    def test_score_components_sum(self):
        """Test that score components sum to total."""
        result = analyze_dip_opportunity(
            ticker="NVDA",
            price_change=-3.0,
            volume_trend="declining sell volume",
            news_sentiment="extreme negative",
            fundamentals_status="intact",
        )
        scores = result["scores"]
        expected_total = (
            scores["fundamentals"]
            + scores["narrative"]
            + scores["volume"]
            + scores["sentiment"]
            + scores["tailwind"]
        )
        assert scores["total"] == expected_total

    def test_fundamentals_scoring(self):
        """Test fundamentals scoring logic."""
        # Intact fundamentals should give high score
        result_intact = analyze_dip_opportunity(
            ticker="NVDA",
            price_change=-3.0,
            volume_trend="declining sell volume",
            news_sentiment="extreme negative",
            fundamentals_status="intact",
        )
        assert result_intact["scores"]["fundamentals"] == 28

        # Damaged fundamentals should give low score
        result_damaged = analyze_dip_opportunity(
            ticker="NVDA",
            price_change=-3.0,
            volume_trend="declining sell volume",
            news_sentiment="extreme negative",
            fundamentals_status="damaged",
        )
        assert result_damaged["scores"]["fundamentals"] == 5

    def test_volume_scoring(self):
        """Test volume confirmation scoring logic."""
        # Declining sell volume should give high score
        result_declining = analyze_dip_opportunity(
            ticker="NVDA",
            price_change=-3.0,
            volume_trend="declining sell volume",
            news_sentiment="extreme negative",
            fundamentals_status="intact",
        )
        assert result_declining["scores"]["volume"] == 18

        # High distribution should give low score
        result_distribution = analyze_dip_opportunity(
            ticker="NVDA",
            price_change=-3.0,
            volume_trend="high distribution",
            news_sentiment="extreme negative",
            fundamentals_status="intact",
        )
        assert result_distribution["scores"]["volume"] == 6

    def test_sentiment_scoring(self):
        """Test sentiment dislocation scoring logic."""
        # Extreme negative should give high score
        result_extreme = analyze_dip_opportunity(
            ticker="NVDA",
            price_change=-3.0,
            volume_trend="declining sell volume",
            news_sentiment="extreme negative panic",
            fundamentals_status="intact",
        )
        assert result_extreme["scores"]["sentiment"] == 18

        # Neutral should give medium score
        result_neutral = analyze_dip_opportunity(
            ticker="NVDA",
            price_change=-3.0,
            volume_trend="declining sell volume",
            news_sentiment="neutral",
            fundamentals_status="intact",
        )
        assert result_neutral["scores"]["sentiment"] == 10

    def test_narrative_scoring_by_tier(self):
        """Test narrative scoring varies by tier."""
        # Tier 1 should get highest narrative score
        result_tier1 = analyze_dip_opportunity(
            ticker="NVDA",
            price_change=-3.0,
            volume_trend="declining sell volume",
            news_sentiment="extreme negative",
            fundamentals_status="intact",
        )
        assert result_tier1["scores"]["narrative"] == 19

        # Tier 5 should get 18 for defense narrative
        result_tier5 = analyze_dip_opportunity(
            ticker="LMT",
            price_change=-3.0,
            volume_trend="declining sell volume",
            news_sentiment="extreme negative",
            fundamentals_status="intact",
        )
        assert result_tier5["scores"]["narrative"] == 18

    def test_tailwind_scoring(self):
        """Test geopolitical/tailwind scoring logic."""
        # Defense tickers should get high tailwind score
        result_defense = analyze_dip_opportunity(
            ticker="LMT",
            price_change=-3.0,
            volume_trend="declining sell volume",
            news_sentiment="extreme negative",
            fundamentals_status="intact",
        )
        assert result_defense["scores"]["tailwind"] == 9

        # Tier 1 AI tickers should get 8
        result_ai = analyze_dip_opportunity(
            ticker="NVDA",
            price_change=-3.0,
            volume_trend="declining sell volume",
            news_sentiment="extreme negative",
            fundamentals_status="intact",
        )
        assert result_ai["scores"]["tailwind"] == 8


class TestComputeScore:
    """Tests for compute_score function."""

    def test_score_with_zero_weight(self):
        """Test score with zero weight returns base score."""
        result = compute_score(70, 0.0)
        assert result == 70

    def test_score_with_high_weight(self):
        """Test score with high weight is boosted."""
        result = compute_score(70, 0.20)
        assert result == 98  # 70 * (1 + 0.20 * 2) = 98, capped at 100

    def test_score_capped_at_100(self):
        """Test score is capped at 100."""
        result = compute_score(100, 0.50)
        assert result == 100


class TestCheckThesis:
    """Tests for check_thesis function."""

    def test_empty_news_returns_intact(self):
        """Test empty news list returns INTACT."""
        result = check_thesis([])
        assert result == "INTACT"

    def test_negative_keywords_return_broken(self):
        """Test negative keywords return BROKEN."""
        for keyword in ["fraud", "bankruptcy", "regulatory", "ban", "delisted"]:
            result = check_thesis([f"Company involved in {keyword}"])
            assert result == "BROKEN"

    def test_positive_news_returns_intact(self):
        """Test positive news returns INTACT."""
        result = check_thesis(["Company reports strong earnings"])
        assert result == "INTACT"


class TestReboundProbability:
    """Tests for rebound_probability function."""

    def test_high_rebound_scenario(self):
        """Test high rebound probability with low drop and high score."""
        result = rebound_probability(2.0, 90)
        assert result == 100  # Capped at 100

    def test_low_rebound_scenario(self):
        """Test low rebound probability with high drop and low score."""
        result = rebound_probability(20.0, 30)
        assert result == 75  # 100 - 20*2 + 30/2 = 75

    def test_medium_rebound_scenario(self):
        """Test medium rebound probability."""
        result = rebound_probability(5.0, 70)
        assert result == 100  # 100 - 5*2 + 70/2 = 125, capped at 100


class TestClassify:
    """Tests for classify function."""

    def test_green_classification(self):
        """Test GREEN classification for high score and rebound."""
        result = classify(85, "INTACT", 75)
        assert result == "GREEN"

    def test_yellow_classification(self):
        """Test YELLOW classification for medium score."""
        result = classify(70, "INTACT", 50)
        assert result == "YELLOW"

    def test_red_classification_broken_thesis(self):
        """Test RED classification for broken thesis."""
        result = classify(90, "BROKEN", 80)
        assert result == "RED"

    def test_red_classification_low_score(self):
        """Test RED classification for low score."""
        result = classify(50, "INTACT", 60)
        assert result == "RED"


class TestScanPortfolio:
    """Tests for scan_portfolio function."""

    def test_returns_all_portfolio_items(self):
        """Test that scan returns all portfolio items."""
        result = scan_portfolio()
        assert len(result) == len(PORTFOLIO)

    def test_result_structure(self):
        """Test that each result has required fields."""
        result = scan_portfolio()
        for item in result:
            assert "ticker" in item
            assert "weight" in item
            assert "tier" in item
            assert "score" in item
            assert "thesis" in item
            assert "rebound_probability" in item
            assert "decision" in item

    def test_decisions_are_valid(self):
        """Test that all decisions are valid classifications."""
        result = scan_portfolio()
        valid_decisions = {"GREEN", "YELLOW", "RED"}
        for item in result:
            assert item["decision"] in valid_decisions

    def test_scores_are_in_range(self):
        """Test that all scores are in valid range."""
        result = scan_portfolio()
        for item in result:
            assert 0 <= item["score"] <= 100
            assert 0 <= item["rebound_probability"] <= 100
