import { overrideMxClient } from './override/overrideMxClient'
import { overrideMxUtils } from './override/util/overrideMxUtils'
import { overrideMxTemporaryCellStates } from './override/view/overrideMxTemporaryCellStates'
import { overrideMxCellState } from './override/view/overrideMxCellState'
import { overrideMxCellEditor } from './override/view/overrideMxCellEditor'
import { overrideMxCellRenderer } from './override/view/overrideMxCellRenderer'
import { overrideMxEdgeStyle } from './override/view/overrideMxEdgeStyle'
import { overrideMxGraphView } from './override/view/overrideMxGraphView'
import { overrideMxGraph } from './override/view/overrideMxGraph'
import { overrideMxLayoutManager } from './override/view/overrideMxLayoutManager'
import { overrideMxOutline } from './override/view/overrideMxOutline'
import { overrideMxPrintPreview } from './override/view/overrideMxPrintPreview'
import { overrideMxStylesheet } from './override/view/overrideMxStylesheet'
import { overrideMxWindow } from './override/util/overrideMxWindow'
import { overrideMxXmlRequest } from './override/util/overrideMxXmlRequest'
import { overrideMxUrlConverter } from './override/util/overrideMxUrlConverter'
import { overrideMxSvgCanvas2D } from './override/util/overrideMxSvgCanvas2D'
import { overrideMxRectangle } from './override/util/overrideMxRectangle'
import { overrideMxPopupMenu } from './override/util/overrideMxPopupMenu'
import { overrideMxImage } from './override/util/overrideMxImage'
import { overrideMxImageExport } from './override/util/overrideMxImageExport'
import { overrideMxGuide } from './override/util/overrideMxGuide'
import { overrideMxEventSource } from './override/util/overrideMxEventSource'
import { overrideMxDragSource } from './override/util/overrideMxDragSource'
import { overrideMxEvent } from './override/util/overrideMxEvent'
import { overrideMxDictionary } from './override/util/overrideMxDictionary'
import { overrideMxConstants } from './override/util/overrideMxConstants'
import { overrideMxClipboard } from './override/util/overrideMxClipboard'
import { overrideMxAbstractCanvas2D } from './override/util/overrideMxAbstractCanvas2D'
import { overrideMxArrowConnector } from './override/shape/overrideMxArrowConnector'
import { overrideMxConnector } from './override/shape/overrideMxConnector'
import { overrideMxLabel } from './override/shape/overrideMxLabel'
import { overrideMxImageShape } from './override/shape/overrideMxImageShape'
import { overrideMxMarker } from './override/shape/overrideMxMarker'
import { overrideMxRectangleShape } from './override/shape/overrideMxRectangleShape'
import { overrideMxShape } from './override/shape/overrideMxShape'
import { overrideMxStencil } from './override/shape/overrideMxStencil'
import { overrideMxSwimlane } from './override/shape/overrideMxSwimlane'
import { overrideMxText } from './override/shape/overrideMxText'
import { overrideMxCell } from './override/model/overrideMxCell'
import { overrideMxDoubleEllipse } from './override/shape/overrideMxDoubleEllipse'
import { overrideMxCylinder } from './override/shape/overrideMxCylinder'
import { overrideMxGraphModel } from './override/model/overrideMxGraphModel'
import { overrideMxGeometry } from './override/model/overrideMxGeometry'
import { overrideMxCellHighlight } from './override/handler/overrideMxCellHighlight'
import { overrideMxCellMarker } from './override/handler/overrideMxCellMarker'
import { overrideMxConnectionHandler } from './override/handler/overrideMxConnectionHandler'
import { overrideMxConstraintHandler } from './override/handler/overrideMxConstraintHandler'
import { overrideMxEdgeHandler } from './override/handler/overrideMxEdgeHandler'
import { overrideMxEdgeSegmentHandler } from './override/handler/overrideMxEdgeSegmentHandler'
import { overrideMxElbowEdgeHandler } from './override/handler/overrideMxElbowEdgeHandler'
import { overrideMxGraphHandler } from './override/handler/overrideMxGraphHandler'
import { overrideMxPanningHandler } from './override/handler/overrideMxPanningHandler'
import { overrideMxPopupMenuHandler } from './override/handler/overrideMxPopupMenuHandler'
import { overrideMxRubberband } from './override/handler/overrideMxRubberband'
import { overrideMxSelectionCellsHandler } from './override/handler/overrideMxSelectionCellsHandler'
import { overrideMxTooltipHandler } from './override/handler/overrideMxTooltipHandler'
import { overrideMxVertexHandler } from './override/handler/overrideMxVertexHandler'
import { overrideMxHandle } from './override/handler/overrideMxHandle'
import { overrideMxObjectCodec } from './override/io/overrideMxObjectCodec'
import { overrideMxCellCodec } from './override/io/overrideMxCellCodec'
import { overrideMxCodec } from './override/io/overrideMxCodec'
import { overrideMxStylesheetCodec } from './override/io/overrideMxStylesheetCodec'
import { overrideMxGraphLayout } from './override/layout/overrideMxGraphLayout'
import { overrideMxCircleLayout } from './override/layout/overrideMxCircleLayout'
import { overrideMxParallelEdgeLayout } from './override/layout/overrideMxParallelEdgeLayout'
import { overrideMxHierarchicalLayout } from './override/layout/hierarchical/overrideMxHierarchicalLayout'
import { overrideMxSwimlaneLayout } from './override/layout/hierarchical/overrideMxSwimlaneLayout'
import { overrideMxCoordinateAssignment } from './override/layout/hierarchical/stage/overrideMxCoordinateAssignment'

