const PROTOCOL = 'http://';
const SERVER = '3.21.35.21:3000';
const ENDPOINT = '/api/data';

const charts = {
    '1': { 
        frontier: null,
        riskBar: null,
        mctrPie: null
    },
    '2': { 
        frontier: null,
        riskBar: null,
        mctrPie: null
    }
};

let allDataCache = null;

let frontierCache = {
    points: [], 
    stocks: new Set() 
};

const frontierColors = [
    '#FF6B6B', '#4ECDC4', '#FFD166', '#06D6A0', '#118AB2', 
    '#EF476F', '#073B4C', '#7209B7', '#F15BB5', '#00BBF9',
    '#9B5DE5', '#F72585', '#3A0CA3', '#4361EE', '#4CC9F0',
    '#560BAD', '#B5179E', '#4895EF', '#3F37C9', '#7209B7'
];

async function callServer(tickers) {
    const query = new URLSearchParams({
        'tickers': tickers.join(',')
    });

    const url = `${ENDPOINT}?${query}`;
    const response = await fetch(url);

    switch (response.status) {
        case 200:
            const data = await response.json();
            return data;
        case 400:
            throw new Error('Ticker not formatted properly');
        case 500:
            throw new Error('Internal Server Error');
        default:
            throw new Error(`HTTP Error: ${response.status}`);
    }
}

function isValidTicker(ticker) {
    return /^[A-Z]{1,5}$/.test(ticker.toUpperCase());
}

Chart.defaults.animation = {
    duration: 1200,
    easing: 'easeOutQuart'
};

Chart.defaults.animations = {
    numbers: { duration: 1200 },
    colors: { duration: 1200 },
    x: { duration: 1200 },
    y: { duration: 1200 }
};

function addTickerToSelectors(ticker, name = null) {
    const tickerUpper = ticker.toUpperCase();
    const displayName = name ? `${name} (${tickerUpper})` : tickerUpper;
    
    for (let cardNum = 1; cardNum <= 2; cardNum++) {
        const select = document.getElementById(`stock-select-${cardNum}`);
      
        let exists = false;
        for (let i = 0; i < select.options.length; i++) {
            if (select.options[i].value === tickerUpper) {
                exists = true;
                break;
            }
        }
        
        if (!exists) {
            const option = new Option(displayName, tickerUpper);
            select.add(option);
        }
    }
    
    return true;
}

function addTickerToFrontierCache(ticker, data = null) {
    const tickerUpper = ticker.toUpperCase();

    if (frontierCache.stocks.has(tickerUpper)) {
        return false; 
    }
    frontierCache.stocks.add(tickerUpper);
 
    let pointData;
    if (data && data.risk !== undefined && data.cagr !== undefined) {
        pointData = {
            x: parseFloat(data.risk),
            y: parseFloat(data.cagr),
            ticker: tickerUpper,
            label: tickerUpper,
            color: frontierColors[frontierCache.stocks.size % frontierColors.length]
        };
    } else {
        const baseRisk = 0.15 + (Math.random() * 0.15);
        const baseReturn = 0.08 + (Math.random() * 0.08);
        
        pointData = {
            x: baseRisk,
            y: baseReturn,
            ticker: tickerUpper,
            label: tickerUpper,
            color: frontierColors[frontierCache.stocks.size % frontierColors.length]
        };
    }
    
    frontierCache.points.push(pointData);
    saveFrontierCacheToStorage();
    
    return true;
}

function removeTickerFromFrontierCache(ticker) {
    const tickerUpper = ticker.toUpperCase();
    frontierCache.stocks.delete(tickerUpper);
    frontierCache.points = frontierCache.points.filter(point => 
        point.ticker !== tickerUpper
    );
    saveFrontierCacheToStorage();
}

function saveFrontierCacheToStorage() {
    try {
        sessionStorage.setItem('frontierCache', JSON.stringify({
            points: frontierCache.points,
            stocks: Array.from(frontierCache.stocks)
        }));
    } catch (e) {
        console.error('Error saving frontier cache to storage:', e);
    }
}

