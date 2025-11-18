import yfinance as yf

def validate_ticker(ticker):
    try:
        tickerObj = yf.Ticker(ticker)
        info = tickerObj.info

        if not info or "shortName" not in info:
            return False
        return True
    except Exception:
        return False
    