const mxOutput = require('mxgraph')({
  // 核心中所有图像url的Basepath，不带斜杠。在mxClient.imageBasePath中指定路径.
  mxImageBasePath: 'mxgraph/images', // 核心中的所有url的Basepath，不带斜杠。在mxClient.basePath中指定路径。
  // 指向的路径一定要是一个可以通过 url 访问的静态资源目录
  mxBasePath: 'mxgraph', // 可选的全局配置变量。切换加载mxGraph和mxEditor中的两个资源文件。
  // 默认值是true。在主线程警告上禁用同步XMLHttpRequest
  mxLoadResources: false
  // mxLoadStylesheets: false, // 指定是否应加载任何样式表。 默认值是true。
  // mxForceIncludes: true, // 可选的全局配置变量，在开发模式下强制加载JavaScript文件。
  // mxResourceExtension: '.txt' // 可选的全局配置变量来指定资源文件的扩展名。
})

/**
 *  引入drawio修改的内容
 */
overrideMxClient(mxOutput)
// util
overrideMxConstants(mxOutput)
overrideMxClipboard(mxOutput)
overrideMxEvent(mxOutput)
overrideMxDictionary(mxOutput)
overrideMxRectangle(mxOutput)
overrideMxUtils(mxOutput)
overrideMxImage(mxOutput)
overrideMxEventSource(mxOutput)
overrideMxAbstractCanvas2D(mxOutput)
overrideMxSvgCanvas2D(mxOutput)
overrideMxImageExport(mxOutput)
overrideMxGuide(mxOutput)
overrideMxPopupMenu(mxOutput)
overrideMxUrlConverter(mxOutput)
overrideMxWindow(mxOutput)
overrideMxXmlRequest(mxOutput)
overrideMxDragSource(mxOutput)
// shape
overrideMxShape(mxOutput)
overrideMxRectangleShape(mxOutput)
overrideMxArrowConnector(mxOutput)
overrideMxConnector(mxOutput)
overrideMxCylinder(mxOutput)
overrideMxDoubleEllipse(mxOutput)
overrideMxImageShape(mxOutput)
overrideMxLabel(mxOutput)
overrideMxMarker(mxOutput)
overrideMxStencil(mxOutput)
overrideMxSwimlane(mxOutput)
overrideMxText(mxOutput)
// model
overrideMxCell(mxOutput)
overrideMxGeometry(mxOutput)
overrideMxGraphModel(mxOutput)
// view
overrideMxCellEditor(mxOutput)
overrideMxCellRenderer(mxOutput)
overrideMxCellState(mxOutput)
overrideMxEdgeStyle(mxOutput)
overrideMxGraph(mxOutput)
overrideMxGraphView(mxOutput)
overrideMxLayoutManager(mxOutput)
overrideMxOutline(mxOutput)
overrideMxTemporaryCellStates(mxOutput)
overrideMxPrintPreview(mxOutput)
overrideMxStylesheet(mxOutput)
// io
overrideMxObjectCodec(mxOutput)
overrideMxCellCodec(mxOutput)
overrideMxCodec(mxOutput)
overrideMxStylesheetCodec(mxOutput)
// layout
overrideMxCircleLayout(mxOutput)
overrideMxGraphLayout(mxOutput)
overrideMxParallelEdgeLayout(mxOutput)
overrideMxHierarchicalLayout(mxOutput)
overrideMxSwimlaneLayout(mxOutput)
overrideMxCoordinateAssignment(mxOutput)
// handler
overrideMxCellHighlight(mxOutput)
overrideMxCellMarker(mxOutput)
overrideMxConnectionHandler(mxOutput)
overrideMxConstraintHandler(mxOutput)
overrideMxGraphHandler(mxOutput)
overrideMxVertexHandler(mxOutput)
overrideMxEdgeHandler(mxOutput)
overrideMxEdgeSegmentHandler(mxOutput)
overrideMxElbowEdgeHandler(mxOutput)
overrideMxHandle(mxOutput)
overrideMxPanningHandler(mxOutput)
overrideMxPopupMenuHandler(mxOutput)
overrideMxRubberband(mxOutput)
overrideMxSelectionCellsHandler(mxOutput)
overrideMxTooltipHandler(mxOutput)
// FIXME 重写结束++++++++++++++++++++++

// fix BUG https://github.com/jgraph/mxgraph/issues/49
Object.keys(mxOutput).forEach((key) => {
  window[key] = mxOutput[key]
})

export const {
  mxCellMarker,
  mxCellState,
  mxCellRenderer,
  mxCellHighlight,
  mxClient,
  mxConnectionHandler,
  mxConstraintHandler,
  mxConstants,
  mxCodec,
  mxDictionary,
  mxEllipse,
  mxEvent,
  mxEventSource,
  mxEventObject,
  mxEdgeHandler,
  mxElbowEdgeHandler,
  mxGraph,
  mxGraphView,
  mxGraphHandler,
  mxGraphModel,
  mxGuide,
  mxHandle,
  mxImage,
  mxImageShape,
  mxLine,
  mxMouseEvent,
  mxPanningHandler,
  mxPoint,
  mxPolyline,
  mxPopupMenu,
  mxPopupMenuHandler,
  mxPrintPreview,
  mxRubberband,
  mxRectangle,
  mxRectangleShape,
  mxResources,
  mxSelectionCellsHandler,
  mxShape,
  mxStencil,
  mxStencilRegistry,
  mxStylesheet,
  mxText,
  mxUtils,
  mxUndoManager,
  mxVertexHandler,
  mxCell,
  mxConnector
} = mxOutput
