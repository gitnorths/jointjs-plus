import {
  mxCellMarker,
  mxClient,
  mxConnectionHandler,
  mxConstants,
  mxConstraintHandler,
  mxEdgeHandler,
  mxEllipse,
  mxEvent,
  mxGraph,
  mxGraphHandler,
  mxGraphModel,
  mxGraphView,
  mxGuide,
  mxImage,
  mxMouseEvent,
  mxPoint,
  mxPolyline,
  mxRectangle,
  mxRectangleShape,
  mxRubberband,
  mxStencil,
  mxStencilRegistry,
  mxUtils
} from './index'
import * as R from 'ramda'
import { base64Encode } from '@/renderer/common/util'
import { GRAPH_EDITOR_CONFIG } from './graphEditorConfig'

export function overrideMxGraphPrototype () {
  overrideMxGraphModel()
  overrideMxConstants()
  overrideMxConstraintHandler()
  overrideMxEdgeHandler()
  overrideMxGraph()
  overrideMxGraphView()
  overrideMxRubberBand()
  overrideMxStencil()
  overrideMxConnectionHandler()
  overrideMxVertexHandler()
  overrideGuidesEnabled()
  overrideMxGraphCell()
}

function overrideMxGraphCell () {
  // TODO
}

function overrideMxConnectionHandler () {
  // 预览时是否显示线段头等样式
  // mxConnectionHandler.prototype.livePreview = true
  // 鼠标左键点击指定连线路径
  mxConnectionHandler.prototype.waypointsEnabled = false
  mxConnectionHandler.prototype.outlineConnect = false
  mxConnectionHandler.prototype.moveIconFront = true

  // Overrides to ignore hotspot only for target terminal
  const mxConnectionHandlerCreateMarker = mxConnectionHandler.prototype.createMarker
  mxConnectionHandler.prototype.createMarker = function () {
    const marker = mxConnectionHandlerCreateMarker.apply(this, arguments)

    marker.intersects = mxUtils.bind(this, function (state, evt) {
      if (this.isConnecting()) {
        return true
      }

      return mxCellMarker.prototype.intersects.apply(marker, arguments)
    })

    return marker
  }
}

function overrideMxConstants () {
  // mxConstants.HANDLE_FILLCOLOR = '#99ccff';
  // mxConstants.HANDLE_STROKECOLOR = '#0088cf';
  // mxConstants.VERTEX_SELECTION_COLOR = '#00a8ff';
  mxConstants.VERTEX_SELECTION_STROKEWIDTH = 2
  mxConstants.DEFAULT_HOTSPOT = 1
  mxConstants.LABEL_HANDLE_SIZE = 6 // label小方框的大小默认是4
  mxConstants.CURSOR_LABEL_HANDLE = 'move'
}

function overrideMxConstraintHandler () {
  mxConstraintHandler.prototype.createHighlightShape = function () {
    return new mxEllipse(null, this.highlightColor, this.highlightColor, 4)
  }
  mxConstraintHandler.prototype.pointImage = new mxImage('icon/point.gif', 10, 10)
}

function overrideMxEdgeHandler () {
  mxEdgeHandler.prototype.virtualBendsEnabled = true // 线段可以弯曲
  mxEdgeHandler.prototype.snapToTerminals = true // 指定路径点是否应该吸附到终端的路由中心
  // 不允许连到图形中间
  mxEdgeHandler.prototype.isConnectableCell = function (cell) {
    return false
  }
}

function overrideMxRubberBand () {
  // 增加默认不透明度(默认为20)
  mxRubberband.prototype.defaultOpacity = 30
  mxRubberband.prototype.fadeOut = true// Enables fading of rubberband
}

