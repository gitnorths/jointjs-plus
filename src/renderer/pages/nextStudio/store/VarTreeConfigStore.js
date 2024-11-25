const VarTreeConfigStore = {
  state: {
    dragValue: null,
    inputVarTreeCfg: null,
    outputVarTreeCfg: null,
    paramVarTreeCfg: null,
    customVarTreeCfg: null,
    symbolVarTreeCfg: null,
    varTreeLoading: false
  },
  getters: {
    getDragData: (state) => {
      return state.dragValue
    },
    inputVarTreeCfg: (state) => {
      return state.inputVarTreeCfg
    },
    outputVarTreeCfg: (state) => {
      return state.outputVarTreeCfg
    },
    paramVarTreeCfg: (state) => {
      return state.paramVarTreeCfg
    },
    customVarTreeCfg: (state) => {
      return state.customVarTreeCfg
    },
    symbolVarTreeCfg: (state) => {
      return state.symbolVarTreeCfg
    },
    varTreeLoading: (state) => {
      return state.varTreeLoading
    }
  },
  mutations: {
    setDragData: (state, value) => {
      state.dragValue = value
    },
    setVarTreeCfg: (state, { result }) => {
      state.inputVarTreeCfg = result.inputVarTreeCfg
      state.outputVarTreeCfg = result.outputVarTreeCfg
      state.paramVarTreeCfg = result.paramVarTreeCfg
      state.customVarTreeCfg = result.customVarTreeCfg
      state.symbolVarTreeCfg = result.symbolVarTreeCfg
    },
    setVarTreeLoading: (state, value) => {
      state.varTreeLoading = value
    },
    clearVarTreeStore: (state) => {
      state.dragValue = null
      state.inputVarTreeCfg = null
      state.outputVarTreeCfg = null
      state.paramVarTreeCfg = null
      state.customVarTreeCfg = null
      state.symbolVarTreeCfg = null
    }
  },
  actions: {}
}

export default VarTreeConfigStore
