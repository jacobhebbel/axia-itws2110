import yfinance as yf
import pandas as pd
from flask import Flask, request, jsonify
from scripts.validateTicker import validate_ticker
from flask import Flask, request, jsonify, Request

from scripts import riskChart, efficientFrontier, systematicrisk

def runScripts(data: pd.DataFrame) -> dict:
    """link between service and scripts. returns a dict of stat: val pairs"""
    res = {}
    try: 
    
        res['mctr'] = riskChart.start(data)
        res['efficientFrontier'] = efficientFrontier.start(data)
        #res['systematicRisk'] = systematicrisk.start(data)

    except Exception as e:
        print(e)

    return res

def validateRequest(requestObj: Request) -> tuple[bool, dict]:
    """Ensures the request has required parameters"""

    res = {}
    res['success'] = False
    res['requiredParams'] = ['tickers', 'period', 'interval']
    res['validPeriods'] = ['1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y', '10y']
    res['validIntervals'] = ['1m', '2m', '5m', '15m', '30m', '60m', '90m', '1h', '1d', '5d', '1wk', '1mo', '3mo', '6mo', '1y', '2y', '5y', '10y']
    
    # error checking args
    requiredArgs = ['tickers', 'period', 'interval']
    
    tickerString = request.args.get('tickers')
    
    rawTickers = tickerString.split(',')
    
    for ticker in rawTickers:
        cleanedTicker = ticker.strip().upper()
        if not validate_ticker(cleanedTicker):
            return False

    if any(arg not in requiredArgs for arg in requestObj.args.keys()):
        res['error'] = 'missing requires parameter'
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
        return jsonify(error), 400

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
        return jsonify(scriptResults), 200
    
    # if an error occurred, likely yf is down
    except Exception as e:
        print(e)
        return jsonify({
            "success": False, 
            "err": "an internal service is currently unavailable"
            }), 500
    
if __name__ == "__main__":
    app.run(debug=True, port=4000)