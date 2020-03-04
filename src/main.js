import Vue from 'vue'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import 'ol/ol.css';
import 'ol-layerswitcher/src/ol-layerswitcher.css';
import router from './router/index'
import App from './App.vue'

Vue.use(ElementUI)

Vue.config.productionTip = false

new Vue({
  render: h => h(App),
  router: router,
  data: {
    eventHub: new Vue()
  }
}).$mount('#app')
