<template>
  <div class="rackView">
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
        stripe
        size="mini"
        align="center"
        :keep-source="true"
        show-overflow
        :column-config="{resizable: true}"
        :row-config="{isCurrent: true, isHover: true, keyField: 'id'}"
        :edit-config="{trigger: 'dblclick', mode: 'cell', showStatus: true, showIcon: true, beforeEditMethod: activeMethod}"
        :edit-rules="validRules"
        @edit-actived="editActiveHandler"
        @edit-closed="editDone"
        @cell-click="cellClickHandler"
        ref="vxTable">
        <vxe-column field="slot" title="槽号" width="45"></vxe-column>
        <vxe-column field="desc" title="描述" width="200"
                    :edit-render="{name: 'VxeInput', props: {clearable:true}}"></vxe-column>
        <vxe-column field="type" title="当前板卡" width="150" :edit-render="{}">
          <template v-slot="{row}">
            {{ getCurrentBoardTypeInfo(row) }}
          </template>
          <template v-slot:edit="{row}">
            <vxe-select v-model="row.type" placeholder="" transfer ref="vxSelect">
              <vxe-option v-for="(opt,index) in row.optTypeList"
                          :key="index"
                          :label="opt"
                          :value="opt"></vxe-option>
            </vxe-select>
          </template>
        </vxe-column>
        <vxe-column field="slotAbilityList" title="板卡能力" width="200"
                    :edit-render="{name: 'VxeInput', props: {clearable:true}}">
          <template v-slot="{row}">
            {{ getBoardAbilityInfo(row) }}
          </template>
        </vxe-column>
        <vxe-column field="optTypeList" title="可选板卡" width="400" :edit-render="{}">
          <template v-slot:edit="{row}">
            <vxe-select v-model="row.optTypeList"
                        placeholder=""
                        transfer
                        multiple
                        clearable
                        @change="optListChangeHandler(row)"
                        :option-groups="groupOptions(row)"
                        ref="vxSelect"/>
          </template>
        </vxe-column>
      </vxe-table>
    </div>
  </div>
</template>

<script>
import * as R from 'ramda'
import { loadRackTemplates } from '@/renderer/pages/nextStudio/action'
import { getBoardAbilityEnumString } from '@/model/enum'

export default {
  name: 'rackView',
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
      return this.boards.map(board => ({ ...board }))
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

<style scoped>
.rackView {
  height: 100%;
  width: 100%;
}
</style>
