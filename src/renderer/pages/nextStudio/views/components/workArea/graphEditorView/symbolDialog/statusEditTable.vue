<template>
  <div id="statusEditTableContainer">
    <vxe-table
      :data="tableData"
      auto-resize
      border
      stripe
      height="auto"
      size="mini"
      align="center"
      keep-source
      show-overflow
      :row-config="{isCurrent: true, isHover: true, keyField: 'id'}"
      :edit-config="{trigger: 'dblclick', mode: 'cell', showStatus: true, showIcon: false}"
      :edit-rules="validRules"
      @edit-actived="editActiveHandler"
      @edit-closed="editDone"
      @cell-click="cellClickHandler"
      ref="vxTable">
      <vxe-table-column field="name" fixed="left" width="60"></vxe-table-column>
      <vxe-table-column v-for="(input, key) in inputs" :key="key" :field="input.name" min-width="65"
                        :title="input.name" :edit-render="{autofocus: '.vxe-input--inner'}">
        <template v-slot="{row}">
          {{ calcLabel(row.valueList, row[input.name]) }}
        </template>
        <template v-slot:edit="{row}">
          <vxe-select v-model="row[input.name]" style="display: inline-block;width: 100%" transfer ref="vxSelect">
            <vxe-option v-for="(label, index) in row.valueList.split(' ')" :key='index' :value="`${index}`"
                        :label="label"/>
          </vxe-select>
        </template>
      </vxe-table-column>
    </vxe-table>
  </div>
</template>

<script>

import { EnableStatusEnum } from '@/model/enum'

export default {
  name: 'statusEditTable',
  data () {
    return {
      validRules: {},
      tableData: []
    }
  },
  computed: {
    interlock () {
      return this.$store.getters.vfbInst
    },
    inputs () {
      return this.interlock ? this.interlock.inputs.filter(iop => /^in/.test(iop.name) && iop.status !== EnableStatusEnum.DIRTY) : []
    },
    outputs () {
      return this.interlock ? this.interlock.outputs.filter(iop => /out/.test(iop.name) && iop.status !== EnableStatusEnum.DIRTY) : []
    },
    params () {
      return this.interlock ? this.interlock.params.filter(iop => iop.status !== EnableStatusEnum.DIRTY) : []
    }
  },
  methods: {
    calcLabel (valueList, val) {
      if (!valueList || !val) {
        return ''
      }
      const arr = valueList.split(' ')
      const index = Number(val)
      if (R.isNotEmpty(arr) && R.is(Number, index)) {
        return arr[index]
      }
    },
    init () {
      this.clear()
      for (let i = 0; i < this.outputs.length; i++) {
        const output = this.outputs[i]
        const param = this.params[i]
        const item = {
          name: output.name,
          paramName: param.name,
          valueList: param.valueList
        }
        for (let j = 0; j < this.inputs.length; j++) {
          const input = this.inputs[j]
          // 获取对应的param的setValue
          const listArrSetValue = param.listArrSetValues[j]
          item[input.name] = listArrSetValue ? listArrSetValue.value : ''
        }
        this.tableData.push(item)
      }
    },
    clear () {
      this.tableData = []
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
        if (this.$refs.vxSelect && R.isNotEmpty(this.$refs.vxSelect)) {
          this.$refs.vxSelect[0].focus()
          this.$refs.vxSelect[0].togglePanel()
        }
      })
    },
    editDone () {
      const updateRecords = this.$refs.vxTable.getUpdateRecords()
      const delta = []
      if (R.isNotEmpty(updateRecords)) {
        for (const record of updateRecords) {
          const param = R.find(R.propEq(record.paramName, 'name'))(this.params)
          for (const input of this.inputs) {
            const listArrSetValue = R.find(R.propEq(`${param.name}_${input.name.replace(/^in/, '')}`, 'name'))(param.listArrSetValues)
            listArrSetValue.value = record[input.name]
            delta.push(listArrSetValue)
          }
        }
      }
      this.$store.commit('recordVfbDelta', { key: 'interlockStatus', delta })
    },
    fullValidate () {
      return this.$refs.vxTable.fullValidate()
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

<style scoped>
#statusEditTableContainer {
  height: 100%;
  width: 100%;
  overflow: hidden;
}
</style>
