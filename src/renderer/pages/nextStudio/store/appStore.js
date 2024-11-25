const appStore = {
  state: {
    showCatalogView: false,
    showVariableView: false,
    showOutputView: false
  },
  getters: {
    windowCatalogViewVisible: (state) => {
      return state.showCatalogView
    },
    windowVariableViewVisible: (state) => {
      return state.showVariableView
    },
    windowOutputViewVisible: (state) => {
      return state.showOutputView
    }
  },
  mutations: {
    setWindowCatalogViewIsVisible (state, visible) {
      state.showCatalogView = visible
    },
    setWindowVariableViewIsVisible (state, visible) {
      state.showVariableView = visible
    },
    setWindowOutputViewIsVisible (state, visible) {
      state.showOutputView = visible
    }
  }
}

export default appStore
