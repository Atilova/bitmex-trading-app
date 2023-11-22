<template>
  <section class="orders-history">
    <div class="orders-history__header">
      Orders History
      <ReloadButton 
        :isDisabled="!isEqualValues(componentState, [ORDERS_HISTORY_STATE.DISPLAY, ORDERS_HISTORY_STATE.ERROR])" 
        :reloadCallback="manualReload" 
      />
    </div>
    
    <div class="orders-history__wrapper">
      <div
        v-if="componentState === ORDERS_HISTORY_STATE.DISPLAY"
        class="orders-history__container"
      >
        <table class="orders-history__table">
          <thead class="orders-history__table-head table-head">
            <th class="table-head__column table-head__time">Time</th>
            <th class="table-head__column table-head__symbol">Currency</th>
            <th class="table-head__column table-head__order-quantity">Quantity</th>
            <th class="table-head__column table-head__side">Side</th>
            <th class="table-head__column table-head__price">Price</th>
            <th class="table-head__column table-head__order-status">Status</th>
          </thead>
          <tbody class="orders-history__table-body">
            <tr
              v-for="order of dataList"
              :key="order.orderID"
              class="orders-history__table-raw table-raw"              
            >
              <td class="table-raw__column table-raw__time"><span>{{ convertTime(order.timestamp) }}</span></td>
              <td class="table-raw__column table-raw__symbol"><span>{{ order.symbol }}</span></td>
              <td class="table-raw__column table-raw__order-quantity"><span>{{ order.orderQty }}</span></td>
              <td class="table-raw__column table-raw__side"><span>{{ order.side }}</span></td>
              <td class="table-raw__column table-raw__price"><span>{{ order.price }}</span></td>
              <td class="table-raw__column table-raw__order-status"><span>{{ order.ordStatus }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="orders-history__status-message">
        <span class="orders-history__status-text">{{ statusMessage }}</span>
      </div>
    </div>
  </section>
</template>

<script>
import { useStore } from 'vuex'
import { onUnmounted, onMounted, computed } from 'vue'
import { createNamespacedHelpers } from 'vuex-composition-helpers'
import { isEqualValues } from '@/composables/utils'
import { ORDER_HISTORY__RESET_COMPONENT } from '@/store/commitsTypes'
import { ORDER_HISTORY__REQUEST_FETCH } from '@/store/actionsTypes'
import { ORDERS_HISTORY_STATE } from '@/store/states'
import ReloadButton from '@/components/ReloadButton.vue'
const { useState } = createNamespacedHelpers('ordersHistoryList')


export default {
  name: 'OrdersHistoryView',
  components: {
    ReloadButton
  },
  setup() {
    const textMessageDependingOnState = {
      [ORDERS_HISTORY_STATE.INITIAL_FETCH]: 'Fetching historical data...',
      [ORDERS_HISTORY_STATE.ERROR]: 'An error occurred. Try loading manually...'
    }

    const store = useStore()
    const { dataList, view: componentState } = useState(['dataList', 'view'])

    const statusMessage = computed(() => textMessageDependingOnState[componentState.value])

    const convertTime = timestamp => new Date(timestamp).toLocaleString('en-US', {hour12: false})

    onMounted(() => {
      store.dispatch(ORDER_HISTORY__REQUEST_FETCH)
    })

    onUnmounted(() => {
      store.commit(ORDER_HISTORY__RESET_COMPONENT)
    })

    const manualReload = () => {
      store.commit(ORDER_HISTORY__RESET_COMPONENT)
      store.dispatch(ORDER_HISTORY__REQUEST_FETCH)
    }

    return {
      statusMessage,
      componentState,
      ORDERS_HISTORY_STATE,
      dataList,
      convertTime,
      manualReload,
      isEqualValues
    }
  }
}
</script>

<style scoped lang="sass" src="@/assets/styles/orders-history.sass" />