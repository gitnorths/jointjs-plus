import Vue from 'vue'
import Vuex from 'vuex'

import appStore from './appStore'
import DeviceStore from './DeviceStore'
import VarTreeConfigStore from './VarTreeConfigStore'
import workTagsStore from './workTagsStore'
import vfbInstDialogStore from './vfbInstDialogStore'
import DebugModeStore from './debugModeStore'
import SearchStore from './searchStore'
import VfbUpdateStore from './vfbUpdateStore'
import PaperStore from './paperStore'

Vue.use(Vuex)
export default new Vuex.Store({
  modules: {
    appStore,
    VarTreeConfigStore,
    dtoStore: DeviceStore,
    workTagsStore,
    vfbInstDialogStore,
    DebugModeStore,
    SearchStore,
    VfbUpdateStore,
    PaperStore
  }
})
