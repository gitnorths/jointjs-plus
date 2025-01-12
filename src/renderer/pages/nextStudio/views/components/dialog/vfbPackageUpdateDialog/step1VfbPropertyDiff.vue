<template>
  <div style="height: 100%">
    <vxe-toolbar>
      <template v-slot:buttons>
        <vxe-button status="primary" @click="hide" style="margin-left: 12px">
          <i class="fa fa-reply"></i> 返回
        </vxe-button>
        <el-button-group v-if="ref.clazzName === 'VisualFuncBlock'" style="margin-left: 12px">
          <el-button size="small" type="primary" @click="zoomOut" plain><i class="fa fa-minus"></i> 缩小</el-button>
          <el-button size="small" type="primary" @click="zoomIn" plain><i class="fa fa-plus"></i> 放大</el-button>
        </el-button-group>
      </template>
      <template v-slot:tools>
      </template>
    </vxe-toolbar>
    <div style="width: 100%; height: calc(100% - 52px)">
      <el-table
        height="100%"
        border
        stripe
        size="mini"
        :data="tableData"
        :row-class-name="tableRowClassName">
        <el-table-column prop="property" label="属性" width="140"></el-table-column>
        <el-table-column prop="leftValue" label="升级前">
          <template v-slot="scope">
            <div v-if="scope.row.property === $i18n.t('na.graph')" ref="leftContainer" class="graphContainer">
            </div>
            <span v-else>{{ scope.row.leftValue }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="rightValue" label="升级后">
          <template v-slot="scope">
            <div v-if="scope.row.property === $i18n.t('na.graph')" ref="rightContainer" class="graphContainer">
            </div>
            <span v-else>{{ scope.row.rightValue }}</span>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script>
import { deltaStatus } from '../util'
import { VariableTypeEnum } from '@/model/enum'
import { objDiff } from '@/renderer/common/util'

export default {
  name: 'step1PropertyDiff',
  props: {
    propCompare: { required: true }
  },
  data () {
    return {
      tableData: null,
      rowStatus: null,
      leftGraph: null,
      rightGraph: null,
      tempStencil: []
    }
  },
  computed: {
    ref () {
      const { left, right } = this.propCompare
      return left.ref || right.ref
    }
  },
  methods: {
    init () {
      const { left, right } = this.propCompare
      this.tableData = []
      this.rowStatus = new Map()

      const formatValue = (key, obj) => {
        const value = R.prop(key)(obj)
        if (R.equals(key, 'type')) {
          return R.isNotNil(value) ? `${VariableTypeEnum[value]}` : ''
        }
        if (typeof value === 'boolean') {
          return value ? 'true' : 'false'
        }
        if (value === 0) {
          return value
        }
        return value || ''
      }

      const leftObj = left.ref
      const rightObj = right.ref
      const regex = /^(na|isInterlock|inputs|outputs|params|clazzName|index|id|status|showInstName|x|y|lkLoutVbId|width|height|compatible|customTypeOption|customLevel|_propStatus|_status|parentNode|children|title|boardType|pageGraphId|customType|optTypeList|integralVisible|textVisible)$/
      const delta = objDiff({
        objectHash: (obj) => obj.name,
        propertyFilter: (name, context) => !regex.test(name)
      }).diff(leftObj, rightObj)
      const obj = leftObj || rightObj

      Object.keys(obj)
        .filter((key) => {
          return !regex.test(key)
        })
        .forEach((key) => {
          const status = delta && delta[key] && R.isNotEmpty(delta[key]) ? deltaStatus.Changed : deltaStatus.Unchanged
          const obj = {
            property: this.$i18n.t(`na.${key}`),
            leftValue: formatValue(key, leftObj),
            rightValue: formatValue(key, rightObj),
            status
          }
          if (key === 'graph') {
            this.tableData.unshift(obj)
          } else {
            this.tableData.push(obj)
          }
        })

      this.tableData.forEach((row, index) => this.rowStatus.set(index, row.status))

      if (/VisualFuncBlock/.test(obj.clazzName)) {
        // graph
        this.$nextTick(() => {
          this.addSymbolToGraph(leftObj, this.leftGraph, true)
          this.addSymbolToGraph(rightObj, this.rightGraph, false)
        })
      }
    },
    zoomIn () {
      if (this.leftGraph) {
        this.leftGraph.zoomIn()
      }
      if (this.rightGraph) {
        this.rightGraph.zoomIn()
      }
    },
    zoomOut () {
      if (this.leftGraph) {
        this.leftGraph.zoomOut()
      }
      if (this.rightGraph) {
        this.rightGraph.zoomOut()
      }
    },
    addSymbolToGraph (symbol, graph, fromLeft) {
      // todo
    },
    clearTempStencil () {
      // todo
    },
    clearStatus () {
      this.tableData = null
      this.rowStatus = null
      this.leftGraph = null
      this.rightGraph = null
      this.clearTempStencil()
    },
    hide () {
      this.clearStatus()
      this.$emit('hide')
    },
    tableRowClassName ({ rowIndex }) {
      const status = this.rowStatus.get(rowIndex)
      switch (status) {
        case deltaStatus.Changed:
          return 'status_changed'
        case deltaStatus.Unchanged:
          return 'status_unchanged'
        default :
          return 'status_unchanged'
      }
    }
  },
  mounted () {
    this.init()
  }
}
</script>

<style>
.el-table .status_changed {
  color: red;
  font-weight: bold;
}

.graphContainer {
  width: 100%;
  height: 100%;
  overflow: auto;
}
</style>
