<template>
  <div style="height: 100%; width: 100%; user-select: none;">
    <vxe-toolbar perfect>
      <template v-slot:buttons>
        <vxe-button status="primary" @click="importDialog" style="margin-left: 12px">
          <i class="fa fa-plus"></i>本地符号库
        </vxe-button>
        <vxe-button v-if="changed" status="info" @click="reset">
          <i class="fa fa-undo"></i> 撤销
        </vxe-button>
      </template>
      <template v-slot:tools>
        <vxe-button status="primary" @click="next" :disabled="!changed" style="margin-right: 12px">
          下一步 <i class="el-icon-arrow-right"></i>
        </vxe-button>
      </template>
    </vxe-toolbar>
    <div style="height: calc(100% - 52px)">
      <vxe-table
        :data="tableData"
        height="auto"
        auto-resize
        stripe
        border
        size="small"
        align="center"
        keep-source
        show-overflow
        :row-class-name="rowClassName"
        :column-config="{resizable: true}"
        :row-config="{isHover: true, useKey: true}"
        :edit-config="{trigger: 'dblclick', mode: 'cell', showIcon: true, beforeEditMethod:activeMethod}"
        @edit-actived="editActiveHandler"
        @edit-closed="editDone"
        @cell-click="cellClickHandler"
        ref="vxTable">
        <vxe-column type="seq" title="#" width="40"></vxe-column>
        <vxe-column field="name" title="功能块包" width="160"></vxe-column>
        <vxe-column field="address" title="升级包路径" :edit-render="{}">
          <template v-slot="{row}">
            <span v-if="row.address">{{ row.address }}</span>
            <span v-else style="color: darkgrey">{{ '双击选择本地升级包' }}</span>
          </template>
          <template v-slot:edit="{row}">
            <vxe-input v-model="row.address" readonly clearable>
              <template v-slot:prefix>
                <vxe-button @click="openPkgSelect(row)" icon="el-icon-folder-opened"
                            status="primary"></vxe-button>
              </template>
            </vxe-input>
          </template>
        </vxe-column>
        <vxe-column title="编辑" width="60">
          <template v-slot="{rowIndex}">
            <vxe-button circle size="mini" title="删除" @click="delRowData(rowIndex)" status="danger"
                        icon="fa fa-trash-o"/>
          </template>
        </vxe-column>
      </vxe-table>
    </div>
  </div>
</template>

<script>
import { comparePackages } from '@/renderer/pages/nextStudio/action'
import * as path from 'path'
import * as fse from 'fs-extra'
import * as R from 'ramda'

