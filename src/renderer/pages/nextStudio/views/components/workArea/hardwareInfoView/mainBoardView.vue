<template>
  <div class="verticalMainBoardView">
    <vxe-toolbar size="mini">
      <template v-slot:buttons>
        <span style="font-size:15px; margin:0 10px 0 10px">机箱型号: {{ rackType }}</span>
        <span style="font-size:15px; margin:0 10px 0 10px">机箱类型: {{ rackSize }}</span>
        <vxe-button status="primary" icon="fa fa-repeat" style="margin-left: 12px"
                    @click="refreshTemplates"></vxe-button>
      </template>
    </vxe-toolbar>
    <div style="height: calc(100% - 47px);width: 100%">
      <vxe-table
        :data="tableData"
        height="auto"
        auto-resize
        border
        size="mini"
        align="center"
        :keep-source="true"
        :resizable-config="{refreshDelay: 0}"
        :column-config="{isCurrent: true, isHover: true, resizable: true}"
        :row-config="{keyField: 'name'}"
        :edit-config="{trigger: 'dblclick', mode: 'cell', showStatus: true, showIcon: true, beforeEditMethod: activeMethod}"
        :edit-rules="validRules"
        @edit-actived="editActiveHandler"
        @edit-closed="editDone"
        @cell-click="cellClickHandler"
        ref="vxTable">
        <vxe-column title="槽号" field="name" min-width="80" fixed="left" class-name="slot-even"></vxe-column>
        <vxe-column v-for="(item, index) in boards" :title="getTitle(item)" :field="getField(item)" min-width="80"
                    :key="index" :class-name="getColumnClass(index)"></vxe-column>
      </vxe-table>
    </div>
  </div>
</template>

<script>
import * as R from 'ramda'
import { loadRackTemplates } from '@/renderer/pages/nextStudio/action'
import { getBoardAbilityEnumString } from '@/model/enum'

export default {
  name: 'MainBoardView',
  props: {
    boards: { type: Array, required: true }
  },
  computed: {
    device () {
      return this.$store.getters.device
    },
    rackType: {
      get () {
        return this.device.hardware.rackType || 'SYXXX'
      },
      set (val) {
        this.device.hardware.rackType = val
      }
    },
    rackSize: {
      get () {
        return this.device.hardware.rackSize || '整层'
      },
      set (val) {
        this.device.hardware.rackSize = val
      }
    },
    rackLib () {
      return this.$store.getters.rackLib
    },
    boardLib () {
      return this.$store.getters.boardLib
    },
    tableData () {
      // 插槽能力，当前板卡，板卡型号，描述，可选板卡，备选列表
      const rows = [
        { name: '插槽能力' },
        { name: '当前板卡' },
        { name: '板卡分类' },
        { name: '能力描述' },
        { name: '可选板卡' },
        { name: '备选1' },
        { name: '备选2' },
        { name: '备选3' },
        { name: '备选4' },
        { name: '备选5' },
        { name: '备选6' },
        { name: '备选7' },
        { name: '备选8' }
      ]
      this.boards.forEach(board => {
        const key = this.getField(board)
        rows[0][key] = board.slotAbilityList && R.isNotEmpty(board.slotAbilityList)
          ? board.slotAbilityList.map(a => getBoardAbilityEnumString(Number(a))).join(', ')
          : ''
        rows[1][key] = board.type
        rows[2][key] = R.isNotNil(board.ability) ? getBoardAbilityEnumString(board.ability) : ''
        rows[3][key] = board.desc
        rows[4][key] = board.optional ? '是' : ''
        // 备选
        rows[5][key] = ''
        rows[6][key] = ''
        rows[7][key] = ''
        rows[8][key] = ''
        rows[9][key] = ''
        rows[10][key] = ''
        rows[11][key] = ''
        rows[12][key] = ''
        for (let i = 0; i < board.optTypeList.length; i++) {
          rows[5 + i][key] = board.optTypeList[i]
        }
      })

      return rows
    },
    debugMode () {
      return this.$store.getters.debugMode
    }
  },
  data () {
    const descValid = ({ cellValue, row, column }) => {
      if (R.isNotEmpty(row.optTypeList) && !cellValue) {
        return new Error(`${column.title}必须有值`)
      }
    }
    const optListValid = ({ cellValue, column }) => {
      if (R.equals(['None'], cellValue)) {
        return new Error(`${column.title}不允许只包含None`)
      }
    }
    return {
      validRules: {
        optTypeList: [
          { validator: optListValid }
        ]
      }
    }
  },
  methods: {
    getTitle (item) {
      return `slot${item.slot}`
    },
    getField (item) {
      return `slot${item.slot}`
    },
    getColumnClass (index) {
      return index % 2 === 0 ? 'slot-odd' : 'slot-even'
    },
    refreshTemplates () {
      loadRackTemplates()
      this.$notification.openSuccessNotification('机箱模板刷新成功')
    },
    activeMethod () {
      return !this.debugMode
    },
    groupOptions (row) {
      const rackTemp = R.find(R.propEq(this.rackType, 'type'))(this.rackLib)
      const slotGroup = rackTemp.slots[row.slot - 1]
      if (!slotGroup) {
        return []
      }

      const boardGroupNames = slotGroup.boardGroup

      const optionGroups = [{ label: '可选板卡组', options: [{ label: 'None', value: 'None' }] }]

      this.boardLib
        .filter((boardGroup) => R.includes(boardGroup.name, boardGroupNames))
        .forEach((boardGroup) => {
          optionGroups.push({
            label: `${boardGroup.name} 板卡组`,
            options: boardGroup.boards.map((board) => ({ label: board.type, value: board.type }))
          })
        })
      return optionGroups
    },
    getCurrentBoardTypeInfo (row) {
      if (row.type) {
        return `${row.type} : ${getBoardAbilityEnumString(row.ability)}`
      }
      return ''
    },
    getBoardAbilityInfo (row) {
      if (row.slotAbilityList && R.isNotEmpty(row.slotAbilityList)) {
        return row.slotAbilityList.map(a => getBoardAbilityEnumString(Number(a))).join(', ')
      }
      return ''
    },
    optListChangeHandler (row) {
      if (!row.optTypeList || !row.optTypeList.includes(row.type)) {
        row.type = ''
      }
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
      this.$refs.vxTable.fullValidate(true)
        .then((errMap) => {
          if (errMap) {
            return
          }
          this.$emit('edit-done')
        })
        .catch(e => {
          this.$notification.openErrorNotification('校验失败' + e).logger()
          return e
        })
    },
    getDelta () {
      return this.$refs.vxTable.getRecordset()
    }
  },
  mounted () {
    loadRackTemplates()
  }
}
</script>

<style lang="scss">
.verticalMainBoardView {
  height: 100%;
  width: 100%;

  .slot-odd {

  }

  .slot-even {
    background-color: #fafafa;
  }
}
</style>
