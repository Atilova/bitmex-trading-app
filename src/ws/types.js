export const WS_STATE = {
  DEFAULT: 'DEFAULT',
  CONNECTING: 'CONNECTING',
  ESTABLISHED: 'ESTABLISHED'
}

export const WS_CONNECTION_REJECTED_REASON = {
  ERROR: 'ERROR',
  ABORT: 'ABORT'
}

export const OPERATION_REJECTED_REASON = {
  WRONG: 'WRONG',
  TIMEOUT: 'TIMEOUT',
  CANCEL: 'CANCEL'
}


export const SUBSCRIBE_TO = args => ({'op': 'subscribe', 'args': args})
export const UNSUBSCRIBE_FROM = args => ({'op': 'unsubscribe', 'args': args})


export const REQUEST_PING_LITERAL = 'ping'
export const PONG_RESPONSE_LITERAL = 'pong'