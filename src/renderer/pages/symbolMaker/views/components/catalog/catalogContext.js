import { closeSymbolArchive, deleteNode, exportPkg } from '@/renderer/pages/symbolMaker/action'
import store from '@/renderer/pages/symbolMaker/store'

// 分隔符
const DIVIDE_CONTEXT = {
  title: 'divide',
  clickFunc: '',
  icon: '',
  disabled: false
}

// 删除节点
const deleteNodeMenu = {
  title: 'delete',
  clickFunc: deleteNode,
  icon: '',
  disabled: false
}

// 修改符号
const editSymbolBlockMenu = {
  title: 'editProperty',
  clickFunc: () => {
    store.commit('setUpdate', true)
    store.commit('setSymbolBlockDialogVisible', true)
  },
  icon: '',
  disabled: false
}

// FIXME
export const catalogSymbolBlockContext = [
  editSymbolBlockMenu,
  DIVIDE_CONTEXT,
  deleteNodeMenu
]

// 新建符号块
const newSymbolBlockMenu = {
  title: 'newSymbolBlock',
  clickFunc: () => {
    store.commit('setSymbolBlockDialogVisible', true)
  },
  icon: '',
  disabled: false
}
// 修改符号库
const editSymbolLibMenu = {
  title: 'editProperty',
  clickFunc: () => {
    store.commit('setUpdate', true)
    store.commit('setSymbolLibDialogVisible', true)
  },
  icon: '',
  disabled: false
}

export const catalogSymbolLibContext = [
  newSymbolBlockMenu,
  DIVIDE_CONTEXT,
  editSymbolLibMenu,
  DIVIDE_CONTEXT,
  deleteNodeMenu
]

// 新建符号库
const newSymbolLibMenu = {
  title: 'newSymbolLib',
  clickFunc: () => {
    store.commit('setSymbolLibDialogVisible', true)
  },
  icon: '',
  disabled: false
}
const editSymbolArchiveMenu = {
  title: 'editProperty',
  clickFunc: () => {
    store.commit('setUpdate', true)
    store.commit('setArchiveDialogVisible', true)
  },
  icon: '',
  disabled: false
}
// 发布符号块包
const exportArchiveMenu = {
  title: 'exportPkg',
  clickFunc: exportPkg,
  icon: '',
  disabled: false
}
// 关闭符号块包
const closeArchiveMenu = {
  title: 'close',
  clickFunc: closeSymbolArchive,
  icon: '',
  disabled: false
}
// 符号仓右键菜单
export const catalogSymbolArchiveContext = [
  newSymbolLibMenu,
  DIVIDE_CONTEXT,
  editSymbolArchiveMenu,
  DIVIDE_CONTEXT,
  exportArchiveMenu,
  DIVIDE_CONTEXT,
  closeArchiveMenu
]
