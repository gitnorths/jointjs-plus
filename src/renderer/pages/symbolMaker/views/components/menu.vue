<template>
  <div id="sm_menu"/>
</template>

<script>
import * as R from 'ramda'
import {
  changeSymbolCatalogViewVisibleStatus,
  changeSymbolOutputViewVisibleStatus,
  clearRecentAction,
  closeAllPkg,
  closeSymbolCurrentTab,
  closeSymbolMakerAction,
  getRecentAction,
  lastSymbolTab,
  newSymbolArchiveAction,
  nextSymbolTab,
  openRecentArchiveAction,
  openSymbolArchiveAction,
  saveAllAction,
  showVersionInfoAction
} from '@/renderer/pages/symbolMaker/action'
import { generateMenus, openHelpWindow } from '@/renderer/common/action'

const { Menu, getCurrentWindow } = require('@electron/remote')

export default {
  name: 'seMenu',
  computed: {
    catalogVisible () {
      return this.$store.getters.symbolCatalogViewVisible
    },
    outputVisible () {
      return this.$store.getters.symbolOutputViewVisible
    }
  },
  methods: {
    getRecentFolder () {
      const recentMenus = []
      const array = getRecentAction()
      if (R.isNotEmpty(array)) {
        array.forEach(filePath => {
          recentMenus.push({
            title: { key: filePath },
            clickFunc: openRecentArchiveAction,
            args: filePath
          })
        })
      }
      recentMenus.push({ title: 'clearRecent', clickFunc: clearRecentAction })
      return recentMenus
    },
    init () {
      document.title = 'Symbol Maker'
      const file = {
        title: 'file',
        children: [
          { title: 'new', clickFunc: newSymbolArchiveAction, accelerator: 'CmdOrCtrl+N' },
          { title: 'open', clickFunc: openSymbolArchiveAction, accelerator: 'CmdOrCtrl+O' },
          { title: 'save', clickFunc: saveAllAction, accelerator: 'CmdOrCtrl+S' },
          { title: 'recentFiles', children: this.getRecentFolder() },
          { divide: true },
          { title: 'closeAll', clickFunc: closeAllPkg, accelerator: 'CmdOrCtrl+W' },
          { title: 'exit', clickFunc: closeSymbolMakerAction }
        ]
      }
      const view = {
        title: 'view',
        children: [
          { title: 'lastTab', clickFunc: lastSymbolTab, accelerator: 'CmdOrCtrl+Alt+left' },
          { title: 'nextTab', clickFunc: nextSymbolTab, accelerator: 'CmdOrCtrl+Alt+right' },
          { title: 'closeTab', clickFunc: closeSymbolCurrentTab, accelerator: 'CmdOrCtrl+Alt+down' },
          { divide: true },
          {
            title: 'windowCatalogView',
            type: 'checkbox',
            checked: this.catalogVisible,
            accelerator: 'CmdOrCtrl+Shift+V',
            clickFunc: changeSymbolCatalogViewVisibleStatus
          },
          {
            title: 'windowOutputView',
            type: 'checkbox',
            checked: this.outputVisible,
            accelerator: 'CmdOrCtrl+Shift+M',
            clickFunc: changeSymbolOutputViewVisibleStatus
          }
        ]
      }
      const about = {
        title: 'about',
        children: [
          { title: 'help', clickFunc: openHelpWindow('symbolMaker') },
          { title: 'versionInfo', clickFunc: showVersionInfoAction }
        ]
      }
      const menu = new Menu()
      const menus = []
      generateMenus([file, view, about], menus, this.$i18n)
      menus.forEach((menuItem) => menu.append(menuItem))

      const currentWindow = getCurrentWindow()
      currentWindow.setMenu(menu)
    }
  },
  mounted () {
    this.init()
    this.$vbus.$on('REFRESH_MENU_BAR', this.init)
  },
  destroyed () {
    this.$vbus.$off('REFRESH_MENU_BAR', this.init)
  }
}
</script>

<style scoped>

</style>
