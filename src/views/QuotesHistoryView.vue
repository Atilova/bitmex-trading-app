<template>
  <section class="quotes-list">
    <div class="quotes-list__header">
      Price History
      <ReloadButton
        :isDisabled="!isEqualValues(componentState, [QUOTES_HISTORY_STATE.DISPLAY, QUOTES_HISTORY_STATE.ERROR])"
        :reloadCallback="manualReload"
      />
    </div>

    <div class="quotes-list__wrapper">
      <div
        v-if="componentState === QUOTES_HISTORY_STATE.DISPLAY"
        class="quotes-list__container"
      >
        <table class="quotes-list__table">
          <thead class="quotes-list__table-head table-head">
            <th class="table-head__column table-head__time">Time</th>
            <th class="table-head__column table-head__open">Open</th>
            <th class="table-head__column table-head__high">High</th>
            <th class="table-head__column table-head__low">Low</th>
            <th class="table-head__column table-head__close">Close</th>
            <th class="table-head__column table-head__trades">Trades</th>
          </thead>
          <tbody class="quotes-list__table-body">
            <tr
              v-for="quote of dataList"
              :key="quote.timestamp"
              class="quotes-list__table-raw table-raw"
              :class="{ 'table-raw--reversed':  isRevertedRaw(quote.timestamp)}"
            >
              <td class="table-raw__column table-raw__time"><span>{{ convertTime(quote.timestamp) }}</span></td>
              <td class="table-raw__column table-raw__open"><span>{{ quote.open }}</span></td>
              <td class="table-raw__column table-raw__high"><span>{{ quote.high }}</span></td>
              <td class="table-raw__column table-raw__low"><span>{{ quote.low }}</span></td>
              <td class="table-raw__column table-raw__close"><span>{{ quote.close }}</span></td>
              <td class="table-raw__column table-raw__trades"><span>{{ quote.trades }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="quotes-list__status-message">
        <span class="quotes-list__status-text">{{ statusMessage }}</span>
      </div>
    </div>
  </section>
</template>

<script>
import { useStore } from 'vuex'
import { watch, onUnmounted, computed } from 'vue'
import { createNamespacedHelpers, useState as useRootState } from 'vuex-composition-helpers'
import { isEqualValues } from '@/composables/utils'
import { HOME_VIEW__SET_SELECTED_SYMBOL } from '@/store/commitsTypes'
import { QUOTES_HISTORY_LIST__REQUEST_FETCH, QUOTES_HISTORY_LIST__RESET_COMPONENT_ACTION } from '@/store/actionsTypes'
import { QUOTES_HISTORY_STATE } from '@/store/states'
import ReloadButton from '@/components/ReloadButton.vue'
const { useState } = createNamespacedHelpers('quotesHistoryList')


export default {
  name: 'QuotesHistoryView',
  components: {
    ReloadButton
  },
  setup() {
    const textMessageDependingOnState = {
      [QUOTES_HISTORY_STATE.INITIAL_WAIT]: 'Select currency to continue.',
      [QUOTES_HISTORY_STATE.FETCH_DATA]: 'Fetching historical data...',
      [QUOTES_HISTORY_STATE.EMPTY_RESPONSE]: 'No relevant data found.',
      [QUOTES_HISTORY_STATE.REQUEST_SUBSCRIPTION]: 'Enrolling for updates...',
      [QUOTES_HISTORY_STATE.ERROR]: 'An error occurred. Try loading manually...'
    }

    const store = useStore()
    const { selectedCurrency: selected } = useRootState(['selectedCurrency'])
    const { dataList, view: componentState } = useState(['dataList', 'view'])

    const statusMessage = computed(() => textMessageDependingOnState[componentState.value])

    const convertTime = timestamp => new Date(timestamp).toLocaleTimeString('en-US', {hour12: false, timeStyle: 'short'})

    const isRevertedRaw = timestamp => Boolean(new Date(timestamp).getMinutes() % 2)

    watch(selected, () => {
      if(!!!selected.value)
        return store.dispatch(QUOTES_HISTORY_LIST__RESET_COMPONENT_ACTION)
      store.dispatch(QUOTES_HISTORY_LIST__REQUEST_FETCH)
    })

    onUnmounted(() => {
      store.dispatch(QUOTES_HISTORY_LIST__RESET_COMPONENT_ACTION)
      store.commit(HOME_VIEW__SET_SELECTED_SYMBOL, '')
    })

    const manualReload = () => {
      store.dispatch(QUOTES_HISTORY_LIST__RESET_COMPONENT_ACTION)
      if(!!selected.value)
        store.dispatch(QUOTES_HISTORY_LIST__REQUEST_FETCH)
    }

    return {
      dataList,
      selected,
      componentState,
      QUOTES_HISTORY_STATE,
      statusMessage,
      convertTime,
      isRevertedRaw,
      manualReload,
      isEqualValues
    }
  }
}
</script>

<style scoped lang="sass" src="@/assets/styles/quotes-history-list.sass" />