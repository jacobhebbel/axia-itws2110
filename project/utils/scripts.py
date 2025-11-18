from utils.efficientFrontier import start as computeFrontier
from utils.riskChart import start as computeMCTR
from utils.systematicrisk import start as computeRisk
from utils.validateTicker import validate_ticker
from utils.market import fetchData as fetchStockMetrics
from utils.market import fetchMarketData as fetchMarketMetrics

import yfinance as yf
import pandas as pd

# CPU tasks
def efficiencyFrontier(data: pd.DataFrame) -> dict:
    return computeFrontier(data)

# CPU tasks
def marginalContributionToRisk(data: pd.DataFrame) -> dict:
    return computeMCTR(data)

def systemicRisk():
    pass

# Involves a request
def fetchData(ticker: str) -> tuple[dict, pd.DataFrame]:
    return fetchStockMetrics(ticker)

# Involves a request
def fetchMarketData() -> tuple[dict, dict]:
    return fetchMarketMetrics()

def validateTicker():
    pass

def graphDriverFunction(allStockData: pd.DataFrame):
    pass
    # convert to a dataframe
    # run on this

def statDriverFunction(ticker):
    pass