function loadFrontierCacheFromStorage() {
    try {
        const stored = sessionStorage.getItem('frontierCache');
        if (stored) {
            const parsed = JSON.parse(stored);
            frontierCache.points = parsed.points || [];
            frontierCache.stocks = new Set(parsed.stocks || []);
        }
    } catch (e) {
        console.error('Error loading frontier cache from storage:', e);
        frontierCache = {
            points: [],
            stocks: new Set()
        };
    }
}

function clearFrontierCache() {
    frontierCache = {
        points: [],
        stocks: new Set()
    };
    saveFrontierCacheToStorage();
}

function getFrontierPointsForChart() {
    return frontierCache.points.map(point => ({
        x: point.x,
        y: point.y,
        label: point.label || point.ticker
    }));
}

async function handleTickerSearch(cardNum) {
    const searchInput = document.getElementById(`ticker-search-${cardNum}`);
    const searchButton = document.getElementById(`search-button-${cardNum}`);
    const ticker = searchInput.value.trim().toUpperCase();
    
    if (!ticker) {
        showNotification('Please enter a ticker symbol', 'error');
        return;
    }
    
    if (!isValidTicker(ticker)) {
        showNotification('Please enter a valid ticker symbol (1-5 uppercase letters)', 'error');
        return;
    }
    
    searchButton.disabled = true;
    searchButton.textContent = 'Loading...';
    
    try {
        const data = await callServer([ticker]);
        
        if (!data.stats || !data.stats[ticker]) {
            throw new Error('No data available for this ticker');
        }
        
        if (!allDataCache) {
            allDataCache = data;
        } else {
            allDataCache.stats = { ...allDataCache.stats, [ticker]: data.stats[ticker] };
            if (data.graphs) {
                allDataCache.graphs = { ...allDataCache.graphs, ...data.graphs };
            }
            if (data.names) {
                allDataCache.names = { ...allDataCache.names, ...data.names };
            }
        }
        
        const companyName = data.names && data.names[ticker] ? data.names[ticker] : null;
        addTickerToSelectors(ticker, companyName);
        
        if (data.graphs && data.graphs.efficientFrontier && data.graphs.efficientFrontier[ticker]) {
            const frontierData = data.graphs.efficientFrontier[ticker];
            addTickerToFrontierCache(ticker, frontierData);
            
            const chartType = document.getElementById(`chart-type-${cardNum}`).value;
            if (chartType === 'efficient-frontier') {
                const capType = document.getElementById(`cap-select-${cardNum}`).value;
                updateEfficientFrontierChart(cardNum, capType);
            }
        }
        
        updateCardDisplay(cardNum, ticker);
        
        searchInput.value = '';
        showNotification(`Added ${ticker} to the list!`, 'success');
        
    } catch (error) {
        console.error('Error adding ticker:', error);
        showNotification(`Could not add ${ticker}: ${error.message}`, 'error');
    } finally {
        searchButton.disabled = false;
        searchButton.textContent = 'Add';
    }
}

