// backend/server.js
const express = require("express");
const axios = require("axios");
const path = require("path");

const app = express();
const PORT_ME = 3000;
const PORT_FLASK = 4000;
const URL_FLASK = `http:\\localhost:${PORT_FLASK}`;

// checks if all required args are present in request query parameters
function validReq(queryArgs) {
    const reqArgs = ['tickers', 'interval', 'period'];
    const validReq = reqArgs.every(element => element in queryArgs);
    return validReq;
}

// serve the code structure in /public
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/ping", async (req, res) => {

    try {
        const { data } = await axios.get(`${URL_FLASK}/ping`, {
            timeout: 50000000
        });

        return res.status(200).json(data);
    } catch(error) {
        
        console.log(error);
        
        return res.status(500).json({
            'success': false,
            'err': 'could not ping server'
        });
    }

});

app.get("/api/data", async (req, res) => {

    // validates request
    if (!validReq(req.query)) {
        return res.status(400).json({
            'success': false,
            'err': '1 or more required parameters missing',
            'requiredParams': ['tickers', 'interval', 'period']
        });
    }

    // parses vars from query args ({validReq is true} ==> {all args present})
    const query = new URLSearchParams(req.query);
    
    try {

        // axios can succeed, timeout, error with response, or error with no response
        const { data } = await axios.get(`${URL_FLASK}/data?${query.toString()}`, {
            'timeout': 500000
        });
        console.log(data);
        return res.status(200).json(data);
    
    // timeout, error with response, or error with no response 
    } catch(error){

        // axios got a non 200 status code
        if (error.response) {
            const response = error.response;
            console.log(response.status);
            console.log(response.data);
            
            return res.status(response.status).json(response.data);
        }
        
        // axios got no response *uh oh*
        else {
            console.log("No response from server:", error.message);

            return res.status(500).json({
                'success': false,
                'err': 'Could not connect to flask service'
            });
        }
    }
});

app.listen(PORT_ME, () =>
    console.log(`Server running at http://localhost:${PORT_ME}`)
);
