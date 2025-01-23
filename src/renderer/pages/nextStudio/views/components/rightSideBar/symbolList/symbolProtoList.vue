<template>
  <div id="archiveProtoListContainer">
    <img :src="flushIcon" alt="flush" class="variableListFlushIcon" ref="variableListFlushIcon" @click="refresh">
    <el-tabs type="border-card" v-model="activeTab">
      <el-tab-pane v-loading="loading" label="功能块库" name="archiveProto">
        <div class="stencil-container" ref="stencilContainer"></div>
        <!-- <div class="stencil-container" ref="stencilContainer"></div> -->
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import * as R from 'ramda'
import { ui } from '@joint/plus'
import { formatPathIdType } from '@/util'
import { getDeviceSymbol } from '@/renderer/pages/nextStudio/action'

import '@/renderer/style/stencil.scss'

export default {
  name: 'symbolProtoList',
  components: {},
  props: {},
  computed: {
    loading () {
      return this.$store.getters.symbolProtoLoading
    },
    archiveProtoList () {
      return this.$store.getters.archiveProtoList
    },
    currentPaper () {
      return this.$store.getters.currentPaper
    },
    snaplines () {
      return this.$store.getters.snaplines
    },
    symbolNameSpace () {
      return this.$store.getters.symbolNameSpace
    }
  },
  watch: {
    currentPaper (val) {
      if (val) {
        this.bindPaper(val)
      }
    }
  },
  data () {
    return {
      flushIcon: './icon/flush.png',
      activeTab: 'archiveProto',
      stencil: null,
      stencilOptions: {
        width: 200,
        height: 300,
        label: 'Stencil',
        cellCursor: 'grab',
        groupsToggleButtons: true,
        search: {
            '*': ['attrs/label/text'],
            'standard.Image': ['description'],
            'standard.Path': ['description']
        },
        layout: {
          columns: 2, // 列数
          columnWidth: 'compact', // 列宽度 auto compact number
          columnGap: 10, // 列间隙
          rowGap: 10, // 行间隙
          rowHeight: 'compact', // 行高 auto compact number
          verticalAlign: 'top', // 垂直对齐 top middle bottom
          horizontalAlign: 'left', // 水平对齐 left middle right
          marginX: 10, // 设置最左上角元素的原点（x坐标）
          marginY: 10, // 设置最左上角元素的原点（y坐标）
          resizeToFit: true // 调整元素大小以适合网格单元，同时保持纵横比
        }
      }
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
    bindPaper (val) {
      if (this.stencil) {
        this.stencil.setPaper(val)
      } else {
        this.init()
      }
    },
    init () {
      if (this.currentPaper) {
        const paperOptions = { background: { color: '#F5F5F5' } }
        const options = {
          paper: this.currentPaper,
          snaplines: this.snaplines,
          groupsToggleButtons: true,
          groups: {
            'base/extend': { label: 'Base/Extend', index: 0, closed: true, paperOptions }
          },
          width: '100%',
          height: null,
          layout: {
            columns: 2,
            columnWidth: 'compact',
            rowHeight: 'compact',
            rowGap: 10,
            columnGap: 20,
            marginX: 10,
            marginY: 10,
            verticalAlign: 'top',
            horizontalAlign: 'left',
            resizeToFit: true
          },
          scaleClones: true,
          search: {
            '*': ['type', 'attrs/label/text']
          },
          dragStartClone: (cell) => {
            console.log(cell)
            const ctr = R.path(cell.attributes.type.split('.'), this.symbolNameSpace)
            return new ctr()
          },
          dragEndClone: (cell) => {
            console.log(cell)
            const ctr = R.path(cell.attributes.type.split('.'), this.symbolNameSpace)
            return new ctr()
          }
        }

        const stencils = {
          'base/extend': [
            { type: formatPathIdType('base/extend/labelin/v1r0p0') },
            { type: formatPathIdType('base/extend/labelout/v1r0p0') },
            { type: formatPathIdType('base/extend/cconstblock/v1r0p0') },
            { type: formatPathIdType('base/extend/cbrokencircleblock/v1r0p0') },
            { type: formatPathIdType('base/op/cast/v1r0p0') }
          ]
        }
        if (R.isNotEmpty(this.archiveProtoList)) {
          let length = 0
          for (let i = 0; i < this.archiveProtoList.length; i++) {
            const archive = this.archiveProtoList[i]
            if (R.isNotEmpty(archive.children)) {
              for (let j = 0; j < archive.children.length; j++) {
                const lib = archive.children[j]
                const groupStr = `${archive.name}/${lib.name}`
                options.groups[groupStr] = { label: groupStr, index: j + 1 + length, closed: true, paperOptions }
                const cells = []
                if (R.isNotEmpty(lib.children)) {
                  for (const protoSymbol of lib.children) {
                    cells.push({ type: formatPathIdType(protoSymbol.pathId) })
                  }
                }
                stencils[groupStr] = cells
              }
              length += archive.children.length
            }
          }
        }
        this.stencil = new ui.Stencil(options)
        this.$refs.stencilContainer.appendChild(this.stencil.render().el)
        Object.keys(stencils).forEach((key) => {
          this.stencil.loadGroup(stencils[key], key)
        })

        this.$store.commit('setCurrentStencil', this.stencil)
      }
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
}
</style>
