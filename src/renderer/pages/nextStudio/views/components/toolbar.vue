<template>
  <div class="toolbarContainer">
    <div class="commonToolbar">
      <el-tooltip content="打开符号编辑器(Symbol Maker)" placement="bottom-start" :open-delay=500>
        <el-button class="m_tool_btn" @click="openSymbolMaker">
          <img src="logo/symbolMaker.png" style="height: 20px" alt="打开符号编辑器">
        </el-button>
      </el-tooltip>
      <el-divider direction="vertical"/>
      <el-tooltip content="新建" placement="bottom-start" :open-delay=500>
        <el-button :disabled="debugMode" class="m_tool_btn" icon="el-icon-folder-add"
                   @click="newDevice"></el-button>
      </el-tooltip>
      <el-tooltip content="打开" placement="bottom-start" :open-delay=500>
        <el-button :disabled="debugMode" class="m_tool_btn" icon="el-icon-folder-opened"
                   @click="openDevice"></el-button>
      </el-tooltip>
      <el-tooltip content="保存" placement="bottom-start" :open-delay=500>
        <el-button :disabled="!deviceDto || debugMode" class="m_tool_btn" icon="fa fa-save"
                   @click="saveAll"></el-button>
      </el-tooltip>
      <!--功能块编辑区-->
      <el-divider direction="vertical"/>
      <el-tooltip v-if="deviceDto" content="维护功能块" placement="bottom-start" :open-delay=500>
        <el-button :disabled="debugMode" class="m_tool_btn vfb_man_btn" icon="fa fa-cogs"
                   @click="updateSymbolArchive"></el-button>
      </el-tooltip>
      <!--平台release-->
      <el-tooltip v-if="deviceDto" content="维护平台release" placement="bottom-start" :open-delay=500>
        <el-button :disabled="debugMode" class="m_tool_btn" icon="fa fa-box-archive"
                   @click="platformReleaseMng"></el-button>
      </el-tooltip>
      <el-divider v-if="deviceDto" direction="vertical"/>
      <el-tooltip v-if="deviceDto" content="查询图表" placement="bottom-start" :open-delay=500>
        <el-button class="m_tool_btn chart_btn" icon="fa fa-line-chart" @click="showLineChart">
        </el-button>
      </el-tooltip>
      <el-tooltip v-if="deviceDto && !debugMode" content="页面调试" placement="bottom-start" :open-delay=500>
        <el-button :disabled="!deviceDto" class="m_tool_btn" icon="fa fa-bug"
                   @click="enterDebugMode"></el-button>
      </el-tooltip>
      <el-tooltip v-if="debugMode" content="退出调试" placement="bottom-start" :open-delay=500>
        <el-button class="m_tool_btn debug_btn" icon="fa fa-bug" @click="quitDebugMode"></el-button>
      </el-tooltip>
      <el-divider v-if="debugMode" direction="vertical"/>
      <el-tooltip v-if="debugMode" content="变量监控" placement="bottom-start" :open-delay=500>
        <el-button class="m_tool_btn" icon="fa fa-binoculars" @click="openSignalWatch"></el-button>
      </el-tooltip>
      <el-tooltip v-if="debugMode" :content="recordStatus ? '停止录制' : '信号录制'" placement="bottom-start"
                  :open-delay=500>
        <el-button v-if="recordStatus" class="m_tool_btn record_btn_on" icon="el-icon-video-pause"
                   @click="stopRecord"></el-button>
        <el-button v-else class="m_tool_btn" icon="el-icon-video-play" title=""
                   @click="showRecordDialog"></el-button>
      </el-tooltip>
    </div>
    <!--运行调试区-->
    <div class="runToolbar" v-if="deviceDto && !debugMode">
      <el-divider direction="vertical"/>
      <el-select v-model="scriptStr" placeholder="请选择要执行的操作" size="mini"
                 style="width: 245px; margin-right: 4px; top: -2px">
        <el-option v-for="item in makeOptions" :key="item.label" :label="item.label"
                   :value="item.value"></el-option>
      </el-select>
      <el-tooltip content="运行" placement="bottom-start" :open-delay=500>
        <el-button class="m_tool_btn run_btn" icon="fa fa-play"
                   @click="runScript"></el-button>
      </el-tooltip>
    </div>
    <!--编辑按钮区-->
    <div class="editToolBar" v-if="deviceDto && !debugMode">
      <el-divider direction="vertical"/>
      <el-tooltip content="重新加载" placement="bottom-start" :open-delay=500>
        <el-button class="m_tool_btn" icon="el-icon-refresh" @click="reset"></el-button>
      </el-tooltip>
      <el-tooltip content="撤销" placement="bottom-start" :open-delay=500>
        <el-button class="edit_btn" icon="fa fa-reply" @click="undo" :disabled="!showGraphToolBar"></el-button>
      </el-tooltip>
      <el-tooltip content="重做" placement="bottom-start" :open-delay=500>
        <el-button class="edit_btn" icon="fa fa-share" @click="redo" :disabled="!showGraphToolBar"></el-button>
      </el-tooltip>
    </div>
    <!--视图调整区-->
    <div class="editToolBar" v-if="showGraphToolBar">
      <el-divider direction="vertical"/>
      <el-input size="small" v-model="showScale">
        <template v-slot:suffix>%</template>
      </el-input>
      <el-tooltip content="重置缩放" placement="bottom-start" :open-delay=500>
        <el-button class="m_tool_btn" icon="el-icon-refresh-right" @click="resetScale"></el-button>
      </el-tooltip>
      <el-divider direction="vertical"/>
      <el-tooltip v-for="(item, index) in toolFuncItems" :content="item.label" :key="index" placement="bottom-start"
                  :open-delay=500>
        <el-button class="m_tool_btn" @click="toolBtnClickHandler(item)">
          <img :src="item.icon" :alt="item.label">
        </el-button>
      </el-tooltip>
      <el-divider direction="vertical"/>
      <!--自定义功能块区-->
      <el-tooltip v-for="(item, index) in toolSymbolItems" :content="item.label" :key="`${index}draggable`"
                  placement="bottom-start" :open-delay=500>
        <el-button class="m_tool_btn" ref="draggableItem" :pathId="item.pathId">
          <img :src="item.icon" :alt="item.label">
        </el-button>
      </el-tooltip>
      <el-tooltip v-for="(item, index) in annotationItems" content="注解" :key="`annotation${index}`"
                  placement="bottom-start" :open-delay=500>
        <el-button class="m_tool_btn" ref="annotationItem" :colorStr="item.color">
          <img :src="item.icon" alt="注解">
        </el-button>
      </el-tooltip>
    </div>
  </div>
