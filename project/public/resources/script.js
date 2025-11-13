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
    const response = await fetch(url);

    switch (response.status) {

        case 200: // success case
            const data = await response.json();
            return data;

        case 400: // malformed ticker case
            throw 'Ticker not formatted properly';

        case 500: // server-side problem case
            throw 'Internal Server Error';
    }
}


/* This is sam's work that I'm moving to the js file */
function generateEfficientFrontierData(type) {
    const frontierData = [];
    const individualAssets = [];
    const capitalMarketLine = [];
    const equalWeightLine = [];
    
    //data varies based on selection 
    let baseReturn, baseRisk, riskFreeRate;
    switch(type) {
        case 'large_cap':
            baseReturn = 0.08;
            baseRisk = 0.15;
            riskFreeRate = 0.02;
            break;
        case 'mid_cap':
            baseReturn = 0.10;
            baseRisk = 0.18;
            riskFreeRate = 0.02;
            break;
        case 'small_cap':
            baseReturn = 0.12;
            baseRisk = 0.22;
            riskFreeRate = 0.02;
            break;
        default:
            baseReturn = 0.08;
            baseRisk = 0.15;
            riskFreeRate = 0.02;
    }
    
    //part for generating the efficient frontier curve 
    for (let i = 0; i <= 20; i++) {
        const risk = baseRisk + (i * 0.01);
        const returnVal = baseReturn + 0.4 * Math.pow(risk - baseRisk, 0.7);
        frontierData.push({x: risk, y: returnVal});
    }
    
    //part for generating the capital market line from risk-free rate to optimal portfolio
    const optimalRisk = baseRisk + 0.08;
    const optimalReturn = baseReturn + 0.06;
    
    for (let i = 0; i <= 10; i++) {
        const t = i / 10;
        const risk = t * optimalRisk;
        const returnVal = riskFreeRate + t * (optimalReturn - riskFreeRate);
        capitalMarketLine.push({x: risk, y: returnVal});
    }
    
    //part for the equal weight line
    const equalWeightReturn = baseReturn + 0.02;
    for (let i = 0; i <= 20; i++) {
        const risk = baseRisk + (i * 0.01);
        equalWeightLine.push({x: risk, y: equalWeightReturn});
    }
    
    const stockData = window.allData['graphs']['efficientFrontier'];
    console.log(stockData);
    for (const stock in stockData) {
        const risk = baseRisk + stockData[stock]['risk'];
        const returnVal = baseReturn + stockData[stock]['cagr'];
        individualAssets.push({x: risk, y: returnVal});
    }
    
    //part for the green dot which is the optimal portfolio 
    const optimalPortfolio = {x: optimalRisk, y: optimalReturn};
    
    return { frontierData, individualAssets, optimalPortfolio, capitalMarketLine, equalWeightLine, riskFreeRate };
}


/* This is sam's work that I modified */
function buildMetricsTable(ticker) {

    // referenced cached json from callServer
    const stock = window.allData['stats'][ticker];
    const average = window.allData['stats']['average'];
    const future = window.allData['stats']['expectation'];

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
        'PERatio': function(val) { return val == null ? null : val < 25; },
        'Volatility': function(val) { return val == null ? null : val < 1; },
        'Dividend': function(val) { return val == null ? null : val > 0.5; },
        'EPS': function(val) { return val == null ? null : val > 0.5; },
        'Beta': function(val) { return val == null ? null : val < 1; },
        '52W': function(val) { return val == null ? null : (val['high'] - val['low']) / val['low'] < 0.5; }
    };

    const metricsTable = document.getElementById('metrics-table');
    var tableBody = metricsTable.children[1];
    const rows = Object.keys(stock).map(metric => {

        // all vals are parsed as floats
        const val = stock[metric] == 'N/A' ? null : parsingTable[metric](stock[metric]);
        const avg = average[metric] == 'N/A' ? null : parsingTable[metric](average[metric]);
        const fut = future[metric] == 'N/A' ? null : parsingTable[metric](future[metric]);
        
        // comparison metric
        const isGood = comparisonTable[metric];

        return `
            <tr>
                <td>${metric}</td>
                <td class="${isGood(val) ? 'good-value' : 'bad-value'}">
                ${val == null ? 'N/A' : typeof(val) == typeof({}) ? Object.values(val).join(' - ') : val.toFixed(2)}
                </td>
                <td>${avg == null ? 'N/A' : typeof(avg) == typeof({}) ? Object.values(avg).join(' - ') : avg.toFixed(2)}</td>
                <td>${fut == null ? 'N/A' : typeof(fut) == typeof({}) ? Object.values(fut).join(' - ') : fut.toFixed(2)}</td>
            </tr>
        `;
    }).join('');

    // updates the DOM once instead of multiple updates in a for loop
    tableBody.innerHTML = rows;
    document.querySelectorAll('.card-title')[0].textContent = `${ticker} Metrics`;
}

