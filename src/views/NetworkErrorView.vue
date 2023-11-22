<template>
  <section class="network">
    <span class="network__state">
      <font-awesome-icon class="network__icon" icon="network-wired" />
      Oops! The network is down
    </span>
    <span class="network__reconnect">Auto-reconnection in progress. Stay on the page.</span>
  </section>
</template>

<script>
export default {
  name: 'NetworkView'
}
</script>

<style scoped lang="sass" src="@/assets/styles/network.sass" />
