import {
  closeSymbolAllTabs,
  closeSymbolLeftTabs,
  closeSymbolOtherTabs,
  closeSymbolRightTabs,
  closeSymbolCurrentTab
} from '@/renderer/pages/symbolMaker/action'

const closeTab = {
  title: 'closeTab',
  clickFunc: closeSymbolCurrentTab,
  icon: '',
  disabled: false
}
const closeOtherTabs = {
  title: 'closeOtherTabs',
  clickFunc: closeSymbolOtherTabs,
  icon: '',
  disabled: false
}
const closeLeftTabs = {
  title: 'closeLeftTabs',
  clickFunc: closeSymbolLeftTabs,
  icon: '',
  disabled: false
}
const closeRightTabs = {
  title: 'closeRightTabs',
  clickFunc: closeSymbolRightTabs,
  icon: '',
  disabled: false
}
const closeAllTabs = {
  title: 'closeAllTabs',
  clickFunc: closeSymbolAllTabs,
  icon: '',
  disabled: false
}
// 分隔符
const DIVIDE_CONTEXT = {
  title: 'divide',
  clickFunc: '',
  icon: '',
  disabled: false
}

export const TagContext = [
  closeTab,
  closeOtherTabs,
  DIVIDE_CONTEXT,
  closeLeftTabs,
  closeRightTabs,
  DIVIDE_CONTEXT,
  closeAllTabs
]
