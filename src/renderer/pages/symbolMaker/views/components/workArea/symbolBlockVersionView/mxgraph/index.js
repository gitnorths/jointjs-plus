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
