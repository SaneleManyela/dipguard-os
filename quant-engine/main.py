from universe.portfolio import PORTFOLIO
from engine.econophysics import compute_score
from engine.thesis import check_thesis
from engine.rebound import rebound_probability
from alerts.classifier import classify

def run():
    for asset, weight in PORTFOLIO.items():
        price_drop = 10  # stub
        news = []

        score = compute_score(70, weight)
        thesis = check_thesis(news)
        rebound = rebound_probability(price_drop, score)

        decision = classify(score, thesis, rebound)

        print(asset, decision)

if __name__ == '__main__':
    run()