function overrideMxStencil () {
  mxStencilRegistry.addStencil = function (name, stencil) {
    if (name) {
      mxStencilRegistry.stencils[name.toLowerCase()] = stencil
    }
  }

  mxStencilRegistry.getStencil = function (name) {
    return name ? mxStencilRegistry.stencils[name.toLowerCase()] : null
  }

  // 混入标题
  mxStencil.prototype.evaluateTextAttribute = function (node, attribute, shape) {
    const key = this.evaluateAttribute(node, attribute, shape)
    // loc:0表示直接显示key
    // loc:1表示key代表变量的路径，需要从cellValue获取真实的值
    const loc = node.getAttribute('localized')
    // showValue : 0 表示不显示；其他值表示需要显示
    const showValue = node.getAttribute('showText')
    // valueList 有值表示key需要从值列表(valueList)获取真实值
    const valueListPathStr = node.getAttribute('valueList')

    // showValue : 0 表示不key
    if (R.equals('0', R.toString(showValue))) {
      return ''
    }
    // 不存在cell，返回key
    const cell = R.path(['state', 'cell'])(shape)
    if (!cell) {
      return key
    }
    const cellValue = cell.value
    // 不存在cellValue
    if (!cellValue) {
      // 符号预览图需要显示变量名
      if (R.equals('1', loc) || mxStencil.defaultLocalized) {
        // 当loc=1时，key形如inputs.xxx.alias,outputs.xxx.name的格式，
        // 需要从key中提取变量名xxx用于显示
        const firstKey = key.split(',')[0]
        const attrName = firstKey.replace(/^(inputs|outputs|params)\./, '').replace(/\.(name|alias)$/, '')
        if (/\.listArrSetValues\..*_\d+\.value$/.test(attrName)) {
          // 连闭锁
          return '---'
        }
        return attrName
      } else {
        return key
      }
    }
    // cellValue有值
    if (R.equals('1', loc) || mxStencil.defaultLocalized) {
      // 形如 inputs.xxx.alias,inputs.xxx.name的格式转换为[[inputs,xxx,alias],[inputs,xxx,name]]
      const optionalAttrPaths = []
      const optionalKeyArr = key.split(',')
      for (const optionalKey of optionalKeyArr) {
        const dotArr = optionalKey.split('.')
        if (/^(inputs|outputs|params)\..+\.(alias|name)$/.test(optionalKey)) {
          const naArr = []
          const newArr = []
          newArr.push(dotArr[0])
          const end = /(\._\d+)$/.test(optionalKey) ? dotArr.length - 2 : dotArr.length - 1
          for (let i = 1; i < end; i++) {
            naArr.push(dotArr[i])
          }
          newArr.push(naArr.join('.'))
          if (/(\._\d+)$/.test(optionalKey)) {
            newArr.push(dotArr[dotArr.length - 2])
          }
          newArr.push(dotArr[dotArr.length - 1])

          optionalAttrPaths.push(newArr)
        } else {
          optionalAttrPaths.push(dotArr)
        }
      }
      let attrStr = ''
      for (const attrPathArr of optionalAttrPaths) {
        let attrVal = cellValue
        for (const attrKey of attrPathArr) {
          if (attrVal instanceof Array) {
            attrVal = R.find(R.propEq(attrKey, 'name'))(attrVal)
          } else {
            attrVal = R.prop(attrKey)(attrVal)
          }
        }
        if (attrVal !== null && attrVal !== undefined && attrVal !== '') {
          // 如果存在值列表，形如空格分隔的字符串"50hz 60hz"则需要转换为值列表的真实值
          if (valueListPathStr) {
            const valueListPaths = valueListPathStr.split('.')
            let valueListStr = cellValue
            for (const attrKey of valueListPaths) {
              if (valueListStr instanceof Array) {
                valueListStr = R.find(R.propEq(attrKey, 'name'))(valueListStr)
              } else {
                valueListStr = R.prop(attrKey)(valueListStr)
              }
            }
            const valueListArr = R.is(String, valueListStr) ? valueListStr.split(' ') : []
            const index = Number(attrVal)
            if (R.is(Number, index) && R.isNotEmpty(valueListArr)) {
              attrStr = valueListArr[index]
            } else {
              attrStr = attrVal
            }
          } else {
            attrStr = attrVal
          }
          break
        }
      }
      return attrStr
    }

    return key
  }
  /**
   * Function: drawNode
   *
   * Draws this stencil inside the given bounds.
   */
  mxStencil.prototype.drawNode = function (canvas, shape, node, aspect, disableShadow, paint) {
    // TODO shape绘制路径，绘制前根据属性改变颜色、子图
    const name = node.nodeName
    const x0 = aspect.x
    const y0 = aspect.y
    const sx = aspect.width
    const sy = aspect.height
    const minScale = Math.min(sx, sy)

    if (name === 'save') {
      canvas.save()
    } else if (name === 'restore') {
      canvas.restore()
    } else if (paint) {
      if (name === 'path') {
        canvas.begin()

        let parseRegularly = true

        if (node.getAttribute('rounded') === '1') {
          parseRegularly = false

          const arcSize = Number(node.getAttribute('arcSize'))
          let pointCount = 0
          const segs = []

          // Renders the elements inside the given path
          let childNode = node.firstChild

          while (childNode != null) {
            if (childNode.nodeType === mxConstants.NODETYPE_ELEMENT) {
              const childName = childNode.nodeName

              if (childName === 'move' || childName === 'line') {
                if (childName === 'move' || segs.length === 0) {
                  segs.push([])
                }

                segs[segs.length - 1].push(new mxPoint(x0 + Number(childNode.getAttribute('x')) * sx,
                  y0 + Number(childNode.getAttribute('y')) * sy))
                pointCount++
              } else {
                // We only support move and line for rounded corners
                parseRegularly = true
                break
              }
            }

            childNode = childNode.nextSibling
          }

          if (!parseRegularly && pointCount > 0) {
            for (let i = 0; i < segs.length; i++) {
              let close = false
              const ps = segs[i][0]
              const pe = segs[i][segs[i].length - 1]

              if (ps.x === pe.x && ps.y === pe.y) {
                segs[i].pop()
                close = true
              }

              this.addPoints(canvas, segs[i], true, arcSize, close)
            }
          } else {
            parseRegularly = true
          }
        }

        if (parseRegularly) {
          // Renders the elements inside the given path
          let childNode = node.firstChild

          while (childNode != null) {
            if (childNode.nodeType === mxConstants.NODETYPE_ELEMENT) {
              this.drawNode(canvas, shape, childNode, aspect, disableShadow, paint)
            }

            childNode = childNode.nextSibling
          }
        }
      } else if (name === 'close') {
        canvas.close()
      } else if (name === 'move') {
        canvas.moveTo(x0 + Number(node.getAttribute('x')) * sx, y0 + Number(node.getAttribute('y')) * sy)
      } else if (name === 'line') {
        canvas.lineTo(x0 + Number(node.getAttribute('x')) * sx, y0 + Number(node.getAttribute('y')) * sy)
      } else if (name === 'quad') {
        canvas.quadTo(x0 + Number(node.getAttribute('x1')) * sx,
          y0 + Number(node.getAttribute('y1')) * sy,
          x0 + Number(node.getAttribute('x2')) * sx,
          y0 + Number(node.getAttribute('y2')) * sy)
      } else if (name === 'curve') {
        canvas.curveTo(x0 + Number(node.getAttribute('x1')) * sx,
          y0 + Number(node.getAttribute('y1')) * sy,
          x0 + Number(node.getAttribute('x2')) * sx,
          y0 + Number(node.getAttribute('y2')) * sy,
          x0 + Number(node.getAttribute('x3')) * sx,
          y0 + Number(node.getAttribute('y3')) * sy)
      } else if (name === 'arc') {
        canvas.arcTo(Number(node.getAttribute('rx')) * sx,
          Number(node.getAttribute('ry')) * sy,
          Number(node.getAttribute('x-axis-rotation')),
          Number(node.getAttribute('large-arc-flag')),
          Number(node.getAttribute('sweep-flag')),
          x0 + Number(node.getAttribute('x')) * sx,
          y0 + Number(node.getAttribute('y')) * sy)
      } else if (name === 'rect') {
        canvas.rect(x0 + Number(node.getAttribute('x')) * sx,
          y0 + Number(node.getAttribute('y')) * sy,
          Number(node.getAttribute('w')) * sx,
          Number(node.getAttribute('h')) * sy)
      } else if (name === 'roundrect') {
        let arcsize = Number(node.getAttribute('arcsize'))

        if (arcsize === 0) {
          arcsize = mxConstants.RECTANGLE_ROUNDING_FACTOR * 100
        }

        const w = Number(node.getAttribute('w')) * sx
        const h = Number(node.getAttribute('h')) * sy
        const factor = Number(arcsize) / 100
        const r = Math.min(w * factor, h * factor)

        canvas.roundrect(x0 + Number(node.getAttribute('x')) * sx,
          y0 + Number(node.getAttribute('y')) * sy,
          w, h, r, r)
      } else if (name === 'ellipse') {
        canvas.ellipse(x0 + Number(node.getAttribute('x')) * sx,
          y0 + Number(node.getAttribute('y')) * sy,
          Number(node.getAttribute('w')) * sx,
          Number(node.getAttribute('h')) * sy)
      } else if (name === 'image') {
        if (!shape.outline) {
          const src = this.evaluateAttribute(node, 'src', shape)

          canvas.image(x0 + Number(node.getAttribute('x')) * sx,
            y0 + Number(node.getAttribute('y')) * sy,
            Number(node.getAttribute('w')) * sx,
            Number(node.getAttribute('h')) * sy,
            src, false, node.getAttribute('flipH') === '1',
            node.getAttribute('flipV') === '1')
        }
      } else if (name === 'text') {
        if (!shape.outline) {
          const str = this.evaluateTextAttribute(node, 'str', shape)
          let rotation = node.getAttribute('vertical') === '1' ? -90 : 0

          if (node.getAttribute('align-shape') === '0') {
            const dr = shape.rotation

            // Depends on flipping
            const flipH = mxUtils.getValue(shape.style, mxConstants.STYLE_FLIPH, 0) === 1
            const flipV = mxUtils.getValue(shape.style, mxConstants.STYLE_FLIPV, 0) === 1

            if (flipH && flipV) {
              rotation -= dr
            } else if (flipH || flipV) {
              rotation += dr
            } else {
              rotation -= dr
            }
          }

          rotation -= node.getAttribute('rotation')

          canvas.text(x0 + Number(node.getAttribute('x')) * sx,
            y0 + Number(node.getAttribute('y')) * sy,
            0, 0, str, node.getAttribute('align') || 'left',
            node.getAttribute('valign') || 'top', false, '',
            null, false, rotation)
        }
      } else if (name === 'include-shape') {
        const stencil = mxStencilRegistry.getStencil(node.getAttribute('name'))

        if (stencil != null) {
          const x = x0 + Number(node.getAttribute('x')) * sx
          const y = y0 + Number(node.getAttribute('y')) * sy
          const w = Number(node.getAttribute('w')) * sx
          const h = Number(node.getAttribute('h')) * sy

          stencil.drawShape(canvas, shape, x, y, w, h)
        }
      } else if (name === 'fillstroke') {
        canvas.fillAndStroke()
      } else if (name === 'fill') {
        canvas.fill()
      } else if (name === 'stroke') {
        canvas.stroke()
      } else if (name === 'strokewidth') {
        const s = (node.getAttribute('fixed') === '1') ? 1 : minScale
        canvas.setStrokeWidth(Number(node.getAttribute('width')) * s)
      } else if (name === 'dashed') {
        canvas.setDashed(node.getAttribute('dashed') === '1')
      } else if (name === 'dashpattern') {
        let value = node.getAttribute('pattern')

        if (value != null) {
          const tmp = value.split(' ')
          const pat = []

          for (let i = 0; i < tmp.length; i++) {
            if (tmp[i].length > 0) {
              pat.push(Number(tmp[i]) * minScale)
            }
          }

          value = pat.join(' ')
          canvas.setDashPattern(value)
        }
      } else if (name === 'strokecolor') {
        canvas.setStrokeColor(node.getAttribute('color'))
      } else if (name === 'linecap') {
        canvas.setLineCap(node.getAttribute('cap'))
      } else if (name === 'linejoin') {
        canvas.setLineJoin(node.getAttribute('join'))
      } else if (name === 'miterlimit') {
        canvas.setMiterLimit(Number(node.getAttribute('limit')))
      } else if (name === 'fillcolor') {
        canvas.setFillColor(node.getAttribute('color'))
      } else if (name === 'alpha') {
        canvas.setAlpha(node.getAttribute('alpha'))
      } else if (name === 'fillalpha') {
        canvas.setAlpha(node.getAttribute('alpha'))
      } else if (name === 'strokealpha') {
        canvas.setAlpha(node.getAttribute('alpha'))
      } else if (name === 'fontcolor') {
        canvas.setFontColor(node.getAttribute('color'))
      } else if (name === 'fontstyle') {
        canvas.setFontStyle(node.getAttribute('style'))
      } else if (name === 'fontfamily') {
        canvas.setFontFamily(node.getAttribute('family'))
      } else if (name === 'fontsize') {
        canvas.setFontSize(Number(node.getAttribute('size')) * minScale)
      }

      if (disableShadow && (name === 'fillstroke' || name === 'fill' || name === 'stroke')) {
        disableShadow = false
        canvas.setShadow(false)
      }
    }
  }
  // Loads the stencils into the registry
  const req = mxUtils.load('mxgraph/stencils/basic.xml')
  const root = req.getDocumentElement()
  let shape = root.firstChild
  // console.log(req, root, shape);
  while (shape != null) {
    if (shape.nodeType === mxConstants.NODETYPE_ELEMENT) {
      mxStencilRegistry.addStencil(shape.getAttribute('name'), new mxStencil(shape))
    }
    shape = shape.nextSibling
  }
}

