import {
  mxClient,
  mxConstants,
  mxEvent,
  mxEventObject,
  mxGraphView,
  mxMouseEvent,
  mxPoint,
  mxRectangle,
  mxRectangleShape,
  mxUtils
} from '@/renderer/common/mxgraph'

import * as Base64 from 'Base64'
import { MyEditor } from './MyEditor'
import { MyMxGraph } from './MyMxGraph'
import { formatHintText } from './common'

export class MyMxGraphView extends mxGraphView {
  constructor (graph) {
    super(graph)
    // Defines grid properties
    this.gridImage = (mxClient.IS_SVG) ? 'data:image/gif;base64,R0lGODlhCgAKAJEAAAAAAP///8zMzP///yH5BAEAAAMALAAAAAAKAAoAAAIJ1I6py+0Po2wFADs=' : 'images/grid.gif'
    this.gridSteps = 4 // FIXME
    this.minGridSize = 4
    // UrlParams is null in embed mode
    this.defaultGridColor = '#d0d0d0'
    this.defaultDarkGridColor = '#424242'
    this.gridColor = this.defaultGridColor

    this.unit = mxConstants.POINTS // Units
  }

  // +++++++++++++ 原型方法start ++++++++++++++
  /**
   * @override
   * Uses HTML for background pages (to support grid background image)
   */
  validateBackgroundPage () {
    const useCssTransforms = this.graph.useCssTransforms
    const scale = this.scale
    const translate = this.translate

    if (useCssTransforms) {
      this.scale = this.graph.currentScale
      this.translate = this.graph.currentTranslate
    }

    {
      const graph = this.graph

      if (graph.container != null && !graph.transparentBackground) {
        if (graph.pageVisible) {
          const bounds = this.getBackgroundPageBounds()

          if (this.backgroundPageShape == null) {
            // Finds first element in graph container
            let firstChild = graph.container.firstChild

            while (firstChild != null && firstChild.nodeType !== mxConstants.NODETYPE_ELEMENT) {
              firstChild = firstChild.nextSibling
            }

            if (firstChild != null) {
              this.backgroundPageShape = this.createBackgroundPageShape(bounds)
              this.backgroundPageShape.scale = 1

              // IE8 standards has known rendering issues inside mxWindow but not using shadow is worse.
              this.backgroundPageShape.isShadow = true
              this.backgroundPageShape.dialect = mxConstants.DIALECT_STRICTHTML
              this.backgroundPageShape.init(graph.container)

              // Required for the browser to render the background page in correct order
              firstChild.style.position = 'absolute'
              graph.container.insertBefore(this.backgroundPageShape.node, firstChild)
              this.backgroundPageShape.redraw()

              this.backgroundPageShape.node.className = 'geBackgroundPage'

              // FIXME 可能不需要该事件
              // Adds listener for double click handling on background
              mxEvent.addListener(this.backgroundPageShape.node, 'dblclick',
                mxUtils.bind(this, function (evt) {
                  graph.dblClick(evt)
                })
              )

              // Adds basic listeners for graph event dispatching outside the
              // container and finishing the handling of a single gesture
              mxEvent.addGestureListeners(this.backgroundPageShape.node,
                mxUtils.bind(this, function (evt) {
                  graph.fireMouseEvent(mxEvent.MOUSE_DOWN, new mxMouseEvent(evt))
                }),
                mxUtils.bind(this, function (evt) {
                  // Hides the tooltip if mouse is outside container
                  if (graph.tooltipHandler != null && graph.tooltipHandler.isHideOnHover()) {
                    graph.tooltipHandler.hide()
                  }

                  if (graph.isMouseDown && !mxEvent.isConsumed(evt)) {
                    graph.fireMouseEvent(mxEvent.MOUSE_MOVE, new mxMouseEvent(evt))
                  }
                }),
                mxUtils.bind(this, function (evt) {
                  graph.fireMouseEvent(mxEvent.MOUSE_UP, new mxMouseEvent(evt))
                })
              )
            }
          } else {
            this.backgroundPageShape.scale = 1
            this.backgroundPageShape.bounds = bounds
            this.backgroundPageShape.redraw()
          }
        } else if (this.backgroundPageShape != null) {
          this.backgroundPageShape.destroy()
          this.backgroundPageShape = null
        }

        this.validateBackgroundStyles(null, null, null)
      }
    }

    if (useCssTransforms) {
      this.scale = scale
      this.translate = translate
    }
  }

