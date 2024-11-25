<template>
  <div class="graphEditorViewContainer" :id="tagKey">
    <div class="graphEditorContainer" tabIndex="0" ref="graphEditorContainer" @keydown="keyDownHandler">
      <div class="pastePreview" :style="{width: `${previewWidth * scale}px`, height: `${previewHeight * scale}px`}"
           v-if="readyToPaste"
           ref="pastePreview"></div>
    </div>
    <symbol-dialog :graph="graph" :page-graph="pageGraphDto" ref="dialog"/>
  </div>
</template>

<script>
import {
  mxCellRenderer,
  mxConstants,
  mxEvent,
  mxEventObject,
  mxGraph,
  mxGraphHandler,
  mxPoint,
  mxStencilRegistry,
  mxUtils
} from '@/renderer/common/mxgraph'
import { PAGE_FORMATS } from '@/renderer/common/mxgraph/constants'
import SymbolDialog from './symbolDialog/symbolDialog.vue'
import * as R from 'ramda'
import * as _ from 'lodash'
import { ConnectStatus } from '@/renderer/pages/nextStudio/model/DebugSignal'
import {
  closeDebugSignal,
  getObjContext,
  GraphSizeMap,
  instanceVFB,
  openDebugSignal,
  pasteVfbAndLines,
  setDebugSignalValue
} from '@/renderer/pages/nextStudio/action'
import { v4 as uuid } from 'uuid'
import { copyText, pasteText } from '@/renderer/common/action'
import { EnableStatusEnum, SymbolTypeEnum, TaskLevelEnum } from '@/model/enum'
import {
  ConnectLine,
  ConnectLineRouterPoints,
  LabelIn,
  LabelOut,
  PageAnnotation,
  SymbolBlockInst,
  SymbolBlockVarInputInst,
  SymbolBlockVarOutputInst
} from '@/model/dto'
import { getDtoClassName, objDiff } from '@/renderer/common/util'
import { MyEditor } from './override/MyEditor'

