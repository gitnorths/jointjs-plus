<template>
  <el-tabs v-model="activeName" tab-position='bottom' type="card" id="hardwareViewContainer">
    <el-tab-pane label="竖插" name="verticalConfig">
      <main-board-view :boards="boards"/>
    </el-tab-pane>
    <el-tab-pane label="横插" name="horizontalConfig">
      <rack-view :boards="boards" @edit-done="syncDelta" ref="rack"/>
    </el-tab-pane>
    <el-tab-pane label="背板图" name="backGraph">
      <img src="hardware/backboard.png" width="100%" height="100%"/>
    </el-tab-pane>
  </el-tabs>
</template>

<script>
import * as R from 'ramda'
import RackView from './rackView.vue'
import MainBoardView from './mainBoardView.vue'
import { getObjContext } from '@/renderer/pages/nextStudio/action'
import { openWindowLoading } from '@/renderer/common/action'
import store from '@/renderer/pages/symbolMaker/store'
import { Page } from '@/model/dto'

export default {
  name: 'hardwareView',
  components: { MainBoardView, RackView },
  props: {
    tagKey: {
      type: String,
      required: true
    }
  },
  computed: {
    mainBoardDto () {
      return this.$store.getters.selectDto(this.tagKey)
    },
    device () {
      return this.$store.getters.device
    },
    deviceDbName () {
      return this.$store.getters.deviceDbName
    }
  },
  data () {
    return {
      activeName: 'verticalConfig',
      boardDescChanged: false,
      boardTypeChanged: false,
      boards: [],
      hideTypes: []
    }
  },
  methods: {
    init () {
      const loading = openWindowLoading('获取母板信息中...')
      this.clear()
      getObjContext(this.mainBoardDto, this.deviceDbName)
        .then((mainBoard) => {
          this.boards = mainBoard.slots
        })
        .catch((e) => {
          this.$notification.openErrorNotification(`获取数据出错 ${e.message}`)
        })
        .finally(() => {
          loading.close()
        })
    },
    clear () {
      this.hideTypes = []
      this.boards = []
    },
    syncDelta () {
      const toSaveDelta = { insertRecords: [], removeRecords: [], updateRecords: [] }
      const rackDelta = this.$refs.rack.getDelta()

      this.boardTypeChanged = false
      this.boardDescChanged = false
      if (rackDelta && R.isNotEmpty(rackDelta.updateRecords)) {
        for (const updateBoard of rackDelta.updateRecords) {
          const orgBoard = R.find(R.propEq(updateBoard.id, 'id'))(this.boards)
          const orgOptList = orgBoard.optList.sort((a, b) => a > b ? 1 : -1)
          const newOptList = updateBoard.optList.sort((a, b) => a > b ? 1 : -1)
          if (!R.equals(orgOptList, newOptList)) {
            this.boardTypeChanged = true
          }
          // 关闭页面，刷新变量库
          const hideTypes = R.difference(orgOptList, newOptList) || []
          this.hideTypes.push(...hideTypes)
          if (orgBoard.desc !== updateBoard.desc) {
            this.boardDescChanged = true
          }
        }
        toSaveDelta.updateRecords.push(...rackDelta.updateRecords)
      }

      this.$store.commit('updateDelta', { key: this.tagKey, delta: toSaveDelta })
    },
    reset (ignoreTagKeys) {
      if (ignoreTagKeys && !R.includes(this.tagKey, ignoreTagKeys)) {
        return
      }
      // 关闭页面
      this.closePageTag()
      this.init()
      if (this.boardDescChanged) {
        this.$vbus.$emit('board-desc-changed')
      }
      if (this.boardTypeChanged) {
        this.$vbus.$emit('board-type-changed')
        // 修改板卡后刷新其他页
        this.$vbus.$emit('REFRESH_WORK_AREA')
      }
    },
    closePageTag () {
      if (R.isNotEmpty(this.hideTypes)) {
        for (const hideType of this.hideTypes) {
          const optBoard = R.find(R.propEq(hideType, 'type'))(this.device.program.optBoards)
          if (optBoard) {
            for (const core of (optBoard.cpuCores || [])) {
              for (const proc of (core.processItems || [])) {
                for (const page of (proc.pages || [])) {
                  const index = R.findIndex((obj) => obj instanceof Page && obj.id === page.id)(store.getters.workTagsContainer)
                  this.$store.commit('closeTags', { curIndex: index, direction: '' })
                  for (const subPage of page.pages) {
                    const index = R.findIndex((obj) => obj instanceof Page && obj.id === subPage.id)(store.getters.workTagsContainer)
                    this.$store.commit('closeTags', { curIndex: index, direction: '' })
                  }
                }
              }
              for (const page of (core.pages || [])) {
                const index = R.findIndex((obj) => obj instanceof Page && obj.id === page.id)(store.getters.workTagsContainer)
                this.$store.commit('closeTags', { curIndex: index, direction: '' })
                for (const subPage of page.pages) {
                  const index = R.findIndex((obj) => obj instanceof Page && obj.id === subPage.id)(store.getters.workTagsContainer)
                  this.$store.commit('closeTags', { curIndex: index, direction: '' })
                }
              }
            }
          }
        }
        this.hideTypes = []
      }
    }
  },
  mounted () {
    this.init()
    this.$vbus.$on('RELOAD_WORK_AREA', this.reset)
    this.$vbus.$on('SAVE_SUCCEEDED', this.reset)
    this.$vbus.$on('board-deleted', this.init)
  },
  destroyed () {
    this.$vbus.$off('RELOAD_WORK_AREA', this.reset)
    this.$vbus.$off('SAVE_SUCCEEDED', this.reset)
    this.$vbus.$off('board-deleted', this.init)
  }
}
</script>

<style lang="scss">
#hardwareViewContainer {
  height: 100%;
  width: 100%;

  .el-tabs__header {
    margin-top: -3px;
    padding-top: 0;

    .is-active {
      color: white;
      background-color: #409eff;
    }
  }
}
</style>
