<template>
  <div id="window_catalog" ref="catalogContainer">
    <div class="windowCatalogToolBar">
      <el-input
        prefix-icon="el-icon-search"
        clearable
        v-model="varTreeSearch"
        @change="(value)=>inputHandler(value)"
        size="small"
        placeholder="输入关键字进行过滤"/>
    </div>
    <div class="windowCatalogContainer">
      <el-tree
        ref="tree"
        :indent=12
        :data="catalogTreeData"
        :filter-node-method="filterNode"
        :props="defaultProps"
        node-key="id"
        :expand-on-click-node=false
        highlight-current
        :default-expanded-keys="defaultExpandedKeys"
        :draggable="draggable"
        :allow-drag="allowDrag"
        :allow-drop="allowDrop"
        @node-drop="handleDrop"
        @node-click="clickHandler"
        @node-contextmenu="rightClickHandler">
        <template v-slot="{ node, data }">
          <div style="display: inline-block; width: 100%; height: 100%" @dblclick="dblClkHandler(node, data)">
            <span>
              <img v-if="data instanceof Page && !data.isSnippet" :alt="`${data.level}`"
                   :src="levelIcon(data.level)" style="width: 26px; margin: 0 3px 3px 0"/>
              <i :class="iconClass(data)"/>
              {{ node.label }}
              <span v-if="data instanceof Page && data.status === enableStatus.OFF"
                    style="margin-left:3px; background-color: gray; color: white">[退出]</span>
            </span>
          </div>
        </template>
      </el-tree>
    </div>
  </div>
</template>

<script>
import * as R from 'ramda'
import * as _ from 'lodash'
import { generateVarTree, openProgramConfig } from '@/renderer/pages/nextStudio/action'
import { getContextmenuItems } from './contextMenu'
import {
  Device,
  DeviceConfig,
  HardwareConfig,
  HMIConfig,
  IED,
  Page,
  PGSnippet,
  ProcessItem,
  ProgramBoard,
  ProgramConfig,
  ProgramSnippet,
  SettingGroupConfig,
  SignalGroupConfig,
  WaveGroupConfig
} from '@/model/dto'
import { getDtoClassName, getIconClass } from '@/renderer/common/util'
import { format10 } from '@/util'
import { EnableStatusEnum, TaskLevelEnum, YesNoEnum } from '@/model/enum'
import { openWindowLoading } from '@/renderer/common/action'