function updateCardDisplay(cardNum, ticker = null) {
    const chartType = document.getElementById(`chart-type-${cardNum}`).value;
    
    if (!ticker) {
        ticker = document.getElementById(`stock-select-${cardNum}`).value;
    }
    
    document.getElementById(`data-table-${cardNum}`).classList.add('hidden');
    document.getElementById(`efficient-frontier-${cardNum}`).classList.add('hidden');
    document.getElementById(`risk-bar-${cardNum}`).classList.add('hidden');
    document.getElementById(`mctr-pie-${cardNum}`).classList.add('hidden');
    document.getElementById(`frontier-legend-${cardNum}`).classList.add('hidden');
    
    document.getElementById(`stock-selector-${cardNum}`).classList.remove('hidden');
    document.getElementById(`cap-selector-${cardNum}`).classList.add('hidden');
    
    document.querySelectorAll('.card-title')[cardNum - 1].textContent = 
        chartType === 'efficient-frontier' ? 'CRSP Efficient Frontier' : `${ticker} Metrics`;
    
    switch(chartType) {
        case 'data-table':
            document.getElementById(`data-table-${cardNum}`).classList.remove('hidden');
            buildMetricsTable(cardNum, ticker);
            break;
            
        case 'efficient-frontier':
            document.getElementById(`efficient-frontier-${cardNum}`).classList.remove('hidden');
            document.getElementById(`frontier-legend-${cardNum}`).classList.remove('hidden');
            document.getElementById(`stock-selector-${cardNum}`).classList.add('hidden');
            document.getElementById(`cap-selector-${cardNum}`).classList.remove('hidden');
            
            const capType = document.getElementById(`cap-select-${cardNum}`).value;
            if (!charts[cardNum].frontier) {
                charts[cardNum].frontier = createEfficientFrontierChart(cardNum, capType);
            } else {
                updateEfficientFrontierChart(cardNum, capType);
            }
            break;
            
        case 'risk-bar':
            document.getElementById(`risk-bar-${cardNum}`).classList.remove('hidden');
            if (!charts[cardNum].riskBar) {
                charts[cardNum].riskBar = createRiskBarChart(cardNum, ticker);
            } else {
                updateRiskBarChart(cardNum, ticker);
            }
            break;
            
        case 'mctr-pie':
            document.getElementById(`mctr-pie-${cardNum}`).classList.remove('hidden');
            if (!charts[cardNum].mctrPie) {
                charts[cardNum].mctrPie = createMctrPieChart(cardNum, ticker);
            } else {
                updateMctrPieChart(cardNum, ticker);
            }
            break;
    }
}

function buildMetricsTable(cardNum, ticker) {
    if (!allDataCache || !allDataCache.stats || !allDataCache.stats[ticker]) {
        console.error(`No data available for ticker: ${ticker}`);
        return;
    }
    
    const stock = allDataCache.stats[ticker];
    const average = allDataCache.stats.marketAverages || {};
    
    const parsingTable = {
        'PERatio': function(val) { return parseFloat(val); },
        'Volatility': function(val) { return parseFloat(val); },
        'Dividend': function(val) { return parseFloat(val); },
        'EPS': function(val) { return parseFloat(val); },
        'Beta': function(val) { return parseFloat(val); },
        '52W': function(val) { 
            if (typeof val === 'object' && val !== null) {
                return { 'high': parseFloat(val.high) || 0, 'low': parseFloat(val.low) || 0 };
            }
            return { 'high': 0, 'low': 0 };
        }
    };
    
    const comparisonTable = {
        'PERatio': function(val) { return val == null ? null : val < 25; },
        'Volatility': function(val) { return val == null ? null : val < 1; },
        'Dividend': function(val) { return val == null ? null : val > 0.5; },
        'EPS': function(val) { return val == null ? null : val > 0.5; },
        'Beta': function(val) { return val == null ? null : val < 1; },
        '52W': function(val) { return val == null ? null : (val.high - val.low) / val.low < 0.5; }
    };
    
    const metricsTable = document.getElementById(`metrics-table-${cardNum}`);
    if (!metricsTable) return;
    
    const tableBody = metricsTable.children[1];
    const metrics = ['PERatio', 'Volatility', 'Dividend', 'EPS', 'Beta', '52W'];
    
    const rows = metrics.map(metric => {
        const val = stock[metric] == 'N/A' || !stock[metric] ? null : parsingTable[metric](stock[metric]);
        const avg = average[metric] == 'N/A' || !average[metric] ? null : parsingTable[metric](average[metric]);
        
        const isGood = comparisonTable[metric];
        const valueClass = isGood(val) ? 'good-value' : 'bad-value';
        
        let valDisplay = 'N/A';
        let avgDisplay = 'N/A';
        
        if (val !== null && val !== undefined) {
            valDisplay = typeof val === 'object' ? `${val.high.toFixed(2)} - ${val.low.toFixed(2)}` : val.toFixed(2);
        }
        if (avg !== null && avg !== undefined) {
            avgDisplay = typeof avg === 'object' ? `${avg.high.toFixed(2)} - ${avg.low.toFixed(2)}` : avg.toFixed(2);
        }
        
        return `
            <tr>
                <td>${metric}</td>
                <td class="${valueClass}">${valDisplay}</td>
                <td>${avgDisplay}</td>
            </tr>
        `;
    }).join('');
    
    tableBody.innerHTML = rows;
   
    setTimeout(() => {
        const rows = tableBody.querySelectorAll('tr');
        rows.forEach((row, index) => {
            row.style.opacity = '0';
            row.style.transform = 'translateY(10px)';
            row.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            
            setTimeout(() => {
                row.style.opacity = '1';
                row.style.transform = 'translateY(0)';
            }, index * 50);
        });
    }, 100);
}

