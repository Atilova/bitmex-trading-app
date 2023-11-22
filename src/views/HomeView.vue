<template>
  <component :is="componentToRender"></component>
</template>

<script>
import { onMounted, computed, onUnmounted, ref } from 'vue'
import { useStore } from 'vuex'
import { useState } from 'vuex-composition-helpers'

import LoaderView from './LoaderView.vue'
import DashboardView from './DashboardView.vue'
import NetworkErrorView from './NetworkErrorView.vue'

import { HOME_VIEW_STATE } from '@/store/states'
import {
  CURRENCY_LIST__RESET_COMPONENT_ACTION,
  QUOTES_HISTORY_LIST__RESET_COMPONENT_ACTION,
  HOME_VIEW__START_CONNECTION,
  HOME_VIEW__STOP_CONNECTION
} from '@/store/actionsTypes'
import {
  ORDER_FORM__RESET_COMPONENT,
  ORDER_HISTORY__RESET_COMPONENT,
} from '@/store/commitsTypes'


export default {
  name: 'HomeView',
  components: {
    LoaderView,
    NetworkErrorView,
    DashboardView
  },
  setup() {
    const ComponentDependingOnState = {
      [HOME_VIEW_STATE.SOCKET_CONNECTING]: LoaderView,  // Empty for now
      [HOME_VIEW_STATE.NETWORK_ERROR]: NetworkErrorView,
      [HOME_VIEW_STATE.CONNECTION_ESTABLISHED]: DashboardView
    }

    const PATCHES = {
      'dispatch': [
        CURRENCY_LIST__RESET_COMPONENT_ACTION,
        QUOTES_HISTORY_LIST__RESET_COMPONENT_ACTION
      ],
      'commit': [
        ORDER_FORM__RESET_COMPONENT,
        ORDER_HISTORY__RESET_COMPONENT
      ]

    }
    const store = useStore()
    const { view } = useState(['view'])
    const componentToRender = computed(() => ComponentDependingOnState[view.value])
    const lastMounted = ref(null)

    const patchAll = () => {
      const patchTypes = (types, patch) => types.forEach(patch)

      patchTypes(PATCHES.dispatch, store.dispatch)
      patchTypes(PATCHES.commit, store.commit)
    }

    onMounted(() => {
      lastMounted.value = setTimeout(() => {
        patchAll()  // Only for proper vue live-reload
        store.dispatch(HOME_VIEW__START_CONNECTION)  // Starts ws connection
      }, 1000)
    })

    onUnmounted(() => {
      // Stops ws connection, only needed to prevent any issues on vue reload
      clearTimeout(lastMounted.value)
      store.dispatch(HOME_VIEW__STOP_CONNECTION)
    })

    return { componentToRender }
  }
}
</script>