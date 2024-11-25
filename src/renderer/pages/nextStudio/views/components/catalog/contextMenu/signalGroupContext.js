import {
  createManageGroup,
  createSubGroup,
  deleteGroup,
  groupChangeAttr,
  manageGroupChangeAttr
} from '@/renderer/pages/nextStudio/action'
import { YesNoEnum } from '@/model/enum'
// 分隔符
export const DIVIDE_CONTEXT = {
  title: 'divide',
  clickFunc: '',
  icon: '',
  disabled: false
}
// 新建管理组
const createManageGroupMenu = (debugMode = false) => ({
  title: 'createManageGroup',
  clickFunc: createManageGroup,
  icon: '',
  disabled: debugMode
})
const createSubGroupMenu = (debugMode = false) => ({
  title: 'createSubGroup',
  clickFunc: createSubGroup,
  icon: '',
  disabled: debugMode
})
// 修改属性
const changeManageGroupAttrMenu = (debugMode = false) => ({
  title: 'changeAttr',
  clickFunc: manageGroupChangeAttr,
  icon: '',
  disabled: debugMode
})
// 修改属性
const changeGroupAttrMenu = (debugMode = false) => ({
  title: 'changeAttr',
  clickFunc: groupChangeAttr,
  icon: '',
  disabled: debugMode
})
// 删除组
const deleteGroupMenu = (debugMode = false) => ({
  title: 'deleteGroup',
  clickFunc: deleteGroup,
  icon: './icon/delete.png',
  disabled: debugMode
})
export const SignalGroupConfigContext = (debugMode = false) => {
  return [createManageGroupMenu(debugMode)]
}

export const SignalManageGroupContext = (debugMode = false, dto) => {
  if (dto && dto.reserved === YesNoEnum.YES) {
    return [
      createSubGroupMenu(debugMode)
    ]
  } else {
    return [
      createSubGroupMenu(debugMode),
      DIVIDE_CONTEXT,
      changeManageGroupAttrMenu(debugMode),
      DIVIDE_CONTEXT,
      deleteGroupMenu(debugMode)
    ]
  }
}

export const SignalGroupContext = (debugMode = false, dto) => {
  if (dto && dto.reserved === YesNoEnum.YES) {
    return []
  } else {
    return [
      changeGroupAttrMenu(debugMode),
      DIVIDE_CONTEXT,
      deleteGroupMenu(debugMode)
    ]
  }
}
