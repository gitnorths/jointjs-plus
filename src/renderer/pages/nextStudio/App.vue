<template>
  <div id="app">
    <studio-layout></studio-layout>
  </div>
</template>

<script>
import StudioLayout from '@/renderer/pages/nextStudio/views/components/layout.vue'
import { ipcRenderer } from 'electron'
import { closeNextStudioAction } from '@/renderer/pages/nextStudio/action'

export default {
  name: 'app',
  components: { StudioLayout },
  computed: {},
  mounted () {
    ipcRenderer.on('studio-window-close', () => {
      closeNextStudioAction()
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