function createEfficientFrontierChart(cardNum, capType) {
    const canvasId = `frontier-chart-${cardNum}`;
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    const { frontierData, individualAssets, optimalPortfolio, capitalMarketLine, equalWeightLine } = generateEfficientFrontierData(capType);
    
    const cachedPointsDataset = {
        label: 'Cached Stocks',
        data: getFrontierPointsForChart(),
        backgroundColor: frontierCache.points.map(point => point.color),
        borderColor: frontierCache.points.map(point => point.color),
        pointRadius: 7,
        pointHoverRadius: 9,
        pointStyle: 'circle'
    };
    
    return new Chart(ctx, {
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
                },
                cachedPointsDataset 
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 1500,
                easing: 'easeOutCubic'
            },
            transitions: {
                active: {
                    animation: {
                        duration: 1500
                    }
                }
            },

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
                    display: false
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
                            } else if (datasetLabel === 'Cached Stocks') {
                                return `${point.label || 'Stock'}: ${(point.y * 100).toFixed(1)}% return, ${(point.x * 100).toFixed(1)}% risk`;
                            } else {
                                return `Asset: ${(point.y * 100).toFixed(1)}% return, ${(point.x * 100).toFixed(1)}% risk`;
                            }
                        }
                    }
                }
            }
        }
    });
}

function generateEfficientFrontierData(type) {
    const frontierData = [];
    const individualAssets = [];
    const capitalMarketLine = [];
    const equalWeightLine = [];
    
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
    
    for (let i = 0; i <= 20; i++) {
        const risk = baseRisk + (i * 0.01);
        const returnVal = baseReturn + 0.4 * Math.pow(risk - baseRisk, 0.7);
        frontierData.push({x: risk, y: returnVal});
    }
    
    const optimalRisk = baseRisk + 0.08;
    const optimalReturn = baseReturn + 0.06;
    
    for (let i = 0; i <= 10; i++) {
        const t = i / 10;
        const risk = t * optimalRisk;
        const returnVal = riskFreeRate + t * (optimalReturn - riskFreeRate);
        capitalMarketLine.push({x: risk, y: returnVal});
    }
    
    const equalWeightReturn = baseReturn + 0.02;
    for (let i = 0; i <= 20; i++) {
        const risk = baseRisk + (i * 0.01);
        equalWeightLine.push({x: risk, y: equalWeightReturn});
    }
    
    let allStocks = new Set();
    const stockData = {};
    
    if (allDataCache && allDataCache.graphs && allDataCache.graphs.efficientFrontier) {
        const effFrontier = allDataCache.graphs.efficientFrontier;
        Object.keys(effFrontier).forEach(stock => {
            allStocks.add(stock);
            stockData[stock] = effFrontier[stock];
        });
    }
    
    frontierCache.stocks.forEach(stock => {
        if (!allStocks.has(stock) && stock.trim() !== '') {
            allStocks.add(stock);
            const cachedPoint = frontierCache.points.find(p => p.ticker === stock);
            if (cachedPoint) {
                stockData[stock] = {
                    risk: cachedPoint.x,
                    cagr: cachedPoint.y
                };
            }
        }
    });
    
    const stocks = Array.from(allStocks);
    if (stocks.length > 0) {
        const risks = [];
        const returns = [];
        
        stocks.forEach(stock => {
            const data = stockData[stock];
            if (data && data.risk !== undefined && data.cagr !== undefined) {
                risks.push(parseFloat(data.risk));
                returns.push(parseFloat(data.cagr));
            }
        });
        
        if (risks.length > 0 && returns.length > 0) {
            const minRisk = Math.min(...risks);
            const maxRisk = Math.max(...risks);
            const minReturn = Math.min(...returns);
            const maxReturn = Math.max(...returns);
            
            function scaleRisk(risk) {
                return 0.1 + ((risk - minRisk) / (maxRisk - minRisk)) * 0.25;
            }
            
            function scaleReturn(returnVal) {
                return 0.0 + ((returnVal - minReturn) / (maxReturn - minReturn)) * 0.2;
            }
            
            stocks.forEach((stock, index) => {
                const data = stockData[stock];
                if (data && data.risk !== undefined && data.cagr !== undefined) {
                    if (frontierCache.stocks.has(stock)) {
                        return;
                    }
                    
                    const risk = scaleRisk(parseFloat(data.risk));
                    const returnVal = scaleReturn(parseFloat(data.cagr));
                    
                    const jitterRisk = risk + (Math.random() * 0.02 - 0.01);
                    const jitterReturn = returnVal + (Math.random() * 0.01 - 0.005);
                    
                    individualAssets.push({
                        x: Math.max(0.1, Math.min(0.35, jitterRisk)),
                        y: Math.max(0.0, Math.min(0.2, jitterReturn)),
                        label: stock
                    });
                }
            });
        }
    }
    
    if (individualAssets.length === 0 && stocks.length === 0) {
        for (let i = 0; i < 8; i++) {
            const risk = 0.15 + (Math.random() * 0.15);
            const returnVal = 0.08 + (Math.random() * 0.08);
            individualAssets.push({
                x: risk,
                y: returnVal,
                label: `Stock ${i + 1}`
            });
        }
    }
    
    const optimalPortfolio = {x: optimalRisk, y: optimalReturn};
    
    return { frontierData, individualAssets, optimalPortfolio, capitalMarketLine, equalWeightLine, riskFreeRate };
}

