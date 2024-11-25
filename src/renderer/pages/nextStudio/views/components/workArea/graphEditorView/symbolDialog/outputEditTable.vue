<template>
  <div id="outputEditTableContainer">
    <vxe-table
      :data="tableData"
      height="auto"
      auto-resize
      border
      stripe
      size="mini"
      align="center"
      keep-source
      show-overflow
      :column-config="{resizable: true}"
      :row-config="{isCurrent: true, isHover: true, keyField: 'id'}"
      :edit-config="{trigger: 'dblclick', mode: 'cell', showStatus: true, showIcon: true, beforeEditMethod: activeMethod}"
      :checkbox-config="{trigger: 'cell', range: true}"
      :menu-config="tableMenu"
      :scroll-y="{enabled:true, gt:15}"
      @edit-actived="editActiveHandler"
      @edit-closed="editDone"
      @cell-click="cellClickHandler"
      @menu-click="contextMenuClickHandler"
      ref="vxTable">
      <vxe-column type="seq" width="36" fixed="left"></vxe-column>
      <vxe-column type="checkbox" width="40" align="left" fixed="left"></vxe-column>
      <vxe-column field="name" title="变量名" width="136" fixed="left"></vxe-column>
      <vxe-column field="alias" title="别名" width="120"
                  :edit-render="{name: 'VxeInput', props:{ clearable: true}}" fixed="left"></vxe-column>
      <vxe-column field="desc" title="描述" width="120"
                  :edit-render="{name: 'VxeInput', props:{ clearable: true}}" fixed="left"></vxe-column>
      <vxe-column title="变量调试" width="120" v-if="debugMode" fixed="left">
        <template v-slot="{row}">
          <div style="display:inline-block">
            <el-tooltip content="监控信号" :open-delay=1000>
              <el-button size="mini" type="primary" icon="fa fa-binoculars" @click="addToWatch(row)" round plain>加入监控
              </el-button>
            </el-tooltip>
          </div>
        </template>
      </vxe-column>
      <vxe-column field="level" title="任务等级" width="68">
        <template v-slot="{row}">
          {{ levelType(row.level) }}
        </template>
      </vxe-column>
      <vxe-column field="type" title="变量类型" width="110">
        <template v-slot="{row}">
          {{ varType[row.type] }}
        </template>
      </vxe-column>
      <vxe-column field="customType" title="自定义变量类型" width="120" :edit-render="{}">
        <template v-slot="{row}">
          {{ varType[row.customType] }}
        </template>
        <template v-slot:edit="{row}">
          <vxe-select v-model="row.customType" :options="optTypeList(row)" ref="vxSelect" transfer clearable/>
        </template>
      </vxe-column>
      <vxe-column field="structType" title="结构体类型" width="120"></vxe-column>
      <vxe-column field="prm" title="原始值" width="120"></vxe-column>
    </vxe-table>
  </div>
</template>

<script>
import { tableMixin } from './tableMixin'
import { EnableStatusEnum, TaskLevelEnum, VariableTypeEnum } from '@/model/enum'

export default {
  name: 'outputEditTable',
  mixins: [tableMixin],
  props: {
    pageGraph: {
      required: true
    }
  },
  computed: {
    vfbInst () {
      return this.$store.getters.vfbInst
    },
    tableData () {
      return this.vfbInst ? this.vfbInst.outputs.filter(iop => iop.status !== EnableStatusEnum.DIRTY) : []
    },
    varType () {
      return VariableTypeEnum
    }
  },
  watch: {},
  data () {
    return {
      vfbLevel: null,
      typeList: [
        // { value: VariableTypeEnum.Any, label: 'Any' },
        // { value: VariableTypeEnum.Boolean, label: 'Boolean' },
        // { value: VariableTypeEnum.Char, label: 'Char' },
        // { value: VariableTypeEnum.UnsignedChar, label: 'UnsignedChar' },
        // { value: VariableTypeEnum.Short, label: 'Short' },
        // { value: VariableTypeEnum.UnsignedShort, label: 'UnsignedShort' },
        // { value: VariableTypeEnum.Long, label: 'Long' },
        // { value: VariableTypeEnum.UnsignedLong, label: 'UnsignedLong' },
        // { value: VariableTypeEnum.Float, label: 'Float' },
        // { value: VariableTypeEnum.String, label: 'String' },
        // { value: VariableTypeEnum.Struct, label: 'Struct' },
        // { value: VariableTypeEnum.Soe, label: 'Soe' }
      ]
    }
  },
  methods: {
    activeMethod ({ row, column }) {
      if (this.debugMode) {
        return false
      }
      if (column.property === 'customType') {
        return row.type === VariableTypeEnum.ANY
      }
      return true
    },
    levelType (level) {
      // FIXME
      return level === TaskLevelEnum.LevelAny ? TaskLevelEnum[this.vfbLevel] : TaskLevelEnum[level]
    },
    optTypeList (row) {
      if (row && row.optTypeList && R.isNotEmpty(row.optTypeList)) {
        return row.optTypeList.map(type => ({ label: VariableTypeEnum[type], value: type }))
      }
      return this.typeList
    },
    init () {
      this.vfbLevel = this.vfbInst.level !== TaskLevelEnum.LevelAny
        ? this.vfbInst.level
        : this.vfbInst.customLevel && this.vfbInst.customLevel !== TaskLevelEnum.LevelAny
          ? this.vfbInst.customLevel
          : this.pageGraph.level
    },
    cellClickHandler ({ rowIndex, columnIndex }) {
      if (rowIndex !== this.activeRowIndex || columnIndex !== this.activeColumnIndex) {
        this.$refs.vxTable.clearEdit()
        this.activeRowIndex = null
        this.activeColumnIndex = null
      }
    },
    editActiveHandler ({ rowIndex, columnIndex }) {
      this.activeRowIndex = rowIndex
      this.activeColumnIndex = columnIndex
      this.$nextTick(() => {
        if (this.$refs.vxSelect) {
          this.$refs.vxSelect.focus()
          this.$refs.vxSelect.togglePanel()
        }
      })
    },
    editDone () {
      const delta = this.$refs.vxTable.getUpdateRecords()
      this.$store.commit('recordVfbDelta', { key: 'output', delta })
    },
    customTypeChangeHandler (vfb) {
      if (vfb.customTypeOption) {
        const option = R.find(R.propEq(vfb.customTypeOption, 'name'))(vfb.customTypeOptList)
        if (option && option.customType) {
          Object.keys(option.customType).forEach((key) => {
            const outputRow = R.find(R.propEq(key, 'name'))(this.tableData)
            if (outputRow) {
              outputRow.customType = Number(option.customType[key])
            }
          })
          this.editDone()
        }
      }
    },
    customLevelChangeHandler (newLevel) {
      this.vfbLevel = newLevel
    }
  },
  mounted () {
    this.init()
    this.$vbus.$on('VFB_CUSTOM_TYPE_CHANGED', this.customTypeChangeHandler)
    this.$vbus.$on('VFB_CUSTOM_LEVEL_CHANGED', this.customLevelChangeHandler)
  },
  destroyed () {
    this.$vbus.$off('VFB_CUSTOM_TYPE_CHANGED', this.customTypeChangeHandler)
    this.$vbus.$off('VFB_CUSTOM_LEVEL_CHANGED', this.customLevelChangeHandler)
  }
}
</script>

<style scoped>
#outputEditTableContainer {
  height: 100%;
  width: 100%;
  overflow: hidden;
}
</style>
