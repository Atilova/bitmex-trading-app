import api, { requireSignature } from '@/composables/api'
import { ORDER_FORM_STATE } from './states'
import { updateState, delay } from '@/composables/utils'
import * as COMMIT_TYPES from './commitsTypes'
import * as ACTION_TYPES from './actionsTypes'
import { OPERATE_ORDER } from './endpoints'


const initialState = {
  view: ORDER_FORM_STATE.INITIAL_WAIT,
  response: '',
  limits: {
    multipleLotSize: 1,
    maxOrderQty: null
  }
}

export default {
  state: {...initialState},
  mutations: {
    [COMMIT_TYPES.ORDER_FORM__UPDATE_STATE](state, payload) {
      updateState(state, payload)

      // if(!!payload.lastError)
      //   console.error('CAUGHT ->', payload.lastError)
    },

    [COMMIT_TYPES.ORDER_FORM__SET_LIMITS](state, limits) {
      updateState(state, {'limits': limits})
    },

    [COMMIT_TYPES.ORDER_FORM__SET_RESPONSE](state, response) {
      updateState(state, {'response': response})
    },

    [COMMIT_TYPES.ORDER_FORM__RESET_COMPONENT](state) {
      updateState(state, initialState)
    }
  },
  actions: {
    async [ACTION_TYPES.ORDER_FORM__GET_LIMITS]({ rootState, commit }) {
      const [currency] = rootState.currencyList.dataList.filter(currency => currency.symbol == rootState.selectedCurrency)
      commit(COMMIT_TYPES.ORDER_FORM__UPDATE_STATE, {'view': ORDER_FORM_STATE.GET_LOT_SIZE})
      await delay(200)
      commit(COMMIT_TYPES.ORDER_FORM__SET_LIMITS, {
        'multipleLotSize': currency.lotSize,
        'maxOrderQty': currency.maxOrderQty
      })
      commit(COMMIT_TYPES.ORDER_FORM__UPDATE_STATE, {'view': ORDER_FORM_STATE.DISPLAY})
    },

    async [ACTION_TYPES.ORDER_FORM__POST_ORDER]({ rootState, commit }, payload) {
      try {
        commit(COMMIT_TYPES.ORDER_FORM__UPDATE_STATE, {'view': ORDER_FORM_STATE.POST_REQUEST})

        const data = JSON.stringify({
          ordType: 'Market',
          symbol: rootState.selectedCurrency,
          orderQty: payload.orderQty,
          side: payload.side
        })

        const { headers: signedHeaders } = requireSignature('POST', OPERATE_ORDER, data)

        const response = await api.post(OPERATE_ORDER, data, {
          headers: {
            ...signedHeaders
          }
        })

        const responseData = response.data

        commit(COMMIT_TYPES.ORDER_HISTORY__UPDATE_DATA, responseData)
        commit(
          COMMIT_TYPES.ORDER_FORM__SET_RESPONSE, 
          `The order has been fulfilled in its entirety (${responseData.ordStatus})`
        )
      }
      catch(error) {
        if(error.code === 'ERR_NETWORK')
          commit(COMMIT_TYPES.ORDER_FORM__SET_RESPONSE, 'Failure in network communication has been observed.')
        else if(!!error.response)
          commit(COMMIT_TYPES.ORDER_FORM__SET_RESPONSE, error.response.data.error.message)
        else
          commit(COMMIT_TYPES.ORDER_FORM__SET_RESPONSE, error)
      }

      commit(COMMIT_TYPES.ORDER_FORM__UPDATE_STATE, {'view': ORDER_FORM_STATE.DISPLAY})
    }
  }
}