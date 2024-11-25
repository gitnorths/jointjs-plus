import * as menu from '@/renderer/common/action/electronApi'
import notification from '@/renderer/common/notification'
import vBus from '@/renderer/common/vbus'
import logger from '@/renderer/common/logger'

export default {
  install (Vue) {
    Vue.prototype.$logger = logger
    Vue.prototype.$vbus = vBus
    Vue.prototype.$menu = menu
    Vue.prototype.$notification = notification
  }
}
