import api, { requireSignature } from '@/composables/api'
import { updateState } from '@/composables/utils'
import * as COMMIT_TYPES from './commitsTypes'
import * as ACTION_TYPES from './actionsTypes'
import { OPERATE_ORDER } from './endpoints'
import { ORDERS_HISTORY_STATE } from './states'


const initialState = {
  view: ORDERS_HISTORY_STATE.INITIAL_FETCH,
  dataList: [],
  lastError: null
}

export default {
  state: {...initialState},
  mutations: {
    [COMMIT_TYPES.ORDER_HISTORY__UPDATE_STATE](state, payload) {
      updateState(state, payload)

      // if(!!payload.lastError)
      //   console.error('CAUGHT QUOTES->', payload.lastError)
    },

    [COMMIT_TYPES.ORDER_HISTORY__UPDATE_DATA](state, payload) {
      const list = [...state.dataList]
      list.unshift(payload)
      list.pop(payload)
      state.dataList = list
    },

    [COMMIT_TYPES.ORDER_HISTORY__SET_DATA](state, payload) {
      updateState(state, {'dataList': payload})
    },

    [COMMIT_TYPES.ORDER_HISTORY__RESET_COMPONENT](state) {
      updateState(state, initialState)
    }
  },
  actions: {
    async [ACTION_TYPES.ORDER_HISTORY__REQUEST_FETCH]({ commit }) {
      try {

        const { headers: signedHeaders } = requireSignature('GET', OPERATE_ORDER, '')

        const response = await api.get(OPERATE_ORDER, {
          headers: {
            ...signedHeaders
          }
        })

        commit(COMMIT_TYPES.ORDER_HISTORY__SET_DATA, response.data)
        commit(COMMIT_TYPES.ORDER_HISTORY__UPDATE_STATE, {'view': ORDERS_HISTORY_STATE.DISPLAY})
      }
      catch(error) {
        commit(
          COMMIT_TYPES.ORDER_HISTORY__UPDATE_STATE,
          {'view': ORDERS_HISTORY_STATE.ERROR, 'lastError': error}
        )
      }
    }
  }
}