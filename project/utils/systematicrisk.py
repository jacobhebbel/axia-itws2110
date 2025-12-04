import numpy as np
import pandas as pd

def computeReturns(prices):
    return prices.pct_change().dropna()

def calculateBeta(stock_returns, market_returns):
    covariance = np.cov(stock_returns, market_returns)[0, 1]
    variance = np.var(market_returns)
    beta = covariance / variance
    return np.round(beta, 3)

def start(data: pd.DataFrame, asset: str, market: str = "SPY") -> float:
    """
    Compute beta of a single asset relative to a market benchmark.
    data: full yfinance DataFrame containing many tickers
    asset: ticker string (ex: "AAPL")
    market: benchmark ticker (default "SPY")
    """
    close_prices = data.xs('Close', level=0, axis=1)

    # Ensure both exist
    if asset not in close_prices.columns or market not in close_prices.columns:
        return None

    # Compute returns
    stock_returns = computeReturns(close_prices[asset])
    market_returns = computeReturns(close_prices[market])

    # Align
    aligned = pd.concat([stock_returns, market_returns], axis=1).dropna()
    aligned.columns = ['stock', 'market']

    beta = calculateBeta(aligned['stock'], aligned['market'])
    return float(beta)


    