function updateEfficientFrontierChart(cardNum, capType) {
    if (charts[cardNum].frontier) {
        charts[cardNum].frontier.destroy();
        charts[cardNum].frontier = createEfficientFrontierChart(cardNum, capType);
        updateFrontierLegend(cardNum);
    }
}

function updateFrontierLegend(cardNum) {
    const legendContainer = document.getElementById(`frontier-legend-${cardNum}`);
    if (!legendContainer) return;
    
    let legendHTML = '<div class="legend-title">Cached Stocks:</div>';
    
    if (frontierCache.points.length === 0) {
        legendHTML += '<div class="legend-empty">No stocks cached yet</div>';
    } else {
        frontierCache.points.forEach(point => {
            legendHTML += `
                <div class="legend-item">
                    <span class="legend-color" style="background-color: ${point.color}"></span>
                    <span class="legend-label">${point.label || point.ticker}</span>
                    <button class="legend-remove" data-ticker="${point.ticker}" title="Remove from cache">
                        ×
                    </button>
                </div>
            `;
        });
        
        legendHTML += `
            <div class="legend-actions">
                <button class="legend-clear-all" id="clear-cache-${cardNum}">
                    Clear All Cached Stocks
                </button>
            </div>
        `;
    }
    
    legendContainer.innerHTML = legendHTML;
    
    legendContainer.querySelectorAll('.legend-remove').forEach(button => {
        button.addEventListener('click', function() {
            const ticker = this.getAttribute('data-ticker');
            removeTickerFromFrontierCache(ticker);
            
            const capType = document.getElementById(`cap-select-${cardNum}`).value;
            updateEfficientFrontierChart(cardNum, capType);
            
            showNotification(`Removed ${ticker} from frontier cache`, 'info');
        });
    });
    
    const clearButton = document.getElementById(`clear-cache-${cardNum}`);
    if (clearButton) {
        clearButton.addEventListener('click', function() {
            clearFrontierCache();
            
            const capType = document.getElementById(`cap-select-${cardNum}`).value;
            updateEfficientFrontierChart(cardNum, capType);
            
            showNotification('Cleared all cached stocks', 'info');
        });
    }
}

