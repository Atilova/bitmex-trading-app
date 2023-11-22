import api from '@/composables/api'
import { CURRENCY_LIST_STATE } from './states'
import { updateState } from '@/composables/utils'
import * as COMMIT_TYPES from './commitsTypes'
import * as ACTION_TYPES from './actionsTypes'
import { GET_ACTIVE_INSTRUMENT } from './endpoints'


const initialState = {
  view: CURRENCY_LIST_STATE.INITIAL_FETCH,
  dataList: [],
  lastError: null
}

export default {
  state: {...initialState},
  mutations: {
    [COMMIT_TYPES.CURRENCY_LIST__UPDATE_STATE](state, payload) {
      updateState(state, payload)

      // if(!!payload.lastError)
      //   console.error('CAUGHT->', payload.lastError)
    },

    [COMMIT_TYPES.CURRENCY_LIST__UPDATE_DATA](state, payload) {
      const [toUpdate] = state.dataList.filter(currency => currency.symbol == payload.symbol)

      if(!!!toUpdate || !!!payload?.lastPrice)
        return

      console.log('UPDATE(', toUpdate.symbol, ')', toUpdate.lastPrice, ' -> ', payload.lastPrice)

      if(!!!payload?.lastTickDirection)
        toUpdate.lastTickDirection = payload.lastPrice > toUpdate.lastPrice
          ? 'PlusTick'
          : payload.lastPrice < toUpdate.lastPrice
            ? 'MinusPlus'
            : 'Zero' + toUpdate.lastTickDirection
      else
        toUpdate.lastTickDirection = payload.lastTickDirection


      toUpdate.lastPrice = payload.lastPrice
    },

    [COMMIT_TYPES.CURRENCY_LIST__SET_DATA](state, payload) {
      updateState(state, {'dataList': payload})
    },

    [COMMIT_TYPES.CURRENCY_LIST__RESET_COMPONENT](state) {
      updateState(state, initialState)
    }
  },
  actions: {
    async [ACTION_TYPES.CURRENCY_LIST__REQUEST_FETCH]({ commit, dispatch }) {
      try {
        const response = await api.get(GET_ACTIVE_INSTRUMENT)
        commit(COMMIT_TYPES.CURRENCY_LIST__UPDATE_STATE, {
          'view': CURRENCY_LIST_STATE.REQUEST_SUBSCRIPTION}
        )
        commit(COMMIT_TYPES.CURRENCY_LIST__SET_DATA, response.data)
        dispatch(ACTION_TYPES.CURRENCY_LIST__REQUEST_SUBSCRIPTION)
      }
      catch(error) {
        commit(
          COMMIT_TYPES.CURRENCY_LIST__UPDATE_STATE,
          {'view': CURRENCY_LIST_STATE.ERROR, 'lastError': error}
        )
      }
    },

    async [ACTION_TYPES.CURRENCY_LIST__REQUEST_SUBSCRIPTION]({ rootState, commit }) {
      const subscriptionSuccess = () => commit(COMMIT_TYPES.CURRENCY_LIST__UPDATE_STATE, {
        'view': CURRENCY_LIST_STATE.DISPLAY
      })

      try {
        await rootState.ws.requestSubscription('instrument', ACTION_TYPES.CURRENCY_LIST__DATA_CALLBACK)
        subscriptionSuccess()
      }
      catch(error) {
        if(error?.message?.includes('already subscribed'))  // Only for vue live-reload
          return subscriptionSuccess()

        commit(
          COMMIT_TYPES.CURRENCY_LIST__UPDATE_STATE,
          {'view': CURRENCY_LIST_STATE.ERROR, 'lastError': error}
        )
      }
    },

    async [ACTION_TYPES.CURRENCY_LIST__DATA_CALLBACK]({ commit }, data) {
      commit(COMMIT_TYPES.CURRENCY_LIST__UPDATE_DATA, data[0])
    },

    [ACTION_TYPES.CURRENCY_LIST__RESET_COMPONENT_ACTION]({ commit, rootState }) {
      rootState.ws.unsubscribe('instrument').catch(error => {})
      commit(COMMIT_TYPES.CURRENCY_LIST__RESET_COMPONENT)
    }
  }
}