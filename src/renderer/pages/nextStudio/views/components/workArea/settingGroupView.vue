<template>
  <div id="settingGroupViewContainer">
    <vxe-table
      stripe
      border
      height="auto"
      auto-resize
      size="mini"
      align="center"
      show-overflow
      :loading="loading"
      :column-config="{resizable: true}"
      :row-config="{isCurrent: true, isHover: true, keyField: 'id', useKey: true}"
      :edit-config="{trigger: 'dblclick', mode: 'cell', showIcon: true, beforeEditMethod: activeMethod}"
      :checkbox-config="{trigger: 'cell', range: true}"
      :data="pageTableData"
      :menu-config="tableMenu"
      :edit-rules="validRules"
      :row-class-name="rowClassName"
      @edit-actived="editActiveHandler"
      @edit-closed="editDone"
      @cell-click="cellClickHandler"
      @menu-click="contextMenuClickHandler"
      ref="vxTable">
      <vxe-column width="36" class-name="drag-btn">
        <template>
          <span>
            <i class="fa fa-sort"></i>
          </span>
        </template>
        <template v-slot:header>
          <vxe-tooltip v-model="showHelpTip" content="按住后可以上下拖动排序！" enterable>
            <i class="vxe-icon--question" @click="showHelpTip = !showHelpTip"></i>
          </vxe-tooltip>
        </template>
      </vxe-column>
      <vxe-column type="checkbox" width="44" align="left"></vxe-column>
      <vxe-column field="index" title="#" width="42" :class-name="columnClassName"></vxe-column>
      <vxe-column field="name" title="变量名" width="300" align="left" header-align="center" :show-overflow="false"
                  :class-name="columnClassName">
        <template v-slot="{row}">
          <div>{{ row.name }}</div>
          <div v-for="(mergeItem, index) in row.merges" :key="index" :class="rowClassName({row: mergeItem})">
            {{ mergeItem.name }}
          </div>
        </template>
      </vxe-column>
      <vxe-column field="abbr" title="词条" width="140" :edit-render="{name: 'VxeInput'}"
                  :class-name="columnClassName"></vxe-column>
      <vxe-column field="desc" title="描述" width="140" :edit-render="{name: 'VxeInput'}"
                  :class-name="columnClassName"></vxe-column>

      <vxe-column field="pMin" title="一次最小值" width="96" :edit-render="{name: 'VxeInput'}"
                  :class-name="columnClassName"></vxe-column>
      <vxe-column field="pMax" title="一次最大值" width="96" :edit-render="{name: 'VxeInput'}"
                  :class-name="columnClassName"></vxe-column>
      <vxe-column field="pNorm" title="一次额定值" width="96" :edit-render="{name: 'VxeInput'}"
                  :class-name="columnClassName"></vxe-column>
      <vxe-column field="sMin" title="二次最小值" width="96" :edit-render="{name: 'VxeInput'}"
                  :class-name="columnClassName"></vxe-column>
      <vxe-column field="sMax" title="二次最大值" width="96" :edit-render="{name: 'VxeInput'}"
                  :class-name="columnClassName"></vxe-column>
      <vxe-column field="sNorm" title="二次额定值" width="96" :edit-render="{name: 'VxeInput'}"
                  :class-name="columnClassName"></vxe-column>
      <vxe-column field="format" title="显示格式" width="96" :edit-render="{name: 'VxeInput'}"
                  :class-name="columnClassName"></vxe-column>

      <vxe-column v-if="!multiSet" field="globalSetValue" title="公共定值" min-width="90"
                  :edit-render="{autofocus: ['.vxe-input--inner']}"
                  :class-name="columnClassName">
        <template v-slot="{row}">
          {{ formatSetValue(row, row.globalSetValue) }}
        </template>
        <template v-slot:edit="{row}">
          <vxe-select v-if="isListType(row)" v-model="row.globalSetValue" clearable ref="vxSelect" transfer>
            <vxe-option v-for="(opt, index) in row.valueList.split(' ')" :key="index" :label="opt"
                        :value="`${index}`"/>
          </vxe-select>
          <vxe-input v-else v-model="row.globalSetValue"></vxe-input>
        </template>
      </vxe-column>
      <vxe-column v-else :field="`multiSetValue${multiIndex}`"
                  v-for="multiIndex in R.range(0, multiSegGroupNum)" :key='multiIndex'
                  :title="`定值区${multiIndex + 1}`" min-width="90"
                  :edit-render="{autofocus: ['.vxe-input--inner']}"
                  :class-name="columnClassName">
        <template v-slot="{row}">
          {{ formatSetValue(row, row[`multiSetValue${multiIndex}`]) }}
        </template>
        <template v-slot:edit="{row}">
          <vxe-input v-if="!row.valueList" v-model="row[`multiSetValue${multiIndex}`]"></vxe-input>
          <vxe-select v-else v-model="row[`multiSetValue${multiIndex}`]" clearable ref="vxSelect" transfer>
            <vxe-option v-for="(opt, index) in row.valueList.split(' ')" :key="index" :label="opt"
                        :value="`${index}`"/>
          </vxe-select>
        </template>
      </vxe-column>
      <vxe-column field="matrix" title="跳闸矩阵" width="90" :edit-render="{name: 'VxeInput'}"
                  :class-name="columnClassName"></vxe-column>
    </vxe-table>
    <vxe-pager
      perfect
      size="mini"
      :current-page="currentPage"
      :page-size="pageSize"
      :total="totalResult"
      :loading="loading"
      :layouts="['PrevPage', 'JumpNumber', 'NextPage', 'FullJump', 'Sizes', 'Total']"
      @page-change="pageChangeHandler">
    </vxe-pager>
  </div>