  /**
   * @override
   * Updates the CSS of the background to draw the grid
   */
  validateBackgroundStyles (factor, cx, cy) {
    const graph = this.graph
    factor = (factor != null) ? factor : 1
    const color = (graph.background == null || graph.background === mxConstants.NONE)
      ? graph.defaultPageBackgroundColor
      : graph.background
    const gridColor = (color != null && this.gridColor !== color.toLowerCase()) ? this.gridColor : '#ffffff'
    let image = 'none'
    let position = ''

    // if (graph.isGridEnabled() || graph.gridVisible) {
    if (graph.isGridEnabled()) {
      let phase = 10

      if (mxClient.IS_SVG) {
        // Generates the SVG required for drawing the dynamic grid
        image = unescape(encodeURIComponent(this.createSvgGrid(gridColor, factor)))
        image = Base64.btoa(image, true)
        image = 'url(' + 'data:image/svg+xml;base64,' + image + ')'
        phase = graph.gridSize * this.scale * this.gridSteps * factor
      } else {
        // Fallback to grid wallpaper with fixed size
        image = 'url(' + this.gridImage + ')'
      }

      let x0 = 0
      let y0 = 0

      const dx = (cx != null) ? cx - this.translate.x * this.scale : 0
      const dy = (cy != null) ? cy - this.translate.y * this.scale : 0

      const p = graph.gridSize * this.scale * this.gridSteps
      const ddx = dx % p
      const ddy = dy % p

      if (graph.view.backgroundPageShape != null) {
        const bds = this.getBackgroundPageBounds()

        x0 = 1 + bds.x
        y0 = 1 + bds.y
      }

      // Computes the offset to maintain origin for grid
      position = -Math.round(phase - mxUtils.mod(this.translate.x * this.scale - x0 + dx, phase) + ddx * factor) + 'px ' +
        -Math.round(phase - mxUtils.mod(this.translate.y * this.scale - y0 + dy, phase) + ddy * factor) + 'px'
    }

    let canvas = graph.view.canvas

    if (canvas.ownerSVGElement != null) {
      canvas = canvas.ownerSVGElement
    }

    const useDiagramBackground = !MyEditor.isDarkMode() && graph.enableDiagramBackground

    if (graph.view.backgroundPageShape != null) {
      graph.view.backgroundPageShape.node.style.backgroundPosition = position
      graph.view.backgroundPageShape.node.style.backgroundImage = image
      graph.view.backgroundPageShape.node.style.backgroundColor = color
      graph.view.backgroundPageShape.node.style.borderColor = graph.defaultPageBorderColor
      graph.container.classList.add('geDiagramBackdrop') // FIXME
      canvas.style.backgroundImage = 'none'
      canvas.style.backgroundColor = ''

      if (useDiagramBackground) {
        graph.container.style.backgroundColor = graph.diagramBackgroundColor
      } else {
        graph.container.style.backgroundColor = ''
      }
    } else {
      graph.container.classList.remove('geDiagramBackdrop') // FIXME
      canvas.style.backgroundPosition = position
      canvas.style.backgroundImage = image

      if (useDiagramBackground && (graph.background == null ||
        graph.background === mxConstants.NONE)) {
        canvas.style.backgroundColor = graph.diagramBackgroundColor
        graph.container.style.backgroundColor = ''
      } else {
        canvas.style.backgroundColor = color
      }
    }
  }

