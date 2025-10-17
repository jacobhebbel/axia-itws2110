import numpy as np
from typing import List

# Computes an array of daily returns
def compute_returns(prices: List[float]):
    prices_array = np.array(prices)
    returns = (prices_array[1:] - prices_array[:-1]) / prices_array[:-1]
    return returns

# Computes Systematic Risk (Beta)
def compute_beta(stock_prices: List[float], market_prices: List[float]):
    stock_returns = compute_returns(stock_prices)
    market_returns = compute_returns(market_prices)

    # Covariance and variance
    cov_matrix = np.cov(stock_returns, market_returns)
    covariance = cov_matrix[0, 1]
    market_variance = cov_matrix[1, 1]

    beta = covariance / market_variance
    return beta

def main():
    # Test Data (Replace with Real Prices)
    stock_prices = [150, 153, 152, 155, 157, 160, 158]
    market_prices = [4000, 4050, 4030, 4100, 4150, 4200, 4180]

    beta_value = compute_beta(stock_prices, market_prices)
    print("Systematic Risk (Beta): {0:.2f}".format(beta_value))

if __name__ == '__main__':
    main()
