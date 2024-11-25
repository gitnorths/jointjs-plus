import Vue from 'vue'

const VfbUpdateStore = {
  state: {
    pkgComparedResult: null,
    pathIdBindRecords: {
      vfbMap: {},
      inputMap: {},
      outputMap: {},
      paramMap: {}
    }
  },
  getters: {
    pkgComparedResult: (state) => {
      return state.pkgComparedResult
    },
    pathIdBindRecords: (state) => {
      return state.pathIdBindRecords
    }
  },
  mutations: {
    setPkgCompareResult (state, pkgComparedResult) {
      state.pkgComparedResult = pkgComparedResult
    },
    addBindRecord (state, record) {
      Vue.set(state.pathIdBindRecords[record.prop], record.source, record.target)
    },
    removeBindRecord (state, record) {
      Vue.delete(state.pathIdBindRecords[record.prop], record.source)
    },
    clearBindRecords (state) {
      state.pathIdBindRecords = {
        vfbMap: {},
        inputMap: {},
        outputMap: {},
        paramMap: {}
      }
    }
  },
  actions: {}
}

export default VfbUpdateStore