export default {
  name: 'graphEditor',
  components: { SymbolDialog },
  props: {
    tagKey: {
      type: String,
      required: true
    }
  },
  watch: {
    activeStatus (val) {
      if (val) {
        this.setScrollPosition()
        this.container.focus()
        this.syncScale(this.graph.view.scale)
        this.$store.commit('setCurrentGraph', this.graph)
        this.graph.refresh()
        if (this.selectedCells && this.selectedCells.length > 0) {
          this.$store.commit('setSelectedMxCell', this.selectedCells[0])
        } else {
          this.$store.commit('setSelectedMxCell', null)
        }
      }
      this.graph.tooltipHandler.hideTooltip()
    },
    focusedVfbId (val) {
      if (val) {
        this.focus(val)
      }
    },
    pageSize () {
      this.graph.pageFormat = this.getPageFormat()
      if (this.activeStatus) {
        this.graph.refresh()
      }
    },
    debugMode (val) {
      this.graph.setDebugMode(val)
      if (val) {
        // 进入调试模式取消选择
        this.graph.selectionModel.clear()
        this.reloadPage()
      }
    }
  },
  computed: {
    deviceDbName () {
      return this.$store.getters.deviceDbName
    },
    pageGraphDto () {
      return this.$store.getters.selectDto(this.tagKey)
    },
    activeStatus () {
      return R.equals(this.tagKey, this.$store.getters.activeKey)
    },
    focusedVfbId () {
      return this.$store.getters.focusedVfbId
    },
    graphContainer () {
      return this.$store.getters.projectGraphContainer
    },
    pageSize () {
      return R.prop('pageSize')(this.pageGraphDto)
    },
    symbolProtoMap () {
      return this.$store.getters.symbolProtoMap
    },
    selectedCells: {
      get () {
        return this.graph ? this.graph.selectionModel.cells : []
      },
      set (cells) {
        if (this.graph) {
          this.graph.setSelectionCells(cells)
        }
      }
    },
    readyToPaste () {
      return this.graph.readyToPaste
    },
    debugMode () {
      // 调试模式
      return this.$store.getters.debugMode
    }
  },
  data () {
    return {
      loading: false,
      loadingTimeout: 100,
      loadingService: null,
      pasteData: null,
      previewWidth: 0,
      previewHeight: 0,
      oldScrollTop: 0,
      oldScrollLeft: 0,
      orgPageGraph: null,
      graph: {},
      historyStack: null,
      scale: 1,
      container: null,
      recordSet: { insertRecords: [], updateRecords: [], removeRecords: [] }
    }
  },
  methods: {
    startLoading () {
      if (!this.loading) {
        this.loading = true
        this.loadingService = this.$loading({
          target: `#${this.tagKey}`,
          fullscreen: false,
          text: '加载中...',
          spinner: 'el-icon-loading',
          background: 'rgba(0, 0, 0, 0.3)'
        })
      }
    },
    closeLoading () {
      this.loading = false
      if (this.loadingService) {
        this.loadingService.close()
        this.loadingService = null
      }
    },
    getPageFormat () {
      return this.pageSize ? R.prop('format')(PAGE_FORMATS[this.pageSize.toLowerCase()]) : PAGE_FORMATS.a4.format
    },
    keyDownHandler (evt) {
      if (this.debugMode) {
        // 调试模式禁用键盘复制/粘贴/删除/移动等操作
        return
      }

      const ctrlKey = R.propOr(false, 'ctrlKey', evt)
      const shiftKey = R.propOr(false, 'shiftKey', evt)
      const altKey = R.propOr(false, 'altKey', evt)
      const codeEqual = (code) => R.equals(code, R.propOr('', 'code', evt))
      const alignGrid = (co, move) => {
        if (move === 0) {
          return 0
        }

        const gridSize = this.graph.gridSize
        const gridNum = co / gridSize
        const offset = Math.ceil(gridNum) - gridNum
        return offset === 0
          ? move * gridSize
          : move + offset > 1
            ? (move + offset - 1) * gridSize
            : (move + offset) * gridSize
      }

      const moveCell = (mx, my) => {
        // 移动单个时，对齐网格
        if (this.selectedCells.length === 1) {
          const cell = this.selectedCells[0]
          const { x, y } = cell.geometry
          const dx = ctrlKey || shiftKey || altKey ? mx : alignGrid(x, mx)
          const dy = ctrlKey || shiftKey || altKey ? my : alignGrid(y, my)
          this.graph.moveCells([cell], dx, dy)
        } else {
          // 移动多个时，同时移动网格倍数
          const gridSize = this.graph.gridSize
          const dx = ctrlKey || shiftKey || altKey ? mx : mx * gridSize
          const dy = ctrlKey || shiftKey || altKey ? my : my * gridSize
          this.graph.moveCells(this.selectedCells, dx, dy)
        }
        evt.stopPropagation()
        evt.preventDefault()
      }
      if (codeEqual('ArrowUp') && this.selectedCells.length > 0) {
        moveCell(0, -1)
      }
      if (codeEqual('ArrowDown') && this.selectedCells.length > 0) {
        moveCell(0, 1)
      }
      if (codeEqual('ArrowLeft') && this.selectedCells.length > 0) {
        moveCell(-1, 0)
      }
      if (codeEqual('ArrowRight') && this.selectedCells.length > 0) {
        moveCell(1, 0)
      }
      if (codeEqual('KeyC') && ctrlKey) {
        this.copyCell2Str()
      }
      if (codeEqual('KeyX') && ctrlKey) {
        this.cutCell2Str()
      }
      if (codeEqual('KeyV') && ctrlKey) {
        this.showPastePreview()
        this.$notification.openInfoNotification('请选择粘贴位置')
      }
      if (codeEqual('KeyZ') && ctrlKey) {
        this.undo()
      }
      if (codeEqual('KeyY') && ctrlKey) {
        this.redo()
      }
      if (codeEqual('Delete')) {
        this.delCells()
      }
      if (codeEqual('Escape')) {
        this.cancelAction()
      }
    },
    initCanvas () {
      // Initial page layout view, scrollBuffer and timer-based scrolling
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
      const mult = 20

      const scheduleZoom = function (delay) {
        if (updateZoomTimeout != null) {
          window.clearTimeout(updateZoomTimeout)
        }

        if (delay >= 0) {
          window.setTimeout(function () {
            if (!graph.isMouseDown || forcedZoom) {
              updateZoomTimeout = window.setTimeout(mxUtils.bind(this, function () {
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

                graph.zoom(graph.cumulativeZoomFactor, null,
                  graph.isFastZoomEnabled() ? mult : null)
                const s = graph.view.scale

                if (s !== prev) {
                  if (scrollPosition != null) {
                    dx += sp.x - scrollPosition.x
                    dy += sp.y - scrollPosition.y
                  }

                  // if (resize != null) {
                  //   ui.chromelessResize(false, null, dx * (graph.cumulativeZoomFactor - 1), dy * (graph.cumulativeZoomFactor - 1))
                  // }

                  if (mxUtils.hasScrollbars(graph.container) && (dx !== 0 || dy !== 0)) {
                    graph.container.scrollLeft -= dx * (graph.cumulativeZoomFactor - 1)
                    graph.container.scrollTop -= dy * (graph.cumulativeZoomFactor - 1)
                  }
                }

                // FIXME
                //             // 将scale赋值给this.scale
                //             this.scale = s
                //             this.syncScale(s)
                if (filter != null) {
                  mainGroup.setAttribute('filter', filter)
                }

                graph.cumulativeZoomFactor = 1
                updateZoomTimeout = null
                scrollPosition = null
                cursorPosition = null
                forcedZoom = null
                filter = null
              }), (delay != null) ? delay : ((graph.isFastZoomEnabled()) ? 200 : 20)) // ui.wheelZoomDelay : ui.lazyZoomDelay
            }
          }, 0)
        }
      }

      graph.lazyZoom = function (zoomIn, ignoreCursorPosition, delay, factor) {
        factor = (factor != null) ? factor : this.zoomFactor
        // graphEditorContainer是graphEditorViewContainer的子元素
        // 它的offsetLeft和offsetTop不会跟随滚动窗口调整大小，一直固定是0和32
        // 通过graphEditorViewContainer.offsetLeft和offsetTop来补偿差值
        const offset = mxUtils.getOffset(graph.container)
        // TODO: Fix ignored cursor position if scrollbars are disabled
        ignoreCursorPosition = ignoreCursorPosition || !graph.scrollbars

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
            this.cumulativeZoomFactor *= factor
            this.cumulativeZoomFactor = Math.round(this.view.scale * this.cumulativeZoomFactor * 100) / 100 / this.view.scale
          }
        } else {
          if (this.view.scale * this.cumulativeZoomFactor <= 0.15) {
            this.cumulativeZoomFactor *= (this.view.scale - 0.05) / this.view.scale
          } else {
            this.cumulativeZoomFactor /= factor
            this.cumulativeZoomFactor = Math.round(this.view.scale * this.cumulativeZoomFactor * 100) / 100 / this.view.scale
          }
        }

        this.cumulativeZoomFactor = Math.max(0.05, Math.min(this.view.scale * this.cumulativeZoomFactor, 160)) / this.view.scale

        if (graph.isFastZoomEnabled()) {
          if (filter == null && mainGroup.getAttribute('filter') !== '') {
            filter = mainGroup.getAttribute('filter')
            mainGroup.removeAttribute('filter')
          }

          scrollPosition = new mxPoint(graph.container.scrollLeft, graph.container.scrollTop)

          // Applies final rounding to preview
          const f = Math.round((Math.round(this.view.scale * this.cumulativeZoomFactor *
            100) / 100) * mult) / (mult * this.view.scale)

          const cx = (ignoreCursorPosition || cursorPosition == null)
            ? graph.container.scrollLeft + graph.container.clientWidth / 2
            : cursorPosition.x + graph.container.scrollLeft - graph.container.offsetLeft
          const cy = (ignoreCursorPosition || cursorPosition == null)
            ? graph.container.scrollTop + graph.container.clientHeight / 2
            : cursorPosition.y + graph.container.scrollTop - graph.container.offsetTop
          mainGroup.style.transformOrigin = cx + 'px ' + cy + 'px'
          mainGroup.style.transform = 'scale(' + f + ')'
          bgGroup.style.transformOrigin = cx + 'px ' + cy + 'px'
          bgGroup.style.transform = 'scale(' + f + ')'

          if (graph.view.backgroundPageShape != null && graph.view.backgroundPageShape.node != null) {
            const page = graph.view.backgroundPageShape.node

            mxUtils.setPrefixedStyle(page.style, 'transform-origin',
              ((ignoreCursorPosition || cursorPosition == null)
                ? ((graph.container.clientWidth / 2 + graph.container.scrollLeft - page.offsetLeft) + 'px')
                : ((cursorPosition.x + graph.container.scrollLeft - page.offsetLeft - graph.container.offsetLeft) + 'px')) + ' ' +
              ((ignoreCursorPosition || cursorPosition == null)
                ? ((graph.container.clientHeight / 2 + graph.container.scrollTop - page.offsetTop) + 'px')
                : ((cursorPosition.y + graph.container.scrollTop - page.offsetTop - graph.container.offsetTop) + 'px')))
            mxUtils.setPrefixedStyle(page.style, 'transform', 'scale(' + f + ')')
          } else {
            graph.view.validateBackgroundStyles(f, cx, cy)
          }

          graph.view.getDecoratorPane().style.opacity = '0'
          graph.view.getOverlayPane().style.opacity = '0'

          // if (ui.hoverIcons != null) {
          //   ui.hoverIcons.reset()
          // }

          graph.fireEvent(new mxEventObject('zoomPreview', 'factor', f))
        }

        scheduleZoom(graph.isFastZoomEnabled() ? delay : 0)
      }

      // Holds back repaint until after mouse gestures
      mxEvent.addGestureListeners(graph.container, function () {
        if (updateZoomTimeout != null) {
          window.clearTimeout(updateZoomTimeout)
        }
      }, null, function () {
        if (graph.cumulativeZoomFactor !== 1) {
          scheduleZoom(0)
        }
      })

      // Holds back repaint until scroll ends
      mxEvent.addListener(graph.container, 'scroll', function () {
        graph.tooltipHandler.hide()

        if (graph.connectionHandler != null && graph.connectionHandler.constraintHandler != null) {
          graph.connectionHandler.constraintHandler.reset()
        }

        if (updateZoomTimeout != null && !graph.isMouseDown && graph.cumulativeZoomFactor !== 1) {
          scheduleZoom(0)
        }
        // FIMXE
        //         // 记录scroll位置
        //         this.saveScrollPosition()
      })

      mxEvent.addMouseWheelListener(mxUtils.bind(this, function (evt, up, force, cx, cy) {
        graph.fireEvent(new mxEventObject('wheel'))

        // if (this.dialogs == null || this.dialogs.length === 0) {
        // Scrolls with scrollbars turned off
        if (!graph.scrollbars && !force && graph.isScrollWheelEvent(evt)) {
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
              let factor = graph.zoomFactor
              let delay = null

              // Slower zoom for pinch gesture on trackpad with max delta to
              // filter out mouse wheel events in Brave browser for Windows
              if (evt.ctrlKey && evt.deltaY != null && Math.abs(evt.deltaY) < 40 &&
                Math.round(evt.deltaY) !== evt.deltaY) {
                factor = 1 + (Math.abs(evt.deltaY) / 20) * (factor - 1)
              } else if (evt.movementY != null && evt.type === 'pointermove') {
                // Slower zoom for pinch gesture on touch screens
                factor = 1 + (Math.max(1, Math.abs(evt.movementY)) / 20) * (factor - 1)
                delay = -1
              }

              graph.lazyZoom(up, null, delay, factor)
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

      function calcLevelColor (trueLevel) {
        switch (trueLevel) {
          case TaskLevelEnum.LevelAny:
            return '#909399'
          case TaskLevelEnum.Level1:
            return '#ef5350'
          case TaskLevelEnum.Level2:
            return '#ffb811'
          case TaskLevelEnum.Level3:
            return '#409eff'
          case TaskLevelEnum.Level4:
            return '#67c23a'
        }
      }

      const previousGetStyle = graph.model.getStyle
      graph.model.getStyle = function (cell) {
        if (cell != null) {
          let style = previousGetStyle.call(this, cell)
          if (this.isVertex(cell) && cell.value) {
            const value = cell.value
            let fillColor = ''
            if (value.status === EnableStatusEnum.DIRTY) {
              fillColor = 'yellow'
            } else if (value.status === EnableStatusEnum.OFF) {
              // 退出状态置灰
              fillColor = 'lightgray'
            }

            if (fillColor) {
              style += `fillColor=${fillColor};`
            }

            // 突出显示任务等级和页面不一致的功能块
            const cellLevel = value.level !== TaskLevelEnum.LevelAny
              ? value.level
              : value.customLevel || TaskLevelEnum.LevelAny
            if (cellLevel !== TaskLevelEnum.LevelAny && cellLevel !== graph.pageGraphDto.level) {
              style += `labelBackgroundColor=${calcLevelColor(cellLevel)};`
            }
          }
          // 修改调试模式连线标签样式
          if (graph.debugMode) {
            if (this.isEdge(cell)) {
              // verticalAlign=bottom;
              style += 'fontSize=12;fontColor=blue;'
            }
          }
          return style
        }
        return null
      }
    },
    initFuncAndEventHandler () {
      const dom = this.$refs.pastePreview
      this.graph.graphHandler.movePastePreview = function (x, y) {
        if (R.isNotNil(dom)) {
          dom.style.left = `${x}px`
          dom.style.top = `${y}px`
        }
      }
      this.graph.graphHandler.mouseMove = function (sender, me) {
        if (this.graph.readyToPaste) {
          const { graphX, graphY } = me
          this.movePastePreview(graphX + 1, graphY + 1)
        }
        mxGraphHandler.prototype.mouseMove.call(this, sender, me)
      }

      this.graph.pasteStr2Graph = this.pasteStr2Graph
      this.graph.graphHandler.mouseUp = function (sender, me) {
        if (this.graph.readyToPaste) {
          this.graph.readyToPaste = false
          const { evt } = me
          if (Object.is(0, evt.button)) {
            const pt = mxUtils.convertPoint(this.graph.container, mxEvent.getClientX(evt), mxEvent.getClientY(evt))
            const tr = this.graph.view.translate
            const scale = this.graph.view.scale
            const x = pt.x / scale - tr.x
            const y = pt.y / scale - tr.y

            // 粘贴对齐网格
            const gridSize = this.graph.gridSize
            const rx = Math.round(x / gridSize) * gridSize
            const ry = Math.round(y / gridSize) * gridSize

            this.graph.pasteStr2Graph(rx, ry)
          } else {
            this.$notification.openWarningNotification('已取消粘贴')
          }
        }
        mxGraphHandler.prototype.mouseUp.call(this, sender, me)
      }

      const graph = this.graph
      // label增加双击事件，双击label才编辑
      this.graph.cellRenderer.initializeLabel = function (state, shape) {
        mxCellRenderer.prototype.initializeLabel.call(this, state, shape)

        mxEvent.addListener(shape.node, 'dblclick', function (evt) {
          if (graph.debugMode) {
            // TODO 双击修改值的功能不好用，先屏蔽
            // graph.startEditingAtCell(state.cell, evt);
            // if (state.cell && state.cell.value) {
            //   const debugSignal = store.getters.na2DebugSignal(state.cell.value.na);
            //   if (debugSignal) {
            //     state.cell.value.editActiveValue = debugSignal.debugGetValue;
            //   }
            // }
          }
          mxEvent.consume(evt)
        })
      }

      this.graph.cellRenderer.isLabelEvent = function (state, evt) {
        const source = mxEvent.getSource(evt)
        return state && state.text != null && source === state.text.node.getElementsByTagName('div')[2]
      }

      const store = this.$store
      this.graph.cellLabelChanged = function (cell, value, autoSize) {
        if (!this.debugMode) {
          if (cell.value && cell.value instanceof PageAnnotation) {
            if (value != null && value !== cell.value.value) {
              this.model.beginUpdate()
              try {
                const newCellValue = new PageAnnotation(cell.value)
                newCellValue.value = value
                this.model.setValue(cell, newCellValue)
                // if (autoSize) {
                //   this.cellSizeUpdated(cell, false);
                // }
              } finally {
                this.model.endUpdate()
              }
            }
          } else {
            mxGraph.prototype.cellLabelChanged.call(this, cell, value, autoSize)
          }
        } else {
          if (cell.value && value != null && value !== cell.value.editActiveValue) {
            const cellValue = cell.value
            const debugSignal = store.getters.na2DebugSignal(cellValue.na)
            debugSignal.debugSetValue = value
            setDebugSignalValue(debugSignal)
            this.model.beginUpdate()
            try {
              this.model.setValue(cell, cellValue)

              if (autoSize) {
                this.cellSizeUpdated(cell, false)
              }
            } finally {
              this.model.endUpdate()
            }
          }
        }
      }
      // 功能块悬浮注解
      // 返回一个字符串或者DOM节点做为给定的cell的tip
      this.graph.getTooltipForCell = function (cell) {
        return cell && cell.value ? cell.value.desc : ''
      }

      // 返回cell字符串
      this.graph.convertValueToString = function (cell) {
        if (!cell || !cell.value) {
          return ''
        }
        const value = cell.value
        // 连线
        if (cell.edge) {
          if (this.debugMode) {
            const debugSignal = store.getters.na2DebugSignal(cell.value.na)
            return debugSignal && R.isNotNil(debugSignal.debugGetValue)
              ? debugSignal.debugGetValue.toString()
              : ''
          }
          return ''
        } else {
          if (value instanceof PageAnnotation) {
            return value.value
          }

          if (!value.showInstName) {
            return ''
          }

          const cellLevel = value.level !== TaskLevelEnum.LevelAny
            ? value.level
            : value.customLevel || TaskLevelEnum.LevelAny
          if (cellLevel !== TaskLevelEnum.LevelAny && cellLevel !== this.pageGraphDto.level) {
            return value.instName + `@Lv${cellLevel}`
          }
          return value.instName || value.text || ''
        }
      }

      this.graph.instanceBaseSymbol = (obj) => this.instanceBaseSymbol(obj)

      this.graph.instanceSymbol = (symbol) => (x, y) => this.instanceSymbol(symbol, x, y)

      this.graph.instanceAnnotation = (obj) => this.instanceAnnotation(obj)

      // 重写连线校验函数，返回 null->没错，返回 '' -> 有错，返回 'xxx' -> 有错并提示 'xxx'
      this.graph.getConstraintIO = (cell, constraint) => {
        const cellValue = cell.value
        const pointName = constraint.name
        if (cellValue.type === SymbolTypeEnum.SYM_COMPONENT || cellValue.type === SymbolTypeEnum.SYM_LOGIC) { // FIXME
          const output = R.find(R.propEq(pointName, 'name'))(cellValue.outputs)
          const input = R.find(R.propEq(pointName, 'name'))(cellValue.inputs)
          return output && input
            ? R.equals(constraint.point.x, 1) // 存在同名输入输出，x = 1表示在符号右侧边缘。为输出点
              ? output
              : input
            : output || input
        } else if (cellValue instanceof LabelIn || cellValue instanceof LabelOut) { // FIXME
          return cellValue
        }
      }

      this.graph.getConstraintByCoordinate = (cell, x, y) => {
        const state = this.graph.view.getState(cell)
        const allList = this.graph.getAllConnectionConstraints(state)
        return R.find((constraint) => R.equals(constraint.point.x, x) && R.equals(constraint.point.y, y))(allList)
      }
      this.graph.validateEdge = function (edge, source, target) {
        let srcC
        let tgtC
        if (!edge) {
          srcC = this.connectionHandler.sourceConstraint
          tgtC = this.connectionHandler.constraintHandler.currentConstraint
        } else {
          // 从edge获取constraint
          // 只有连线成功之后才会出现entryX entryY，使用edgeHandler里的currentConstraint
          const { exitX, exitY, entryX, entryY } = R.prop('style')(this.view.getState(edge))
          srcC = this.getConstraintByCoordinate(source, exitX, exitY)
          tgtC = this.getConstraintByCoordinate(target, entryX, entryY)
          const edgeHandler = this.selectionCellsHandler.getHandler(edge)
          const c = edgeHandler.constraintHandler.currentConstraint
          srcC = srcC || c
          tgtC = tgtC || c
        }
        let msg
        if (srcC && tgtC && source && target) {
          const sourceIO = this.getConstraintIO(source, srcC)
          const targetIO = this.getConstraintIO(target, tgtC)
          // 校验航点是否同为输入或者输出
          if (getDtoClassName(sourceIO) === getDtoClassName(targetIO)) {
            if (sourceIO instanceof SymbolBlockVarInputInst) {
              msg = `${srcC.name} 和 ${tgtC.name} 均为输入节点，不支持连线。`
            } else if (sourceIO instanceof SymbolBlockVarOutputInst) {
              msg = `${srcC.name} 和 ${tgtC.name} 均为输出节点，不支持连线。`
            } else {
              msg = `${sourceIO.name} 和 ${targetIO.name} 之间不支持连线。`
            }
          }
          if (!msg) {
            // 校验VB连线
            msg = (function (a, b) {
              if (a instanceof LabelIn && !(b instanceof SymbolBlockVarInputInst)) {
                return `${a.name} 只能连输入节点`
              } else if (a instanceof LabelOut && !(b instanceof SymbolBlockVarOutputInst)) {
                return `${a.name} 只能连输出节点`
              } else if (b instanceof LabelIn && !(a instanceof SymbolBlockVarInputInst)) {
                return `${b.name} 只能连输入节点`
              } else if (b instanceof LabelOut && !(a instanceof SymbolBlockVarOutputInst)) {
                return `${b.name} 只能连输出节点`
              }
              return ''
            })(sourceIO, targetIO)
          }
          const needReverseSrcTgt = sourceIO instanceof SymbolBlockVarInputInst || sourceIO instanceof LabelOut

          const headIO = needReverseSrcTgt ? targetIO : sourceIO
          const tailIO = needReverseSrcTgt ? sourceIO : targetIO

          if (!msg) {
            // 两个航点之间只能有一条连线
            const edges = this.getEdgesBetween(source, target)
            if (edges && edges.length > 0) {
              for (const edgeCell of edges) {
                if (edge && edgeCell.id === edge.id) {
                  continue
                }
                const cline = edgeCell.value
                if (cline && cline.headSignalId === headIO.id && cline.tailSignalId === tailIO.id) {
                  msg = `连接点 ${headIO.name} -> ${tailIO.name} 之间已存在连线。`
                  break
                }
              }
            }
          }
          // 输入只能有一个输出
          if (!msg) {
            const tailCell = needReverseSrcTgt ? source : target
            const edges = this.getEdges(tailCell)
            const existLines = edges.filter(edgeCell => {
              if (edge) {
                return edgeCell.value && edgeCell.value.tailSignalId === tailIO.id && edgeCell.id !== edge.id
              } else {
                return edgeCell.value && edgeCell.value.tailSignalId === tailIO.id
              }
            })
            if (existLines.length > 0) {
              msg = `输入节点 ${tailIO.name} 只允许与一个输出节点相连，已存在连线。`
            }
          }
          if (msg) {
            return msg
          }
        }
        return null
      }
      // 首次连线成功后的回调
      this.graph.connectionHandler.addListener(mxEvent.CONNECT, (sender, evt) => this.mxConnectCallBack(sender, evt))
      // 修改连线回调
      this.graph.addListener(mxEvent.CONNECT_CELL, (sender, evt) => this.mxConnectCellCallBack(sender, evt))
      // 双击功能块打开实例编辑对话框
      this.graph.addListener(mxEvent.DOUBLE_CLICK, (sender, evt) => this.mxDoubleClickCallBack(sender, evt))
      this.graph.getModel().addListener(mxEvent.CHANGE, (sender, evt) => this.mxModelChangeCallBack(sender, evt))
      // 选中的cell同步到store
      this.graph.getSelectionModel().addListener(mxEvent.CHANGE, (sender, evt) => this.mxSelectionModelChangeCallBack(sender, evt))
    },
    initPageGraphDto () {
      this.startLoading()
      setTimeout(() => {
        getObjContext(this.pageGraphDto, this.deviceDbName).then((page) => {
          if (page) {
            this.orgPageGraph = {}
            this.orgPageGraph.annotations = _.cloneDeep(page.annotations)
            this.orgPageGraph.connectLines = _.cloneDeep(page.connectLines)
            this.orgPageGraph.symbolBlocks = _.cloneDeep(page.symbolBlocks)
            this.orgPageGraph.inLabels = _.cloneDeep(page.inLabels)
            this.orgPageGraph.outLabels = _.cloneDeep(page.outLabels)

            this.addCellToGraph(page)
            this.historyStack.clear()
            // 第一次打开
            this.resetScale()
            this.focus(this.focusedVfbId)
          }
        }).catch((e) => {
          this.$notification.openErrorNotification(`页面刷新失败${e}，请稍后再试。`).logger()
        }).finally(() => {
          this.closeLoading()
        })
      }, this.loadingTimeout)
    },
    saveScrollPosition () {
      this.oldScrollTop = this.graph.container.scrollTop
      this.oldScrollLeft = this.graph.container.scrollLeft
    },
    getStencil (cellValue) {
      let shapeName
      if (cellValue.pathId) {
        shapeName = cellValue.pathId
      } else {
        // FIXME
        shapeName = cellValue.name
      }
      let stencilObj = mxStencilRegistry.getStencil(shapeName)
      if (stencilObj) {
        return {
          stencilObj,
          name: shapeName
        }
      } else {
        stencilObj = mxStencilRegistry.getStencil(cellValue.name)
        if (stencilObj) {
          return {
            stencilObj,
            name: cellValue.name
          }
        }
      }
      return { name: '', stencilObj: null }
    },
    addVfbToGraph (block) {
      const parent = this.graph.getDefaultParent()
      const { name, stencilObj } = this.getStencil(block)
      const shape = name || ''
      const width = stencilObj ? stencilObj.w0 : 50
      const height = stencilObj ? stencilObj.h0 : 50
      const style = `shape=${shape};` +
        'perimeter=calloutPerimeter;align=center;verticalAlign=bottom;' +
        'labelPosition=center;verticalLabelPosition=top;' +
        'fontSize=6;fontFamily=Arial;' +
        'resizable=0;'
      const { id, x, y } = block
      return this.graph.insertVertex(parent, id, block, x, y, width, height, style)
    },
    addLabelToGraph (annotation) {
      const { id, x, y, pathId } = annotation
      const parent = this.graph.getDefaultParent()
      const style = `shape=${pathId};` +
        'perimeter=calloutPerimeter;align=center;verticalAlign=bottom;' +
        'labelPosition=center;verticalLabelPosition=top;' +
        'fontSize=6;fontFamily=Arial;' +
        'resizable=0;'
      const { w, h } = GraphSizeMap[pathId]
      return this.graph.insertVertex(parent, id, annotation, x, y, w, h, style)
    },
    addAnnotationToGraph (annotation) {
      const parent = this.graph.getDefaultParent()
      const style = 'perimeter=rectanglePerimeter;align=center;verticalAlign=middle;' +
        'labelPosition=center;verticalLabelPosition=center;' +
        'fontSize=7;fontFamily=Arial;' +
        'resizable=1;autosize=1;editable=1;connectable=0;' +
        (annotation.color || '') +
        'rounded=1;'
      const { id, x, y, width, height } = annotation
      return this.graph.insertVertex(parent, id, annotation, x, y, width, height, style)
    },
    addLineToGraph (line) {
      const getConnectPoint = (name, cell, fromHead) => {
        const { stencilObj } = this.getStencil(cell.value)
        if (stencilObj) {
          const pointList = R.filter(R.propEq(name, 'name'))(stencilObj.constraints || [])
          if (pointList && pointList.length > 0) {
            if (pointList.length === 1) {
              return pointList[0].point
            } else if (fromHead) {
              return R.find(R.propEq(1, 'x'))(pointList)
            } else {
              return R.find(!R.propEq(1, 'x'))(pointList)
            }
          }
        }
      }
      const parent = this.graph.getDefaultParent()
      const headCell = this.graph.model.getCell(line.headNodeId)
      const tailCell = this.graph.model.getCell(line.tailNodeId)

      if (R.isNotNil(headCell) && R.isNotNil(tailCell)) {
        // FIXME
        const headPoint = getConnectPoint(line.headName, headCell, true)
        const exitX = R.propOr(0.5, 'x', headPoint)
        const exitY = R.propOr(0.5, 'y', headPoint)
        const tailPoint = getConnectPoint(line.tailName, tailCell, false)
        const entryX = R.propOr(0.5, 'x', tailPoint)
        const entryY = R.propOr(0.5, 'y', tailPoint)
        const style = `exitX=${exitX};exitY=${exitY};entryX=${entryX};entryY=${entryY};exitPerimeter=0;entryPerimeter=0;endArrow=none;strokeColor=#000000;`
        const edge = this.graph.insertEdge(parent, line.id, line, headCell, tailCell, style)
        edge.geometry.points = R.map((point) => new mxPoint(point.x, point.y))(line.graphics)
        return edge
      }
      return null
    },
    addCellToGraph ({ symbolBlocks, connectLines, annotations, inLabels, outLabels }) {
      const cells = []
      this.graph.getModel().beginUpdate()
      try {
        if (symbolBlocks && symbolBlocks.length > 0) {
          for (const block of symbolBlocks) {
            cells.push(this.addVfbToGraph(block))
          }
        }
        if (inLabels && inLabels.length > 0) {
          for (const label of inLabels) {
            cells.push(this.addLabelToGraph(label))
          }
        }
        if (outLabels && outLabels.length > 0) {
          for (const label of outLabels) {
            cells.push(this.addLabelToGraph(label))
          }
        }
        if (connectLines && connectLines.length > 0) {
          for (const line of connectLines) {
            const lineCell = this.addLineToGraph(line)
            if (lineCell) {
              cells.push(lineCell)
            }
          }
        }
        if (annotations && annotations.length > 0) {
          for (const annotation of annotations) {
            cells.push(this.addAnnotationToGraph(annotation))
          }
        }
        return cells
      } finally {
        this.graph.getModel().endUpdate()
      }
    },
    judgeChanged () {
      // fixme
      this.recordSet = { insertRecords: [], updateRecords: [], removeRecords: [] }
      const oldValue = this.orgPageGraph
      const newValue = { symbolBlocks: [], connectLines: [], annotations: [] }
      const allCells = R.values(this.graph.model.cells) || []
      for (const cell of allCells) {
        if (cell && cell.value) {
          // FIXME
          if (/VisualFuncBlock/.test(cell.value.clazzName)) {
            newValue.symbolBlocks.push(cell.value)
          } else if (/ConnectingLine/.test(cell.value.clazzName)) {
            newValue.connectLines.push(cell.value)
          } else if (/Annotation/.test(cell.value.clazzName)) {
            newValue.annotations.push(cell.value)
          }
        }
      }
      const delta = objDiff().diff(oldValue, newValue)
      if (delta) {
        // 功能块对比
        if (delta.symbolBlocks && delta.symbolBlocks._t === 'a') {
          if (oldValue.symbolBlocks && oldValue.symbolBlocks.length > 0) {
            for (let i = 0; i < oldValue.symbolBlocks.length; i++) {
              const delDelta = delta.symbolBlocks[`_${i}`]
              // 删除功能块
              if (delDelta && delDelta instanceof Array && delDelta[2] === 0) {
                this.recordSet.removeRecords.push(oldValue.symbolBlocks[i])
              }
            }
          }
          if (newValue.symbolBlocks && newValue.symbolBlocks.length > 0) {
            for (let i = 0; i < newValue.symbolBlocks.length; i++) {
              const changeDelta = delta.symbolBlocks[`${i}`]
              if (changeDelta) {
                const dto = newValue.symbolBlocks[i]
                if (changeDelta instanceof Array) {
                  this.recordSet.insertRecords.push(dto)
                } else {
                  if (changeDelta.x || changeDelta.y ||
                    changeDelta.instName || changeDelta.status ||
                    changeDelta.showInstName || changeDelta.desc ||
                    changeDelta.customLevel || changeDelta.customTypeOption ||
                    changeDelta.args) {
                    this.recordSet.updateRecords.push(dto)
                  }
                  if (changeDelta.inputs) {
                    const newInputs = dto.inputs
                    for (let j = 0; j < newInputs.length; j++) {
                      if (changeDelta.inputs[j]) {
                        this.recordSet.updateRecords.push(newInputs[j])
                      }
                    }
                  }
                  if (changeDelta.outputs) {
                    const newOutputs = dto.outputs
                    for (let j = 0; j < newOutputs.length; j++) {
                      if (changeDelta.outputs[j]) {
                        this.recordSet.updateRecords.push(newOutputs[j])
                      }
                    }
                  }
                  if (changeDelta.params) {
                    for (let j = 0; j < dto.params.length; j++) {
                      const paramChangeDelta = changeDelta.params[j]
                      if (paramChangeDelta) {
                        const newParam = dto.params[j]
                        if (paramChangeDelta.listArrSetValues) {
                          const newListArr = newParam.listArrSetValues // FIXME
                          for (let k = 0; k < newListArr.length; k++) {
                            if (paramChangeDelta.listArrSetValues[k]) {
                              this.recordSet.updateRecords.push(newListArr[k])
                            }
                          }
                        }
                        if (paramChangeDelta.alias || paramChangeDelta.desc || paramChangeDelta.value) {
                          this.recordSet.updateRecords.push(newParam)
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
        // 连线对比
        if (delta.connectLines && delta.connectLines._t === 'a') {
          if (oldValue.connectLines && oldValue.connectLines.length > 0) {
            for (let i = 0; i < oldValue.connectLines.length; i++) {
              const delDelta = delta.connectLines[`_${i}`]
              // 删除功能块
              if (delDelta && delDelta instanceof Array && delDelta[2] === 0) {
                this.recordSet.removeRecords.push(oldValue.connectLines[i])
              }
            }
          }
          if (newValue.connectLines && newValue.connectLines.length > 0) {
            for (let i = 0; i < newValue.connectLines.length; i++) {
              const changeDelta = delta.connectLines[`${i}`]
              if (changeDelta) {
                const dto = newValue.connectLines[i]
                if (changeDelta instanceof Array) {
                  this.recordSet.insertRecords.push(dto)
                } else {
                  this.recordSet.updateRecords.push(dto)
                }
              }
            }
          }
        }
        // 注解对比
        if (delta.annotations && delta.annotations._t === 'a') {
          if (oldValue.annotations && oldValue.annotations.length > 0) {
            for (let i = 0; i < oldValue.annotations.length; i++) {
              const delDelta = delta.annotations[`_${i}`]
              // 删除功能块
              if (delDelta && delDelta instanceof Array && delDelta[2] === 0) {
                this.recordSet.removeRecords.push(oldValue.annotations[i])
              }
            }
          }
          if (newValue.annotations && newValue.annotations.length > 0) {
            for (let i = 0; i < newValue.annotations.length; i++) {
              const changeDelta = delta.annotations[`${i}`]
              if (changeDelta) {
                const dto = newValue.annotations[i]
                if (changeDelta instanceof Array) {
                  this.recordSet.insertRecords.push(dto)
                } else {
                  this.recordSet.updateRecords.push(dto)
                }
              }
            }
          }
        }
      }
      this.recordDelta()
    },
    recordDelta () {
      this.$store.commit('updateDelta', { key: this.tagKey, delta: this.recordSet })
    },
    // 双击回调
    mxDoubleClickCallBack (sender, evt) {
      // 双击影藏toolTip
      this.graph.tooltipHandler.hideTooltip()
      if (evt instanceof mxEventObject) {
        const cell = evt.getProperty('cell')
        if (cell && cell.value) {
          if (cell.edge) { // 双击连线
            const isLabelEvent = this.graph.cellRenderer.isLabelEvent(this.graph.view.getState(cell), evt.getProperty('event'))
            if (this.debugMode && !isLabelEvent) {
              const cellValue = cell.value
              // 双击操作要防呆
              if (!cellValue.dblClicked) {
                try {
                  cellValue.dblClicked = true
                  // 添加到变量监控
                  this.$store.commit('addToWatchedSignals', { na: cellValue.na, annotation: '' })
                  // 通过na获取当前调试信号
                  const debugSignal = this.$store.getters.na2DebugSignal(cellValue.na)
                  if (debugSignal) {
                    if (debugSignal.connectStatus === ConnectStatus.OPENED) {
                      closeDebugSignal(debugSignal)
                    } else if (debugSignal.connectStatus === ConnectStatus.OPENING) {
                      console.log(`信号${cellValue.na}正在打开中，请稍等...`)
                    } else if (debugSignal.connectStatus === ConnectStatus.CLOSING) {
                      console.log(`信号${cellValue.na}正在被其它业务关闭中，请稍后重试...`)
                    } else {
                      openDebugSignal(cellValue.na)
                    }
                  } else {
                    openDebugSignal(cellValue.na)
                  }
                } catch (e) {
                  throw new Error(e)
                } finally {
                  cellValue.dblClicked = false
                }
              }
            }
          } else { // 双击功能块
            // TODO LIN/LOUT可以改为双击直接编辑
            if (cell.value.type === SymbolTypeEnum.SYM_LOGIC || cell.value.type === SymbolTypeEnum.SYM_COMPONENT) {
              if (cell.value.status !== EnableStatusEnum.DIRTY) {
                this.$refs.dialog.openDialog(cell)
              }
            } else if (cell.value instanceof PageAnnotation) {
              if (!this.debugMode) {
                // 双击注解开始编辑
                this.graph.startEditingAtCell(cell, evt)
              }
            }
          }
        }
      }
    },
    setConnectInfo (cline, cell, srcConstraint, tgtConstraint) {
      const sourceIO = this.graph.getConstraintIO(cell.source, srcConstraint)
      const targetIO = this.graph.getConstraintIO(cell.target, tgtConstraint)
      const needReverseSrcTgt = sourceIO instanceof SymbolBlockVarInputInst || sourceIO instanceof LabelOut
      const headCell = needReverseSrcTgt ? cell.target : cell.source
      const tailCell = needReverseSrcTgt ? cell.source : cell.target
      const headNode = headCell.value
      const tailNode = tailCell.value
      const headIO = needReverseSrcTgt ? targetIO : sourceIO
      const tailIO = needReverseSrcTgt ? sourceIO : targetIO
      const headName = needReverseSrcTgt ? tgtConstraint.name : srcConstraint.name
      const tailName = needReverseSrcTgt ? srcConstraint.name : tgtConstraint.name

      const points = cell.geometry.points || []

      cline.headName = headName
      cline.headNodeId = headNode.id
      cline.headSignalId = headIO.id

      cline.tailName = tailName
      cline.tailNodeId = tailNode.id
      cline.tailSignalId = tailIO.id
      cline.graphics = (needReverseSrcTgt ? R.reverse(points) : points)
        .map((point, index) => new ConnectLineRouterPoints({ x: point.x, y: point.y, index }))

      this.graph.getModel().beginUpdate()
      try {
        this.graph.getModel().setValue(cell, cline)
        if (tailNode instanceof LabelOut) {
          const newTailNode = _.cloneDeep(tailNode)
          const newHeadNode = _.cloneDeep(headNode)
          if (headIO.desc) {
            newTailNode.desc = headIO.desc
          } else if (tailNode.desc) {
            const newHeadIO = R.find(R.propEq(headIO.name, 'name'))(newHeadNode.outputs || [])
            newHeadIO.desc = tailNode.desc
          }
          this.graph.getModel().setValue(headCell, newHeadNode)
          this.graph.getModel().setValue(tailCell, newTailNode)
        }
      } finally {
        this.graph.getModel().endUpdate()
      }
      return { headCell, tailCell, headNode, tailNode, headIO, tailIO }
    },
    mxConnectCallBack (sender, evt) {
      const srcConstraint = sender.sourceConstraint
      const tgtConstraint = sender.constraintHandler.currentConstraint
      const cell = evt.getProperty('cell')

      const line = new ConnectLine()
      line.id = uuid()
      line.pageGraphId = this.pageGraphDto.id
      const { headNode, tailNode } = this.setConnectInfo(line, cell, srcConstraint, tgtConstraint)
      this.$logger.info(`新增连线 ${headNode.instName || headNode.name}.${line.headName} -> ${tailNode.instName || tailNode.name}.${line.tailName}`)
    },
    mxConnectCellCallBack (sender, evt) {
      const cell = evt.getProperty('edge')
      const cline = R.prop('value')(cell)
      if (R.isNil(cell) || R.isNil(cline)) {
        return
      }
      const { exitX, exitY, entryX, entryY } = R.prop('style')(this.graph.view.getState(cell))
      const srcConstraint = this.graph.getConstraintByCoordinate(cell.source, exitX, exitY)
      const tgtConstraint = this.graph.getConstraintByCoordinate(cell.target, entryX, entryY)
      const newLine = _.cloneDeep(cline)
      const { headNode, tailNode } = this.setConnectInfo(newLine, cell, srcConstraint, tgtConstraint)
      this.$logger.info(`连线${headNode.instName || headNode.name}.${newLine.headName} -> ${tailNode.instName || tailNode.name}.${newLine.tailName}变化`)
    },
    /**
     * 当图形发生变化时的处理函数
     */
    mxModelChangeCallBack (sender, evt) {
      if (this.debugMode) {
        return
      }
      if (R.isNil(evt) || this.loading) {
        return
      }
      const changes = evt.getProperty('edit').changes
      if (R.isEmpty(changes)) {
        return
      }
      for (const change of changes) {
        if (!change.cell || !change.cell.value) {
          continue
        }
        const changeName = R.path(['constructor', 'name'])(change)
        const cell = change.cell
        const obj = cell.value
        if (obj instanceof SymbolBlockInst) {
          if (/mxGeometryChange/.test(changeName)) {
            // 修改了 Block坐标
            obj.x = cell.geometry.x
            obj.y = cell.geometry.y
            // this.$logger.info(`功能块${obj.instName || obj.name}坐标变化`);
          }
        } else if (obj instanceof ConnectLine) {
          // 修改了 Line
          if (/mxGeometryChange/.test(changeName)) {
            // TODO 后面改为连线允许断连的时候要注意
            const needReverseSrcTgt = cell.source && cell.source.value && obj.tailNodeId === cell.source.value.id
            const points = cell.geometry.points || []
            obj.graphics = (needReverseSrcTgt ? R.reverse(points) : points)
              .map((point, index) => ({ x: point.x, y: point.y, index }))
            // this.$logger.info(`连线${obj.id}变化`);
          }
        } else if (obj instanceof PageAnnotation) {
          if (/mxGeometryChange/.test(changeName)) {
            // 修改了 annotation 坐标和尺寸
            obj.x = cell.geometry.x
            obj.y = cell.geometry.y
            obj.width = cell.geometry.width
            obj.height = cell.geometry.height
          } else if (/mxValueChange/.test(changeName)) {
            // 修改了 annotation 值
          }
        }
      }
      this.judgeChanged()
    },
    mxSelectionModelChangeCallBack (sender, evt) {
      if (this.graph.debugMode) {
        const removed = evt.getProperty('removed')
        const selectedCell = removed && R.isNotEmpty(removed) ? removed[0] : null
        this.$store.commit('setSelectedMxCell', selectedCell)
      }
    },
    getExistInstNameList () {
      const result = []
      const allCells = R.values(this.graph.model.cells) || []
      for (const cell of allCells) {
        if (cell && cell.value && cell.value.instName) {
          result.push(cell.value.instName)
        }
      }
      return result
    },
    /**
     * 实例化一个symbol valueAddHandler ()
     */
    async instanceSymbol (symbol, x, y) {
      if (R.isNil(symbol)) {
        return
      }
      this.graph.getModel().beginUpdate()
      try {
        const newSymbol = {}
        Object.assign(newSymbol, symbol)
        newSymbol.x = x
        newSymbol.y = y
        const vfb = await instanceVFB(newSymbol, {
          id: this.pageGraphDto.id,
          existInstNameList: this.getExistInstNameList()
        })
        this.$logger.info(`新增符号 ${vfb.instName || vfb.name}`)
        const symbolCell = this.addVfbToGraph(vfb)
        this.graph.setSelectionCells([symbolCell])
      } catch (e) {
        this.$notification.openErrorNotification(`新增功能块失败${e}`).logger()
      } finally {
        this.graph.getModel().endUpdate()
      }
    },
    instanceBaseSymbol (inputArgs) {
      if (!inputArgs) {
        return
      }
      const { x, y, pathId } = inputArgs
      if (/Label(IN|OUT)/i.test(pathId)) {
        this.graph.getModel().beginUpdate()
        try {
          const label = /LabelIn/i.test(pathId)
            ? new LabelIn({ id: uuid(), x, y, pageId: this.pageGraphDto.id })
            : new LabelOut({ id: uuid(), x, y, pageId: this.pageGraphDto.id })
          this.$logger.info('新增标签')
          // 添加到页面
          const labelCell = this.addLabelToGraph(label)
          this.graph.setSelectionCells([labelCell])
        } catch (e) {
          this.$notification.openErrorNotification(`新增注解失败${e}`).logger()
        } finally {
          this.graph.getModel().endUpdate()
        }
      } else {
        const symbol = this.symbolProtoMap[pathId]
        this.instanceSymbol(symbol, x, y)
      }
    },
    instanceAnnotation (inputArgs) {
      if (!inputArgs) {
        return
      }
      const { x, y, width, height, color } = inputArgs
      this.graph.getModel().beginUpdate()
      try {
        const annotation = new PageAnnotation({ x, y, width, height, color, value: '' })
        annotation.id = uuid()
        annotation.pageGraphId = this.pageGraphDto.id
        this.$logger.info('新增注解')
        // 添加到页面
        const annotationCell = this.addAnnotationToGraph(annotation)
        this.graph.setSelectionCells([annotationCell])
      } catch (e) {
        this.$notification.openErrorNotification(`新增注解失败${e}`).logger()
      } finally {
        this.graph.getModel().endUpdate()
      }
    },
    // esc键取消操作
    cancelAction () {
      // 取消连线
      this.graph.connectionHandler.reset()
      // 取消粘贴
      this.graph.readyToPaste = false
    },
    delCells (cells) {
      if (cells && cells.length > 0) {
        this.graph.removeCells(cells, true)
      } else if (R.isNotEmpty(this.selectedCells)) {
        this.graph.removeCells(this.selectedCells, true)
        this.selectedCells = []
      }
    },
    copyCell2Str () {
      if (R.isEmpty(this.selectedCells)) {
        return
      }
      const cellsGroup = R.groupBy((cell) => cell.edge ? 'edge' : 'cell')(cells)
      // 没有功能块，返回
      if (!cellsGroup.cell || R.isEmpty(cellsGroup.cell)) {
        return
      }
      // 含有禁用功能块
      const existDirtyVfbList = R.filter(R.propEq(EnableStatusEnum.DIRTY, 'status'))(cellsGroup.cell.map(cell => cell.value))
      if (existDirtyVfbList && R.isNotEmpty(existDirtyVfbList)) {
        this.$notification.openWarningNotification(`复制失败！所选功能块中包含失效的功能块实例：[ ${existDirtyVfbList.map(vfb => vfb.instName).join(',')} ]`).logger()
        return
      }

      const copyObj = { cell: [], edge: [], width: 0, height: 0 }

      const firstCell = R.head(cellsGroup.cell.sort((a, b) => {
        const { x: apX, y: apY } = a.geometry
        const { x: bpX, y: bpY } = b.geometry
        return apX === bpX ? apY - bpY : apX - bpX
      }))

      cellsGroup.cell.forEach((cell) => {
        const { x, y, width, height } = cell.geometry
        const item = {
          value: cell.value,
          position: { x, y, width, height, offsetX: x - firstCell.geometry.x, offsetY: y - firstCell.geometry.y }
        }
        copyObj.cell.push(item)
      })
      if (cellsGroup.edge) {
        cellsGroup.edge.forEach((cell) => {
          const item = {
            value: cell.value,
            graphics: cell.value.graphics.map(gp => {
              return { x: gp.x, y: gp.y, offsetX: gp.x - firstCell.geometry.x, offsetY: gp.y - firstCell.geometry.y }
            }) || []
          }
          copyObj.edge.push(item)
        })
      }

      const add = (a, b) => Number(a) + Number(b)
      const pointArr = R.unnest(copyObj.cell.map((cell) => {
        const p = cell.position
        return [
          { x: p.x, y: p.y },
          { x: add(p.x, p.width), y: p.y },
          { x: p.x, y: add(p.y, p.height) },
          { x: add(p.x, p.width), y: add(p.y, p.height) }
        ]
      }))
      const xArr = pointArr.map(R.prop('x'))
      const yArr = pointArr.map(R.prop('y'))
      const [x1, x2, y1, y2] = [
        Math.min(...xArr),
        Math.max(...xArr),
        Math.min(...yArr),
        Math.max(...yArr)
      ]

      copyObj.width = x2 - x1
      copyObj.height = y2 - y1
      copyText(JSON.stringify(copyObj))
      this.$notification.openSuccessNotification('复制成功')
    },
    cutCell2Str () {
      this.copyCell2Str()
      // FIXME ，如果取消，则不删除。应该改为粘贴成功之后才删除
      this.delCells()
    },
    showPastePreview () {
      try {
        this.pasteData = JSON.parse(pasteText())
        const { width, height } = this.pasteData
        this.previewWidth = width
        this.previewHeight = height
        this.graph.readyToPaste = true
      } catch (e) {
      }
    },
    async pasteStr2Graph (x, y) {
      if (R.isNil(this.pasteData)) {
        return
      }
      try {
        const cells = this.pasteData.cell || []
        const edges = this.pasteData.edge || []
        const symbolBlocks = []
        const annotations = []
        cells.forEach(cell => {
          const value = _.cloneDeep(cell.value)
          const position = cell.position
          value.x = R.isNil(x) ? position.x : x + position.offsetX
          value.y = R.isNil(y) ? position.y : y + position.offsetY
          if (value instanceof PageAnnotation) {
            annotations.push(value)
          } else {
            // fixme
            symbolBlocks.push(value)
          }
        })
        const connectLines = edges.map(edge => {
          const value = _.cloneDeep(edge.value)
          value.graphics = []
          if (edge.graphics && edge.graphics.length > 0) {
            edge.graphics.forEach((point, index) => {
              const gp = { x: null, y: null, index }
              gp.x = R.isNil(x) ? point.x : x + point.offsetX
              gp.y = R.isNil(y) ? point.y : y + point.offsetY
              value.graphics[index] = gp
            })
          }
          return value
        })
        const result = await pasteVfbAndLines({
          symbolBlocks,
          connectLines,
          annotations,
          pageId: this.pageGraphDto.id,
          existInstNameList: this.getExistInstNameList()
        })
        const newSelectedCells = this.addCellToGraph(result)
        this.graph.setSelectionCells(newSelectedCells)
        this.selectedCells = newSelectedCells
      } catch (e) {
        this.$notification.openErrorNotification(`粘贴失败${e}`).logger()
      }
    },
    undo () {
      if (!this.activeStatus) {
        return
      }
      const actionRecord = this.historyStack.undo()
      if (actionRecord && !actionRecord.isMxUndoManaged) {
        this.judgeChanged()
      }
      this.graph.refresh()
    },
    redo () {
      if (!this.activeStatus) {
        return
      }
      const actionRecord = this.historyStack.redo()
      if (actionRecord && !actionRecord.isMxUndoManaged) {
        this.judgeChanged()
      }
      this.graph.refresh()
    },
    resetScale () {
      if (!this.activeStatus) {
        return
      }
      this.scale = 1
      this.syncScale(1)
      this.graph.view.scaleAndTranslate(1, 0, 0)
      this.graph.center()
      this.saveScrollPosition()
    },
    graphAlign (direction) {
      if (!this.activeStatus) {
        return
      }
      switch (direction) {
        case 'left':
          this.graph.alignCells()
          break
        case 'right':
          this.graph.alignCells(mxConstants.ALIGN_RIGHT)
          break
        case 'bottom':
          this.graph.alignCells(mxConstants.ALIGN_BOTTOM)
          break
        case 'top':
          this.graph.alignCells(mxConstants.ALIGN_TOP)
          break
      }
    },
    setScrollPosition () {
      this.graph.panGraph(-this.oldScrollLeft, -this.oldScrollTop)
    },
    refreshDesc (ignoreTagKeys) {
      if (ignoreTagKeys && R.includes(this.tagKey, ignoreTagKeys)) {
        return
      }
      this.startLoading()
      setTimeout(() => {
        if (!this.pageGraphDto) {
          // 页面被板卡界面关闭
          return
        }
        getObjContext(this.pageGraphDto, this.deviceDbName)
          .then((page) => {
            if (!page) {
              return
            }
            this.orgPageGraph = {}
            this.orgPageGraph.symbolBlocks = _.cloneDeep(page.symbolBlocks)
            this.orgPageGraph.connectLines = _.cloneDeep(page.connectLines)
            this.orgPageGraph.annotations = _.cloneDeep(page.annotations)
            this.orgPageGraph.inLabels = _.cloneDeep(page.inLabels)
            this.orgPageGraph.outLabels = _.cloneDeep(page.outLabels)

            page.symbolBlocks.forEach((vfb) => {
              const vfbCell = this.graph.model.getCell(vfb.id)
              const relateCellVfb = vfbCell ? vfbCell.value : ''
              if (relateCellVfb) {
                relateCellVfb.desc = vfb.desc
                relateCellVfb.status = vfb.status
                if (R.isNotEmpty(vfb.inputs)) {
                  vfb.inputs.forEach((input) => {
                    const relateCellInput = R.find(R.propEq(input.id, 'id'))(relateCellVfb.inputs)
                    relateCellInput.alias = input.alias
                  })
                }
                if (R.isNotEmpty(vfb.outputs)) {
                  vfb.outputs.forEach((output) => {
                    const relateCellOutput = R.find(R.propEq(output.id, 'id'))(relateCellVfb.outputs)
                    relateCellOutput.alias = output.alias
                    relateCellOutput.desc = output.desc
                  })
                }
                if (R.isNotEmpty(vfb.params)) {
                  vfb.params.forEach((param) => {
                    const relateCellParam = R.find(R.propEq(param.id, 'id'))(relateCellVfb.params)
                    relateCellParam.alias = param.alias
                    relateCellParam.desc = param.desc
                    relateCellParam.value = param.value
                  })
                }
              }
            })

            this.graph.refresh()
          })
          .finally(() => {
            this.closeLoading()
          })
      }, this.loadingTimeout)
    },
    reloadPage () {
      this.startLoading()
      setTimeout(() => {
        if (!this.pageGraphDto) {
          // 页面被板卡界面关闭
          return
        }
        getObjContext(this.pageGraphDto, this.deviceDbName).then((page) => {
          if (page) {
            // FIXME
            // Removes all cells
            const allCells = R.values(this.graph.model.cells)
            const toReloadCells = allCells.filter(cell => !!cell.value)
            this.graph.removeCells(toReloadCells, true)

            this.orgPageGraph = {}
            this.orgPageGraph.symbolBlocks = _.cloneDeep(page.symbolBlocks)
            this.orgPageGraph.connectLines = _.cloneDeep(page.connectLines)
            this.orgPageGraph.annotations = _.cloneDeep(page.annotations)
            this.orgPageGraph.inLabels = _.cloneDeep(page.inLabels)
            this.orgPageGraph.outLabels = _.cloneDeep(page.outLabels)
            this.addCellToGraph(page)
            this.scale = this.graph.view.scale
            this.syncScale(this.graph.view.scale)
            this.selectedCells = []
            this.recordSet = { insertRecords: [], updateRecords: [], removeRecords: [] }
            this.recordDelta()
            this.historyStack.clear()
          }
        }).catch((e) => {
          this.$notification.openErrorNotification(`页面刷新失败${e}，请稍后再试。`).logger()
        }).finally(() => {
          this.closeLoading()
        })
      }, this.loadingTimeout)
    },
    reset (ignoreTagKeys) {
      if (ignoreTagKeys && !R.includes(this.tagKey, ignoreTagKeys)) {
        return
      }
      const deltaExist = this.$store.getters.tagDeltaExist(this.tagKey)
      if (deltaExist) {
        const msg = '所有未保存的修改内容会丢失，是否继续？'
        this.$confirm(msg, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
          center: true
        })
          .then(() => this.reloadPage())
      } else {
        this.reloadPage()
      }
    },
    addPageFooter (node) {
      if (node.id === this.pageGraphDto.id) {
        const foot = R.find((cell) => cell.value && /common\/Configuration\/PageInfo/i.test(cell.value.pathId))(R.values(this.graph.model.cells))
        if (!foot) {
          const pathId = `platform/common/Configuration/PageInfo${this.pageSize === 'A4' ? '' : '_A3'}`
          const symbol = this.symbolProtoMap[pathId.toLowerCase()]
          this.instanceSymbol(symbol, 1, this.pageSize === 'A4' ? 802.5 : 1153.5)
        }
      }
    },
    delPageFooter (node) {
      if (node.id === this.pageGraphDto.id) {
        const footCells = R.filter((cell) => cell.value && /common\/Configuration\/PageInfo/i.test(cell.value.pathId))(R.values(this.graph.model.cells)) || []
        if (footCells.length > 0) {
          this.delCells(footCells)
        }
      }
    },
    focus (vfbId) {
      const relateCell = R.find(R.pathEq(['value', 'id'], vfbId))(R.values(this.graph.model.cells))
      if (!relateCell) {
        return
      }
      this.graph.scrollCellToVisible(relateCell, true)
      this.graph.setSelectionCell(relateCell)
    },
    refreshView (pageGraphDto) {
      if (this.pageGraphDto && pageGraphDto && this.pageGraphDto.id === pageGraphDto.id) {
        if (this.activeStatus) {
          this.graph.refresh()
        }
      }
    },
    syncScale (val) {
      this.$vbus.$emit('SYNC_GRAPH_SCALE', val)
    }
  },
  mounted () {
    this.editor = new MyEditor(null, this.debugMode)
    this.graph = this.editor.graph
    this.graph.pageGraphDto = this.pageGraphDto
    this.graph.tagKey = this.tagKey
    this.graph.pageFormat = this.getPageFormat() // 指定背景页的页面格式。
    this.container = this.$refs.graphEditorContainer

    this.graph.init(this.container)
    this.initCanvas()
    this.initFuncAndEventHandler()
    this.initPageGraphDto()

    this.$store.commit('addGraphToContainer', this.graph)
    this.$store.commit('setSelectedMxCell', null)

    this.$vbus.$on('TAGS_DRAG_END', this.setScrollPosition)
    this.$vbus.$on('REFRESH_WORK_AREA', this.refreshDesc)
    this.$vbus.$on('RELOAD_WORK_AREA', this.reset)
    this.$vbus.$on('SAVE_SUCCEEDED', this.refreshDesc)
    this.$vbus.$on('ADD_PAGE_FOOTER', this.addPageFooter)
    this.$vbus.$on('DEL_PAGE_FOOTER', this.delPageFooter)
    this.$vbus.$on('FOCUS', this.focus)
    this.$vbus.$on('PAGE_LEVEL_CHANGED', this.refreshView)
    this.$vbus.$on('RESET_SCALE', this.resetScale)
    this.$vbus.$on('GRAPH_ALIGN', this.graphAlign)
    this.$vbus.$on('UNDO', this.undo)
    this.$vbus.$on('REDO', this.redo)
  },
  beforeDestroy () {
    this.$store.commit('deleteGraphFromContainer', R.indexOf(this.graph, this.graphContainer))
  },
  destroyed () {
    this.$vbus.$off('TAGS_DRAG_END', this.setScrollPosition)
    this.$vbus.$off('REFRESH_WORK_AREA', this.refreshDesc)
    this.$vbus.$off('RELOAD_WORK_AREA', this.reset)
    this.$vbus.$off('SAVE_SUCCEEDED', this.refreshDesc)
    this.$vbus.$off('ADD_PAGE_FOOTER', this.addPageFooter)
    this.$vbus.$off('DEL_PAGE_FOOTER', this.delPageFooter)
    this.$vbus.$off('FOCUS', this.focus)
    this.$vbus.$off('PAGE_LEVEL_CHANGED', this.refreshView)
    this.$vbus.$off('RESET_SCALE', this.resetScale)
    this.$vbus.$off('GRAPH_ALIGN', this.graphAlign)
    this.$vbus.$off('UNDO', this.undo)
    this.$vbus.$off('REDO', this.redo)
  }
}
</script>
<style lang="scss" scoped>
.graphEditorViewContainer {
  z-index: 1;
  position: relative;
  height: 100%;
}
</style>
<style lang="scss">
.graphEditorContainer {
  position: relative;
  z-index: 1;
  height: 100%;
  width: 100%;
  overflow-x: auto;
  overflow-y: auto;
  outline: none;
  background: #f5f5f5;

  .pastePreview {
    position: absolute;
    z-index: 1;
    border: 1px dotted #00a8ff;
  }
}

.flow {
  stroke-dasharray: 8;
  animation: dash 0.5s linear;
  animation-iteration-count: infinite;
}

@keyframes dash {
  to {
    stroke-dashoffset: -16;
  }
}
</style>
