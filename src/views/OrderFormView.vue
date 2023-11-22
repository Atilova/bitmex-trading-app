<template>
  <section class="order-form">
    <div class="order-form__header">
      Place Market Order
      <ReloadButton 
        :isDisabled="!isEqualValues(componentState, [ORDER_FORM_STATE.DISPLAY])" 
        :reloadCallback="manualReload" 
      />
    </div>

    <div
      v-if="componentState === ORDER_FORM_STATE.DISPLAY"
      class="order-form__wrapper"
    >
      <form @submit.prevent="submitOperation" class="order-form__form form-input">
        <fieldset class="form-input__fieldset form-input__volume">
          <legend class="form-input__legend form-input__volume-legend">Trade Size</legend>
          <div class="form-input__counter">
            <button
              @click="updateOrderQty('-')"
              class="form-input__counter-button"
              type="button"
            >
            <font-awesome-icon icon="minus" />
            </button>
            <input
              v-model="orderQty"
              @blur="verifyLotSize"
              type="number"
              :step="lotSize"
              :min="lotSize"
              :max="maxOrderQty"
              class="form-input__volume-input"
              form-input__volume
            >
            <button
              @click="updateOrderQty('+')"
              class="form-input__counter-button"
              type="button"
            >
            <font-awesome-icon icon="plus" />
            </button>
          </div>
        </fieldset>

        <fieldset class="form-input__fieldset form-input__operation">
          <legend class="form-input__legend form-input__operation-legend">Trade Actions</legend>
          <button @click="operationButtonPress('Buy')" class="form-input__operation-button form-input__operation-buy">Buy</button>
          <button @click="operationButtonPress('Sell')" class="form-input__operation-button form-input__operation-sell">Sell</button>
        </fieldset>

        <fieldset v-if="orderResponse" class="form-input__response form-input__response">
          <legend class="form-input__legend form-input__response-legend">Trade Response</legend>
          <span class="form-input__response-text">{{ orderResponse }}</span>
        </fieldset>
      </form>
    </div>

    <div
      v-else-if="componentState === ORDER_FORM_STATE.CONFIRM_ORDER"
      class="order-form__confirmation"
    >
      <span class="order-form__confirmation-line">{{ operationButton }} {{ orderQty }} {{ selected }}</span>
      <div class="order-form__confirmation-action">
        <button @click="confirmOperation" class="order-form__confirmation-button order-form__confirmation-continue">Continue</button>
        <button @click="cancelOperation" class="order-form__confirmation-button order-form__confirmation-cancel">Cancel</button>
      </div>
    </div>

    <div v-else class="order-form__status-message">
      <span class="order-form__status-text">{{ statusMessage }}</span>
    </div>
  </section>
</template>

<script>
import { useStore } from 'vuex'
import { watch, onUnmounted, computed, ref } from 'vue'
import { createNamespacedHelpers, useState as useRootState } from 'vuex-composition-helpers'
import { isEqualValues } from '@/composables/utils'
import {
  HOME_VIEW__SET_SELECTED_SYMBOL,
  ORDER_FORM__RESET_COMPONENT,
  ORDER_FORM__UPDATE_STATE,
  ORDER_FORM__SET_RESPONSE
} from '@/store/commitsTypes'
import { ORDER_FORM__GET_LIMITS, ORDER_FORM__POST_ORDER } from '@/store/actionsTypes'
import { ORDER_FORM_STATE } from '@/store/states'
import ReloadButton from '@/components/ReloadButton.vue'
const { useState } = createNamespacedHelpers('orderForm')


export default {
  name: 'OrderFormView',
  components: {
    ReloadButton
  },
  setup() {
    const textMessageDependingOnState = {
      [ORDER_FORM_STATE.INITIAL_WAIT]: 'Select currency to continue.',
      [ORDER_FORM_STATE.GET_LOT_SIZE]: 'Preparing historical data...',
      [ORDER_FORM_STATE.POST_REQUEST]: 'Processing in progress...'
    }

    const store = useStore()
    const { selectedCurrency: selected } = useRootState(['selectedCurrency'])
    const { response: orderResponse, view: componentState, limits } = useState(['response', 'view', 'limits'])

    const orderQty = ref(null),
          lotSize = ref(null),
          maxOrderQty = ref(null),
          operationButton = ref(null)

    const statusMessage = computed(() => textMessageDependingOnState[componentState.value])

    const updateOrderQty = (trend) => {
      const userInput = orderQty.value,
            fixedLot = lotSize.value

      if(trend === '-') {
        if(userInput - fixedLot <= 0)
          return
        return orderQty.value -= lotSize.value
      }

      if(userInput + fixedLot > maxOrderQty.value)
        return
      orderQty.value += lotSize.value
    }

    const verifyLotSize = () => {
      const userInput = orderQty.value,
            fixedLot = lotSize.value

      if(userInput > maxOrderQty.value) {
        return orderQty.value = maxOrderQty.value
      }

      if(userInput < 0) {
        return orderQty.value = fixedLot
      }

      if(!userInput || userInput % fixedLot !== 0) {
        const rounded = Math.round(userInput / fixedLot) * fixedLot

        if(!rounded)
          return orderQty.value = fixedLot

        orderQty.value = rounded
      }
    }

    const updateValues = () => {
      orderQty.value = limits.value.multipleLotSize
      lotSize.value = limits.value.multipleLotSize
      maxOrderQty.value = limits.value.maxOrderQty
    }

    const cancelOperation = () => store.commit(ORDER_FORM__UPDATE_STATE, {
      'view': ORDER_FORM_STATE.DISPLAY
    })

    const confirmOperation = () => store.dispatch(ORDER_FORM__POST_ORDER, {
      'side': operationButton.value,
      'orderQty': orderQty.value
    })

    const submitOperation =  () => {
      store.commit(ORDER_FORM__UPDATE_STATE, {
        'view': ORDER_FORM_STATE.CONFIRM_ORDER
      })
      store.commit(ORDER_FORM__SET_RESPONSE, '')
    }

    const operationButtonPress = buttonName => {
      operationButton.value = buttonName
    }

    const manualReload = () => {
      store.commit(ORDER_FORM__RESET_COMPONENT)
      store.dispatch(ORDER_FORM__GET_LIMITS)
    }

    watch(selected, () => {
      if(!!!selected.value)
        return store.commit(ORDER_FORM__RESET_COMPONENT)

      // Reset, in case limits.multipleLotSize remains the same and watch does not catch it
      updateValues()

      store.commit(ORDER_FORM__SET_RESPONSE, '')
      store.dispatch(ORDER_FORM__GET_LIMITS)
    })

    watch(limits, () => {
      // Update manually, so v-model can bind user input later
      updateValues()
    })

    onUnmounted(() => {
      store.commit(ORDER_FORM__RESET_COMPONENT)
      store.commit(HOME_VIEW__SET_SELECTED_SYMBOL, '')
    })

    return {
      statusMessage,
      componentState,
      ORDER_FORM_STATE,
      verifyLotSize,
      orderQty,
      lotSize,
      maxOrderQty,
      submitOperation,
      operationButtonPress,
      operationButton,
      selected,
      cancelOperation,
      confirmOperation,
      orderResponse,
      updateOrderQty,
      manualReload,
      isEqualValues
    }
  }
}
</script>

<style scoped lang="sass" src="@/assets/styles/order-form.sass" />