import { createStore } from 'vuex'
import * as COMMIT_TYPES from './commitsTypes'
import * as ACTION_TYPES from './actionsTypes'
import { HOME_VIEW_STATE } from './states'
import { updateState } from '@/composables/utils'

import currencyList from './currencyList'
import quotesHistoryList from './quotesHistoryList'
import orderForm from './orderForm'
import ordersHistoryList from './ordersHistoryList'
import VueSocket from '@/ws'


export default createStore({
  state: {
    view: HOME_VIEW_STATE.SOCKET_CONNECTING,
    ws: VueSocket,
    selectedCurrency: ''
  },
  mutations: {
    [COMMIT_TYPES.HOME_VIEW__UPDATE_STATE](state, viewState) {
      updateState(state, {'view': viewState})
    },

    [COMMIT_TYPES.HOME_VIEW__SET_SELECTED_SYMBOL](state, symbol) {
      updateState(state, {'selectedCurrency': symbol})
    }
  },
  actions: {
    async [ACTION_TYPES.HOME_VIEW__START_CONNECTION]({ state, commit }) {
      try {
        await state.ws.openLink();
      }
      catch(error) {
        console.log('-> | Socket FAIL 1')
        commit(COMMIT_TYPES.HOME_VIEW__UPDATE_STATE, HOME_VIEW_STATE.NETWORK_ERROR)
      }
    },
    async [ACTION_TYPES.HOME_VIEW__STOP_CONNECTION]({ state, commit }) {
      commit(COMMIT_TYPES.HOME_VIEW__UPDATE_STATE, HOME_VIEW_STATE.SOCKET_CONNECTING)
      state.ws.closeLink()
    }
  },
  modules: {
    currencyList,
    quotesHistoryList,
    orderForm,
    ordersHistoryList
  }
})
