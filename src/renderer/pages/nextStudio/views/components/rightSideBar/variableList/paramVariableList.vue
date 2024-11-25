<template>
  <div id="paramVariableListContainer">
    <img :src="flushIcon" alt="flush" class="variableListFlushIcon" ref="variableListFlushIcon" @click="refresh">
    <el-tabs type="border-card" v-model="activeTab">
      <el-tab-pane v-loading="loading" label="参数" name="pg" style="overflow: hidden">
        <el-input
          prefix-icon="el-icon-search"
          clearable
          v-model="varTreeSearch"
          @change="(value)=>inputHandler(value)"
          size="small"
          placeholder="输入关键字进行过滤"/>
        <div class="treeContainer">
          <el-tree
            node-key="id"
            :indent=8
            :props="{label: 'title'}"
            :data="varTreeData"
            :filter-node-method="filterNode"
            :expand-on-click-node=false
            :default-expanded-keys="defaultExpandedKeys"
            @node-expand="nodeExpandHandler"
            @node-collapse="nodeCollapseHandler"
            ref="tree">
            <template v-slot="{ node, data }">
              <div :class="className(data)" :id="data.id" style="display: inline-block; width: 100%; height: 100%"
                   @dblclick="dblClkHandler(node, data)">
                <span><i :class="iconClass(data)"/> {{ node.label }}</span>
              </div>
            </template>
          </el-tree>
        </div>
      </el-tab-pane>
      <el-tab-pane v-loading="loading" label="自定义参数" name="customParam" style="overflow: hidden">
        <el-input
          prefix-icon="el-icon-search"
          clearable
          v-model="varTreeSearch"
          @change="(value)=>inputHandler(value)"
          size="small"
          placeholder="输入关键字进行过滤"/>
        <div class="treeContainer">
          <el-tree
            node-key="id"
            :indent=8
            :props="{label: 'title'}"
            :data="customTreeData"
            :filter-node-method="filterNode"
            :expand-on-click-node=false
            :default-expanded-keys="defaultExpandedKeys"
            @node-expand="nodeExpandHandler"
            @node-collapse="nodeCollapseHandler"
            ref="customTree">
            <template v-slot="{ node, data }">
              <div :class="className(data)" :id="data.id" style="display: inline-block; width: 100%; height: 100%"
                   @dblclick="dblClkHandler(node, data)">
                <span><i :class="iconClass(data)"/> {{ node.label }}</span>
              </div>
            </template>
          </el-tree>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import * as R from 'ramda'
import { createSortable } from './sortableUtil'
import { generateVarTree } from '@/renderer/pages/nextStudio/action'
import { getDtoClassName, getIconClass } from '@/renderer/common/util'
import { VarTreeParam } from '@/model/dto'

export default {
  name: 'paramVariableList',
  props: {},
  computed: {
    loading () {
      return this.$store.getters.varTreeLoading
    },
    device () {
      return this.$store.getters.device
    },
    defaultExpandedKeys () {
      return this.device ? [this.device.series] : []
    }
  },
  data () {
    return {
      flushIcon: './icon/flush.png',
      activeTab: 'pg',
      varTreeSearch: '',
      varTreeData: [],
      customTreeData: [],
      expandedKeys: [],
      sortableMap: {}
    }
  },
  methods: {
    refresh (e) {
      const dom = e.currentTarget

      if (R.isNil(dom)) {
        return
      }
      dom.classList.add('active')
      setTimeout(() => {
        dom.classList.remove('active')
      }, 1000)
      generateVarTree()
    },
    className (data) {
      return getDtoClassName(data)
    },
    iconClass (data) {
      return getIconClass(data)
    },
    init () {
      if (this.sortableMap) {
        Object.values(this.sortableMap).forEach((sortable) => {
          sortable.destroy()
        })
        this.sortableMap = {}
      }
      this.varTreeData = [this.$store.getters.paramVarTreeCfg]
      this.customTreeData = [this.$store.getters.customVarTreeCfg]
      this.$nextTick(() => {
        // FIXME 宏参数？
        // const cfgEle = this.$el.querySelector('.VarTreeSymbol')
        // const el = cfgEle.parentNode.parentNode.querySelector('div[role="group"]')
        // this.sortableMap[this.varTreeData[0].id] = createSortable(el, this.varTreeData[0], 'VarTreeParam', this)

        if (R.isNotEmpty(this.expandedKeys)) {
          for (const id of this.expandedKeys) {
            const node = this.activeTab === 'pg' ? this.$refs.tree.getNode(id) : this.$refs.customTree.getNode(id)
            if (node) {
              node.expand()
            }
          }
        }
        if (this.activeTab === 'pg') {
          this.$refs.tree.filter(this.varTreeSearch)
        } else {
          this.$refs.customTree.filter(this.varTreeSearch)
        }
        this.bindSortable()
      })
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
    bindSortable () {
      this.$nextTick(() => {
        const eles = this.activeTab === 'pg' ? this.$el.querySelectorAll('.VarTreeSymbol') : this.$el.querySelectorAll('.VarTreePage')
        if (R.isNotEmpty(eles)) {
          eles.forEach(symbolEle => {
            const id = symbolEle.getAttribute('id')
            const existSortable = this.sortableMap[id]
            if (existSortable) {
              existSortable.destroy()
            }
            const el = symbolEle.parentNode.parentNode.querySelector('div[role="group"]')
            if (el) {
              const node = this.activeTab === 'pg' ? this.$refs.tree.getNode(id) : this.$refs.customTree.getNode(id)
              this.sortableMap[id] = createSortable(el, node.data, 'VarTreeParam', this)
            }
          })
        }
      })
    },
    inputHandler (value) {
      if (this.activeTab === 'pg') {
        this.$refs.tree.filter(value)
      } else {
        this.$refs.customTree.filter(value)
      }
      this.bindSortable()
    },
    nodeExpandHandler (data) {
      this.bindSortable()
      this.expandedKeys.push(data.id)
    },
    nodeCollapseHandler (data) {
      const index = this.expandedKeys.indexOf(data.id)
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
      if (data instanceof VarTreeParam) {
        this.$vbus.$emit('VAR_TREE_PARAM_DBL_CLICKED', data)
      }
    }
  },
  mounted () {
    this.$vbus.$on('REFRESH_VAR_TREE', this.init)
  },
  beforeDestroy () {
    if (this.sortableMap) {
      Object.values(this.sortableMap).forEach((sortable) => {
        sortable.destroy()
      })
      this.sortableMap = {}
    }
  },
  destroyed () {
    this.$vbus.$off('REFRESH_VAR_TREE', this.init)
  }
}
</script>

<style lang="scss">
#paramVariableListContainer {
  width: 100%;
  height: 100%;
  user-select: none;
  position: relative;

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
