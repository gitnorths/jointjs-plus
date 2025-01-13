<template>
  <div id="archiveProtoListContainer">
    <img :src="flushIcon" alt="flush" class="variableListFlushIcon" ref="variableListFlushIcon" @click="refresh">
    <el-tabs type="border-card" v-model="activeTab">
      <el-tab-pane v-loading="loading" label="功能块库" name="archiveProto">
        <el-input
          prefix-icon="el-icon-search"
          clearable v-model="archiveTreeSearch"
          @change="(value)=>inputHandler(value)"
          size="small"
          placeholder="输入关键字进行过滤"/>
        <div class="treeContainer">
          <el-tree
            node-key="pathId"
            :indent=8
            :props="{label: 'title'}"
            :data="archiveProtoTreeData"
            :filter-node-method="filterNode"
            :expand-on-click-node=false
            @node-expand="nodeExpandHandler"
            @node-collapse="nodeCollapseHandler"
            ref="tree">
            <template v-slot="{ node, data }">
              <el-popover
                style="width: 100%; height: 100%"
                placement="left"
                trigger="hover"
                :disabled="!(data instanceof ProtoSymbolBlock)"
                :title="data.name"
                :open-delay="500"
                :close-delay="0">
                <tip-graph :symbol="data"/>
                <template v-slot:reference>
                  <div :class="className(data)" :id="data.pathId"
                       style="display: inline-block; width: 100%; height: 100%"
                       @dblclick="dblClkHandler(node, data)">
                    <div class="title" :style="{width: data.desc ? '50%' : '100%'}">
                      <i :class="iconClass(data)"/> {{ node.label }}
                    </div>
                    <div v-if="data.desc" class="title"
                         style="width:calc(50% - 15px); text-align: right; margin-right: 15px">
                      {{ data.desc }}
                    </div>
                  </div>
                </template>
              </el-popover>
            </template>
          </el-tree>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import * as R from 'ramda'
import { getDeviceSymbol } from '@/renderer/pages/nextStudio/action'
import TipGraph from './tipGraph.vue'
import { ProtoSymbolBlock } from '@/model/dto'
import { getDtoClassName, getIconClass } from '@/renderer/common/util'

export default {
  name: 'symbolProtoList',
  components: { TipGraph },
  props: {},
  computed: {
    ProtoSymbolBlock () {
      return ProtoSymbolBlock
    },
    loading () {
      return this.$store.getters.symbolProtoLoading
    },
    archiveProtoList () {
      return this.$store.getters.archiveProtoList
    },
    symbolProtoMap () {
      return this.$store.getters.symbolProtoMap
    }
  },
  data () {
    return {
      flushIcon: './icon/flush.png',
      activeTab: 'archiveProto',
      archiveTreeSearch: '',
      archiveProtoTreeData: [],
      expandedKeys: []
    }
  },
  methods: {
    refresh (e) {
      const dom = e.currentTarget

      if (R.isNil(dom)) {
        return
      }
      this.$notification.openInfoNotification('刷新功能块包')
      dom.classList.add('active')
      setTimeout(() => {
        dom.classList.remove('active')
      }, 1000)
      getDeviceSymbol()
    },
    className (data) {
      return getDtoClassName(data)
    },
    iconClass (data) {
      return getIconClass(data)
    },
    init () {
      this.archiveProtoTreeData = this.archiveProtoList
      this.$nextTick(() => {
        if (R.isNotEmpty(this.expandedKeys)) {
          for (const id of this.expandedKeys) {
            const node = this.$refs.tree.getNode(id)
            if (node) {
              node.expand()
            }
          }
        }
        this.$refs.tree.filter(this.archiveTreeSearch)
        this.makeSymbolDraggable()
      })
    },
    filterNode (value, data) {
      if (!value) {
        return true
      }
      try {
        const regex = new RegExp(value, 'gi')
        return regex.test(data.title) || regex.test(data.desc)
      } catch (e) {
      }
    },
    inputHandler (value) {
      this.$refs.tree.filter(value)
      this.makeSymbolDraggable()
    },
    nodeExpandHandler (data) {
      this.makeSymbolDraggable()
      this.expandedKeys.push(data.pathId)
    },
    nodeCollapseHandler (data) {
      const index = this.expandedKeys.indexOf(data.pathId)
      if (index >= 0) {
        this.expandedKeys.splice(index, 1)
      }
    },
    dblClkHandler (node, data) {
      if (data.children && data.children.length > 0) {
        if (node.expanded) {
          node.collapse()
          this.nodeCollapseHandler(data)
        } else {
          node.expand()
          this.nodeExpandHandler(data)
        }
      }
    },
    makeSymbolDraggable () {
      const makeDraggable = (item) => {
        const pathId = item.getAttribute('id')
        if (R.isNil(pathId)) {
          return
        }
        const symbol = this.symbolProtoMap[pathId]
        if (R.isNil(symbol)) {
          return
        }

        item.setAttribute('makeDraggable', true)
      }
      this.$nextTick(() => {
        const symbolEles = this.$el.querySelectorAll('.VisualFuncBlock')
        if (R.isNotNil(symbolEles) && symbolEles.length > 0) {
          symbolEles.forEach((item) => {
            if (!item.getAttribute('makeDraggable')) {
              makeDraggable(item)
            }
          })
        }
      })
    }
  },
  mounted () {
    this.$vbus.$on('REFRESH_ARCHIVE_PROTO', this.init)
  },
  destroyed () {
    this.$vbus.$off('REFRESH_ARCHIVE_PROTO', this.init)
  }
}
</script>

<style lang="scss">
#archiveProtoListContainer {
  width: 100%;
  height: 100%;
  user-select: none;
  position: relative;

  .title {
    display: inline-block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .el-tabs__content {
    .treeContainer {
      height: calc(100% - 35px);
      overflow: auto;
    }

    .el-input__inner {
      border-radius: 0;
      height: 34px;
      line-height: 34px;
    }
  }
}
</style>