function createRiskBarChart(cardNum, ticker) {
    const canvasId = `risk-bar-chart-${cardNum}`;
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    const stockData = allDataCache?.stats?.[ticker];
    
    let volatility = 25; 
    
    if (stockData && stockData['52W']) {
        const week52 = stockData['52W'];
        const high = parseFloat(week52.high) || 0;
        const low = parseFloat(week52.low) || 0;
        
        if (high > 0 && low > 0) {
            const currentPrice = (high + low) / 2;
            const rangePercentage = ((high - low) / currentPrice) * 100;
            volatility = Math.min(50, Math.max(10, parseFloat(rangePercentage.toFixed(1))));
        }
    }
    
    if (stockData && stockData.Volatility && stockData.Volatility !== 'N/A') {
        const directVolatility = parseFloat(stockData.Volatility);
        if (!isNaN(directVolatility)) {
            volatility = Math.min(50, Math.max(10, parseFloat((directVolatility * 100).toFixed(1))));
        }
    }
    
    let marketVolatility = 15; 
    const marketAverages = allDataCache?.stats?.marketAverages;
    if (marketAverages && marketAverages.Volatility && marketAverages.Volatility !== 'N/A') {
        const marketVol = parseFloat(marketAverages.Volatility);
        if (!isNaN(marketVol)) {
            marketVolatility = Math.min(30, Math.max(10, parseFloat((marketVol * 100).toFixed(1))));
        }
    }
    
    let showDetailedRisk = false;
    let detailedLabels = [ticker, 'Market Average'];
    let detailedData = [volatility, marketVolatility];
    
    if (allDataCache && allDataCache.graphs && allDataCache.graphs.mctr) {
        const mctrData = allDataCache.graphs.mctr;

        if (mctrData[ticker] && typeof mctrData[ticker] === 'object') {
            const entries = Object.entries(mctrData[ticker])
                .sort((a, b) => (parseFloat(b[1]) || 0) - (parseFloat(a[1]) || 0))
                .slice(0, 5);
            
            if (entries.length > 0) {
                showDetailedRisk = true;
                detailedLabels = entries.map(entry => entry[0]);
                detailedData = entries.map(entry => parseFloat(entry[1]) || 0);
                
                const total = detailedData.reduce((sum, val) => sum + val, 0);
                if (total > 0 && Math.abs(total - 100) > 5) {
                    detailedData = detailedData.map(val => (val / total) * 100);
                }
            }
        }
    }
    
    const colors = showDetailedRisk ? 
        generateColors(detailedLabels.length) : 
        ['#2196F3', '#9C27B0'];
    
    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: detailedLabels,
            datasets: [{
                label: 'Total Risk Contribution (%)',
                data: detailedData,
                backgroundColor: colors,
                borderColor: colors.map(color => color.replace('0.8', '1')),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                animateScale: true,
                duration: 1200
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            return `${label}: ${value.toFixed(1)}%`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'category',
                    position: 'bottom',
                    ticks: {
                        color: '#ddd'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Risk Contribution (%)',
                        color: '#ddd'
                    },
                    ticks: {
                        color: '#ddd',
                        callback: function(value) {
                            return value + '%';
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            }
        }
    });
}

function createMctrPieChart(cardNum, ticker) {
    const canvasId = `mctr-pie-chart-${cardNum}`;
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    let pieData = [];
    let labels = [];
    
    if (allDataCache && allDataCache.graphs && allDataCache.graphs.mctr) {
        const mctrData = allDataCache.graphs.mctr;
        
        if (mctrData[ticker] && typeof mctrData[ticker] === 'object') {
            const entries = Object.entries(mctrData[ticker])
                .sort((a, b) => (parseFloat(b[1]) || 0) - (parseFloat(a[1]) || 0))
                .slice(0, 6);
            
            labels = entries.map(entry => entry[0]);
            pieData = entries.map(entry => parseFloat(entry[1]) || 0);
            
            const total = pieData.reduce((sum, val) => sum + val, 0);
            if (total > 0) {
                pieData = pieData.map(val => (val / total) * 100);
            }
        } else {
            return createSampleMctrPieChart(ctx, ticker);
        }
    } else {
        return createSampleMctrPieChart(ctx, ticker);
    }
    
    const colors = generateColors(labels.length);
    
    return new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: pieData,
                backgroundColor: colors,
                borderColor: '#222',
                borderWidth: 2
            }]
        },
        options: getChartOptions('pie')
    });
}

