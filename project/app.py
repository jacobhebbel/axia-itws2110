import yfinance as yf
import pandas as pd
from flask import Flask, request, jsonify
from utils.validateTicker import validate_ticker as isValidTicker
from flask import Flask, request, jsonify, Request

from utils import riskChart, efficientFrontier, systematicrisk

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
    """

    
    # validate the request
    isValid, error = validateRequest()
    if not isValid:
        return {'error': error}, 400

    # read the tickers
    tickers = list(str(request.args.get('tickers')).split(','))
    
    # read from the cache
    stats, graphs = [], []
    for ticker in tickers:
        s, g = sCache.query(ticker), gCache.query(ticker)
        
    # read values from cache
    stats.append(sCache.query(t) for t in tickers)
    graphs.append(gCache.query(t) for t in tickers)
    
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
    from utils.cache import GraphCache, StatsCache

    sp500 = list(yf.Ticker('^GSPC'))

    # use multithreading for request operations
    # use multiprocessing for cpu operations
    # max workers should be the number of cpu cores


    TTL, SWEEP = 999, 999
    gCache, sCache = GraphCache(TTL, SWEEP), StatsCache(TTL, SWEEP)
    stockData, statData, graphData = pd.DataFrame(), {}, {}
    for stock in sp500:

        statData = fetchData(stock)
        sCache.add(stock, statData)

        graphData = runScripts(stock)
        gCache.add(stock, graphData)

    currentMarket, expectedMarket = fetchMarketData()
    sCache.add('avg', currentMarket)
    sCache.add('exp', expectedMarket)

    app.run(port=4000)