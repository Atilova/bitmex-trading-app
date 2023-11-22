import api from '@/composables/api'
import { updateState } from '@/composables/utils'
import * as COMMIT_TYPES from './commitsTypes'
import * as ACTION_TYPES from './actionsTypes'
import { GET_QUOTES_LIST } from './endpoints'
import { QUOTES_HISTORY_STATE } from './states'


const initialState = {
  view: QUOTES_HISTORY_STATE.INITIAL_WAIT,
  dataList: [],
  lastError: null,
  subscribedQuote: null
}

export default {
  state: {...initialState},
  mutations: {
    [COMMIT_TYPES.QUOTES_HISTORY_LIST__UPDATE_STATE](state, payload) {
      updateState(state, payload)

      // if(!!payload.lastError)
      //   console.error('CAUGHT HISTORY ->', payload.lastError)
    },

    [COMMIT_TYPES.QUOTES_HISTORY_LIST__UPDATE_DATA](state, payload) {
      const list = [...state.dataList]
      
      list.unshift(payload)
      list.pop(payload)
      state.dataList = list
    },

    [COMMIT_TYPES.QUOTES_HISTORY_LIST__SET_DATA](state, payload) {
      updateState(state, {'dataList': payload})
    },

    [COMMIT_TYPES.QUOTES_HISTORY_LIST__RESET_COMPONENT](state) {          
      updateState(state, initialState)
    },

    [COMMIT_TYPES.QUOTES_HISTORY_LIST__SET_SUBSCRIPTION](state, subscription) {
      updateState(state, {'subscribedQuote': subscription})
    }
  },
  actions: {
    async [ACTION_TYPES.QUOTES_HISTORY_LIST__REQUEST_FETCH]({ rootState, state, commit, dispatch }) {
      commit(COMMIT_TYPES.QUOTES_HISTORY_LIST__UPDATE_STATE, {
        'view': QUOTES_HISTORY_STATE.FETCH_DATA}
      )

      if(!!state.subscribedQuote) {
        rootState.ws.unsubscribe(state.subscribedQuote)
        commit(COMMIT_TYPES.QUOTES_HISTORY_LIST__SET_SUBSCRIPTION, null)
      }

      try {
        const response = await api.get(GET_QUOTES_LIST(rootState.selectedCurrency))

        if(!response.data?.length)
          return commit(COMMIT_TYPES.QUOTES_HISTORY_LIST__UPDATE_STATE, {
            'view': QUOTES_HISTORY_STATE.EMPTY_RESPONSE}
          )

        commit(COMMIT_TYPES.QUOTES_HISTORY_LIST__UPDATE_STATE, {
          'view': QUOTES_HISTORY_STATE.REQUEST_SUBSCRIPTION}
        )

        commit(COMMIT_TYPES.QUOTES_HISTORY_LIST__SET_DATA, response.data)
        dispatch(ACTION_TYPES.QUOTES_HISTORY_LIST__REQUEST_SUBSCRIPTION)
      }
      catch(error) {
        commit(
          COMMIT_TYPES.QUOTES_HISTORY_LIST__UPDATE_STATE,
          {'view': QUOTES_HISTORY_STATE.ERROR, 'lastError': error}
        )
      }
    },

    async [ACTION_TYPES.QUOTES_HISTORY_LIST__REQUEST_SUBSCRIPTION]({ rootState, commit }) {
      const subscriptionSuccess = () => commit(COMMIT_TYPES.QUOTES_HISTORY_LIST__UPDATE_STATE, {
        'view': QUOTES_HISTORY_STATE.DISPLAY
      })

      try {
        const subscription = `tradeBin1m:${rootState.selectedCurrency}`
        await rootState.ws.requestSubscription(subscription, ACTION_TYPES.QUOTES_HISTORY_LIST__DATA_CALLBACK)
        commit(COMMIT_TYPES.QUOTES_HISTORY_LIST__SET_SUBSCRIPTION, subscription)
        subscriptionSuccess()
      }
      catch(error) {
        if(error?.message?.includes('already subscribed'))  // Only for vue live-reload
          return subscriptionSuccess()

        commit(
          COMMIT_TYPES.QUOTES_HISTORY_LIST__UPDATE_STATE,
          {'view': QUOTES_HISTORY_STATE.ERROR, 'lastError': error}
        )
      }
    },

    async [ACTION_TYPES.QUOTES_HISTORY_LIST__DATA_CALLBACK]({ commit }, data) {
      commit(COMMIT_TYPES.QUOTES_HISTORY_LIST__UPDATE_DATA, data[0])
    },

    [ACTION_TYPES.QUOTES_HISTORY_LIST__RESET_COMPONENT_ACTION]({ commit, state, rootState }) {
      if(!!state.subscribedQuote)
        rootState.ws.unsubscribe(state.subscribedQuote).catch(() => {})

      commit(COMMIT_TYPES.QUOTES_HISTORY_LIST__RESET_COMPONENT)
    }
  }
}