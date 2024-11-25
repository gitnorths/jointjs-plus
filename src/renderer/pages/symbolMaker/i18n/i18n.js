import Vue from 'vue'
import VueI18n from 'vue-i18n'

import CONTEXTMENU_ZH from './zh'
import CONTEXTMENU_EN from './en'

Vue.use(VueI18n)

const messages = {
  zh: {
    ...CONTEXTMENU_ZH
  },
  en: {
    ...CONTEXTMENU_EN
  }
}
const i18n = new VueI18n({
  locale: 'zh',
  messages
})

export default i18n
