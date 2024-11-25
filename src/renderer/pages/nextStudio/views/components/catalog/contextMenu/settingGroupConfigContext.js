import {
  changeAttrSettingGroup,
  createManageGroup,
  createSubGroup,
  deleteGroup,
  manageGroupChangeAttr,
  setSetValueParam
} from '@/renderer/pages/nextStudio/action'
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
// 新建定值组
const createSubSettingGroupMenu = (debugMode = false) => ({
  title: 'createSubSettingGroup',
  clickFunc: createSubGroup,
  icon: '',
  disabled: debugMode
})
// 设置定值区数目
const setSetValueParamMenu = (debugMode = false) => ({
  title: 'setSetValueParam',
  clickFunc: setSetValueParam,
  icon: '',
  disabled: debugMode
})
// 修改属性
const changeAttrMenu = (debugMode = false) => ({
  title: 'changeAttr',
  clickFunc: manageGroupChangeAttr,
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
// 修改定值分组属性
const changeAttrSettingGroupMenu = (debugMode = false) => ({
  title: 'changeAttr',
  clickFunc: changeAttrSettingGroup,
  icon: '',
  disabled: debugMode
})
export const SettingGroupConfigContext = (debugMode = false) => {
  return [
    createManageGroupMenu(debugMode),
    DIVIDE_CONTEXT,
    setSetValueParamMenu(debugMode)
  ]
}
export const SettingManageGroupContext = (debugMode = false) => {
  return [
    createSubSettingGroupMenu(debugMode),
    DIVIDE_CONTEXT,
    changeAttrMenu(debugMode),
    DIVIDE_CONTEXT,
    deleteGroupMenu(debugMode)
  ]
}
export const SettingGroupContext = (debugMode = false) => {
  return [
    changeAttrSettingGroupMenu(debugMode),
    DIVIDE_CONTEXT,
    deleteGroupMenu(debugMode)
  ]
}
