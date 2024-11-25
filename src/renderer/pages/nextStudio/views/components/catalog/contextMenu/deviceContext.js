import {
  closeDevice,
  enterDebugMode,
  generateConfigFile,
  openProjectDir,
  quitDebugMode,
  renameDevice
} from '@/renderer/pages/nextStudio/action'

// 分隔符
export const DIVIDE_CONTEXT = {
  title: 'divide',
  clickFunc: '',
  icon: '',
  disabled: false
}

// 生成配置文件
const generateConfigFileMenu = () => ({
  title: 'generateConfigFile',
  clickFunc: generateConfigFile,
  icon: '',
  disabled: false
})

// 逻辑页面调试
const debugLogicPageMenu = (debugMode) => ({
  title: debugMode ? 'quitDebugMode' : 'enterDebugMode',
  clickFunc: debugMode ? quitDebugMode : enterDebugMode,
  icon: '',
  disabled: false
})
// 重命名装置
const renameDeviceMenu = () => ({
  title: 'renameDevice',
  clickFunc: renameDevice,
  icon: '',
  disabled: false
})
// 打开文件夹
const showInExplorerMenu = () => ({
  title: 'showInExplorer',
  clickFunc: openProjectDir,
  icon: '',
  disabled: false
})
// 关闭装置
const closeProjectMenu = (debugMode) => ({
  title: 'closeDevice',
  clickFunc: closeDevice,
  icon: '',
  disabled: debugMode
})

export const DeviceContext = (debugMode = false) => {
  return [
    generateConfigFileMenu(),
    DIVIDE_CONTEXT,
    showInExplorerMenu(),
    DIVIDE_CONTEXT,
    debugLogicPageMenu(debugMode),
    DIVIDE_CONTEXT,
    renameDeviceMenu(),
    DIVIDE_CONTEXT,
    closeProjectMenu(debugMode)
  ]
}
