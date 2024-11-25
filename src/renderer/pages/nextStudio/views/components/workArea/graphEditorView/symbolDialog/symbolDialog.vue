<template>
  <vxe-modal v-model="dialogVisible"
             class="symbolDialog"
             :title="title"
             :width="dialogWidth"
             :height="dialogHeight"
             esc-closable
             show-close
             destroy-on-close
             resize
             :show-zoom="!debugMode"
             :showFooter="!debugMode"
             :lock-view="!debugMode"
             :position="position"
             :mask="!debugMode"
             :before-hide-method="beforeCloseHandler"
             transfer
             ref="modal">
    <el-tabs v-model="selectedTag" type="border-card">
      <el-tab-pane name="basicInfo">
        <template v-slot:label>
          <i class="fa fa-clone"></i> 基本信息 <span v-if="tagChanged('basicInfo')" class="tagChanged">*</span>
        </template>
        <basic-info-edit-table :page-graph="pageGraph" ref="basicInfo"/>
      </el-tab-pane>
      <el-tab-pane name="input" v-if="showInputPane">
        <template v-slot:label>
          <i class="fa fa-sign-in"></i> 输入 <span v-if="tagChanged('input')" class="tagChanged">*</span>
        </template>
        <input-edit-table :page-graph="pageGraph" ref="inputs"/>
      </el-tab-pane>
      <el-tab-pane name="output" v-if="showOutputPane">
        <template v-slot:label>
          <i class="fa fa-sign-out"></i> 输出 <span v-if="tagChanged('output')" class="tagChanged">*</span>
        </template>
        <output-edit-table :page-graph="pageGraph" ref="outputs"/>
      </el-tab-pane>
      <el-tab-pane name="param" v-if="showParamPane">
        <template v-slot:label>
          <i class="fa fa-inbox"></i> 参数 <span v-if="tagChanged('param')" class="tagChanged">*</span>
        </template>
        <param-edit-table :is-interlock="isInterlock" ref="params"/>
      </el-tab-pane>
      <el-tab-pane name="interlockStatus" v-if="isInterlock" v-show="!debugMode">
        <template v-slot:label>
          <i class="el-icon-date"></i> 联锁状态 <span v-if="tagChanged('interlockStatus')" class="tagChanged">*</span>
        </template>
        <status-edit-table ref="interlockStatus"/>
      </el-tab-pane>
      <el-tab-pane label="帮助" name="help" v-if="help">
        <textarea v-model="help" style="height: 100%; width:100%;resize: none;outline:none;" title="symbolDialog"
                  readonly>
        </textarea>
      </el-tab-pane>
    </el-tabs>
    <template v-slot:footer>
      <el-row type="flex" justify="center">
        <el-button @click="cancel">取消</el-button>
        <el-button @click="save" :disabled="!existVfbDelta" type="primary">确认</el-button>
      </el-row>
    </template>
  </vxe-modal>
</template>

<script>
import * as R from 'ramda'
import BasicInfoEditTable from './basicInfoEditTable.vue'
import InputEditTable from './inputEditTable.vue'
import OutputEditTable from './outputEditTable.vue'
import ParamEditTable from './paramEditTable.vue'
import StatusEditTable from './statusEditTable.vue'