</template>

<script>
import * as _ from 'lodash'
import * as R from 'ramda'
import Sortable from 'sortablejs'
import { v4 as uuid } from 'uuid'
import { tableMixin } from './tableMixin'
import { checkExistInOtherSettingGroup, getObjContext, getParamList } from '@/renderer/pages/nextStudio/action'
import { YesNoEnum } from '@/model/enum'
import { SettingGroupItem, SettingGroupItemMerge } from '@/model/dto'

export default {
  name: 'settingGroupView',
  mixins: [tableMixin],
  computed: {
    multiSet () {
      return this.groupDto.multiSet === YesNoEnum.YES
    },
    multiSegGroupNum () {
      return this.$store.getters.device.config.settingGroup.sectionNum
    }
  },
  watch: {},
  data () {
    return {
      tableMenu: {
        body: {
          options: [
            [
              { code: 'merge', name: '合并', prefixIcon: 'fa fa-object-group', visible: true, disabled: false },
              { code: 'split', name: '拆分', prefixIcon: 'fa fa-object-ungroup', visible: true, disabled: false }
            ],
            [
              { code: 'remove', name: '删除', prefixIcon: 'el-icon-delete', visible: true, disabled: false },
              { code: 'remove-select', name: '删除选中', prefixIcon: 'el-icon-delete', visible: true, disabled: false }
            ],
            [
              { code: 'batch-edit', name: '批量编辑', prefixIcon: 'el-icon-edit', visible: true, disabled: false }
            ]
          ]
        },
        visibleMethod: this.visibleMethod
      },
      activeMethod ({ column }) {
        return column.field !== ''
      }
    }
  },
  methods: {
    visibleMethod ({ options, row }) {
      if (row) {
        this.$refs.vxTable.setCurrentRow(row)
      }
      const selectRecords = this.$refs.vxTable.getCheckboxRecords()
      options.forEach(list => {
        list.forEach(item => {
          if (['merge'].includes(item.code)) {
            item.disabled = selectRecords.length < 2
          }
          if (['split'].includes(item.code)) {
            item.disabled = !(row && row.merges && row.merges.length > 0)
          }
          if (['remove-select'].includes(item.code)) {
            item.disabled = selectRecords.length < 1
          }
          if (['batch-edit'].includes(item.code)) {
            item.disabled = selectRecords.length < 2
          }
        })
      })
      return true
    },
    contextMenuClickHandler ({ menu, row }) {
      switch (menu.code) {
        case 'merge':
          this.merge()
          break
        case 'split':
          this.splitRow(row)
          break
        case 'remove':
          this.removeRow(row)
          break
        case 'remove-select':
          this.removeRow()
          break
        case 'batch-edit':
          this.batchEdit()
      }
    },
    isListType (row) {
      // TODO 枚举类型
      // const type = row.type
      return false
    },
    formatSetValue (row, strValue) {
      const valueList = row.valueList
      if (this.isListType(row)) {
        // 列表类型
        if (R.isNotEmpty(valueList) && (strValue)) {
          return valueList.split(' ')[Number(strValue)]
        } else {
          return strValue
        }
      } else {
        return strValue
      }
    },
    init () {
      this.clear()
      this.loading = true
      setTimeout(() => {
        // FIXME
        getObjContext(this.groupDto, this.deviceDbName)
          .then((items) => {
            this.tableData = items.map((md) => {
              const obj = { ...md }
              if (this.multiSet) {
                for (let i = 0; i < this.multiSegGroupNum; i++) {
                  obj[`multiSetValue${i}`] = obj.multiSetValues ? obj.multiSetValues[i] : ''
                }
              }
              this.orgTableDataMap[obj.id] = _.cloneDeep(obj)
              return obj
            })
            this.reloadPageTableData()
          })
          .catch((e) => {
            const message = `定值分组[${this.groupDto.title}]数据刷新失败，{${e}}，请稍后重试`
            this.$notification.openErrorNotification(message).logger()
          })
          .finally(() => {
            this.loading = false
          })
      }, 10)
    },
    mountSortable () {
      // FIXME 修复空数据拖拽问题
      this.$nextTick(() => {
        if (this.sortable) {
          this.sortable.destroy()
        }
        this.sortable = Sortable.create(this.$refs.vxTable.$el.querySelector('.body--wrapper>.vxe-table--body tbody'),
          {
            group: { name: 'SettingGroup', put: ['VarTreeParam'] },
            handle: '.drag-btn',
            onUpdate: this.dragSortDone(),
            onAdd: this.insertDone()
          })
      })
    },
    refresh (ignoreTagKeys) {
      // 只有明确标出跳过的tagKey不需要刷新，否则都需要跟着刷新
      if (ignoreTagKeys && R.includes(this.tagKey, ignoreTagKeys)) {
        return
      }
      this.loading = true
      getObjContext(this.groupDto, this.deviceDbName)
        .then((items) => {
          if (R.isNotEmpty(items)) {
            // 刷新tableData
            items.forEach((item) => {
              const row = R.find(R.propEq(item.id, 'id'))(this.tableData)
              if (row) {
                row.name = item.name
                row.status = item.status
                row.desc = item.desc
                row.abbr = item.abbr
                if (this.multiSet) {
                  for (let i = 0; i < this.multiSegGroupNum; i++) {
                    row[`multiSetValue${i}`] = item.multiSetValues ? item.multiSetValues[i] : ''
                  }
                } else {
                  row.globalSetValue = item.globalSetValue
                }
                // 刷新ns
                if (R.isNotEmpty(item.merges)) {
                  row.merges.forEach((merges) => {
                    const nsRefreshedNs = R.find(R.propEq(merges.id, 'id'))(item.merges)
                    if (nsRefreshedNs) {
                      merges.name = nsRefreshedNs.name
                      row.status = nsRefreshedNs.status
                    }
                  })
                }
              }
              const orgData = this.orgTableDataMap[item.id]
              if (orgData) {
                orgData.name = item.name
                orgData.status = item.status
                orgData.desc = item.desc
                orgData.abbr = item.abbr
                if (this.multiSet) {
                  for (let i = 0; i < this.multiSegGroupNum; i++) {
                    orgData[`multiSetValue${i}`] = item.multiSetValues ? item.multiSetValues[i] : ''
                  }
                } else {
                  orgData.globalSetValue = item.globalSetValue
                }
                // 刷新ns
                if (R.isNotEmpty(item.merges)) {
                  orgData.merges.forEach((merges) => {
                    const nsRefreshedNs = R.find(R.propEq(merges.id, 'id'))(item.merges)
                    if (nsRefreshedNs) {
                      merges.name = nsRefreshedNs.name
                      // FIXME ns不存在如何处理
                      orgData.status = nsRefreshedNs.status
                    }
                  })
                }
              }
            })
          }
        })
        .catch((e) => {
          const message = `[${this.groupDto.title}]数据刷新失败，{${e}}，请稍后重试`
          this.$notification.openErrorNotification(message).logger()
        })
        .finally(() => {
          this.loading = false
        })
    },
    recordDelta () {
      this.recordSet.insertRecords = []
      this.recordSet.updateRecords = []
      this.tableData.forEach(row => {
        if (this.insertIdList.includes(row.id)) {
          this.recordSet.insertRecords.push(row)
        }
        if (this.updateMap[row.id]) {
          this.recordSet.updateRecords.push(row)
        }
      })

      this.recordSet.removeRecords = this.removeList

      if (this.multiSet) {
        if (R.isNotEmpty(this.recordSet.insertRecords)) {
          this.recordSet.insertRecords = this.recordSet.insertRecords.map(record => {
            record.multiSetValues = record.multiSetValues || []
            for (let i = 0; i < this.multiSegGroupNum; i++) {
              record.multiSetValues[i] = record[`multiSetValue${i}`]
            }
            return record
          })
        }
        if (R.isNotEmpty(this.recordSet.updateRecords)) {
          this.recordSet.updateRecords = this.recordSet.updateRecords.map(record => {
            record.multiSetValues = record.multiSetValues || []
            for (let i = 0; i < this.multiSegGroupNum; i++) {
              record.multiSetValues[i] = record[`multiSetValue${i}`]
            }
            return record
          })
        }
      }
      this.$store.commit('updateDelta', { key: this.tagKey, delta: this.recordSet })
    },
    editActiveHandler ({ rowIndex, columnIndex }) {
      this.activeRowIndex = rowIndex
      this.activeColumnIndex = columnIndex
      this.$nextTick(() => {
        if (this.$refs.vxSelect) {
          if (this.multiSet) {
            if (R.isNotEmpty(this.$refs.vxSelect)) {
              this.$refs.vxSelect[0].focus()
              this.$refs.vxSelect[0].togglePanel()
            }
          } else {
            this.$refs.vxSelect.focus()
            this.$refs.vxSelect.togglePanel()
          }
        }
      })
    },
    checkExistInTable (toInsertRecord) {
      const result = {
        exist: false,
        msg: ''
      }
      if (R.isEmpty(this.tableData)) {
        return result
      }
      if (!toInsertRecord.name) {
        return result
      }
      for (const row of this.tableData) {
        if (row.name === toInsertRecord.name) {
          result.exist = true
          result.msg = `和第[${row.index}]条数据冲突`
          break
        } else if (R.isNotEmpty(row.merges)) {
          for (const merges of row.merges) {
            if (merges.name === toInsertRecord.name) {
              result.exist = true
              result.msg = `和第[${row.index}]条数据冲突`
              break
            }
          }
        }
      }
      return result
    },
    async insertOne (varTreeParam, newIndex) {
      // 查询na是否被删除过，如果被删除，则认为是使用na对应的新数据更新
      const existIndexInRemove = R.findIndex(R.whereEq({ name: varTreeParam.sAddr }), this.removeList)

      let id
      if (existIndexInRemove >= 0) {
        id = this.removeList[existIndexInRemove].id
        this.removeList.splice(existIndexInRemove, 1)
      } else {
        id = uuid()
        this.insertIdList.push(id)
      }
      const toInsertRecord = { ...(new SettingGroupItem(varTreeParam)) }
      toInsertRecord.id = id
      toInsertRecord.name = varTreeParam.sAddr // 使用短地址作为name
      toInsertRecord.valueList = varTreeParam.valueList
      toInsertRecord.groupId = this.groupDto.id

      // 校验当前数据是否已经在当前组存在
      const existInTable = this.checkExistInTable(toInsertRecord)
      if (existInTable.exist) {
        this.$notification.openErrorNotification(`插入失败，${toInsertRecord.name} ${existInTable.msg}`)
        return
      }

      if (!this.multiSet) {
        toInsertRecord.globalSetValue = varTreeParam.value
      }
      if (existIndexInRemove < 0) {
        // 校验当前数据是否已经在定值分组中使用过
        const result = checkExistInOtherSettingGroup(toInsertRecord)
        if (result && result.exist) {
          this.$notification.openErrorNotification(`插入失败，${toInsertRecord.name} ${result.msg}`)
          return
        }
      }

      this.pageTableData.splice(newIndex, 0, toInsertRecord)
      // tableData插入
      this.tableData.splice(this.calcIndexInTableData(newIndex), 0, toInsertRecord)
      this.tableData.forEach((row, index) => {
        row.index = index
        this.judgeRowChanged(row, ['index'])
      })
      if (existIndexInRemove >= 0) {
        // 校验属性是否变化
        this.judgeRowChanged(toInsertRecord)
      }
      this.recordDelta()
      return toInsertRecord
    },
    merge () {
      const selectRecords = this.$refs.vxTable.getCheckboxRecords()
      if (selectRecords.length < 2) {
        this.$notification.openWarningNotification('请选择两条以上的数据')
        return
      }
      // 校验选中的行里是否包含宏参数
      const nullNameItemArr = selectRecords.filter(member => !member.name)
      if (nullNameItemArr && nullNameItemArr.length > 0) {
        this.$notification.openErrorNotification(`变量名为空的项不支持合并，行号{${nullNameItemArr.map(member => `[${member.index}]`).join(',')}}`)
        return
      }
      this.$notification.openInfoNotification(`合并行号{${selectRecords.map(member => `[${member.index}]`).join(',')}}`)
      // 1.选出记录里的第一条数据
      const mergeTarget = R.head(selectRecords)
      // 2.修改第一条数据的ns属性
      // 3.删除非第一条数据
      for (const i of R.range(1, selectRecords.length)) {
        const mergeSrc = selectRecords[i]
        mergeTarget.merges.push(new SettingGroupItemMerge(mergeSrc))
        if (R.isNotEmpty(mergeSrc.merges)) {
          mergeTarget.merges.push(...mergeSrc.merges)
        }
        this.removeRow(mergeSrc)
      }
      mergeTarget.merges.forEach((merges, index) => (merges.index = index))

      this.tableData.forEach((row, index) => {
        row.index = index
        this.judgeRowChanged(row, ['index', 'merges', 'name'])
      })
      this.recordDelta()
    },
    async splitRow (row) {
      const nsList = row.merges
      const paramMap = await getParamList(nsList)
      nsList.forEach((mergeItem, index) => {
        const toAddMember = new SettingGroupItem(mergeItem)
        toAddMember.id = toAddMember.id || uuid()
        // 查询na是否被删除过，如果被删除，则认为是使用na对应的新数据更新
        const existIndexInRemove = R.findIndex(R.whereEq({ name: mergeItem.name }), this.removeList)
        const existRemoveRec = this.removeList[existIndexInRemove]
        if (existIndexInRemove >= 0) {
          this.removeList.splice(existIndexInRemove, 1)
        } else {
          this.insertIdList.push(toAddMember.id)
        }

        const varTreeParam = existRemoveRec || paramMap[mergeItem.name] || row
        toAddMember.abbr = varTreeParam.abbr
        toAddMember.desc = varTreeParam.desc
        toAddMember.pMin = varTreeParam.pMin
        toAddMember.pMax = varTreeParam.pMax
        toAddMember.pNorm = varTreeParam.pNorm
        toAddMember.sMin = varTreeParam.sMin
        toAddMember.sMax = varTreeParam.sMax
        toAddMember.sNorm = varTreeParam.sNorm
        toAddMember.valueList = varTreeParam.valueList // FIXME
        toAddMember.format = varTreeParam.format
        toAddMember.status = varTreeParam.status
        if (!this.multiSet) {
          toAddMember.globalSetValue = varTreeParam.globalSetValue || varTreeParam.value
        }
        const toInsertRecord = { ...toAddMember }
        toInsertRecord.fromSplit = true
        toInsertRecord.attrGroup = initAttrGroup(toInsertRecord.attribute)
        toInsertRecord.groupId = this.groupDto.id

        const newIndex = this.pageTableData.indexOf(row) + 1 + index
        this.pageTableData.splice(newIndex, 0, toInsertRecord)
        // tableData插入
        this.tableData.splice(this.calcIndexInTableData(newIndex), 0, toInsertRecord)
      })
      row.merges = []
      const rowParam = paramMap[row.name]
      if (rowParam) {
        row.unit = rowParam.unit
      }

      // vis属性导致对比不一致
      const keys = ['id', 'name', 'desc', 'index', 'format', 'pMin', 'pMax', 'pNorm', 'sMin', 'sMax', 'sNorm',
        'globalSetValue', 'multiSetValues', 'merges', 'matrix']
      this.tableData.forEach((row, index) => {
        row.index = index
        this.judgeRowChanged(row, keys)
      })
      this.recordDelta()
    }
  },
  mounted () {
    this.$vbus.$on('VAR_TREE_PARAM_DBL_CLICKED', this.insertLast)
  },
  destroyed () {
    this.$vbus.$off('VAR_TREE_PARAM_DBL_CLICKED', this.insertLast)
  }
}
</script>

<style scoped>
#settingGroupViewContainer {
  height: calc(100% - 36px);
  width: 100%;
}
</style>
