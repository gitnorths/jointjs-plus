<template>
  <div class="blockPage" style="height: 100%;width: 100%">
    <split :gutter-size="gutterSize" style="height: 100%">
      <split-area :size="tabSize" :minSize="650">
        <div class="formArea">
          <model-page :tag-key="tagKey" @syncIOP="syncIOP"/>
        </div>
      </split-area>
      <split-area :size="100-tabSize" :minSize="280">
        <div class="stencilArea">
          <stencil-page :tag-key="tagKey" ref="stencil"/>
        </div>
      </split-area>
    </split>
  </div>
</template>
<script>
import ModelPage from './modelPage/index.vue'
import StencilPage from './modelPage/blockShape.vue'
import VueSplit from 'vue-split-panel'
import { SymbolBlockConstants } from '@/renderer/pages/symbolMaker/views/components/workArea/workAreaConfig'

const { Split, SplitArea } = VueSplit

export default {
  name: 'SymbolBlockVersionView',
  components: {
    Split,
    SplitArea,
    ModelPage,
    StencilPage
  },
  data () {
    return {
      tabSize: 70,
      gutterSize: 8
    }
  },
  props: ['tagKey'],
  computed: {},
  methods: {
    syncIOP (iop, row, input, type) {
      // FIXME 尝试不通过input和type来区分
      switch (iop) {
        case SymbolBlockConstants.inputs:
          this.$refs.stencil.syncInputs(row, input, type)
          break
        case SymbolBlockConstants.outputs:
          this.$refs.stencil.syncOutputs(row, input, type)
          break
      }
    },
    toggleLeftPanel (isActive, isEdit) {
      if (isActive && isEdit) {
        this.tabSize = 50
        this.gutterSize = 8
      } else if (isActive) {
        this.tabSize = 80
        this.gutterSize = 8
      } else {
        this.tabSize = 0
        this.gutterSize = 0
      }
    }
  }
}
</script>

<style scoped>
.formArea {
  height: 100%;
}

.stencilArea {
  height: 100%;
}
</style>