function overrideMxVertexHandler () {
  // mxVertexHandler.prototype.rotationEnabled = true; // 是否可以旋转
}

function overrideMxGraphView () {
  /**
   * Function: getGraphBounds
   * Overrides getGraphBounds to use bounding box from SVG.
   */
  mxGraphView.prototype.getGraphBounds = function () {
    let b = this.graphBounds

    if (this.graph.useCssTransforms) {
      const t = this.graph.currentTranslate
      const s = this.graph.currentScale

      b = new mxRectangle((b.x + t.x) * s, (b.y + t.y) * s, b.width * s, b.height * s)
    }

    return b
  }

  // Creates background page shape
  mxGraphView.prototype.createBackgroundPageShape = function (bounds) {
    return new mxRectangleShape(bounds, '#ffffff', this.graph.defaultPageBorderColor)
  }

  // Fits the number of background pages to the graph
  mxGraphView.prototype.getBackgroundPageBounds = function () {
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

  // Uses HTML for background pages (to support grid background image)
  mxGraphView.prototype.validateBackgroundPage = function () {
    const graph = this.graph

    // transparentBackground后加属性
    // if (graph.container != null && !graph.transparentBackground)
    if (graph.container != null) {
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

            // Shadow filter causes problems in outline window in quirks mode. IE8 standards
            // also has known rendering issues inside mxWindow but not using shadow is worse.
            this.backgroundPageShape.isShadow = !mxClient.IS_QUIRKS
            this.backgroundPageShape.dialect = mxConstants.DIALECT_STRICTHTML
            this.backgroundPageShape.init(graph.container)

            // Required for the browser to render the background page in correct order
            firstChild.style.position = 'absolute'
            graph.container.insertBefore(this.backgroundPageShape.node, firstChild)
            this.backgroundPageShape.redraw()

            // FIXME Adds listener for double click handling on background
            // mxEvent.addListener(this.backgroundPageShape.node, 'dblclick',
            //   mxUtils.bind(this, function (evt) {
            //     graph.dblClick(evt);
            //   })
            // );

            // Adds basic listeners for graph event dispatching outside of the
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

      this.validateBackgroundStyles()
    }
  }

  // Updates the CSS of the background to draw the grid
  mxGraphView.prototype.validateBackgroundStyles = function () {
    const graph = this.graph
    const color = (graph.background == null || graph.background === mxConstants.NONE) ? GRAPH_EDITOR_CONFIG.gridBackgroundColor : graph.background
    const gridColor = (color != null && GRAPH_EDITOR_CONFIG.gridColor !== color.toLowerCase()) ? GRAPH_EDITOR_CONFIG.gridColor : '#ffffff'
    let image = 'none'
    let position = ''

    if (graph.isGridEnabled()) {
      let phase = 10

      if (mxClient.IS_SVG) {
        // Generates the SVG required for drawing the dynamic grid
        image = unescape(encodeURIComponent(this.createSvgGrid(gridColor)))
        image = (window.btoa) ? btoa(image) : base64Encode(image, true)
        image = 'url(' + 'data:image/svg+xml;base64,' + image + ')'
        phase = graph.gridSize * this.scale * GRAPH_EDITOR_CONFIG.gridSteps
      } else {
        // Fallback to grid wallpaper with fixed size
        // FIXME image
        // image = 'url(' + this.gridImage + ')';
      }

      let x0 = 0
      let y0 = 0

      if (graph.view.backgroundPageShape != null) {
        const bds = this.getBackgroundPageBounds()

        x0 = 1 + bds.x
        y0 = 1 + bds.y
      }

      // Computes the offset to maintain origin for grid
      position = -Math.round(phase - mxUtils.mod(this.translate.x * this.scale - x0, phase)) + 'px ' +
        -Math.round(phase - mxUtils.mod(this.translate.y * this.scale - y0, phase)) + 'px'
    }

    let canvas = graph.view.canvas

    if (canvas.ownerSVGElement != null) {
      canvas = canvas.ownerSVGElement
    }

    if (graph.view.backgroundPageShape != null) {
      graph.view.backgroundPageShape.node.style.backgroundPosition = position
      graph.view.backgroundPageShape.node.style.backgroundImage = image
      graph.view.backgroundPageShape.node.style.backgroundColor = color

      // FIXME 设置画布边界，后加的代码，要确认效果
      // this.backgroundPageShape.node.style.border = '1px solid white';
      // this.backgroundPageShape.node.style.backgroundRepeat = 'repeat';
      // this.backgroundPageShape.node.style.boxShadow = '2px 2px 1px #E6E6E6';

      canvas.style.backgroundImage = 'none'
      canvas.style.backgroundColor = ''
    } else {
      canvas.style.backgroundPosition = position
      canvas.style.backgroundColor = color
      canvas.style.backgroundImage = image
    }
  }

  // Returns the SVG required for painting the background grid.
  mxGraphView.prototype.createSvgGrid = function (color) {
    let tmp = this.graph.gridSize * this.scale

    while (tmp < GRAPH_EDITOR_CONFIG.minGridSize) {
      tmp *= 2
    }

    const tmp2 = GRAPH_EDITOR_CONFIG.gridSteps * tmp

    // Small grid lines
    const d = []

    for (let i = 1; i < GRAPH_EDITOR_CONFIG.gridSteps; i++) {
      const tmp3 = i * tmp
      d.push('M 0 ' + tmp3 + ' L ' + tmp2 + ' ' + tmp3 + ' M ' + tmp3 + ' 0 L ' + tmp3 + ' ' + tmp2)
    }

    // KNOWN: Rounding errors for certain scales (eg. 144%, 121% in Chrome, FF and Safari). Workaround
    // in Chrome is to use 100% for the svg size, but this results in blurred grid for large diagrams.
    return '<svg width="' + tmp2 + '" height="' + tmp2 + '" xmlns="' + mxConstants.NS_SVG + '">' +
      '<defs>' +
      '<pattern id="grid" width="' + tmp2 + '" height="' + tmp2 + '" patternUnits="userSpaceOnUse">' +
      '<path d="' + d.join(' ') + '" fill="none" stroke="' + color + '" opacity="0.2" stroke-width="1"/>' +
      '<path d="M ' + tmp2 + ' 0 L 0 0 0 ' + tmp2 + '" fill="none" stroke="' + color + '" stroke-width="1"/>' +
      '</pattern>' +
      '</defs>' +
      '<rect width="100%" height="100%" fill="url(#grid)"/>' +
      '</svg>'
  }
}

function overrideMxGraph () {
  // Adds panning for the grid with no page view and disabled scrollbars
  const mxGraphPanGraph = mxGraph.prototype.panGraph
  mxGraph.prototype.panGraph = function (dx, dy) {
    mxGraphPanGraph.apply(this, arguments)

    if (this.shiftPreview1 != null) {
      let canvas = this.view.canvas

      if (canvas.ownerSVGElement != null) {
        canvas = canvas.ownerSVGElement
      }

      const phase = this.gridSize * this.view.scale * this.view.gridSteps
      const position = -Math.round(phase - mxUtils.mod(this.view.translate.x * this.view.scale + dx, phase)) + 'px ' +
        -Math.round(phase - mxUtils.mod(this.view.translate.y * this.view.scale + dy, phase)) + 'px'
      canvas.style.backgroundPosition = position
    }
  }
  // Draws page breaks only within the page
  mxGraph.prototype.updatePageBreaks = function (visible, width, height) {
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
          breaks[i].destroy()
        }

        breaks.splice(count, breaks.length - count)
      }
    })

    drawPageBreaks(this.horizontalPageBreaks)
    drawPageBreaks(this.verticalPageBreaks)
  }

  const isLabelMovable = mxGraph.prototype.isLabelMovable
  mxGraph.prototype.isLabelMovable = function (cell) {
    if (cell && cell.edge) {
      return true
    }
    return isLabelMovable.apply(this, arguments)
  }
}

function overrideMxGraphModel () {
  // Keeps edges between relative child cells inside parent
  mxGraphModel.prototype.ignoreRelativeEdgeParent = false
}

function overrideGuidesEnabled () {
  mxGraphHandler.prototype.guidesEnabled = true
  mxGuide.prototype.isEnabledForEvent = function (evt) {
    return !mxEvent.isControlDown(evt)
  }
}