export default {
  name: 'windowCatalog',
  computed: {
    Page () {
      return Page
    },
    deviceDto () {
      return this.$store.getters.device
    },
    debugMode () {
      // 调试模式
      return this.$store.getters.debugMode
    },
    debugBoardType () {
      return this.$store.getters.debugBoardType
    },
    enableStatus () {
      return EnableStatusEnum
    },
    tagDeltaExist () {
      return this.$store.getters.tagDeltaExist
    }
  },
  watch: {
    deviceDto (newVal) {
      // 树data从无到有代表第一次打开工程，需要打开默认节点
      if (R.isEmpty(this.catalogTreeData) && newVal) {
        this.init()
      }
      this.initTreeData(newVal)
    },
    debugMode (newVal) {
      if (this.deviceDto) {
        if (newVal) {
          // FIXME
          const boardTypeList = Object.keys(this.debugBoardType)
            .filter(key => !!key)
            .map(key => `${key}[${this.debugBoardType[key]}]`)

          const clone = _.cloneDeep(this.deviceDto)
          const arr = []
          clone.program.optBoards.forEach((board) => {
            const str = `B${format10(board.slot)}[${board.type}]`
            if (boardTypeList.includes(str)) {
              arr.push(board)
            }
          })
          clone.program.children = arr
          this.initTreeData(clone)
        } else {
          this.initTreeData(this.deviceDto)
        }
      }
    }
  },
  data () {
    return {
      draggable: false,
      selectedDto: null,
      varTreeSearch: '',
      catalogTreeData: [],
      defaultProps: {
        children: 'children',
        label: 'title'
      },
      defaultSelectedKey: 'MainBoardConfig',
      defaultExpandedKeys: [
        'HardwareConfig',
        'ProgramConfig',
        'DeviceConfig',
        'SignalGroupConfig',
        'SettingGroupConfig',
        'HMIConfig'
      ],
      copyValue: null,
      i18n: this.$i18n
    }
  },
  methods: {
    inputHandler (value) {
      this.$refs.tree.filter(value)
    },
    filterNode (value, data) {
      if (!value) {
        return true
      }
      try {
        const regex = new RegExp(value, 'gi')
        return regex.test(data.title)
      } catch (e) {
      }
    },
    iconClass (data) {
      return getIconClass(data)
    },
    levelIcon (level) {
      switch (level) {
        case TaskLevelEnum.Level1:
          return require('@/renderer/pages/nextStudio/assets/levelIcon/level_1.png')
        case TaskLevelEnum.Level2:
          return require('@/renderer/pages/nextStudio/assets/levelIcon/level_2.png')
        case TaskLevelEnum.Level3:
          return require('@/renderer/pages/nextStudio/assets/levelIcon/level_3.png')
        case TaskLevelEnum.Level4:
          return require('@/renderer/pages/nextStudio/assets/levelIcon/level_4.png')
        default:
          return require('@/renderer/pages/nextStudio/assets/levelIcon/level_0.png')
      }
    },
    initTreeData (deviceDto) {
      if (!deviceDto) {
        this.catalogTreeData = []
        return
      }

      this.catalogTreeData = [deviceDto]
    },
    init () {
      this.$nextTick(() => {
        this.$refs.tree.setCurrentKey(this.defaultSelectedKey)
        const defaultNode = this.$refs.tree.getNode(this.defaultSelectedKey)
        if (R.isNil(defaultNode)) {
          return
        }
        this.selectedDto = defaultNode.data
        this.$store.commit('addNodeToContainer', this.selectedDto)
      })
    },
    allowDrag (node) {
      // 调试模式不允许拖拽调整
      if (this.debugMode) {
        return false
      }
      if (this.tagDeltaExist) {
        this.$notification.openWarningNotification('存在未保存的修改记录，请先保存后再拖拽')
        return false
      }
      // 存在修改记录，不允许拖拽
      return !!node.data && (node.data instanceof Page || node.data instanceof ProcessItem || node.data instanceof IED)
    },
    allowDrop (dragNode, dropNode, type) {
      const orgParentDto = dragNode.data.parent
      const newParentDTO = type === 'inner' ? dropNode.data : dropNode.data.parent
      const newChildren = newParentDTO.children.map(dto => dto.name)

      const orgParentClassName = getDtoClassName(orgParentDto)
      const newParentClassName = getDtoClassName(newParentDTO)

      // FIXME
      return (orgParentClassName && orgParentClassName === newParentClassName) && !R.includes(dragNode.data.name)(newChildren)
    },
    handleDrop (dragNode, dropNode, type) {
      // todo
    },
    clickHandler (data) {
      this.selectedDto = data
    },
    rightClickHandler (event, data) {
      this.selectedDto = data
      this.$refs.tree.setCurrentKey(data.id)
      this.$menu.open(data, getContextmenuItems(data, this.debugMode), this.$i18n)
    },
    dblClkHandler (node, data) {
      this.selectedDto = data
      if (data.children && data.children.length > 0) {
        if (node.expanded) {
          node.collapse()
        } else {
          node.expand()
        }
      }
      this.addNodeToContainer(data)
    },
    addNodeToContainer (dto) {
      if (!dto || dto.isFolder === YesNoEnum.YES) {
        return
      }
      // FIXME const regex = /^(SubStationProject|Device|ProgramConfig|RackBoard|CPU|Core|ProcessItem|LcdConfig|LcdMainView)$/
      if (dto instanceof Device || dto instanceof HardwareConfig || dto instanceof ProgramConfig ||
        dto instanceof ProgramSnippet || dto instanceof PGSnippet || dto instanceof ProgramBoard ||
        dto instanceof DeviceConfig || dto instanceof SignalGroupConfig || dto instanceof SettingGroupConfig ||
        dto instanceof HMIConfig || dto instanceof WaveGroupConfig) {
        return
      }
      console.log(dto)
      this.$store.commit('addNodeToContainer', dto)
    },
    async copyPage (page) {
      this.copyValue = page
    },
    async instancePasteValue () {
      // TODO
    },
    pastePage () {
      if (!this.copyValue) {
        this.$notification.openWarningNotification('请先复制页面')
        return
      }
      // 开启弹窗
      const loading = openWindowLoading('粘贴中...')
      // 复制处理函数
      this.instancePasteValue()
        .then(() => {
          generateVarTree()
          this.$notification.openSuccessNotification(`页面"${this.copyValue.name}"粘贴成功`).logger()
        })
        .catch((e) => {
          this.$notification.openErrorNotification(`页面"${this.copyValue.name}"粘贴失败。${e}`).logger()
        })
        .finally(() => {
          loading.close()
        })
    },
    refreshBoardDesc () {
      // FIXME
      openProgramConfig()
        .then((rack) => {
          this.deviceDto.program.optBoards.forEach((board) => {
            const dbBoard = R.find(R.propEq(board.slot, 'slot'))(rack.boards)
            board.desc = dbBoard.desc
            board.title = board.getTitle()
          })
        })
    },
    reloadRackBoard () {
      const loading = openWindowLoading('刷新目录中...')
      openProgramConfig()
        .then((rack) => {
          this.deviceDto.program.optBoards = rack.boards
          this.deviceDto.program.optBoards.forEach((board) => {
            board.parentNode = this.deviceDto.program
          })
          // FIXME
          this.deviceDto.program.children = this.deviceDto.program.optBoards
          this.deviceDto.children = this.deviceDto.getChildren() // FIXME
          this.initTreeData(this.deviceDto)
          generateVarTree()
        })
        .finally(() => {
          loading.close()
        })
    }
  },
  mounted () {
    this.initTreeData(this.deviceDto)
    this.$vbus.$on('COPY_PAGE', this.copyPage)
    this.$vbus.$on('PASTE_PAGE', this.pastePage)
    this.$vbus.$on('board-desc-changed', this.refreshBoardDesc)
    this.$vbus.$on('board-type-changed', this.reloadRackBoard)
  },
  destroyed () {
    this.$vbus.$off('COPY_PAGE', this.copyPage)
    this.$vbus.$off('PASTE_PAGE', this.pastePage)
    this.$vbus.$off('board-desc-changed', this.refreshBoardDesc)
    this.$vbus.$off('board-type-changed', this.reloadRackBoard)
  }
}
</script>

<style lang="scss">
#window_catalog {
  .el-tree {
    font-weight: 600;
    height: 100%;
  }
}
</style>

<style lang="scss" scoped>
#window_catalog {
  height: 100%;
  width: 100%;
  overflow: hidden;
  position: relative;
  user-select: none;

  $toolBarHeight: 35px;

  .windowCatalogToolBar {
    height: $toolBarHeight;
    border-bottom: 1px solid #efefef;
  }

  .windowCatalogContainer {
    overflow: auto;
    height: calc(100% - #{$toolBarHeight});
  }
}
</style>
