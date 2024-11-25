export function overrideMxCellRenderer (mxOutput) {
  const {
    mxCellRenderer,
    mxClient,
    mxConstants,
    mxEvent,
    mxMouseEvent,
    mxPoint,
    mxRectangle,
    mxShape,
    mxStencilRegistry,
    mxUtils
  } = mxOutput
  // mxCellRenderer start

  /**
   * Function: createShape
   *
   * Creates and returns the shape for the given cell state.
   *
   * Parameters:
   *
   * state - <mxCellState> for which the shape should be created.
   */
  mxCellRenderer.prototype.createShape = function (state) {
    let shape = null

    if (state.style != null) {
      // Checks if there is a stencil for the name and creates
      // a shape instance for the stencil if one exists
      const name = state.style[mxConstants.STYLE_SHAPE]
      const stencil = (mxCellRenderer.defaultShapes[name] == null) ? mxStencilRegistry.getStencil(name) : null

      if (stencil != null) {
        shape = new mxShape(stencil)
      } else {
        const ctor = this.getShapeConstructor(state)
        shape = new ctor()
      }
    }

    return shape
  }

  /**
   * Function: createTextShape
   *
   * Creates the the text shape for the given state and dialect.
   *
   * Parameters:
   *
   * state - <mxCellState> for which the label should be created.
   */
  mxCellRenderer.prototype.createTextShape = function (state, value, dialect) {
    const graph = state.view.graph

    const text = new this.defaultTextShape(value, new mxRectangle(), (state.style[mxConstants.STYLE_ALIGN] || mxConstants.ALIGN_CENTER), graph.getVerticalAlign(state), state.style[mxConstants.STYLE_FONTCOLOR], state.style[mxConstants.STYLE_FONTFAMILY], state.style[mxConstants.STYLE_FONTSIZE], state.style[mxConstants.STYLE_FONTSTYLE], state.style[mxConstants.STYLE_SPACING], state.style[mxConstants.STYLE_SPACING_TOP], state.style[mxConstants.STYLE_SPACING_RIGHT], state.style[mxConstants.STYLE_SPACING_BOTTOM], state.style[mxConstants.STYLE_SPACING_LEFT], state.style[mxConstants.STYLE_HORIZONTAL], state.style[mxConstants.STYLE_LABEL_BACKGROUNDCOLOR], state.style[mxConstants.STYLE_LABEL_BORDERCOLOR], graph.isWrapping(state.cell) && graph.isHtmlLabel(state.cell), graph.isLabelClipped(state.cell), state.style[mxConstants.STYLE_OVERFLOW], state.style[mxConstants.STYLE_LABEL_PADDING], mxUtils.getValue(state.style, mxConstants.STYLE_TEXT_DIRECTION, mxConstants.DEFAULT_TEXT_DIRECTION))
    text.opacity = mxUtils.getValue(state.style, mxConstants.STYLE_TEXT_OPACITY, 100)
    text.dialect = dialect
    text.style = state.style
    text.state = state

    return text
  }

  /**
   * Function: createLabel
   *
   * Creates the label for the given cell state.
   *
   * Parameters:
   *
   * state - <mxCellState> for which the label should be created.
   */
  mxCellRenderer.prototype.createLabel = function (state, value) {
    const graph = state.view.graph

    if (state.style[mxConstants.STYLE_FONTSIZE] > 0 || state.style[mxConstants.STYLE_FONTSIZE] == null) {
      // Avoids using DOM node for empty labels
      const isForceHtml = (graph.isHtmlLabel(state.cell) || (value != null && mxUtils.isNode(value)))
      state.text = this.createTextShape(state, value, (isForceHtml) ? mxConstants.DIALECT_STRICTHTML : state.view.graph.dialect)
      this.initializeLabel(state, state.text)
      this.configureShape(state)

      // Workaround for touch devices routing all events for a mouse gesture
      // (down, move, up) via the initial DOM node. IE additionally redirects
      // the event via the initial DOM node but the event source is the node
      // under the mouse, so we need to check if this is the case and force
      // getCellAt for the subsequent mouseMoves and the final mouseUp.
      let forceGetCell = false

      const getState = function (evt) {
        let result = state

        if (mxClient.IS_TOUCH || forceGetCell) {
          const x = mxEvent.getClientX(evt)
          const y = mxEvent.getClientY(evt)

          // Dispatches the drop event to the graph which
          // consumes and executes the source function
          const pt = mxUtils.convertPoint(graph.container, x, y)
          result = graph.view.getState(graph.getCellAt(pt.x, pt.y))
        }

        return result
      }

      // TODO: Add handling for special touch device gestures
      mxEvent.addGestureListeners(state.text.node, mxUtils.bind(this, function (evt) {
        if (this.isLabelEvent(state, evt)) {
          graph.fireMouseEvent(mxEvent.MOUSE_DOWN, new mxMouseEvent(evt, state))
          forceGetCell = graph.dialect !== mxConstants.DIALECT_SVG && mxEvent.getSource(evt).nodeName === 'IMG'
        }
      }), mxUtils.bind(this, function (evt) {
        if (this.isLabelEvent(state, evt)) {
          graph.fireMouseEvent(mxEvent.MOUSE_MOVE, new mxMouseEvent(evt, getState(evt)))
        }
      }), mxUtils.bind(this, function (evt) {
        if (this.isLabelEvent(state, evt)) {
          graph.fireMouseEvent(mxEvent.MOUSE_UP, new mxMouseEvent(evt, getState(evt)))
          forceGetCell = false
        }
      }))

      if (graph.nativeDblClickEnabled) {
        mxEvent.addListener(state.text.node, 'dblclick', mxUtils.bind(this, function (evt) {
          if (this.isLabelEvent(state, evt)) {
            graph.dblClick(evt, state.cell)
            mxEvent.consume(evt)
          }
        }))
      }
    }
  }

  /**
   * Function: redrawLabel
   *
   * Redraws the label for the given cell state.
   *
   * Parameters:
   *
   * state - <mxCellState> whose label should be redrawn.
   */
  mxCellRenderer.prototype.redrawLabel = function (state, forced) {
    const graph = state.view.graph
    const value = this.getLabelValue(state)
    const wrapping = graph.isWrapping(state.cell)
    const clipping = graph.isLabelClipped(state.cell)
    const isForceHtml = (state.view.graph.isHtmlLabel(state.cell) || (value != null && mxUtils.isNode(value)))
    const dialect = (isForceHtml) ? mxConstants.DIALECT_STRICTHTML : state.view.graph.dialect
    const overflow = state.style[mxConstants.STYLE_OVERFLOW] || 'visible'

    if (state.text != null && (state.text.wrap !== wrapping || state.text.clipped !== clipping || state.text.overflow !== overflow || state.text.dialect !== dialect)) {
      state.text.destroy()
      state.text = null
    }

    if (state.text == null && value != null && (mxUtils.isNode(value) || value.length > 0)) {
      this.createLabel(state, value)
    } else if (state.text != null && (value == null || value.length === 0)) {
      state.text.destroy()
      state.text = null
    }

    if (state.text != null) {
      // Forced is true if the style has changed, so to get the updated
      // result in getLabelBounds we apply the new style to the shape
      if (forced) {
        // Checks if a full repaint is needed
        if (state.text.lastValue != null && this.isTextShapeInvalid(state, state.text)) {
          // Forces a full repaint
          state.text.lastValue = null
        }

        state.text.resetStyles()
        state.text.apply(state)
        this.configureShape(state)

        // Special case where value is obtained via hook in graph
        state.text.valign = graph.getVerticalAlign(state)
      }

      const bounds = this.getLabelBounds(state)
      const nextScale = this.getTextScale(state)
      this.resolveColor(state, 'color', mxConstants.STYLE_FONTCOLOR)

      if (forced ||
        state.text.value !== value ||
        state.text.isWrapping !== wrapping ||
        state.text.overflow !== overflow ||
        state.text.isClipping !== clipping ||
        state.text.scale !== nextScale ||
        state.text.dialect !== dialect ||
        state.text.bounds == null ||
        !state.text.bounds.equals(bounds)) {
        state.text.dialect = dialect
        state.text.value = value
        state.text.bounds = bounds
        state.text.scale = nextScale
        state.text.wrap = wrapping
        state.text.clipped = clipping
        state.text.overflow = overflow

        // Preserves visible state
        const vis = state.text.node.style.visibility
        this.redrawLabelShape(state.text)
        state.text.node.style.visibility = vis
      }
    }
  }

  /**
   * Function: isTextShapeInvalid
   *
   * Returns true if the style for the text shape has changed.
   *
   * Parameters:
   *
   * state - <mxCellState> whose label should be checked.
   * shape - <mxText> shape to be checked.
   */
  mxCellRenderer.prototype.isTextShapeInvalid = function (state, shape) {
    function check (property, stylename, defaultValue) {
      let result

      // Workaround for spacing added to directional spacing
      if (stylename === 'spacingTop' || stylename === 'spacingRight' || stylename === 'spacingBottom' || stylename === 'spacingLeft') {
        result = parseFloat(shape[property]) - parseFloat(shape.spacing) !== (state.style[stylename] || defaultValue)
      } else {
        result = shape[property] !== ((state.style[stylename] != null) ? state.style[stylename] : defaultValue)
      }

      return result
    }

    return check('fontStyle', mxConstants.STYLE_FONTSTYLE, mxConstants.DEFAULT_FONTSTYLE) || check('family', mxConstants.STYLE_FONTFAMILY, mxConstants.DEFAULT_FONTFAMILY) || check('size', mxConstants.STYLE_FONTSIZE, mxConstants.DEFAULT_FONTSIZE) || check('color', mxConstants.STYLE_FONTCOLOR, 'black') || check('align', mxConstants.STYLE_ALIGN, '') || check('valign', mxConstants.STYLE_VERTICAL_ALIGN, '') || check('spacing', mxConstants.STYLE_SPACING, 2) || check('spacingTop', mxConstants.STYLE_SPACING_TOP, 0) || check('spacingRight', mxConstants.STYLE_SPACING_RIGHT, 0) || check('spacingBottom', mxConstants.STYLE_SPACING_BOTTOM, 0) || check('spacingLeft', mxConstants.STYLE_SPACING_LEFT, 0) || check('horizontal', mxConstants.STYLE_HORIZONTAL, true) || check('background', mxConstants.STYLE_LABEL_BACKGROUNDCOLOR) || check('border', mxConstants.STYLE_LABEL_BORDERCOLOR) || check('opacity', mxConstants.STYLE_TEXT_OPACITY, 100) || check('textDirection', mxConstants.STYLE_TEXT_DIRECTION, mxConstants.DEFAULT_TEXT_DIRECTION)
  }

  /**
   * Function: getLabelBounds
   *
   * Returns the bounds to be used to draw the label of the given state.
   *
   * Parameters:
   *
   * state - <mxCellState> whose label bounds should be returned.
   */
  mxCellRenderer.prototype.getLabelBounds = function (state, text, margin, disableRotation) {
    text = (text != null) ? text : state.text
    let bounds = new mxRectangle(state.absoluteOffset.x, state.absoluteOffset.y)
    const isEdge = state.view.graph.getModel().isEdge(state.cell)
    const scale = state.view.scale

    if (isEdge) {
      const spacing = text.getSpacing(null, margin)
      bounds.x += spacing.x * scale
      bounds.y += spacing.y * scale

      const geo = state.view.graph.getCellGeometry(state.cell)

      if (geo != null) {
        bounds.width = Math.max(0, geo.width * scale)
        bounds.height = Math.max(0, geo.height * scale)
      }
    } else {
      // Inverts label position
      if (text.isPaintBoundsInverted() && !disableRotation) {
        [bounds.x, bounds.y] = [bounds.y, bounds.x]
      }

      bounds.x += state.x
      bounds.y += state.y

      // Minimum of 1 fixes alignment bug in HTML labels
      bounds.width = Math.max(1, state.width)
      bounds.height = Math.max(1, state.height)
    }

    if (text.isPaintBoundsInverted() && !disableRotation) {
      // Rotates around center of state
      const t = (state.width - state.height) / 2
      bounds.x += t
      bounds.y -= t;

      [bounds.width, bounds.height] = [bounds.height, bounds.width]
    }

    // Shape can modify its label bounds
    if (state.shape != null) {
      const hpos = mxUtils.getValue(state.style, mxConstants.STYLE_LABEL_POSITION, mxConstants.ALIGN_CENTER)
      const vpos = mxUtils.getValue(state.style, mxConstants.STYLE_VERTICAL_LABEL_POSITION, mxConstants.ALIGN_MIDDLE)

      if (hpos === mxConstants.ALIGN_CENTER && vpos === mxConstants.ALIGN_MIDDLE) {
        bounds = state.shape.getLabelBounds(bounds)
      }
    }

    // Label width style overrides actual label width
    const lw = mxUtils.getValue(state.style, mxConstants.STYLE_LABEL_WIDTH, null)

    if (lw != null) {
      bounds.width = parseFloat(lw) * scale
    }

    if (!isEdge) {
      this.rotateLabelBounds(state, bounds, text, margin, disableRotation)
    }

    return bounds
  }

  /**
   * Function: rotateLabelBounds
   *
   * Adds the shape rotation to the given label bounds and
   * applies the alignment and offsets.
   *
   * Parameters:
   *
   * state - <mxCellState> whose label bounds should be rotated.
   * bounds - <mxRectangle> the rectangle to be rotated.
   */
  mxCellRenderer.prototype.rotateLabelBounds = function (state, bounds, text, margin, disableRotation) {
    const m = (margin != null) ? margin : text.margin
    bounds.y -= m.y * bounds.height
    bounds.x -= m.x * bounds.width

    if (!this.legacySpacing || (state.style[mxConstants.STYLE_OVERFLOW] !== 'fill' && state.style[mxConstants.STYLE_OVERFLOW] !== 'width' && (state.style[mxConstants.STYLE_OVERFLOW] !== 'block' || state.style[mxConstants.STYLE_BLOCK_SPACING] === '1'))) {
      const s = state.view.scale
      const spacing = text.getSpacing(state.style[mxConstants.STYLE_BLOCK_SPACING] === '1', m)
      bounds.x += spacing.x * s
      bounds.y += spacing.y * s

      const hpos = mxUtils.getValue(state.style, mxConstants.STYLE_LABEL_POSITION, mxConstants.ALIGN_CENTER)
      const vpos = mxUtils.getValue(state.style, mxConstants.STYLE_VERTICAL_LABEL_POSITION, mxConstants.ALIGN_MIDDLE)
      const lw = mxUtils.getValue(state.style, mxConstants.STYLE_LABEL_WIDTH, null)

      bounds.width = Math.max(0, bounds.width - ((hpos === mxConstants.ALIGN_CENTER && lw == null) ? (text.spacingLeft * s + text.spacingRight * s) : 0))
      bounds.height = Math.max(0, bounds.height - ((vpos === mxConstants.ALIGN_MIDDLE) ? (text.spacingTop * s + text.spacingBottom * s) : 0))
    }

    const theta = (!disableRotation) ? text.getTextRotation() : 0

    // Only needed if rotated around another center
    if (theta !== 0 && state.view.graph.model.isVertex(state.cell)) {
      const cx = state.getCenterX()
      const cy = state.getCenterY()

      if (bounds.x !== cx || bounds.y !== cy) {
        const rad = theta * (Math.PI / 180)
        const pt = mxUtils.getRotatedPoint(new mxPoint(bounds.x, bounds.y), Math.cos(rad), Math.sin(rad), new mxPoint(cx, cy))

        bounds.x = pt.x
        bounds.y = pt.y
      }
    }
  }

  /**
   * Function: redrawShape
   *
   * Redraws the shape for the given cell state.
   *
   * Parameters:
   *
   * state - <mxCellState> whose label should be redrawn.
   */
  mxCellRenderer.prototype.redrawShape = function (state, force, rendering) {
    const model = state.view.graph.model
    let shapeChanged = false

    // Forces creation of new shape if shape style has changed
    if (state.shape != null && state.shape.style != null && state.style != null && state.shape.style[mxConstants.STYLE_SHAPE] !== state.style[mxConstants.STYLE_SHAPE]) {
      state.shape.destroy()
      state.shape = null
    }

    if (state.shape == null && state.view.graph.container != null && state.cell !== state.view.currentRoot && (model.isVertex(state.cell) || model.isEdge(state.cell))) {
      state.shape = this.createShape(state)

      if (state.shape != null) {
        state.shape.minSvgStrokeWidth = this.minSvgStrokeWidth
        state.shape.antiAlias = this.antiAlias

        this.createIndicatorShape(state)
        this.initializeShape(state)
        this.createCellOverlays(state)
        this.installListeners(state)

        // Forces a refresh of the handler if one exists
        state.view.graph.selectionCellsHandler.updateHandler(state)
      }
    } else if (!force && state.shape != null && (!mxUtils.equalEntries(state.shape.style, state.style) || this.checkPlaceholderStyles(state))) {
      state.shape.resetStyles()
      this.configureShape(state)
      // LATER: Ignore update for realtime to fix reset of current gesture
      state.view.graph.selectionCellsHandler.updateHandler(state)
      force = true
    }

    // Updates indicator shape
    if (state.shape != null && state.shape.indicatorShape !== this.getShape(state.view.graph.getIndicatorShape(state))) {
      if (state.shape.indicator != null) {
        state.shape.indicator.destroy()
        state.shape.indicator = null
      }

      this.createIndicatorShape(state)

      if (state.shape.indicatorShape != null) {
        state.shape.indicator = new state.shape.indicatorShape()
        state.shape.indicator.dialect = state.shape.dialect
        state.shape.indicator.init(state.node)
        force = true
      }
    }

    if (state.shape != null) {
      // Handles changes of the collapse icon
      this.createControl(state)

      // Redraws the cell if required, ignores changes to bounds if points are
      // defined as the bounds are updated for the given points inside the shape
      if (force || this.isShapeInvalid(state, state.shape)) {
        if (state.absolutePoints != null) {
          state.shape.points = state.absolutePoints.slice()
          state.shape.bounds = null
        } else {
          state.shape.points = null
          state.shape.bounds = new mxRectangle(state.x, state.y, state.width, state.height)
        }

        state.shape.scale = state.view.scale

        if (rendering == null || rendering) {
          this.doRedrawShape(state)
        }

        shapeChanged = true
      }
    }

    return shapeChanged
  }
  // mxCellRenderer end
  mxOutput.mxCellRenderer = mxCellRenderer
}