function createSampleRiskBarChart(ctx, ticker) {
    const stockData = allDataCache?.stats?.[ticker];
    let riskValue = 30;
    
    if (stockData) {
        const volatility = parseFloat(stockData.Volatility) || 0;
        riskValue = Math.min(50, Math.max(15, volatility * 25));
    }
    
    const marketRisk = 15;
    
    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [ticker, 'Market Average'],
            datasets: [{
                label: 'Total Risk Contribution (%)',
                data: [riskValue, marketRisk],
                backgroundColor: ['#2196F3', '#9C27B0'],
                borderColor: ['#2196F3', '#9C27B0'],
                borderWidth: 1
            }]
        },
        options: getChartOptions('bar')
    });
}

function createSampleMctrPieChart(ctx, ticker) {
    const stockData = allDataCache?.stats?.[ticker];
    let mctrValue = 35;
    
    if (stockData) {
        const beta = parseFloat(stockData.Beta) || 1.0;
        mctrValue = Math.min(60, Math.max(20, beta * 30));
    }
    
    const remaining = 100 - mctrValue;
    
    return new Chart(ctx, {
        type: 'pie',
        data: {
            labels: [`${ticker} MCTR`, 'Portfolio Residual'],
            datasets: [{
                data: [mctrValue, remaining],
                backgroundColor: ['#edd39a', '#4caf50'],
                borderColor: ['#edd39a', '#4caf50'],
                borderWidth: 2
            }]
        },
        options: getChartOptions('pie')
    });
}

function updateRiskBarChart(cardNum, ticker) {
    if (charts[cardNum].riskBar) {
        charts[cardNum].riskBar.destroy();
    }
    charts[cardNum].riskBar = createRiskBarChart(cardNum, ticker);
}

function updateMctrPieChart(cardNum, ticker) {
    if (charts[cardNum].mctrPie) {
        charts[cardNum].mctrPie.destroy();
    }
    charts[cardNum].mctrPie = createMctrPieChart(cardNum, ticker);
}

function generateColors(count) {
    const baseColors = [
        'rgba(255, 99, 132, 0.8)', 'rgba(54, 162, 235, 0.8)', 'rgba(255, 206, 86, 0.8)',
        'rgba(75, 192, 192, 0.8)', 'rgba(153, 102, 255, 0.8)', 'rgba(255, 159, 64, 0.8)',
        'rgba(199, 199, 199, 0.8)', 'rgba(83, 102, 255, 0.8)', 'rgba(40, 159, 64, 0.8)'
    ];
    
    if (count <= baseColors.length) return baseColors.slice(0, count);
    
    const colors = [...baseColors];
    for (let i = baseColors.length; i < count; i++) {
        const hue = (i * 137.508) % 360;
        colors.push(`hsla(${hue}, 70%, 60%, 0.8)`);
    }
    
    return colors;
}

function getChartOptions(type) {
    const baseOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: { color: '#ddd' }
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        const label = context.label || '';
                        const value = context.raw || 0;
                        return `${label}: ${value.toFixed(2)}%`;
                    }
                }
            }
        }
    };
    
    if (type === 'bar') {
        return {
            ...baseOptions,
            plugins: {
                ...baseOptions.plugins,
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Risk Contribution (%)',
                        color: '#ddd'
                    },
                    ticks: {
                        color: '#ddd',
                        callback: function(value) {
                            return value + '%';
                        }
                    },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Assets',
                        color: '#ddd'
                    },
                    ticks: { color: '#ddd' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                }
            }
        };
    } else if (type === 'pie') {
        return {
            ...baseOptions,
            plugins: {
                ...baseOptions.plugins,
                legend: {
                    position: 'right',
                    labels: {
                        color: '#ddd',
                        font: { size: 12 }
                    }
                },
                tooltip: {
                    callbacks: {
                        ...baseOptions.plugins.tooltip.callbacks,
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                            return `${label}: ${value.toFixed(2)}% (${percentage}%)`;
                        }
                    }
                }
            }
        };
    }
    
    return baseOptions;
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 24px;
        border-radius: 4px;
        color: white;
        font-weight: 500;
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    
    const colors = {
        'info': '#2196F3',
        'success': '#4CAF50',
        'error': '#F44336',
        'warning': '#FF9800'
    };
    notification.style.backgroundColor = colors[type] || colors.info;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

