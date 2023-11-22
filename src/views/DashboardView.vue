<template>
  <div class="dashboard-container">
    <CurrencyListView class="dashboard-container__view dashboard-container__currency-list" />
    <QuotesHistoryView class="dashboard-container__view dashboard-container__quotes-history" />
    <OrderFormView class="dashboard-container__view dashboard-container__order-form" />
    <OrdersHistoryView class="dashboard-container__view dashboard-container__orders-history" />
  </div>
</template>

<script>
import CurrencyListView from './CurrencyListView.vue'
import QuotesHistoryView from './QuotesHistoryView.vue'
import OrderFormView from './OrderFormView.vue'
import OrdersHistoryView from './OrdersHistoryView.vue'


export default {
  name: 'DashboardView',
  components: {
    CurrencyListView,
    QuotesHistoryView,
    OrderFormView,
    OrdersHistoryView
  }
}
</script>

<style coped lang="sass" src="@/assets/styles/dashboard-view.sass" />