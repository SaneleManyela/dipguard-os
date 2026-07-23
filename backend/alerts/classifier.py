def classify(score, thesis, rebound):
    if thesis == "BROKEN":
        return "RED"
    if score > 80 and rebound > 70:
        return "GREEN"
    if score > 60:
        return "YELLOW"
    return "RED"
