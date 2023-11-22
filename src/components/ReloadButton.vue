<template>
  <button 
    title="Reload component" 
    class="reload-button" 
    @click="reloadCallback"
    :disabled="isDisabled"
  >
    <font-awesome-icon icon="repeat" />
  </button>
</template>

<script>
export default {
  name: 'ReloadButton',
  props: ['reloadCallback', 'isDisabled']
}
</script>