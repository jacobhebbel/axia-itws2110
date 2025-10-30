/* Import Packages */
const { ApiClient, BatchProcessingApi } = require('@factset/sdk-factsetfundamentals');

/* Load env Variables */
const FACTSET_KEY = process.env.FACTSET_API_KEY;
const FACTSET_USER = process.env.FACTSET_API_USER;

/* Initialize & Authorize FactSet API Client (clientFS) */
const clientFS = ApiClient.instance;
const FactSetApiKey = clientFS.authentications['FactSetApiKey'];
FactSetApiKey.username = FACTSET_USER;
FactSetApiKey.password = FACTSET_KEY;

const apiFS = BatchProcessingApi();

async function getFactsetData(stock) {

    
    
}