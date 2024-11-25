<template>
  <div style="height: 100%">
    <vxe-toolbar>
      <template v-slot:buttons>
        <h3 style="margin-left: 12px">升级预览</h3>
      </template>
      <template v-slot:tools>
        <vxe-button status="primary" @click="previous">
          <i class="el-icon-arrow-left"></i> 上一步
        </vxe-button>
        <vxe-button status="primary" @click="confirm" :disabled="confirming" style="margin-right: 12px">
          完成 <i class="el-icon-arrow-right"></i>
        </vxe-button>
      </template>
    </vxe-toolbar>
    <div style="width: 100%; height: calc(100% - 52px);">
      <el-table
        height="calc(100% - 32px)"
        border
        stripe
        size="mini"
        v-loading="loading"
        :default-sort="{prop: 'type', order: 'descending'}"
        :data="tableData">
        <el-table-column prop="type" sortable label="类型" width="90"></el-table-column>
        <el-table-column prop="id" sortable label="标识" width="150"></el-table-column>
        <el-table-column prop="location" sortable label="位置"></el-table-column>
        <el-table-column prop="operation" sortable label="操作" width="72"></el-table-column>
      </el-table>
      <el-pagination
        background
        :page-sizes="[10, 20, 30, 40, 50, 100]"
        :current-page.sync="currentPage"
        :page-size.sync="pageSize"
        :total="total"
        :disabled="R.isEmpty(refInfoList)"
        layout="sizes, prev, pager, next, jumper">
      </el-pagination>
    </div>
  </div>
</template>

<script>
import * as R from 'ramda'
import {
  analyzePkgCompareResult,
  generateVarTree,
  getDeviceSymbol,
  updatePackages
} from '@/renderer/pages/nextStudio/action'
import { openWindowLoading } from '@/renderer/common/action'
export default {
  name: 'step3UpdatePreview',
  data () {
    return {
      confirming: false,
      loading: false,
      currentPage: 1,
      pageSize: 10,
      refInfoList: []
    }
  },
  computed: {
    pathIdBindRecords () {
      return this.$store.getters.pathIdBindRecords
    },
    compareResult () {
      return this.$store.getters.pkgComparedResult
    },
    total () {
      return this.refInfoList.length
    },
    tableData () {
      const start = (this.currentPage - 1) * this.pageSize
      const end = start + this.pageSize
      return R.slice(start, end)(this.refInfoList)
    }
  },
  methods: {
    init () {
      this.loading = true
      this.refInfoList = []
      analyzePkgCompareResult(this.compareResult, this.pathIdBindRecords.vfbMap)
        .then((resArr) => {
          resArr.forEach((result) => {
            this.refInfoList.push(result)
          })
        })
        .finally(() => {
          this.loading = false
        })
    },
    clearStatus () {
      this.confirming = false
      this.loading = false
      this.currentPage = 1
      this.pageSize = 10
      this.refInfoList = []
    },
    previous () {
      this.clearStatus()
      this.$emit('previous')
    },
    confirm () {
      if (this.confirming) {
        return
      }
      this.confirming = true
      const loading = openWindowLoading()
      // FIXME
      updatePackages(this.compareResult, this.pathIdBindRecords)
        .then(() => {
          this.$notification.openSuccessNotification('功能块包升级成功')
          getDeviceSymbol()
          generateVarTree()
          // 程序页面会有缓存的图形，先全部关闭后让用户重新打开 刷新页面
          this.$vbus.$emit('RELOAD_WORK_AREA')
          this.clearStatus()
          this.$store.commit('setPkgCompareResult', null)
          this.$emit('confirm')
        })
        .catch((e) => {
          this.$notification.openErrorNotification(e)
          this.$logger.error(e)
        })
        .finally(() => {
          this.confirming = false
          loading.close()
        })
    }
  },
  mounted () {
    this.init()
  }
}
</script>

<style scoped>

</style>
