import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

import * as SolidIcons from '@fortawesome/free-solid-svg-icons';
import * as RegularIcons from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import VueTitle from './components/VueTitle.vue';


const Icons = {...SolidIcons, ...RegularIcons}
const iconsList = Object
  .keys(Icons)
  .filter(key => key !== "fas" && key !== "prefix")
  .map(icon => Icons[icon]);
library.add(...iconsList);


createApp(App)
  .use(store)
  .use(router)
  .component('font-awesome-icon', FontAwesomeIcon)
  .component('vue-title', VueTitle)
  .mount('#app')