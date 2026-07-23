import yfinance as yf
from .models import MarketData

def fetch_market_data(ticker: str) -> MarketData:
    ticker_obj = yf.Ticker(ticker)
    data = ticker_obj.history(period="5d")
    if data.empty:
        return MarketData(ticker=ticker, price=0.0, changePercent=0.0, volumeSpike=False)
        
    last_close = data['Close'].iloc[-1]
    prev_close = data['Close'].iloc[-2] if len(data) > 1 else last_close
    change_pct = ((last_close - prev_close) / prev_close) * 100
    
    # Simple volume spike detection (current volume > 1.5x average)
    avg_vol = data['Volume'].mean()
    last_vol = data['Volume'].iloc[-1]
    volume_spike = last_vol > (1.5 * avg_vol)
    
    return MarketData(
        ticker=ticker,
        price=last_close,
        changePercent=change_pct,
        volumeSpike=volume_spike
    )
