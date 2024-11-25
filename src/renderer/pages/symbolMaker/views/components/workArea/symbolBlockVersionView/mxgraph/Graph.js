import {
  mxCellState,
  mxClient,
  mxConstants,
  mxEvent,
  mxGraph,
  mxGraphHandler,
  mxPrintPreview,
  mxRectangle,
  mxRubberband
} from './index'
import { PAGE_FORMATS } from './constants'
import { GRAPH_EDITOR_CONFIG } from './graphEditorConfig'
import * as R from 'ramda'
import { overrideMxGraphPrototype } from './overrideMxGraphPrototype'
// 重写mxGraph的方法
overrideMxGraphPrototype()

const a4PagePrintConfig = {
  // padding: 0,
  // margin: 25,
  // htmlPageWidth: 1180,
  // htmlPageHeight: 834,
  pageScale: 0.895,
  contentScale: 0.895
}

export class Graph extends mxGraph {
  constructor (container, model, renderHint, stylesheet) {
    super(container, model, renderHint, stylesheet)
    this.readyToPaste = false
    this.defaultPageBorderColor = '#ffffff'

    this.rubberBand = new mxRubberband(this)
    // FIXME 禁用右键菜单
    mxEvent.disableContextMenu(this.container)
    this.initProp()
    // 调用validateCell和validateCellState并使用getBoundingBox更新graphBounds。
    this.view.validate()
    this.sizeDidChange()
    this.center()
    this.container.focus()
  }

  initProp () {
    this.pageVisible = true
    this.pageBreaksVisible = true // 指定是否应在多个页面之间绘制虚线。
    this.pageScale = GRAPH_EDITOR_CONFIG.scale // 指定背景页的比例。
    this.setTolerance(12) // move操作处理为single click的容差
    this.setGridSize(GRAPH_EDITOR_CONFIG.gridSize) // 设置网格尺寸
    this.setAllowDanglingEdges(false) // 禁止浮动连接
    this.setDisconnectOnMove(false)
    this.setAllowLoops(true) // 允许自己连自己
    this.setHtmlLabels(true)
    this.setTooltips(true)
    this.setPanning(true)
    this.setConnectable(true)
    this.setCellsEditable(false) // 允许在画布中修改文字
    this.setCellsCloneable(false)

    // ***********重写方法************
    // 给定的鼠标事件是否应该与网格对齐
    this.isGridEnabledEvent = function (evt) {
      return !evt.ctrlKey
    }
    // 判断cell是否可折叠的
    this.isCellFoldable = function () {
      return false
    }

    this.initGraphHandler()
    this.initPopupMenuHandler()
    this.initConnectionHandler()
    this.initDefaultStyle()
  }

  initPopupMenuHandler () {
    // 右键菜单
    this.popupMenuHandler.autoExpand = true
    this.popupMenuHandler.factoryMethod = function (menu, cell) {
      // TODO
    }
  }

  initGraphHandler () {
    this.graphHandler.shouldRemoveCellsFromParent = function (parent, cells, evt) {
      for (let i = 0; i < cells.length; i++) {
        if (this.graph.getModel().isVertex(cells[i])) {
          const geo = this.graph.getCellGeometry(cells[i])
          if (geo != null && geo.relative) {
            return false
          }
        }
      }
      return mxGraphHandler.prototype.shouldRemoveCellsFromParent.apply(this, arguments)
    }
  }

  initConnectionHandler () {
    this.connectionHandler.createEdgeState = function () {
      const edge = this.graph.createEdge(null, null, null, null, null)
      return new mxCellState(this.graph.view, edge, this.graph.getCellStyle(edge))
    }
    this.connectionHandler.isConnectableCell = function () {
      return false
    }
  }

  initDefaultStyle () {
    // 默认连线样式 draw.io: edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;
    const defaultEdgeStyle = this.getStylesheet().getDefaultEdgeStyle()
    defaultEdgeStyle[mxConstants.STYLE_EDGE] = null// 斜线
    defaultEdgeStyle[mxConstants.STYLE_CURVED] = null
    defaultEdgeStyle[mxConstants.STYLE_NOEDGESTYLE] = null
    defaultEdgeStyle[mxConstants.STYLE_ORTHOGONAL_LOOP] = 1
    defaultEdgeStyle[mxConstants.STYLE_JETTY_SIZE] = 'auto'
    defaultEdgeStyle[mxConstants.STYLE_ENDARROW] = 'none'
    defaultEdgeStyle[mxConstants.STYLE_STROKECOLOR] = '#000000'
    this.getStylesheet().putDefaultEdgeStyle(defaultEdgeStyle)
    // Changes some default colors
    const style = this.getStylesheet().getDefaultVertexStyle()
    style[mxConstants.STYLE_FILLCOLOR] = '#ffffff'
    style[mxConstants.STYLE_STROKECOLOR] = '#000000'
    style[mxConstants.STYLE_STROKEWIDTH] = '1'
    style[mxConstants.STYLE_FONTCOLOR] = '#000000'
    style[mxConstants.STYLE_FONTSIZE] = '12'
    style[mxConstants.STYLE_FONTSTYLE] = 1
    style[mxConstants.STYLE_FONTFAMILY] = 'Georgia'
    this.getStylesheet().putDefaultVertexStyle(style)
  }