export default {
  name: 'symbolDialog',
  components: { StatusEditTable, BasicInfoEditTable, ParamEditTable, OutputEditTable, InputEditTable },
  props: {
    graph: {
      required: true
    },
    pageGraph: {
      required: true
    }
  },
  data () {
    return {
      cell: null,
      dialogVisible: false,
      selectedTag: 'basicInfo',
      help: null
    }
  },
  computed: {
    debugMode () {
      return this.$store.getters.debugMode
    },
    dialogHeight () {
      return this.debugMode ? '280' : '500'
    },
    dialogWidth () {
      return this.debugMode ? '600' : '900'
    },
    position () {
      return this.debugMode ? { top: '240px', left: 'calc(100% - 615px)' } : {}
    },
    vfbInst () {
      return this.$store.getters.vfbInst
    },
    title () {
      return this.debugMode ? '添加信号' : R.pathOr('编辑', ['instName'], this.vfbInst)
    },
    isInterlock () {
      return this.vfbInst && this.vfbInst.isInterlock
    },
    showInputPane () {
      return this.vfbInst && this.vfbInst.inputs.filter(iop => iop.status !== VFBStatus.Deleted).length > 0
    },
    showOutputPane () {
      return this.vfbInst && this.vfbInst.outputs.filter(iop => iop.status !== VFBStatus.Deleted).length > 0
    },
    showParamPane () {
      return this.vfbInst && this.vfbInst.params.filter(iop => iop.status !== VFBStatus.Deleted).length > 0
    },
    symbolProtoMap () {
      return this.$store.getters.symbolProtoMap
    },
    existVfbDelta () {
      return this.$store.getters.vfbDeltaExist
    }
  },
  watch: {
    dialogVisible (val) {
      this.$store.commit('setVfbDialogVisible', val)
    }
  },
  methods: {
    tagChanged (tagKey) {
      const vfbDelta = this.$store.state.vfbInstDialogStore.vfbDelta
      if (vfbDelta) {
        const delta = vfbDelta[tagKey]
        return delta && R.isNotEmpty(delta)
      } else {
        return false
      }
    },
    openDialog (cell) {
      this.cell = cell
      this.$store.commit('setVfbInst', _.cloneDeep(cell.value))
      this.help = this.symbolProtoMap[cell.value.pathId].help || ''
      this.dialogVisible = true
      this.selectedTag = 'basicInfo'
      if (this.debugMode && cell.value.type !== VisualFuncBlockType.VB) {
        this.selectedTag = 'input'
      }
    },
    clear () {
      this.cell = null
      this.selectedTag = 'basicInfo'
      this.help = null
      this.$store.commit('clearVfbDelta')
    },
    async beforeCloseHandler () {
      if (this.existVfbDelta) {
        try {
          await this.$confirm('所有未保存的修改都将丢失，确认关闭?', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning',
            center: true
          })
          this.clear()
        } catch (e) {
          return new Error(e)
        }
      } else {
        this.clear()
      }
    },
    cancel () {
      this.dialogVisible = false
    },
    save () {
      if (this.existVfbDelta) {
        const vfbDelta = this.$store.getters.vfbDelta
        this.graph.getModel().beginUpdate()
        try {
          this.graph.getModel().setValue(this.cell, this.vfbInst)
          if (this.vfbInst.type === VisualFuncBlockType.VB && this.vfbInst.name === 'LOUT') {
            if (vfbDelta.basicInfo) {
              // 获取连线
              const edges = this.cell.edges
              if (edges && edges.length > 0) {
                const edge = edges[0]
                const headCell = edge.source.id === this.cell.id ? edge.target : edge.source
                const newHeadNode = _.cloneDeep(headCell.value)
                // 获取output
                const newHeadOutput = R.find(R.propEq(edge.value.headInfo.name, 'name'))(newHeadNode.outputs)
                newHeadOutput.desc = this.vfbInst.desc
                // 设置值
                this.graph.getModel().setValue(headCell, newHeadNode)
              }
            }
          } else if (vfbDelta.output) {
            // 获取连线
            const edges = this.cell.edges
            if (edges && edges.length > 0) {
              // 获取output
              for (const output of vfbDelta.output) {
                for (const edge of edges) {
                  if (edge.value.headInfo.name === output.name) {
                    const tailCell = edge.source.id === this.cell.id ? edge.target : edge.source
                    if (tailCell.value.type === VisualFuncBlockType.VB && tailCell.value.name === 'LOUT') {
                      const newVb = _.cloneDeep(tailCell.value)
                      // 获取VB
                      newVb.desc = output.desc
                      // 设置值
                      this.graph.getModel().setValue(tailCell, newVb)
                    }
                  }
                }
              }
            }
            // 设置值
          }
        } finally {
          this.graph.getModel().endUpdate()
        }
        // 清理别名缓存，由元件重新生成
        this.clear()
        this.graph.refresh(this.cell)
      }
      this.dialogVisible = false
    }
  },
  mounted () {
    this.$vbus.$on('QUIT_DEBUG_MODE', this.cancel)
  },
  destroyed () {
    this.$vbus.$off('QUIT_DEBUG_MODE', this.cancel)
  }
}
</script>

<style lang="scss">
.symbolDialog {
  .vxe-modal--box .vxe-modal--body .vxe-modal--content {
    padding: 0;
    overflow: hidden;
  }
}

.tagChanged {
  font-size: 16px;
  color: red
}
</style>