  /**
   * @override
   * Returns the SVG required for painting the background grid.
   */
  createSvgGrid (color, factor) {
    factor = (factor != null) ? factor : 1
    let tmp = this.graph.gridSize * this.scale * factor

    while (tmp < this.minGridSize) {
      tmp *= 2
    }

    const tmp2 = this.gridSteps * tmp

    // Small grid lines
    const d = []

    for (let i = 1; i < this.gridSteps; i++) {
      const tmp3 = i * tmp
      d.push('M 0 ' + tmp3 + ' L ' + tmp2 + ' ' + tmp3 + ' M ' + tmp3 + ' 0 L ' + tmp3 + ' ' + tmp2)
    }

    // KNOWN: Rounding errors for certain scales (e.g. 144%, 121% in Chrome, FF and Safari). Workaround
    // in Chrome is to use 100% for the svg size, but this results in blurred grid for large diagrams.
    const size = tmp2
    return '<svg width="' + size + '" height="' + size + '" xmlns="' + mxConstants.NS_SVG + '">' +
      '<defs><pattern id="grid" width="' + tmp2 + '" height="' + tmp2 + '" patternUnits="userSpaceOnUse">' +
      '<path d="' + d.join(' ') + '" fill="none" stroke="' + color + '" opacity="0.2" stroke-width="1"/>' +
      '<path d="M ' + tmp2 + ' 0 L 0 0 0 ' + tmp2 + '" fill="none" stroke="' + color + '" stroke-width="1"/>' +
      '</pattern></defs><rect width="100%" height="100%" fill="url(#grid)"/></svg>'
  }

  /**
   * @override
   * Creates background page shape
   */
  createBackgroundPageShape (bounds) {
    return new mxRectangleShape(bounds, '#ffffff', this.graph.defaultPageBorderColor)
  }

  /**
   * @override
   * Fits the number of background pages to the graph
   */
  getBackgroundPageBounds () {
    const gb = this.getGraphBounds()

    // Computes unscaled, untranslated graph bounds
    const x = (gb.width > 0) ? gb.x / this.scale - this.translate.x : 0
    const y = (gb.height > 0) ? gb.y / this.scale - this.translate.y : 0
    const w = gb.width / this.scale
    const h = gb.height / this.scale

    const fmt = this.graph.pageFormat
    const ps = this.graph.pageScale

    const pw = fmt.width * ps
    const ph = fmt.height * ps

    const x0 = Math.floor(Math.min(0, x) / pw)
    const y0 = Math.floor(Math.min(0, y) / ph)
    const xe = Math.ceil(Math.max(1, x + w) / pw)
    const ye = Math.ceil(Math.max(1, y + h) / ph)

    const rows = xe - x0
    const cols = ye - y0

    return new mxRectangle(this.scale * (this.translate.x + x0 * pw), this.scale *
      (this.translate.y + y0 * ph), this.scale * rows * pw, this.scale * cols * ph)
  }

  // FIXME 原型是上面注释的内容，这里是重载的实例方法
  // // Fits the number of background pages to the graph
  // getBackgroundPageBounds () {
  //   const layout = this.graph.getPageLayout()
  //   const page = this.graph.getPageSize()
  //
  //   return new mxRectangle(this.scale * (this.translate.x + layout.x * page.width),
  //     this.scale * (this.translate.y + layout.y * page.height),
  //     this.scale * layout.width * page.width,
  //     this.scale * layout.height * page.height)
  // }

  setUnit (unit) {
    if (this.unit !== unit) {
      this.unit = unit

      this.fireEvent(new mxEventObject('unitChanged', 'unit', unit))
    }
  }

  // // Overrides graph bounds to include background images
  // var graphGetGraphBounds = graph.getGraphBounds;
  //
  // graph.getGraphBounds = function()
  // {
  // var bounds = graphGetGraphBounds.apply(this, arguments);
  // var img = this.backgroundImage;
  //
  // if (img != null && img.width != null && img.height != null)
  // {
  //  var t = this.view.translate;
  //  var s = this.view.scale;
  //
  //  bounds = mxRectangle.fromRectangle(bounds);
  //  bounds.add(new mxRectangle(
  //   (t.x + img.x) * s, (t.y + img.y) * s,
  //   img.width * s, img.height * s));
  //  }
  //
  //  return bounds;
  // };
  // FIXME
  /**
   * @override
   * Overrides getGraphBounds to use bounding box from SVG.
   */
  getGraphBounds () {
    let b = this.graphBounds

    if (this.graph.useCssTransforms) {
      const t = this.graph.currentTranslate
      const s = this.graph.currentScale

      b = new mxRectangle((b.x + t.x) * s, (b.y + t.y) * s, b.width * s, b.height * s)
    }

    return b
  }

