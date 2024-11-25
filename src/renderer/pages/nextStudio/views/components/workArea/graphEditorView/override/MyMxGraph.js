import {
  mxCellHighlight,
  mxClient,
  mxCodec,
  mxConnector,
  mxConstants,
  mxConstraintHandler,
  mxDictionary,
  mxEdgeHandler,
  mxElbowEdgeHandler,
  mxEllipse,
  mxEvent,
  mxEventObject,
  mxGraph,
  mxGraphModel,
  mxImage,
  mxImageShape,
  mxPoint,
  mxPolyline,
  mxRectangle,
  mxRectangleShape,
  mxResources,
  mxSelectionCellsHandler,
  mxShape,
  mxStencil,
  mxStylesheet,
  mxText,
  mxUtils
} from '@/renderer/common/mxgraph'
import * as Base64 from 'Base64'
import { GRAPH_EDITOR_CONFIG } from '../graphEditorConfig'
import { MyMxRubberband } from './MyMxRubberband'
import { MyMxConnectionHandler } from './MyMxConnectionHandler'
import { MyMxGraphHandler } from './MyMxGraphHandler'
import { MyMxPanningHandler } from './MyMxPanningHandler'
import { MyMxPopupMenuHandler } from './MyMxPopupMenuHandler'
import { MyMxGraphView } from './MyMxGraphView'
import { MyMxCellRenderer } from './MyMxCellRenderer'
import { MyMxVertexHandler } from './MyMxVertexHandler'
import { MyEditor } from './MyEditor'
import { createHint, formatHintText } from './common'
// Overrides global constants
mxConstants.SHADOW_OPACITY = 0.25
mxConstants.SHADOWCOLOR = '#000000'
mxConstants.VML_SHADOWCOLOR = '#d0d0d0'

mxCodec.allowlist = ['mxStylesheet', 'Array', 'mxGraphModel',
  'mxCell', 'mxGeometry', 'mxRectangle', 'mxPoint',
  'mxChildChange', 'mxRootChange', 'mxTerminalChange',
  'mxValueChange', 'mxStyleChange', 'mxGeometryChange',
  'mxCollapseChange', 'mxVisibleChange', 'mxCellAttributeChange']
// mxGraph.prototype.pageBreakColor = '#c0c0c0'
// mxGraph.prototype.pageScale = 1
// // Letter page format is default in US, Canada and Mexico
// (function () {
//     try {
//         if (navigator != null && navigator.language != null) {
//             var lang = navigator.language.toLowerCase();
//             mxGraph.prototype.pageFormat = (lang === 'en-us' || lang === 'en-ca' || lang === 'es-mx') ?
//                 mxConstants.PAGE_FORMAT_LETTER_PORTRAIT : mxConstants.PAGE_FORMAT_A4_PORTRAIT;
//         }
//     } catch (e) {
//         // ignore
//     }
// })();

// Matches label positions of mxGraph 1.x
mxText.prototype.baseSpacingTop = 5
mxText.prototype.baseSpacingBottom = 1

// Keeps edges between relative child cells inside parent
mxGraphModel.prototype.ignoreRelativeEdgeParent = false

// Sets colors for handles
mxConstants.HANDLE_FILLCOLOR = '#29b6f2' // '#99ccff'
mxConstants.HANDLE_STROKECOLOR = '#0088cf'
mxConstants.VERTEX_SELECTION_COLOR = '#00a8ff'
mxConstants.OUTLINE_COLOR = '#00a8ff'
mxConstants.OUTLINE_HANDLE_FILLCOLOR = '#99ccff'
mxConstants.OUTLINE_HANDLE_STROKECOLOR = '#00a8ff'
mxConstants.CONNECT_HANDLE_FILLCOLOR = '#cee7ff'
mxConstants.EDGE_SELECTION_COLOR = '#00a8ff'
mxConstants.DEFAULT_VALID_COLOR = '#00a8ff'
mxConstants.LABEL_HANDLE_FILLCOLOR = '#cee7ff'
mxConstants.GUIDE_COLOR = '#0088cf'
mxConstants.HIGHLIGHT_STROKEWIDTH = 5
mxConstants.HIGHLIGHT_OPACITY = 50
mxConstants.HIGHLIGHT_SIZE = 5

// overrideMxConstants start
mxConstants.VERTEX_SELECTION_STROKEWIDTH = 2
mxConstants.DEFAULT_HOTSPOT = 1
mxConstants.LABEL_HANDLE_SIZE = 6 // label小方框的大小默认是4
mxConstants.CURSOR_LABEL_HANDLE = 'move'
// overrideMxConstants end

/**
 * Function: repaint
 *
 * Updates the highlight after a change of the model or view.
 */
mxCellHighlight.prototype.getStrokeWidth = function (state) {
  let s = this.strokeWidth

  if (this.graph.useCssTransforms) {
    s /= this.graph.currentScale
  }

  return s
}
mxCellHighlight.prototype.keepOnTop = true

/**
 * Overrides painting the actual shape for taking into account jump style.
 */
const mxConnectorPaintLine = mxConnector.prototype.paintLine
mxConnector.prototype.paintLine = function (c, absPts, rounded) {
  // Required for checking dirty state
  this.routedPoints = (this.state != null) ? this.state.routedPoints : null

  if (this.outline || this.state == null || this.style == null ||
    this.state.routedPoints == null || this.state.routedPoints.length === 0) {
    mxConnectorPaintLine.call(this, c, absPts, rounded)
  } else {
    const arcSize = mxUtils.getValue(this.style, mxConstants.STYLE_ARCSIZE, mxConstants.LINE_ARCSIZE) / 2
    const size = (parseInt(mxUtils.getValue(this.style, 'jumpSize', MyMxGraph.defaultJumpSize)) - 2) / 2 + this.strokewidth
    const style = mxUtils.getValue(this.style, 'jumpStyle', 'none')
    let moveTo = true
    let last = null
    let len = null
    let pts = []
    let n = null
    c.begin()

    for (let i = 0; i < this.state.routedPoints.length; i++) {
      const rpt = this.state.routedPoints[i]
      let pt = new mxPoint(rpt.x / this.scale, rpt.y / this.scale)

      // Takes first and last point from passed-in array
      if (i === 0) {
        pt = absPts[0]
      } else if (i === this.state.routedPoints.length - 1) {
        pt = absPts[absPts.length - 1]
      }

      let done = false

      // Type 1 is an intersection
      if (last != null && rpt.type === 1) {
        // Checks if next/previous points are too close
        const next = this.state.routedPoints[i + 1]
        const dx = next.x / this.scale - pt.x
        const dy = next.y / this.scale - pt.y
        const dist = dx * dx + dy * dy

        if (n == null) {
          n = new mxPoint(pt.x - last.x, pt.y - last.y)
          len = Math.sqrt(n.x * n.x + n.y * n.y)

          if (len > 0) {
            n.x = n.x * size / len
            n.y = n.y * size / len
          } else {
            n = null
          }
        }

        if (dist > size * size && len > 0) {
          const dx = last.x - pt.x
          const dy = last.y - pt.y
          const dist = dx * dx + dy * dy

          if (dist > size * size) {
            const p0 = new mxPoint(pt.x - n.x, pt.y - n.y)
            const p1 = new mxPoint(pt.x + n.x, pt.y + n.y)
            pts.push(p0)

            this.addPoints(c, pts, rounded, arcSize, false, null, moveTo)

            let f = (Math.round(n.x) < 0 || (Math.round(n.x) === 0 && Math.round(n.y) <= 0)) ? 1 : -1
            moveTo = false

            if (style === 'sharp') {
              c.lineTo(p0.x - n.y * f, p0.y + n.x * f)
              c.lineTo(p1.x - n.y * f, p1.y + n.x * f)
              c.lineTo(p1.x, p1.y)
            } else if (style === 'line') {
              c.moveTo(p0.x + n.y * f, p0.y - n.x * f)
              c.lineTo(p0.x - n.y * f, p0.y + n.x * f)
              c.moveTo(p1.x - n.y * f, p1.y + n.x * f)
              c.lineTo(p1.x + n.y * f, p1.y - n.x * f)
              c.moveTo(p1.x, p1.y)
            } else if (style === 'arc') {
              f *= 1.3
              c.curveTo(p0.x - n.y * f, p0.y + n.x * f,
                p1.x - n.y * f, p1.y + n.x * f,
                p1.x, p1.y)
            } else {
              c.moveTo(p1.x, p1.y)
              moveTo = true
            }

            pts = [p1]
            done = true
          }
        }
      } else {
        n = null
      }

      if (!done) {
        pts.push(pt)
        last = pt
      }
    }

    this.addPoints(c, pts, rounded, arcSize, false, null, moveTo)
    c.stroke()
  }
}

