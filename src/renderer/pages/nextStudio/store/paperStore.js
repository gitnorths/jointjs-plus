const PaperStore = {
  state: {
    commandManager: null,
    currentPaper: null,
    snaplines: null,
    graph: null,
    paper: null
  },
  getters: {
    commandManager: (state) => {
      return state.commandManager
    },
    currentPaper: (state) => {
      return state.currentPaper
    },
    snaplines: (state) => {
      return state.snaplines
    },
    graph: (state) => {
      return state.graph
    },
    paper: (state) => {
      return state.paper
    }
  },
  mutations: {
    setCommandManager (state, commandManager) {
      state.commandManager = commandManager
    },
    setCurrentPaper (state, currentPaper) {
      state.currentPaper = currentPaper
    },
    setSnaplines (state, snaplines) {
      state.snaplines = snaplines
    },
    setGraph (state, graph) {
      state.graph = graph
    },
    setPaper (state, paper) {
      state.paper = paper
    }
  },
  actions: {}
}

export default PaperStore