  /**
   * 获取Graph界面的大小
   */
  getPageSize () {
    return new mxRectangle(0, 0, this.pageFormat.width * this.pageScale, this.pageFormat.height * this.pageScale)
  }

  /**
   * 获取Graph界面的布局
   */
  getPageLayout () {
    const bounds = this.getGraphBounds()
    if (R.equals(bounds.width, 0) || R.equals(bounds.height, 0)) {
      return new mxRectangle(0, 0, 1, 1)
    }

    const size = this.getPageSize()
    const scale = this.view.scale
    const translate = this.view.translate

    const x0 = Math.floor(Math.ceil(bounds.x / scale - translate.x) / size.width)
    const y0 = Math.floor(Math.ceil(bounds.y / scale - translate.y) / size.height)
    const w0 = Math.ceil((Math.floor((bounds.x + bounds.width) / scale) - translate.x) / size.width) - x0
    const h0 = Math.ceil((Math.floor((bounds.y + bounds.height) / scale) - translate.y) / size.height) - y0
    return new mxRectangle(x0, y0, w0, h0)
  }

  /**
   * 打开打印预览页面
   */
  createPrintPreview (win) {
    let scale = 1 / this.pageScale
    const printScale = a4PagePrintConfig.pageScale
    let pageFormat = this.pageFormat || PAGE_FORMATS.a4.format

    pageFormat = mxRectangle.fromRectangle(pageFormat)
    pageFormat.width = Math.ceil(pageFormat.width * printScale)
    pageFormat.height = Math.ceil(pageFormat.height * printScale)
    scale *= printScale
    const preview = new mxPrintPreview(this, scale, pageFormat, 0, 0, 0)

    // preview.border = 1
    // preview.borderColor = '#000000'
    preview.scale = a4PagePrintConfig.contentScale
    preview.printBackgroundImage = true
    preview.autoOrigin = false
    preview.backgroundColor = '#ececec'
    preview.printBackgroundImage = true
    preview.open(null, win)
    return preview
  }

  /**
   * 打印
   */
  print (win) {
    const preview = this.createPrintPreview(win)

    if (preview && preview.wnd) {
      const printFn = function () {
        preview.wnd.focus()
        preview.wnd.print()
      }

      win.setTimeout(printFn, 500)
    }
  }

  /**
   * 重置滚动条
   */
  // resetScrollbars () {
  //   const pad = this.getPagePadding();
  //   const bounds = this.getGraphBounds();
  //   const container = this.container;
  //
  //   container.scrollTop = Math.floor(pad.y) - 1;
  //   container.scrollLeft = Math.floor(Math.min(pad.x, (container.scrollWidth - container.clientWidth) / 2)) - 1;
  //
  //   if (bounds.width > 0 && bounds.height > 0) {
  //     if (bounds.x > container.scrollLeft + container.clientWidth * 0.9) {
  //       container.scrollLeft = Math.min(bounds.x + bounds.width - container.clientWidth, bounds.x - 10);
  //     }
  //     if (bounds.y > container.scrollTop + container.clientHeight * 0.9) {
  //       container.scrollTop = Math.min(bounds.y + bounds.height - container.clientHeight, bounds.y - 10);
  //     }
  //   }
  // }

  /**
   * Returns true if fast zoom preview should be used.
   */
  isFastZoomEnabled () {
    return !mxClient.NO_FO && !mxClient.IS_EDGE && !this.useCssTransforms && this.isCssTransformsSupported()
  }

  /**
   * Only foreignObject supported for now (no IE11). Safari disabled as it ignores
   * overflow visible on foreignObject in negative space (lightbox and viewer).
   * Check the following test case on page 1 before enabling this in production:
   * https://devhost.jgraph.com/git/drawio/etc/embed/sf-math-fo-clipping.html?dev=1
   */
  isCssTransformsSupported () {
    return this.dialect === mxConstants.DIALECT_SVG && !mxClient.NO_FO && !mxClient.IS_SF
  }

  /**
   * Returns true if the given mouse wheel event should be used for zooming. This
   * is invoked if no dialogs are showing and returns true with Alt or Control
   * (or cmd in macOS only) is pressed.
   */
  isZoomWheelEvent (evt) {
    return mxEvent.isAltDown(evt) || (mxEvent.isMetaDown(evt) && mxClient.IS_MAC) || mxEvent.isControlDown(evt)
  }

  /**
   * Returns true if the given scroll wheel event should be used for scrolling.
   */
  isScrollWheelEvent (evt) {
    return !this.isZoomWheelEvent(evt)
  }
}
