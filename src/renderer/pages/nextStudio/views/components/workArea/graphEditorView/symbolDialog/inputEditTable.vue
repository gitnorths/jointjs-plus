<template>
  <div id="inputEditTableContainer">
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
    </vxe-table>
  </div>
</template>

<script>
import { tableMixin } from './tableMixin'
import { EnableStatusEnum, TaskLevelEnum, VariableTypeEnum } from '@/model/enum'

export default {
  name: 'inputEditTable',
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
      return this.vfbInst ? this.vfbInst.inputs.filter(iop => iop.status !== EnableStatusEnum.DIRTY) : []
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
        { label: VariableTypeEnum[VariableTypeEnum.ANY], value: VariableTypeEnum.ANY },
        { label: VariableTypeEnum[VariableTypeEnum.BOOL], value: VariableTypeEnum.BOOL },
        { label: VariableTypeEnum[VariableTypeEnum.INT8], value: VariableTypeEnum.INT8 },
        { label: VariableTypeEnum[VariableTypeEnum.UINT8], value: VariableTypeEnum.UINT8 },
        { label: VariableTypeEnum[VariableTypeEnum.INT16], value: VariableTypeEnum.INT16 },
        { label: VariableTypeEnum[VariableTypeEnum.UINT16], value: VariableTypeEnum.UINT16 },
        { label: VariableTypeEnum[VariableTypeEnum.INT32], value: VariableTypeEnum.INT32 },
        { label: VariableTypeEnum[VariableTypeEnum.UINT32], value: VariableTypeEnum.UINT32 },
        { label: VariableTypeEnum[VariableTypeEnum.INT64], value: VariableTypeEnum.INT64 },
        { label: VariableTypeEnum[VariableTypeEnum.UINT64], value: VariableTypeEnum.UINT64 },
        { label: VariableTypeEnum[VariableTypeEnum.FLOAT32], value: VariableTypeEnum.FLOAT32 },
        { label: VariableTypeEnum[VariableTypeEnum.FLOAT64], value: VariableTypeEnum.FLOAT64 },
        { label: VariableTypeEnum[VariableTypeEnum.SOE_BOOL], value: VariableTypeEnum.SOE_BOOL },
        { label: VariableTypeEnum[VariableTypeEnum.SOE_DBPOS], value: VariableTypeEnum.SOE_DBPOS },
        { label: VariableTypeEnum[VariableTypeEnum.SOE_FLOAT], value: VariableTypeEnum.SOE_FLOAT },
        { label: VariableTypeEnum[VariableTypeEnum.CPLXF32], value: VariableTypeEnum.CPLXF32 },
        { label: VariableTypeEnum[VariableTypeEnum.STRING], value: VariableTypeEnum.STRING },
        { label: VariableTypeEnum[VariableTypeEnum.STRUCT], value: VariableTypeEnum.STRUCT },
        { label: VariableTypeEnum[VariableTypeEnum.POINTER], value: VariableTypeEnum.POINTER }
      ]
    }
  },
  methods: {
    activeMethod ({ row, column }) {
      if (this.debugMode) {
        return false
      }
      if (column.property === 'customType') {
        return row.type === VariableTypeEnum.Any
      }
      return true
    },
    levelType (level) {
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
      this.$store.commit('recordVfbDelta', { key: 'input', delta })
    },
    customTypeChangeHandler (vfb) {
      if (vfb.customTypeOption) {
        const option = R.find(R.propEq(vfb.customTypeOption, 'name'))(vfb.customTypeOptList)
        if (option && option.customType) {
          Object.keys(option.customType).forEach((key) => {
            const inputRow = R.find(R.propEq(key, 'name'))(this.tableData)
            if (inputRow) {
              inputRow.customType = Number(option.customType[key])
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
#inputEditTableContainer {
  height: 100%;
  width: 100%;
  overflow: hidden;
}
</style>
