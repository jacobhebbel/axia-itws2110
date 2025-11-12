const axios = require('axios');

/* 
Calls edgar API and collects the following info:
- 

*/

(async function() {
    
    const cik = 789019;
    const cikPadded = `${cik}`.padStart(10, '0');
    const baseURL = 'https://data.sec.gov/api/xbrl/companyfacts/';

    const headers = {
        "User-Agent": "Jacob Hebbel jacob.hebbel@email.com",
        "Accept-Encoding": "gzip, deflate"
    };

    const response = await axios.get(`${baseURL}CIK${cikPadded}.json`, { headers });

    console.log(response.data);
    console.log(response.data['facts']['us-gaap']['Revenues']);
    console.log(response.data['facts']['us-gaap']['Revenues']['units']['USD']);
})();


async function edgarDriver(cik) {

    const baseURL = 'data.sec.gov/api/xbrl/companyfacts/';
    const calls = require('./edgar.json');
    const data = {};

    for (const call in calls) {

        const params = new URLSearchParams(call['params']);      
        const valsMapping = call['values']  
        const response = await axios.get(`${baseURL}?${params}`);

        Object.entries(valsMapping).forEach(([dataKey, responseKeys]) => {
            
            data[call.alias][dataKey] = responseKeys.forEach(key => {
                if (key in response.data) {
                    return response.data[key];
                }
            });
        });
    }

    return data;
}