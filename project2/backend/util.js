/* Import API Sheets */
const factsetCalls = require('../factsetCalls.json');
const axios = require('axios');

/* Load env Variables */
const FACTSET_KEY = process.env.FACTSET_API_KEY;
const FACTSET_USER = process.env.FACTSET_API_USER;


async function getFactset(userParams) {

    // 1. build a base url
    // 2. for loop over every call
    // 2a. add user-specified variables to call
    // 2b. execute call
    // 2c. save the results to a json 

    const callResponses = {};
    const baseURL = 'https://api.factset.com';
    
    // calls is array of jsons, so make sure to use proper syntax
    for (let call of factsetCalls) {
        const params = call.params;

        // params is json
        for (let key in params) {
            
            if (typeof(params[key]) !== 'string') {
                continue;
            }

            // replace placeholder vals with user-supplied parameters
            params[key] = params[key].replace('TICKER_PLACEHOLDER', userParams['ticker'])
                                        .replace('START_DATE_PLACEHOLDER', userParams['start'])
                                        .replace('END_DATE_PLACEHOLDER', userParams['end'])
                                        .replace('FREQUENCY_PLACEHOLDER', userParams['frequency'])
                                        .replace('BENCHMARK_PLACEHOLDER', userParams['benchmark']);
        }

        // ids must be array type, but its str in json for easy string typecheck
        params['ids'] = [params['ids']];

        try {
            const response = await axios({
                method: call.method,
                url: baseURL + call.endpoint,
                headers: {
                    Authorization: 'Bearer ' + FACTSET_KEY,
                    'Content-Type': 'application/json'
                },
                data: params
            });
            callResponses[call.name] = response.data;
        } catch(error) {
            console.error(`Error fetching ${call.endpoint}:`, error.message);
        }
    }

    return callResponses;
}

async function getCapital() {

}

async function reorganizeData() {}

module.exports = { getFactset, getCapital, reorganizeData }