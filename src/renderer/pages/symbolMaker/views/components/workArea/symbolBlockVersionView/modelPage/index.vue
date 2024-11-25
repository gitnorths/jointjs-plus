<template>
  <el-tabs tab-position="top" type="border-card">
    <el-tab-pane label="基本属性">
      <basic-info-panel :tag-key="tagKey" ref="basicInfo"/>
    </el-tab-pane>
    <el-tab-pane label="输入">
      <inputs-table :tag-key="tagKey" ref="inputs" @syncIO="syncIOP"/>
    </el-tab-pane>
    <el-tab-pane label="输出">
      <outputs-table :tag-key="tagKey" ref="outputs" @syncIO="syncIOP"/>
    </el-tab-pane>
    <el-tab-pane label="定值参数">
      <params-table :tag-key="tagKey" ref="params" @syncIO="syncIOP"/>
    </el-tab-pane>
    <el-tab-pane label="内部参数">
      <inners-table :tag-key="tagKey" ref="inners"/>
    </el-tab-pane>
    <el-tab-pane label="其他变量">
      <others-table :tag-key="tagKey" ref="others"/>
    </el-tab-pane>
    <el-tab-pane label="头文件">
      <source-file-panel :tag-key="tagKey" prop-name="headFile"/>
    </el-tab-pane>
    <el-tab-pane label="源文件">
      <source-file-panel :tag-key="tagKey" prop-name="srcFile"/>
    </el-tab-pane>
  </el-tabs>
</template>

<script>
import BasicInfoPanel from './basicInfoPanel.vue'
import InputsTable from './inputsTable.vue'
import OutputsTable from './outputsTable.vue'
import ParamsTable from './paramsTable.vue'
import InnersTable from './innersTable.vue'
import OthersTable from './othersTable.vue'
import SourceFilePanel from './sourceFilePanel.vue'
import { SymbolMakerService } from '@/service/SymbolMakerService'

export default {
  name: 'ModelPage',
  components: {
    BasicInfoPanel,
    InputsTable,
    OutputsTable,
    ParamsTable,
    InnersTable,
    OthersTable,
    SourceFilePanel
  },
  props: ['tagKey'],
  data () {
    return {
      oldTab: '0',
      activeTab: '0'
    }
  },
  computed: {
    currentBlock () {
      return this.$store.getters.workTagsSelectDto(this.tagKey)
    }
  },
  methods: {
    async init () {
      // pathId忽略了大小写
      const archive = this.currentBlock.parent.parent.parent
      const symbolBlockVersion = await SymbolMakerService.openSymbolBlockVersion({
        archiveName: archive.name,
        pathId: this.currentBlock.pathId
      })
      this.currentBlock.name = symbolBlockVersion.name
      this.currentBlock.version = symbolBlockVersion.version
      this.currentBlock.desc = symbolBlockVersion.desc || ''
      this.currentBlock.help = symbolBlockVersion.help
      this.currentBlock.index = symbolBlockVersion.index
      this.currentBlock.modelFile = symbolBlockVersion.modelFile
      this.currentBlock.graphicFile = symbolBlockVersion.graphicFile
      this.currentBlock.headFile = symbolBlockVersion.headFile
      this.currentBlock.srcFile = symbolBlockVersion.srcFile
      this.currentBlock.libFile = symbolBlockVersion.libFile

      this.currentBlock.inputs = symbolBlockVersion.inputs || []
      this.currentBlock.outputs = symbolBlockVersion.outputs || []
      this.currentBlock.params = symbolBlockVersion.params || []
      this.currentBlock.inners = symbolBlockVersion.inners || []
      this.currentBlock.others = symbolBlockVersion.others || []
    },
    syncIOP (iop, row, input, type) {
      this.$emit('syncIOP', iop, row, input, type)
    },
    async reload () {
      await this.init()
      this.$refs.basicInfo.init()
      this.$refs.inputs.init()
      this.$refs.outputs.init()
      this.$refs.params.init()
      this.$refs.inners.init()
      this.$refs.others.init()
    }
  },
  created () {
    this.reload()
  },
  mounted () {
    this.$vbus.$on('RELOAD_SYMBOL_BLOCK_VERSION', this.reload)
  },
  destroyed () {
    this.$vbus.$off('RELOAD_SYMBOL_BLOCK_VERSION', this.reload)
  }
}
</script>

<style scoped>

</style>
