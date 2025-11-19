import yfinance as yf
import pandas as pd
import asyncio

def fetchTickerInfo(ticker: str) -> dict:
    """
    Blocking call to download data
    """
    return yf.Ticker(ticker).info


async def asyncTickerInfo(ticker: str) -> dict:
    """
    Call blocking fetch in a thread
    """
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, fetchTickerInfo, ticker)


async def fetchAllTickers(tickers: list[str]) -> list:
    tasks = [asyncTickerInfo(t) for t in tickers]
    return await asyncio.gather(*tasks, return_exceptions=True)


def fetchData(ticker: str, info: dict, clost: float) -> dict:
    """gets historical prices, stats, and recent close"""
    
    stock = yf.Ticker(ticker)
    stats, price = stock.info, stock.history(period="1d")["close"].iloc[-1]

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


def fetchMarketData() -> tuple[dict, dict]:
    """Computes Averages/Expectations on Market Statistics"""

    spy = yf.Ticker("SPY")
    price = spy.history(period="1d")["Close"].iloc[-1]
    stats = spy.info
    
    # market averages
    eps = stats.get("trailingEps", 'N/A')
    pe = stats.get("trailingPE", 'N/A')
    if eps != 'N/A' and pe == 'N/A':
        pe = price / eps
    elif pe != 'N/A' and eps == 'N/A':
        eps = price / pe

    averages = {
        'PERatio': pe,
        'Beta': stats.get("beta", 1.0),
        'Dividend': stats.get("dividendYield", "N/A"),
        'EPS': eps,
        '52W': {'high': stats.get("fiftyTwoWeekHigh", 'N/A'), 'low': stats.get("fiftyTwoWeekLow", 'N/A')}
    }

    # market predictions (expectations)
    eps = stats.get("forwardEps", 'N/A')
    pe = stats.get("forwardPE", 'N/A')

    if eps != 'N/A' and pe == 'N/A':
        pe = price / eps
    elif pe != 'N/A' and eps == 'N/A':
        eps = price / pe

    expectations = {
        'PERatio': pe,
        'Beta': 1.0,
        'Dividend': stats.get("trailingAnnualDividendYield", 'N/A'),
        'EPS': eps,
        '52W': {'high': 'N/A', 'low': 'N/A'}
    }

    return averages, expectations