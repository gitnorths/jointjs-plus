<template>
  <div class="container">
    <div class="graphToolbarContainer">
      <div class="graphToolbar">
        <div class="scaleZone">
          <el-input size="mini" v-model="showScale" suffix-icon="fa fa-percent"></el-input>
          <el-button size="mini" type="text" @click="resetScale" class="m_tool_btn">重置视图</el-button>
        </div>
      </div>
      <div style="width: 100%;padding-top: 5px">
        <vxe-form
          title-align="right"
          title-width="40"
          title-colon
          span="24"
          size="mini"
          :data="vertexValue">
          <vxe-form-item title="宽" span="12" field="width">
            <template #default="{ data }">
              <el-input v-model="data.width" type="number" min="0" step="5" size="small" :disabled="!redrawEnable"/>
            </template>
          </vxe-form-item>
          <vxe-form-item title="高" span="12" field="height">
            <template #default="{ data }">
              <el-input v-model="data.height" type="number" min="0" step="5" size="small" :disabled="!redrawEnable"/>
            </template>
          </vxe-form-item>
        </vxe-form>
      </div>
    </div>
    <div class="stencilsContainer" ref="stencilsContainer"></div>
  </div>
</template>

<script>
import {
  mxClient,
  mxEvent,
  mxEventObject,
  mxGraph,
  mxGraphView,
  mxPoint,
  mxRectangle,
  mxStencil,
  mxStencilRegistry,
  mxUtils
} from '../mxgraph'
import * as R from 'ramda'
import { computedTextWidth, createNewShape, SHAPE_CONFIG } from '@/service/symbolMaker/stencilConverter'
import { Graph } from '@/renderer/pages/symbolMaker/views/components/workArea/symbolBlockVersionView/mxgraph/Graph'
import _ from 'lodash'

