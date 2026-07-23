from .models import CapitalPlan, AllocationSuggestion

class CapitalAllocatorAgent:
    def __init__(self):
        pass

    def run(self, cash_available: float, opportunities: list) -> dict:
        """
        Suggests capital deployment based on portfolio rules and available cash.
        Priority: Existing holdings -> Core ETFs -> T1 -> ... -> T6.
        """
        allocations = []
        if cash_available > 0 and opportunities:
            # Simple stub allocation: divide cash among P1 opportunities
            p1_opps = [opp for opp in opportunities if opp.get('priority') == 'P1']
            if p1_opps:
                split = cash_available / len(p1_opps)
                for opp in p1_opps:
                    allocations.append(AllocationSuggestion(ticker=opp['ticker'], amount=split))
                    
        plan = CapitalPlan(
            cashAvailable=cash_available,
            allocations=allocations
        )
        return plan.dict()
