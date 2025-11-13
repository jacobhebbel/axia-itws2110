const PROTOCOL = 'http://';
const SERVER = 'localhost:3000';
const ENDPOINT = 'api/data';

async function callServer(tickers) {

    const query = new URLSearchParams({
        'tickers': tickers.join(','),
        'period': '10y',
        'interval': '1d'
    });

    const url = `${PROTOCOL}${SERVER}/${ENDPOINT}?${query}`;
    const response = await axios.get(url);

    switch (response.status) {

        case 200: // success case
            return response.data;

        case 400: // malformed ticker case
            throw 'Ticker not formatted properly';

        case 500: // server-side problem case
            throw 'Internal Server Error';
    }
}

function buildMetricsTable(ticker) {

    // referenced cached json from callServer
    const stock = window.allData['metrics'][ticker];
    const average = window.allData['metrics']['averages'];
    const future = window.allData['metrics']['expectations'];

    // parses a value
    const parsingTable = {
        'PERatio': function(val) { return parseFloat(val); },
        'Volatility': function(val) { return parseFloat(val); },
        'Dividend': function(val) { return parseFloat(val); },
        'EPS': function(val) { return parseFloat(val); },
        'Beta': function(val) { return parseFloat(val); },
        '52W': function(val) { return { 'high': parseFloat(val['high']), 'low': parseFloat(val['low']) }; }
    };

    // provides the equation if a value is good
    const comparisonTable = {
        'PERatio': function(val) { return val < 25; },
        'Volatility': function(val) { return val < 1; },
        'Dividend': function(val) { return val > 0.5; },
        'EPS': function(val) { return val > 0.5; },
        'Beta': function(val) { return val < 1; },
        '52W': function(val) { return (val['high'] - val['low']) / val['low'] < 0.5; }
    };

    const metricsTable = document.getElementById('metrics-table');
    var tableBody = metricsTable.children()[1];
    const rows = Object.keys(stock).map(metric => {
        
        // all vals are parsed as floats
        const val = parsingTable[metric](stock[metric]);
        const avg = parsingTable[metric](average[metric]);
        const fut = parsingTable[metric](future[metric]);
        
        // comparison metric
        const isGood = comparisonTable[metric];

        return `
            <tr>
                <td>${metric}</td>
                <td class="${isGood(val) ? 'good-value' : 'bad-value'}">${val || 'N/A'}</td>
                <td>${avg.toFixed(2) || 'N/A'}</td>
                <td>${fut.toFixed(2) || 'N/A'}</td>
            </tr>
        `;
    }).join('');

    // updates the DOM once instead of multiple updates in a for loop
    tableBody.innerHTML = rows;
    document.querySelectorAll('.card-title')[0].textContent = `${ticker} Metrics`;
}

// example usage when user changes the stock
document.addEventListener('DOMContentLoaded', () => {
    
    var tickerArray = [];
    document.getElementById('stock-select').children().forEach(child => {
        const ticker = child.textContent.split('(')[1].split(')')[0];
        tickerArray.push(ticker);
    });

    callServer(tickerArray)
    .then(data => {
        window.allData = data;
        
        // by default builds a table from the first stock in the requested data
        buildMetricsTable(Object.keys(data['metrics'])[0]);
        buildGraphs();
    })
    .catch(error => {
        // handle an error here
    });


});

// if you have a dropdown or input for changing stocks:
document.getElementById('stock-selector')?.addEventListener('change', (e) => {
    buildMetricsTable(e.target.value);
});