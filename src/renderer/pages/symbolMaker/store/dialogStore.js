const dialogStore = {
  state: {
    isUpdate: false,
    archiveDialogVisible: false, // 符号包弹窗
    llsymPath: '', // 导入符号包llsym文件路径
    symbolLibDialogVisible: false, // 符号库弹窗
    symbolBlockDialogVisible: false, // 新建符号弹窗
    batchEditVisible: false, // 批量编辑
    batchEditPayload: null,
    addRowsVisible: false, // 添加多行
    addRowsPayload: null
  },
  getters: {
    isUpdate: (state) => {
      return state.isUpdate
    },
    archiveDialogVisible: (state) => {
      return state.archiveDialogVisible
    },
    llsymPath: (state) => {
      return state.llsymPath
    },
    symbolBlockDialogVisible: (state) => {
      return state.symbolBlockDialogVisible
    },
    symbolLibDialogVisible: (state) => {
      return state.symbolLibDialogVisible
    },
    batchEditVisible: (state) => {
      return state.batchEditVisible
    },
    batchEditPayload: (state) => {
      return state.batchEditPayload
    },
    addRowsVisible: (state) => {
      return state.addRowsVisible
    },
    addRowsPayload: (state) => {
      return state.addRowsPayload
    }
  },
  mutations: {
    setUpdate (state, isUpdate) {
      state.isUpdate = isUpdate
    },
    setArchiveDialogVisible (state, visible) {
      state.archiveDialogVisible = visible
      if (!visible) {
        state.llsymPath = null
      }
    },
    setllsymPath (state, llsymPath) {
      state.llsymPath = llsymPath
    },
    setSymbolLibDialogVisible (state, visible) {
      state.symbolLibDialogVisible = visible
    },
    setSymbolBlockDialogVisible (state, visible) {
      state.symbolBlockDialogVisible = visible
    },
    openBatchEditDialog (state, payload) {
      state.batchEditVisible = true
      state.batchEditPayload = payload
    },
    closeBatchEditDialog (state) {
      state.batchEditVisible = false
      state.batchEditPayload = null
    },
    openAddRowsDialog (state, payload) {
      state.addRowsVisible = true
      state.addRowsPayload = payload
    },
    closeAddRowsDialog (state) {
      state.addRowsVisible = false
      state.addRowsPayload = null
    }
  },
  actions: {}
}

export default dialogStore
