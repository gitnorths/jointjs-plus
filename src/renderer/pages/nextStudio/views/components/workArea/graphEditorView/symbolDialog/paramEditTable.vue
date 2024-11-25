<template>
  <div id="paramEditTableContainer">
    <vxe-table
      :data="tableData"
      height="auto"
      auto-resize
      border
      stripe
      size="mini"
      align="center"
      keep-source
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
      <vxe-column field="name" title="变量名" width="136" show-overflow fixed="left"></vxe-column>
      <vxe-column field="alias" title="别名" width="120" show-overflow
                  :edit-render="{name: 'VxeInput', props:{ clearable: true}}" fixed="left"></vxe-column>
      <vxe-column field="desc" title="描述" width="120"
                  :edit-render="{name: 'VxeInput', props:{ clearable: true}}" show-overflow fixed="left"></vxe-column>
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
      <vxe-column field="value" title="默认值" min-width="80" :edit-render="{autofocus: ['.vxe-input--inner']}"
                  v-if="!isInterlock" show-overflow fixed="left">
        <template v-slot="{row}">
          {{ !row.valueList ? row.value : row.value ? row.valueList.split(' ')[Number(row.value)] : '' }}
        </template>
        <template v-slot:edit="{row}">
          <vxe-input v-if="!row.valueList" v-model="row.value"></vxe-input>
          <vxe-select v-else v-model="row.value" placeholder="" clearable transfer ref="vxSelect">
            <vxe-option v-for="(opt,index) in row.valueList.split(' ')"
                        :key="index"
                        :label="opt"
                        :value="index.toString()"></vxe-option>
          </vxe-select>
        </template>
      </vxe-column>
      <vxe-column field="type" title="变量类型" width="110" show-overflow>
        <template v-slot="{row}">
          {{ varType[row.type] }}
        </template>
      </vxe-column>
      <vxe-column field="valueList" title="值列表" width="140" align="left" header-align="center"
                  v-if="!isInterlock">
        <template v-slot="{row}">
          {{ row.valueList ? row.valueList.split(' ').join('\n') : '' }}
        </template>
      </vxe-column>
      <vxe-column field="unit" title="单位" width="68" show-overflow></vxe-column>
      <vxe-column field="min" title="最小值" width="72" show-overflow></vxe-column>
      <vxe-column field="max" title="最大值" width="72" show-overflow></vxe-column>
      <vxe-column field="norm" title="额定值" width="72" show-overflow></vxe-column>
      <vxe-column field="prm" title="原始值" width="72" show-overflow></vxe-column>
      <vxe-column field="optional" title="可选参数" width="68" show-overflow>
        <template v-slot="{row}">
          {{ row.optional ? '是' : '否' }}
        </template>
      </vxe-column>
    </vxe-table>
  </div>
</template>

<script>
import { tableMixin } from './tableMixin'

export default {
  name: 'paramEditTable',
  mixins: [tableMixin],
  props: {
    isInterlock: {
      type: Boolean
    }
  },
  computed: {
    vfbInst () {
      return this.$store.getters.vfbInst
    },
    tableData () {
      return this.vfbInst ? this.vfbInst.params.filter(iop => iop.status !== VFBStatus.Deleted) : []
    },
    varType () {
      return VFBParamType
    }
  },
  watch: {},
  data () {
    return {
      permitPathId: [
        'platform/Communication/PMU/PmuOfflineServer',
        'platform/Communication/MODBUS/MB_M_MSG',
        'platform/Communication/MODBUS/ModbusTcpClient',
        'platform/Communication/MODBUS/ModbusTcpServer',
        'platform/DeviceIO/SystemIO/ReadRegister',
        'platform/DeviceIO/SystemIO/WriteRegister',
        'platform/Service/HMI/LED'
      ]
    }
  },
  methods: {
    activeMethod () {
      if (this.debugMode) {
        return false
      }
      // return this.vfbInst && this.permitPathId.includes(this.vfbInst.pathId);
      return true
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
      this.$store.commit('recordVfbDelta', { key: 'param', delta })
    }
  }
}
</script>

<style scoped>
#paramEditTableContainer {
  height: 100%;
  width: 100%;
  overflow: hidden;
}
</style>
