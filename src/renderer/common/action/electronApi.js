/* global __static */
import * as R from 'ramda'
import { clipboard, ipcRenderer } from 'electron'
import { getCurrentWindow, Menu, MenuItem } from '@electron/remote'

const path = require('path')
// FIXME 内容加解密
export const copyText = (text) => {
  clipboard.writeText(text)
}

// FIXME 内容加解密
export const pasteText = () => {
  return clipboard.readText()
}

export const openWindowDialog = (options) => {
  return ipcRenderer.invoke('dialog:openFile', options)
}

export const openSaveDialog = (options) => {
  return ipcRenderer.invoke('dialog:openSave', options)
}

export const generateMenus = (items, array, i18n, obj) => {
  items.forEach((item) => {
    if (item.divide || R.equals('divide', item.title)) {
      array.push(new MenuItem({ type: 'separator' }))
    } else {
      const label = item.title && typeof item.title === 'object' ? item.title.key : i18n.t(`contextmenu.${item.title}`)
      const option = {
        label,
        type: R.propOr('normal', 'type', item),
        id: item.type === 'checkbox' ? item.title : undefined,
        checked: item.checked,
        accelerator: R.propOr(undefined, 'accelerator', item),
        icon: item.icon ? path.join(__static, item.icon) : undefined,
        enabled: !item.disabled,
        click: () => {
          if (R.isNotNil(item.clickFunc) && item.clickFunc instanceof Function) {
            item.clickFunc(obj || item.args)
          }
        },
        submenu: []
      }

      if (item.children instanceof Array && item.children.length > 0) {
        option.type = 'submenu'
        generateMenus(item.children, option.submenu, i18n, obj)
      }
      array.push(new MenuItem(option))
    }
  })
}

export const open = (obj, items, i18n) => {
  if (items.length < 1) {
    return // 若列表为空则不显示上下文菜单
  }
  const menu = new Menu()
  const menus = []

  generateMenus(items, menus, i18n, obj)
  menus.forEach((menuItem) => {
    menu.append(menuItem)
  })
  menu.popup({
    window: getCurrentWindow()
  })
}

export const openHelpWindow = (part) => () => {
  ipcRenderer.send('open-help-window', part)
}

export const openUrl = (address) => {
  ipcRenderer.send('shell:openExternal', address)
}
