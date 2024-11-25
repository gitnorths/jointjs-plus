<template>
  <vxe-modal
    v-model="dialogVisible"
    :title="title"
    class="searchDialog"
    width="600"
    height="400"
    esc-closable
    show-close
    destroy-on-close
    resize
    remember
    :loading=loading
    :lock-view=false
    :mask=false
    :before-hide-method="beforeCloseHandler"
    transfer
    ref="modal">
    <div class="searchBar">
      <el-tooltip style="margin-top:-3px" content="区分大小写" placement="bottom-start" :open-delay=1000>
        <vxe-checkbox v-model="matchCase">Aa</vxe-checkbox>
      </el-tooltip>
      <el-tooltip style="margin-top:-3px" content="全词匹配" placement="bottom-start" :open-delay=1000>
        <vxe-checkbox v-model="matchWords">W</vxe-checkbox>
      </el-tooltip>
      <vxe-input v-model="findStr" style="margin-left: 10px; width: calc(100% - 110px)" @keyup="keyUpHandler"
                 ref="input">
        <template v-slot:prefix>
          <i class="fa fa-search"></i>
        </template>
        <template v-slot:suffix>
          <vxe-button @click="count" status="primary">查找</vxe-button>
        </template>
      </vxe-input>
    </div>
    <div class="searchResult">
      <el-tabs v-model="activeName" type="card" tab-position="bottom">
        <el-tab-pane :label="`功能块(${vfbResult.length || 0})`" name="vfb" v-if="vfbResult && vfbResult.length>0">
          <search-vfb-table :table-data="vfbResult" :page-list="pageList"/>
        </el-tab-pane>
        <el-tab-pane :label="`输入(${inputResult.length || 0})`" name="input"
                     v-if="inputResult && inputResult.length>0">
          <search-i-o-p-table :table-data="inputResult" :page-list="pageList"/>
        </el-tab-pane>
        <el-tab-pane :label="`输出(${outputResult.length || 0})`" name="output"
                     v-if="outputResult && outputResult.length>0">
          <search-i-o-p-table :table-data="outputResult" :page-list="pageList"/>
        </el-tab-pane>
        <el-tab-pane :label="`参数(${paramResult.length || 0})`" name="param"
                     v-if="paramResult && paramResult.length>0">
          <search-i-o-p-table :table-data="paramResult" :page-list="pageList"/>
        </el-tab-pane>
        <el-tab-pane :label="`定值分组(${settingResult.length || 0})`" name="setting"
                     v-if="settingResult && settingResult.length>0">
          <search-signal-group-table :table-data="settingResult" :group-list="settingGroups"/>
        </el-tab-pane>
        <el-tab-pane :label="`开关量分组(${binaryResult.length || 0})`" name="binary"
                     v-if="binaryResult && binaryResult.length>0">
          <search-signal-group-table :table-data="binaryResult" :group-list="binaryGroups"/>
        </el-tab-pane>
        <el-tab-pane :label="`模拟量分组(${analogResult.length || 0})`" name="analog"
                     v-if="analogResult && analogResult.length>0">
          <search-signal-group-table :table-data="analogResult" :group-list="analogGroups"/>
        </el-tab-pane>
        <el-tab-pane :label="`控制分组(${controlResult.length || 0})`" name="control"
                     v-if="controlResult && controlResult.length>0">
          <search-signal-group-table :table-data="controlResult" :group-list="controlGroups"/>
        </el-tab-pane>
        <el-tab-pane :label="`录波设置(${recordSetResult.length || 0})`" name="recordSet"
                     v-if="recordSetResult && recordSetResult.length>0">
          <search-signal-group-table :table-data="recordSetResult" :group-list="recordSetGroups"/>
        </el-tab-pane>
        <el-tab-pane :label="`自定义分组(${refTableResult.length || 0})`" name="refTable"
                     v-if="refTableResult && refTableResult.length>0">
          <search-signal-group-table :table-data="refTableResult" :group-list="refTableGroups"/>
        </el-tab-pane>
      </el-tabs>
    </div>
  </vxe-modal>
</template>

<script>
import SearchVfbTable from './searchVfbTable.vue'
import SearchIOPTable from './searchIOPTable.vue'
import SearchSignalGroupTable from './searchSignalGroupTable.vue'
import { findInProject } from '@/renderer/pages/nextStudio/action'
import * as R from 'ramda'