  /**
   * @override
   * Overrides to bypass full cell tree validation.
   * TODO: Check if this improves performance
   */
  viewStateChanged () {
    if (this.graph.useCssTransforms) {
      this.validate(null)
      this.graph.sizeDidChange()
    } else {
      this.revalidate()
      this.graph.sizeDidChange()
    }
  }

  /**
   * @override
   * Overrides validate to normalize validation view state and pass
   * current state to CSS transform.
   */
  // const zero = new mxPoint()
  validate (cell) {
    // EditorUi.js override start
    if (this.graph.container != null && mxUtils.hasScrollbars(this.graph.container)) {
      // FIXME Sets initial state after page changes
      // if (ui.currentPage != null && lastPage !== ui.currentPage) {
      //   lastPage = ui.currentPage
      //   pageChanged = true
      //
      //   // Sets initial translate based on geometries
      //   // to avoid revalidation in sizeDidChange
      //   let bbox = graph.getBoundingBoxFromGeometry(
      //     graph.model.getCells(), true, null, true)
      //
      //   // Handles blank diagrams
      //   if (bbox == null) {
      //     bbox = new mxRectangle(
      //       graph.view.translate.x * graph.view.scale,
      //       graph.view.translate.y * graph.view.scale)
      //   }
      //
      //   const pageLayout = graph.getPageLayout(bbox, zero, 1)
      //   const tr = graph.getDefaultTranslate(pageLayout)
      //   this.x0 = pageLayout.x
      //   this.y0 = pageLayout.y
      //
      //   if (tr.x !== this.translate.x || tr.y !== this.translate.y) {
      //     this.invalidate()
      //     this.translate.x = tr.x
      //     this.translate.y = tr.y
      //   }
      // }

      const pad = this.graph.getPagePadding()
      const size = this.graph.getPageSize()
      const tx = pad.x - (this.x0 || 0) * size.width
      const ty = pad.y - (this.y0 || 0) * size.height

      if (this.translate.x !== tx || this.translate.y !== ty) {
        this.invalidate()
        this.translate.x = tx
        this.translate.y = ty
      }
    }
    // EditorUi.js override start

    // Graph.js override start
    if (this.graph.useCssTransforms) {
      this.graph.currentScale = this.scale
      this.graph.currentTranslate.x = this.translate.x
      this.graph.currentTranslate.y = this.translate.y

      this.scale = 1
      this.translate.x = 0
      this.translate.y = 0
    }

    super.validate(cell)

    if (this.graph.useCssTransforms) {
      this.graph.updateCssTransform()

      this.scale = this.graph.currentScale
      this.translate.x = this.graph.currentTranslate.x
      this.translate.y = this.graph.currentTranslate.y
    }
    // Graph.js override end
  }

  /**
   * @override
   * Reset the list of processed edges.
   */
  resetValidationState () {
    super.resetValidationState()

    this.validEdges = []
  }

  /**
   * @override
   * Updates jumps for valid edges and repaints if needed.
   */
  validateCellState (cell, recurse) {
    recurse = (recurse != null) ? recurse : true
    let state = this.getState(cell)

    // Forces repaint if jumps change on a valid edge
    if (state != null && recurse && this.graph.model.isEdge(state.cell) &&
      state.style != null && state.style[mxConstants.STYLE_CURVED] !== 1 &&
      !state.invalid && this.updateLineJumps(state)) {
      this.graph.cellRenderer.redraw(state, false, this.isRendering())
    }

    state = super.validateCellState(cell, recurse)

    // Adds to the list of edges that may intersect with later edges
    if (state != null && recurse && this.graph.model.isEdge(state.cell) &&
      state.style != null && state.style[mxConstants.STYLE_CURVED] !== 1) {
      // LATER: Reuse jumps for valid edges
      this.validEdges.push(state)
    }

    // FIXME 根据cellValue的connectStatus增加连线动画
    // if (cell && cell.edge && cell.value) {
    //   if (state) {
    //     const path0 = state.shape.node.getElementsByTagName('path')[0]
    //     const path1 = state.shape.node.getElementsByTagName('path')[1]
    //     const path1StrokeWidth = path1.getAttribute('stroke-width')
    //
    //     const debugSignal = store.getters.na2DebugSignal(cell.value.na)
    //
    //     if (this.graph.debugMode && debugSignal && debugSignal.connectStatus === ConnectStatus.OPENED) {
    //       path0.removeAttribute('visibility')
    //       path0.setAttribute('stroke-width', `${Number(path1StrokeWidth) + 2}`)
    //       path0.setAttribute('stroke', 'lightGray')
    //       path1.setAttribute('class', 'flow')
    //     } else {
    //       path0.setAttribute('visibility', 'hidden')
    //       path0.setAttribute('stroke-width', `${Number(path1StrokeWidth) + 8}`)
    //       path0.setAttribute('stroke', 'white')
    //       path1.removeAttribute('class')
    //     }
    //   }
    // }

    return state
  }

