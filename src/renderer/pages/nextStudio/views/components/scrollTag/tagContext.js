import {
  closeAllTabs,
  closeLeftTabs,
  closeOtherTabs,
  closeRightTabs,
  closeTab
} from '@/renderer/pages/nextStudio/action'

const closeTabMenu = {
  title: 'closeTab',
  clickFunc: closeTab,
  icon: '',
  disabled: false
}
const closeOtherTabsMenu = {
  title: 'closeOtherTabs',
  clickFunc: closeOtherTabs,
  icon: '',
  disabled: false
}
const closeLeftTabsMenu = {
  title: 'closeLeftTabs',
  clickFunc: closeLeftTabs,
  icon: '',
  disabled: false
}
const closeRightTabsMenu = {
  title: 'closeRightTabs',
  clickFunc: closeRightTabs,
  icon: '',
  disabled: false
}
const closeAllTabsMenu = {
  title: 'closeAllTabs',
  clickFunc: closeAllTabs,
  icon: '',
  disabled: false
}

const DIVIDE_CONTEXT = {
  title: 'divide',
  clickFunc: '',
  icon: '',
  disabled: false
}

export const TagContext = [
  closeTabMenu,
  closeOtherTabsMenu,
  DIVIDE_CONTEXT,
  closeLeftTabsMenu,
  closeRightTabsMenu,
  DIVIDE_CONTEXT,
  closeAllTabsMenu
]
