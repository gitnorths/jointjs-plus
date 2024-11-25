<template>
  <vxe-modal
    v-model="dialogVisible"
    class="signalWatchDialog"
    width="600"
    height="280"
    show-close
    destroy-on-close
    resize
    :lock-view=false
    :position="position"
    :mask=false
    :before-hide-method="beforeCloseHandler"
    transfer
    ref="modal">
    <template v-slot:title>
      <i class="fa fa-binoculars"> 变量监控 </i>
      <el-button class="m_title_btn" icon="el-icon-folder-opened" title="打开信号列表"
                 @click="openSignalTable" style="margin-left: 12px"></el-button>
      <el-button class="m_title_btn" icon="fa fa-save" title="保存信号列表"
                 @click="exportSignalTable" :disabled="!tableData || tableData.length === 0"></el-button>
      <el-divider direction="vertical"></el-divider>
      <el-button class="m_title_btn" icon="fa fa-plus" title="添加信号"
                 @click="insertRow"></el-button>
      <el-button :class="startSort ? 'm_title_btn m_sort_btn' : 'm_title_btn'"
                 :icon="startSort ? 'fa fa-check' : 'fa fa-sort'"
                 :title="startSort ? '排序完成' : '开始排序'"
                 @click="switchSortStatus">
      </el-button>
      <el-divider direction="vertical"></el-divider>
      <el-button v-if="recordStatus" class="m_title_btn record_btn_on" icon="el-icon-video-pause" title="停止录制"
                 @click="stopRecord"></el-button>
      <el-button v-else class="m_title_btn" icon="el-icon-video-play" title="信号录制"
                 @click="showRecordDialog"></el-button>
      <el-button class="m_title_btn" icon="el-icon-data-line" title="查看图表"
                 @click="showRealtimeLineChart"></el-button>
    </template>
    <template>
      <vxe-table
        :data="tableData"
        height="auto"
        auto-resize
        stripe
        border
        size="mini"
        align="center"
        :row-class-name="rowClassName"
        show-overflow
        :column-config="{resizable: true}"
        :row-config="{isCurrent: true, isHover: true, useKey: true}"
        :checkbox-config="{trigger: 'cell', range: true}"
        :expand-config="{reserve: true, accordion: true}"
        :menu-config="tableMenu"
        :edit-config="{trigger: 'dblclick', mode: 'cell', showIcon: true, beforeEditMethod: activeMethod}"
        :edit-rules="validRules"
        @edit-actived="editActiveHandler"
        @edit-closed="editDone"
        @cell-click="cellClickHandler"
        @cell-dblclick="cellDblClickHandler"
        @menu-click="contextMenuClickHandler"
        ref="vxTable">
        <vxe-column width="36" class-name="drag-btn" v-if="startSort">
          <template>
            <span><i class="fa fa-sort"></i></span>
          </template>
        </vxe-column>
        <vxe-column type="seq" width="36"></vxe-column>
        <vxe-column type="checkbox" width="40" align="left"></vxe-column>
        <vxe-column title="短地址" field="na" min-width="136" sortable align="left" header-align="center"
                    :edit-render="{autofocus: ['.vxe-input--inner']}">
          <template v-slot="{row}">
            <i :class="!row.openedSignals || row.openedSignals.connectStatus === 0 ? 'fa fa-unlink' : 'fa fa-link'"></i>
            {{ row.na }}
          </template>
          <template v-slot:edit="{row}">
            <vxe-input v-model="row.na"></vxe-input>
          </template>
        </vxe-column>
        <vxe-column title="值" field="value" min-width="80" :edit-render="{autofocus: ['.vxe-input--inner']}">
          <template v-slot="{row}">
            {{ displayValue(row) }}
          </template>
          <template v-slot:edit="{row}">
            <vxe-input v-model="row.value"></vxe-input>
          </template>
        </vxe-column>
        <vxe-column title="备注" field="annotation" min-width="120" :edit-render="{autofocus: ['.vxe-input--inner']}">
          <template v-slot="{row}">
            {{ row.annotation }}
          </template>
          <template v-slot:edit="{row}">
            <vxe-input v-model="row.annotation"></vxe-input>
          </template>
        </vxe-column>
        <vxe-column title="变量类型" min-width="68">
          <template v-slot="{row}">
            {{ row.openedSignals ? row.openedSignals.type : '' }}
          </template>
        </vxe-column>
        <vxe-column title="显示格式" min-width="68">
          <template v-slot="{row}">
            {{ row.openedSignals ? row.openedSignals.format : '' }}
          </template>
        </vxe-column>
        <vxe-column type="expand" title="历史" min-width="44">
          <template v-slot:content="{row}">
            <div style="padding: 10px 30px">
              <vxe-table
                stripe
                border
                resizable
                :height="calcHeight(row)"
                auto-resize
                size="mini"
                align="center"
                show-overflow
                highlight-current-row
                highlight-hover-row
                :data="getHistoryData(row)">
                <vxe-column field="date" title="修改时间"></vxe-column>
                <vxe-column field="record" title="设置值"></vxe-column>
              </vxe-table>
            </div>
          </template>
        </vxe-column>
      </vxe-table>
    </template>
  </vxe-modal>