</template>

<script>
import * as R from 'ramda'
import {
  enterDebugMode,
  generateConfigFile,
  GraphSizeMap,
  newDeviceAction,
  openDeviceAction,
  openLineChart,
  openSymbolMaker,
  quitDebugMode,
  save,
  updateSymbolArchive
} from '@/renderer/pages/nextStudio/action'
import { Page } from '@/model/dto'
import { format10 } from '@/util'

export default {
  name: 'toolbarComp',
  data () {
    return {
      scale: 1,
      scriptStr: 'generateConfigFile',
      toolFuncItems: [
        {
          label: '左对齐',
          icon: './icon/left_align.png',
          clickFunc: this.align('left')
        },
        {
          label: '右对齐',
          icon: './icon/right_align.png',
          clickFunc: this.align('right')
        },
        {
          label: '上对齐',
          icon: './icon/top_align.png',
          clickFunc: this.align('top')
        },
        {
          label: '下对齐',
          icon: './icon/bottom_align.png',
          clickFunc: this.align('bottom')
        }
      ],
      toolSymbolItems: [
        {
          label: '输入',
          icon: './icon/LIN.png',
          pathId: 'base/extend/LabelIn/1.0'.toLowerCase()
        },
        {
          label: '输出',
          icon: './icon/LOUT.png',
          pathId: 'base/extend/LabelOut/1.0'.toLowerCase()
        },
        {
          label: '常量',
          icon: './icon/CONST.png',
          pathId: 'base/extend/CCONSTBlock/1.0'.toLowerCase()
        }
      ],
      annotationItems: [
        { color: 'fillColor=#dae8fc;strokeColor=#6c8ebf;', icon: './icon/annotation_DAE8FC.png' },
        { color: 'fillColor=#f8cecc;strokeColor=#b85450;', icon: './icon/annotation_F8CECC.png' },
        { color: 'fillColor=#fff2cc;strokeColor=#d6b656;', icon: './icon/annotation_FFF2CC.png' }
      ]
    }
  },
  computed: {
    deviceDto () {
      return this.$store.getters.device
    },
    debugMode () {
      return this.$store.getters.debugMode
    },
    activeKey () {
      return this.$store.getters.activeKey
    },
    activeDto () {
      return this.$store.getters.activeDto
    },
    showGraphToolBar () {
      return this.deviceDto && !this.debugMode && this.activeDto && this.activeDto instanceof Page
    },
    graph () {
      return R.find(R.propEq(this.activeKey, 'tagKey'))(this.graphs)
    },
    makeOptions () {
      const options = []
      options.push({ label: '生成装置配置', value: 'generateConfigFile' })

      if (this.deviceDto.program && this.deviceDto.program.optBoards) {
        this.deviceDto.program.optBoards.forEach(board => {
          board.cpuCores.forEach(core => {
            if (core.mainCpu || core.mainDsp) {
              const makeALlOpt = {
                label: `make all B${format10(board.slot)}/${board.type}/${core.name}`,
                value: `makeAll ${core.id}`
              }
              options.push(makeALlOpt)
              const makeCleanOpt = {
                label: `make clean B${format10(board.slot)}/${board.type}/${core.name}`,
                value: `makeClean ${core.id}`
              }
              options.push(makeCleanOpt)
            }
          })
        })
      }
      return options
    },
    showScale: {
      get () {
        return `${Math.round(this.scale * 100)}`
      },
      set (val) {
        const result = (val).match(/([0-9]+(\.[0-9]+)?)/)

        if (R.isNotNil(result)) {
          const tmp = parseFloat(result) / 100

          this.graph.view.scale = tmp
          this.scale = tmp
          this.graph.refresh()
          this.graph.center()
        }
      }
    },
    recordStatus () {
      return this.$store.getters.recordStatus
    },
    countDown () {
      return this.$store.getters.countDown
    }
  },
  watch: {
    showGraphToolBar (value) {
      if (value) {
        this.$nextTick(() => {
          this.initDraggableBarItem()
          this.initAnnotationDraggable()
        })
      }
    },
    recordStatus (val) {
      if (!val) {
        if (this.recordTimer) {
          clearTimeout(this.recordTimer)
          this.recordTimer = null
        }
      } else {
        if (this.countDown > 0) {
          this.recordTimer = setTimeout(() => {
            this.$notification.openSuccessNotification(`influxd服务断开，停止记录...共记录 ${this.countDown} 秒`).logger()
            this.$store.commit('setRecordStatus', false)
          }, this.countDown * 1000)
        }
      }
    }
  },
  methods: {
    createDragPreview (width, height) {
      const elt = document.createElement('div')
      elt.style.border = '2px dotted black'
      elt.style.width = `${width}px`
      elt.style.height = `${height}px`
      return elt
    },
    // 初始化菜单栏上的拖拽对象
    initDraggableBarItem () {
      let items = this.$refs.draggableItem

      if (R.isNil(items)) {
        return
      }
      if (!(items instanceof Array)) {
        items = [items]
      }
      items.forEach((item) => {
        const pathId = item.$el.getAttribute('pathId')
        const size = GraphSizeMap[pathId]
        // FIXME
      })
    },
    initAnnotationDraggable () {
      let items = this.$refs.annotationItem

      if (R.isNil(items)) {
        return
      }
      if (!(items instanceof Array)) {
        items = [items]
      }
      items.forEach(item => {
        item.$el.getAttribute('colorStr')
        // fixme
      })
    },
    toolBtnClickHandler (item) {
      if (item.clickFunc) {
        item.clickFunc()
      }
    },
    newDevice () {
      newDeviceAction()
    },
    openDevice () {
      openDeviceAction()
    },
    saveAll () {
      save()
    },
    openSymbolMaker () {
      openSymbolMaker()
    },
    updateSymbolArchive () {
      updateSymbolArchive()
    },
    platformReleaseMng () {
      this.$vbus.$emit('OPEN_PLATFORM_RELEASE_DIALOG')
    },
    runScript () {
      const scriptArr = this.scriptStr.split(' ')
      const scriptName = scriptArr[0]
      switch (scriptName) {
        case 'generateConfigFile':
          generateConfigFile()
          break
        case 'makeAll':
          // TODO
          break
        case 'makeClean':
          // TODO
          break
      }
    },
    enterDebugMode () {
      enterDebugMode()
    },
    quitDebugMode () {
      quitDebugMode()
    },
    reset () {
      this.$vbus.$emit('RELOAD_WORK_AREA', [this.activeKey])
    },
    undo () {
      this.$vbus.$emit('UNDO')
    },
    redo () {
      this.$vbus.$emit('REDO')
    },
    setScale (val) {
      this.scale = val
    },
    resetScale () {
      this.$vbus.$emit('RESET_SCALE')
    },
    align (direction) {
      return () => {
        this.$vbus.$emit('GRAPH_ALIGN', direction)
      }
    },
    openSignalWatch () {
      this.$vbus.$emit('OPEN_WATCH_DIALOG')
    },
    showLineChart () {
      // localStorage.setItem('DEVICE_NAME', this.deviceDto.name) FIXME
      openLineChart()
    },
    showRecordDialog () {
      this.$vbus.$emit('OPEN_DEBUG_RECORD_DIALOG')
    },
    stopRecord () {
      this.$notification.openSuccessNotification('influxd服务断开，停止记录...').logger()
      this.$store.commit('setRecordStatus', false)
    }
  },
  mounted () {
    this.$vbus.$on('SYNC_GRAPH_SCALE', this.setScale)
  },
  destroyed () {
    this.$vbus.$off('SYNC_GRAPH_SCALE', this.setScale)
  }
}
</script>

