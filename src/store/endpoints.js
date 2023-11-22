export const GET_ACTIVE_INSTRUMENT = '/instrument/active'
export const OPERATE_ORDER = '/order?reverse=true'
export const GET_QUOTES_LIST = symbol => `/trade/bucketed?binSize=1m&partial=false&count=101&reverse=true&symbol=${symbol}`