import yfinance as yf
import pandas as pd
from flask import Flask, request, jsonify

from scripts import riskChart, efficientFrontier, systematicrisk

def runScripts(data: pd.DataFrame) -> dict:
    
    res = {}
    res['mctr'] = riskChart.start(data).to_json()
    res['efficientFrontier'] = efficientFrontier.start(data).to_json()
    return res

# checks if all args are there, not if they're formatted properly
def validRequest(requestObj):
    """Ensures the request has required parameters"""
    requiredArgs = ['tickers', 'period', 'interval']

    if all(arg in requestObj.args.keys() for arg in requiredArgs):
        return True
    else:
        return False

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

    # checks if all args are present
    if not validRequest(request):
        return jsonify({
            "success": False, 
            "err": "request missing parameters", 
            "requiredParams": ['tickers', 'interval', 'period']
            }), 400

    # constructs the query
    tickers = list(str(request.args.get('tickers')).split(','))
    interval = str(request.args.get('interval'))
    period = str(request.args.get('period'))

    try:
        res = yf.download(tickers, period=period, interval=interval) 
        data = res if res is not None else pd.DataFrame()

        scriptResults = runScripts(data)
        #dataAsJson = data.to_json(orient="records", date_format="iso")
        return jsonify(scriptResults), 200
    
    # if an error occurred, likely a parameter is malformed
    except Exception as e:
        print(e)
        return jsonify({
            "success": False, 
            "err": "1 or more parameters malformed"
            }), 400