import yfinance as yf
import pandas as pd
from flask import Flask, request, jsonify
from utils.validateTicker import validate_ticker as isValidTicker
from flask import Flask, request, jsonify, Request


app = Flask(__name__)


def validateRequest() -> tuple[bool, str]:
    """Ensures the request has required parameters"""

    rawTickers = str(request.args.get('tickers')).split(',')    
    # error checking tickers
    if any(not isValidTicker(ticker) for ticker in rawTickers):
        err = 'at least 1 ticker was invalid'
        return False, err
    else:
        return True, 'success'


def merge(d1: dict, d2: dict) -> dict:
    """
    Helper function for combining dictionaries
    """
    for k, v in d2.items():
        d1[k] = v
    return d1

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
    print(tickers)
    
    try:

        # readItems internally handles misses
        # market vals are fixed at start, and | takes the union of the 3 dicts
        stats = sCache.readItems(tickers)
        graphs = gCache.readItems(tickers)

        stats = merge(merge(stats, {'marketAverages': CURRENT_MARKET}), {'marketPredictions': EXPECTED_MARKET})
        print(stats)

        return {
            'stats': stats,
            'graphs': graphs,

        }, 200
        
    except Exception as e:
        print(e)
        raise e
        return {'err': 'internal server error'}, 500


if __name__ == "__main__":
    from utils.cache import GraphCache, StatsCache
    from utils.scripts import fetchMarketData, getSp500Tickers

    # sp500 = [t for t in getSp500Tickers() if isValidTicker(t)]
    TTL, SWEEP = 999, 999
    gCache, sCache = GraphCache(TTL, SWEEP), StatsCache(TTL, SWEEP)
    
    # warm up caches
    # sCache.warmup(sp500, batchSize=10, delay=10.0)
    # gCache.warmup(sp500, batchSize=10, delay=10.0)
    
    # constants that dont rlly change in short term
    CURRENT_MARKET, EXPECTED_MARKET = fetchMarketData()
    print(CURRENT_MARKET)
    print(EXPECTED_MARKET)
    app.run(port=4000)