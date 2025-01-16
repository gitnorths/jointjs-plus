const PaperStore = {
  state: {
    currentPaper: null
  },
  getters: {
    currentPaper: (state) => {
      return state.currentPaper
    }
  },
  mutations: {
    setCurrentPaper (state, currentPaper) {
      state.currentPaper = currentPaper
    }
  },
  actions: {}
}

export default PaperStore