/**
 * Overrides paint to add flowAnimation style.
 */
mxShape.prototype.isFlowAnimationEnabled = function () {
  return this.state != null && this.state.view.graph.enableFlowAnimation &&
    this.state.view.graph.model.isEdge(this.state.cell) &&
    mxUtils.getValue(this.state.style, 'flowAnimation', '0') === '1'
}

mxShape.prototype.getFlowAnimationPath = function () {
  const paths = (this.node != null) ? this.node.getElementsByTagName('path') : null

  if (paths != null) {
    // Returns the first visible path
    for (let i = 0; i < paths.length; i++) {
      if (paths[i].getAttribute('visibility') !== 'hidden') {
        return paths[i]
      }
    }
  }

  return null
}

mxShape.prototype.addFlowAnimationToShape = function () {
  if (this.state != null) {
    this.state.view.graph.addFlowAnimationToNode(
      this.getFlowAnimationPath(), this.state.style, this.state.view.scale,
      this.state.view.graph.addFlowAnimationStyle())
  }
}

const mxShapePaint = mxShape.prototype.paint
mxShape.prototype.paint = function (canvas) {
  mxShapePaint.call(this, canvas)

  if (this.isFlowAnimationEnabled()) {
    this.addFlowAnimationToShape()
  }
}

// Hook for custom constraints
mxShape.prototype.getConstraints = function (style, w, h) {
  return null
}

// Override for clipSvg style
mxImageShape.prototype.getImageDataUri = function () {
  let src = String(this.image)

  if (src.substring(0, 26) === 'data:image/svg+xml;base64,' && this.style != null &&
    mxUtils.getValue(this.style, 'clipSvg', '0') === '1') {
    if (this.clippedSvg == null || this.clippedImage !== src) {
      this.clippedSvg = MyMxGraph.clipSvgDataUri(src, true)
      this.clippedImage = src
    }

    src = this.clippedSvg
  }

  return src
}

const mxResourcesGet = mxResources.get
mxResources.get = function (key, params, defaultValue) {
  if (defaultValue == null) {
    defaultValue = key
  }

  return mxResourcesGet.call(this, key, params, defaultValue)
}

// Overrides highlight shape for connection points
mxConstraintHandler.prototype.createHighlightShape = function () {
  const hl = new mxEllipse(null, this.highlightColor, this.highlightColor, 0)
  hl.opacity = mxConstants.HIGHLIGHT_OPACITY

  return hl
}

const mxConstraintHandlerUpdate = mxConstraintHandler.prototype.update
mxConstraintHandler.prototype.update = function (me, source) {
  if (this.isKeepFocusEvent(me) || !mxEvent.isAltDown(me.getEvent())) {
    mxConstraintHandlerUpdate.apply(this, arguments)
  } else {
    this.reset()
  }
}

// pointImage = new mxImage('icon/point.gif', 10, 10)
// mxConstraintHandler.prototype.pointImage = MyMxGraph.createSvgImage(5, 5,
//   '<path d="m 0 0 L 5 5 M 0 5 L 5 0" stroke-width="2" style="stroke-opacity:0.4" stroke="#ffffff"/>' +
//   '<path d="m 0 0 L 5 5 M 0 5 L 5 0" stroke="' + '#29b6f2' + '"/>')

// Enables snapping to off-grid terminals for edge waypoints
mxEdgeHandler.prototype.snapToTerminals = true
mxEdgeHandler.prototype.parentHighlightEnabled = true
mxEdgeHandler.prototype.dblClickRemoveEnabled = true
mxEdgeHandler.prototype.straightRemoveEnabled = true
mxEdgeHandler.prototype.virtualBendsEnabled = true
mxEdgeHandler.prototype.mergeRemoveEnabled = true
mxEdgeHandler.prototype.manageLabelHandle = true
mxEdgeHandler.prototype.outlineConnect = true
/**
 * Creates the shape used to draw the selection border.
 */
const edgeHandlerCreateParentHighlightShape = mxEdgeHandler.prototype.createParentHighlightShape
mxEdgeHandler.prototype.createParentHighlightShape = function (bounds) {
  const shape = edgeHandlerCreateParentHighlightShape.call(this, bounds)

  shape.stroke = '#C0C0C0'
  shape.strokewidth = 1

  return shape
}

/**
 * Adds handle padding for editing cells and exceptions.
 */
const edgeHandlerRefresh = mxEdgeHandler.prototype.refresh
mxEdgeHandler.prototype.refresh = function () {
  edgeHandlerRefresh.call(this)

  const link = this.graph.getLinkForCell(this.state.cell)
  const links = this.graph.getLinksForState(this.state)
  this.updateLinkHint(link, links)
}
/**
 * Hides link hint while moving cells.
 */
const edgeHandlerMouseMove = mxEdgeHandler.prototype.mouseMove
mxEdgeHandler.prototype.mouseMove = function (sender, me) {
  edgeHandlerMouseMove.call(this, sender, me)

  if (this.linkHint != null && this.linkHint.style.display !== 'none' &&
    this.graph.graphHandler != null && this.graph.graphHandler.first != null) {
    this.linkHint.style.display = 'none'
  }
}

/**
 * Hides link hint while moving cells.
 */
const edgeHandlerMouseUp = mxEdgeHandler.prototype.mouseUp
mxEdgeHandler.prototype.mouseUp = function (sender, me) {
  edgeHandlerMouseUp.call(this, sender, me)

  if (this.linkHint != null && this.linkHint.style.display === 'none') {
    this.linkHint.style.display = ''
  }
}

/**
 * Updates the hint for the current operation.
 */
mxEdgeHandler.prototype.updateHint = function (me, point, edge) {
  if (this.hint == null) {
    this.hint = createHint()
    this.state.view.graph.container.appendChild(this.hint)
  }

  const t = this.graph.view.translate
  const s = this.graph.view.scale
  const x = this.roundLength(point.x / s - t.x)
  const y = this.roundLength(point.y / s - t.y)
  const unit = this.graph.view.unit

  this.hint.innerHTML = formatHintText(x, unit) + ', ' + formatHintText(y, unit)
  this.hint.style.visibility = 'visible'

  if (edge != null) {
    edge.view.updateEdgeBounds(edge)
    this.hint.innerHTML += ' (' + ((unit === mxConstants.POINTS)
      ? Math.round(edge.length / s)
      : formatHintText(
        edge.length / s, unit)) + ')'
  }

  if (this.isSource || this.isTarget) {
    if (this.constraintHandler != null &&
      this.constraintHandler.currentConstraint != null &&
      this.constraintHandler.currentFocus != null) {
      const pt = this.constraintHandler.currentConstraint.point
      this.hint.innerHTML = '[' + Math.round(pt.x * 100) + '%, ' + Math.round(pt.y * 100) + '%]'
    } else if (this.marker.hasValidState()) {
      this.hint.style.visibility = 'hidden'
    }
  }

  this.hint.style.left = Math.round(me.getGraphX() - this.hint.clientWidth / 2) + 'px'
  this.hint.style.top = (Math.max(me.getGraphY(), point.y) + MyEditor.hintOffset) + 'px'

  if (this.linkHint != null) {
    this.linkHint.style.display = 'none'
  }
}

// Disables adding waypoints if shift is pressed
mxEdgeHandler.prototype.isAddVirtualBendEvent = function (me) {
  return !mxEvent.isShiftDown(me.getEvent())
}

// Disables custom handles if shift is pressed
mxEdgeHandler.prototype.isCustomHandleEvent = function (me) {
  return !mxEvent.isShiftDown(me.getEvent())
}
// Timer-based activation of outline connect in connection handler
let startTime = new Date().getTime()
let timeOnTarget = 0

const mxEdgeHandlerUpdatePreviewState = mxEdgeHandler.prototype.updatePreviewState
mxEdgeHandler.prototype.updatePreviewState = function (edge, point, terminalState, me) {
  mxEdgeHandlerUpdatePreviewState.call(this, edge, point, terminalState, me)

  if (terminalState !== this.currentTerminalState) {
    startTime = new Date().getTime()
    timeOnTarget = 0
  } else {
    timeOnTarget = new Date().getTime() - startTime
  }

  this.currentTerminalState = terminalState
}

