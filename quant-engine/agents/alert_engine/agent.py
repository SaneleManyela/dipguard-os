from .models import OpportunityAlert
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
try:
    from engine.econophysics import compute_score
except ImportError:
    def compute_score(fundamentals, weight):
        return 85 # Stub

class AlertEngineAgent:
    def __init__(self):
        pass

    def run(self, market_data: dict, thesis_intact: bool) -> dict:
        """
        Classifies opportunities and generates alerts based on econophysics principles.
        """
        ticker = market_data.get('ticker')
        change_pct = market_data.get('changePercent', 0)
        
        if change_pct > -3:
            return {} # Not a dip
            
        # Stub logic based on prompt rules
        score = compute_score(30, 0.1) # Stub weight
        
        if score >= 80 and thesis_intact:
            classification = "Strong Buy Opportunity"
            priority = "P1"
        elif score >= 60:
            classification = "Watch Closely"
            priority = "P2"
        else:
            classification = "Avoid the Dip"
            priority = "P3"
            
        alert = OpportunityAlert(
            ticker=ticker,
            classification=classification,
            priority=priority,
            thesisState="INTACT" if thesis_intact else "BROKEN",
            reboundProbability=0.75, # Stub
            crashMode="NORMAL",
            econophysics_score=score
        )
        
        return alert.dict()
