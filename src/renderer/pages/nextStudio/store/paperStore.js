const PaperStore = {
  state: {
    commandManager: null,
    currentPaper: null,
    selectedCells: [],
    selection: null
  },
  getters: {
    commandManager: (state) => {
      return state.commandManager
    },
    currentPaper: (state) => {
      return state.currentPaper
    },
    selectedCells: (state) => {
      return state.selectedCells
    },
    selection: (state) => {
      return state.selection
    }
  },
  mutations: {
    setCommandManager (state, commandManager) {
      state.commandManager = commandManager
    },
    setCurrentPaper (state, currentPaper) {
      state.currentPaper = currentPaper
    },
    setSelectedCells (state, selectedCells) {
      state.selectedCells = selectedCells
    },
    setSelection (state, selection) {
      state.selection = selection
    }
  },
  actions: {}
}

export default PaperStore
