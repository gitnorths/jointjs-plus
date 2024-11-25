import Vue from 'vue'
import VueI18n from 'vue-i18n'

import NA_ZH from '@/renderer/pages/nextStudio/i18n/na/zh'
import NA_EN from '@/renderer/pages/nextStudio/i18n/na/en'
import CONTEXTMENU_ZH from '@/renderer/pages/nextStudio/i18n/contextmenu/zh'
import CONTEXTMENU_EN from '@/renderer/pages/nextStudio/i18n/contextmenu/en'

Vue.use(VueI18n)

const messages = {
  zh: {
    ...NA_ZH,
    ...CONTEXTMENU_ZH
  },
  en: {
    ...NA_EN,
    ...CONTEXTMENU_EN
  }
}
const i18n = new VueI18n({
  locale: 'zh',
  messages
})

export default i18n
