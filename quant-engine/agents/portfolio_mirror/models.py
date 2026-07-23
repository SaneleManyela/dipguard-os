from pydantic import BaseModel
from typing import Dict

class PortfolioExposure(BaseModel):
    allocations: Dict[str, float]
    concentration_risk: bool
    cash_percentage: float
