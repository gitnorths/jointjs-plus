import { v4 as uuid } from 'uuid'
import { getObjContext } from '@/renderer/pages/nextStudio/action'
import { EnableStatusEnum, SignalClassifyEnum, YesNoEnum } from '@/model/enum'
import * as R from 'ramda'
import { cellValueEq } from '@/renderer/common/util'

export const tableMixin = {
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
    groupDto () {
      return this.$store.getters.selectDto(this.tagKey)
    },
    focusedSignalId () {
      return this.$store.getters.focusedSignalId
    },
    totalResult () {
      return this.tableData ? this.tableData.length : 0
    }
  },
  watch: {
    focusedSignalId (val) {
      if (val) {
        this.focus(val)
      }
    }
  },
  data () {
    return {
      showHelpTip: false,
      loading: false,
      validRules: {},
      pageTableData: [],
      tableData: [],
      orgTableDataMap: {},
      updateMap: {}, // {$id:{$field:true}} true-修改过，false-不变
      insertIdList: [], // [$id],
      removeList: [], // [$row]
      tableMenu: {
        body: {
          options: [
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
      classifyOptions: [
        { label: '保护', value: SignalClassifyEnum.Protect },
        { label: '测量', value: SignalClassifyEnum.Measure },
        { label: '其他', value: SignalClassifyEnum.Other }
      ],
      boolOptions: [
        { label: '是', value: YesNoEnum.YES },
        { label: '否', value: YesNoEnum.NO }
      ],
      currentPage: 1,
      pageSize: 15,
      recordSet: { insertRecords: [], updateRecords: [], removeRecords: [] }
    }
  },
  methods: {
    classifyStr (classify) {
      switch (classify) {
        case SignalClassifyEnum.Protect:
          return '保护'
        case SignalClassifyEnum.Measure:
          return '测量'
        case SignalClassifyEnum.Other:
          return '其他'
      }
    },
    init () {
      this.clear()
      this.loading = true
      setTimeout(() => {
        getObjContext(this.groupDto, this.deviceDbName)
          .then((items) => {
            this.tableData = items.map((md) => {
              const obj = { ...md }
              this.orgTableDataMap[obj.id] = { ...obj }
              return obj
            })
            this.reloadPageTableData()
          })
          .catch(e => {
            const message = `分组[${this.groupDto.desc}]数据刷新失败，{${e}}，请稍后重试`
            this.$notification.openErrorNotification(message).logger()
          })
          .finally(() => {
            this.loading = false
          })
      }, 10)
    },
    mountSortable () {
      // todo
    },
    buildInsertRecord (inputData) {
      return { ...inputData }
    },
    calcIndexInTableData (index) {
      return index + (this.currentPage - 1) * this.pageSize
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
    clear () {
      this.tableData = []
      this.orgTableDataMap = {}
      this.updateMap = {}
      this.insertIdList = []
      this.removeList = []
      this.recordSet = { insertRecords: [], updateRecords: [], removeRecords: [] }
    },
    reset (ignoreTagKeys) {
      if (ignoreTagKeys && !R.includes(this.tagKey, ignoreTagKeys)) {
        return
      }
      const tagDeltaExist = this.$store.getters.tagDeltaExist(this.tagKey)
      if (tagDeltaExist) {
        const msg = '所有未保存的修改内容会丢失，是否继续？'
        this.$confirm(msg, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
          center: true
        })
          .then(() => this.init())
      } else {
        this.init()
      }
    },
    refresh (ignoreTagKeys) {
      if (ignoreTagKeys && R.includes(this.tagKey, ignoreTagKeys)) {
        return
      }
      this.loading = true
      getObjContext(this.groupDto, this.deviceDbName)
        .then((items) => {
          // FIXME
          if (R.isNotEmpty(items)) {
            // 刷新tableData
            items.forEach(item => {
              const row = R.find(R.propEq(item.id, 'id'))(this.tableData)
              if (row) {
                this.columnProps.forEach(key => (row[key] = item[key]))
              }
              const orgData = this.orgTableDataMap[item.id]
              if (orgData) {
                this.columnProps.forEach(key => (orgData[key] = item[key]))
              }
            })
          }
        })
        .catch((e) => {
          const message = `[${this.groupDto.desc}]数据刷新失败，{${e}}，请稍后重试`
          this.$notification.openErrorNotification(message).logger()
        })
        .finally(() => {
          this.loading = false
        })
    },
    judgeRowChanged (row, keys) {
      const orgData = this.orgTableDataMap[row.id]
      if (orgData) {
        const updateRec = this.updateMap[row.id] || {}
        const props = keys || Object.keys(row)
        props.forEach(key => {
          updateRec[key] = cellValueEq(orgData[key], row[key])
        })
        // FIXME 定值分组的na,ns
        if (props.includes('merges') && props.includes('name')) {
          updateRec.name = updateRec.merges
        }
        const changed = Object.values(updateRec).filter(value => value)

        this.updateMap[row.id] = changed && changed.length > 0 ? updateRec : null
      } else {
        // 该记录被删除，修改记录置空
        this.updateMap[row.id] = null
      }
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
      this.$store.commit('updateDelta', { key: this.tagKey, delta: this.recordSet })
    },
    attrEditFocused () {
      if (this.$refs.attrPullDown && !this.$refs.attrPullDown.isPanelVisible()) {
        this.$refs.attrPullDown.showPanel()
      }
    },
    attrEditDone (row) {
      let attr = 0
      for (let i = 0; i < 8; i++) {
        if (row.attrGroup[i].checked) {
          attr += 2 ** i
        }
      }
      row.attribute = attr ? attr.toString() : ''
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
          if (['batch-edit'].includes(item.code)) {
            item.disabled = selectRecords.length < 2
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
        case 'batch-edit':
          this.batchEdit()
      }
    },
    editDone ({ row, column }) {
      this.judgeRowChanged(row, [column.property])
      this.recordDelta()
    },
    checkExistInTable (toInsertRecord) {
      const result = {
        exist: false,
        msg: ''
      }
      if (R.isEmpty(this.tableData)) {
        return result
      }
      for (const row of this.tableData) {
        if (row.name === toInsertRecord.name) {
          result.exist = true
          result.msg = `和第[${row.index}]条数据冲突`
          break
        }
      }
      return result
    },
    async insertOne (dragData, newIndex) {
      // 校验当前数据是否已经在当前组存在
      const existInTable = this.checkExistInTable(dragData)
      if (existInTable.exist) {
        this.$notification.openErrorNotification(`插入失败，${dragData.name} ${existInTable.msg}`)
        return
      }
      // 查询na是否被删除过，如果被删除，则认为是使用na对应的新数据更新
      const existIndexInRemove = R.findIndex(R.whereEq({ name: dragData.name }), this.removeList)

      let id
      if (existIndexInRemove >= 0) {
        id = this.removeList[existIndexInRemove].id
        this.removeList.splice(existIndexInRemove, 1)
      } else {
        id = uuid()
        this.insertIdList.push(id)
      }

      // 查询是否被别的组配置过
      // FIXME
      // const existMember = await getObjContext({ clazzName: 'SignalGroupMember', name: dragData.name })
      // const inputData = existMember || dragData

      const inputData = dragData
      const toInsertRecord = this.buildInsertRecord(inputData)
      toInsertRecord.id = id
      toInsertRecord.type = inputData.type
      toInsertRecord.groupId = this.groupDto.id
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
    insertDone () {
      return async ({ newIndex }) => {
        // 构造要新建的数据
        const dragData = this.$store.getters.getDragData
        await this.insertOne(dragData, newIndex)
        // 删除clone的div临时节点
        document.querySelector('.body--wrapper>.vxe-table--body tbody div[role="treeitem"]').remove()
      }
    },
    async insertLast (dblClickData) {
      const activeKey = this.$store.getters.activeKey
      if (this.tagKey !== activeKey) {
        return
      }
      // 插入当前分页的最后一行
      const row = await this.insertOne(dblClickData, this.pageTableData.length)
      setTimeout(() => {
        this.$refs.vxTable.scrollToRow(row)
        this.$refs.vxTable.setCurrentRow(row)
      }, 0)
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
          this.judgeRowChanged(row, ['index'])
        })
        this.recordDelta()
      }
    },
    removeRow (row) {
      const selectRecords = row ? [row] : this.$refs.vxTable.getCheckboxRecords()
      if (selectRecords.length <= 0) {
        this.$notification.openWarningNotification('请至少选择一条数据')
        return
      }

      const toRemoveIdList = []
      selectRecords.forEach(rec => {
        toRemoveIdList.push(rec.id)
        const indexInInsert = R.indexOf(rec.id, this.insertIdList)
        if (indexInInsert >= 0) {
          this.insertIdList.splice(indexInInsert, 1)
        } else {
          // 移除修改记录
          this.updateMap[rec.id] = null
          this.removeList.push(rec)
        }
      })

      this.pageTableData = this.pageTableData.filter(item => !toRemoveIdList.includes(item.id))
      this.tableData = this.tableData.filter(item => !toRemoveIdList.includes(item.id))

      this.tableData.forEach((item, index) => {
        item.index = index
        this.judgeRowChanged(item, ['index'])
      })
      this.recordDelta()
    },
    batchEdit () {
      const selectRecords = this.$refs.vxTable.getCheckboxRecords()
      if (selectRecords && selectRecords.length > 0) {
        this.$vbus.$emit('OPEN_BATCH_EDIT_DIALOG', this.tagKey)
      } else {
        this.$notification.openWarningNotification('请先选择要批量编辑的数据')
      }
    },
    convertVal (orgValue, replaceOption) {
      const { searchValue, replaceValue, matchCase, matchWords } = replaceOption
      if (orgValue) {
        if (searchValue) {
          const regExp = matchWords
            ? new RegExp(`^${searchValue}$`, matchCase ? 'g' : 'ig')
            : new RegExp(searchValue, matchCase ? 'g' : 'ig')
          return orgValue.replace(regExp, replaceValue)
        } else {
          return orgValue
        }
      } else if (!searchValue && replaceValue) {
        return replaceValue
      } else {
        return orgValue
      }
    },
    batchEditDone ({ tagKey, data, props }) {
      if (this.tagKey !== tagKey) {
        return
      }
      const selectRecords = this.$refs.vxTable.getCheckboxRecords()

      selectRecords.forEach(row => {
        props.forEach(key => {
          const changeVal = data[key]
          // desc等属性传递的对象来修改值
          if (changeVal instanceof Object) {
            row[key] = this.convertVal(row[key], changeVal)
          } else {
            row[key] = changeVal
          }
        })
        this.judgeRowChanged(row, props)
      })
      this.recordDelta()
    },
    focus (memberId) {
      const row = R.find(R.propEq(memberId, 'id'), this.tableData)
      if (row) {
        // 先跳转到页面
        const jumpPage = Math.floor(row.index / this.pageSize) + 1
        if (this.currentPage !== jumpPage) {
          this.currentPage = jumpPage
          this.reloadPageTableData()
        }

        this.$refs.vxTable.scrollToRow(row)
        this.$refs.vxTable.setCurrentRow(row)
      }
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
  beforeDestroy () {
    this.clear()
    if (this.sortable) {
      this.sortable.destroy()
    }
  },
  created () {
    this.init()
  },
  mounted () {
    this.mountSortable()
    this.$vbus.$on('REFRESH_WORK_AREA', this.refresh)
    this.$vbus.$on('RELOAD_WORK_AREA', this.reset)
    this.$vbus.$on('SAVE_SUCCEEDED', this.init)
    this.$vbus.$on('BATCH_EDIT_TABLE_DATA', this.batchEditDone)
    this.$vbus.$on('FOCUS_LINE', this.focus)
    setTimeout(() => this.focus(this.focusedSignalId), 200)
  },
  destroyed () {
    this.$vbus.$off('REFRESH_WORK_AREA', this.refresh)
    this.$vbus.$off('RELOAD_WORK_AREA', this.reset)
    this.$vbus.$off('SAVE_SUCCEEDED', this.init)
    this.$vbus.$off('BATCH_EDIT_TABLE_DATA', this.batchEditDone)
    this.$vbus.$off('FOCUS_LINE', this.focus)
  }
}