const pkgStatus = {
  Normal: 0,
  Add: 1,
  Del: 2,
  Change: 3
}
export default {
  name: 'step0FileSelect',
  computed: {
    projectVfbPackages () {
      return this.$store.getters.archiveProtoList
    },
    device () {
      return this.$store.getters.device
    },
    changed () {
      return this.recordSet && (R.isNotEmpty(this.recordSet.insertRecords) || R.isNotEmpty(this.recordSet.updateRecords) || R.isNotEmpty(this.recordSet.removeRecords))
    }
  },
  data () {
    return {
      vfbPackages: [],
      tableData: [],
      recordSet: {
        insertRecords: [],
        updateRecords: [],
        removeRecords: []
      }
    }
  },
  methods: {
    rowClassName ({ row }) {
      if (row) {
        switch (row.status) {
          case pkgStatus.Normal:
            return 'packageNormal'
          case pkgStatus.Add:
            return 'packageAdd'
          case pkgStatus.Change:
            return 'packageChange'
          case pkgStatus.Del:
            return 'packageDel'
        }
      }
      return ''
    },
    activeMethod ({ row }) {
      return row.status !== pkgStatus.Add
    },
    init () {
      this.vfbPackages = R.map((pkg) => ({ ...pkg }))(this.projectVfbPackages)
      this.tableData = this.vfbPackages.map(pkg => {
        return {
          name: pkg.name,
          status: pkgStatus.Normal,
          address: ''
        }
      })
      this.recordSet = { insertRecords: [], updateRecords: [], removeRecords: [] }
    },
    cellClickHandler ({ rowIndex, columnIndex }) {
      if (rowIndex !== this.activeRowIndex || columnIndex !== this.activeColumnIndex) {
        this.$refs.vxTable.clearEdit()
        this.activeRowIndex = null
        this.activeColumnIndex = null
      }
    },
    editActiveHandler ({ rowIndex, columnIndex, row, column }) {
      this.activeRowIndex = rowIndex
      this.activeColumnIndex = columnIndex
      this.$nextTick(() => {
        if (this.$refs.vxSelect) {
          this.$refs.vxSelect.focus()
          this.$refs.vxSelect.togglePanel()
        }
        if (column.property === 'address' && !row.address) {
          this.openPkgSelect(row)
        }
      })
    },
    openPkgSelect (row) {
      openWindowDialog({
        title: '选择功能块包',
        properties: ['openFile'],
        filters: [{ name: `${row.name}.pkg`, extensions: ['pkg'] }]
      })
        .then((openDialogReturnValue) => {
          if (openDialogReturnValue.filePaths.length > 0) {
            row.address = openDialogReturnValue.filePaths[0]
            this.$refs.vxTable.clearEdit()
          }
        })
    },
    editDone ({ row, column }) {
      // 编辑了离线地址
      if (column.property === 'address') {
        if (row.address) {
          row.status = pkgStatus.Change
          this.recordUpdate(row)
        }
      }

      // 没有变化
      if (!row.address) {
        row.address = ''
        if (row.status !== pkgStatus.Del) {
          row.status = pkgStatus.Normal
        }
        const existDeltaIndex = R.findIndex(R.propEq(row.name, 'name'))(this.recordSet.updateRecords)
        if (existDeltaIndex > -1) {
          this.recordSet.updateRecords.splice(existDeltaIndex, 1)
        }
      }
    },
    reset () {
      if (this.changed) {
        this.$confirm('所有修改都将丢失，是否继续?', '警告', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
          center: true
        }).then(() => {
          this.init()
        })
      } else {
        this.init()
      }
    },
    recordInsert (obj) {
      this.recordSet.insertRecords.push(obj)
    },
    recordRemove (obj) {
      const existInsertIndex = R.findIndex(R.propEq(obj.name, 'name'))(this.recordSet.insertRecords)
      if (existInsertIndex > -1) {
        this.recordSet.insertRecords.splice(existInsertIndex, 1)
        return
      }

      const existDeltaIndex = R.findIndex(R.propEq(obj.name, 'name'))(this.recordSet.updateRecords)
      if (existDeltaIndex > -1) {
        this.recordSet.updateRecords.splice(existDeltaIndex, 1)
      }
      this.recordSet.removeRecords.push(obj)
    },
    recordUpdate (obj) {
      const existInsertIndex = R.findIndex(R.propEq(obj.name, 'name'))(this.recordSet.insertRecords)
      if (existInsertIndex > -1) {
        this.recordSet.insertRecords.splice(existInsertIndex, 1, obj)
        return
      }
      const existDeltaIndex = R.findIndex(R.propEq(obj.name, 'name'))(this.recordSet.updateRecords)
      if (existDeltaIndex > -1) {
        this.recordSet.updateRecords.splice(existDeltaIndex, 1)
      }
      this.recordSet.updateRecords.push(obj)
    },
    importDialog () {
      const options = {
        title: '选择功能块包',
        properties: ['openFile', 'multiSelections'],
        filters: [
          {
            name: '功能块包(*.pkg)',
            extensions: ['pkg']
          }
        ]
      }
      openWindowDialog(options).then((openDialogReturnValue) => {
        const addressArr = openDialogReturnValue.filePaths
        const pkgArr = addressArr.map((str) => ({
          name: path.basename(str, '.pkg'),
          address: str
        }))
        if (R.isNotEmpty(pkgArr)) {
          for (const pkg of pkgArr) {
            // 原pkg记录是新增，则修改新增的addr
            const insertRecord = R.find((a) => a.name.toLowerCase() === pkg.name.toLowerCase())(this.recordSet.insertRecords)
            if (insertRecord) {
              insertRecord.address = pkg.address
              continue
            }
            const relateRow = R.find((a) => a.name.toLowerCase() === pkg.name.toLowerCase())(this.tableData)
            if (relateRow) {
              relateRow.status = pkgStatus.Change
              relateRow.address = pkg.address
              this.recordUpdate(relateRow)
            } else {
              // 原pkg被删除，则剔除删除记录，改为修改记录
              const removed = R.findIndex((a) => a.name.toLowerCase() === pkg.name.toLowerCase())(this.recordSet.removeRecords)
              if (removed > -1) {
                const record = this.recordSet.removeRecords[removed]
                this.recordSet.removeRecords.splice(removed, 1)
                record.status = pkgStatus.Change
                record.address = pkg.address
                this.tableData.push(record)
                this.recordUpdate(record)
              } else {
                const insertRow = {
                  name: pkg.name,
                  address: pkg.address,
                  status: pkgStatus.Add
                }
                this.tableData.push(insertRow)
                this.recordInsert(insertRow)
              }
            }
          }
        }
      })
    },
    delRowData (rowIndex) {
      const row = this.tableData[rowIndex]
      const newInsert = R.findIndex((a) => a.name.toLowerCase() === row.name.toLowerCase())(this.recordSet.insertRecords)
      if (newInsert > -1) {
        this.recordSet.insertRecords.splice(newInsert, 1)
        this.tableData.splice(rowIndex, 1)
      } else {
        row.status = pkgStatus.Del
        row.address = ''
        this.recordRemove(row)
      }
    },
    next () {
      this.pkgPaths = []
      if (R.isNotEmpty(this.recordSet.insertRecords)) {
        this.recordSet.insertRecords.forEach(rcd => {
          // 本地升级包
          if (rcd.address) {
            this.pkgPaths.push({ toUpdatePath: rcd.address, orgPackage: null })
          } else {
            const toUpdatePath = path.resolve(process.cwd(), `temp/onlinePackage/${rcd.name}.pkg`)
            this.pkgPaths.push({ toUpdatePath, orgPackage: null })
          }
        })
      }
      if (R.isNotEmpty(this.recordSet.removeRecords)) {
        this.recordSet.removeRecords.forEach(rcd => {
          const orgPackage = R.find(pkg => pkg.name.toLowerCase() === rcd.name.toLowerCase())(this.vfbPackages)
          this.pkgPaths.push({ toUpdatePath: '', orgPackage })
        })
      }
      if (R.isNotEmpty(this.recordSet.updateRecords)) {
        this.recordSet.updateRecords.forEach(rcd => {
          const orgPackage = R.find(pkg => pkg.name.toLowerCase() === rcd.name.toLowerCase())(this.vfbPackages)
          // 本地升级包
          if (rcd.address) {
            this.pkgPaths.push({ toUpdatePath: rcd.address, orgPackage })
          } else {
            const toUpdatePath = path.resolve(process.cwd(), `temp/onlinePackage/${rcd.name}.pkg`)
            this.pkgPaths.push({ toUpdatePath, orgPackage })
          }
        })
      }

      comparePackages(this.pkgPaths)
        .then((pkgComparedResult) => {
          let changed = false
          if (pkgComparedResult && pkgComparedResult.length > 0) {
            for (const res of pkgComparedResult) {
              if (res.delta) {
                changed = true
              }
            }
          }

          if (changed) {
            this.$store.commit('setPkgCompareResult', pkgComparedResult)
            this.$emit('next')
          } else {
            this.$store.commit('setPkgCompareResult', null)
            this.$notification.openInfoNotification('没有差异，请重新选择')
          }
        })
        .catch((e) => {
          this.$store.commit('setPkgCompareResult', null)
          this.$notification.openErrorNotification(e).logger()
        })
        .finally(() => {
          fse.removeSync(path.resolve(process.cwd(), 'temp/onlinePackage'))
          fse.removeSync(path.join(process.cwd(), 'temp/vfbPackage'))
        })
    }
  },
  mounted () {
    this.init()
  }
}
</script>

<style>
.packageNormal {
  color: black;
}

.packageAdd {
  color: blue;
}

.packageChange {
  color: red;
}

.packageDel {
  color: red;
  text-decoration: line-through;
}
</style>
