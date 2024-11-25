const SearchStore = {
  state: {
    focusedVfbId: null,
    focusedSignalId: null
  },
  getters: {
    focusedVfbId: (state) => {
      return state.focusedVfbId
    },
    focusedSignalId: (state) => {
      return state.focusedSignalId
    }
  },
  mutations: {
    setFocusedVfbId (state, vfbId) {
      state.focusedVfbId = vfbId
    },
    setFocusedSignalId (state, memberId) {
      state.focusedSignalId = memberId
    }
  },
  actions: {}
}

export default SearchStore
