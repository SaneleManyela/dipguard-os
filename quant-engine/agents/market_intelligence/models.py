from pydantic import BaseModel
from typing import Optional, List

class MarketData(BaseModel):
    ticker: str
    price: float
    changePercent: float
    volumeSpike: bool
    news_sentiment: Optional[str] = None
    macro_flags: List[str] = []
