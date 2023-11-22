import store from '@/store'
import { WEBSOCKET_API } from './paths'
import {
  WS_STATE,
  WS_CONNECTION_REJECTED_REASON,
  REQUEST_PING_LITERAL,
  PONG_RESPONSE_LITERAL,
  SUBSCRIBE_TO,
  OPERATION_REJECTED_REASON,
  UNSUBSCRIBE_FROM
} from './types'
import { HOME_VIEW__UPDATE_STATE } from '@/store/commitsTypes'
import { HOME_VIEW_STATE } from '@/store/states'
import { updateState } from '@/composables/utils'
import isEqual  from 'lodash/isEqual'


class VueSocket {
  // The followings are assigned in milliseconds
  OPTIONS = {
    connectionTimeout: 7000,
    reconnectIn: 4000,
    pingFrequencyTics: 5000,
    maxFailedPingsInRaw: 1,  // After such number of attempts (fails) socket will be closed
    operationTimeout: 3000
  }

  constructor(url) {
    this._url = url
    this._ws = null
    this._state = WS_STATE.DEFAULT
    this._allowSelfReconnect = false
    this._pendingOperations = []
    this._subscribedTables = []

    this._resetFields()
  }

  _resetFields() {
    this._allowSelfReconnect = false
    this._pingFailEntries = 0
    this._isPongReceived = null
  }

  _rejectAllOperations() {
    this._pendingOperations.forEach(operation => {
      clearTimeout(operation.timeoutId)
      operation.reject({'type': OPERATION_REJECTED_REASON.CANCEL})
    })
    this._pendingOperations = []
  }

  _resetSubscribedTables() {
    this._subscribedTables = []
  }

  _removeFromPending(pendingToRemove) {
    this._pendingOperations = this._pendingOperations.filter(operation => operation.timeoutId != pendingToRemove.timeoutId)
  }

  _getSubscription(tableName) {
    const [subscription] = this._subscribedTables.filter(subscribed => subscribed.table === tableName)
    return subscription
  }

  _setState(nextState) {
    this._state = nextState
  }

  _rejectPromise = () => new Promise((resolve , reject) => reject())

  _verifyConnectionState = () => { // isClosed
    if(!!!this._ws)
      return true
    
    return [this._ws.CLOSED, this._ws.CLOSING].includes(this._ws.readyState)
  }

  
  _closeLink(hardClose) {
    if(!this._verifyConnectionState())  // Means not in closed state
      this._ws.close()

    if(!!this._ws && hardClose) {
      this._ws.onclose = () => {}
      this._onClose()
    }
  }

  // Unsubscribe, if table subscribed and no longer in _pendingOperations
  _continueOrUnsubscribe = (subscription, tableName) => {
    if(!!!subscription)
      this.unsubscribe(tableName, true)  // Don't create pending and disable protection
    return !!!subscription
  }

  openLink() {
    if(this._state !== WS_STATE.DEFAULT)
      return this._rejectPromise()

    this._setState(WS_STATE.CONNECTING)
    this._rejectAllOperations()
    this._resetSubscribedTables()
    return new Promise((resolve, reject) => this._establishConnection(resolve, reject))
  }

  closeLink() {
    this._allowSelfReconnect = false
    this._closeLink(true)
    this._setState(WS_STATE.DEFAULT)
  }

  _establishConnection = async (resolveConnection, rejectConnection) =>
    {
      let connectionTimeoutIndex = null
      try {
        await new Promise((innerResolve, innerReject) => {
          this._resetFields()

          this._ws = new WebSocket(this._url)
          this._ws.onopen = event => this._onOpen(event, innerResolve)
          this._ws.onerror = event => this._onError(event, innerReject)
          this._ws.onclose = event => this._onClose(event)
          this._ws.onmessage = event => this._onMessage(event)

          connectionTimeoutIndex = setTimeout(() => innerReject(
            { 'type': WS_CONNECTION_REJECTED_REASON.ABORT }
          ), this.OPTIONS.connectionTimeout)
        })

        clearTimeout(connectionTimeoutIndex)
        resolveConnection()
        console.log("-> | Socket Established")
      }
      catch(error) {
        const { type: rejectReason } = error
        if(rejectReason === WS_CONNECTION_REJECTED_REASON.ABORT)
          clearTimeout(connectionTimeoutIndex)

        this._closeLink()
        rejectConnection()

        setTimeout(() => {
          this._establishConnection(resolveConnection, rejectConnection)
        }, this.OPTIONS.reconnectIn)
      }
    }

