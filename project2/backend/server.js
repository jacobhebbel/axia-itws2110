/* Load .env */
require('dotenv').config();

/* Import Functions */
// const { getFactset, getCapital, reorganizeData } = require('./util.js');

/* Import Packages */
const express = require('express');
const path = require('path');

/* Initialize Objects and Constants */
const server = express();
const PORT = 3000;
const PUBLIC = path.join(__dirname, 'public');

/* Serve Frontend */
server.use(express.static(PUBLIC));


/* Endpoint List */
/*
    1. /api/getEvaluation/:ticker
        sends a stock ticker, expects statistics to fill in the valuation form
        should respond with JSON thats organized and easy to index

    2. /api/ping
        responds with +/- if the service is live

    3. /api/help
        responds with a json of info on using the service
*/

/* Gets status of APIs, server */
server.get('/api/ping', async (req, res) => {

    // factsetStatus = await testFactsetStatus()
    // capitalStatus = await testCapitalStatus()

    const factsetStatus = true;
    const capitalStatus = true;
    return res.status(200).json({
        'factset': (factsetStatus ? 'live' : 'down'),
        'capital': (capitalStatus ? 'live' : 'down'),
        'server': 'live'
    });
});

/* Gives instructions on using the api */
server.get('/api/help', async (req, res) => {

    return res.status(200).json({
        purpose: 'add a ticker and receive a financials json with fields for filling out valuation template',
        use: 'add a ticker to the path, then provide a benchmark, start date, end date, and frequency parameters'
    });

});

/* Loads ticker financials */
server.get('/api/valuation/:ticker', async (req, res) => {

    /* Pull data from request */
    const stock = req.params.ticker;

    try {
        /* Call APIs */
        // const factsetData = await getFactset(stock);
        return res.status(200).json({
            'msg': 'endpoint not implemented'
        });
    }
    
    catch(error) {
        console.log(error)
        return res.status(500).send('Internal Server Error');
    }
});

server.listen(PORT, () => {
    console.log(`server is live on port ${PORT}`);
});
