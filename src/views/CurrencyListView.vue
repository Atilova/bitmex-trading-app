<template>
  <section class="currency-list">
    <div class="currency-list__header">
      Trading Pairs
      <ReloadButton 
        :isDisabled="!isEqualValues(componentState, [CURRENCY_LIST_STATE.DISPLAY, CURRENCY_LIST_STATE.ERROR])" 
        :reloadCallback="manualReload" 
      />
    </div>

    <div class="currency-list__wrapper">
      <ul v-if="componentState === CURRENCY_LIST_STATE.DISPLAY" class="currency-list__table">
        <li
          v-for="currency of isPricedDataList"
          class="currency-list__currency"        
          :key="currency.symbol"
          :class="{'currency-list__currency--selected': currency.symbol == selectedCurrency}"
        >      
          <span @click="selectCurrency(currency.symbol)" class="currency-list__symbol">{{ currency.symbol }}</span>
          <span 
            class="currency-list__price"
            :class="{
            'currency-list__price--plus': currency.lastTickDirection?.includes('Plus'),
            'currency-list__price--minus':  currency.lastTickDirection?.includes('Minus')
            }"
          >
            {{ currency.lastPrice }}            
          </span>
        </li>
      </ul>

      <div v-else class="currency-list__status-message">
        <span class="currency-list__status-text">{{ statusMessage }}</span>
      </div>
    </div>
  </section>
</template>

<script>
import { onMounted, onUnmounted, computed } from 'vue'
import { useStore } from 'vuex'
import { createNamespacedHelpers, useState as useRootState } from 'vuex-composition-helpers'
import { isEqualValues } from '@/composables/utils'
import { CURRENCY_LIST__REQUEST_FETCH, CURRENCY_LIST__RESET_COMPONENT_ACTION } from '@/store/actionsTypes'
import { HOME_VIEW__SET_SELECTED_SYMBOL } from '@/store/commitsTypes'
import { CURRENCY_LIST_STATE } from '@/store/states'
import ReloadButton from '@/components/ReloadButton.vue'
const { useState } = createNamespacedHelpers('currencyList')


export default {
  name: 'CurrencyList',
  components: {
    ReloadButton
  },
  setup() {
    const textMessageDependingOnState = {
      [CURRENCY_LIST_STATE.INITIAL_FETCH]: 'Fetching historical data...',
      [CURRENCY_LIST_STATE.REQUEST_SUBSCRIPTION]: 'Enrolling for updates...',
      [CURRENCY_LIST_STATE.ERROR]: 'An error occurred. Try loading manually...'
    }

    const store = useStore()
    const { dataList, view: componentState } = useState(['dataList', 'view'])
    const { selectedCurrency } = useRootState(['selectedCurrency'])

    const isPricedDataList = computed(() => dataList.value.filter(item => !!item.lastPrice))

    const statusMessage = computed(() => textMessageDependingOnState[componentState.value])

    onMounted(() => {
      store.dispatch(CURRENCY_LIST__REQUEST_FETCH)
    })

    onUnmounted(() => {
      store.dispatch(CURRENCY_LIST__RESET_COMPONENT_ACTION)
    })

    const selectCurrency = symbol => {
      store.commit(HOME_VIEW__SET_SELECTED_SYMBOL, symbol)
    }

    const manualReload = () => {
      store.commit(HOME_VIEW__SET_SELECTED_SYMBOL, '')
      store.dispatch(CURRENCY_LIST__RESET_COMPONENT_ACTION)
      store.dispatch(CURRENCY_LIST__REQUEST_FETCH)
    }

    return { 
      isPricedDataList, 
      componentState, 
      CURRENCY_LIST_STATE, 
      selectCurrency, 
      selectedCurrency,
      statusMessage,
      manualReload,
      isEqualValues
    }
  }
}
</script>

<style scoped lang="sass" src="@/assets/styles/currency-list.sass" />