  /**
   * @override
   * Updates jumps for invalid edges.
   */
  updateCellState (state) {
    super.updateCellState(state)

    // Updates jumps on invalid edge before repaint
    if (this.graph.model.isEdge(state.cell) &&
      state.style[mxConstants.STYLE_CURVED] !== 1) {
      this.updateLineJumps(state)
    }
  }

  /**
   * @override
   * Updates the jumps between given state and processed edges.
   */
  updateLineJumps (state) {
    const pts = state.absolutePoints

    if (MyMxGraph.lineJumpsEnabled) {
      let changed = state.routedPoints != null
      let actual = null

      if (pts != null && this.validEdges != null &&
        mxUtils.getValue(state.style, 'jumpStyle', 'none') !== 'none') {
        const thresh = 0.5 * this.scale
        changed = false
        actual = []

        // Type 0 means normal waypoint, 1 means jump
        function addPoint (type, x, y) {
          const rpt = new mxPoint(x, y)
          rpt.type = type

          actual.push(rpt)
          const curr = (state.routedPoints != null) ? state.routedPoints[actual.length - 1] : null

          return curr == null || curr.type !== type || curr.x !== x || curr.y !== y
        }

        for (let i = 0; i < pts.length - 1; i++) {
          let p1 = pts[i + 1]
          const p0 = pts[i]
          const list = []

          // Ignores waypoints on straight segments
          let pn = pts[i + 2]

          while (i < pts.length - 2 && mxUtils.ptSegDistSq(p0.x, p0.y, pn.x, pn.y, p1.x, p1.y) < 1 * this.scale * this.scale) {
            p1 = pn
            i++
            pn = pts[i + 2]
          }

          changed = addPoint(0, p0.x, p0.y) || changed

          // Processes all previous edges
          for (let e = 0; e < this.validEdges.length; e++) {
            const state2 = this.validEdges[e]
            const pts2 = state2.absolutePoints

            if (pts2 != null && mxUtils.intersects(state, state2) && state2.style.noJump !== '1') {
              let pl = null

              // Compares each segment of the edge with the current segment
              for (let j = 0; j < pts2.length - 1; j++) {
                let p3 = pts2[j + 1]
                const p2 = pts2[j]

                // Ignores waypoints on straight segments
                pn = pts2[j + 2]

                while (j < pts2.length - 2 && mxUtils.ptSegDistSq(p2.x, p2.y, pn.x, pn.y, p3.x, p3.y) < 1 * this.scale * this.scale) {
                  p3 = pn
                  j++
                  pn = pts2[j + 2]
                }

                const pt = mxUtils.intersection(p0.x, p0.y, p1.x, p1.y, p2.x, p2.y, p3.x, p3.y)

                // Handles intersection between two segments
                if (pt != null && (Math.abs(pt.x - p0.x) > thresh ||
                    Math.abs(pt.y - p0.y) > thresh) &&
                  (Math.abs(pt.x - p1.x) > thresh ||
                    Math.abs(pt.y - p1.y) > thresh) &&
                  // Removes jumps on overlapping incoming segments
                  (pl == null || mxUtils.ptLineDist(p0.x, p0.y, p1.x, p1.y, pl.x, pl.y) > thresh ||
                    mxUtils.ptLineDist(p0.x, p0.y, p1.x, p1.y, p2.x, p2.y) > thresh) &&
                  // Removes jumps on overlapping outgoing segments
                  (pn == null || mxUtils.ptLineDist(p0.x, p0.y, p1.x, p1.y, pn.x, pn.y) > thresh ||
                    mxUtils.ptLineDist(p0.x, p0.y, p1.x, p1.y, p3.x, p3.y) > thresh)) {
                  const dx = pt.x - p0.x
                  const dy = pt.y - p0.y
                  let temp = { distSq: dx * dx + dy * dy, x: pt.x, y: pt.y }

                  // Intersections must be ordered by distance from start of segment
                  for (let t = 0; t < list.length; t++) {
                    if (list[t].distSq > temp.distSq) {
                      list.splice(t, 0, temp)
                      temp = null

                      break
                    }
                  }

                  // Ignores multiple intersections at segment joint
                  if (temp != null && (list.length === 0 ||
                    list[list.length - 1].x !== temp.x ||
                    list[list.length - 1].y !== temp.y)) {
                    list.push(temp)
                  }
                }

                pl = p2
              }
            }
          }

          // Adds ordered intersections to routed points
          for (let j = 0; j < list.length; j++) {
            changed = addPoint(1, list[j].x, list[j].y) || changed
          }
        }

        const pt = pts[pts.length - 1]
        changed = addPoint(0, pt.x, pt.y) || changed
      }

      state.routedPoints = actual

      return changed
    } else {
      return false
    }
  }

