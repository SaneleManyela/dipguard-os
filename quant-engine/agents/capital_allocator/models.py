from pydantic import BaseModel
from typing import List, Dict

class AllocationSuggestion(BaseModel):
    ticker: str
    amount: float

class CapitalPlan(BaseModel):
    cashAvailable: float
    allocations: List[AllocationSuggestion]
