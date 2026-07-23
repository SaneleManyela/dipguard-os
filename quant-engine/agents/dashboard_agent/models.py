from pydantic import BaseModel
from typing import List, Dict, Any

class DashboardSummary(BaseModel):
    timestamp: str
    market_overview: Dict[str, Any]
    alerts: List[Dict[str, Any]]
    portfolio_exposure: Dict[str, Any]
    capital_plan: Dict[str, Any]
