import numpy as np
import sys
import json

def calculateCagr(start_price, end_price, years):
    return np.round((np.power(end_price / start_price, 1 / years) - 1) * 100, 2)

def calculateRisk(daily_returns):
    return np.round(np.std(daily_returns, ddof=1) * 100, 1)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No input argument provided"}))
        sys.exit(1)

    try:
        data = json.loads(sys.argv[1])
    except Exception:
        print(json.dumps({"error": "Invalid JSON argument"}))
        sys.exit(1)


    if "history" not in data or not isinstance(data["history"], list):
        print(json.dumps({"error": "Missing or invalid 'history' field"}))
        sys.exit(1)

    try:
        prices = [entry["close"] for entry in data["history"] if "close" in entry]

        if len(prices) < 2:
            print(json.dumps({"error": "Not enough data points to calculate metrics"}))
            sys.exit(1)

        years = len(prices) / 252.0

        start_price = prices[0]
        end_price = prices[-1]

        daily_returns = np.diff(prices) / prices[:-1]

        cagr = calculateCagr(start_price, end_price, years)
        risk = calculateRisk(daily_returns)

        print(json.dumps({
            "CAGR": cagr,
            "risk": risk
        }))

    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)