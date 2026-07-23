from .models import PortfolioExposure
import sys
import os

# Add parent dir to path to import universe
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
try:
    from universe.portfolio import PORTFOLIO
except ImportError:
    # Stub if portfolio is missing
    PORTFOLIO = {"NVDA": 0.4, "MSFT": 0.3, "CASH": 0.3}

class PortfolioMirrorAgent:
    def __init__(self):
        self.holdings = PORTFOLIO

    def run(self) -> dict:
        """
        Calculates exposure and flags concentration risk based on EasyEquities portfolio.
        """
        cash = self.holdings.get("CASH", 0.0)
        max_exposure = max(self.holdings.values()) if self.holdings else 0.0
        
        exposure = PortfolioExposure(
            allocations=self.holdings,
            concentration_risk=max_exposure > 0.5, # Flag if single asset is > 50%
            cash_percentage=cash
        )
        
        return exposure.dict()
