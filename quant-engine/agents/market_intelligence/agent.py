from .market_feed import fetch_market_data
from .models import MarketData

class MarketIntelligenceAgent:
    def __init__(self):
        pass

    def run(self, ticker: str) -> dict:
        """
        Orchestrates the market intelligence gathering for a given ticker.
        """
        data: MarketData = fetch_market_data(ticker)
        # News and Macro integrations would go here
        return data.dict()
