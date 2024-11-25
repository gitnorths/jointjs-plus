import Sortable from 'sortablejs'
import { v4 as uuid } from 'uuid'
import { TaskLevelEnum, VariableTypeEnum } from '@/model/enum'
import { SymbolBlockVarInput, SymbolBlockVarOutput, SymbolBlockVarParam } from '@/model/dto'
import * as R from 'ramda'
import { cellValueEq } from '@/renderer/common/util'
import { SymbolBlockConstants } from '@/renderer/pages/symbolMaker/views/components/workArea/workAreaConfig'

export default {
  name: 'editMixins',
  props: {
    tagKey: {
      type: String,
      required: true
    }
  },
  computed: {
    varType () {
      return VariableTypeEnum
    },
    totalResult () {
      return this.tableData ? this.tableData.length : 0
    },
    currentBlock () {
      return this.$store.getters.workTagsSelectDto(this.tagKey)
    },
    editFlag () {
      return true
    }
  },
  data () {
    return {
      tagProp: '',
      copiedRow: [],
      pasteTime: 0,
      showHelpTip: false,
      loading: false,
      validRules: {
        name: [{ validator: this.nameValid }]
      },
      pageTableData: [],
      columns: [],
      tableData: [],
      orgTableDataMap: {},
      updateMap: {}, // {$id:{$field:true}} true-修改过，false-不变
      insertList: [], // [$row],
      removeList: [], // [$row]
      tableMenu: {
        body: {
          options: [
            [
              {
                code: 'add',
                name: '新增一行',
                prefixIcon: 'fa fa-plus',
                visible: true,
                disabled: false
              },
              {
                code: 'copy',
                name: '复制该行',
                prefixIcon: 'fa fa-copy',
                visible: true,
                disabled: false
              },
              {
                code: 'paste',
                name: '粘贴复制的行',
                prefixIcon: 'fa fa-paste',
                visible: true,
                disabled: false
              },
              {
                code: 'remove',
                name: '删除该行',
                prefixIcon: 'el-icon-delete',
                visible: true,
                disabled: false
              }
            ],
            [
              {
                code: 'insert',
                name: '插入一行',
                prefixIcon: 'fa fa-plus',
                visible: true,
                disabled: false
              },
              {
                code: 'pasteInsert',
                name: '插入复制的行',
                prefixIcon: 'fa fa-paste',
                visible: true,
                disabled: false
              }
            ],
            [
              {
                code: 'copyChecked',
                name: '复制选中行',
                prefixIcon: 'fa fa-copy',
                visible: true,
                disabled: false
              },
              {
                code: 'remove-select',
                name: '删除选中行',
                prefixIcon: 'el-icon-delete',
                visible: true,
                disabled: false
              }
            ],
            [
              {
                code: 'batch-edit',
                name: '批量编辑',
                prefixIcon: 'el-icon-edit',
                visible: true,
                disabled: false
              }
            ]
          ]
        },
        visibleMethod: this.visibleMethod
      },
      currentPage: 1,
      pageSize: 15,
      levelOptions: [
        { label: TaskLevelEnum[TaskLevelEnum.LevelAny], value: TaskLevelEnum.LevelAny },
        { label: TaskLevelEnum[TaskLevelEnum.Level1], value: TaskLevelEnum.Level1 },
        { label: TaskLevelEnum[TaskLevelEnum.Level2], value: TaskLevelEnum.Level2 },
        { label: TaskLevelEnum[TaskLevelEnum.Level3], value: TaskLevelEnum.Level3 },
        { label: TaskLevelEnum[TaskLevelEnum.Level4], value: TaskLevelEnum.Level4 }
      ],
      optTypeList: [
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
      ],
      variableList: [
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
    seqMethod ({ rowIndex }) {
      return 1 + this.calcIndexInTableData(rowIndex)
    },
    nameValid ({ cellValue }) {
      if (!cellValue) {
        return new Error('变量名必须有值')
      }
      const nameArray = this.tableData.filter((input) => input.name === cellValue)
      if (nameArray && nameArray.length > 1) {
        return new Error(`${cellValue}有重名项`)
      }
    },
    clear () {
      this.tableData = []
      this.orgTableDataMap = {}
      this.updateMap = {}
      this.insertList = []
      this.removeList = []
    },
    convertDisplayMode (obj) {
      if (!obj.integralVisible) {
        if (!obj.textVisible) {
          obj.displayMode = 0
        } else {
          obj.displayMode = 1
        }
      } else {
        obj.displayMode = 2
      }
    },
    init () {
      this.clear()
      this.loading = true
      const props = this.currentBlock[this.tagProp] || []
      this.tableData = props.map(item => {
        const obj = { ...item }
        this.convertDisplayMode(obj)
        this.orgTableDataMap[obj.name] = { ...obj }
        return obj
      })
      this.reloadPageTableData()
      this.loading = false
    },
    mountSortable () {
      this.$nextTick(() => {
        this.sortable = new Sortable(this.$refs.vxTable.$el.querySelector('.body--wrapper>.vxe-table--body tbody'), {
          handle: '.drag-btn',
          onEnd: this.dragSortDone()
        })
      })
    },
    columnClassName ({ row, column }) {
      const existInInsertList = R.indexOf(row.name, this.insertList) > -1
      if (existInInsertList) {
        return 'col--dirty'
      }
      const existInUpdateMap = this.updateMap[row.name]
      if (existInUpdateMap && existInUpdateMap[column.property]) {
        return 'col--dirty'
      }
      return ''
    },
    formatOptTypeList ({ row }) {
      if (row && row.optTypeList) {
        return row.optTypeList.map(type => VariableTypeEnum[type]).join(',')
      }
      return ''
    },
    formatDisplayMode (row) {
      switch (row.displayMode) {
        case 0:
          return '不显示'
        case 1:
          return '显示'
        default :
          return ''
      }
    },
    calcIndexInTableData (index) {
      return index + (this.currentPage - 1) * this.pageSize
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
    optTypeListChangeHandler (row) {
      row.optTypeList = row.optTypeList.sort((a, b) => a - b)
    },
    visibleMethod ({ options, row }) {
      if (row) {
        this.$refs.vxTable.setCurrentRow(row)
      }
      const selectRecords = this.$refs.vxTable.getCheckboxRecords()
      options.forEach(list => {
        list.forEach(item => {
          if (['insert', 'copy', 'remove', 'pasteInsert'].includes(item.code)) {
            item.visible = !!row
          }
          if (['paste', 'pasteInsert'].includes(item.code)) {
            item.disabled = R.isEmpty(this.copiedRow)
          }
          if (['remove-select', 'copyChecked'].includes(item.code)) {
            item.disabled = selectRecords.length < 1
          }
          if (['batch-edit'].includes(item.code)) {
            item.disabled = selectRecords.length < 2
          }
        })
      })
      return true
    },
    contextMenuClickHandler ({ menu, row, rowIndex }) {
      // switch (menu.code) {
      //   case 'add':
      //     this.insertLast()
      //     break
      //   case 'insert':
      //     this.insertOne(rowIndex)
      //     break
      //   case 'copy' :
      //     this.copyRow(row)
      //     break
      //   case 'copyChecked':
      //     this.copyRow()
      //     break
      //   case 'paste':
      //     this.paste(this.pageTableData.length)
      //     break
      //   case 'pasteInsert':
      //     this.paste(rowIndex)
      //     break
      //   case 'remove':
      //     this.removeRow(row)
      //     break
      //   case 'remove-select':
      //     this.removeRow()
      //     break
      //   case 'batch-edit':
      //     this.batchEdit()
      // }
    },
    recordDelta (input, type) {
      const updateList = Object.values(this.updateMap).filter(value => !!value)
      const payload = {
        key: this.tagKey,
        propName: this.tagProp,
        value: null
      }
      if (R.isNotEmpty(this.insertList) || R.isNotEmpty(this.removeList) || (updateList && R.isNotEmpty(updateList))) {
        payload.value = this.tableData
      }
      this.$store.commit('updateSEDelta', payload)
      // 同步到customType页面
      this.$emit('syncIO', this.tagProp, this.tableData, input, type)
    },
    judgeRowChanged (row) {
      const orgData = this.orgTableDataMap[row.name]
      if (orgData) {
        const updateRec = this.updateMap[row.name] || {}
        Object.keys(row)
          .filter(key => key !== 'rowId')
          .forEach(key => {
            updateRec[key] = cellValueEq(orgData[key], row[key])
          })
        const changed = Object.values(updateRec).filter(value => value)

        this.updateMap[row.name] = changed && changed.length > 0 ? updateRec : null
      } else {
        // 该记录被删除，修改记录置空
        this.updateMap[row.name] = null
      }
    },
    calcInsertRemoveRecord () {
      const orgNames = Object.keys(this.orgTableDataMap) || []
      const newNames = this.tableData.map(row => row.name)
      this.insertList = R.without(orgNames, newNames)
      this.removeList = R.without(newNames, orgNames)
    },
    editDone ({ row, column }) {
      this.$refs.vxTable.fullValidate(true)
        .then((errMap) => {
          if (errMap) {
            return
          }
          // 修改类型或者可选类型列表，同步修改到自定义类型页面
          if (column.property === 'type' || column.property === 'optTypeList') {
            if (row.type !== VariableTypeEnum.Any) {
              row.optTypeList = []
            }
          }
          this.judgeRowChanged(row)
          this.calcInsertRemoveRecord()
          this.recordDelta(row, 'editDone')
        })
        .catch(e => {
          this.$notification.openErrorNotification('校验失败' + e).logger()
          return e
        })
    },
    buildInsertRecord (name) {
      let insertRecord = {}
      if (this.tagProp === SymbolBlockConstants.inputs) {
        insertRecord = { ...new SymbolBlockVarInput() }
        this.convertDisplayMode(insertRecord)
      } else if (this.tagProp === SymbolBlockConstants.outputs) {
        insertRecord = { ...new SymbolBlockVarOutput() }
        this.convertDisplayMode(insertRecord)
      } else if (this.tagProp === SymbolBlockConstants.params) {
        insertRecord = { ...new SymbolBlockVarParam() }
        // 可选参数默认为false
        insertRecord.optional = false
        insertRecord.integralVisible = true
        insertRecord.textVisible = true
        insertRecord.displayMode = 2
      }
      if (name) {
        insertRecord.name = name
      }
      insertRecord.id = this.tagProp + ':' + uuid()
      return insertRecord
    },
    insertLast () {
      this.insertOne(this.pageTableData.length)
    },
    insertMany () {
      const existNames = this.tableData.map(row => row.name) || []
      this.$store.commit('openAddRowsDialog', {
        tagKey: this.tagKey,
        propName: this.tagProp,
        existNames
      })
    },
    insertOne (newIndex) {
      this.$refs.vxTable.fullValidate(true)
        .then((errMap) => {
          if (errMap) {
            this.$notification.openWarningNotification('存在校验不通过的数据，修复问题后再试。')
            return
          }
          const toInsertRecord = this.buildInsertRecord()
          this.pageTableData.splice(newIndex, 0, toInsertRecord)
          // tableData插入
          this.tableData.splice(this.calcIndexInTableData(newIndex), 0, toInsertRecord)
          this.$refs.vxTable.setEditCell(toInsertRecord, 'name')
        })
        .catch(e => {
          this.$notification.openErrorNotification('校验失败' + e).logger()
          return e
        })
    },
    copyRow (row) {
      const selectRecords = row ? [row] : this.$refs.vxTable.getCheckboxRecords()
      if (selectRecords.length <= 0) {
        this.$notification.openWarningNotification('请至少选择一条数据')
        return
      }
      this.copiedRow = [...selectRecords]
      this.pasteTime = 0
    },
    paste (index) {
      this.$refs.vxTable.fullValidate(true)
        .then((errMap) => {
          if (errMap) {
            this.$notification.openWarningNotification('存在校验不通过的数据，修复问题后再试。')
            return
          }
          // 每粘贴一次，后缀自动加1
          this.pasteTime++
          const toInsertRows = this.copiedRow.map(row => {
            const toInsertRecord = { ...row }
            toInsertRecord.rowId = null
            toInsertRecord.name = `${row.name}_${this.pasteTime}`
            toInsertRecord.id = `${row.id}_${this.pasteTime}`
            return toInsertRecord
          })
          this.pageTableData.splice(index, 0, ...toInsertRows)
          // tableData插入
          this.tableData.splice(this.calcIndexInTableData(index), 0, ...toInsertRows)
          this.calcInsertRemoveRecord()
          this.recordDelta(toInsertRows, 'paste')
        })
        .catch(e => {
          this.$notification.openErrorNotification('校验失败' + e).logger()
          return e
        })
    },
    dragSortDone () {
      return ({ newIndex, oldIndex }) => {
        // 数组内数据调换顺序
        this.pageTableData.splice(newIndex, 0, this.pageTableData.splice(oldIndex, 1)[0])
        // 全局数据调换顺序
        this.tableData.splice(this.calcIndexInTableData(newIndex), 0, this.tableData.splice(this.calcIndexInTableData(oldIndex), 1)[0])
        // 拖拽排序只需要修改当前页内数据的下标
        this.pageTableData.forEach((row, index) => {
          row.index = this.calcIndexInTableData(index)
          this.judgeRowChanged(row)
        })
        this.recordDelta('dragSortDone', 'dragSortDone')
      }
    },
    removeRow (row) {
      const selectRecords = row ? [row] : this.$refs.vxTable.getCheckboxRecords()
      if (selectRecords.length <= 0) {
        this.$notification.openWarningNotification('请至少选择一条数据')
        return
      }

      const toRemoveNameList = []
      selectRecords.forEach(rec => {
        toRemoveNameList.push(rec.name)
        const orgData = this.orgTableDataMap[rec.name]
        if (orgData) {
          this.updateMap[rec.name] = null
        }
      })

      this.pageTableData = this.pageTableData.filter(item => !toRemoveNameList.includes(item.name))
      this.tableData = this.tableData.filter(item => !toRemoveNameList.includes(item.name))

      this.calcInsertRemoveRecord()
      this.recordDelta(selectRecords, 'removeRow')
    },
    batchEdit () {
      this.$refs.vxTable.fullValidate(true)
        .then((errMap) => {
          if (errMap) {
            this.$notification.openWarningNotification('存在校验不通过的数据，修复问题后再试。')
            return
          }
          const selectRecords = this.$refs.vxTable.getCheckboxRecords()
          if (selectRecords && selectRecords.length >= 2) {
            this.$store.commit('openBatchEditDialog', {
              tagKey: this.tagKey,
              propName: this.tagProp
            })
          } else {
            this.$notification.openWarningNotification('请先至少选择2条需要编辑的数据')
          }
        })
        .catch(e => {
          this.$notification.openErrorNotification('校验失败' + e).logger()
          return e
        })
    },
    convertVal (orgValue, replaceOption, index) {
      const { searchValue, replaceValue, matchCase, matchWords, prefix, suffix } = replaceOption
      let returnVal = ''
      if (orgValue) {
        if (searchValue) {
          const regExp = matchWords
            ? new RegExp(`^${searchValue}$`, matchCase ? 'g' : 'ig')
            : new RegExp(searchValue, matchCase ? 'g' : 'ig')
          returnVal = orgValue.replace(regExp, replaceValue)
        } else {
          returnVal = orgValue
        }
      } else if (!searchValue && replaceValue) {
        returnVal = replaceValue
      } else {
        returnVal = orgValue
      }
      if (prefix) {
        const { value, seq } = prefix
        if (seq.enable) {
          const { start, step, position } = seq
          const seqStr = Number(start) + Number(step) * index
          const prefixStr = position ? seqStr + (value || '') : (value || '') + seqStr
          returnVal = prefixStr + (returnVal || '')
        } else {
          returnVal = (value || '') + (returnVal || '')
        }
      }

      if (suffix) {
        const { value, seq } = suffix
        if (seq.enable) {
          const { start, step, position } = seq
          const seqStr = Number(start) + Number(step) * index
          const suffixStr = position ? seqStr + (value || '') : (value || '') + seqStr
          returnVal = (returnVal || '') + suffixStr
        } else {
          returnVal = (returnVal || '') + (value || '')
        }
      }

      return returnVal
    },
    batchEditDone ({ tagKey, propName, data, props }) {
      if (this.tagKey !== tagKey || this.tagProp !== propName) {
        return
      }
      const selectRecords = this.$refs.vxTable.getCheckboxRecords()
      selectRecords.forEach((row, index) => {
        props.forEach(key => {
          const changeVal = data[key]
          // desc等属性传递的对象来修改值
          if (changeVal instanceof Object) {
            row[key] = this.convertVal(row[key], changeVal, index)
          } else {
            row[key] = changeVal
          }
        })
        if (propName === SymbolBlockConstants.inputs || propName === SymbolBlockConstants.outputs) {
          this.displayModeChangeHandler(row)
        }
        this.judgeRowChanged(row)
      })
      this.recordDelta(selectRecords, 'batchEditDone')
      this.$refs.vxTable.fullValidate(true)
    },
    insertManyDone ({ tagKey, propName, newNames }) {
      if (this.tagKey !== tagKey || this.tagProp !== propName) {
        return
      }
      const toInsertRows = newNames.map(name => this.buildInsertRecord(name))
      const index = this.pageTableData.length
      this.pageTableData.splice(index, 0, ...toInsertRows)
      // tableData插入
      this.tableData.splice(this.calcIndexInTableData(index), 0, ...toInsertRows)
      this.calcInsertRemoveRecord()
      this.recordDelta(toInsertRows, 'insertManyDone')
    },
    reloadPageTableData () {
      this.pageTableData = this.tableData.slice((this.currentPage - 1) * this.pageSize, this.currentPage * this.pageSize)
    },
    pageChangeHandler ({ currentPage, pageSize }) {
      this.currentPage = currentPage
      this.pageSize = pageSize
      this.reloadPageTableData()
    }
  },
  created () {
    this.init()
  },
  beforeDestroy () {
    this.clear()
    if (this.sortable) {
      this.sortable.destroy()
    }
  },
  mounted () {
    this.$vbus.$on('BATCH_EDIT_SE_DATA', this.batchEditDone)
    this.$vbus.$on('INSERT_MANY_SE_ROWS', this.insertManyDone)
  },
  destroyed () {
    this.$vbus.$off('BATCH_EDIT_SE_DATA', this.batchEditDone)
    this.$vbus.$off('INSERT_MANY_SE_ROWS', this.insertManyDone)
  }
}