<style lang="scss">
.toolbarContainer {
  height: 36px;
  border-bottom: 1px solid lightgray;
  position: relative;
  z-index: 2;

  .el-divider {
    top: -2px;
  }

  .commonToolbar {
    padding-left: 10px;
    height: 36px;
    line-height: 36px;
    display: inline-block;

    .debug_btn.is-disabled {
      color: #C0C4CC;
    }

    .debug_btn {
      color: red;
    }

    .chart_btn {
    }

    .record_btn_on {
      background: red;
      color: white;
    }
  }

  .runToolbar {
    height: 36px;
    line-height: 36px;
    display: inline-block;

    .run_btn {
      color: red;
    }
  }

  .editToolBar {
    height: 36px;
    line-height: 36px;
    display: inline-block;

    .edit_btn {
      padding: 3px;
      border: 0;
      height: 24px;
      font-size: 17px;
      margin-left: 5px;
    }

    .edit_btn:hover {
      background: #409eff;
      opacity: 0.5;
      color: white;
    }

    .el-input {
      margin: 0 5px;
      width: 50px;

      input {
        height: 23px;
        line-height: 23px;
        padding: 0 6px;
      }
    }
  }

  .m_tool_btn {
    padding: 3px;
    border: 0;
    height: 24px;
    font-size: 18px;

    img {
      position: relative;
      top: -2px;
      height: 16px;
      width: auto;
    }
  }

  .m_tool_btn:hover {
    background: #409eff;
    opacity: 0.5;
    color: white;
  }

}
</style>
