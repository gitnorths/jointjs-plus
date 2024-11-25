<template>
  <div id="window_menu"/>
</template>

<script>
import * as R from 'ramda'
import {
  changeWindowCatalogViewVisibleStatus,
  changeWindowOutputViewVisibleStatus,
  changeWindowVariableViewVisibleStatus,
  clearRecentAction,
  closeDevice,
  closeTab,
  getRecentAction,
  lastTab,
  newDeviceAction,
  nextTab,
  openDeviceAction,
  openRecentDeviceAction,
  save,
  search,
  showPreferenceDialog,
  showVersionInfoAction
} from '@/renderer/pages/nextStudio/action'
import { generateMenus, openHelpWindow } from '@/renderer/common/action'

const { Menu, getCurrentWindow } = require('@electron/remote')

export default {
  name: 'windowMenu',
  watch: {},
  computed: {
    catalogVisible () {
      return this.$store.getters.windowCatalogViewVisible
    },
    varVisible () {
      return this.$store.getters.windowVariableViewVisible
    },
    outputVisible () {
      return this.$store.getters.windowOutputViewVisible
    }
  },
  data () {
    return {}
  },
  methods: {
    getRecentOpenedFile () {
      const recentMenus = []
      const recentFiles = getRecentAction()
      if (R.isNotEmpty(recentFiles)) {
        recentFiles.forEach(filePath => {
          recentMenus.push({
            title: { key: filePath },
            clickFunc: openRecentDeviceAction,
            args: filePath
          })
        })
        recentMenus.push({ title: 'clearRecent', clickFunc: clearRecentAction })
      }
      return recentMenus
    },
    init () {
      document.title = 'NEXT Studio'
      const file = {
        title: 'file',
        children: [
          { title: 'new', clickFunc: newDeviceAction, accelerator: 'CmdOrCtrl+N' },
          { title: 'open', clickFunc: openDeviceAction, accelerator: 'CmdOrCtrl+O' },
          { title: 'save', clickFunc: save, accelerator: 'CmdOrCtrl+S' },
          { title: 'recentFiles', children: this.getRecentOpenedFile() },
          { divide: true },
          { title: 'close', clickFunc: closeDevice, accelerator: 'CmdOrCtrl+W' },
          { title: 'exit', clickFunc: close }
        ]
      }
      const edit = {
        title: 'edit',
        children: [
          { title: 'search', clickFunc: search, accelerator: 'CmdOrCtrl+F' }
        ]
      }
      const view = {
        title: 'view',
        children: [
          { title: 'lastTab', clickFunc: lastTab, accelerator: 'CmdOrCtrl+Alt+left' },
          { title: 'nextTab', clickFunc: nextTab, accelerator: 'CmdOrCtrl+Alt+right' },
          { title: 'closeTab', clickFunc: closeTab, accelerator: 'CmdOrCtrl+Alt+down' },
          { divide: true },
          {
            title: 'windowCatalogView',
            type: 'checkbox',
            checked: this.catalogVisible,
            clickFunc: changeWindowCatalogViewVisibleStatus
          },
          {
            title: 'windowVariableView',
            type: 'checkbox',
            checked: this.varVisible,
            accelerator: 'CmdOrCtrl+Shift+V',
            clickFunc: changeWindowVariableViewVisibleStatus
          },
          {
            title: 'windowOutputView',
            type: 'checkbox',
            checked: this.outputVisible,
            accelerator: 'CmdOrCtrl+Shift+M',
            clickFunc: changeWindowOutputViewVisibleStatus
          }
        ]
      }
      const setting = {
        title: 'setting',
        children: [
          { title: 'preference', clickFunc: showPreferenceDialog }
        ]
      }
      const about = {
        title: 'about',
        children: [
          { title: 'help', clickFunc: openHelpWindow('nextStudio') },
          { title: 'versionInfo', clickFunc: showVersionInfoAction }
        ]
      }

      const menu = new Menu()
      const menus = []
      generateMenus([file, edit, view, setting, about], menus, this.$i18n)
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

<style lang="scss" scoped>

</style>
