import pandas as pd
import numpy as np

def weights(capitalByTicker: np.ndarray | None, tickers: list, useEqualWeights: bool):
    """Given a list of tickers and their capital, computes the weights for each stock"""
    if useEqualWeights or capitalByTicker is None:
        w = (1 / len(tickers)) * np.ones(len(tickers))
        return w
    
    totalCapital = np.sum(capitalByTicker[:])
    w = capitalByTicker[:] / totalCapital
    return w

def returns(data: pd.DataFrame) -> pd.DataFrame:
    """Computes daily closing log returns"""
    closingPrices = data.xs('Close', level=0, axis=1)
    
    # Keep NaNs where a stock hasn't started or has stopped trading
    logReturns = np.log(closingPrices / closingPrices.shift(1))
    
    return logReturns

def start(data: pd.DataFrame) -> dict:
    """
    Returns a dict of MCTR values for each stock, 
    properly handling stocks with different trading histories
    """
    tickers = data.xs('Close', level=0, axis=1).columns.tolist()
    log_returns = returns(data)
    
    # Drop rows where all stocks are NaN, but keep NaNs for missing stocks
    log_returns = log_returns.dropna(how='all')

    # Fill remaining NaNs with 0 for covariance computation
    # This assumes that missing trading days do not contribute to returns
    r = log_returns.fillna(0).to_numpy()
    if len(tickers) > 1:
        cov = np.cov(r, rowvar=False)
    else:
        # For a single stock, variance
        cov = np.array([[np.var(r, ddof=1)]])
    
    w = weights(None, tickers, useEqualWeights=True)
    sigma = np.sqrt(w.T @ cov @ w)
    
    mctr = pd.Series((cov @ w) / sigma, index=tickers)
    mctr_norm = mctr / mctr.sum()
    
    return mctr_norm.to_dict()
