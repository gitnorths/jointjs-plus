<template>
  <div style="height: 100%">
    <vxe-toolbar>
      <template v-slot:buttons>
        <h3 style="margin-left: 12px">绑定关系</h3>
      </template>
      <template v-slot:tools>
        <vxe-button status="primary" @click="previous">
          <i class="el-icon-arrow-left"></i> 上一步
        </vxe-button>
        <vxe-button status="primary" @click="next" style="margin-right: 12px">
          下一步 <i class="el-icon-arrow-right"></i>
        </vxe-button>
      </template>
    </vxe-toolbar>
    <div style="width: 100%; height: calc(100% - 52px);">
      <el-table
        height="calc(100% - 32px)"
        border
        stripe
        size="mini"
        :default-sort="{prop: 'source', order: 'descending'}"
        :data="tableData">
        <el-table-column prop="type" sortable label="类型" width="120"></el-table-column>
        <el-table-column prop="source" sortable label="源"></el-table-column>
        <el-table-column prop="target" sortable label="目的"></el-table-column>
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

export default {
  name: 'step2BindPreview',
  data () {
    return {
      currentPage: 1,
      pageSize: 10
    }
  },
  computed: {
    pathIdBindRecords () {
      return this.$store.getters.pathIdBindRecords
    },
    refInfoList () {
      const result = [];
      ['vfbMap', 'inputMap', 'outputMap', 'paramMap'].forEach(mapName => {
        Object.keys(this.pathIdBindRecords[mapName]).forEach(source => {
          const target = this.pathIdBindRecords[mapName][source]
          result.push({ source, target, type: this.calcType(mapName) })
        })
      })
      return result
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
    clearStatus () {
      this.currentPage = 1
      this.pageSize = 10
    },
    calcType (mapName) {
      switch (mapName) {
        case 'vfbMap':
          return '功能块'
        case 'inputMap':
          return '输入'
        case 'outputMap':
          return '输出'
        case 'paramMap':
          return '参数'
        default:
          return ''
      }
    },
    previous () {
      this.clearStatus()
      this.$emit('previous')
    },
    next () {
      this.$emit('next')
    }
  }
}
</script>

<style scoped>

</style>