</template>

<script>
import { ConnectStatus } from '@/renderer/pages/nextStudio/model/DebugSignal'
import {
  closeDebugSignal,
  exportSignalFile,
  openDebugSignal,
  openRealtimeChart,
  openSignalFile,
  setDebugSignalValue
} from '@/renderer/pages/nextStudio/action'
import Sortable from 'sortablejs'

export default {
  name: 'signalWatchDialog',
  data () {
    const naValid = ({ cellValue, row }) => {
      // FIXME 中文短地址 校验短地址格式 B01.AA.XX  B01[1:2].BB.CC
      // if (!/B(0[1-9]|[1-9][0-9])(\[([1-9]|[1-9][0-9])+:([1-9]|[1-9][0-9])+])?\.\w+\.\w+/.test(cellValue)) {
      //   return new Error('变量名格式错误');
      // }

      const { fullData } = this.$refs.vxTable.getTableData()
      if (R.isNotEmpty(fullData) && cellValue) {
        const fullDataArr = fullData
          .filter(data => data.na === row.na)
          .map(data => data.na)
        if (fullDataArr.length > 1) {
          return new Error('变量已存在')
        }
      }
    }
    return {
      dialogVisible: false,
      position: { top: '0px', left: 'calc(100% - 615px)' },
      validRules: {
        na: [
          { required: true, message: '变量不能为空' },
          { validator: naValid }
        ]
      },
      tableData: [],
      tableMenu: {
        body: {
          options: [
            [
              { code: 'open-close', name: '打开信号', prefixIcon: 'fa fa-link', visible: true, disabled: false },
              { code: 'remove', name: '移除监控', prefixIcon: 'el-icon-delete', visible: true, disabled: false }
            ],
            [
              { code: 'open-select', name: '打开选中', prefixIcon: 'fa fa-link', visible: true, disabled: false },
              { code: 'close-select', name: '关闭选中', prefixIcon: 'fa fa-unlink', visible: true, disabled: false },
              { code: 'remove-select', name: '移除选中', prefixIcon: 'el-icon-delete', visible: true, disabled: false }
            ]
          ]
        },
        visibleMethod: this.visibleMethod
      },
      startSort: false
    }
  },
  computed: {
    openedSignals () {
      return this.$store.getters.openedSignals
    },
    watchedSignals () {
      return this.$store.getters.watchedSignals
    },
    selectedMxCell () {
      return this.$store.getters.selectedMxCell
    },
    recordStatus () {
      return this.$store.getters.recordStatus
    }
  },
  watch: {
    watchedSignals () {
      this.init()
    },
    selectedMxCell (cell) {
      if (cell && cell.value) {
        const selectType = cell.value.clazzName
        let na
        if (selectType === 'ConnectingLine') {
          na = cell.value.na
        } else if (selectType === 'VisualFuncBlock') {
          // IN
          if (/platform\/common\/common_io\/IN$/i.test(cell.value.pathId)) {
            na = cell.value.instName
          } else if (/platform\/common\/common_io\/(LIN|LOUT)$/i.test(cell.value.pathId)) {
            na = cell.value.na
          }
        }
        if (na) {
          const row = R.find(R.propEq(na, 'na'))(this.tableData)
          this.$refs.vxTable.scrollToRow(row)
          this.$refs.vxTable.setCurrentRow(row)
        }
      }
    },
    startSort (val) {
      if (val) {
        this.mountSortable()
        this.$refs.vxTable.clearRowExpand()
      } else {
        // 排序结束，同步到store
        this.syncToStore()
      }
    }
  },
  methods: {
    activeMethod ({ row, column }) {
      if (this.startSort) {
        return false
      }
      if (column.property === 'na') {
        return !(row.openedSignals && row.openedSignals.connectStatus === ConnectStatus.OPENED)
      }
      if (column.property === 'value') {
        return row.openedSignals && row.openedSignals.connectStatus === ConnectStatus.OPENED
      }
      return true
    },
    rowClassName ({ row }) {
      if (row) {
        if (!row.openedSignals || row.openedSignals.connectStatus === ConnectStatus.CLOSED) {
          return 'disconnected'
        }
      }
      return ''
    },
    init () {
      this.tableData = this.watchedSignals.map(obj => {
        const openedSignals = this.$store.getters.na2DebugSignal(obj.na)
        return {
          na: obj.na,
          annotation: obj.annotation || '',
          openedSignals,
          editActiveValue: '',
          value: '',
          format: null
        }
      })
    },
    openDialog () {
      this.init()
      this.dialogVisible = true
    },
    closeDialog () {
      this.dialogVisible = false
    },
    showRealtimeLineChart () {
      openRealtimeChart()
    },
    showRecordDialog () {
      this.$vbus.$emit('OPEN_DEBUG_RECORD_DIALOG')
    },
    stopRecord () {
      this.$notification.openSuccessNotification('influxd服务断开，停止记录...').logger()
      this.$store.commit('setRecordStatus', false)
    },
    cellClickHandler ({ rowIndex, columnIndex }) {
      if (rowIndex !== this.activeRowIndex || columnIndex !== this.activeColumnIndex) {
        this.$refs.vxTable.clearEdit()
        this.activeRowIndex = null
        this.activeColumnIndex = null
      }
    },
    cellDblClickHandler ({ row, column }) {
      if (column.property === 'na' && !this.$refs.vxTable.isEditByRow(row)) {
        this.$notify.info({ title: '', message: `如需要修改短地址，请先关闭当前信号：${row.na}` })
      }
    },
    editActiveHandler ({ row, column, rowIndex, columnIndex }) {
      this.activeRowIndex = rowIndex
      this.activeColumnIndex = columnIndex
      if (column.property === 'value' && R.isNotEmpty(row.openedSignals.debugGetValue)) {
        row.value = row.editActiveValue = row.openedSignals.debugGetValue.toString()
      }
    },
    insertRow () {
      const toAddRow = {
        na: '',
        annotation: '',
        openedSignals: null,
        editActiveValue: '',
        value: '',
        format: null
      }
      this.$refs.vxTable.insertAt(toAddRow, -1).then(({ row }) => {
        this.$refs.vxTable.setEditRow(row)
      })
    },
    removeRow (row) {
      if (row) {
        if (row.openedSignals && row.openedSignals.connectStatus === ConnectStatus.OPENED) {
          this.$notification.openWarningNotification(`无法移除已经打开的信号，请先关闭信号 ${row.na}`)
          return
        }
        this.$store.commit('removeFromWatchedSignals', row.na)
      } else {
        const selectRecords = this.$refs.vxTable.getCheckboxRecords()
        const openedRecords = selectRecords.filter(record => record.openedSignals && record.openedSignals.connectStatus === ConnectStatus.OPENED)
        if (openedRecords && R.isNotEmpty(openedRecords)) {
          this.$notification.openWarningNotification(`无法移除已经打开的信号，请先关闭信号【 ${openedRecords.map(record => record.na).join(', ')} 】`)
          return
        }
        for (const record of selectRecords) {
          this.$store.commit('removeFromWatchedSignals', record.na)
        }
      }
    },
    changeSignalStatus (row) {
      if (row.openedSignals) {
        if (row.openedSignals.connectStatus === ConnectStatus.OPENED) {
          closeDebugSignal(row.openedSignals)
        } else if (row.openedSignals.connectStatus === ConnectStatus.CLOSED) {
          openDebugSignal(row.na)
        }
      } else {
        openDebugSignal(row.na)
      }
    },
    openSignals () {
      const selectRecords = this.$refs.vxTable.getCheckboxRecords()
      for (const record of selectRecords) {
        if (!record.openedSignals || record.openedSignals.connectStatus === ConnectStatus.CLOSED) {
          openDebugSignal(record.na)
        }
      }
    },
    closeSignals () {
      const selectRecords = this.$refs.vxTable.getCheckboxRecords()
      for (const record of selectRecords) {
        if (record.openedSignals && record.openedSignals.connectStatus === ConnectStatus.OPENED) {
          closeDebugSignal(record.openedSignals)
        }
      }
    },
    displayValue (row) {
      // TODO 根据format格式化显示
      return row.openedSignals ? row.openedSignals.debugGetValue : ''
    },
    visibleMethod ({ options, row }) {
      if (row) {
        this.$refs.vxTable.setCurrentRow(row)
      }
      const selectRecords = this.$refs.vxTable.getCheckboxRecords()
      options.forEach(list => {
        list.forEach(item => {
          if (['remove-select', 'close-select', 'open-select'].includes(item.code)) {
            item.visible = selectRecords.length >= 1
          }
          if (['remove', 'open-close'].includes(item.code)) {
            item.visible = !!row
          }
          if (['close-select'].includes(item.code)) {
            const existOpened = R.find(R.pathEq(['openedSignals', 'connectStatus'], ConnectStatus.OPENED))(selectRecords)
            item.disabled = !existOpened
          }
          if (['open-select'].includes(item.code)) {
            const existClosed = R.find(record => !record.openedSignals || record.openedSignals.connectStatus === ConnectStatus.CLOSED)(selectRecords)
            item.disabled = !existClosed
          }
          if (['open-close'].includes(item.code)) {
            if (row && row.openedSignals) {
              if (row.openedSignals.connectStatus === ConnectStatus.OPENED) {
                item.name = '关闭信号'
                item.prefixIcon = 'fa fa-unlink'
              } else if (row.openedSignals.connectStatus === ConnectStatus.CLOSED) {
                item.name = '打开信号'
                item.prefixIcon = 'fa fa-link'
              } else {
                item.prefixIcon = 'el-icon-loading'
              }
            } else {
              item.name = '打开信号'
              item.prefixIcon = 'fa fa-link'
            }
          }
        })
      })
      return !this.startSort
    },
    contextMenuClickHandler ({ menu, row }) {
      switch (menu.code) {
        case 'remove':
          this.removeRow(row)
          break
        case 'remove-select':
          this.removeRow()
          break
        case 'open-close':
          this.changeSignalStatus(row)
          break
        case 'open-select':
          this.openSignals()
          break
        case 'close-select':
          this.closeSignals()
          break
      }
    },
    syncToStore () {
      const { fullData } = this.$refs.vxTable.getTableData()
      const watchedSignals = fullData.map(row => ({ na: row.na, annotation: row.annotation || '' }))
      this.$store.commit('setWatchedSignals', watchedSignals)
    },
    editDone ({ row, column }) {
      this.$refs.vxTable.fullValidate(true)
        .then((errMap) => {
          if (errMap) {
            return
          }
          if (/^(na|annotation)$/.test(column.property)) {
            this.syncToStore()
          }
          if (column.property === 'value') {
            if (row.value !== row.editActiveValue) {
              row.openedSignals.debugSetValue = row.value
              // TODO 增加修改提示
              setDebugSignalValue(row.openedSignals)
            }
            row.value = ''
            row.editActiveValue = ''
          }
        })
        .catch(e => {
          this.$notification.openErrorNotification('校验失败' + e).logger()
          return e
        })
    },
    openSignalTable () {
      if (this.openedSignals && Object.keys(this.openedSignals).length > 0) {
        this.$notification.openErrorNotification('导入信号列表失败！导入之前需要先关闭所有打开的信号。').logger()
      } else {
        openSignalFile()
      }
    },
    exportSignalTable () {
      exportSignalFile()
    },
    formatDate (input) {
      const date = new Date(input)
      return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`
    },
    calcHeight (row) {
      if (row.openedSignals && R.isNotEmpty(row.openedSignals.history)) {
        let count = 36
        count += row.openedSignals.history.length * 36
        return count
      }
      return 'auto'
    },
    getHistoryData (row) {
      const tableData = []
      if (row.openedSignals && row.openedSignals.history) {
        for (let i = 0; i < row.openedSignals.history.length; i++) {
          const item = row.openedSignals.history[i]
          tableData.push({ record: `${item.value}`, date: this.formatDate(item.date) })
        }
      }
      return tableData
    },
    beforeCloseHandler () {
      this.tableData = []
    },
    switchSortStatus () {
      this.startSort = !this.startSort
    },
    mountSortable () {
      this.$nextTick(() => {
        if (this.sortable) {
          this.sortable.destroy()
        }
        this.sortable = Sortable.create(this.$refs.vxTable.$el.querySelector('.body--wrapper>.vxe-table--body tbody'),
          {
            group: { name: 'SignalWatch' },
            handle: '.drag-btn',
            onUpdate: this.dragSortDone()
          })
      })
    },
    dragSortDone () {
      return ({ newIndex, oldIndex }) => {
        const dragRow = this.tableData.splice(oldIndex, 1)[0]
        this.tableData.splice(newIndex, 0, dragRow)
      }
    }
  },
  mounted () {
    this.$vbus.$on('OPEN_WATCH_DIALOG', this.openDialog)
    this.$vbus.$on('QUIT_DEBUG_MODE', this.closeDialog)
    this.$vbus.$on('REFRESH_OPENED_SIGNALS', this.init)
  },
  beforeDestroy () {
    if (this.sortable) {
      this.sortable.destroy()
    }
  },
  destroyed () {
    this.$vbus.$off('OPEN_WATCH_DIALOG', this.openDialog)
    this.$vbus.$off('QUIT_DEBUG_MODE', this.closeDialog)
    this.$vbus.$off('REFRESH_OPENED_SIGNALS', this.init)
  }
}
</script>

<style scoped>
.m_title_btn {
  padding: 4px;
  border: 0;
  height: 26px;
  width: 26px;
  font-size: 18px;
}

.record_btn_on {
  background: red;
  color: white;
}

.m_sort_btn {
  color: white;
  background: #67C23A;
}

.m_title_btn:hover {
  background: #409eff;
  opacity: 0.5;
  color: white;
}
</style>
<style lang="scss">
.signalWatchDialog {
  .vxe-modal--box .vxe-modal--body .vxe-modal--content {
    padding: 0;
    overflow: hidden;
  }

  .disconnected {
    color: grey;
    font-style: italic
  }
}
</style>
