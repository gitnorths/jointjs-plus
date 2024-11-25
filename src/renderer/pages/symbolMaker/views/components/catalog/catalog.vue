<template>
  <div id="window_catalog" ref="catalogContainer">
    <div class="windowCatalogToolBar">
      <el-input placeholder="输入关键字进行过滤" v-model="filterText" size="small"/>
    </div>
    <div class="windowCatalogContainer">
      <el-tree
        ref="tree"
        :indent=12
        :data="repoCatalog"
        :props="defaultProps"
        node-key="pathId"
        :expand-on-click-node=false
        highlight-current
        :draggable="draggable"
        :allow-drag="allowDrag"
        :allow-drop="allowDrop"
        @node-drop="handleDrop"
        @node-click="clickHandler"
        @node-contextmenu="rightClickHandler"
        :filter-node-method="filterNode">
        <template v-slot="{ node, data }">
          <div @dblclick="dblClkHandler(node, data)" style="width: 100%">
            <span :class="iconClass(data)" style="margin-right: 5px"/>
            <span>
              {{ data.title }}
            </span>
            <span v-if="data.desc" style="color: gray">
              ({{ data.desc }})
            </span>
          </div>
        </template>
      </el-tree>
    </div>
  </div>
</template>

<script>
import * as R from 'ramda'
import { mapGetters } from 'vuex'
import { catalogSymbolArchiveContext, catalogSymbolBlockContext, catalogSymbolLibContext } from './catalogContext'
import { getDtoClassName, getIconClass } from '@/renderer/common/util'
import { SymbolArchive, SymbolBlock, SymbolBlockVersion, SymbolLib } from '@/model/dto'

export default {
  name: 'windowCatalog',
  data () {
    return {
      draggable: false,
      filterText: '',
      repoCatalog: [],
      defaultProps: {
        children: 'children',
        label: 'title'
      }
    }
  },
  computed: {
    ...mapGetters({
      archiveList: 'archiveList'
    })
  },
  watch: {
    archiveList () {
      this.init()
    },
    filterText (val) {
      this.$refs.tree.filter(val)
    }
  },
  methods: {
    iconClass (data) {
      return getIconClass(data)
    },
    // 加载符号树数据
    init () {
      this.repoCatalog = [...this.archiveList]
      if (R.isEmpty(this.archiveList)) {
        this.$store.commit('setSymbolCatalogViewIsVisible', false)
        this.$store.commit('setSymbolOutputViewIsVisible', false)
      }
    },
    // 筛选符号
    filterNode (value, data) {
      if (!value) return true
      return data.name.indexOf(value) !== -1
    },
    clickHandler (data) {
      this.$refs.tree.setCurrentKey(data.pathId)
      this.$store.commit('setCurrentTreeNodeData', data)
    },
    rightClickHandler (event, data, node) {
      this.clickHandler(data)

      if (data instanceof SymbolBlockVersion) {
        // TODO
      } else if (data instanceof SymbolBlock) {
        this.$menu.open({ node, data }, catalogSymbolBlockContext, this.$i18n)
      } else if (data instanceof SymbolLib) {
        this.$menu.open({ node, data }, catalogSymbolLibContext, this.$i18n)
      } else if (data instanceof SymbolArchive) {
        this.$menu.open({ node, data }, catalogSymbolArchiveContext, this.$i18n)
      }
    },
    dblClkHandler (node, data) {
      this.clickHandler(data)
      if (node.expanded) {
        node.collapse()
      } else {
        node.expand()
      }
      this.$store.commit('addNodeToWorkTagsContainer', data)
    },
    // 判断节点是否允许拖拽
    allowDrag (node) {
      return node.data && (node.data instanceof SymbolBlockVersion || node.data instanceof SymbolBlock)
    },
    // 判断节点是否可以放入
    allowDrop (dragNode, dropNode, type) {
      const orgParentDto = dragNode.data.parent
      const newParentDTO = type === 'inner' ? dropNode.data : dropNode.data.parent
      const newChildren = newParentDTO.children.map(dto => dto.name)

      const orgParentClassName = getDtoClassName(orgParentDto)
      const newParentClassName = getDtoClassName(newParentDTO)

      // FIXME 考虑跨数据库拖拽的情况
      // parent要是同类型，并且children内要唯一
      return (orgParentClassName && orgParentClassName === newParentClassName) && !R.includes(dragNode.data.name)(newChildren)
    },
    handleDrop (dragNode, dropNode, type) {
      // TODO
    }
  },
  mounted () {
    this.init()
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

  $toolBarHeight: 36px;

  .toolBar {
    line-height: 30px;
    margin-left: 10px;
    font-weight: bold;

    .pullBtn {
      color: #40a9ff;
    }

    .commitBtn {
      color: #67c23a;
    }

    .pushBtn {
      color: #67c23a;
    }

    .toolBtn {
      margin-left: 10px;
      cursor: pointer;
      font-weight: bold;
    }
  }

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
