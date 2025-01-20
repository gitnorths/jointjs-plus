import 'element-ui/lib/theme-chalk/index.css'
import '@/renderer/style/style.scss'
import '@/renderer/style/stencil.scss'
import 'vxe-table/lib/style.css'
import '@fortawesome/fontawesome-free/css/all.min.css'
import '@joint/plus/joint-plus.css'
import Vue from 'vue'
import App from './App.vue'
import store from '@/renderer/pages/nextStudio/store'
import i18n from '@/renderer/pages/nextStudio/i18n/i18n'
import plugin from '@/renderer/common/plugin'

import ElementUI from 'element-ui'

import 'xe-utils'
import VXETable from 'vxe-table'
import logger from '@/renderer/common/logger'

VXETable.setConfig({
  table: {
    scrollY: {
      gt: -1
    }
  }
})

Vue.use(VXETable)

Vue.use(ElementUI)
Vue.use(plugin)

Vue.config.productionTip = false

new Vue({
  store,
  i18n,
  plugin,
  render: h => h(App)
}).$mount('#app')

process.on('unhandledRejection', (error) => {
  logger.error(error)
})