// Timer-based outline connect
const mxEdgeHandlerIsOutlineConnectEvent = mxEdgeHandler.prototype.isOutlineConnectEvent
mxEdgeHandler.prototype.isOutlineConnectEvent = function (me) {
  if (mxEvent.isShiftDown(me.getEvent()) && mxEvent.isAltDown(me.getEvent())) {
    return false
  } else {
    return (this.currentTerminalState != null && me.getState() === this.currentTerminalState && timeOnTarget > 2000) ||
      ((this.currentTerminalState == null || mxUtils.getValue(this.currentTerminalState.style, 'outlineConnect', '1') !== '0') &&
        mxEdgeHandlerIsOutlineConnectEvent.call(this, me))
  }
}

// Shows secondary handle for fixed connection points
mxEdgeHandler.prototype.createHandleShape = function (index, virtual, target) {
  const source = index != null && index === 0
  const terminalState = this.state.getVisibleTerminalState(source)
  const c = (index != null && (index === 0 || index >= this.state.absolutePoints.length - 1 ||
    (this.constructor === mxElbowEdgeHandler && index === 2)))
    ? this.graph.getConnectionConstraint(this.state, terminalState, source)
    : null
  const pt = (c != null) ? this.graph.getConnectionPoint(this.state.getVisibleTerminalState(source), c) : null
  const img = (pt != null)
    ? (!target ? this.fixedHandleImage : this.endFixedHandleImage)
    : ((c != null && terminalState != null)
      ? (!target ? this.terminalHandleImage : this.endTerminalHandleImage)
      : (!target ? this.handleImage : this.endHandleImage))

  if (img != null) {
    const shape = new mxImageShape(new mxRectangle(0, 0, img.width, img.height), img.src)

    // Allows HTML rendering of the images
    shape.preserveImageAspect = false

    return shape
  } else {
    let s = mxConstants.HANDLE_SIZE

    if (this.preferHtml) {
      s -= 1
    }

    return new mxRectangleShape(new mxRectangle(0, 0, s, s), mxConstants.HANDLE_FILLCOLOR, mxConstants.HANDLE_STROKECOLOR)
  }
}

mxEdgeHandler.prototype.updateLinkHint = MyMxVertexHandler.prototype.updateLinkHint

// Extends constraint handler
const edgeHandlerCreateConstraintHandler = mxEdgeHandler.prototype.createConstraintHandler
mxEdgeHandler.prototype.createConstraintHandler = function () {
  const handler = edgeHandlerCreateConstraintHandler.call(this)

  // Disables connection points
  handler.isEnabled = mxUtils.bind(this, function () {
    return this.state.view.graph.connectionHandler.isEnabled()
  })

  return handler
}
const edgeHandlerRedrawHandles = mxEdgeHandler.prototype.redrawHandles
mxEdgeHandler.prototype.redrawHandles = function () {
  // Workaround for special case where handler
  // is reset before this which leads to a NPE
  if (this.marker != null) {
    edgeHandlerRedrawHandles.call(this)

    if (this.state != null && this.linkHint != null) {
      let b = this.state

      if (this.state.text != null && this.state.text.bounds != null) {
        b = new mxRectangle(b.x, b.y, b.width, b.height)
        b.add(this.state.text.bounds)
      }

      this.linkHint.style.left = Math.max(0, Math.round(b.x + (b.width - this.linkHint.clientWidth) / 2)) + 'px'
      this.linkHint.style.top = Math.round(b.y + b.height + MyEditor.hintOffset) + 'px'
      this.linkHint.style.display = (this.graph.getSelectionCount() > 1) ? 'none' : ''
    }
  }
}
const edgeHandlerReset = mxEdgeHandler.prototype.reset
mxEdgeHandler.prototype.reset = function () {
  edgeHandlerReset.call(this)

  if (this.linkHint != null) {
    this.linkHint.style.visibility = ''
  }
}

const edgeHandlerDestroy = mxEdgeHandler.prototype.destroy
mxEdgeHandler.prototype.destroy = function () {
  edgeHandlerDestroy.call(this)

  if (this.linkHint != null) {
    this.linkHint.parentNode.removeChild(this.linkHint)
    this.linkHint = null
  }

  if (this.changeHandler != null) {
    this.graph.getModel().removeListener(this.changeHandler)
    this.graph.getSelectionModel().removeListener(this.changeHandler)
    this.changeHandler = null
  }
}
/*
*
 * Adds support for placeholders in text elements of shapes.
 */
//   mxStencil.prototype.evaluateTextAttribute = function (node, attribute, shape) {
//     const key = this.evaluateAttribute(node, attribute, shape)
//     // loc:0表示直接显示key
//     // loc:1表示key代表变量的路径，需要从cellValue获取真实的值
//     const loc = node.getAttribute('localized')
//     // showValue : 0 表示不显示；其他值表示需要显示
//     const showValue = node.getAttribute('showText')
//     // valueList 有值表示key需要从值列表(valueList)获取真实值
//     const valueListPathStr = node.getAttribute('valueList')
//
//     // showValue : 0 表示不key
//     if (R.equals('0', R.toString(showValue))) {
//       return ''
//     }
//     // 不存在cell，返回key
//     const cell = R.path(['state', 'cell'])(shape)
//     if (!cell) {
//       return key
//     }
//     const cellValue = cell.value
//     // 不存在cellValue
//     if (!cellValue) {
//       // 符号预览图需要显示变量名
//       if (R.equals('1', loc) || mxStencil.defaultLocalized) {
//         // 当loc=1时，key形如inputs.xxx.alias,outputs.xxx.name的格式，
//         // 需要从key中提取变量名xxx用于显示
//         const firstKey = key.split(',')[0]
//         const attrName = firstKey.replace(/^(inputs|outputs|params)\./, '').replace(/\.(name|alias)$/, '')
//         if (/\.listArrSetValues\..*_\d+\.value$/.test(attrName)) {
//           // 连闭锁
//           return '---'
//         }
//         return attrName
//       } else {
//         return key
//       }
//     }
//     // cellValue有值
//     if (R.equals('1', loc) || mxStencil.defaultLocalized) {
//       // 形如 inputs.xxx.alias,inputs.xxx.name的格式转换为[[inputs,xxx,alias],[inputs,xxx,name]]
//       const optionalAttrPaths = []
//       const optionalKeyArr = key.split(',')
//       for (const optionalKey of optionalKeyArr) {
//         const dotArr = optionalKey.split('.')
//         if (/^(inputs|outputs|params)\..+\.(alias|name)$/.test(optionalKey)) {
//           const naArr = []
//           const newArr = []
//           newArr.push(dotArr[0])
//           const end = /(\._\d+)$/.test(optionalKey) ? dotArr.length - 2 : dotArr.length - 1
//           for (let i = 1; i < end; i++) {
//             naArr.push(dotArr[i])
//           }
//           newArr.push(naArr.join('.'))
//           if (/(\._\d+)$/.test(optionalKey)) {
//             newArr.push(dotArr[dotArr.length - 2])
//           }
//           newArr.push(dotArr[dotArr.length - 1])
//
//           optionalAttrPaths.push(newArr)
//         } else {
//           optionalAttrPaths.push(dotArr)
//         }
//       }
//       let attrStr = ''
//       for (const attrPathArr of optionalAttrPaths) {
//         let attrVal = cellValue
//         for (const attrKey of attrPathArr) {
//           if (attrVal instanceof Array) {
//             attrVal = R.find(R.propEq(attrKey, 'name'))(attrVal)
//           } else {
//             attrVal = R.prop(attrKey)(attrVal)
//           }
//         }
//         if (attrVal !== null && attrVal !== undefined && attrVal !== '') {
//           // 如果存在值列表，形如空格分隔的字符串"50hz 60hz"则需要转换为值列表的真实值
//           if (valueListPathStr) {
//             const valueListPaths = valueListPathStr.split('.')
//             let valueListStr = cellValue
//             for (const attrKey of valueListPaths) {
//               if (valueListStr instanceof Array) {
//                 valueListStr = R.find(R.propEq(attrKey, 'name'))(valueListStr)
//               } else {
//                 valueListStr = R.prop(attrKey)(valueListStr)
//               }
//             }
//             const valueListArr = R.is(String, valueListStr) ? valueListStr.split(' ') : []
//             const index = Number(attrVal)
//             if (R.is(Number, index) && R.isNotEmpty(valueListArr)) {
//               attrStr = valueListArr[index]
//             } else {
//               attrStr = attrVal
//             }
//           } else {
//             attrStr = attrVal
//           }
//           break
//         }
//       }
//       return attrStr
//     }
//     return key
//   }

const mxStencilEvaluateTextAttribute = mxStencil.prototype.evaluateTextAttribute

mxStencil.prototype.evaluateTextAttribute = function (node, attribute, shape) {
  let result = mxStencilEvaluateTextAttribute.call(this, node, attribute, shape)
  const placeholders = node.getAttribute('placeholders')

  if (placeholders === '1' && shape.state != null) {
    result = shape.state.view.graph.replacePlaceholders(shape.state.cell, result)
  }

  return result
}

