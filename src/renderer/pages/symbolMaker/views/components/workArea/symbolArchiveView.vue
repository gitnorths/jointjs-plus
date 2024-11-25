<template>
  <div class="info-container">
    <el-row>
      <span class="pathArea">路径：{{ archive.dbPath }}</span>
    </el-row>
    <el-row style="padding-top: 20px; text-align: center">
      <div class="title">{{ archive.name }}</div>
    </el-row>
    <el-row style="padding-top: 20px;margin-left: 10%">
      <h3>基本信息</h3>
    </el-row>
    <el-row>
      <el-descriptions :column="2" border style="width: 80%; margin: auto">
        <el-descriptions-item label="版本" label-class-name="base-label">
          {{ archive.version }}
        </el-descriptions-item>
        <el-descriptions-item label="兼容的平台" label-class-name="base-label">
          {{ renderPlatformVersion(archive.platformVersion) }}
        </el-descriptions-item>
        <el-descriptions-item label="描述" label-class-name="base-label">
          {{ archive.desc}}
        </el-descriptions-item>
      </el-descriptions>
    </el-row>
    <el-row style="padding-top: 20px;margin-left: 10%">
      <h3>版本历史</h3>
    </el-row>
    <el-row style="height: calc(100% - 300px)">
      <el-table
        :data="historyList"
        height="100%"
        border
        style="width: 80%;margin: auto">
        <el-table-column prop="version" label="版本号" width="150" align="center"></el-table-column>
        <el-table-column prop="date" label="日期" width="150" align="center"></el-table-column>
        <el-table-column prop="author" label="作者" width="200" align="center"></el-table-column>
        <el-table-column prop="describe" label="更新内容" align="center"></el-table-column>
      </el-table>
    </el-row>
  </div>
</template>

<script>
import * as R from 'ramda'

export default {
  name: 'SymbolArchiveView',
  props: ['tagKey'],
  data () {
    return {
      visible: false
    }
  },
  computed: {
    archive () {
      return this.$store.getters.workTagsSelectDto(this.tagKey)
    },
    historyList () {
      const list = this.archive.historyList || []
      return R.reverse(list)
    }
  },
  methods: {
    renderPlatformVersion (platformVersion) {
      if (platformVersion) {
        if (platformVersion[0]) {
          if (platformVersion[1]) {
            if (platformVersion[0] === platformVersion[1]) {
              return `仅 ${platformVersion[0]}`
            }
            return `${platformVersion[0]} ~ ${platformVersion[1]}`
          }
          return `${platformVersion[0]} 及以上`
        }
        return `${platformVersion[1]} 及以下`
      }
      return '全部'
    }
  }
}
</script>

<style lang="scss" scoped>
.pathArea {
  line-height: 30px;
  padding-left: 10px;
  color: #bdbdbd;
  font-size: 12px;
}

.info-container {
  height: 100%;
}

.repoPath {
  padding-bottom: 20px;
}

.title {
  font-size: 2rem;
  font-weight: 600;
}

</style>
<style>
.base-label {
  width: 160px;
}
</style>
