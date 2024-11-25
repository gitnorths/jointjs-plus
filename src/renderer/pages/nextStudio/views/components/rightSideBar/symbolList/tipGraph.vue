<template>
  <div class="tipGraphContainer">
    <div class="tipGraph" ref="container" :key="key">
    </div>
  </div>
</template>

<script>
import * as R from 'ramda'
import { mxConstants, mxGraph, mxUtils } from '@/renderer/common/mxgraph'

export default {
  name: 'tipGraph',
  props: {
    symbol: {
      required: true
    }
  },
  watch: {
    symbol () {
      ++this.key
      this.$nextTick(() => {
        this.container = this.$refs.container
        this.initGraph()
      })
    }
  },
  data () {
    return {
      key: 1,
      container: null,
      graph: null
    }
  },
  methods: {
    initGraph () {
      this.graph = new mxGraph(this.container)
      this.graph.resetViewOnRootChange = false
      this.graph.foldingEnabled = false
      this.graph.gridEnabled = false
      this.graph.setTooltips(false)
      this.graph.setConnectable(false)
      this.graph.setEnabled(false)
      const style = this.graph.getStylesheet().getDefaultVertexStyle()

      style[mxConstants.STYLE_FILLCOLOR] = '#ffffff'
      style[mxConstants.STYLE_STROKECOLOR] = '#000000'
      style[mxConstants.STYLE_STROKEWIDTH] = '1'
      style[mxConstants.STYLE_FONTCOLOR] = '#000000'
      style[mxConstants.STYLE_FONTSIZE] = '12'
      style[mxConstants.STYLE_FONTSTYLE] = 1
      style[mxConstants.STYLE_FONTFAMILY] = 'Georgia'
      this.graph.getStylesheet().putDefaultVertexStyle(style)

      const parent = this.graph.getDefaultParent()
      let vertex = null

      if (R.isNil(this.symbol)) {
        return
      }
      const shape = mxUtils.parseXml(this.symbol.graphic).firstChild
      const width = shape.getAttribute('w')
      const height = shape.getAttribute('h')
      const name = shape.getAttribute('name')

      this.graph.getModel().beginUpdate()
      try {
        const defaultScale = 1.8
        const maxScale = 0.6

        let mWidth = width * defaultScale
        let mHeight = height * defaultScale

        const windowWidth = window.screen.width * maxScale
        const windowHeight = window.screen.height * maxScale
        const scale = Math.min(windowWidth / mWidth, windowHeight / mHeight)

        if (scale < 1) {
          mWidth *= scale
          mHeight *= scale
        }
        vertex = this.graph.insertVertex(parent, null, null, 0, 0, mWidth, mHeight, `shape=${name};resizable=0`)
      } finally {
        this.graph.getModel().endUpdate()
      }
      this.graph.scrollCellToVisible(vertex, true)
    }
  },
  mounted () {
    this.$nextTick(() => {
      this.container = this.$refs.container
      this.initGraph()
    })
  }
}
</script>

<style lang="scss" scoped>
.tipGraphContainer {
  display: block;
  max-height: calc(100vh - 60px);
  overflow-y: auto;

  .tipGraph {
    overflow: auto;
  }
}
</style>
