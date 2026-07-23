from .models import DashboardSummary
from datetime import datetime, timezone, timedelta

class DashboardAgent:
    def __init__(self):
        pass

    def run(self, market_data, alerts, exposure, capital_plan) -> dict:
        """
        Aggregates outputs from other agents into a unified dashboard feed format.
        """
        # SAST is UTC+2
        sast_time = datetime.now(timezone(timedelta(hours=2))).strftime('%Y-%m-%d %H:%M:%S SAST')
        
        summary = DashboardSummary(
            timestamp=sast_time,
            market_overview={"tickers_scanned": len(market_data)},
            alerts=alerts,
            portfolio_exposure=exposure,
            capital_plan=capital_plan
        )
        return summary.dict()