    _maintainConnection = () => {
      if(this._state !== WS_STATE.ESTABLISHED || this._verifyConnectionState())
        return clearInterval(this._pingIntervalId)

      if([null, true].includes(this._isPongReceived)) {
        this._isPongReceived = false
        this._pingFailEntries = 0
      }
      else {
        if(this._pingFailEntries < this.OPTIONS.maxFailedPingsInRaw)
          this._pingFailEntries++
        else {
          clearInterval(this._pingIntervalId)
          return this._closeLink(true)
        }
      }

      this.transmit(REQUEST_PING_LITERAL)
    }

  _onOpen = (event, resolve) => {
    resolve()
    store.commit(HOME_VIEW__UPDATE_STATE, HOME_VIEW_STATE.CONNECTION_ESTABLISHED)
    this._setState(WS_STATE.ESTABLISHED)
    this._allowSelfReconnect = true
    this._pingIntervalId = setInterval(this._maintainConnection, this.OPTIONS.pingFrequencyTics)
  }

  _onClose = async event => {
    if(!this._allowSelfReconnect)
      return
    
    console.log('-> | Socket Closed')
    try {
      this._setState(WS_STATE.DEFAULT)      
      await this.openLink()
    }
    catch(error) {
      console.log('-> | Socket FAIL 2')
      store.commit(HOME_VIEW__UPDATE_STATE, HOME_VIEW_STATE.NETWORK_ERROR)
    }
  }

  _onError = (event, reject) => {
    if(!!reject)
      reject({'type': WS_CONNECTION_REJECTED_REASON.ERROR})
  }

  _onMessage = event => {
    const { data } = event

    if(data === PONG_RESPONSE_LITERAL)  // Handle pong response
      return this._isPongReceived = true


    const response = JSON.parse(data)

    if(!!response?.info)  // Handle info messages
      return console.info(response.info)


    if(!!response?.request) {  // Handle request`s responses
      const [pendingOperation] = this._pendingOperations.filter(operation => isEqual(operation.request, response.request))

      if(!!!pendingOperation)  // Not in pending list
        return

      clearTimeout(pendingOperation.timeoutId)
      this._removeFromPending(pendingOperation)

      if(!!response?.success) {
        pendingOperation.resolve()

        if(pendingOperation.request.op === 'subscribe')
          this._subscribedTables.push({
            'table': pendingOperation.request.args,
            'actionType': pendingOperation.actionType
          })
      }
      else
        pendingOperation.reject({'type': OPERATION_REJECTED_REASON.WRONG, 'message': response?.error})

      return
    }

    if(response?.action === 'update') {  // Handle table`s updates
      const subscription = this._getSubscription(response.table)
      return this._continueOrUnsubscribe(subscription, response.table) || store.dispatch(subscription.actionType, response.data)
    }

    if(response?.action === 'insert') {  // Handle table`s inserts
      const tableName = `${response.table}:${response.data[0].symbol}`,
            subscription = this._getSubscription(tableName)

      return this._continueOrUnsubscribe(subscription, tableName) || store.dispatch(subscription.actionType, response.data)
    }
  }

  _createPending(context) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this._removeFromPending(context)
        context.reject({'type': OPERATION_REJECTED_REASON.TIMEOUT})
      }, this.OPTIONS.operationTimeout)

      updateState(context, {
        resolve,
        reject,
        timeoutId
      })

      this._pendingOperations.push(context)
      this.transmit(context.request)
    })
  }

  transmit(payload) {
    if(this._state !== WS_STATE.ESTABLISHED)
      return -1

    this._ws.send(JSON.stringify(payload))
  }

  requestSubscription(args, actionType) {
    if(this._verifyConnectionState())
      return this._rejectPromise()

    return this._createPending({
      request: SUBSCRIBE_TO(args),
      actionType
    })
  }

  unsubscribe(tableName, unsubscribeAnyway) {
    if(unsubscribeAnyway)
      return this._ws.send(JSON.stringify(UNSUBSCRIBE_FROM(tableName)))

    const subscription = this._getSubscription(tableName)
    if(!!!subscription)
      return this._rejectPromise()

    return this._createPending({
      request: UNSUBSCRIBE_FROM(tableName)
    })
  }
}


export default new VueSocket(WEBSOCKET_API)