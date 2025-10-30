import numpy as np
import pandas as pd

def calculateCagr(start_price, end_price, years):
    return np.round((np.power(end_price / start_price, 1 / years) - 1) * 100, 2)

def calculateRisk(daily_returns):
    return np.round(np.std(daily_returns, ddof=1) * 100, 1)

def start(data: pd.DataFrame) -> dict:
    
    tickers = data.columns.tolist()

    # First valid price per stock (vectorized via apply)
    start_prices = data.apply(lambda x: x[x.first_valid_index()])

    # End price (last available price, vectorized)
    end_prices = data.apply(lambda x: x[x.last_valid_index()])

    # Number of trading days per stock
    num_days = data.apply(lambda x: x.count())  # ignores NaNs
    years = num_days / 252.0

    # Vectorized CAGR computation
    cagr = ((end_prices / start_prices) ** (1 / years) - 1) * 100

    # Vectorized risk computation (ignores NaNs automatically)
    daily_returns = data.pct_change()
    risk = daily_returns.std(ddof=1) * 100

    metrics_df = pd.DataFrame(
        {
            'risk': np.round(risk, 1),
            'cagr': np.round(cagr, 2)
        },
        index=tickers
    )

    metrics = metrics_df.to_dict(orient='index')
    return metrics