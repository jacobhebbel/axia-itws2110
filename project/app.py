import yfinance as yf
import pandas as pd
from flask import Flask, request, jsonify
from utils.validateTicker import validate_ticker as isValidTicker
from flask import Flask, request, jsonify, Request

from utils import riskChart, efficientFrontier, systematicrisk

def fetchData(ticker: str) -> tuple[dict, pd.DataFrame]:
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

    stockData = yf.download(ticker, pd.DataFrame(), period='10y', interval='1d', timeout=50)
    stockPrices = stockData if stockData is not None else pd.DataFrame()

    return stockMetrics, stockPrices

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

def runScripts(data: pd.DataFrame) -> dict:
    """link between service and scripts. returns a dict of stat: val pairs"""
    res = {}
    
    res['mctr'] = riskChart.start(data)
    res['efficientFrontier'] = efficientFrontier.start(data)
    #res['systematicRisk'] = systematicrisk.start(data)

    return res

def validateRequest() -> tuple[bool, str]:
    """Ensures the request has required parameters"""

    rawTickers = str(request.args.get('tickers')).split(',')    
    # error checking tickers
    if any(not isValidTicker(ticker) for ticker in rawTickers):
        err = 'at least 1 ticker was invalid'
        return False, err
    else:
        return True, 'success'

app = Flask(__name__)
# ping to test connection
@app.route("/ping", methods=["GET"])
def ping():
    """For testing if the flask service is running"""
    return jsonify({"success": True}), 200

# collect data given tickers, interval, period
@app.route("/data", methods=["GET"])
def yfinanceCall():
    """For fetching data from yfinance
    Parameters:        
            tickers:        a comma-separated string of length-4 tickers to collect data on
            interval:       
            period:         
    """

    isValid, error = validateRequest()
    if not isValid:
        return {'error': error}, 400

    # constructs the query
    tickers = list(str(request.args.get('tickers')).split(','))
    interval = str(request.args.get('interval'))
    period = str(request.args.get('period'))

    try:
        # if yf throws an error, it should imply the service is down (we have strong error checking)
        res = yf.download(tickers, period=period, interval=interval, timeout=50) 
        data = res if res is not None else pd.DataFrame()

        # script results is a dict of our .. script results
        scriptResults = runScripts(data)
        analysisResults = doAnalysis(tickers)
        return {
            'graphs': scriptResults,
            'stats': analysisResults
        }, 200
    
    # if an error occurred, likely yf is down
    except Exception as e:
        print('exception occurred')
        print(e)
        return jsonify({
            "success": False, 
            "err": "an internal service is currently unavailable"
            }), 500
    
if __name__ == "__main__":
    from concurrent.futures import ThreadPoolExecutor
    from concurrent.futures import ProcessPoolExecutor

    sp500 = list(yf.Ticker('^GSPC'))

    # use multithreading for request operations
    # use multiprocessing for cpu operations
    # max workers should be the number of cpu cores

    stockData, statData, graphData = pd.DataFrame(), {}, {}
    with ThreadPoolExecutor(max_workers=5) as executor:
        statData = list(executor.map(fetchData, sp500))
        # find some way to throw in the market data computation in parallel to this

    with ProcessPoolExecutor(max_workers=5) as executor:
        graphData = list(executor.map(runScripts, stockData))

    app.run(port=4000)