/**
 * Shows handle for table instead of rows and cells.
 */
const selectionCellsHandlerGetHandledSelectionCells = mxSelectionCellsHandler.prototype.getHandledSelectionCells
mxSelectionCellsHandler.prototype.getHandledSelectionCells = function () {
  const cells = selectionCellsHandlerGetHandledSelectionCells.apply(this, arguments)
  const dict = new mxDictionary()
  const model = this.graph.model
  const result = []

  function addCell (cell) {
    if (!dict.get(cell)) {
      dict.put(cell, true)
      result.push(cell)
    }
  }

  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i]

    if (this.graph.isTableCell(cell)) {
      addCell(model.getParent(model.getParent(cell)))
    } else if (this.graph.isTableRow(cell)) {
      addCell(model.getParent(cell))
    }

    addCell(cell)
  }

  return result
}

export class MyMxGraph extends mxGraph {
  constructor (container, debugMode = false, model, renderHint, stylesheet) {
    /**
     * mxgraph的构造函数会调用createXXX方法完成对象的初始化，此类方法通过override的方式传入自定义对象
     * createCellRenderer
     * createSelectionModel
     * createStylesheet
     * createGraphView
     * createHandlers
     *    createTooltipHandler
     *    createSelectionCellsHandler
     *    createConnectionHandler
     *    createGraphHandler
     *    createPanningHandler
     *    createPopupMenuHandler
     * createCellEditor
     * mxgraphModel通过构造参数传入
     */
    // FIXME 是否直接构造mxgraphModel对象可以直接完成cell的初始化？待验证
    // FIXME 是否可以直接构造styleSheet对象，或者重载createStylesheet方法的方式，而不是调用initDefaultStyle
    // maximumGraphBounds 能否约束A4范围待验证
    // allowNegativeCoordinates 是否要约束正坐标
    super(container, model || new mxGraphModel(), renderHint, stylesheet)
    this.pageBreakColor = '#c0c0c0'
    this.pageScale = 1 // 指定背景页的比例。
    this.pageFormat = mxConstants.PAGE_FORMAT_A4_PORTRAIT

    this.domainUrl = ''
    this.domainPathUrl = ''
    // Graph.js start
    this.readyToPaste = false
    this.defaultPageBorderColor = '#ffffff'
    this.debugMode = false

    this.rubberBand = new MyMxRubberband(this)

    // FIXME 禁用右键菜单
    // mxEvent.disableContextMenu(this.container)

    this.pageVisible = true
    this.pageBreaksVisible = true // 指定是否应在多个页面之间绘制虚线。
    this.setTolerance(12) // move操作处理为single click的容差
    this.setGridSize(GRAPH_EDITOR_CONFIG.gridSize) // 设置网格尺寸
    this.setAllowDanglingEdges(true) // 禁止浮动连接
    this.setDisconnectOnMove(false)
    this.setAllowLoops(true) // 允许自己连自己
    this.setHtmlLabels(true)
    this.setTooltips(true)
    this.setPanning(true)
    this.setConnectable(true)
    this.setCellsEditable(false)
    this.setCellsCloneable(false)

    this.setDebugMode(debugMode)
    // 调用validateCell和validateCellState并使用getBoundingBox更新graphBounds。

    // FIXME 这些步骤是否必须
    // this.view.revalidate()
    // this.view.validate()
    // this.sizeDidChange()
    // this.refresh()
    // this.center()
    // this.container.focus()
    // Graph.js end
    /**
     * Overrides the background color and paints a transparent background.
     */
    this.transparentBackground = true
    /**
     * Specifies if the app should run in chromeless mode. Default is false.
     * This default is only used if the constructor argument is null.
     */
    this.lightbox = false
    this.defaultPageBackgroundColor = '#ffffff'
    /**
     * Whether to use diagramBackgroundColor for no page views.
     */
    this.enableDiagramBackground = false
    this.diagramBackgroundColor = '#f0f0f0'
    /**
     * Specifies the size of the size for "tiles" to be used for a graph with
     * scrollbars but no visible background page. A good value is large
     * enough to reduce the number of repaints that is caused for auto-
     * translation, which depends on this value, and small enough to give
     * a small empty buffer around the graph. Default is 400x400.
     */
    this.scrollTileSize = new mxRectangle(0, 0, 400, 400)
    /**
     * Enables move of bends/segments without selecting.
     */
    this.enableFlowAnimation = false
    /**
     * Target for links that open in a new window. Default is _blank.
     */
    this.linkTarget = '_blank'

    /**
     * Value to the rel attribute of links. Default is 'nofollow noopener noreferrer'.
     * NOTE: There are security implications when this is changed and if noopener is removed,
     * then <openLink> must be overridden to allow for the opener to be set by default.
     */
    this.linkRelation = 'nofollow noopener noreferrer'

    this.fixedHandleImage = MyMxGraph.createSvgImage(22, 22,
      '<circle cx="11" cy="11" r="6" stroke="#fff" fill="#01bd22"/>' +
      '<path d="m 8 8 L 14 14M 8 14 L 14 8" stroke="#fff"/>')
    this.endFixedHandleImage = MyMxGraph.createSvgImage(22, 22,
      '<circle cx="11" cy="11" r="7" stroke="#fff" fill="#01bd22"/>' +
      '<path d="m 8 8 L 14 14M 8 14 L 14 8" stroke="#fff"/>')
    this.terminalHandleImage = MyMxGraph.createSvgImage(22, 22,
      '<circle cx="11" cy="11" r="6" stroke="#fff" fill="' + '#29b6f2' +
      '"/><circle cx="11" cy="11" r="3" stroke="#fff" fill="transparent"/>')
    this.endTerminalHandleImage = MyMxGraph.createSvgImage(22, 22,
      '<circle cx="11" cy="11" r="7" stroke="#fff" fill="' + '#29b6f2' +
      '"/><circle cx="11" cy="11" r="3" stroke="#fff" fill="transparent"/>')
    this.endHandleImage = MyMxGraph.createSvgImage(18, 18, '<circle cx="9" cy="9" r="6" stroke="#fff" fill="' + '#29b6f2' + '"/>')
  }

  createConnectionHandler () {
    return new MyMxConnectionHandler(this)
  }

  createGraphHandler () {
    return new MyMxGraphHandler(this)
  }

  createPanningHandler () {
    return new MyMxPanningHandler(this)
  }

  createPopupMenuHandler () {
    return new MyMxPopupMenuHandler(this)
  }

  createGraphView () {
    return new MyMxGraphView(this)
  }

  createCellRenderer () {
    return new MyMxCellRenderer()
  }

  createVertexHandler (state) {
    return new MyMxVertexHandler(state)
  }

  createStylesheet () {
    const styleSheet = new mxStylesheet()

    // 默认连线样式 draw.io: edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;
    const defaultEdgeStyle = styleSheet.getDefaultEdgeStyle()
    defaultEdgeStyle[mxConstants.STYLE_EDGE] = mxConstants.EDGESTYLE_ORTHOGONAL
    defaultEdgeStyle[mxConstants.STYLE_ORTHOGONAL_LOOP] = 1
    defaultEdgeStyle[mxConstants.STYLE_JETTY_SIZE] = 'auto'
    defaultEdgeStyle[mxConstants.STYLE_ENDARROW] = 'none'
    defaultEdgeStyle[mxConstants.STYLE_STROKECOLOR] = '#000000'
    defaultEdgeStyle.jumpStyle = 'arc'
    styleSheet.putDefaultEdgeStyle(defaultEdgeStyle)

    // Changes some default colors
    const style = styleSheet.getDefaultVertexStyle()
    style[mxConstants.STYLE_FILLCOLOR] = '#ffffff'
    style[mxConstants.STYLE_STROKECOLOR] = '#000000'
    style[mxConstants.STYLE_STROKEWIDTH] = '1'
    style[mxConstants.STYLE_FONTCOLOR] = '#000000'
    style[mxConstants.STYLE_FONTSIZE] = '12'
    style[mxConstants.STYLE_FONTSTYLE] = 1
    style[mxConstants.STYLE_FONTFAMILY] = 'Georgia'
    styleSheet.putDefaultVertexStyle(style)

    return styleSheet
  }

