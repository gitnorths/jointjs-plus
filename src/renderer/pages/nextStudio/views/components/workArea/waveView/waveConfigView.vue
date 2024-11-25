<template>
  <div id="waveConfigContainer">
    <el-row class="waveConfig">
      <el-form
        :model="waveConfigForm"
        label-position="left"
        label-width="120px"
        size="small"
        inline
        ref="waveForm">
        <el-form-item label="录波实例名">
          <el-input v-model="waveConfigForm.name" clearable readonly/>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="waveConfigForm.desc" clearable @change="editDone('desc')" :readonly="debugMode"/>
        </el-form-item>
        <el-form-item label="最大保存整组数">
          <el-input v-model="waveConfigForm.maxItemNum" clearable @change="editDone('maxItemNum')"
                    :readonly="debugMode"/>
        </el-form-item>
        <el-form-item label="低优先级保留数">
          <el-input v-model="waveConfigForm.minItemNum" clearable @change="editDone('minItemNum')"
                    :readonly="debugMode"/>
        </el-form-item>
        <el-form-item label="最大录波点数">
          <el-input v-model="waveConfigForm.maxRecordNum" clearable @change="editDone('maxRecordNum')"
                    :readonly="debugMode"/>
        </el-form-item>
      </el-form>
    </el-row>
    <el-row class="frequencyItems">
      <vxe-toolbar size="mini">
        <template v-slot:buttons>
          <span style="font-size:14px;">频率属性 </span>
        </template>
      </vxe-toolbar>
      <vxe-table
        stripe
        border
        auto-resize
        size="mini"
        align="center"
        show-overflow
        :loading="loading"
        :column-config="{resizable: true}"
        :row-config="{isCurrent: true, isHover: true, keyField: 'id', useKey: true}"
        :edit-config="{trigger: 'dblclick', mode: 'cell', showIcon: true}"
        :checkbox-config="{trigger: 'cell', range: true}"
        :data="tableData"
        :menu-config="tableMenu"
        :edit-rules="validRules"
        :row-class-name="rowClassName"
        @edit-actived="editActiveHandler"
        @edit-closed="editDone"
        @cell-click="cellClickHandler"
        @menu-click="contextMenuClickHandler"
        ref="vxTable">
        <vxe-column type="checkbox" width="44" align="left"></vxe-column>
        <vxe-column field="index" title="#" width="42" :class-name="columnClassName"></vxe-column>
        <vxe-column field="value" title="录波频率" width="160" :edit-render="{name: 'VxeInput'}"
                    :class-name="columnClassName"></vxe-column>
        <vxe-column field="type" title="数据类型" width="160" :edit-render="{autofocus: ['.vxe-input--inner']}"
                    :class-name="columnClassName">
          <template v-slot="{row}">
            {{ typeStr(row.type) }}
          </template>
          <template v-slot:edit="{row}">
            <vxe-select v-model="row.type" transfer ref="vxSelect" clearable>
              <vxe-option v-for="opt in typeOptions" :key="opt.value" :value="opt.value" :label="opt.label"/>
            </vxe-select>
          </template>
        </vxe-column>
        <vxe-column field="num" title="记录点数" width="160" :edit-render="{name: 'VxeInput'}"
                    :class-name="columnClassName"></vxe-column>
      </vxe-table>
    </el-row>
  </div>
</template>

<script>
import * as R from 'ramda'
import { getObjContext } from '@/renderer/pages/nextStudio/action'
import { EnableStatusEnum, WaveFrequencyTypeEnum } from '@/model/enum'

