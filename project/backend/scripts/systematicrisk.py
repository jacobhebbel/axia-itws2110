import sys, json
import numpy as np

def compute_returns(prices):
    prices = np.array(prices)
    return (prices[1:] - prices[:-1]) / prices[:-1]

def compute_beta(stock_prices, market_prices=None):
    if market_prices is None:
        market_prices = np.linspace(stock_prices[0], stock_prices[-1], len(stock_prices))
    stock_returns = compute_returns(stock_prices)
    market_returns = compute_returns(market_prices)
    cov_matrix = np.cov(stock_returns, market_returns)
    beta = cov_matrix[0, 1] / cov_matrix[1, 1]
    return beta

if __name__ == "__main__":
    arg = json.loads(sys.argv[1])
    prices = arg.get("prices", [])
    beta = compute_beta(prices)
    print(json.dumps({"beta": beta}))
