<template>
  <el-row class="main-container">
    <el-col :span="8" :offset="1" class="leftPanel">
      <el-row class="welcome-title">
        <el-col :span="6">
          <img src="logo/nextStudio.png" style="width: 100px"/>
        </el-col>
        <el-col :span="17" :offset="1">
          <div class="title">{{ title }}</div>
          <div class="subTitle">{{ subTitle }}</div>
        </el-col>
      </el-row>
      <el-row class="authInfo">
        <div class="authInfoTitle">{{ authInfo }}</div>
      </el-row>
      <el-row class="tool-container">
        <div>
              <span @click="compilerConfig">
                <i class="el-icon-setting"/> 编译器配置...
              </span>
        </div>
        <div>
              <span @click="templateConfig">
                <i class="el-icon-setting"/> 机箱|板卡模板同步...
              </span>
        </div>
      </el-row>
    </el-col>
    <el-col :span="15" class="rightPanel" style="height: 100%">
      <div class="welcome-head"></div>
      <el-row class="recent-container">
        <h1>最近打开</h1>
        <h2 v-if=" !recentFiles.length" style=" padding-left: 20px;">
          您在本地打开过的装置工程将在此显示
        </h2>
        <div style="height: calc(100% - 100px); overflow: auto">
          <div v-for="filePath in recentFiles" :title="filePath" :key="filePath" class="file-item"
               @click="openRecentDevice(filePath)">
            <div class="file-path">{{ filePath }}</div>
            <vxe-button type="text" icon="fa fa-close" class="closeBtn"
                        @click="deleteRecord(filePath)"></vxe-button>
          </div>
        </div>
      </el-row>
      <el-row class="welcome-btns">
        <el-button class="welcome-btn" @click="openDevice">打开装置</el-button>
        <el-button class="welcome-btn" type="primary" @click="newDevice">新建装置</el-button>
      </el-row>
    </el-col>
  </el-row>
</template>

<script>
import {
  clearRecentAction,
  getRecentAction,
  newDeviceAction,
  openDeviceAction,
  openRecentDeviceAction,
  showPreferenceDialog
} from '@/renderer/pages/nextStudio/action'

export default {
  name: 'newWelcomeView',
  data () {
    return {
      recentFiles: [],
      title: 'Next Studio',
      subTitle: '研发版 V3.0.0-DEMO',
      authInfo: '已授权 > 20250101'
    }
  },
  methods: {
    openRecentDevice (filePath) {
      openRecentDeviceAction(filePath)
    },
    deleteRecord (filePath) {
      clearRecentAction(filePath)
    },
    newDevice () {
      newDeviceAction()
    },
    openDevice () {
      openDeviceAction()
    },
    compilerConfig () {
      showPreferenceDialog('compilerPath')
    },
    templateConfig () {
      showPreferenceDialog('rackTemplate')
    },
    init () {
      this.recentFiles = getRecentAction()
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
.main-container {
  width: 100%;
  height: 100%;
  background-color: #f8f8f8;

  .leftPanel {
    height: 100%;
    border-right: 1px solid;

    .welcome-title {
      height: 140px;
      padding-top: 40px;

      .title {
        font-size: 2.2rem;
        font-weight: 500;
      }

      .subTitle {
        font-size: 1.2rem;
        font-weight: 500;
      }
    }

    .authInfo {
      height: calc(100% - 280px);
      padding-top: 40px;

      .authInfoTitle {
        font-size: 1.2rem;
        font-weight: 460;
      }
    }

    .tool-container {
      padding-top: 20px;

      div {
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

  .rightPanel {
    height: 100%;
    background-color: white;

    .welcome-head {
      width: 100%;
      height: 100px;
      background: linear-gradient(to right, #fa3f11, #4768fa);
    }

    .recent-container {
      padding-top: 20px;
      padding-left: 30px;
      height: calc(100% - 180px);

      .file-item {
        cursor: pointer;
        font-size: 18px;
        padding: 7px 0 5px 20px;
        width: calc(100% - 100px);
        border-top: 1px solid #2b2b2b;

        .file-path {
          display: inline-block;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          width: calc(100% - 50px);
          color: #2b2b2b;
        }

        .closeBtn {
          font-size: 18px;
          padding-right: 18px;
          float: right;
        }

        &:hover {
          background-color: #c4ccff;
        }
      }
    }

    .welcome-btns {
      display: flex;
      justify-content: space-between;

      .welcome-btn {
        font-size: 1.3rem;
        width: 40%;
      }
    }
  }
}
</style>
