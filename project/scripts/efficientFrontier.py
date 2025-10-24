import numpy as np
import pandas as pd

def calculateCagr(start_price, end_price, years):
    return np.round((np.power(end_price / start_price, 1 / years) - 1) * 100, 2)

def calculateRisk(daily_returns):
    return np.round(np.std(daily_returns, ddof=1) * 100, 1)

def start(data: pd.DataFrame) -> pd.Series:
    close_prices = data.xs('Close', level=0, axis=1)
    col = close_prices.columns[0]

    start_price = close_prices[col].values[0]
    end_price = close_prices[col].values[-1]

    daily_returns = close_prices[col].pct_change()
    years = len(close_prices) / 252.0

    cagr = calculateCagr(start_price, end_price, years)
    risk = calculateRisk(daily_returns)

    return pd.Series({
        "cagr": cagr,
        "risk": risk
    })