const GraphStore = {
  state: {
    graphContainer: [],
    currentGraph: null
  },
  getters: {
    projectGraphContainer: (state) => {
      return state.graphContainer
    },
    currentGraph: (state) => {
      return state.currentGraph
    }
  },
  mutations: {
    clearGraphContainer (state) {
      state.graphContainer = []
    },
    addGraphToContainer (state, graph) {
      state.graphContainer.push(graph)
      state.currentGraph = graph
    },
    deleteGraphFromContainer (state, index) {
      state.graphContainer.splice(index, 1)
    },
    setCurrentGraph (state, graph) {
      state.currentGraph = graph
    }
  },
  actions: {}
}

export default GraphStore
