const symbolAppStore = {
  state: {
    showCatalogView: false,
    showOutputView: false
  },
  getters: {
    symbolCatalogViewVisible: (state) => {
      return state.showCatalogView
    },
    symbolOutputViewVisible: (state) => {
      return state.showOutputView
    }
  },
  mutations: {
    setSymbolCatalogViewIsVisible (state, visible) {
      state.showCatalogView = visible
    },
    setSymbolOutputViewIsVisible (state, visible) {
      state.showOutputView = visible
    }
  },
  actions: {}
}

export default symbolAppStore