  // +++++++++++++ 原型方法start ++++++++++++++
  /**
   * @override
   * Adds panning for the grid with no page view and disabled scrollbars
   */
  panGraph (dx, dy) {
    super.panGraph(dx, dy)

    if (this.shiftPreview1 != null) {
      let canvas = this.view.canvas

      if (canvas.ownerSVGElement != null) {
        canvas = canvas.ownerSVGElement
      }

      const phase = this.gridSize * this.view.scale * this.view.gridSteps
      canvas.style.backgroundPosition = -Math.round(phase - mxUtils.mod(this.view.translate.x * this.view.scale + dx, phase)) + 'px ' +
        -Math.round(phase - mxUtils.mod(this.view.translate.y * this.view.scale + dy, phase)) + 'px'
    }

    if ((this.dialect !== mxConstants.DIALECT_SVG && this.view.backgroundPageShape != null) &&
      (!this.useScrollbarsForPanning || !mxUtils.hasScrollbars(this.container))) {
      this.view.backgroundPageShape.node.style.marginLeft = dx + 'px'
      this.view.backgroundPageShape.node.style.marginTop = dy + 'px'
    }
  }

  /**
   * @override
   * Draws page breaks only within the page
   */
  updatePageBreaks (visible, width, height) {
    const useCssTransform = this.useCssTransforms
    const scale = this.view.scale
    const translate = this.view.translate

    if (useCssTransform) {
      this.view.scale = 1
      this.view.translate = new mxPoint(0, 0)
      this.useCssTransforms = false
    }
    // Editor.js override start
    {
      const scale = this.view.scale
      const tr = this.view.translate
      const fmt = this.pageFormat
      const ps = scale * this.pageScale

      const bounds2 = this.view.getBackgroundPageBounds()

      width = bounds2.width
      height = bounds2.height
      const bounds = new mxRectangle(scale * tr.x, scale * tr.y, fmt.width * ps, fmt.height * ps)

      // Does not show page breaks if the scale is too small
      visible = visible && Math.min(bounds.width, bounds.height) > this.minPageBreakDist

      const horizontalCount = (visible) ? Math.ceil(height / bounds.height) - 1 : 0
      const verticalCount = (visible) ? Math.ceil(width / bounds.width) - 1 : 0
      const right = bounds2.x + width
      const bottom = bounds2.y + height

      if (this.horizontalPageBreaks == null && horizontalCount > 0) {
        this.horizontalPageBreaks = []
      }

      if (this.verticalPageBreaks == null && verticalCount > 0) {
        this.verticalPageBreaks = []
      }

      const drawPageBreaks = mxUtils.bind(this, function (breaks) {
        if (breaks != null) {
          const count = (breaks === this.horizontalPageBreaks) ? horizontalCount : verticalCount

          for (let i = 0; i <= count; i++) {
            const pts = (breaks === this.horizontalPageBreaks)
              ? [new mxPoint(Math.round(bounds2.x), Math.round(bounds2.y + (i + 1) * bounds.height)), new mxPoint(Math.round(right), Math.round(bounds2.y + (i + 1) * bounds.height))]
              : [new mxPoint(Math.round(bounds2.x + (i + 1) * bounds.width), Math.round(bounds2.y)), new mxPoint(Math.round(bounds2.x + (i + 1) * bounds.width), Math.round(bottom))]

            if (breaks[i] != null) {
              breaks[i].points = pts
              breaks[i].redraw()
            } else {
              const pageBreak = new mxPolyline(pts, this.pageBreakColor)
              pageBreak.dialect = this.dialect
              pageBreak.isDashed = this.pageBreakDashed
              pageBreak.pointerEvents = false
              pageBreak.init(this.view.backgroundPane)
              pageBreak.redraw()

              breaks[i] = pageBreak
            }
          }

          for (let i = count; i < breaks.length; i++) {
            if (breaks[i] != null) {
              breaks[i].destroy()
            }
          }

          breaks.splice(count, breaks.length - count)
        }
      })

      drawPageBreaks(this.horizontalPageBreaks)
      drawPageBreaks(this.verticalPageBreaks)
    }
    // EditorUi.js override end
    if (useCssTransform) {
      this.view.scale = scale
      this.view.translate = translate
      this.useCssTransforms = true
    }
  }

  // +++++++++++++ 原型方法end ++++++++++++++

  // ***********重写方法************
  // 给定的鼠标事件是否应该与网格对齐
  isGridEnabledEvent (evt) {
    return !evt.ctrlKey
  }

  // 判断cell是否可折叠的
  isCellFoldable () {
    return false
  }

  /**
   * Returns true if fast zoom preview should be used.
   */
  isFastZoomEnabled () {
    // urlParams['zoom'] != 'nocss'
    return !mxClient.NO_FO && !mxClient.IS_EDGE && !this.useCssTransforms && (this.isCssTransformsSupported() || mxClient.IS_IOS)
  }

  /**
   * Only foreignObject supported for now (no IE11). Safari disabled as it ignores
   * overflow visible on foreignObject in negative space (lightbox and viewer).
   * Check the following test case on page 1 before enabling this in production:
   * https://devhost.jgraph.com/git/drawio/etc/embed/sf-math-fo-clipping.html?dev=1
   */
  isCssTransformsSupported () {
    return this.dialect === mxConstants.DIALECT_SVG && !mxClient.NO_FO && (!this.lightbox || !mxClient.IS_SF)
  }

  /**
   * Returns true if the given mouse wheel event should be used for zooming. This
   * is invoked if no dialogs are showing and returns true with Alt or Control
   * (or cmd in macOS only) is pressed.
   */
  isZoomWheelEvent (evt) {
    return (MyMxGraph.zoomWheel && !mxEvent.isShiftDown(evt) && !mxEvent.isMetaDown(evt) &&
        !mxEvent.isAltDown(evt) && (!mxEvent.isControlDown(evt) || mxClient.IS_MAC)) ||
      (!MyMxGraph.zoomWheel && (mxEvent.isAltDown(evt) || mxEvent.isControlDown(evt)))
  }

  /**
   * Returns true if the given scroll wheel event should be used for scrolling.
   */
  isScrollWheelEvent (evt) {
    return !this.isZoomWheelEvent(evt)
  }

  // TODO 考虑抽象Editor类，才存在debugMode
  setDebugMode (debugMode) {
    this.debugMode = debugMode
    // debug模式锁定所有的cell
    this.setConnectable(!debugMode)
    this.setCellsLocked(debugMode)
    this.selectionModel.setSingleSelection(debugMode)
    // debug模式取消网格
    this.setGridEnabled(debugMode ? false : GRAPH_EDITOR_CONFIG.gridEnabled)
    // 调试模式设置背景色
    this.background = debugMode ? '#cce8cf' : null
    this.refresh()
  }

  /**
   * Returns the size of the page format scaled with the page size.
   */
  getPageSize () {
    return (this.pageVisible && this.pageFormat != null)
      ? new mxRectangle(0, 0, this.pageFormat.width * this.pageScale, this.pageFormat.height * this.pageScale)
      : this.scrollTileSize
  }

  /**
   * Returns a rectangle describing the position and count of the
   * background pages, where x and y are the position of the top,
   * left page and width and height are the vertical and horizontal
   * page count.
   */
  getPageLayout (bounds, tr, s) {
    bounds = (bounds != null) ? bounds : this.getGraphBounds()
    tr = (tr != null) ? tr : this.view.translate
    s = (s != null) ? s : this.view.scale
    const size = this.getPageSize()

    if (bounds.width === 0 || bounds.height === 0) {
      return new mxRectangle(0, 0, 1, 1)
    } else {
      const x0 = Math.floor(Math.ceil(bounds.x / s - tr.x) / size.width)
      const y0 = Math.floor(Math.ceil(bounds.y / s - tr.y) / size.height)
      const w0 = Math.ceil((Math.floor((bounds.x + bounds.width) / s) - tr.x) / size.width) - x0
      const h0 = Math.ceil((Math.floor((bounds.y + bounds.height) / s) - tr.y) / size.height) - y0

      return new mxRectangle(x0, y0, w0, h0)
    }
  }

  /**
   * @override
   */
  getPreferredPageSize (bounds, width, height) {
    const pages = this.getPageLayout()
    const size = this.getPageSize()

    return new mxRectangle(0, 0, pages.width * size.width, pages.height * size.height)
  }

  /**
   * Returns the padding for pages in page view with scrollbars.
   */
  getPagePadding () {
    // return new mxPoint(0, 0)
    return new mxPoint(Math.max(0, Math.round((this.container.offsetWidth - 34) / this.view.scale)),
      Math.max(0, Math.round((this.container.offsetHeight - 34) / this.view.scale)))
  }

  /**
   * Returns the default view translation for the given page layout.
   */
  getDefaultTranslate (pageLayout) {
    const pad = this.getPagePadding()
    const size = this.getPageSize()

    return new mxPoint(pad.x - pageLayout.x * size.width, pad.y - pageLayout.y * size.height)
  }

