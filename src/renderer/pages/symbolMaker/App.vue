<template>
  <div id="app">
    <symbol-maker-layout></symbol-maker-layout>
  </div>
</template>

<script>
import SymbolMakerLayout from '@/renderer/pages/symbolMaker/views/components/layout.vue'
import { ipcRenderer } from 'electron'
import { closeSymbolMakerAction } from '@/renderer/pages/symbolMaker/action'

export default {
  name: 'app',
  components: { SymbolMakerLayout },
  mounted () {
    ipcRenderer.on('sm-window-close', () => {
      closeSymbolMakerAction()
    })
  }
}
</script>

<style lang="scss">
html, body, #app {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
}

#app {
  .el-loading-mask {
    z-index: 10000;
  }
}

.icon {
  width: 1em;
  height: 1em;
  vertical-align: -0.15em;
  fill: currentColor;
  overflow: hidden;
}
</style>
