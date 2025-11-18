from flask import Flask, jsonify
import yfinance as yf
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/api/history/<symbol>')
# def get_price(symbol):
#     try:
#         data = yf.download(symbol, period = '1d', progress=False)
#         if data.empty:
#             return jsonify({'error': 'No data found for symbol'}), 404
        
#         latest_price = float(data['Close'].iloc[-1])
#         return jsonify({'symbol': symbol.upper(), 'price': round(latest_price, 2)})
#     except Exception as e:
#         return jsonify({'error': str(e)}), 500
    
def get_history(symbol):
    try:
        # Download 1 year of daily data
        data = yf.download(symbol, period='1y', interval='1d', progress=False)
        if data.empty:
            return jsonify({'error': f'No data found for symbol {symbol.upper()}'}), 404

        # Convert to JSON-friendly list
        result = [
            {'date': date.strftime('%Y-%m-%d'), 'close': round(float(row['Close']), 2)}
            for date, row in data.iterrows()
        ]

        return jsonify({'symbol': symbol.upper(), 'history': result})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
if __name__ == '__main__':
    app.run(debug = True)

