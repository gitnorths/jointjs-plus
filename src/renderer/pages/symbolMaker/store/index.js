import Vue from 'vue'
import Vuex from 'vuex'

import appStore from './appStore'
import catalogStore from './catalogStore'
import dialogStore from './dialogStore'
import workTagsStore from './workTagsStore'

Vue.use(Vuex)
export default new Vuex.Store({
  modules: {
    app: appStore,
    catalog: catalogStore,
    dialog: dialogStore,
    tags: workTagsStore
  }
})
