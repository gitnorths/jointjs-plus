<template>
  <div id="pkcCompare" style="height: 100%; width: 100%">
    <div v-show="!showPropertyDiff" style="height: 100%; padding: 0;border: 1px solid #eee;">
      <vxe-toolbar>
        <template v-slot:buttons>
          <el-popover placement="bottom-end" title="使用帮助" width="300" trigger="hover">
            <template v-slot:reference>
              <span class="vxe-icon-question-circle" style="margin-left: 10px; font-size: 22px"></span>
            </template>
            <ul>
              <li>
                <span class="status_added"><i class="fa fa-cube"></i> 蓝色：条目有增删</span>
              </li>
              <li>
                <span class="status_changed"><i class="fa fa-cube"></i> 红色：属性有变化</span>
              </li>
              <li>
                <span class="status_moved"><i class="fa fa-cube"></i> 灰色：顺序有移动</span>
              </li>
              <li>
                <span><i class="fa fa-hand-pointer-o"></i> 双击：查看功能块的具体差异</span>
              </li>
            </ul>
          </el-popover>
          <el-divider direction="vertical"></el-divider>
          <vxe-button @click="hideSame">
            隐藏相同
            <el-switch v-model="hideSameValue" :width=35></el-switch>
          </vxe-button>
          <vxe-button status="primary" @click="openPropertyDiff" :disabled="!selectMatched">
            对比选中
          </vxe-button>
          <vxe-button status="success" @click="bindPathId" :disabled="!bindable">
            绑定选中
          </vxe-button>
        </template>
        <template v-slot:tools>
          <vxe-button status="primary" @click="previous">
            <i class="el-icon-arrow-left"></i> 上一步
          </vxe-button>
          <vxe-button status="primary" @click="next" style="margin-right: 12px">
            下一步 <i class="el-icon-arrow-right"></i>
          </vxe-button>
        </template>
      </vxe-toolbar>
      <el-row class="compareBreadCrumbs">
        <el-col :span="12" style="padding:0 10px 0 5px">
          <div
            style="background-color: white; width: 100%; height: 24px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            {{ leftPathId }}
          </div>
        </el-col>
        <el-col :span="12" style="padding:0 5px 0 0">
          <div
            style="background-color: white; width: 100%; height: 24px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            {{ rightPathId }}
          </div>
        </el-col>
      </el-row>
      <div class="compareMain">
        <el-row id="packageCompareMain">
          <el-col :span=12 class="colPadding10">
            <el-tree
              highlight-current
              :render-after-expand="false"
              node-key="objectHashId"
              :data="leftTreeData"
              :expand-on-click-node=false
              :filter-node-method="filterNode"
              @node-click="leftClickHandler"
              @node-contextmenu="leftContextHandler"
              @node-expand="leftExpandHandler"
              @node-collapse="leftCollapseHandler"
              ref="leftTree">
              <template v-slot="{ node, data }">
                <div style="width: 100%; height: 100%" @dblclick="dblClkHandler(true)(data, node)">
                  <span v-if="data.iconClass" :class="bindIconClass(data)" style="margin-right: 5px"/>
                  <span
                    v-if="data.ref && data.ref.clazzName !== 'VisualFuncBlock' && (data.index || data.index === 0)"
                    :class="bindStatusClass(data.status)">
                      {{ `[${data.index}] ` }}
                    </span>
                  <span :class="bindStatusClass(data.status)" :id="`left_${data.objectHashId}`">
                      {{ node.label }}
                    </span>
                  <span v-if="data.peerIndex || data.peerIndex === 0"> {{ ` -> [${data.peerIndex}]` }}</span>
                </div>
              </template>
            </el-tree>
          </el-col>
          <el-col :span=12 class="colPadding10">
            <el-tree
              highlight-current
              :render-after-expand="false"
              node-key="objectHashId"
              :data="rightTreeData"
              :expand-on-click-node=false
              :filter-node-method="filterNode"
              @node-click="rightClickHandler"
              @node-contextmenu="rightContextHandler"
              @node-expand="rightExpandHandler"
              @node-collapse="rightCollapseHandler"
              ref="rightTree">
              <template v-slot="{ node, data }">
                <div style="width: 100%; height: 100%" :id="`right_${data.objectHashId}`"
                     @dblclick="dblClkHandler()(data, node)">
                  <span v-if="data.iconClass" :class="bindIconClass(data)" style="margin-right: 5px"/>
                  <span
                    v-if="data.ref && data.ref.clazzName !== 'VisualFuncBlock' && (data.index || data.index === 0)"
                    :class="bindStatusClass(data.status)">
                      {{ `[${data.index}] ` }}
                    </span>
                  <span :class="bindStatusClass(data.status)">{{ node.label }}</span>
                  <span v-if="data.peerIndex || data.peerIndex === 0"> {{ ` -> [${data.peerIndex}]` }}</span>
                </div>
              </template>
            </el-tree>
          </el-col>
        </el-row>
      </div>
    </div>
    <step1-property-diff v-if="showPropertyDiff" @hide="showPropertyDiff = false" :prop-compare="propCompare"/>
  </div>