export default {
  name: 'waveConfigView',
  props: {
    tagKey: {
      type: String,
      required: true
    }
  },
  computed: {
    deviceDbName () {
      return this.$store.getters.deviceDbName
    },
    debugMode () {
      return this.$store.getters.debugMode
    },
    waveInst () {
      return this.$store.getters.selectDto(this.tagKey)
    }
  },
  watch: {},
  data () {
    return {
      loading: false,
      waveConfigForm: {
        name: '',
        desc: '',
        custom: 0,
        inst: null,
        maxItemNum: 0,
        minItemNum: 0,
        maxRecordNum: 0
      },
      tableData: [],
      orgTableDataMap: {},
      updateMap: {}, // {$id:{$field:true}} true-修改过，false-不变
      insertIdList: [], // [$id],
      removeList: [], // [$row]
      validRules: {},
      tableMenu: {
        body: {
          options: [
            [
              { code: 'remove', name: '删除', prefixIcon: 'el-icon-delete', visible: true, disabled: false },
              { code: 'remove-select', name: '删除选中', prefixIcon: 'el-icon-delete', visible: true, disabled: false }
            ]
          ]
        },
        visibleMethod: this.visibleMethod
      },
      typeOptions: [
        { label: '瞬时', value: WaveFrequencyTypeEnum.INSTANT },
        { label: '幅值', value: WaveFrequencyTypeEnum.AMPLITUDE }
      ]
    }
  },
  methods: {
    typeStr (type) {
      switch (type) {
        case WaveFrequencyTypeEnum.INSTANT:
          return '瞬时'
        case WaveFrequencyTypeEnum.AMPLITUDE:
          return '幅值'
      }
    },
    init () {
      this.clear()
      this.loading = true

      this.waveConfigForm.name = this.waveInst.name
      this.waveConfigForm.desc = this.waveInst.desc
      this.waveConfigForm.custom = this.waveInst.custom
      this.waveConfigForm.inst = this.waveInst.inst

      getObjContext(this.waveInst, this.deviceDbName)
        .then((config) => {
          this.waveConfigForm.maxItemNum = config.maxItemNum
          this.waveConfigForm.minItemNum = config.minItemNum
          this.waveConfigForm.maxRecordNum = config.maxRecordNum
          this.orgTableDataMap[this.waveConfigForm.id] = { ...this.waveConfigForm }

          if (config.frequencies && R.isNotEmpty(config.frequencies)) {
            this.tableData = config.frequencies.map(freq => {
              const obj = { ...freq }
              this.orgTableDataMap[obj.id] = { ...obj }
              return obj
            })
          }
        })
        .catch(e => {
          const message = `录波实例[${this.waveConfigForm.inst}]数据刷新失败，{${e}}，请稍后重试`
          this.$notification.openErrorNotification(message).logger()
        })
        .finally(() => {
          this.loading = false
        })
    },
    clear () {
      this.$refs.waveForm.resetFields()
      this.tableData = []
      this.orgTableDataMap = {}
      this.updateMap = {}
      this.insertIdList = []
      this.removeList = []
      this.recordSet = { insertRecords: [], updateRecords: [], removeRecords: [] }
    },
    rowClassName ({ row }) {
      if (row) {
        if (row.status === EnableStatusEnum.DIRTY) {
          return 'enable_status_dirty'
        } else if (row.status === EnableStatusEnum.OFF) {
          return 'enable_status_off'
        } else if (row.status === EnableStatusEnum.Disabled) {
          return 'enable_status_disabled'
        }
      }
      return ''
    },
    columnClassName ({ row, column }) {
      const existInInsertList = R.indexOf(row.id, this.insertIdList) > -1
      if (existInInsertList) {
        return 'col--dirty'
      }
      const existInUpdateMap = this.updateMap[row.id]
      if (existInUpdateMap && existInUpdateMap[column.property]) {
        return 'col--dirty'
      }
      return ''
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
    visibleMethod ({ options, row }) {
      if (row) {
        this.$refs.vxTable.setCurrentRow(row)
      }
      const selectRecords = this.$refs.vxTable.getCheckboxRecords()
      options.forEach(list => {
        list.forEach(item => {
          if (['remove-select'].includes(item.code)) {
            item.disabled = selectRecords.length < 1
          }
        })
      })
      return true
    },
    contextMenuClickHandler ({ menu, row }) {
      switch (menu.code) {
        case 'remove':
          this.removeRow(row)
          break
        case 'remove-select':
          this.removeRow()
          break
      }
    },
    editDone (property) {
      console.log(property)
      // TODO
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
#waveConfigContainer {
  height: 100%;
  width: 100%;
  overflow: auto;

  .waveConfig {
    width: 100%;
    padding: 15px 0 0 20px;
    min-height: 120px
  }

  .frequencyItems {
    padding: 0 20px;
    width: 100%;
  }
}
</style>
