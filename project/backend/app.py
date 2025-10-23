import yfinance as yf
from flask import Flask, request, jsonify


# checks if all args are there, not if they're formatted properly
def validRequest(requestObj: request):
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
    tickers = list(request.args.get('tickers').split(','))
    interval = request.args.get('interval')
    period = request.args.get('period')

    try:
        data = yf.download(tickers, period=period, interval=interval)
        print(data.to_numpy())
        return jsonify({"success": True}), 200
    
    # if an error occurred, likely a parameter is malformed
    except:
        return jsonify({
            "success": False, 
            "err": "1 or more parameters invalid"
            }), 400