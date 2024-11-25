import Vue from 'vue'
import * as R from 'ramda'

const vfbInstDialogStore = {
  state: {
    visible: false,
    vfbInst: null,
    vfbDelta: {
      basicInfo: null,
      input: null,
      output: null,
      param: null,
      interlockStatus: null
    }
  },
  getters: {
    vfbDialogVisible: (state) => {
      return state.visible
    },
    vfbInst: (state) => {
      return state.vfbInst
    },
    vfbDelta: (state) => {
      return state.vfbDelta
    },
    vfbDeltaExist: (state) => {
      let exist = false
      const { basicInfo, input, output, param, interlockStatus } = state.vfbDelta
      if (basicInfo && R.isNotEmpty(basicInfo)) {
        exist = true
      }
      if (input && R.isNotEmpty(input)) {
        exist = true
      }
      if (output && R.isNotEmpty(output)) {
        exist = true
      }
      if (param && R.isNotEmpty(param)) {
        exist = true
      }
      if (interlockStatus && R.isNotEmpty(interlockStatus)) {
        exist = true
      }
      return exist
    }
  },
  mutations: {
    setVfbDialogVisible (state, visible) {
      state.visible = visible
    },
    setVfbInst (state, vfbInst) {
      state.vfbInst = vfbInst
    },
    recordVfbDelta (state, { key, delta }) {
      Vue.set(state.vfbDelta, key, delta)
    },
    clearVfbDelta (state) {
      Vue.set(state.vfbDelta, 'basicInfo', null)
      Vue.set(state.vfbDelta, 'input', null)
      Vue.set(state.vfbDelta, 'output', null)
      Vue.set(state.vfbDelta, 'param', null)
      Vue.set(state.vfbDelta, 'interlockStatus', null)
    }
  },
  actions: {}
}

export default vfbInstDialogStore
