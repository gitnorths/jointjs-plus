import * as R from 'ramda'
import Vue from 'vue'

const catalogStore = {
  state: {
    archiveList: [],
    currentTreeNodeData: null
  },
  getters: {
    archiveList: (state) => {
      return state.archiveList
    },
    currentTreeNodeData: (state) => {
      return state.currentTreeNodeData
    }
  },
  mutations: {
    addArchiveToStore (state, archive) {
      Vue.set(state.archiveList, state.archiveList.length, archive)
    },
    removeArchiveFromStore (state, archive) {
      const index = R.findIndex(R.propEq(archive.pathId, 'pathId'))(state.archiveList)
      if (index >= 0) {
        Vue.delete(state.archiveList, index)
      }
    },
    clearArchiveStore (state) {
      state.archiveList = []
    },
    setCurrentTreeNodeData (state, treeNodeData) {
      state.currentTreeNodeData = treeNodeData
    }
  },
  actions: {}
}

export default catalogStore
