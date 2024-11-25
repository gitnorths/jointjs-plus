<template>
  <div class="window_work_area">
    <symbol-archive-view v-if="showSymbolArchiveTag" :tag-key="tagKey"/>
    <symbol-block-version-view v-if="showSymbolBlockVersionTag" :tag-key="tagKey"/>
  </div>
</template>

<script>
import * as R from 'ramda'
import * as workAreaConfig from './workAreaConfig'
import SymbolArchiveView from './symbolArchiveView.vue'
import SymbolBlockVersionView from './symbolBlockVersionView/symbolBlockVersionView.vue'
import { getDtoClassName } from '@/renderer/common/util'

export default {
  name: 'windowWorkArea',
  components: {
    SymbolArchiveView,
    SymbolBlockVersionView
  },
  props: {
    tagKey: {
      type: String,
      required: true
    }
  },
  computed: {
    selectedType () {
      const selectedData = this.$store.getters.workTagsSelectDto(this.tagKey)
      return workAreaConfig.CLASS_VIEW_MAP[getDtoClassName(selectedData)]
    },
    showSymbolArchiveTag () {
      return R.equals(this.selectedType, workAreaConfig.SYMBOL_ARCHIVE_VIEW)
    },
    showSymbolBlockVersionTag () {
      return R.equals(this.selectedType, workAreaConfig.SYMBOL_BLOCK_VERSION_VIEW)
    }
  },
  methods: {}
}
</script>

<style scoped>
.window_work_area {
  height: 100%;
  width: 100%;
}
</style>
