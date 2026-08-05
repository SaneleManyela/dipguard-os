import argparse
import time
from typing import List, Dict

import yfinance as yf

try:
    # prefer existing notifier if available
    from backend.alerts.notifier_telegram import send as telegram_send
except Exception:
    def telegram_send(msg: str):
        print(msg)


CATEGORY_KEYWORDS: Dict[str, List[str]] = {
    "Artificial Intelligence": ["ai", "artificial intelligence", "machine learning", "deep learning"],
    "Semiconductors": ["semiconductor", "semiconductors", "chip"],
    "Space": ["space", "aerospace", "rocket"],
    "Digital Infrastructure": ["data center", "data-centre", "cloud", "digital infrastructure", "hosting"],
    "Telecommunications": ["telecom", "telecommunications", "wireless", "telephony"],
    "Water": ["water", "water utilities", "utility"],
    "Energy": ["energy", "oil", "gas", "renewable", "electric"],
    "Food Security": ["food", "agriculture", "agribusiness", "farming"],
    "Defence": ["defence", "defense", "military", "aerospace"],
    "Financials": ["bank", "financial", "finance", "insurance"],
    "Real Estate": ["real estate", "property", "reit", "real-estate"],
    "Gold": ["gold", "precious metal", "precious metals"],
    "Core Global Markets": ["index", "market", "exchange"],
}

EXCHANGE_KEYWORDS = {
    "ZA": [".jo", "jse", "johannesburg"],
    "NASDAQ": ["nasdaq", "nms"],
    "ASX": [".ax", "asx"],
    "GBP": [".l", "lse", "london"],
}


def matches_category(sector: str, industry: str, categories: List[str]) -> List[str]:
    matched = []
    text = " ".join([str(sector or ""), str(industry or "")]).lower()
    for cat in categories:
        keys = CATEGORY_KEYWORDS.get(cat, [])
        for k in keys:
            if k in text:
                matched.append(cat)
                break
    return matched


def matches_exchange(ticker: str, info: dict, wanted_exchanges: List[str]) -> bool:
    ex_text = " ".join([str(info.get("exchange", "")), str(info.get("market", ""))]).lower()
    t = ticker.lower()
    for w in wanted_exchanges:
        keys = EXCHANGE_KEYWORDS.get(w.upper(), [])
        for k in keys:
            if k in ex_text or t.endswith(k):
                return True
    return False


def check_tickers(tickers: List[str], categories: List[str], exchanges: List[str], threshold_pct: float = 5.0):
    signals = []
    for ticker in tickers:
        try:
            tk = yf.Ticker(ticker)
            info = tk.info or {}

            sector = info.get("sector") or info.get("industry") or ""
            industry = info.get("industry") or ""

            if not matches_exchange(ticker, info, exchanges):
                continue

            matched_cats = matches_category(sector, industry, categories)
            if not matched_cats:
                continue

            price = info.get("regularMarketPrice")
            previous = info.get("previousClose")
            if price is None or previous is None or previous == 0:
                hist = tk.history(period="2d")
                if not hist.empty:
                    price = hist["Close"].iloc[-1]
                    previous = hist["Close"].iloc[-2] if len(hist) > 1 else price

            if price is None or previous is None or previous == 0:
                continue

            pct_change = (price - previous) / previous * 100.0

            if pct_change <= -abs(threshold_pct):
                msg = (
                    f"DIP signal: {ticker} | price={price:.2f} | prev={previous:.2f} | "
                    f"change={pct_change:.2f}% | sectors={matched_cats} | exchange={info.get('exchange')}"
                )
                signals.append((ticker, msg))
        except Exception as e:
            print(f"error processing {ticker}: {e}")
        # be polite to Yahoo
        time.sleep(0.1)
    return signals


def main():
    parser = argparse.ArgumentParser(description="Yahoo Finance DIP monitor for selected categories and exchanges")
    parser.add_argument("--tickers", help="Comma-separated tickers to check", default="")
    parser.add_argument("--tickers-file", help="File with one ticker per line", default="")
    parser.add_argument("--categories", help="Comma-separated categories to include", default="Artificial Intelligence,Semiconductors,Space,Digital Infrastructure,Telecommunications,Water,Energy,Food Security,Defence,Financials,Real Estate,Gold,Core Global Markets")
    parser.add_argument("--exchanges", help="Comma-separated exchanges: ZA,NASDAQ,ASX,GBP", default="ZA,NASDAQ,ASX,GBP")
    parser.add_argument("--threshold", help="Dip threshold percent (positive number)", type=float, default=5.0)
    parser.add_argument("--send-telegram", help="Send signals to Telegram via backend notifier", action="store_true")
    args = parser.parse_args()

    tickers = []
    if args.tickers:
        tickers = [t.strip() for t in args.tickers.split(",") if t.strip()]
    if args.tickers_file:
        with open(args.tickers_file) as f:
            tickers += [l.strip() for l in f if l.strip() and not l.startswith("#")]

    # sample tickers if none provided (small seeds — extend for production)
    if not tickers:
        tickers = [
            "AAPL", "NVDA", "TSLA",  # NASDAQ
            "CBA.AX", "CSL.AX",      # ASX
            "NPN.JO", "SHP.JO",     # sample JSE (South Africa)
            "BA.L", "GLEN.L",       # LSE (GBP)
        ]

    categories = [c.strip() for c in args.categories.split(",") if c.strip()]
    exchanges = [e.strip() for e in args.exchanges.split(",") if e.strip()]

    signals = check_tickers(tickers, categories, exchanges, threshold_pct=args.threshold)
    for _, msg in signals:
        print(msg)
        if args.send_telegram:
            try:
                telegram_send(msg)
            except Exception as e:
                print(f"failed sending telegram: {e}")

    if not signals:
        print("No DIP signals found.")


if __name__ == "__main__":
    main()