export default {
  name: 'blockShape',
  props: ['tagKey'],
  data () {
    return {
      scale: 2,
      container: null,
      graph: null,
      stencilName: '',
      vertex: null,
      vertexValue: {
        name: '',
        width: 0,
        height: 0,
        inputs: [],
        outputs: []
      }
    }
  },
  computed: {
    block () {
      return this.$store.getters.workTagsSelectDto(this.tagKey)
    },
    redrawEnable () {
      // TODO
      return false
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
        }
      }
    }
  },
  methods: {
    initGraph () {
      this.container = this.$refs.stencilsContainer
      this.graph = new Graph(this.container)
      this.graph.pageVisible = false // 取消页面设置
      this.graph.setEnabled(false) // 禁用编辑
      this.graph.view.scale = 2
      /**
       * Returns the padding for pages in page view with scrollbars.
       */
      this.graph.getPagePadding = function () {
        return new mxPoint(Math.max(0, Math.round((this.container.offsetWidth - 34) / this.view.scale)),
          Math.max(0, Math.round((this.container.offsetHeight - 34) / this.view.scale)))
      }

      this.graph.view.getBackgroundPageBounds = function () {
        const layout = this.graph.getPageLayout()
        const size = this.graph.getPageSize()

        const x = this.scale * (this.translate.x + layout.x * size.width)
        const y = this.scale * (this.translate.y + layout.y * size.height)
        const width = this.scale * layout.width * size.width
        const height = this.scale * layout.height * size.height

        return new mxRectangle(x, y, width, height)
      }

      this.graph.getPreferredPageSize = function (bounds, width, height) {
        const layout = this.getPageLayout()
        const size = this.getPageSize()

        return new mxRectangle(0, 0, layout.width * size.width, layout.height * size.height)
      }
      /**
       * Guesses autoTranslate to avoid another repaint (see below).
       * Works if only the scale of the graph changes or if pages
       * are visible and the visible pages do not change.
       */
      this.graph.view.validate = function () {
        if (this.graph.container && mxUtils.hasScrollbars(this.graph.container)) {
          const pagePadding = this.graph.getPagePadding()
          const pageSize = this.graph.getPageSize()
          this.translate.x = pagePadding.x - (this.x0 || 0) * pageSize.width
          this.translate.y = pagePadding.y - (this.y0 || 0) * pageSize.height
        }
        mxGraphView.prototype.validate.apply(this, arguments)
      }

      this.graph.sizeDidChange = function () {
        if (this.container && mxUtils.hasScrollbars(this.container)) {
          const layout = this.getPageLayout()
          const size = this.getPageSize()
          const pad = this.getPagePadding()

          const minW = Math.ceil(2 * pad.x + layout.width * size.width)
          const minH = Math.ceil(2 * pad.y + layout.height * size.height)
          const min = this.minimumGraphSize

          if (R.isNil(min) || !R.equals(min.width, minW) || !R.equals(min.height, minH)) {
            this.minimumGraphSize = new mxRectangle(0, 0, minW, minH)
          }
          const dx = pad.x - layout.x * size.width
          const dy = pad.y - layout.y * size.height

          if (!R.equals(this.view.translate.x, dx) || !R.equals(this.view.translate.y, dy)) {
            this.view.x0 = layout.x
            this.view.y0 = layout.y

            // NOTE: THIS INVOKES THIS METHOD AGAIN. UNFORTUNATELY THERE IS NO WAY AROUND THIS SINCE THE
            // BOUNDS ARE KNOWN AFTER THE VALIDATION AND SETTING THE TRANSLATE TRIGGERS A REVALIDATION.
            // SHOULD MOVE TRANSLATE/SCALE TO VIEW.
            const tx = this.view.translate.x
            const ty = this.view.translate.y
            this.view.setTranslate(dx, dy)

            this.container.scrollLeft += Math.round((dx - tx) * this.view.scale)
            this.container.scrollTop += Math.round((dy - ty) * this.view.scale)

            return
          }
          mxGraph.prototype.sizeDidChange.apply(this, arguments)
        } else {
          // Fires event but does not invoke superclass
          this.fireEvent(new mxEventObject(mxEvent.SIZE, 'bounds', this.getGraphBounds()))
        }
      }

      // 返回cell字符串
      this.graph.convertValueToString = function (cell) {
        if (!cell || !cell.value) {
          return ''
        }
        return cell.value.instName || cell.value.text || ''
      }

      const graph = this.graph
      // Accumulates the zoom factor while the rendering is taking place
      // so that not the complete sequence of zoom steps must be painted
      const bgGroup = graph.view.getBackgroundPane()
      const mainGroup = graph.view.getDrawPane()
      graph.cumulativeZoomFactor = 1
      let updateZoomTimeout = null
      let cursorPosition = null
      let scrollPosition = null
      let forcedZoom = null
      let filter = null

      const scheduleZoom = (delay) => {
        if (updateZoomTimeout != null) {
          window.clearTimeout(updateZoomTimeout)
        }

        if (!graph.isMouseDown || forcedZoom) {
          updateZoomTimeout = window.setTimeout(() => {
            if (graph.isFastZoomEnabled()) {
              // Transforms background page
              if (graph.view.backgroundPageShape != null && graph.view.backgroundPageShape.node != null) {
                mxUtils.setPrefixedStyle(graph.view.backgroundPageShape.node.style, 'transform-origin', null)
                mxUtils.setPrefixedStyle(graph.view.backgroundPageShape.node.style, 'transform', null)
              }

              // Transforms graph and background image
              mainGroup.style.transformOrigin = ''
              bgGroup.style.transformOrigin = ''

              // Workaround for no reset of transform in Safari
              if (mxClient.IS_SF) {
                mainGroup.style.transform = 'scale(1)'
                bgGroup.style.transform = 'scale(1)'

                window.setTimeout(function () {
                  mainGroup.style.transform = ''
                  bgGroup.style.transform = ''
                }, 0)
              } else {
                mainGroup.style.transform = ''
                bgGroup.style.transform = ''
              }

              // Shows interactive elements
              graph.view.getDecoratorPane().style.opacity = ''
              graph.view.getOverlayPane().style.opacity = ''
            }

            const sp = new mxPoint(graph.container.scrollLeft, graph.container.scrollTop)
            const offset = mxUtils.getOffset(graph.container)
            const prev = graph.view.scale
            let dx = 0
            let dy = 0

            if (cursorPosition != null) {
              dx = graph.container.offsetWidth / 2 - cursorPosition.x + offset.x
              dy = graph.container.offsetHeight / 2 - cursorPosition.y + offset.y
            }

            graph.zoom(graph.cumulativeZoomFactor)
            const s = graph.view.scale

            if (s !== prev) {
              if (scrollPosition != null) {
                dx += sp.x - scrollPosition.x
                dy += sp.y - scrollPosition.y
              }

              if (mxUtils.hasScrollbars(graph.container) && (dx !== 0 || dy !== 0)) {
                graph.container.scrollLeft -= dx * (graph.cumulativeZoomFactor - 1)
                graph.container.scrollTop -= dy * (graph.cumulativeZoomFactor - 1)
              }
            }
            // 将scale赋值给this.scale
            this.scale = s
            if (filter != null) {
              mainGroup.setAttribute('filter', filter)
            }

            graph.cumulativeZoomFactor = 1
            updateZoomTimeout = null
            scrollPosition = null
            cursorPosition = null
            forcedZoom = null
            filter = null
          }, (delay != null) ? delay : ((graph.isFastZoomEnabled()) ? 200 : 20))
        }
      }
      graph.lazyZoom = function (zoomIn, ignoreCursorPosition, delay) {
        // graphEditorContainer是graphEditorViewContainer的子元素
        // 它的offsetLeft和offsetTop不会跟随滚动窗口调整大小，一直固定是0和32
        // 通过graphEditorViewContainer.offsetLeft和offsetTop来补偿差值
        const offset = mxUtils.getOffset(graph.container)
        // TODO: Fix ignored cursor position if scrollbars are disabled
        ignoreCursorPosition = ignoreCursorPosition || !mxUtils.hasScrollbars(graph.container)

        if (ignoreCursorPosition) {
          cursorPosition = new mxPoint(
            offset.x + graph.container.clientWidth / 2,
            offset.y + graph.container.clientHeight / 2)
        }

        // Switches to 5% zoom steps below 15%
        if (zoomIn) {
          if (this.view.scale * this.cumulativeZoomFactor <= 0.15) {
            this.cumulativeZoomFactor *= (this.view.scale + 0.05) / this.view.scale
          } else {
            // Uses to 5% zoom steps for better grid rendering in webkit
            // and to avoid rounding errors for zoom steps
            this.cumulativeZoomFactor *= this.zoomFactor
            this.cumulativeZoomFactor = Math.round(this.view.scale * this.cumulativeZoomFactor * 20) / 20 / this.view.scale
          }
        } else {
          if (this.view.scale * this.cumulativeZoomFactor <= 0.15) {
            this.cumulativeZoomFactor *= (this.view.scale - 0.05) / this.view.scale
          } else {
            // Uses to 5% zoom steps for better grid rendering in webkit
            // and to avoid rounding errors for zoom steps
            this.cumulativeZoomFactor /= this.zoomFactor
            this.cumulativeZoomFactor = Math.round(this.view.scale * this.cumulativeZoomFactor * 20) / 20 / this.view.scale
          }
        }

        this.cumulativeZoomFactor = Math.max(0.05, Math.min(this.view.scale * this.cumulativeZoomFactor, 160)) / this.view.scale

        if (graph.isFastZoomEnabled()) {
          if (filter == null && mainGroup.getAttribute('filter') !== '') {
            filter = mainGroup.getAttribute('filter')
            mainGroup.removeAttribute('filter')
          }

          scrollPosition = new mxPoint(graph.container.scrollLeft, graph.container.scrollTop)

          const cx = (ignoreCursorPosition)
            ? graph.container.scrollLeft + graph.container.clientWidth / 2
            : cursorPosition.x + graph.container.scrollLeft - offset.x
          const cy = (ignoreCursorPosition)
            ? graph.container.scrollTop + graph.container.clientHeight / 2
            : cursorPosition.y + graph.container.scrollTop - offset.y
          mainGroup.style.transformOrigin = cx + 'px ' + cy + 'px'
          mainGroup.style.transform = 'scale(' + this.cumulativeZoomFactor + ')'
          bgGroup.style.transformOrigin = cx + 'px ' + cy + 'px'
          bgGroup.style.transform = 'scale(' + this.cumulativeZoomFactor + ')'

          if (graph.view.backgroundPageShape != null && graph.view.backgroundPageShape.node != null) {
            const page = graph.view.backgroundPageShape.node

            mxUtils.setPrefixedStyle(page.style, 'transform-origin',
              ((ignoreCursorPosition)
                ? ((graph.container.clientWidth / 2 + graph.container.scrollLeft - page.offsetLeft) + 'px')
                : ((cursorPosition.x + graph.container.scrollLeft - offset.x - page.offsetLeft) + 'px')) + ' ' +
              ((ignoreCursorPosition)
                ? ((graph.container.clientHeight / 2 + graph.container.scrollTop - page.offsetTop) + 'px')
                : ((cursorPosition.y + graph.container.scrollTop - offset.y - page.offsetTop) + 'px')))
            mxUtils.setPrefixedStyle(page.style, 'transform', 'scale(' + this.cumulativeZoomFactor + ')')
          }

          graph.view.getDecoratorPane().style.opacity = '0'
          graph.view.getOverlayPane().style.opacity = '0'
        }

        scheduleZoom(delay)
      }

      // Holds back repaint until after mouse gestures
      mxEvent.addGestureListeners(graph.container, function (evt) {
        if (updateZoomTimeout != null) {
          window.clearTimeout(updateZoomTimeout)
        }
      }, null, function (evt) {
        if (graph.cumulativeZoomFactor !== 1) {
          scheduleZoom(0)
        }
      })

      // Holds back repaint until scroll ends
      mxEvent.addListener(graph.container, 'scroll', () => {
        graph.tooltipHandler.hide()

        if (graph.connectionHandler != null && graph.connectionHandler.constraintHandler != null) {
          graph.connectionHandler.constraintHandler.reset()
        }
        if (updateZoomTimeout != null && !graph.isMouseDown && graph.cumulativeZoomFactor !== 1) {
          scheduleZoom(0)
        }
      })

      mxEvent.addMouseWheelListener(mxUtils.bind(this, function (evt, up, force, cx, cy) {
        // Scrolls with scrollbars turned off
        if (!mxUtils.hasScrollbars(graph.container) && !force && graph.isScrollWheelEvent(evt)) {
          const t = graph.view.getTranslate()
          const step = 40 / graph.view.scale

          if (!mxEvent.isShiftDown(evt)) {
            graph.view.setTranslate(t.x, t.y + ((up) ? step : -step))
          } else {
            graph.view.setTranslate(t.x + ((up) ? -step : step), t.y)
          }
        } else if (force || graph.isZoomWheelEvent(evt)) {
          let source = mxEvent.getSource(evt)

          while (source != null) {
            if (source === graph.container) {
              graph.tooltipHandler.hideTooltip()
              cursorPosition = (cx != null && cy != null)
                ? new mxPoint(cx, cy)
                : new mxPoint(mxEvent.getClientX(evt), mxEvent.getClientY(evt))

              forcedZoom = force
              graph.lazyZoom(up, true)
              mxEvent.consume(evt)

              return false
            }

            source = source.parentNode
          }
        }
      }), graph.container)

      // Uses fast zoom for pinch gestures on iOS
      graph.panningHandler.zoomGraph = function (evt) {
        graph.cumulativeZoomFactor = evt.scale
        graph.lazyZoom(evt.scale > 0, true)
        mxEvent.consume(evt)
      }
    },
    init () {
      this.vertexValue.name = this.block.name
      this.vertexValue.inputs = this.block.inputs.map(input => _.cloneDeep(input))
      this.vertexValue.outputs = this.block.outputs.map(output => _.cloneDeep(output))
      // 将图形添加到画布
      this.graph.getModel().beginUpdate()
      try {
        const shape = mxUtils.parseXml(this.block.graphicFile).firstChild
        this.vertexValue.width = Number(shape.getAttribute('w'))
        this.vertexValue.height = Number(shape.getAttribute('h'))
        const parent = this.graph.getDefaultParent()
        this.stencilName = shape.getAttribute('name')
        mxStencilRegistry.addStencil(this.stencilName, new mxStencil(shape))
        if (this.vertex) {
          this.graph.removeCells([this.vertex])
        }
        this.vertex = this.graph.insertVertex(parent, null, this.vertexValue, 0, 0, this.vertexValue.width, this.vertexValue.height, `shape=${this.stencilName};resizable=0;fillColor=white;`)
      } finally {
        this.graph.getModel().endUpdate()
      }
      this.$nextTick(() => {
        this.graph.scrollCellToVisible(this.vertex, true)
      })
    },
    clear () {
      mxStencilRegistry.addStencil(this.stencilName, undefined)
      this.scale = 2
      this.container = null
      this.graph = null
      this.stencilName = ''
      this.vertex = null
      this.vertexValue = {
        name: '',
        width: 0,
        height: 0,
        inputs: [],
        outputs: []
      }
    },
    // 重置页面缩放
    resetScale () {
      this.scale = 2
      this.graph.view.scaleAndTranslate(2, 0, 0)
      this.graph.scrollCellToVisible(this.vertex, true)
    },
    redrawGraph () {
      if (!this.redrawEnable) {
        return
      }

      const stencil = createNewShape(this.vertexValue, this.stencilName) // 根据功能块模型定义新的图形
      const shape = mxUtils.parseXml(stencil).firstChild
      mxStencilRegistry.addStencil(this.stencilName, new mxStencil(shape))

      // FIXME 刷新图形显示，从源码中寻找刷新视图的逻辑
      this.graph.getModel().beginUpdate()
      try {
        // 先移除，再添加
        this.graph.removeCells([this.vertex])
        const parent = this.graph.getDefaultParent()
        this.vertex = this.graph.insertVertex(parent, null, this.vertexValue, 0, 0, this.vertexValue.width, this.vertexValue.height, `shape=${this.stencilName};resizable=0;fillColor=white;`)
      } finally {
        this.graph.getModel().endUpdate()
      }
      this.graph.scrollCellToVisible(this.vertex, true)

      // 图像属性变化
      const orgStencil = this.block.graph
      if (stencil !== orgStencil || this.vertexValue.width !== this.block.width || this.vertexValue.height !== this.block.height) {
        this.$store.commit('updateSEDelta', {
          key: this.tagKey,
          propName: SymbolBlockConstants.graph,
          value: {
            width: this.vertexValue.width,
            height: this.vertexValue.height,
            stencil
          }
        })
      } else {
        this.$store.commit('updateSEDelta', {
          key: this.tagKey,
          propName: SymbolBlockConstants.graph,
          value: null
        })
      }
    },
    syncHeight () {
      // 自适应高度
      const showInputs = R.filter(input => !input.integralVisible)(this.vertexValue.inputs)
      const showOutputs = R.filter(output => !output.integralVisible)(this.vertexValue.outputs)
      const maxLen = R.max(showInputs.length, showOutputs.length)
      this.vertexValue.height = R.max(maxLen, 1) * SHAPE_CONFIG.lineHeight * SHAPE_CONFIG.gridSize + SHAPE_CONFIG.headSize

      this.redrawGraph()
    },
    syncWidth () {
      const sortMaxLengthIo = R.compose(
        R.sort(R.descend(R.prop('length'))),
        // IO文字坐标为距离边界有3个单位，乘以系数1.5
        R.map((io) => ({
          name: io.name,
          length: computedTextWidth(io.name) + 3 * 1.5
        })),
        R.filter(io => !io.integralVisible && !io.textVisible)
      )

      const showInputs = sortMaxLengthIo(this.vertexValue.inputs)
      const showOutputs = sortMaxLengthIo(this.vertexValue.outputs)
      const maxInputName = showInputs.length > 0 ? showInputs[0] : { length: 0 }
      const maxOutputName = showOutputs.length > 0 ? showOutputs[0] : { length: 0 }
      // console.log(maxInputName, maxOutputName);
      const maxLength = (Math.ceil((maxInputName.length + maxOutputName.length) / 5) + 2) * 5
      // console.log(this.vertexValue.width, maxLength);
      if (maxLength > this.vertexValue.width) {
        this.vertexValue.width = maxLength
        this.redrawGraph()
      }
    },
    syncInputs (inputs) {
      this.vertexValue.inputs = inputs.map(input => _.cloneDeep(input))
      this.syncHeight()
      this.syncWidth()
    },
    syncOutputs (outputs) {
      this.vertexValue.outputs = outputs.map(output => _.cloneDeep(output))
      this.syncHeight()
      this.syncWidth()
    }
  },
  beforeDestroy () {
    this.clear()
  },
  mounted () {
    this.initGraph()
    this.init()
  }
}
</script>

<style lang="scss" scoped>
.container {
  z-index: 1;
  position: relative;
  width: 100%;
  height: 100%;

  .graphToolbarContainer {
    position: relative;
    height: 85px;
    width: 100%;
    box-shadow: 2px 2px 3px 0 rgba(0, 0, 0, .3);
    z-index: 2;

    .graphToolbar {
      color: #fff;
      height: 32px;
      width: 100%;
      border-bottom: 1px solid rgb(235, 238, 245);

      .scaleZone {
        height: 100%;
        padding-top: 1px;

        .el-input {
          width: calc(100% - 70px);

          input {
            height: 27px;
            line-height: 27px;
          }
        }

        .m_tool_btn {
          padding: 0;
          position: relative;
          top: -1px;
          margin: 0 0 0 10px;
          border: 0;
          height: auto;
          color: #000;
          font-weight: 600;
        }
      }
    }
  }

  .stencilsContainer {
    position: relative;
    z-index: 1;
    height: calc(100% - 85px);
    width: 100%;
    overflow-x: auto;
    overflow-y: auto;
    outline: none;
    background: #f5f5f5;
  }
}
</style>
