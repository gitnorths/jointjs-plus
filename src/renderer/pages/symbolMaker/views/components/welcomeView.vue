<template>
  <div class="newWelcomeContainer">
    <el-row class="welcome-title">
      <div class="title">{{ title }}</div>
      <div class="subTitle">{{ subTitle }}</div>
    </el-row>
    <el-row class="main-container">
      <el-col :span="12" style="height: 100%">
        <el-row class="recent-container">
          <h2>最近打开</h2>
          <div v-if=" !recentFiles.length" style=" padding-left: 20px">
            您在本地打开过的符号仓都将在此显示
          </div>
          <ul style="height: calc(100% - 60px); overflow: auto">
            <li v-for="filePath in recentFiles" :title="filePath" :key="filePath">
              <div class="file-item">
                <div class="file-path" @click="openRecentSymbolArchive(filePath)">{{ filePath }}</div>
                <vxe-button type="text" icon="fa fa-close" class="closeBtn"
                            @click="deleteRecord(filePath)"></vxe-button>
              </div>
            </li>
          </ul>
        </el-row>
      </el-col>
      <el-col :span="11" :offset="1" style="height: 100%;">
        <el-row class="tool-container">
          <h2>开始使用</h2>
          <ul>
            <li>
              <span @click="newSymbolArchive">
                <i class="el-icon-document-add"/> 新建符号仓...
              </span>
            </li>
            <li>
              <span @click="openSymbolArchive">
                <i class="el-icon-folder-opened"/> 打开符号仓...
              </span>
            </li>
          </ul>
        </el-row>
        <el-row class="tool-container">
          <h2>首选项</h2>
          <ul>
            <li>
              <span @click="config">
                <i class="el-icon-setting"/> 选项...
              </span>
            </li>
          </ul>
        </el-row>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import {
  clearRecentAction,
  getRecentAction,
  newSymbolArchiveAction,
  openRecentArchiveAction,
  openSymbolArchiveAction
} from '@/renderer/pages/symbolMaker/action'

export default {
  name: 'seWelcomeComponent',
  data () {
    return {
      recentFiles: [],
      title: '欢迎使用符号编辑器',
      subTitle: '可视化符号块管理工具'
    }
  },
  methods: {
    openRecentSymbolArchive (filePath) {
      openRecentArchiveAction(filePath)
    },
    deleteRecord (filePath) {
      clearRecentAction(filePath)
    },
    newSymbolArchive () {
      newSymbolArchiveAction()
    },
    openSymbolArchive () {
      openSymbolArchiveAction()
    },
    init () {
      this.recentFiles = getRecentAction()
    },
    config () {
      // TODO
      this.$notification.openInfoNotification('该功能暂未开放')
    }
  },
  mounted () {
    this.init()
    this.$vbus.$on('REFRESH_MENU_BAR', this.init)
  },
  destroyed () {
    this.$vbus.$off('REFRESH_MENU_BAR', this.init)
  }
}
</script>

<style lang="scss" scoped>
.newWelcomeContainer {
  width: 100%;
  height: 100%;
  padding: 0 140px;

  .welcome-title {
    height: 140px;
    padding-top: 30px;

    .title {
      font-size: 2.5rem;
      font-weight: 600;
    }

    .subTitle {
      font-size: 1.2rem;
      font-weight: 600;
      padding-top: 10px;
    }
  }

  .main-container {
    width: 100%;
    height: calc(100% - 140px);
    padding: 20px 0;
  }

  .recent-container {
    background-color: #f8f8f8;
    padding-top: 20px;
    padding-left: 30px;
    height: 100%;

    ul {
      li {
        margin-top: 10px;
        cursor: pointer;
        list-style-type: none;
        font-size: 14px;
        width: 350px;

        .file-item {

          .file-path {
            display: inline-block;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            width: 320px;
            color: #2b2b2b;
            padding-top: 3px;
          }

          .closeBtn {
            display: none;
            padding: 2px 7px 0 0;
          }
        }

        &:hover {
          .file-item {
            background-color: #c5c5c5;
          }

          .closeBtn {
            display: inline-block;
            float: right;
          }
        }
      }
    }
  }

  .tool-container {
    padding-top: 20px;
    padding-left: 30px;

    ul {
      margin-top: 15px;

      li {
        list-style-type: none;
        margin-bottom: 15px;
        color: #0635f3;
        font-size: 18px;

        span:hover {
          background-color: #c3cfff;
        }

        span {
          cursor: pointer;
        }
      }
    }
  }

}
</style>