  /**
   * Updates the minimum graph size
   */
  updateMinimumSize () {
    const pageLayout = this.getPageLayout()
    const pad = this.getPagePadding()
    const size = this.getPageSize()

    const minW = Math.ceil(2 * pad.x + pageLayout.width * size.width)
    const minh = Math.ceil(2 * pad.y + pageLayout.height * size.height)

    if (this.minimumGraphSize == null || this.minimumGraphSize.width !== minW || this.minimumGraphSize.height !== minh) {
      this.minimumGraphSize = new mxRectangle(0, 0, minW, minh)
    }
  }

  /**
   * Returns true if the given cell is a table cell.
   */
  isTableCell (cell) {
    return this.model.isVertex(cell) && this.isTableRow(this.model.getParent(cell))
  }

  /**
   * Returns true if the given cell is a table row.
   */
  isTableRow (cell) {
    return this.model.isVertex(cell) && this.isTable(this.model.getParent(cell))
  }

  /**
   * Returns true if the given cell is a table.
   */
  isTable (cell) {
    const style = this.getCellStyle(cell)

    return style != null && style.childLayout === 'tableLayout'
  }

  /**
   * Returns the first parent that is not a part.
   */
  isPart (cell) {
    return mxUtils.getValue(this.getCurrentCellStyle(cell), 'part', '0') === '1' ||
      this.isTableCell(cell) || this.isTableRow(cell)
  }

  /**
   * Returns the first parent that is not a part.
   */
  getCompositeParent (cell) {
    while (this.isPart(cell)) {
      const temp = this.model.getParent(cell)

      if (!this.model.isVertex(temp)) {
        break
      }

      cell = temp
    }

    return cell
  }

  /**
   * Returns the given terminal that is not relative, an edge or a part.
   */
  getReferenceTerminal (terminal) {
    if (terminal != null) {
      const geo = this.getCellGeometry(terminal)

      if (geo != null && geo.relative) {
        terminal = this.model.getParent(terminal)
      }
    }

    if (terminal != null && this.model.isEdge(terminal)) {
      terminal = this.model.getParent(terminal)
    }

    if (terminal != null) {
      terminal = this.getCompositeParent(terminal)
    }

    return terminal
  }

  /**
   * Sets the link for the given cell.
   */
  setAttributeForCell (cell, attributeName, attributeValue) {
    let value = null

    if (cell.value != null && typeof (cell.value) === 'object') {
      value = cell.value.cloneNode(true)
    } else {
      const doc = mxUtils.createXmlDocument()

      value = doc.createElement('UserObject')
      value.setAttribute('label', cell.value || '')
    }

    if (attributeValue != null) {
      value.setAttribute(attributeName, attributeValue)
    } else {
      value.removeAttribute(attributeName)
    }

    this.model.setValue(cell, value)
  }

  /**
   * Function: updateCssTransform
   *
   * Zooms out of the graph by <zoomFactor>.
   */
  updateCssTransform () {
    const temp = this.view.getDrawPane()

    if (temp != null) {
      const g = temp.parentNode

      if (!this.useCssTransforms) {
        g.removeAttribute('transformOrigin')
        g.removeAttribute('transform')
      } else {
        const prev = g.getAttribute('transform')
        g.setAttribute('transformOrigin', '0 0')
        const s = Math.round(this.currentScale * 100) / 100
        const dx = Math.round(this.currentTranslate.x * 100) / 100
        const dy = Math.round(this.currentTranslate.y * 100) / 100
        g.setAttribute('transform', 'scale(' + s + ',' + s + ')' +
          'translate(' + dx + ',' + dy + ')')

        // Applies workarounds only if translate has changed
        if (prev !== g.getAttribute('transform')) {
          this.fireEvent(new mxEventObject('cssTransformChanged'),
            'transform', g.getAttribute('transform'))
        }
      }
    }
  }

  /**
   *
   */
  addFlowAnimationToNode (node, style, scale, id) {
    if (node != null && id != null) {
      const dashArray = node.getAttribute('stroke-dasharray')
      let tokens

      if (dashArray === '' || dashArray == null) {
        tokens = String(mxUtils.getValue(style, mxConstants.STYLE_DASH_PATTERN, '8')).split(' ')
        const sw = (mxUtils.getValue(style, mxConstants.STYLE_FIX_DASH, false) === 1 || style.dashPattern == null)
          ? 1
          : mxUtils.getNumber(style, mxConstants.STYLE_STROKEWIDTH, 1)

        if (tokens.length > 0) {
          for (let i = 0; i < tokens.length; i++) {
            tokens[i] = Math.round(Number(tokens[i]) * scale * sw * 100) / 100
          }
        }

        node.setAttribute('stroke-dasharray', tokens.join(' '))
      } else {
        tokens = dashArray.split(' ')
      }

      if (tokens.length > 0) {
        let sum = 0

        for (let i = 0; i < tokens.length; i++) {
          const temp = parseFloat(tokens[i])

          if (!isNaN(temp)) {
            sum += parseFloat(tokens[i])
          }
        }

        // If an odd number of values is provided, then the list of
        // values is repeated to yield an even number of values
        if (tokens.length % 2 !== 0) {
          sum *= 2
        }

        const d = Math.round((sum / scale / 16) * parseInt(mxUtils.getValue(
          style, 'flowAnimationDuration', 500)))
        const tf = mxUtils.getValue(style, 'flowAnimationTimingFunction', 'linear')
        const ad = mxUtils.getValue(style, 'flowAnimationDirection', 'normal')
        node.style.animation = id + ' ' + d + 'ms ' + mxUtils.htmlEntities(tf) + ' infinite ' + mxUtils.htmlEntities(ad)
        node.style.strokeDashoffset = sum
      }
    }
  }

  /**
   * Adds rack child layout style.
   */
  addFlowAnimationStyle () {
    const head = document.getElementsByTagName('head')[0]

    if (head != null && this.flowAnimationId == null) {
      this.flowAnimationId = 'ge-flow-animation-' + MyEditor.guid()
      const style = document.createElement('style')
      style.innerHTML = this.createFlowAnimationCss(this.flowAnimationId)
      head.appendChild(style)
    }

    return this.flowAnimationId
  }

  /**
   * Adds rack child layout style.
   */
  createFlowAnimationCss (id) {
    return '@keyframes ' + id + ' {\n' +
      '  to {\n' +
      '    stroke-dashoffset: 0;\n' +
      '  }\n' +
      '}'
  }

  /**
   * Guesses autoTranslate to avoid another repaint (see below).
   * Works if only the scale of the graph changes or if pages
   * are visible and the visible pages do not change. Uses
   * geometries to guess the bounding box of the graph.
   */

  sizeDidChange () {
    const skipScroll = false

    if (this.container != null && mxUtils.hasScrollbars(this.container)) {
      this.updateMinimumSize()

      if (!this.autoTranslate) {
        const pageLayout = this.getPageLayout()
        const tr = this.getDefaultTranslate(pageLayout)
        const tx = this.view.translate.x
        const ty = this.view.translate.y

        if (tr.x !== tx || tr.y !== ty) {
          this.view.x0 = pageLayout.x
          this.view.y0 = pageLayout.y

          // Requires full revalidation
          this.autoTranslate = true
          this.view.setTranslate(tr.x, tr.y)
          this.autoTranslate = false

          // Skipped if initial autoTranslate is wrong
          if (!skipScroll) {
            this.container.scrollLeft += Math.round((tr.x - tx) * this.view.scale)
            this.container.scrollTop += Math.round((tr.y - ty) * this.view.scale)
          }

          return
        }
      }

      super.sizeDidChange()
    } else {
      // Fires event but does not invoke superclass
      this.fireEvent(new mxEventObject(mxEvent.SIZE, 'bounds', this.getGraphBounds()))
    }
  }

  /**
   * Returns if the child cells of the given vertex cell state should be resized.
   */
  isRecursiveVertexResize (state) {
    return !this.isSwimlane(state.cell) && this.model.getChildCount(state.cell) > 0 &&
      !this.isCellCollapsed(state.cell) && mxUtils.getValue(state.style, 'recursiveResize', '1') === '1' &&
      mxUtils.getValue(state.style, 'childLayout', null) == null
  }

