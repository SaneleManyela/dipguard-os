from pydantic import BaseModel

class OpportunityAlert(BaseModel):
    ticker: str
    classification: str
    priority: str
    thesisState: str
    reboundProbability: float
    crashMode: str
    econophysics_score: float
