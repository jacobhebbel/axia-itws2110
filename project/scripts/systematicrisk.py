import numpy as np
import pandas as pd

def computeReturns(prices):
    return prices.pct_change().dropna()

def calculateBeta(stock_returns, market_returns):
    covariance = np.cov(stock_returns, market_returns)[0, 1]
    variance = np.var(market_returns)
    beta = covariance / variance
    return np.round(beta, 3)

def start(data: pd.DataFrame) -> pd.Series:
    stock_col = data.columns[0]
    market_col = data.columns[1]

    stock_returns = computeReturns(data[stock_col])
    market_returns = computeReturns(data[market_col])

    aligned = pd.concat([stock_returns, market_returns], axis=1).dropna()
    aligned.columns = ['stock', 'market']

    beta = calculateBeta(aligned['stock'], aligned['market'])

    return beta


    