  /**
   * Returns the row and column lines for the given table.
   */
  visitTableCells (cell, visitor) {
    let lastRow = null
    const rows = this.model.getChildCells(cell, true)
    const start = this.getActualStartSize(cell, true)

    for (let i = 0; i < rows.length; i++) {
      const rowStart = this.getActualStartSize(rows[i], true)
      const cols = this.model.getChildCells(rows[i], true)
      const rowStyle = this.getCellStyle(rows[i], true)
      let lastCol = null
      const row = []

      for (let j = 0; j < cols.length; j++) {
        let geo = this.getCellGeometry(cols[j])
        const col = { cell: cols[j], rospan: 1, colspan: 1, row: i, col: j, geo }
        geo = (geo.alternateBounds != null) ? geo.alternateBounds : geo
        col.point = new mxPoint(geo.width + (lastCol != null ? lastCol.point.x : start.x + rowStart.x),
          geo.height + (lastRow != null && lastRow[0] != null ? lastRow[0].point.y : start.y + rowStart.y))
        col.actual = col

        if (lastRow != null && lastRow[j] != null && lastRow[j].rowspan > 1) {
          col.rowspan = lastRow[j].rowspan - 1
          col.colspan = lastRow[j].colspan
          col.actual = lastRow[j].actual
        } else {
          if (lastCol != null && lastCol.colspan > 1) {
            col.rowspan = lastCol.rowspan
            col.colspan = lastCol.colspan - 1
            col.actual = lastCol.actual
          } else {
            const style = this.getCurrentCellStyle(cols[j], true)

            if (style != null) {
              col.rowspan = parseInt(style.rowspan || '1')
              col.colspan = parseInt(style.colspan || '1')
            }
          }
        }

        const head = mxUtils.getValue(rowStyle, mxConstants.STYLE_SWIMLANE_HEAD, 1) === 1 &&
          mxUtils.getValue(rowStyle, mxConstants.STYLE_STROKECOLOR,
            mxConstants.NONE) !== mxConstants.NONE

        visitor(col, cols.length, rows.length,
          start.x + ((head) ? rowStart.x : 0),
          start.y + ((head) ? rowStart.y : 0))
        row.push(col)
        lastCol = col
      }

      lastRow = row
    }
  }

  /**
   * Returns the row and column lines for the given table.
   */
  getTableLines (cell, horizontal, vertical) {
    const hl = []
    const vl = []

    if (horizontal || vertical) {
      this.visitTableCells(cell, mxUtils.bind(this, function (iter, colCount, rowCount, x0, y0) {
        // Constructs horizontal lines
        if (horizontal && iter.row < rowCount - 1) {
          if (hl[iter.row] == null) {
            hl[iter.row] = [new mxPoint(x0, iter.point.y)]
          }

          if (iter.rowspan > 1) {
            hl[iter.row].push(null)
          }

          hl[iter.row].push(iter.point)
        }

        // Constructs vertical lines
        if (vertical && iter.col < colCount - 1) {
          if (vl[iter.col] == null) {
            vl[iter.col] = [new mxPoint(iter.point.x, y0)]
          }

          if (iter.colspan > 1) {
            vl[iter.col].push(null)
          }

          vl[iter.col].push(iter.point)
        }
      }))
    }

    return hl.concat(vl)
  }

  /**
   * Adds support for page links.
   */
  getLinkTitle (href) {
    return href.substring(href.lastIndexOf('/') + 1)
  }

  /**
   * Adds support for page links.
   */
  isCustomLink (href) {
    return href.substring(0, 5) === 'data:'
  }

  /**
   * Adds support for page links.
   */
  customLinkClicked (link, associatedCell) {
    return false
  }

  /**
   *
   */
  getAbsoluteUrl (url) {
    if (url != null && this.isRelativeUrl(url)) {
      if (url.charAt(0) === '#') {
        url = this.baseUrl + url
      } else if (url.charAt(0) === '/') {
        url = this.domainUrl + url
      } else {
        url = this.domainPathUrl + url
      }
    }
    return url
  }

  /**
   * Returns the link for the given cell.
   */
  getLinksForState (state) {
    if (state != null && state.text != null && state.text.node != null) {
      return state.text.node.getElementsByTagName('a')
    } else {
      return null
    }
  }

  /**
   * Creates an anchor elements for handling the given link in the
   * hint that is shown when the cell is selected.
   */
  createLinkForHint (link, label, associatedCell) {
    link = (link != null) ? link : 'javascript:void(0);'

    if (label == null || label.length === 0) {
      if (this.isCustomLink(link)) {
        label = this.getLinkTitle(link)
      } else {
        label = link
      }
    }

    // Helper function to shorten strings
    function short (str, max) {
      if (str.length > max) {
        str = str.substring(0, Math.round(max / 2)) + '...' +
          str.substring(str.length - Math.round(max / 4))
      }

      return str
    }

    const a = document.createElement('a')
    a.setAttribute('rel', this.linkRelation)
    a.setAttribute('href', this.getAbsoluteUrl(link))
    a.setAttribute('title', short((this.isCustomLink(link))
      ? this.getLinkTitle(link)
      : link, 80))

    if (this.linkTarget != null) {
      a.setAttribute('target', this.linkTarget)
    }

    // Adds shortened label to link
    mxUtils.write(a, short(label, 40))

    // Handles custom links
    if (this.isCustomLink(link)) {
      mxEvent.addListener(a, 'click', (evt) => { // FIXME 此处改mxutils.bind为箭头函数
        this.customLinkClicked(link, associatedCell)
        mxEvent.consume(evt)
      })
    }

    return a
  }

  /**
   * Updates the row and table heights.
   */
  setTableRowHeight (row, dy, extend) {
    extend = (extend != null) ? extend : true
    const model = this.getModel()

    model.beginUpdate()
    try {
      let rgeo = this.getCellGeometry(row)

      // Sets height of row
      if (rgeo != null) {
        rgeo = rgeo.clone()
        rgeo.height += dy
        model.setGeometry(row, rgeo)

        const table = model.getParent(row)
        const rows = model.getChildCells(table, true)

        // Shifts and resizes neighbor row
        if (!extend) {
          const index = mxUtils.indexOf(rows, row)

          if (index < rows.length - 1) {
            const nextRow = rows[index + 1]
            let geo = this.getCellGeometry(nextRow)

            if (geo != null) {
              geo = geo.clone()
              geo.y += dy
              geo.height -= dy

              model.setGeometry(nextRow, geo)
            }
          }
        }

        // Updates height of table
        let tGeo = this.getCellGeometry(table)

        if (tGeo != null) {
          // Always extends for last row
          if (!extend) {
            extend = row === rows[rows.length - 1]
          }

          if (extend) {
            tGeo = tGeo.clone()
            tGeo.height += dy
            model.setGeometry(table, tGeo)
          }
        }
      }
    } finally {
      model.endUpdate()
    }
  }

  /**
   * Updates column width and row height.
   */
  setTableColumnWidth (col, dx, extend) {
    extend = (extend != null) ? extend : false

    const model = this.getModel()
    let row = model.getParent(col)
    const table = model.getParent(row)
    let cells = model.getChildCells(row, true)
    const index = mxUtils.indexOf(cells, col)
    const lastColumn = index === cells.length - 1

    model.beginUpdate()
    try {
      // Sets width of child cell
      const rows = model.getChildCells(table, true)

      for (let i = 0; i < rows.length; i++) {
        row = rows[i]
        cells = model.getChildCells(row, true)
        let cell = cells[index]
        let geo = this.getCellGeometry(cell)

        if (geo != null) {
          geo = geo.clone()
          geo.width += dx

          if (geo.alternateBounds != null) {
            geo.alternateBounds.width += dx
          }

          model.setGeometry(cell, geo)
        }

        // Shifts and resizes neighbor column
        if (index < cells.length - 1) {
          cell = cells[index + 1]
          let geo = this.getCellGeometry(cell)

          if (geo != null) {
            geo = geo.clone()
            geo.x += dx

            if (!extend) {
              geo.width -= dx

              if (geo.alternateBounds != null) {
                geo.alternateBounds.width -= dx
              }
            }

            model.setGeometry(cell, geo)
          }
        }
      }

      if (lastColumn || extend) {
        // Updates width of table
        let tGeo = this.getCellGeometry(table)

        if (tGeo != null) {
          tGeo = tGeo.clone()
          tGeo.width += dx
          model.setGeometry(table, tGeo)
        }
      }

      if (this.layoutManager != null) {
        this.layoutManager.executeLayout(table)
      }
    } finally {
      model.endUpdate()
    }
  }

  /**
   * Sets the link for the given cell.
   */
  setLinkForCell (cell, link) {
    this.setAttributeForCell(cell, 'link', link)
  }