document.addEventListener('DOMContentLoaded', () => {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        .hidden {
            display: none !important;
        }
        .frontier-legend {
            background: rgba(30, 30, 40, 0.8);
            border-radius: 8px;
            padding: 15px;
            margin-top: 15px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            max-height: 300px;
            overflow-y: auto;
        }
        .legend-title {
            font-weight: bold;
            margin-bottom: 10px;
            color: #edd39a;
            font-size: 14px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            padding-bottom: 5px;
        }
        .legend-item {
            display: flex;
            align-items: center;
            margin: 5px 0;
            padding: 5px;
            border-radius: 4px;
            transition: background-color 0.2s;
        }
        .legend-item:hover {
            background-color: rgba(255, 255, 255, 0.05);
        }
        .legend-color {
            display: inline-block;
            width: 15px;
            height: 15px;
            border-radius: 50%;
            margin-right: 10px;
            border: 2px solid rgba(255, 255, 255, 0.3);
        }
        .legend-label {
            flex-grow: 1;
            color: #ddd;
            font-size: 13px;
        }
        .legend-remove {
            background: rgba(244, 67, 54, 0.2);
            color: #f44336;
            border: none;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            cursor: pointer;
            font-size: 16px;
            line-height: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background-color 0.2s;
        }
        .legend-remove:hover {
            background: rgba(244, 67, 54, 0.4);
        }
        .legend-empty {
            color: #888;
            font-style: italic;
            text-align: center;
            padding: 10px;
        }
        .legend-actions {
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        .legend-clear-all {
            background: rgba(244, 67, 54, 0.1);
            color: #f44336;
            border: 1px solid rgba(244, 67, 54, 0.3);
            border-radius: 4px;
            padding: 5px 10px;
            cursor: pointer;
            font-size: 12px;
            width: 100%;
            transition: background-color 0.2s;
        }
        .legend-clear-all:hover {
            background: rgba(244, 67, 54, 0.2);
        }
    `;
    document.head.appendChild(style);

    loadFrontierCacheFromStorage();
    
    const initialTickers = [];
    document.querySelectorAll('#stock-select-1 option').forEach(option => {
        initialTickers.push(option.value);
        
        if (!frontierCache.stocks.has(option.value)) {
            addTickerToFrontierCache(option.value);
        }
    });
    
    callServer(initialTickers)
        .then(data => {
            allDataCache = data;
            
            for (let cardNum = 1; cardNum <= 2; cardNum++) {
                const initialTicker = document.getElementById(`stock-select-${cardNum}`).value;
                updateCardDisplay(cardNum, initialTicker);
            }
            
            setupEventListeners();
        })
        .catch(error => {
            console.error('Initialization error:', error);
            showNotification('Failed to load initial data. Please refresh the page.', 'error');
        });
    
    function setupEventListeners() {
        for (let cardNum = 1; cardNum <= 2; cardNum++) {
            document.getElementById(`chart-type-${cardNum}`).addEventListener('change', function() {
                updateCardDisplay(cardNum);
            });
            
            document.getElementById(`stock-select-${cardNum}`).addEventListener('change', function() {
                updateCardDisplay(cardNum);
            });
            
            document.getElementById(`cap-select-${cardNum}`).addEventListener('change', function() {
                if (document.getElementById(`chart-type-${cardNum}`).value === 'efficient-frontier') {
                    updateEfficientFrontierChart(cardNum, this.value);
                }
            });

            document.getElementById(`search-button-${cardNum}`).addEventListener('click', () => {
                handleTickerSearch(cardNum);
            });
            
            document.getElementById(`ticker-search-${cardNum}`).addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    handleTickerSearch(cardNum);
                }
            });
        }
    }
});