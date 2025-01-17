<template>
  <div class="container">
    <div class="graphToolbarContainer">
      <div class="graphToolbar">
        <div class="scaleZone">
          <el-input size="mini" v-model="showScale" suffix-icon="fa fa-percent"></el-input>
          <el-button size="mini" type="text" @click="resetScale" class="m_tool_btn">重置视图</el-button>
        </div>
      </div>
      <div style="width: 100%;padding-top: 5px">
        <vxe-form
          title-align="right"
          title-width="40"
          title-colon
          span="24"
          size="mini"
          :data="vertexValue">
          <vxe-form-item title="宽" span="12" field="width">
            <template #default="{ data }">
              <el-input v-model="data.width" type="number" min="0" step="5" size="small" :disabled="!redrawEnable"/>
            </template>
          </vxe-form-item>
          <vxe-form-item title="高" span="12" field="height">
            <template #default="{ data }">
              <el-input v-model="data.height" type="number" min="0" step="5" size="small" :disabled="!redrawEnable"/>
            </template>
          </vxe-form-item>
        </vxe-form>
      </div>
    </div>
    <div class="stencilsContainer" ref="stencilsContainer"></div>
  </div>
</template>

<script>
import * as R from 'ramda'
import _ from 'lodash'
import { SymbolBlockConstants } from '@/renderer/pages/symbolMaker/views/components/workArea/workAreaConfig'
import { generateJointSymbolGraph, syncHeight, syncWidth } from '@/util/jointjsShapeGenerator'

export default {
  name: 'blockShape',
  props: ['tagKey'],
  data () {
    return {
      scale: 2,
      container: null,
      graph: null,
      stencilName: '',
      vertexValue: {
        name: '',
        width: 0,
        height: 0,
        inputs: [],
        outputs: []
      }
    }
  },
  computed: {
    block () {
      return this.$store.getters.workTagsSelectDto(this.tagKey)
    },
    redrawEnable () {
      // TODO
      return false
    },
    showScale: {
      get () {
        return `${Math.round(this.scale * 100)}`
      },
      set (val) {
        const result = (val).match(/([0-9]+(\.[0-9]+)?)/)

        if (R.isNotNil(result)) {
          const tmp = parseFloat(result) / 100

          this.graph.view.scale = tmp
          this.scale = tmp
          this.graph.refresh()
        }
      }
    }
  },
  methods: {
    init () {
      this.vertexValue.name = this.block.name
      this.vertexValue.inputs = this.block.inputs.map(input => _.cloneDeep(input))
      this.vertexValue.outputs = this.block.outputs.map(output => _.cloneDeep(output))
    },
    clear () {
      this.scale = 2
      this.container = null
      this.graph = null
      this.stencilName = ''
      this.vertexValue = {
        name: '',
        width: 0,
        height: 0,
        inputs: [],
        outputs: []
      }
    },
    // 重置页面缩放
    resetScale () {
      this.scale = 2
      // TODO
    },
    redrawGraph () {
      if (!this.redrawEnable) {
        return
      }

      const stencil = generateJointSymbolGraph(this.block) // 根据功能块模型定义新的图形

      // FIXME
      // 图像属性变化
      const orgStencil = this.block.graphicFile
      if (stencil !== orgStencil || this.vertexValue.width !== this.block.width || this.vertexValue.height !== this.block.height) {
        this.$store.commit('updateSEDelta', {
          key: this.tagKey,
          propName: SymbolBlockConstants.graph,
          value: {
            width: this.vertexValue.width,
            height: this.vertexValue.height,
            stencil
          }
        })
      } else {
        this.$store.commit('updateSEDelta', {
          key: this.tagKey,
          propName: SymbolBlockConstants.graph,
          value: null
        })
      }
    },
    syncHeight () {
      this.vertexValue.height = syncHeight(this.block)
      this.redrawGraph()
    },
    syncWidth () {
      const maxLength = syncWidth(this.block)
      if (maxLength > this.vertexValue.width) {
        this.vertexValue.width = maxLength
        this.redrawGraph()
      }
    },
    syncInputs (inputs) {
      this.vertexValue.inputs = inputs.map(input => _.cloneDeep(input))
      this.syncHeight()
      this.syncWidth()
    },
    syncOutputs (outputs) {
      this.vertexValue.outputs = outputs.map(output => _.cloneDeep(output))
      this.syncHeight()
      this.syncWidth()
    }
  },
  beforeDestroy () {
    this.clear()
  },
  mounted () {
    this.init()
  }
}
</script>

<style lang="scss" scoped>
.container {
  z-index: 1;
  position: relative;
  width: 100%;
  height: 100%;

  .graphToolbarContainer {
    position: relative;
    height: 85px;
    width: 100%;
    box-shadow: 2px 2px 3px 0 rgba(0, 0, 0, .3);
    z-index: 2;

    .graphToolbar {
      color: #fff;
      height: 32px;
      width: 100%;
      border-bottom: 1px solid rgb(235, 238, 245);

      .scaleZone {
        height: 100%;
        padding-top: 1px;

        .el-input {
          width: calc(100% - 70px);

          input {
            height: 27px;
            line-height: 27px;
          }
        }

        .m_tool_btn {
          padding: 0;
          position: relative;
          top: -1px;
          margin: 0 0 0 10px;
          border: 0;
          height: auto;
          color: #000;
          font-weight: 600;
        }
      }
    }
  }

  .stencilsContainer {
    position: relative;
    z-index: 1;
    height: calc(100% - 85px);
    width: 100%;
    overflow-x: auto;
    overflow-y: auto;
    outline: none;
    background: #f5f5f5;
  }
}
</style>