</template>

<script>
import { generateTreeData } from '../util/symbolUpdateUtil'
import { deltaStatus } from '../util'
import { jsPlumb } from 'jsplumb'
import Step1PropertyDiff from './step1VfbPropertyDiff.vue'

export default {
  name: 'step1PackageCompare',
  components: { Step1PropertyDiff },
  computed: {
    compareResult () {
      return this.$store.getters.pkgComparedResult
    },
    selectMatched () {
      return this.leftSelect && this.rightSelect &&
        !this.leftSelect.disabled && !this.rightSelect.disabled &&
        this.leftSelect.ref && this.rightSelect.ref &&
        this.leftSelect.ref.clazzName === this.rightSelect.ref.clazzName
    },
    bindable () {
      // 绑定对像必须是同一类型的，并且必须有值
      // 被绑定的源对象必须是被标记为删除的（删除或者重命名导致）
      if (!(this.selectMatched &&
        this.leftSelect.status === deltaStatus.Deleted &&
        this.leftSelect.objectHashId !== this.rightSelect.objectHashId)) {
        return false
      }
      const clazzName = this.leftSelect.ref.clazzName
      const leftPathId = this.leftSelect.objectHashId
      const rightPathId = this.rightSelect.objectHashId
      if (/VisualFuncBlock/.test(clazzName)) {
        // 源对象和目标对象必须是同一功能块包下（不可以跨包绑定）
        const leftPkgId = leftPathId.split('/').slice(0, 2).join('/')
        const rightPkgId = rightPathId.split('/').slice(0, 2).join('/')
        return leftPkgId === rightPkgId
      } else if (/VFBInput|VFBOutput|VFBParam/.test(clazzName)) {
        // 源对象为输入、输出、参数时，要求与目标对象存在绑定关系（默认关联或者绑定过）
        const leftVfbId = leftPathId.split('/').slice(0, 4).join('/')
        const rightVfbId = rightPathId.split('/').slice(0, 4).join('/')
        if (leftVfbId === rightVfbId) {
          return true
        } else {
          return this.pathIdBindRecords.vfbMap[leftVfbId] === rightVfbId
        }
      }
      return true
    },
    leftPathId () {
      return this.calcSelectTitle(this.leftSelect)
    },
    rightPathId () {
      return this.calcSelectTitle(this.rightSelect)
    },
    pathIdBindRecords () {
      return this.$store.getters.pathIdBindRecords
    }
  },
  data () {
    return {
      hideSameValue: false,
      showPropertyDiff: false,
      leftSelect: '',
      rightSelect: '',
      leftTreeData: null,
      rightTreeData: null,
      propCompare: null,
      jsPlumbInstance: null
    }
  },
  methods: {
    initNavData () {
      const { leftTreeData, rightTreeData } = generateTreeData(this.compareResult)
      this.leftTreeData = leftTreeData
      this.rightTreeData = rightTreeData
    },
    calcSelectTitle (select) {
      if (select && select.ref) {
        switch (select.ref.clazzName) {
          case 'VisualFuncBlock':
            return '【功能块】' + select.objectHashId
          case 'VFBPackage':
            return '【包】' + select.objectHashId
          case 'VFBGroup':
            return '【组】' + select.objectHashId
          case 'VFBInput':
            return '【输入】' + select.objectHashId
          case 'VFBOutput':
            return '【输出】' + select.objectHashId
          case 'VFBParam':
            return '【参数】' + select.objectHashId
          default :
            return `【${select.label}】` + select.objectHashId
        }
      } else {
        return ''
      }
    },
    clearStatus () {
      this.hideSameValue = false
      this.leftSelect = ''
      this.rightSelect = ''
      this.leftTreeData = null
      this.rightTreeData = null
      this.propCompare = null
      this.jsPlumbInstance = null
    },
    bindStatusClass (status, moved) {
      let classStr = ''
      if (status === deltaStatus.Added) {
        classStr += 'status_added '
      }
      if (status === deltaStatus.Changed) {
        classStr += 'status_changed '
      }
      if (status === deltaStatus.Deleted) {
        classStr += 'status_deleted '
      }
      if (moved) {
        classStr += 'status_moved '
      }

      return classStr || 'status_unchanged'
    },
    bindIconClass (data) {
      let statusStr = this.bindStatusClass(data.status, data.moved)
      statusStr += data.iconClass ? ` ${data.iconClass}` : ''
      return statusStr
    },
    hideSame () {
      this.hideSameValue = !this.hideSameValue
      this.$refs.leftTree.filter(this.hideSameValue)
      this.$refs.rightTree.filter(this.hideSameValue)
      this.repaint()()
    },
    filterNode (value, data) {
      if (value) {
        const status = data.status
        return status === deltaStatus.Added || status === deltaStatus.Changed || status === deltaStatus.Deleted || data.moved
      } else {
        return true
      }
    },
    leftClickHandler (data) {
      this.leftSelect = data
    },
    rightClickHandler (data) {
      this.rightSelect = data
    },
    contextHandler (data, treeRef, isLeft) {
      treeRef.setCurrentKey(data.objectHashId)

      if (!data.disabled) {
        const items = [
          {
            title: 'compareSelected', clickFunc: this.openPropertyDiff, icon: '', disabled: !this.selectMatched
          },
          {
            title: 'divide', clickFunc: '', icon: '', disabled: false
          },
          {
            title: 'bindSelected', clickFunc: this.bindPathId, icon: '', disabled: !this.bindable
          }
        ]
        let prop = ''
        if (/VisualFuncBlock/.test(data.ref.clazzName)) {
          prop = 'vfbMap'
        } else if (/VFBInput/.test(data.ref.clazzName)) {
          prop = 'inputMap'
        } else if (/VFBOutput/.test(data.ref.clazzName)) {
          prop = 'outputMap'
        } else if (/VFBParam/.test(data.ref.clazzName)) {
          prop = 'paramMap'
        }

        if ((isLeft && this.pathIdBindRecords[prop][data.objectHashId]) ||
          (!isLeft && Object.values(this.pathIdBindRecords[prop]).includes(data.objectHashId))) {
          items.push({
            title: 'unbindSelected',
            clickFunc: this.unbindPathId,
            icon: '',
            disabled: false,
            args: [isLeft, prop, data.objectHashId]
          })
        }
        this.$menu.open(null, items, this.$i18n)
      }
    },
    leftContextHandler (event, data) {
      this.leftSelect = data
      this.contextHandler(data, this.$refs.leftTree, true)
    },
    rightContextHandler (event, data) {
      this.rightSelect = data
      this.contextHandler(data, this.$refs.rightTree)
    },
    expandHandler (data, treeRef) {
      const correspond = /_null$/.test(data.objectHashId)
        ? treeRef.getNode(data.objectHashId.replace(/_null$/, ''))
        : treeRef.getNode(data.objectHashId) || treeRef.getNode(`${data.objectHashId}_null`)
      if (correspond) {
        correspond.expand()
        this.repaint()()
      }
      setTimeout(() => {
        this.repaint()()
      }, 300)
    },
    leftExpandHandler (data) {
      this.expandHandler(data, this.$refs.rightTree)
    },
    rightExpandHandler (data) {
      this.expandHandler(data, this.$refs.leftTree)
    },
    collapseHandler (data, treeRef) {
      const correspond = /_null$/.test(data.objectHashId)
        ? treeRef.getNode(data.objectHashId.replace(/_null$/, ''))
        : treeRef.getNode(data.objectHashId) || treeRef.getNode(`${data.objectHashId}_null`)
      if (correspond) {
        correspond.collapse()
        this.repaint()()
      }
      setTimeout(() => {
        this.repaint()()
      }, 300)
    },
    leftCollapseHandler (data) {
      this.collapseHandler(data, this.$refs.rightTree)
    },
    rightCollapseHandler (data) {
      this.collapseHandler(data, this.$refs.leftTree)
    },
    dblClkHandler (isLeft) {
      return (data, node) => {
        if (data.children && data.children.length > 0) {
          if (node.expanded) {
            node.collapse()
            this.collapseHandler(data, isLeft ? this.$refs.rightTree : this.$refs.leftTree)
          } else {
            node.expand()
            this.expandHandler(data, isLeft ? this.$refs.rightTree : this.$refs.leftTree)
          }
          return
        }

        if (data.disabled) {
          return
        }

        const treeRef = isLeft ? this.$refs.rightTree : this.$refs.leftTree
        const correspondNode = /_null$/.test(data.objectHashId)
          ? treeRef.getNode(data.objectHashId.replace(/_null$/, ''))
          : treeRef.getNode(data.objectHashId) || this.$refs.rightTree.getNode(`${data.objectHashId}_null`)

        this.leftSelect = isLeft ? data : correspondNode.data
        this.rightSelect = isLeft ? correspondNode.data : data
        this.$refs.leftTree.setCurrentKey(this.leftSelect.objectHashId)
        this.$refs.rightTree.setCurrentKey(this.rightSelect.objectHashId)

        this.openPropertyDiff()
      }
    },
    openPropertyDiff () {
      if (this.leftSelect || this.rightSelect) {
        this.propCompare = { left: this.leftSelect, right: this.rightSelect }
        this.showPropertyDiff = true
      }
    },
    bindPathId () {
      let prop = ''
      if (/VisualFuncBlock/.test(this.leftSelect.ref.clazzName)) {
        prop = 'vfbMap'
      } else if (/VFBInput/.test(this.leftSelect.ref.clazzName)) {
        prop = 'inputMap'
      } else if (/VFBOutput/.test(this.leftSelect.ref.clazzName)) {
        prop = 'outputMap'
      } else if (/VFBParam/.test(this.leftSelect.ref.clazzName)) {
        prop = 'paramMap'
      }

      const linkStr = `${this.leftSelect.objectHashId} -> ${this.rightSelect.objectHashId}`
      const exist = this.pathIdBindRecords[prop][this.leftSelect.objectHashId]
      if (exist) {
        this.$notification.openInfoNotification(`修改映射 ${linkStr}`).logger()
      } else {
        this.$notification.openInfoNotification(`新增映射 ${linkStr}`).logger()
      }

      this.$store.commit('addBindRecord', {
        source: this.leftSelect.objectHashId,
        target: this.rightSelect.objectHashId,
        prop
      })

      if (exist) {
        const allConnections = this.jsPlumbInstance.getAllConnections()
        this.$notification.openInfoNotification(`移除映射 ${exist.source} -> ${exist.target}`).logger()

        const connection = R.find((con) => con.sourceId === `left_${exist.source}` && con.targetId === `right_${exist.target}`)(allConnections)
        this.jsPlumbInstance.deleteConnection(connection)
      }

      this.jsPlumbInstance.connect(
        {
          source: `left_${this.leftSelect.objectHashId}`,
          target: `right_${this.rightSelect.objectHashId}`
        }
      )
    },
    unbindPathId ([isSource, prop, pathId]) {
      const exists = []
      Object.keys(this.pathIdBindRecords[prop]).forEach(source => {
        const target = this.pathIdBindRecords[prop][source]
        if (isSource && source === pathId) {
          exists.push({ source, target, prop })
        } else if (!isSource && target === pathId) {
          exists.push({ source, target, prop })
        }
      })

      if (exists.length > 0) {
        if (/vfbMap/.test(prop)) {
          // 解绑vfb需要同步解绑iop
          ['inputMap', 'outputMap', 'paramMap'].forEach(mapName => {
            Object.keys(this.pathIdBindRecords[mapName]).forEach(source => {
              const target = this.pathIdBindRecords[mapName][source]
              if (isSource && source.startsWith(pathId)) {
                exists.push({ source, target, prop: mapName })
              } else if (!isSource && target.startsWith(pathId)) {
                exists.push({ source, target, prop: mapName })
              }
            })
          })
        }

        const allConnections = this.jsPlumbInstance.getAllConnections()
        for (const exist of exists) {
          this.$store.commit('removeBindRecord', exist)
          this.$notification.openInfoNotification(`移除映射 ${exist.source} -> ${exist.target}`).logger()

          const connection = R.find((con) => con.sourceId === `left_${exist.source}` && con.targetId === `right_${exist.target}`)(allConnections)
          this.jsPlumbInstance.deleteConnection(connection)
        }
      }
    },
    previous () {
      this.$confirm('所有修改都将丢失，是否继续?', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
        center: true
      }).then(() => {
        this.jsPlumbInstance.deleteEveryConnection()
        this.clearStatus()
        this.$store.commit('clearBindRecords')
        this.$emit('previous')
      })
    },
    next () {
      this.$emit('next')
    },
    repaint () {
      let timeout = null
      return () => {
        clearTimeout(timeout)
        timeout = setTimeout(() => {
          this.jsPlumbInstance.repaintEverything()
        }, 10)
      }
    }
  },
  created () {
    this.initNavData()
  },
  beforeDestroy () {
    this.clearStatus()
  },
  mounted () {
    this.jsPlumbInstance = jsPlumb.getInstance({
      Endpoint: 'Blank',
      Anchor: ['Right', 'Left'],
      ConnectionsDetachable: false,
      ConnectionOverlays: [['Arrow', { width: 12, length: 12, location: 0.5 }]],
      Container: 'packageCompareMain',
      Connector: ['Straight', { stub: 20, gap: 30 }]
    })
    this.jsPlumbInstance.ready(() => {
      // this.hideSame();
      // 恢复连线状态
      ['vfbMap', 'inputMap', 'outputMap', 'paramMap'].forEach(mapName => {
        Object.keys(this.pathIdBindRecords[mapName]).forEach(source => {
          const target = this.pathIdBindRecords[mapName][source]
          this.jsPlumbInstance.connect({ source: `left_${source}`, target: `right_${target}` })
        })
      })
    })
  }
}
</script>

<style scoped>
.compareBreadCrumbs {
  width: 100%;
  padding-top: 6px;
  height: 36px;
  background-color: #e5e5e5;
}

.compareMain {
  width: 100%;
  height: calc(100% - 88px);
  overflow: auto;
  background-color: white;
  padding-top: 10px;
  position: relative;
}

.colPadding10 {
  padding-left: 10px;
  border-right: 1px solid #eee
}

.status_changed {
  color: red;
}

.status_added {
  color: blue;
}

.status_unchanged {
  color: grey;
}

.status_deleted {
  color: blue;
}

.status_moved {
  font-style: oblique;
}
</style>
<style lang="scss">
#pkcCompare {
  user-select: none;

  .el-tree-node__children {
    .el-tree-node:nth-child(even) {
      background: #f6f6f6;
    }

    .el-tree-node:nth-child(odd) {
      background: #ffffff;
    }
  }
}
</style>
