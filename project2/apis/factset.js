const axios = require('axios');
const API_USER = process.env.FACTSET_API_USER;
const API_KEY = process.env.FACTSET_API_KEY;
const API_URL = 'https://api.factset.com/report/overview/v1';

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

async function keyData(stock) {
    const endpoint = 'key-stats';
    const query = new URLSearchParams({'id': stock});
    var res = {};
    try {
        const response = await axios.get(
            `${API_URL}/${endpoint}?${query}`, {
                auth: {
                    username: API_USER,
                    password: API_KEY
                }
            }
        );

        res = response.data;
        return res;
    } catch(error) {
        console.log(`Error with key call: ${error}`);
    }
}

async function finData(stock) {
    const endpoint = 'financial-highlights';
    const query = new URLSearchParams({'id': stock});
    var res = {};
    try {
        const response = await axios.get(
            `${API_URL}/${endpoint}?${query}`, {
                auth: {
                    username: API_USER,
                    password: API_KEY
                }
            }
        );

        const data = response.data.tables.main.data.rows;
        res['ebitda'] = data.find(e => e.cells.includes('EBITDA')).cells.at(-1);
        res['sales'] = data.find(e => e.cells.includes('Sales')).cells.at(-1);
        return res;
    } catch(error) {
        console.log(`Error with fin call: ${error}`);
    }
}

async function capData(stock) {
    const endpoint = 'current-cap';
    const query = new URLSearchParams({'id': stock});
    var res = {};
    try {
        const response = await axios.get(
            `${API_URL}/${endpoint}?${query}`, {
                auth: {
                    username: API_USER,
                    password: API_KEY
                }
            }
        );

        const data = response.data.tables.main.data.rows;
        res['marketCap'] = data.find(e => e.cells.includes('Market Cap')).cells.at(-1);
        res['enterprise'] = data.find(e => e.cells.includes('Enterprise Value')).cells.at(-1);
        return res;
    } catch(error) {
        console.log(`Error with cap call: ${error}`);
    }
}

async function peerData(stock) {
    const endpoint = 'peer-list';
    const query = new URLSearchParams({'id': stock});
    var res = {};
    try {
        const response = await axios.get(
            `${API_URL}/${endpoint}?${query}`, {
                auth: {
                    username: API_USER,
                    password: API_KEY
                }
            }
        );

        res['peers'] = response['data']['peers'];
        return res
    } catch(error) {
        console.log(`Error with peer call: ${error}`);
    }
}

async function profileData(stock) {
    const endpoint = 'profile';
    const query = new URLSearchParams({'id': stock});
    var res = {};
    try {
        const response = await axios.get(
            `${API_URL}/${endpoint}?${query}`, {
                auth: {
                    username: API_USER,
                    password: API_KEY
                }
            }
        );

        res['sectors'] = response['data']['sector']
        res['industry'] = response['data']['industry']
        res['name'] = response['data']['name']
        res['contact'] = response['data']['contact']
        return res
    } catch(error) {
        console.log(`Error with profile call: ${error}`);
    }
}

async function transactionData(stock) {
    const endpoint = 'transactions';
    const query = new URLSearchParams({'id': stock});
    var res = {};
    try {
        const response = await axios.get({
            url: `${API_URL}/${endpoint}?${query}`,
            auth: {
                username: API_USER,
                password: API_KEY
            }
        });


    } catch(error) {
        console.log(`Error with transaction call: ${error}`)
    }
}

async function factsetDriver(stock) {
    
    const apiJSON = require('./factset.json');
    const data = {
        'cap': await capData(stock),
        'fin': await finData(stock),
        'stats': await keyData(stock),
        'peer': await peerData(stock),
        'profile': await profileData(stock)
        //'transactions': await transactionData(stock)
    };

    return data;
}

module.exports = { factsetDriver }