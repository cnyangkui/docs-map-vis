import Vue from 'vue'
import router from './router/index'
import App from './App.vue'
import 'ol/ol.css';
import 'ol-layerswitcher/src/ol-layerswitcher.css';

Vue.config.productionTip = false

new Vue({
  render: h => h(App),
  router: router,
  data: {
    eventHub: new Vue()
  }
}).$mount('#app')
