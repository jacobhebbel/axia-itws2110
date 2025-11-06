const axios = require('axios');
const API_USER = process.env.FACTSET_API_USER;
const API_KEY = process.env.FACTSET_API_KEY;

/* Data Collected via FactSet API *//*

    /current-cap
    - Basic Shares/Common Stock
    - Market Cap
    - Enterprise Value
    
    /financial-highlights
    - Sales
    - EBITDA

    /key-stats
    - Annual Dividend
    - Average Daily Volitility
    - Average Rating
    - Basic Shares
    - Broker Contributors
    - Diluted Market Cap
    - Diluted Shares
    - Dividend Yield
    - Enterprise Value
    - Market Cap
    - Float
    - Institutional
    - Long-Term Growth Rate
    - 52-week trading range
    - Short Interest
    - Short Interest Ratio
    - Volume
    - WACC

    /peer-list:
    peers to use for comparables valuation chart

    /profile:
    Info on the company

    /transactions:
    Info on recent transactions
*/

async function factsetDriver() {
    
    const baseURL = 'https://api.factset.com/report/overview/v1';
    const apiJSON = require('./factset.json');
    const data = {};

    for (const call in apiJSON) {
        
        if (call['parameters'] != {}) {
            // load parameters here
        }

        const query = new URLSearchParams(call['parameters']);
        const response = await axios.get({
            url: `${baseURL}/${call['endpoint']}/?${query}`,
            auth: {
                username: API_USER,
                password: API_KEY,
            },
        });

        
        
    } 

    
}