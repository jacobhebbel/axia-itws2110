import pandas as pd
import numpy as np

def weights(capitalByTicker: np.ndarray | None, tickers: list, useEqualWeights: bool):
    """Given a list of tickers and their captial, computes the weights for each stock"""
    if useEqualWeights or capitalByTicker is None:
        w = (1 / len(tickers)) * np.ones((len(tickers)))
        return w
    
    totalCapital = np.sum(capitalByTicker[:])
    w = capitalByTicker[:] / totalCapital
    return w

def returns(data: pd.DataFrame) -> np.ndarray:
    """Computes daily closing log returns"""
    closingPrices = data.xs('Close', level=0, axis=1)
    logReturns = np.log(closingPrices / closingPrices.shift(1))
    return logReturns

def start(data: pd.DataFrame) -> pd.Series:
    """
    Returns a vector of size numTickers, 
    where index i is the MCTR for that stock
    """
    
    tickers = list(data.xs('Close', level=0, axis=1).columns.tolist())
    r = pd.DataFrame(returns(data)).dropna().to_numpy()
    cov = np.cov(r, rowvar=False)
    w = weights(None, tickers, useEqualWeights=True)
    sigma = np.sqrt(w.T @ cov @ w)

    mctr = pd.Series((cov @ w) / sigma, index=tickers)
    mctrNorm = mctr / mctr.sum()
    return mctrNorm