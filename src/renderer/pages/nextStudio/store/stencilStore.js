const StencilStore = {
  state: {
    currentStencil: null
  },
  getters: {
    currentStencil: (state) => {
      return state.currentStencil
    }
  },
  mutations: {
    setCurrentStencil (state, currentStencil) {
      state.currentStencil = currentStencil
    }
  },
  actions: {}
}

export default StencilStore