  /**
   * Turns the given cells and returns the changed cells.
   */
  turnShapes (cells, backwards) {
    const model = this.getModel()
    const select = []

    model.beginUpdate()
    try {
      for (let i = 0; i < cells.length; i++) {
        const cell = cells[i]

        if (model.isEdge(cell)) {
          const src = model.getTerminal(cell, true)
          const trg = model.getTerminal(cell, false)

          model.setTerminal(cell, trg, true)
          model.setTerminal(cell, src, false)

          let geo = model.getGeometry(cell)

          if (geo != null) {
            geo = geo.clone()

            if (geo.points != null) {
              geo.points.reverse()
            }

            const sp = geo.getTerminalPoint(true)
            const tp = geo.getTerminalPoint(false)

            geo.setTerminalPoint(sp, false)
            geo.setTerminalPoint(tp, true)
            model.setGeometry(cell, geo)

            // Inverts constraints
            const edgeState = this.view.getState(cell)
            const sourceState = this.view.getState(src)
            const targetState = this.view.getState(trg)

            if (edgeState != null) {
              const sc = (sourceState != null) ? this.getConnectionConstraint(edgeState, sourceState, true) : null
              const tc = (targetState != null) ? this.getConnectionConstraint(edgeState, targetState, false) : null

              this.setConnectionConstraint(cell, src, true, tc)
              this.setConnectionConstraint(cell, trg, false, sc)

              // Inverts perimeter spacings
              const temp = mxUtils.getValue(edgeState.style, mxConstants.STYLE_SOURCE_PERIMETER_SPACING)
              this.setCellStyles(mxConstants.STYLE_SOURCE_PERIMETER_SPACING, mxUtils.getValue(
                edgeState.style, mxConstants.STYLE_TARGET_PERIMETER_SPACING), [cell])
              this.setCellStyles(mxConstants.STYLE_TARGET_PERIMETER_SPACING, temp, [cell])
            }

            select.push(cell)
          }
        } else if (model.isVertex(cell)) {
          let geo = this.getCellGeometry(cell)

          if (geo != null) {
            // Rotates the size and position in the geometry
            if (!this.isTable(cell) && !this.isTableRow(cell) &&
              !this.isTableCell(cell) && !this.isSwimlane(cell)) {
              geo = geo.clone()
              geo.x += geo.width / 2 - geo.height / 2
              geo.y += geo.height / 2 - geo.width / 2;
              [geo.width, geo.height] = [geo.height, geo.width]

              model.setGeometry(cell, geo)
            }

            // Reads the current direction and advances by 90 degrees
            const state = this.view.getState(cell)

            if (state != null) {
              const dirs = [mxConstants.DIRECTION_EAST, mxConstants.DIRECTION_SOUTH,
                mxConstants.DIRECTION_WEST, mxConstants.DIRECTION_NORTH]
              const dir = mxUtils.getValue(state.style, mxConstants.STYLE_DIRECTION,
                mxConstants.DIRECTION_EAST)
              this.setCellStyles(mxConstants.STYLE_DIRECTION,
                dirs[mxUtils.mod(mxUtils.indexOf(dirs, dir) +
                  ((backwards) ? -1 : 1), dirs.length)], [cell])
            }

            select.push(cell)
          }
        }
      }
    } finally {
      model.endUpdate()
    }

    return select
  }

  /**
   * Helper function for creating SVG data URI.
   */
  static createSvgImage (w, h, data, coordWidth, coordHeight) {
    const tmp = unescape(encodeURIComponent(MyMxGraph.svgDoctype +
      '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="' + w + 'px" height="' + h + 'px" ' +
      ((coordWidth != null && coordHeight != null) ? 'viewBox="0 0 ' + coordWidth + ' ' + coordHeight + '" ' : '') +
      'version="1.1">' + data + '</svg>'))

    return new mxImage('data:image/svg+xml;base64,' + ((window.btoa) ? btoa(tmp) : Base64.btoa(tmp, true)), w, h)
  }

  /**
   * Sanitizes the given value.
   */
  static domPurify (value, inPlace) {
    window.DOM_PURIFY_CONFIG.IN_PLACE = inPlace

    // return DOMPurify.sanitize(value, window.DOM_PURIFY_CONFIG)
    return null
  }

  /**
   * Sanitizes the given HTML markup, allowing target attributes and
   * data: protocol links to pages and custom actions.
   */
  static sanitizeHtml (value, editing) {
    return MyMxGraph.domPurify(value, false)
  }

  /**
   * Sanitizes the given DOM node in-place.
   */
  static sanitizeNode (value) {
    return MyMxGraph.domPurify(value, true)
  }

  /**
   * Updates the viewbox, width and height in the given SVG data URI
   * and returns the updated data URI with all script tags and event
   * handlers removed.
   */
  static clipSvgDataUri (dataUri, ignorePreserveAspect) {
    // LATER Add workaround for non-default NS declarations with empty URI not allowed in IE11
    if (!mxClient.IS_IE && !mxClient.IS_IE11 && dataUri != null &&
      dataUri.substring(0, 26) === 'data:image/svg+xml;base64,') {
      try {
        const div = document.createElement('div')
        div.style.position = 'absolute'
        div.style.visibility = 'hidden'

        // Adds the text and inserts into DOM for updating of size
        const data = decodeURIComponent(escape(atob(dataUri.substring(26))))
        const idx = data.indexOf('<svg')

        if (idx >= 0) {
          // Strips leading XML declaration and doctypes
          div.innerHTML = MyMxGraph.sanitizeHtml(data.substring(idx))

          // Gets the size and removes from DOM
          const svgs = div.getElementsByTagName('svg')

          if (svgs.length > 0) {
            // Avoids getBBox as it ignores stroke option
            if (ignorePreserveAspect || svgs[0].getAttribute('preserveAspectRatio') != null) {
              document.body.appendChild(div)

              try {
                let fx = 1
                let fy = 1
                let w = svgs[0].getAttribute('width')
                let h = svgs[0].getAttribute('height')

                if (w != null && w.charAt(w.length - 1) !== '%') {
                  w = parseFloat(w)
                } else {
                  w = NaN
                }

                if (h != null && h.charAt(h.length - 1) !== '%') {
                  h = parseFloat(h)
                } else {
                  h = NaN
                }

                const vb = svgs[0].getAttribute('viewBox')
                let viewBox = null

                if (vb != null && !isNaN(w) && !isNaN(h)) {
                  const tokens = vb.split(' ')

                  if (vb.length >= 4) {
                    fx = parseFloat(tokens[2]) / w
                    fy = parseFloat(tokens[3]) / h

                    viewBox = new mxRectangle(parseFloat(tokens[0]), parseFloat(tokens[1]),
                      parseFloat(tokens[2]), parseFloat(tokens[3]))
                  }
                }

                const size = svgs[0].getBBox()

                if (size.width > 0 && size.height > 0) {
                  // SVG is only updated if area is less than 70%
                  if (viewBox == null || (size.width * size.height) <
                    (viewBox.width * viewBox.height * 0.7)) {
                    div.getElementsByTagName('svg')[0].setAttribute('viewBox', size.x +
                      ' ' + size.y + ' ' + size.width + ' ' + size.height)
                    div.getElementsByTagName('svg')[0].setAttribute('width', `${size.width / fx}`)
                    div.getElementsByTagName('svg')[0].setAttribute('height', `${size.height / fy}`)
                  }
                }
              } catch (e) {
                // ignore
              } finally {
                document.body.removeChild(div)
              }
            }

            dataUri = MyEditor.createSvgDataUri(mxUtils.getXml(svgs[0]))
          }
        }
      } catch (e) {
        // ignore
      }
    }

    return dataUri
  }
}

/**
 * Specifies if the touch UI should be used (cannot detect touch in FF so always on for Windows/Linux)
 */
// MyMxGraph.touchStyle = mxClient.IS_TOUCH || (mxClient.IS_FF && mxClient.IS_WIN) || navigator.maxTouchPoints > 0 ||
//   navigator.msMaxTouchPoints > 0 || window.urlParams == null || urlParams.touch === '1'
MyMxGraph.touchStyle = mxClient.IS_TOUCH || (mxClient.IS_FF && mxClient.IS_WIN) || navigator.maxTouchPoints > 0 ||
  navigator.msMaxTouchPoints > 0 || window.urlParams == null

/**
 * Specifies if the mouse wheel is used for zoom without any modifiers.
 */
MyMxGraph.zoomWheel = false
/**
 * Default size for line jumps.
 */
MyMxGraph.lineJumpsEnabled = true
/**
 * Default size for line jumps.
 */
MyMxGraph.defaultJumpSize = 6
/**
 * Minimum width for table columns.
 */
MyMxGraph.minTableColumnWidth = 20

/**
 * Minimum height for table rows.
 */
MyMxGraph.minTableRowHeight = 20
/**
 *
 */
MyMxGraph.svgDoctype = '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" ' +
  '"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">'
