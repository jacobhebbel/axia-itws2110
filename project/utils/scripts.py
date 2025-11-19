from utils.efficientFrontier import start as computeFrontier
from utils.riskChart import start as computeMCTR
from utils.systematicrisk import start as computeRisk
from utils.validateTicker import validate_ticker
from utils.market import fetchData as fetchStockMetrics
from utils.market import fetchMarketData as fetchMarketMetrics

import yfinance as yf
import pandas as pd
import asyncio

# CPU task (already vectorized)
def efficiencyFrontier(data: pd.DataFrame) -> dict:
    return computeFrontier(data)


# CPU task (already vectorized)
def marginalContributionToRisk(data: pd.DataFrame) -> dict:
    return computeMCTR(data)


# CPU task (will be vectorized)
def systemicRisk():
    pass


# Network task (use threading)
def fetchMarketData() -> tuple[dict, dict]:
    return fetchMarketMetrics()


# no words
def validateTicker():
    pass


def graphDriverFunction(allStockData: pd.DataFrame):
    """
    Calls the graph fuctions
    """
    res = {
        'mctr': marginalContributionToRisk(allStockData),
        'efficientFrontier': efficiencyFrontier(allStockData)
    }
    return res


# Network task, blocked
def fetchTickerInfo(ticker: str) -> dict:
    """
    Blocking call to download data
    """
    return yf.Ticker(ticker).info


# Network task, asynchronous
async def asyncTickerInfo(ticker: str) -> dict:
    """
    Call blocking fetch in a thread
    """
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, fetchTickerInfo, ticker)


# Collects network tasks
async def fetchAllTickers(tickers: list[str]) -> list:
    tasks = [asyncTickerInfo(t) for t in tickers]
    return await asyncio.gather(*tasks, return_exceptions=True)


# Technically a CPU task, but O(1) (SHOULD BE)
def computeStockMetrics(ticker: str, info: dict, close: float) -> dict:
    """gets historical prices, stats, and recent close"""
    
    stats = info 
    price = close

    eps, pe = stats.get("trailingEps", 'N/A'), stats.get("trailingPE", 'N/A')
    if eps != 'N/A' and pe == 'N/A':
        pe = price / eps
    elif pe != 'N/A' and eps == 'N/A':
        eps = price / pe
    
    stockMetrics = {
        'PERatio': pe,
        'Beta': stats.get('beta', 'N/A'),
        'Dividend': stats.get('dividendYield', 'N/A'),
        'EPS': eps,
        '52W': {'high': stats.get("fiftyTwoWeekHigh", 'N/A'), 'low': stats.get("fiftyTwoWeekLow", 'N/A')}
    }

    return stockMetrics


async def statDriverFunction(tickers: list) -> dict:
    """
    Constructs the stat dictionary
    """

    # bulk download price data for eps calcs
    prices = yf.download(tickers, period="1d", interval="1d", group_by="ticker", timeout=10)
    if len(tickers) == 1:
        prices = pd.DataFrame({tickers[0]: prices["Close"]})
    
    # collect closes for eps calcs
    recent_closes = {}
    for ticker in tickers:
        try:
            recent_closes[ticker] = prices[ticker]["Close"].iloc[-1]
        except Exception:
            recent_closes[ticker] = None

    # opens n threads, each making a request to yfin for stock n 
    data = await fetchAllTickers(tickers)

    # collect stats into dict
    results = {}
    for ticker, info in zip(tickers, data):
        if isinstance(info, Exception) or recent_closes[ticker] is None:
            results[ticker] = {"error": str(info) if isinstance(info, Exception) else "No price data"}
        else:
            results[ticker] = computeStockMetrics(ticker, info, recent_closes[ticker])

    return results


def statWrapperFunction(tickers: list[str]) -> dict:
    res =  asyncio.run(statDriverFunction(tickers))
    return res

def getSp500Tickers():

    import pandas as pd
    import requests

    path = 'utils/sp500list.csv'
    df = pd.read_csv(path)

    # Inspect the columns
    print(df.columns)

    # Suppose the ticker column is named “Ticker” (or “Symbol”)
    tickers = df["Ticker"].tolist()

    print(f"Found {len(tickers)} tickers")
    print(tickers[:10])

    return tickers