  /**
   * @override
   * Adds support for centerPerimeter which is a special case of a fixed point perimeter.
   */
  getFixedTerminalPoint (edge, terminal, source, constraint) {
    if (terminal != null && terminal.style[mxConstants.STYLE_PERIMETER] === 'centerPerimeter') {
      return new mxPoint(terminal.getCenterX(), terminal.getCenterY())
    } else {
      return super.getFixedTerminalPoint(edge, terminal, source, constraint)
    }
  }

  /**
   * @override
   * Adds support for snapToPoint style.
   */
  updateFloatingTerminalPoint (edge, start, end, source) {
    if (start != null && edge != null && (start.style.snapToPoint === '1' || edge.style.snapToPoint === '1')) {
      start = this.getTerminalPort(edge, start, source)
      let next = this.getNextPoint(edge, end, source)

      const orth = this.graph.isOrthogonal(edge)
      const alpha = mxUtils.toRadians(Number(start.style[mxConstants.STYLE_ROTATION] || '0'))
      const center = new mxPoint(start.getCenterX(), start.getCenterY())

      if (alpha !== 0) {
        const cos = Math.cos(-alpha)
        const sin = Math.sin(-alpha)
        next = mxUtils.getRotatedPoint(next, cos, sin, center)
      }

      let border = parseFloat(edge.style[mxConstants.STYLE_PERIMETER_SPACING] || 0)
      border += parseFloat(edge.style[(source)
        ? mxConstants.STYLE_SOURCE_PERIMETER_SPACING
        : mxConstants.STYLE_TARGET_PERIMETER_SPACING] || 0)
      let pt = this.getPerimeterPoint(start, next, alpha === 0 && orth, border)

      if (alpha !== 0) {
        const cos = Math.cos(alpha)
        const sin = Math.sin(alpha)
        pt = mxUtils.getRotatedPoint(pt, cos, sin, center)
      }

      edge.setAbsoluteTerminalPoint(this.snapToAnchorPoint(edge, start, end, source, pt), source)
    } else {
      super.updateFloatingTerminalPoint(edge, start, end, source)
    }
  }

  snapToAnchorPoint (edge, start, end, source, pt) {
    if (start != null && edge != null) {
      const constraints = this.graph.getAllConnectionConstraints(start)
      let nearest = null
      let dist = null

      if (constraints != null) {
        for (let i = 0; i < constraints.length; i++) {
          const cp = this.graph.getConnectionPoint(start, constraints[i])

          if (cp != null) {
            const tmp = (cp.x - pt.x) * (cp.x - pt.x) + (cp.y - pt.y) * (cp.y - pt.y)

            if (dist == null || tmp < dist) {
              nearest = cp
              dist = tmp
            }
          }
        }
      }

      if (nearest != null) {
        pt = nearest
      }
    }

    return pt
  }

  /**
   * Format pixels in the given unit
   */
  formatUnitText (pixels) {
    return pixels ? formatHintText(pixels, this.unit) : pixels
  }
  // +++++++++++++ 原型方法end ++++++++++++++
}
