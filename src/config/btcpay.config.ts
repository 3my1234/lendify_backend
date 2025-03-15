import axios from 'axios';

export const btcPayConfig = {
  host: process.env.BTCPAY_HOST,
  apiKey: process.env.BTCPAY_API_KEY,
  storeId: process.env.BTCPAY_STORE_ID,
  conversion: {
    USD_TO_LENDI: 2
  }
};

export const btcPayApi = axios.create({
  baseURL: btcPayConfig.host,
  headers: {
    'Authorization': `token ${btcPayConfig.apiKey}`,
    'Content-Type': 'application/json'
  }
});
