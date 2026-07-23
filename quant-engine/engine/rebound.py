def rebound_probability(drop, score):
    return max(0, min(100, 100 - drop*2 + score/2))
