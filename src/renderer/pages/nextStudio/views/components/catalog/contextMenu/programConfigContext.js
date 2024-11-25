import {
  addPageFooter,
  copyPage,
  createPage,
  createProcess,
  deletePage,
  deletePageFooter,
  deleteProcess,
  deleteProgramBoard,
  pastePage,
  showTaskLevel,
  updatePage,
  updateProcess
} from '@/renderer/pages/nextStudio/action'
import { YesNoEnum } from '@/model/enum'
// 分隔符
export const DIVIDE_CONTEXT = {
  title: 'divide',
  clickFunc: '',
  icon: '',
  disabled: false
}
// 新建snippet分组
const createPGSnippetMenu = (debugMode = false) => ({
  title: 'createPGSnippet',
  clickFunc: () => null,
  icon: '',
  disabled: debugMode
})

// 修改进程属性
const updatePGSnippetMenu = (debugMode = false) => ({
  title: 'changeAttr',
  clickFunc: () => null,
  icon: '',
  disabled: debugMode
})
// 新建snippet分组
const deletePGSnippetMenu = (debugMode = false) => ({
  title: 'deletePGSnippet',
  clickFunc: () => null,
  icon: './icon/delete.png',
  disabled: debugMode
})
// 删除板卡
const deleteProgramBoardMenu = (debugMode = false) => ({
  title: 'deleteProgramBoard',
  clickFunc: deleteProgramBoard,
  icon: './icon/delete.png',
  disabled: debugMode
})
// 新建进程
const createProcessMenu = (debugMode = false) => ({
  title: 'createProcess',
  clickFunc: createProcess,
  icon: '',
  disabled: debugMode
})
// 修改进程属性
const updateProcessMenu = (debugMode = false) => ({
  title: 'changeAttr',
  clickFunc: updateProcess,
  icon: '',
  disabled: debugMode
})
// 查看任务调度
const showTaskLevelMenu = () => ({
  title: 'showTaskLevel',
  clickFunc: showTaskLevel,
  icon: '',
  disabled: false
})
// 删除进程
const deleteProcessMenu = (debugMode = false) => ({
  title: 'deleteProcess',
  clickFunc: deleteProcess,
  icon: './icon/delete.png',
  disabled: debugMode
})

// 新建页面
const createPageMenu = (debugMode = false) => ({
  title: 'createPage',
  clickFunc: createPage,
  icon: '',
  disabled: debugMode
})
// 修改页面属性
const updatePageMenu = (debugMode = false) => ({
  title: 'changeAttr',
  clickFunc: updatePage,
  icon: '',
  disabled: debugMode
})
// 复制页面
const copyPageMenu = (debugMode = false) => ({
  title: 'copyPage',
  clickFunc: copyPage,
  icon: '',
  disabled: debugMode
})
// 粘贴页面
const pastePageMenu = (debugMode = false) => ({
  title: 'pastePage',
  clickFunc: pastePage,
  icon: '',
  disabled: debugMode
})
// 页面删除
const deletePageMenu = (debugMode = false) => ({
  title: 'deletePage',
  clickFunc: deletePage,
  icon: './icon/delete.png',
  disabled: debugMode
})
// 添加页脚
const addPageFooterMenu = (debugMode = false) => ({
  title: 'addPageFooter',
  clickFunc: addPageFooter,
  icon: '',
  disabled: debugMode
})
// 删除页脚
const deletePageFooterMenu = (debugMode = false) => ({
  title: 'deletePageFooter',
  clickFunc: deletePageFooter,
  icon: '',
  disabled: debugMode
})
// make
const makeAllMenu = (debugMode = false) => (
  {
    title: 'makeAll',
    clickFunc: null,
    icon: '',
    disabled: debugMode
  }
)
const makeCleanMenu = (debugMode = false) => (
  {
    title: 'makeClean',
    clickFunc: null,
    icon: '',
    disabled: debugMode
  }
)

export const ProgramSnippetContext = (debugMode = false) => {
  return [createPGSnippetMenu(debugMode)]
}

export const PGSnippetContext = (debugMode = false) => {
  return [
    updatePGSnippetMenu(debugMode),
    DIVIDE_CONTEXT,
    createPageMenu(debugMode),
    deletePGSnippetMenu(debugMode)
  ]
}

export const ProgramBoardContext = (debugMode = false) => (
  [deleteProgramBoardMenu(debugMode)]
)

export const CoreContext = (debugMode = false, dto) => {
  // FIXME CPU核才允许新建进程
  if (dto && /CPU/i.test(dto.desc)) {
    return [
      createProcessMenu(debugMode),
      DIVIDE_CONTEXT,
      makeAllMenu(debugMode),
      makeCleanMenu(debugMode)
    ]
  } else {
    return [
      createPageMenu(debugMode),
      DIVIDE_CONTEXT,
      makeAllMenu(debugMode),
      makeCleanMenu(debugMode)
    ]
  }
}

export const ProcessContext = (debugMode = false) => {
  return [
    showTaskLevelMenu(), // FIXME
    DIVIDE_CONTEXT,
    updateProcessMenu(debugMode),
    DIVIDE_CONTEXT,
    deleteProcessMenu(debugMode),
    DIVIDE_CONTEXT,
    createPageMenu(debugMode),
    pastePageMenu(debugMode)
  ]
}

export const PageContext = (debugMode = false, dto) => {
  if (dto && dto.isFolder === YesNoEnum.YES) {
    return [
      updatePageMenu(debugMode),
      createPageMenu(),
      DIVIDE_CONTEXT,
      copyPageMenu(debugMode), // FIXME 复制页面
      pastePageMenu(debugMode),
      deletePageMenu(debugMode)
    ]
  } else {
    return [
      updatePageMenu(debugMode),
      DIVIDE_CONTEXT,
      copyPageMenu(debugMode),
      deletePageMenu(debugMode),
      DIVIDE_CONTEXT,
      addPageFooterMenu(debugMode), // FIXME snippet没有
      deletePageFooterMenu(debugMode)
      // TODO 添加到Snippet
    ]
  }
}
