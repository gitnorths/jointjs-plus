export function overrideMxShape (mxOutput) {
  const { mxEvent, mxShape, mxRectangle, mxConstants, mxUtils, mxSvgCanvas2D, mxPoint } = mxOutput
  /**
   * Variable: forceFilledPointerEvents
   *
   * Specifies if pointerEvents should be forced for filled shapes. Default is
   * false.
   */
  mxShape.forceFilledPointerEvents = true
  /**
   * Function: create
   *
   * Creates and returns the DOM node(s) for the shape in
   * the given container. This implementation invokes
   * <createSvg> or <createHtml> depending container
   * type.
   *
   * Parameters:
   *
   * container - DOM node that will contain the shape.
   */
  mxShape.prototype.create = function (container) {
    let node

    if (container != null && container.ownerSVGElement != null) {
      node = this.createSvg(container)
    } else {
      node = this.createHtml(container)
    }

    return node
  }

  /**
   * Function: redraw
   *
   * Creates and returns the SVG node(s) to represent this shape.
   */
  mxShape.prototype.redraw = function () {
    this.updateBoundsFromPoints()

    if (this.visible && this.checkBounds()) {
      this.node.style.visibility = 'visible'
      this.clear()

      if (this.node.nodeName === 'DIV') {
        this.redrawHtmlShape()
      } else {
        this.redrawShape()
      }
    } else {
      this.node.style.visibility = 'hidden'
      this.boundingBox = null
    }
  }

  /**
   * Function: clear
   *
   * Removes all child nodes and resets all CSS.
   */
  mxShape.prototype.clear = function () {
    if (this.node.ownerSVGElement != null) {
      while (this.node.lastChild != null) {
        this.node.removeChild(this.node.lastChild)
      }
    } else {
      this.node.style.cssText = 'position:absolute;' + ((this.cursor != null)
        ? ('cursor:' + this.cursor + ';')
        : '')
      this.node.innerText = ''
    }
  }
  /**
   * Function: updateBoundsFromPoints
   *
   * Updates the bounds based on the points.
   */
  mxShape.prototype.updateBoundsFromPoints = function () {
    const pts = this.points

    if (pts != null && pts.length > 0 && pts[0] != null) {
      this.bounds = new mxRectangle(Number(pts[0].x), Number(pts[0].y), this.scale, this.scale)

      for (let i = 1; i < this.points.length; i++) {
        if (pts[i] != null) {
          this.bounds.add(new mxRectangle(Number(pts[i].x), Number(pts[i].y), this.scale, this.scale))
        }
      }
    }
  }
  /**
   * Function: getShadowStyle
   *
   * Removes all child nodes and resets all CSS.
   */
  mxShape.prototype.getShadowStyle = function () {
    const s = {
      dx: mxConstants.SHADOW_OFFSET_X,
      dy: mxConstants.SHADOW_OFFSET_Y,
      blur: mxConstants.SHADOW_BLUR,
      color: mxConstants.SHADOWCOLOR,
      opacity: mxConstants.SHADOW_OPACITY * 100
    }

    if (this.style != null) {
      s.dx = mxUtils.getValue(this.style,
        mxConstants.STYLE_SHADOW_OFFSET_X, s.dx)
      s.dy = mxUtils.getValue(this.style,
        mxConstants.STYLE_SHADOW_OFFSET_Y, s.dy)
      s.blur = mxUtils.getValue(this.style,
        mxConstants.STYLE_SHADOW_BLUR, s.blur)
      s.color = mxUtils.getValue(this.style,
        mxConstants.STYLE_SHADOWCOLOR, s.color)
      s.opacity = mxUtils.getValue(this.style,
        mxConstants.STYLE_SHADOW_OPACITY, s.opacity)
    }

    return s
  }

  /**
   * Function: createDropShadow
   *
   * Removes all child nodes and resets all CSS.
   */
  mxShape.prototype.createDropShadow = function (style, scale) {
    return 'drop-shadow(' + Math.round(style.dx * scale * 100) / 100 + 'px ' +
      Math.round(style.dy * scale * 100) / 100 + 'px ' +
      Math.round(style.blur * scale * 100) / 100 + 'px ' +
      mxUtils.hex2rgba(style.color, style.opacity / 100) + ')'
  }

  /**
   * Function: updateSvgFilters
   *
   * Removes all child nodes and resets all CSS.
   */
  mxShape.prototype.updateSvgFilters = function (scale) {
    this.node.style.filter = (this.isShadowEnabled())
      ? this.createDropShadow(this.getShadowStyle(), scale)
      : ''
  }

  /**
   * Function: isShadowEnabled
   *
   * Removes all child nodes and resets all CSS.
   */
  mxShape.prototype.isShadowEnabled = function () {
    return this.isShadow
  }

  /**
   * Function: redrawShape
   *
   * Updates the SVG shape.
   */
  mxShape.prototype.redrawShape = function () {
    const canvas = this.createCanvas()

    if (canvas != null) {
      // Specifies if events should be handled
      canvas.pointerEvents = this.pointerEvents
      this.beforePaint(canvas)
      this.paint(canvas)
      this.afterPaint(canvas)
      this.destroyCanvas(canvas)
    }
  }
  /**
   * Function: createCanvas
   *
   * Creates a new canvas for drawing this shape. May return null.
   */
  mxShape.prototype.createCanvas = function () {
    let canvas = null

    // LATER: Check if reusing existing DOM nodes improves performance
    if (this.node.ownerSVGElement != null) {
      canvas = this.createSvgCanvas()
    }

    if (canvas != null && this.outline) {
      canvas.setStrokeWidth(this.strokewidth)
      canvas.setStrokeColor(this.stroke)

      if (this.isDashed != null) {
        canvas.setDashed(this.isDashed)
      }

      canvas.setStrokeWidth = function () {
        // TODO
      }
      canvas.setStrokeColor = function () {
        // TODO
      }
      canvas.setFillColor = function () {
        // TODO
      }
      canvas.setGradient = function () {
        // TODO
      }
      canvas.setDashed = function () {
        // TODO
      }
      canvas.text = function () {
        // TODO
      }
    }

    return canvas
  }
  /**
   * Function: createSvgCanvas
   *
   * Creates and returns an <mxSvgCanvas2D> for rendering this shape.
   */
  mxShape.prototype.createSvgCanvas = function () {
    const canvas = new mxSvgCanvas2D(this.node, false)
    canvas.strokeTolerance = this.svgStrokeTolerance
    canvas.pointerEventsValue = this.svgPointerEvents
    const off = this.getSvgScreenOffset()

    if (off !== 0) {
      this.node.setAttribute('transform', 'translate(' + off + ',' + off + ')')
    } else {
      this.node.removeAttribute('transform')
    }

    canvas.minStrokeWidth = this.minSvgStrokeWidth

    if (!this.antiAlias) {
      // Rounds all numbers in the SVG output to integers
      canvas.format = function (value) {
        return Math.round(parseFloat(value))
      }
    }

    return canvas
  }

  /**
   * Function: updateHtmlColors
   *
   * Allow optimization by replacing VML with HTML.
   */
  mxShape.prototype.updateHtmlColors = function (node) {
    let color = this.stroke

    if (color != null && color !== mxConstants.NONE) {
      node.style.borderColor = color

      if (this.isDashed) {
        node.style.borderStyle = 'dashed'
      } else if (this.strokewidth > 0) {
        node.style.borderStyle = 'solid'
      }

      node.style.borderWidth = Math.max(1, Math.ceil(this.strokewidth * this.scale)) + 'px'
    } else {
      node.style.borderWidth = '0px'
    }

    color = (this.outline) ? null : this.fill

    if (color != null && color !== mxConstants.NONE) {
      node.style.backgroundColor = color
      node.style.backgroundImage = 'none'
    } else if (this.pointerEvents) {
      node.style.backgroundColor = 'transparent'
    } else {
      this.setTransparentBackgroundImage(node)
    }
  }

  /**
   * Function: updateHtmlBounds
   *
   * Allow optimization by replacing VML with HTML.
   */
  mxShape.prototype.updateHtmlBounds = function (node) {
    let sw = Math.ceil(this.strokewidth * this.scale)
    node.style.borderWidth = Math.max(1, sw) + 'px'
    node.style.overflow = 'hidden'

    node.style.left = Math.round(this.bounds.x - sw / 2) + 'px'
    node.style.top = Math.round(this.bounds.y - sw / 2) + 'px'

    if (document.compatMode === 'CSS1Compat') {
      sw = -sw
    }

    node.style.width = Math.round(Math.max(0, this.bounds.width + sw)) + 'px'
    node.style.height = Math.round(Math.max(0, this.bounds.height + sw)) + 'px'
  }

  /**
   * Function: destroyCanvas
   *
   * Destroys the given canvas which was used for drawing. This implementation
   * increments the reference counts on all shared gradients used in the canvas.
   */
  mxShape.prototype.destroyCanvas = function (canvas) {
    // Manages reference counts
    if (canvas instanceof mxSvgCanvas2D) {
      // Increments ref counts
      for (const key in canvas.gradients) {
        const gradient = canvas.gradients[key]

        if (gradient != null) {
          gradient.mxRefCount = (gradient.mxRefCount || 0) + 1
        }
      }

      for (const key in canvas.fillPatterns) {
        const pattern = canvas.fillPatterns[key]

        if (pattern != null) {
          pattern.mxRefCount = (pattern.mxRefCount || 0) + 1
        }
      }

      this.releaseSvgGradients(this.oldGradients)
      this.releaseSvgFillPatterns(this.oldFillPatterns)
      this.oldGradients = canvas.gradients
      this.oldFillPatterns = canvas.fillPatterns
    }
  }
  /**
   * Function: paint
   *
   * Generic rendering code.
   */
  mxShape.prototype.paint = function (c) {
    const pointerEvents = c.pointerEvents
    let strokeDrawn = false

    if (c != null && this.outline) {
      const stroke = c.stroke

      c.stroke = function () {
        strokeDrawn = true
        stroke.apply(this, arguments)
      }

      const fillAndStroke = c.fillAndStroke

      c.fillAndStroke = function () {
        strokeDrawn = true
        fillAndStroke.apply(this, arguments)
      }
    }

    // Scale is passed-through to canvas
    const s = this.scale
    let x = this.bounds.x / s
    let y = this.bounds.y / s
    let w = this.bounds.width / s
    let h = this.bounds.height / s

    if (this.isPaintBoundsInverted()) {
      const t = (w - h) / 2
      x += t
      y -= t
      const tmp = w
      w = h
      h = tmp
    }

    this.updateTransform(c, x, y, w, h)
    this.configureCanvas(c, x, y, w, h)
    this.updateSvgFilters((c != null) ? c.state.scale : s)

    // Adds background rectangle to capture events
    let bg = null

    if ((this.stencil == null && this.points == null && this.shapePointerEvents) ||
      (this.stencil != null && this.stencilPointerEvents)) {
      const bb = this.createBoundingBox()

      if (this.dialect === mxConstants.DIALECT_SVG) {
        bg = this.createTransparentSvgRectangle(bb.x, bb.y, bb.width, bb.height)
        this.node.appendChild(bg)
      } else {
        const rect = c.createRect('rect', bb.x / s, bb.y / s, bb.width / s, bb.height / s)
        rect.appendChild(c.createTransparentFill())
        rect.stroked = 'false'
        c.root.appendChild(rect)
      }
    }

    if (this.stencil != null) {
      this.stencil.drawShape(c, this, x, y, w, h)
    } else {
      // Stencils have separate strokewidth
      c.setStrokeWidth(this.strokewidth)
      const pts = this.getWaypoints()

      if (pts != null) {
        // Paints edge shape
        if (pts.length > 1) {
          this.paintEdgeShape(c, pts)
        }
      } else {
        // Paints vertex shape
        this.paintVertexShape(c, x, y, w, h)
      }
    }

    if (bg != null && c.state != null && c.state.transform != null) {
      bg.setAttribute('transform', c.state.transform)
    }

    // Draws highlight rectangle if no stroke was used
    if (c != null && this.outline && !strokeDrawn) {
      c.rect(x, y, w, h)
      c.stroke()
    }

    c.pointerEvents = pointerEvents
  }

  /**
   * Function: getWaypoints
   *
   * Returns the array of non-overlapping, unscaled points.
   */
  mxShape.prototype.getWaypoints = function () {
    const pts = this.points
    let result = null

    if (pts != null) {
      result = []

      if (pts.length > 0) {
        const s = this.scale
        const t = Math.max(s, 1)
        let p0 = pts[0]
        result.push(new mxPoint(p0.x / s, p0.y / s))

        for (let i = 1; i < pts.length; i++) {
          const pe = pts[i]

          if (Math.abs(p0.x - pe.x) >= t ||
            Math.abs(p0.y - pe.y) >= t) {
            result.push(new mxPoint(pe.x / s, pe.y / s))
          }

          p0 = pe
        }
      }
    }

    return result
  }
  /**
   * Function: configureCanvas
   *
   * Sets the state of the canvas for drawing the shape.
   */
  mxShape.prototype.configureCanvas = function (c, x, y, w, h) {
    let dash = null

    if (this.style != null) {
      dash = this.style.dashPattern
    }

    c.setAlpha(this.opacity / 100)
    c.setFillAlpha(this.fillOpacity / 100)
    c.setStrokeAlpha(this.strokeOpacity / 100)

    // Sets alpha, colors and gradients
    if (this.isShadow != null) {
      c.setShadow(this.isShadow, this.shadowStyle)
    }

    // Dash pattern
    if (this.isDashed != null) {
      c.setDashed(this.isDashed, (this.style != null)
        ? mxUtils.getValue(
        this.style, mxConstants.STYLE_FIX_DASH, false) === 1
        : false)
    }

    if (dash != null) {
      c.setDashPattern(dash)
    }

    if (this.fill != null && this.fill !== mxConstants.NONE &&
      this.gradient && this.gradient !== mxConstants.NONE) {
      const b = this.getGradientBounds(c, x, y, w, h)
      c.setGradient(this.fill, this.gradient, b.x, b.y,
        b.width, b.height, this.gradientDirection)
    } else {
      c.setFillColor(this.fill)
      c.setFillStyle(this.fillStyle)
    }

    if (this.style != null) {
      if (this.style.linecap != null) {
        c.setLineCap(this.style.linecap)
      }

      if (this.style.linejoin != null) {
        c.setLineJoin(this.style.linejoin)
      }
    }

    c.setStrokeColor(this.stroke)
    this.configurePointerEvents(c)
  }

  /**
   * Function: configurePointerEvents
   *
   * Configures the pointer events for the given canvas.
   */
  mxShape.prototype.configurePointerEvents = function (c) {
    if (this.style != null && (!mxShape.forceFilledPointerEvents ||
        (this.fill == null || this.fill === mxConstants.NONE ||
          this.opacity === 0 || this.fillOpacity === 0)) &&
      mxUtils.getValue(this.style, mxConstants.STYLE_POINTER_EVENTS, '1') === '0') {
      c.pointerEvents = false
    }
  }
  /**
   * Function: apply
   *
   * Applies the style of the given <mxCellState> to the shape. This
   * implementation assigns the following styles to local fields:
   *
   * - <mxConstants.STYLE_FILLCOLOR> => fill
   * - <mxConstants.STYLE_GRADIENTCOLOR> => gradient
   * - <mxConstants.STYLE_GRADIENT_DIRECTION> => gradientDirection
   * - <mxConstants.STYLE_OPACITY> => opacity
   * - <mxConstants.STYLE_FILL_OPACITY> => fillOpacity
   * - <mxConstants.STYLE_STROKE_OPACITY> => strokeOpacity
   * - <mxConstants.STYLE_STROKECOLOR> => stroke
   * - <mxConstants.STYLE_STROKEWIDTH> => strokewidth
   * - <mxConstants.STYLE_SHADOW> => isShadow
   * - <mxConstants.STYLE_DASHED> => isDashed
   * - <mxConstants.STYLE_SPACING> => spacing
   * - <mxConstants.STYLE_STARTSIZE> => startSize
   * - <mxConstants.STYLE_ENDSIZE> => endSize
   * - <mxConstants.STYLE_ROUNDED> => isRounded
   * - <mxConstants.STYLE_STARTARROW> => startArrow
   * - <mxConstants.STYLE_ENDARROW> => endArrow
   * - <mxConstants.STYLE_ROTATION> => rotation
   * - <mxConstants.STYLE_DIRECTION> => direction
   * - <mxConstants.STYLE_GLASS> => glass
   *
   * This keeps a reference to the <style>. If you need to keep a reference to
   * the cell, you can override this method and store a local reference to
   * state.cell or the <mxCellState> itself. If <outline> should be true, make
   * sure to set it before calling this method.
   *
   * Parameters:
   *
   * state - <mxCellState> of the corresponding cell.
   */
  mxShape.prototype.apply = function (state) {
    this.state = state
    this.style = state.style

    if (this.style != null) {
      this.fill = mxUtils.getValue(this.style, mxConstants.STYLE_FILLCOLOR, this.fill)
      this.gradient = mxUtils.getValue(this.style, mxConstants.STYLE_GRADIENTCOLOR, this.gradient)
      this.gradientDirection = mxUtils.getValue(this.style, mxConstants.STYLE_GRADIENT_DIRECTION, this.gradientDirection)
      this.opacity = mxUtils.getValue(this.style, mxConstants.STYLE_OPACITY, this.opacity)
      this.fillOpacity = mxUtils.getValue(this.style, mxConstants.STYLE_FILL_OPACITY, this.fillOpacity)
      this.fillStyle = mxUtils.getValue(this.style, mxConstants.STYLE_FILL_STYLE, this.fillStyle)
      this.strokeOpacity = mxUtils.getValue(this.style, mxConstants.STYLE_STROKE_OPACITY, this.strokeOpacity)
      this.stroke = mxUtils.getValue(this.style, mxConstants.STYLE_STROKECOLOR, this.stroke)
      this.strokewidth = mxUtils.getNumber(this.style, mxConstants.STYLE_STROKEWIDTH, this.strokewidth)
      this.spacing = mxUtils.getValue(this.style, mxConstants.STYLE_SPACING, this.spacing)
      this.startSize = mxUtils.getNumber(this.style, mxConstants.STYLE_STARTSIZE, this.startSize)
      this.endSize = mxUtils.getNumber(this.style, mxConstants.STYLE_ENDSIZE, this.endSize)
      this.startArrow = mxUtils.getValue(this.style, mxConstants.STYLE_STARTARROW, this.startArrow)
      this.endArrow = mxUtils.getValue(this.style, mxConstants.STYLE_ENDARROW, this.endArrow)
      this.rotation = mxUtils.getValue(this.style, mxConstants.STYLE_ROTATION, this.rotation)
      this.direction = mxUtils.getValue(this.style, mxConstants.STYLE_DIRECTION, this.direction)
      this.flipH = mxUtils.getValue(this.style, mxConstants.STYLE_FLIPH, 0) === 1
      this.flipV = mxUtils.getValue(this.style, mxConstants.STYLE_FLIPV, 0) === 1

      // Legacy support for stencilFlipH/V
      if (this.stencil != null) {
        this.flipH = mxUtils.getValue(this.style, 'stencilFlipH', 0) === 1 || this.flipH
        this.flipV = mxUtils.getValue(this.style, 'stencilFlipV', 0) === 1 || this.flipV
      }

      if (this.direction === mxConstants.DIRECTION_NORTH || this.direction === mxConstants.DIRECTION_SOUTH) {
        const tmp = this.flipH
        this.flipH = this.flipV
        this.flipV = tmp
      }

      this.isShadow = mxUtils.getValue(this.style, mxConstants.STYLE_SHADOW, this.isShadow) === 1
      this.isDashed = mxUtils.getValue(this.style, mxConstants.STYLE_DASHED, this.isDashed) === 1
      this.isRounded = mxUtils.getValue(this.style, mxConstants.STYLE_ROUNDED, this.isRounded) === 1
      this.glass = mxUtils.getValue(this.style, mxConstants.STYLE_GLASS, this.glass) === 1

      if (this.fill === mxConstants.NONE) {
        this.fill = null
      }

      if (this.gradient === mxConstants.NONE) {
        this.gradient = null
      }

      if (this.stroke === mxConstants.NONE) {
        this.stroke = null
      }
    }
  }
  /**
   * Function: getSvgBoundingBox
   *
   * Returns the SVG bounding box.
   */
  mxShape.prototype.getSvgBoundingBox = function () {
    let result = null

    if (this.node != null && this.node.ownerSVGElement != null) {
      try {
        const b = this.node.getBBox()

        if (b.width > 0 && b.height > 0) {
          result = new mxRectangle(b.x, b.y, b.width, b.height)

          // Adds stroke width
          if (this.stroke != null) {
            result.grow(this.strokewidth * this.scale / 2)
          }
        }
      } catch (e) {
        // fallback to shape bbox
      }
    }

    return result
  }

  /**
   * Function: getShapeBoundingBox
   *
   * Returns the shape bounding box.
   */
  mxShape.prototype.getShapeBoundingBox = function () {
    let bbox = null

    if (this.bounds != null) {
      bbox = this.createBoundingBox()

      if (bbox != null) {
        this.augmentBoundingBox(bbox)
        const rot = this.getShapeRotation()

        if (rot !== 0) {
          bbox = mxUtils.getBoundingBox(bbox, rot)
        }
      }
    }

    return bbox
  }

  /**
   * Function: augmentBoundingBox
   *
   * Augments the bounding box with the strokewidth and shadow offsets.
   */
  mxShape.prototype.augmentBoundingBox = function (bbox) {
    if (this.isShadow) {
      const ss = this.getShadowStyle()

      if (ss.dx < 0) {
        bbox.x += ss.dx
        bbox.width -= ss.dx
      }

      if (ss.dy < 0) {
        bbox.y += ss.dy
        bbox.height -= ss.dy
      }

      bbox.grow(Math.max(ss.blur, 0) * this.scale * 2)
      bbox.width += Math.ceil(Math.max(ss.dx, 0) * this.scale)
      bbox.height += Math.ceil(Math.max(ss.dy, 0) * this.scale)
    }

    // Adds stroke width
    if (this.stroke != null) {
      bbox.grow(this.strokewidth * this.scale / 2)
    }
  }

  /**
   * Function: updateBoundingBox
   *
   * Updates the <boundingBox> for this shape using <createBoundingBox> and
   * <augmentBoundingBox> and stores the result in <boundingBox>.
   */
  mxShape.prototype.updateBoundingBox = function () {
    let bbox = (this.useSvgBoundingBox) ? this.getSvgBoundingBox() : null

    if (bbox == null) {
      bbox = this.getShapeBoundingBox()
    }

    this.boundingBox = bbox
  }
  /**
   * Function: intersectsRectangle
   *
   * Returns true if the shape intersects the given rectangle.
   */
  mxShape.prototype.intersectsRectangle = function (rect, ignoreNode) {
    return rect != null && (ignoreNode || (this.node != null && this.node.style.display !== 'none' &&
      this.node.style.visibility !== 'hidden')) && mxUtils.intersects(this.bounds, rect, true)
  }

  /**
   * Function: releaseSvgFillPatterns
   *
   * Release not needed Svg Patterns.
   */
  mxShape.prototype.releaseSvgFillPatterns = function (patterns) {
    if (patterns != null) {
      for (const key in patterns) {
        const pattern = patterns[key]

        if (pattern != null) {
          pattern.mxRefCount = (pattern.mxRefCount || 0) - 1

          if (pattern.mxRefCount === 0 && pattern.parentNode != null) {
            pattern.parentNode.removeChild(pattern)
          }
        }
      }
    }
  }

  /**
   * Function: destroy
   *
   * Destroys the shape by removing it from the DOM and releasing the DOM
   * node associated with the shape using <mxEvent.release>.
   */
  mxShape.prototype.destroy = function () {
    if (this.node != null) {
      mxEvent.release(this.node)

      if (this.node.parentNode != null) {
        this.node.parentNode.removeChild(this.node)
      }

      this.node = null
    }

    // Decrements refCount and removes unused
    this.releaseSvgGradients(this.oldGradients)
    this.releaseSvgFillPatterns(this.oldFillPatterns)
    this.oldGradients = null
    this.oldFillPatterns = null
  }

  if (mxShape.prototype.hasOwnProperty('vmlScale')) {
    delete mxShape.prototype.vmlScale
  }
  if (mxShape.prototype.hasOwnProperty('isParseVml')) {
    delete mxShape.prototype.isParseVml
  }
  if (mxShape.prototype.hasOwnProperty('createVml')) {
    delete mxShape.prototype.createVml
  }
  if (mxShape.prototype.hasOwnProperty('createVmlGroup')) {
    delete mxShape.prototype.createVmlGroup
  }
  if (mxShape.prototype.hasOwnProperty('createVmlCanvas')) {
    delete mxShape.prototype.createVmlCanvas
  }
  if (mxShape.prototype.hasOwnProperty('updateVmlContainer')) {
    delete mxShape.prototype.updateVmlContainer
  }

  mxOutput.mxShape = mxShape
}