//portion for initalizing the data table 
document.addEventListener('DOMContentLoaded', () => {

    var tickerArray = [];
    document.querySelectorAll('#stock-select option').forEach(child => {
        const ticker = child.textContent.split('(')[1].split(')')[0];
        tickerArray.push(ticker);
    });

    callServer(tickerArray)
    .then(data => {
        
        console.log(data);
        // cache data in a global json
        window.allData = data;
        
        // by default builds a table from the first stock in the requested data
        buildMetricsTable(Object.keys(data['stats'])[0]);

        const { frontierData, individualAssets, optimalPortfolio, capitalMarketLine, equalWeightLine, riskFreeRate } = generateEfficientFrontierData('large_cap');
        const frontierCtx = document.getElementById('frontier-chart').getContext('2d');
        const frontierChart = new Chart(frontierCtx, {
            type: 'scatter',
            data: {
                datasets: [
                    {
                        label: 'Capital Market Line',
                        data: capitalMarketLine,
                        borderColor: '#9C27B0',
                        backgroundColor: 'rgba(156, 39, 176, 0.1)',
                        borderWidth: 2,
                        showLine: true,
                        fill: false,
                        pointRadius: 0,
                        borderDash: [5, 5]
                    },
                    {
                        label: 'Equal Weight Portfolio',
                        data: equalWeightLine,
                        borderColor: '#2196F3',
                        backgroundColor: 'rgba(33, 150, 243, 0.1)',
                        borderWidth: 1,
                        showLine: true,
                        fill: false,
                        pointRadius: 0,
                        borderDash: [2, 2]
                    },
                    {
                        label: 'Efficient Frontier',
                        data: frontierData,
                        borderColor: '#edd39a',
                        backgroundColor: 'rgba(237, 211, 154, 0.1)',
                        borderWidth: 3,
                        showLine: true,
                        fill: false,
                        pointRadius: 0,
                        tension: 0.2
                    },
                    {
                        label: 'Optimal Portfolio',
                        data: [optimalPortfolio],
                        backgroundColor: '#4caf50',
                        borderColor: '#4caf50',
                        pointRadius: 8,
                        pointHoverRadius: 10
                    },
                    {
                        label: 'Individual Assets',
                        data: individualAssets,
                        backgroundColor: '#f44336',
                        borderColor: '#f44336',
                        pointRadius: 5,
                        pointHoverRadius: 7
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        title: {
                            display: true,
                            text: 'Risk (Standard Deviation)',
                            color: '#ddd'
                        },
                        ticks: {
                            color: '#ddd',
                            callback: function(value) {
                                return (value * 100).toFixed(0) + '%';
                            }
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        min: 0.1,
                        max: 0.35
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Expected Return',
                            color: '#ddd'
                        },
                        ticks: {
                            color: '#ddd',
                            callback: function(value) {
                                return (value * 100).toFixed(0) + '%';
                            }
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        min: 0.0,
                        max: 0.2
                    }
                },
                plugins: {
                    legend: {
                        display: false,
                        labels: {
                            color: '#ddd'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const point = context.raw;
                                const datasetLabel = context.dataset.label || '';
                                
                                if (datasetLabel === 'Efficient Frontier') {
                                    return `Frontier: ${(point.y * 100).toFixed(1)}% return, ${(point.x * 100).toFixed(1)}% risk`;
                                } else if (datasetLabel === 'Optimal Portfolio') {
                                    return `Optimal: ${(point.y * 100).toFixed(1)}% return, ${(point.x * 100).toFixed(1)}% risk`;
                                } else if (datasetLabel === 'Capital Market Line') {
                                    return `CML: ${(point.y * 100).toFixed(1)}% return, ${(point.x * 100).toFixed(1)}% risk`;
                                } else if (datasetLabel === 'Equal Weight Portfolio') {
                                    return `Equal Weight: ${(point.y * 100).toFixed(1)}% return`;
                                } else {
                                    return `Asset: ${(point.y * 100).toFixed(1)}% return, ${(point.x * 100).toFixed(1)}% risk`;
                                }
                            }
                        }
                    }
                }
            }
        });


        //updates the frontier when selection (caps) is changed 
        document.getElementById('frontier-select').addEventListener('change', function() {
            const newData = generateEfficientFrontierData(this.value);
            
            frontierChart.data.datasets[0].data = newData.capitalMarketLine;
            frontierChart.data.datasets[1].data = newData.equalWeightLine;
            frontierChart.data.datasets[2].data = newData.frontierData;
            frontierChart.data.datasets[3].data = [newData.optimalPortfolio];
            frontierChart.data.datasets[4].data = newData.individualAssets;
            
            frontierChart.update();
        });

        //updates the table when stock selection changed
        document.getElementById('stock-select').addEventListener('change', function() {
            buildMetricsTable(this.value)
        });
    })
    .catch(error => {
        // handle an error here
        console.log(error);
    });
    
    //refreshes the ticker data every 60 seconds, might want it more spread out to avoid wasting all API calls within like 2 minutes
    setInterval(() => {
        // idk if we need anything to be real-time, but if it does, update it here
    }, 60000);
});