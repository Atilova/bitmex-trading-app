import axios from 'axios';
import CryptoJS from 'crypto-js';


const PROXY_BITMEX_URL = 'proxy-bitmex',
      API_PATH = '/api/v1'


// Proxy is used to prevent cors headers strict origin request error
const bitmexApi = axios.create({
    baseURL: `${location.origin}/${PROXY_BITMEX_URL}${API_PATH}`,
    headers: {
        'content-type' : 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',   
    }
})

export const requireSignature = (verb, endpoint, data) => {
    const expires = Math.round(new Date().getTime() / 1000) + 60;  // 1 min in the future
  
    const signature = CryptoJS
                        .HmacSHA256(verb + API_PATH + endpoint + expires + data, process.env.VUE_APP_BITMEX_API_SECRET)
                        .toString(CryptoJS.enc.Hex)
  
    const headers = {
      'api-expires': expires,
      'api-key': process.env.VUE_APP_BITMEX_API_KEY,
      'api-signature': signature
    }
  
    return {
      headers,
      signature
    }
}

export default bitmexApi