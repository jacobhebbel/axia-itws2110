import yfinance as yf
import pandas as pd
from flask import Flask, request, jsonify
from scripts.validateTicker import validate_ticker as isValidTicker
from flask import Flask, request, jsonify, Request

from scripts import riskChart, efficientFrontier, systematicrisk

def doAnalysis(tickers: list) -> dict:
    """
    Creates a dictionary of P/E Ratio, Volatility betas, Dividend Yield, EPS, and 52W range stats 
    """
    res = {ticker: {} for ticker in tickers}
    for ticker in tickers:
        
        # stock stats
        stock = yf.Ticker(ticker)
        info = res[ticker]
        price = stock.history(period="1d")["Close"].iloc[-1]
        stock = stock.info

        # eps / pe calculation
        eps, pe = stock.get("trailingEps", 'N/A'), stock.get("trailingPE", 'N/A')
        if eps != 'N/A' and pe == 'N/A':
            pe = price / eps
        elif pe != 'N/A' and eps == 'N/A':
            eps = price / pe

        info['PERatio'] = pe
        info['Beta'] = stock.get("beta", 'N/A')
        info['Dividend'] = stock.get("dividendYield") if stock.get("dividendYield") is not None else 'N/A'
        info['EPS'] = eps
        info['52W'] = {'high': stock.get("fiftyTwoWeekHigh", 'N/A'), 'low': stock.get("fiftyTwoWeekLow", 'N/A')}

    # switching to market benchmark (spy)
    spy = yf.Ticker("SPY")
    price = spy.history(period="1d")["Close"].iloc[-1]
    spy = spy.info
    
    # market averages
    # compute eps / pe
    eps = spy.get("trailingEps", 'N/A')
    pe = spy.get("trailingPE", 'N/A')
    if eps != 'N/A' and pe == 'N/A':
        pe = price / eps
    elif pe != 'N/A' and eps == 'N/A':
        eps = price / pe
    res['average'] = {
        'PERatio': pe,
        'Beta': spy.get("beta", 1.0),
        'Dividend': spy.get("dividendYield") if spy.get("dividendYield") is not None else 'N/A',
        'EPS': eps,
        '52W': {'high': spy.get("fiftyTwoWeekHigh", 'N/A'), 'low': spy.get("fiftyTwoWeekLow", 'N/A')}
    }

    # market predictions (expectations)
    eps = spy.get("forwardEps", 'N/A')
    pe = spy.get("forwardPE", 'N/A')

    if eps != 'N/A' and pe == 'N/A':
        pe = price / eps
    elif pe != 'N/A' and eps == 'N/A':
        eps = price / pe

    res['expectation'] = {
        'PERatio': pe,
        'Beta': 1.0,
        'Dividend': spy.get("trailingAnnualDividendYield") * 100 if spy.get("trailingAnnualDividendYield") is not None else 'N/A',
        'EPS': eps,
        '52W': {'high': 'N/A', 'low': 'N/A'}
    }

    for category, metrics in res.items():
        for metric, val in metrics.items():
            
            if type(val) == dict:
                res[category][metric]['high'] = round(val['high'], 2) if val['high'] != 'N/A' else 'N/A'
                res[category][metric]['low'] = round(val['low'], 2) if val['low'] != 'N/A' else 'N/A'
            else:
                res[category][metric] = round(val, 2) if val != 'N/A' else 'N/A'
    return res

def runScripts(data: pd.DataFrame) -> dict:
    """link between service and scripts. returns a dict of stat: val pairs"""
    res = {}
    
    res['mctr'] = riskChart.start(data)
    res['efficientFrontier'] = efficientFrontier.start(data)
    #res['systematicRisk'] = systematicrisk.start(data)

    return res

def validateRequest(requestObj: Request) -> tuple[bool, dict]:
    """Ensures the request has required parameters"""

    res = {}
    res['success'] = False
    res['requiredParams'] = ['tickers', 'period', 'interval']
    res['validPeriods'] = ['1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y', '10y']
    res['validIntervals'] = ['1m', '2m', '5m', '15m', '30m', '60m', '90m', '1h', '1d', '5d', '1wk', '1mo', '3mo', '6mo', '1y', '2y', '5y', '10y']
    
    # error checking params
    if any(arg not in res['requiredParams'] for arg in requestObj.args.keys()):
        res['error'] = 'missing required parameter'
        return False, res

    rawTickers = str(request.args.get('tickers')).split(',')    
    # error checking tickers
    if any(not isValidTicker(ticker) for ticker in rawTickers):
        res['error'] = 'at least 1 ticker was invalid'
        return False, res

    # error checking period
    validPeriods, period = res['validPeriods'], requestObj.args.get('period')
    if period not in validPeriods:
        res['error'] = 'period not valid'
        return False, res
    
    # error checking interval
    validIntervals, interval = res['validIntervals'], requestObj.args.get('interval')
    if interval not in validIntervals:
        res['error'] = 'interval not valid'
        return False, res
    
    return True, {}

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

    isValid, error = validateRequest(request)
    if not isValid:
        return error, 400

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
    app.run(port=4000)