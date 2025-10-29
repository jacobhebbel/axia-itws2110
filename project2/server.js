/* Load .env */

/* Import Packages */
const { express } = require('express');
const path = require('path');

/* Initialize Objects and Constants */
const server = express();
const PORT = 3000;
const PUBLIC = path.join(__dirname, 'public');

/* Serve Frontend */
server.use(express.static(PUBLIC));


/* Endpoint List */ /*

    1. /api/getEvaluation/:stockTicker
        sends a stock ticker, expects statistics to fill in the valuation form
        should respond with JSON thats organized and easy to index

    2. /api/ping
        responds with +/- if the service is live

*/

server.get('/api/valuation/:ticker', async (req, res) => {

    /* Pull data from request */
    const stock = req.params.ticker;
    
    try {
        /* Call APIs */
        const factsetData = await getFactsetData(stock);
        const spData = await getSpData(stock);

        /* Restructure data into [stat: {factset: , sp: }] pairs */
        const data = reorganizeData(factsetData, spData);

        return res.status(200).json(data);
    }
    
    catch(error) {
        return res.status(500).send('Internal Server Error');
    }
});
