import numpy as np
import sys
import json
import pandas as pd

def calculateCagr(start_price, end_price, years):
    return np.round((np.power(end_price / start_price, 1 / years) - 1) * 100, 2)

def calculateRisk(daily_returns):
    return np.round(np.std(daily_returns, ddof=1) * 100, 1)

def processData(data):
    try:
        close_prices = data.xs('Close', level=0, axis=1)

        col = close_prices.columns[0]

        start_price = close_prices[col].values[0]
        end_price = close_prices[col].values[-1]

        daily_returns = close_prices[col].pct_change()

        years = len(close_prices) / 252.0

        cagr = calculateCagr(start_price, end_price, years)
        risk = calculateRisk(daily_returns)

        return json.dumps({
            "CAGR": cagr,
            "risk": risk
        })

    except Exception as e:
        return json.dumps({"error": str(e)})

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No input argument provided"}))
        sys.exit(1)

    data = sys.argv[1]

    result = processData(data)
    print(result)
