def compute_score(base, weight):
    return min(100, base * (1 + weight*2))