export default {
  name: 'searchDialog',
  components: { SearchSignalGroupTable, SearchIOPTable, SearchVfbTable },
  data () {
    return {
      dialogVisible: false,
      loading: false,
      findStr: '',
      activeName: '',
      vfbResult: [],
      inputResult: [],
      outputResult: [],
      paramResult: [],
      settingResult: [],
      binaryResult: [],
      analogResult: [],
      refTableResult: [],
      recordSetResult: [],
      controlResult: [],
      matchCase: false,
      matchWords: false
    }
  },
  computed: {
    deviceDto () {
      return this.$store.getters.device
    },
    pageList () {
      const pageList = []
      if (this.deviceDto && R.isNotEmpty(this.deviceDto.programConfig.boards)) {
        this.deviceDto.programConfig.boards.forEach(board => {
          board.cpus.forEach(cpu => {
            cpu.cores.forEach(core => {
              if (core.processes && R.isNotEmpty(core.processes)) {
                core.processes.forEach(process => {
                  if (process.pageList && R.isNotEmpty(process.pageList)) {
                    pageList.push(...process.pageList)
                  }
                })
              }
            })
          })
        })
      }
      return pageList
    },
    settingGroups () {
      const settingGroups = []
      if (this.deviceDto) {
        this.flatGroups(this.deviceDto.config.settingGroup.groupList, settingGroups)
      }
      return settingGroups
    },
    binaryGroups () {
      const binaryGroups = []
      if (this.deviceDto) {
        this.flatGroups(this.deviceDto.config.binaryGroup.groupList, binaryGroups)
      }
      return binaryGroups
    },
    analogGroups () {
      const analogGroups = []
      if (this.deviceDto) {
        this.flatGroups(this.deviceDto.config.analogGroup.groupList, analogGroups)
      }
      return analogGroups
    },
    refTableGroups () {
      const refTableGroups = []
      if (this.deviceDto) {
        this.flatGroups(this.deviceDto.config.refTab.groupList, refTableGroups)
      }
      return refTableGroups
    },
    recordSetGroups () {
      const recordSetGroups = []
      if (this.deviceDto) {
        recordSetGroups.push(this.deviceDto.config.recordSet.faultInfo)
        recordSetGroups.push(this.deviceDto.config.recordSet.trigger)
      }
      return recordSetGroups
    },
    controlGroups () {
      const controlGroups = []
      if (this.deviceDto) {
        controlGroups.push(this.deviceDto.config.ctrl.teleRegulate)
        controlGroups.push(this.deviceDto.config.ctrl.teleCtrl)
      }
      return controlGroups
    },
    activeKey () {
      return this.$store.getters.activeKey
    },
    title () {
      return '全局搜索'
    }
  },
  watch: {
    deviceDto (val) {
      if (!val) {
        this.dialogVisible = false
      }
    }
  },
  methods: {
    flatGroups (groupList, results) {
      if (R.isNotEmpty(groupList)) {
        for (const group of groupList) {
          results.push(group)
          this.flatGroups(group.groupList, results)
        }
      }
    },
    openDialog () {
      if (!this.deviceDto) {
        return
      }
      this.dialogVisible = true
      setTimeout(() => {
        this.$refs.input.focus()
      }, 100)
    },
    clear () {
      this.findStr = ''
      this.vfbResult = []
      this.inputResult = []
      this.outputResult = []
      this.paramResult = []
      this.settingResult = []
      this.binaryResult = []
      this.analogResult = []
      this.refTableResult = []
      this.recordSetResult = []
      this.controlResult = []
    },
    beforeCloseHandler () {
      this.clear()
    },
    keyUpHandler ({ $event }) {
      if ($event.key === 'Enter') {
        this.count()
      }
    },
    count () {
      // 清除聚焦的vfbId
      this.$store.commit('setFocusedVfbId', '')

      if (this.findStr === null || this.findStr === undefined || this.findStr === '') {
        this.clear()
        return
      }
      this.loading = true
      // 程序页面返回所有功能块实例name或者instName匹配
      setTimeout(() => {
        findInProject({
          findStr: this.findStr, matchCase: this.matchCase, matchWords: this.matchWords
        }).then((findResult) => {
          this.vfbResult = findResult.vfbResult || []
          this.inputResult = findResult.inputResult || []
          this.outputResult = findResult.outputResult || []
          this.paramResult = findResult.paramResult || []
          this.settingResult = findResult.settingGroup || []
          this.binaryResult = findResult.binaryGroup || []
          this.analogResult = findResult.analogGroup || []
          this.refTableResult = findResult.refTableGroup || []
          this.recordSetResult = findResult.recordSet || []
          this.controlResult = findResult.controlGroup || []

          if (R.isNotEmpty(this.vfbResult)) {
            this.activeName = 'vfb'
          } else if (R.isNotEmpty(this.inputResult)) {
            this.activeName = 'input'
          } else if (R.isNotEmpty(this.outputResult)) {
            this.activeName = 'output'
          } else if (R.isNotEmpty(this.paramResult)) {
            this.activeName = 'param'
          } else if (R.isNotEmpty(this.settingResult)) {
            this.activeName = 'setting'
          } else if (R.isNotEmpty(this.binaryResult)) {
            this.activeName = 'binary'
          } else if (R.isNotEmpty(this.analogResult)) {
            this.activeName = 'analog'
          } else if (R.isNotEmpty(this.controlResult)) {
            this.activeName = 'control'
          } else if (R.isNotEmpty(this.recordSetResult)) {
            this.activeName = 'recordSet'
          } else if (R.isNotEmpty(this.refTableResult)) {
            this.activeName = 'refTable'
          }
        }).catch((e) => {
          this.$notification.openErrorNotification('搜索失败' + e).logger()
        }).finally(() => {
          this.loading = false
        })
      }, 50)
    }
  },
  mounted () {
    this.$vbus.$on('OPEN_SEARCH_DIALOG', this.openDialog)
  },
  destroyed () {
    this.$vbus.$off('OPEN_SEARCH_DIALOG', this.openDialog)
  }
}
</script>

<style lang="scss">
.searchDialog {
  .vxe-modal--box .vxe-modal--body .vxe-modal--content {
    padding: 0;
    overflow: hidden;
  }

  .searchBar {
    width: 100%;
    padding-left: 10px
  }

  .searchResult {
    height: calc(100% - 36px);
    margin-top: 2px;

    .el-tabs {
      .el-tabs__header {
        margin-top: 0;
        padding-top: 0;

        .is-active {
          color: white;
          background-color: #409eff;
        }
      }
    }
  }
}
</style>
