export function overrideMxVertexHandler (mxOutput) {
  const {
    mxVertexHandler,
    mxRectangle,
    mxConstants,
    mxEvent,
    mxGraphHandler,
    mxImageShape,
    mxEllipse,
    mxRectangleShape,
    mxUtils,
    mxClient,
    mxPoint
  } = mxOutput
  /**
   * Function: init
   *
   * Initializes the shapes required for this vertex handler.
   */
  mxVertexHandler.prototype.init = function () {
    this.graph = this.state.view.graph
    this.selectionBounds = this.getSelectionBounds(this.state)
    this.bounds = new mxRectangle(this.selectionBounds.x, this.selectionBounds.y, this.selectionBounds.width, this.selectionBounds.height)
    this.selectionBorder = this.createSelectionShape(this.bounds)
    this.selectionBorder.dialect = mxConstants.DIALECT_SVG
    this.selectionBorder.svgStrokeTolerance = 0
    this.selectionBorder.pointerEvents = false
    this.selectionBorder.rotation = Number(this.state.style[mxConstants.STYLE_ROTATION] || '0')
    this.selectionBorder.init(this.graph.getView().getOverlayPane())
    mxEvent.redirectMouseEvents(this.selectionBorder.node, this.graph, this.state)

    if (this.graph.isCellMovable(this.state.cell) && !this.graph.isCellLocked(this.state.cell)) {
      this.selectionBorder.setCursor(mxConstants.CURSOR_MOVABLE_VERTEX)
    }

    this.refresh()
    this.redraw()

    if (this.constrainGroupByChildren) {
      this.updateMinBounds()
    }
  }

  /**
   * Function: isHandlesVisible
   *
   * Returns true if all handles should be visible.
   */
  mxVertexHandler.prototype.isHandlesVisible = function () {
    return !this.graph.isCellLocked(this.state.cell) &&
      (mxGraphHandler.prototype.maxCells <= 0 ||
        this.graph.getSelectionCount() <= mxGraphHandler.prototype.maxCells)
  }

  /**
   * Function: refresh
   *
   * Initializes the shapes required for this vertex handler.
   */
  mxVertexHandler.prototype.refresh = function () {
    if (this.selectionBorder != null) {
      this.selectionBorder.strokewidth = this.getSelectionStrokeWidth()
      this.selectionBorder.isDashed = this.isSelectionDashed()
      this.selectionBorder.stroke = this.getSelectionColor()
      this.selectionBorder.redraw()
    }

    if (this.sizers != null) {
      this.destroySizers()
    }

    if (this.isHandlesVisible()) {
      this.sizers = this.createSizers()
    }

    if (this.customHandles != null) {
      this.destroyCustomHandles()
    }

    if (this.isHandlesVisible()) {
      this.customHandles = this.createCustomHandles()
    }
  }

  /**
   * Function: isRotationHandleVisible
   *
   * Returns true if the rotation handle should be showing.
   */
  mxVertexHandler.prototype.isRotationHandleVisible = function () {
    return this.graph.isEnabled() && this.rotationEnabled &&
      this.graph.isCellRotatable(this.state.cell)
  }

  /**
   * Function: getSelectionColor
   *
   * Returns <mxConstants.VERTEX_SELECTION_COLOR>.
   */
  mxVertexHandler.prototype.getSelectionColor = function () {
    return (this.graph.isCellEditable(this.state.cell))
      ? mxConstants.VERTEX_SELECTION_COLOR
      : mxConstants.LOCKED_HANDLE_FILLCOLOR
  }
  /**
   * Function: createSizer
   *
   * Creates a sizer handle for the specified cursor and index and returns
   * the new <mxRectangleShape> that represents the handle.
   */
  mxVertexHandler.prototype.createSizer = function (cursor, index, size, fillColor) {
    size = size || mxConstants.HANDLE_SIZE

    const bounds = new mxRectangle(0, 0, size, size)
    const sizer = this.createSizerShape(bounds, index, fillColor, this.handleImage)

    if (sizer.isHtmlAllowed() && this.state.text != null && this.state.text.node.parentNode === this.graph.container) {
      sizer.bounds.height -= 1
      sizer.bounds.width -= 1
      sizer.dialect = mxConstants.DIALECT_STRICTHTML
      sizer.init(this.graph.container)
    } else {
      sizer.dialect = (this.graph.dialect !== mxConstants.DIALECT_SVG)
        ? mxConstants.DIALECT_MIXEDHTML
        : mxConstants.DIALECT_SVG
      sizer.init(this.graph.getView().getOverlayPane())
    }

    mxEvent.redirectMouseEvents(sizer.node, this.graph, this.state)

    if (this.graph.isEnabled()) {
      sizer.setCursor(cursor)
    }

    if (!this.isSizerVisible(index)) {
      sizer.visible = false
    }

    return sizer
  }

  /**
   * Function: createSizerShape
   *
   * Creates the shape used for the sizer handle for the specified bounds an
   * index. Only images and rectangles should be returned if support for HTML
   * labels with not foreign objects is required.
   */
  mxVertexHandler.prototype.createSizerShape = function (bounds, index, fillColor, image) {
    if (image != null) {
      bounds = new mxRectangle(bounds.x, bounds.y, image.width, image.height)
      const shape = new mxImageShape(bounds, image.src)

      // Allows HTML rendering of the images
      shape.preserveImageAspect = false

      return shape
    } else if (index === mxEvent.ROTATION_HANDLE) {
      return new mxEllipse(bounds, fillColor || mxConstants.HANDLE_FILLCOLOR, mxConstants.HANDLE_STROKECOLOR)
    } else {
      return new mxRectangleShape(bounds, fillColor || mxConstants.HANDLE_FILLCOLOR, mxConstants.HANDLE_STROKECOLOR)
    }
  }

  /**
   * Function: createBounds
   *
   * Helper method to create an <mxRectangle> around the given centerpoint
   * with a width and height of 2*s or 6, if no s is given.
   */
  mxVertexHandler.prototype.moveSizerTo = function (shape, x, y) {
    if (shape != null) {
      shape.bounds.x = Math.floor(x - shape.bounds.width / 2)
      shape.bounds.y = Math.floor(y - shape.bounds.height / 2)

      // Fixes visible inactive handles in . TODO, remove?
      if (shape.node != null && shape.node.style.display !== 'none') {
        shape.redraw()
      }
    }
  }

  /**
   * Function: getHandleForEvent
   *
   * Returns the index of the handle for the given event. This returns the index
   * of the sizer from where the event originated or <mxEvent.LABEL_INDEX>.
   */
  mxVertexHandler.prototype.getHandleForEvent = function (me) {
    // Connection highlight may consume events before they reach sizer handle
    const tol = (!mxEvent.isMouseEvent(me.getEvent())) ? this.tolerance : 1
    const hit = (this.allowHandleBoundsCheck && (mxClient.IS_IE || tol > 0))
      ? new mxRectangle(me.getGraphX() - tol, me.getGraphY() - tol, 2 * tol, 2 * tol)
      : null

    const checkShape = mxUtils.bind(this, function (shape) {
      const st = (shape != null && shape.constructor !== mxImageShape &&
        this.allowHandleBoundsCheck)
        ? shape.strokewidth + shape.svgStrokeTolerance
        : null
      const real = (st != null)
        ? new mxRectangle(me.getGraphX() - Math.floor(st / 2),
          me.getGraphY() - Math.floor(st / 2), st, st)
        : hit

      return shape != null && (me.isSource(shape) || shape.intersectsRectangle(real))
    })

    if (checkShape(this.rotationShape)) {
      return mxEvent.ROTATION_HANDLE
    } else if (checkShape(this.labelShape)) {
      return mxEvent.LABEL_HANDLE
    }

    if (this.sizers != null) {
      for (let i = 0; i < this.sizers.length; i++) {
        if (checkShape(this.sizers[i])) {
          return i
        }
      }
    }

    if (this.customHandles != null && this.isCustomHandleEvent(me)) {
      // Inverse loop order to match display order
      for (let i = this.customHandles.length - 1; i >= 0; i--) {
        if (this.customHandles[i] != null &&
          checkShape(this.customHandles[i].shape)) {
          // LATER: Return reference to active shape
          return mxEvent.CUSTOM_HANDLE - i
        }
      }
    }

    return null
  }
  /**
   * Function: mouseDown
   *
   * Handles the event if a handle has been clicked. By consuming the
   * event all subsequent events of the gesture are redirected to this
   * handler.
   */
  mxVertexHandler.prototype.mouseDown = function (sender, me) {
    if (!me.isConsumed() && this.graph.isEnabled() &&
      (!mxEvent.isAltDown(me.getEvent()) ||
        !mxEvent.isShiftDown(me.getEvent()))) {
      const handle = this.getHandleForEvent(me)

      if (handle != null) {
        this.start(me.getGraphX(), me.getGraphY(), handle)
        me.consume()
      }
    }
  }

  /**
   * Function: start
   *
   * Starts the handling of the mouse gesture.
   */
  mxVertexHandler.prototype.start = function (x, y, index) {
    if (this.selectionBorder != null) {
      this.livePreviewActive = this.livePreview && this.graph.model.getChildCount(this.state.cell) === 0
      this.inTolerance = true
      this.childOffsetX = 0
      this.childOffsetY = 0
      this.index = index
      this.startX = x
      this.startY = y

      if (this.index <= mxEvent.CUSTOM_HANDLE && this.isGhostPreview()) {
        this.ghostPreview = this.createGhostPreview()
      } else {
        // Saves reference to parent state
        const model = this.state.view.graph.model
        const parent = model.getParent(this.state.cell)

        if (this.state.view.currentRoot !== parent && (model.isVertex(parent) || model.isEdge(parent))) {
          this.parentState = this.state.view.graph.view.getState(parent)
        }

        // Creates a preview that can be on top of any HTML label
        this.selectionBorder.node.style.display = (index === mxEvent.ROTATION_HANDLE) ? 'inline' : 'none'

        // Creates the border that represents the new bounds
        if (!this.livePreviewActive || this.isLivePreviewBorder()) {
          this.preview = this.createSelectionShape(this.bounds)

          if (!(mxClient.IS_SVG && Number(this.state.style[mxConstants.STYLE_ROTATION] || '0') !== 0) &&
            this.state.text != null && this.state.text.node.parentNode === this.graph.container) {
            this.preview.dialect = mxConstants.DIALECT_STRICTHTML
            this.preview.init(this.graph.container)
          } else {
            this.preview.dialect = mxConstants.DIALECT_SVG
            this.preview.init(this.graph.view.getOverlayPane())
          }
        }

        if (index === mxEvent.ROTATION_HANDLE) {
          // With the rotation handle in a corner, need the angle and distance
          const pos = this.getRotationHandlePosition()

          const dx = pos.x - this.state.getCenterX()
          const dy = pos.y - this.state.getCenterY()

          this.startAngle = (dx !== 0) ? Math.atan(dy / dx) * 180 / Math.PI + 90 : 0
          this.startDist = Math.sqrt(dx * dx + dy * dy)
        }

        // Prepares the handles for live preview
        if (this.livePreviewActive) {
          this.hideSizers()

          if (index === mxEvent.ROTATION_HANDLE) {
            this.rotationShape.node.style.display = ''
          } else if (index === mxEvent.LABEL_HANDLE) {
            this.labelShape.node.style.display = ''
          } else if (this.sizers != null && this.sizers[index] != null) {
            this.sizers[index].node.style.display = ''
          } else if (index <= mxEvent.CUSTOM_HANDLE && this.customHandles != null &&
            this.customHandles[mxEvent.CUSTOM_HANDLE - index] != null) {
            this.customHandles[mxEvent.CUSTOM_HANDLE - index].setVisible(true)
          }

          // Gets the array of connected edge handlers for redrawing
          const edges = this.graph.getEdges(this.state.cell)
          this.edgeHandlers = []

          for (let i = 0; i < edges.length; i++) {
            const handler = this.graph.selectionCellsHandler.getHandler(edges[i])

            if (handler != null) {
              this.edgeHandlers.push(handler)
            }
          }
        }
      }
    }
  }

  /**
   * Function: hideHandles
   *
   * Shortcut to <hideSizers>.
   */
  mxVertexHandler.prototype.setHandlesVisible = function (visible) {
    this.handlesVisible = visible

    if (this.sizers != null) {
      for (let i = 0; i < this.sizers.length; i++) {
        this.sizers[i].node.style.display = (visible) ? '' : 'none'
      }
    }

    if (this.customHandles != null) {
      for (let i = 0; i < this.customHandles.length; i++) {
        if (this.customHandles[i] != null) {
          this.customHandles[i].setVisible(visible)
        }
      }
    }
  }

  /**
   * Function: mouseMove
   *
   * Handles the event by updating the preview.
   */
  mxVertexHandler.prototype.mouseMove = function (sender, me) {
    if (!me.isConsumed() && this.index != null) {
      // Checks tolerance for ignoring single clicks
      this.checkTolerance(me)

      if (!this.inTolerance) {
        if (this.index <= mxEvent.CUSTOM_HANDLE) {
          if (this.customHandles != null && this.customHandles[mxEvent.CUSTOM_HANDLE - this.index] != null) {
            this.customHandles[mxEvent.CUSTOM_HANDLE - this.index].processEvent(me)
            this.customHandles[mxEvent.CUSTOM_HANDLE - this.index].active = true

            if (this.ghostPreview != null) {
              this.ghostPreview.apply(this.state)
              this.ghostPreview.strokewidth = this.getSelectionStrokeWidth() /
                this.ghostPreview.scale / this.ghostPreview.scale
              this.ghostPreview.isDashed = this.isSelectionDashed()
              this.ghostPreview.stroke = this.getSelectionColor()
              this.ghostPreview.redraw()

              if (this.selectionBounds != null) {
                this.selectionBorder.node.style.display = 'none'
              }
            } else {
              if (this.movePreviewToFront) {
                this.moveToFront()
              }

              this.customHandles[mxEvent.CUSTOM_HANDLE - this.index].positionChanged()
            }
          }
        } else if (this.index === mxEvent.LABEL_HANDLE) {
          this.moveLabel(me)
        } else {
          if (this.index === mxEvent.ROTATION_HANDLE) {
            this.rotateVertex(me)
          } else {
            this.resizeVertex(me)
          }

          this.updateHint(me)
        }
      }

      me.consume()
    } else if (!this.graph.isMouseDown && this.getHandleForEvent(me) != null) {
      // Workaround for disabling the connect highlight when over handle
      me.consume(false)
    }
  }

  /**
   * Function: mouseUp
   *
   * Handles the event by applying the changes to the geometry.
   */
  mxVertexHandler.prototype.mouseUp = function (sender, me) {
    if (this.index != null && this.state != null) {
      const point = new mxPoint(me.getGraphX(), me.getGraphY())
      const index = this.index
      this.index = null

      if (this.ghostPreview == null) {
        // Marks as invalid to ensure reset of order
        this.state.view.invalidate(this.state.cell, false, false)
      }

      this.graph.getModel().beginUpdate()
      try {
        if (index <= mxEvent.CUSTOM_HANDLE) {
          if (this.customHandles != null && this.customHandles[mxEvent.CUSTOM_HANDLE - index] != null) {
            // Creates style before changing cell state
            const style = this.state.view.graph.getCellStyle(this.state.cell)

            this.customHandles[mxEvent.CUSTOM_HANDLE - index].active = false
            this.customHandles[mxEvent.CUSTOM_HANDLE - index].execute(me)

            // Sets style and apply on shape to force repaint and
            // check if execute has removed custom handles
            if (this.customHandles != null &&
              this.customHandles[mxEvent.CUSTOM_HANDLE - index] != null) {
              this.state.style = style
              this.customHandles[mxEvent.CUSTOM_HANDLE - index].positionChanged()
            }
          }
        } else if (index === mxEvent.ROTATION_HANDLE) {
          if (this.currentAlpha != null) {
            const delta = this.currentAlpha - (this.state.style[mxConstants.STYLE_ROTATION] || 0)

            if (delta !== 0) {
              this.rotateCell(this.state.cell, delta)
            }
          } else {
            this.rotateClick()
          }
        } else {
          const gridEnabled = this.graph.isGridEnabledEvent(me.getEvent())
          const alpha = mxUtils.toRadians(this.state.style[mxConstants.STYLE_ROTATION] || '0')
          const cos = Math.cos(-alpha)
          const sin = Math.sin(-alpha)

          let dx = point.x - this.startX
          let dy = point.y - this.startY

          // Rotates vector for mouse gesture
          const tx = cos * dx - sin * dy
          const ty = sin * dx + cos * dy

          dx = tx
          dy = ty

          const s = this.graph.view.scale
          const recurse = this.isRecursiveResize(this.state, me)
          this.resizeCell(this.state.cell, this.roundLength(dx / s), this.roundLength(dy / s),
            index, gridEnabled, this.isConstrainedEvent(me), recurse)
        }
      } finally {
        this.graph.getModel().endUpdate()
      }

      // Restores order if cell wasn't changed in model
      if (this.state.invalid) {
        this.state.view.validate()
      }

      me.consume()
      this.reset()
      this.redrawHandles()
    }
  }
  /**
   * Function: reset
   *
   * Resets the state of this handler.
   */
  mxVertexHandler.prototype.reset = function () {
    if (this.sizers != null && this.index != null && this.sizers[this.index] != null &&
      this.sizers[this.index].node.style.display === 'none') {
      this.sizers[this.index].node.style.display = ''
    }

    this.currentAlpha = null
    this.inTolerance = null
    this.index = null

    // TODO: Reset and redraw cell states for live preview
    if (this.preview != null) {
      this.preview.destroy()
      this.preview = null
    }

    if (this.ghostPreview != null) {
      this.ghostPreview.destroy()
      this.ghostPreview = null
    }

    if (this.livePreviewActive && this.sizers != null) {
      for (let i = 0; i < this.sizers.length; i++) {
        if (this.sizers[i] != null) {
          this.sizers[i].node.style.display = ''
        }
      }

      // Shows folding icon
      if (this.state.control != null && this.state.control.node != null) {
        this.state.control.node.style.visibility = ''
      }
    }

    if (this.customHandles != null) {
      for (let i = 0; i < this.customHandles.length; i++) {
        if (this.customHandles[i] != null) {
          if (this.customHandles[i].active) {
            this.customHandles[i].active = false
            this.customHandles[i].reset()
          } else {
            this.customHandles[i].setVisible(true)
          }
        }
      }
    }

    // Checks if handler has been destroyed
    if (this.selectionBorder != null) {
      this.selectionBorder.node.style.display = 'inline'
      this.selectionBounds = this.getSelectionBounds(this.state)
      this.bounds = new mxRectangle(this.selectionBounds.x, this.selectionBounds.y,
        this.selectionBounds.width, this.selectionBounds.height)
      this.drawPreview()
    }

    this.removeHint()
    this.redrawHandles()
    this.edgeHandlers = null
    this.handlesVisible = true
    this.unscaledBounds = null
    this.livePreviewActive = null
  }

  /**
   * Function: resizeCell
   *
   * Uses the given vector to change the bounds of the given cell
   * in the graph using <mxGraph.resizeCell>.
   */
  mxVertexHandler.prototype.resizeCell = function (cell, dx, dy, index, gridEnabled, constrained, recurse) {
    let geo = this.graph.model.getGeometry(cell)

    if (geo != null) {
      if (index === mxEvent.LABEL_HANDLE) {
        const alpha = -mxUtils.toRadians(this.state.style[mxConstants.STYLE_ROTATION] || '0')
        const horz = mxUtils.getValue(this.state.style, mxConstants.STYLE_HORIZONTAL, true) === 1
        const cos = Math.cos(alpha)
        const sin = Math.sin(alpha)
        const scale = this.graph.view.scale
        const pt = mxUtils.getRotatedPoint(new mxPoint(
            Math.round((this.labelShape.bounds.getCenterX() - this.startX) / scale),
            Math.round((this.labelShape.bounds.getCenterY() - this.startY) / scale)),
          cos, sin)

        if (!horz) {
          pt.y = -pt.y
        }

        geo = geo.clone()

        if (geo.offset == null) {
          geo.offset = pt
        } else {
          geo.offset.x += pt.x
          geo.offset.y += pt.y
        }

        this.graph.model.setGeometry(cell, geo)
      } else if (this.unscaledBounds != null) {
        const scale = this.graph.view.scale

        if (this.childOffsetX !== 0 || this.childOffsetY !== 0) {
          this.moveChildren(cell, Math.round(this.childOffsetX / scale), Math.round(this.childOffsetY / scale))
        }

        this.graph.resizeCell(cell, this.unscaledBounds, recurse)
      }
    }
  }

  /**
   * Function: redrawHandles
   *
   * Redraws the handles. To hide certain handles the following code can be used.
   *
   * (code)
   * mxVertexHandler.prototype.redrawHandles = function()
   * {
   *   mxVertexHandlerRedrawHandles.apply(this, arguments);
   *
   *   if (this.sizers != null && this.sizers.length > 7)
   *   {
   *     this.sizers[1].node.style.display = 'none';
   *     this.sizers[6].node.style.display = 'none';
   *   }
   * };
   * (end)
   */
  mxVertexHandler.prototype.redrawHandles = function () {
    let s = this.getSizerBounds()
    const tol = this.tolerance
    this.horizontalOffset = 0
    this.verticalOffset = 0

    if (this.customHandles != null) {
      for (let i = 0; i < this.customHandles.length; i++) {
        if (this.customHandles[i] != null) {
          const temp = this.customHandles[i].shape.node.style.display
          this.customHandles[i].redraw()
          this.customHandles[i].shape.node.style.display = temp

          // Hides custom handles during text editing
          this.customHandles[i].shape.node.style.visibility =
            (!this.handlesVisible || !this.isHandlesVisible() ||
              !this.isCustomHandleVisible(this.customHandles[i]) ||
              this.graph.isEditing())
              ? 'hidden'
              : ''
        }
      }
    }

    if (this.sizers != null && this.sizers.length > 0 && this.sizers[0] != null) {
      if (this.index == null && this.manageSizers && this.sizers.length >= 8) {
        // KNOWN: Tolerance depends on event type (eg. 0 for mouse events)
        const padding = this.getHandlePadding()
        this.horizontalOffset = padding.x
        this.verticalOffset = padding.y

        if (this.horizontalOffset !== 0 || this.verticalOffset !== 0) {
          s = new mxRectangle(s.x, s.y, s.width, s.height)

          s.x -= this.horizontalOffset / 2
          s.width += this.horizontalOffset
          s.y -= this.verticalOffset / 2
          s.height += this.verticalOffset
        }

        if (this.sizers.length >= 8) {
          if ((s.width < 2 * this.sizers[0].bounds.width + 2 * tol) ||
            (s.height < 2 * this.sizers[0].bounds.height + 2 * tol)) {
            this.sizers[0].node.style.display = 'none'
            this.sizers[2].node.style.display = 'none'
            this.sizers[5].node.style.display = 'none'
            this.sizers[7].node.style.display = 'none'
          } else if (this.handlesVisible) {
            this.sizers[0].node.style.display = ''
            this.sizers[2].node.style.display = ''
            this.sizers[5].node.style.display = ''
            this.sizers[7].node.style.display = ''
          }
        }
      }

      const r = s.x + s.width
      const b = s.y + s.height

      if (this.singleSizer) {
        this.moveSizerTo(this.sizers[0], r, b)
      } else {
        const cx = s.x + s.width / 2
        const cy = s.y + s.height / 2

        if (this.sizers.length >= 8) {
          const crs = ['nw-resize', 'n-resize', 'ne-resize', 'e-resize', 'se-resize', 's-resize', 'sw-resize', 'w-resize']

          const alpha = mxUtils.toRadians(this.state.style[mxConstants.STYLE_ROTATION] || '0')
          const cos = Math.cos(alpha)
          const sin = Math.sin(alpha)

          const da = Math.round(alpha * 4 / Math.PI)

          const ct = new mxPoint(s.getCenterX(), s.getCenterY())
          let pt = mxUtils.getRotatedPoint(new mxPoint(s.x, s.y), cos, sin, ct)

          this.moveSizerTo(this.sizers[0], pt.x, pt.y)
          this.sizers[0].setCursor(crs[mxUtils.mod(0 + da, crs.length)])

          pt.x = cx
          pt.y = s.y
          pt = mxUtils.getRotatedPoint(pt, cos, sin, ct)

          this.moveSizerTo(this.sizers[1], pt.x, pt.y)
          this.sizers[1].setCursor(crs[mxUtils.mod(1 + da, crs.length)])

          pt.x = r
          pt.y = s.y
          pt = mxUtils.getRotatedPoint(pt, cos, sin, ct)

          this.moveSizerTo(this.sizers[2], pt.x, pt.y)
          this.sizers[2].setCursor(crs[mxUtils.mod(2 + da, crs.length)])

          pt.x = s.x
          pt.y = cy
          pt = mxUtils.getRotatedPoint(pt, cos, sin, ct)

          this.moveSizerTo(this.sizers[3], pt.x, pt.y)
          this.sizers[3].setCursor(crs[mxUtils.mod(7 + da, crs.length)])

          pt.x = r
          pt.y = cy
          pt = mxUtils.getRotatedPoint(pt, cos, sin, ct)

          this.moveSizerTo(this.sizers[4], pt.x, pt.y)
          this.sizers[4].setCursor(crs[mxUtils.mod(3 + da, crs.length)])

          pt.x = s.x
          pt.y = b
          pt = mxUtils.getRotatedPoint(pt, cos, sin, ct)

          this.moveSizerTo(this.sizers[5], pt.x, pt.y)
          this.sizers[5].setCursor(crs[mxUtils.mod(6 + da, crs.length)])

          pt.x = cx
          pt.y = b
          pt = mxUtils.getRotatedPoint(pt, cos, sin, ct)

          this.moveSizerTo(this.sizers[6], pt.x, pt.y)
          this.sizers[6].setCursor(crs[mxUtils.mod(5 + da, crs.length)])

          pt.x = r
          pt.y = b
          pt = mxUtils.getRotatedPoint(pt, cos, sin, ct)

          this.moveSizerTo(this.sizers[7], pt.x, pt.y)
          this.sizers[7].setCursor(crs[mxUtils.mod(4 + da, crs.length)])

          const horz = mxUtils.getValue(this.state.style, mxConstants.STYLE_HORIZONTAL, true) === 1
          pt.x = cx + this.state.absoluteOffset.x
          pt.y = cy + ((horz ? 1 : -1) * this.state.absoluteOffset.y)
          pt = mxUtils.getRotatedPoint(pt, cos, sin, ct)
          this.moveSizerTo(this.sizers[8], pt.x, pt.y)
        } else if (this.state.width >= 2 && this.state.height >= 2 &&
          this.state.absoluteOffset != null) {
          this.moveSizerTo(this.sizers[0], cx + this.state.absoluteOffset.x,
            cy + this.state.absoluteOffset.y)
        } else {
          this.moveSizerTo(this.sizers[0], this.state.x, this.state.y)
        }
      }
    }

    if (this.sizers != null) {
      for (let i = 0; i < this.sizers.length; i++) {
        this.sizers[i].node.style.visibility = (this.isHandlesVisible()) ? '' : 'hidden'
      }
    }

    if (this.rotationShape != null) {
      const alpha = mxUtils.toRadians((this.currentAlpha != null) ? this.currentAlpha : this.state.style[mxConstants.STYLE_ROTATION] || '0')
      const cos = Math.cos(alpha)
      const sin = Math.sin(alpha)

      const ct = new mxPoint(this.state.getCenterX(), this.state.getCenterY())
      const pt = mxUtils.getRotatedPoint(this.getRotationHandlePosition(), cos, sin, ct)

      if (this.rotationShape.node != null) {
        this.moveSizerTo(this.rotationShape, pt.x, pt.y)

        // Hides rotation handle during text editing
        this.rotationShape.node.style.visibility =
          (this.state.view.graph.isEditing() ||
            !this.handlesVisible || !this.isHandlesVisible() ||
            !this.isRotationHandleVisible())
            ? 'hidden'
            : ''
      }
    }

    if (this.selectionBorder != null) {
      this.selectionBorder.rotation = Number(this.state.style[mxConstants.STYLE_ROTATION] || '0')
    }

    if (this.edgeHandlers != null) {
      for (let i = 0; i < this.edgeHandlers.length; i++) {
        this.edgeHandlers[i].redraw()
      }
    }
  }

  /**
   * Function: isCustomHandleVisible
   *
   * Returns true if the given custom handle is visible.
   */
  mxVertexHandler.prototype.isCustomHandleVisible = function (handle) {
    return this.state.view.graph.getSelectionCount() === 1
  }

  /**
   * Function: destroyParentHighlight
   *
   * Destroys the parent highlight.
   */
  mxVertexHandler.prototype.destroyParentHighlight = function () {
    if (this.parentHighlight.state != null) {
      delete this.parentHighlight.state.parentHighlight
      delete this.parentHighlight.state
    }

    this.parentHighlight.destroy()
    this.parentHighlight = null
  }

  /**
   * Function: updateParentHighlight
   *
   * Updates the highlight of the parent if <parentHighlightEnabled> is true.
   */
  mxVertexHandler.prototype.updateParentHighlight = function () {
    if (!this.isDestroyed()) {
      const visible = this.isParentHighlightVisible()
      const parent = this.graph.model.getParent(this.state.cell)
      const pstate = this.graph.view.getState(parent)

      if (this.parentHighlight != null) {
        if (this.graph.model.isVertex(parent) && visible) {
          const b = this.parentHighlight.bounds

          if (pstate != null && (b.x !== pstate.x || b.y !== pstate.y ||
            b.width !== pstate.width || b.height !== pstate.height)) {
            this.parentHighlight.bounds = mxRectangle.fromRectangle(pstate)
            this.parentHighlight.redraw()
          }
        } else {
          this.destroyParentHighlight()
        }
      } else if (this.parentHighlightEnabled && visible) {
        if (this.graph.model.isVertex(parent) && pstate != null &&
          pstate.parentHighlight == null) {
          this.parentHighlight = this.createParentHighlightShape(pstate)
          this.parentHighlight.dialect = mxConstants.DIALECT_SVG
          this.parentHighlight.svgStrokeTolerance = 0
          this.parentHighlight.pointerEvents = false
          this.parentHighlight.rotation = Number(pstate.style[mxConstants.STYLE_ROTATION] || '0')
          this.parentHighlight.init(this.graph.getView().getOverlayPane())
          this.parentHighlight.redraw()

          // Shows highlight once per parent
          pstate.parentHighlight = this.parentHighlight
          this.parentHighlight.state = pstate
        }
      }
    }
  }
  /**
   * Function: createSizers
   *
   * Destroys the handler and all its resources and DOM nodes.
   */
  mxVertexHandler.prototype.createSizers = function () {
    const resizable = this.graph.isCellResizable(this.state.cell) &&
      !this.graph.isCellLocked(this.state.cell)
    const sizers = []

    if (resizable || (this.graph.isLabelMovable(this.state.cell) &&
      this.state.width >= 2 && this.state.height >= 2)) {
      let i = 0

      if (resizable) {
        if (!this.singleSizer) {
          sizers.push(this.createSizer('nw-resize', i++))
          sizers.push(this.createSizer('n-resize', i++))
          sizers.push(this.createSizer('ne-resize', i++))
          sizers.push(this.createSizer('w-resize', i++))
          sizers.push(this.createSizer('e-resize', i++))
          sizers.push(this.createSizer('sw-resize', i++))
          sizers.push(this.createSizer('s-resize', i++))
        }

        sizers.push(this.createSizer('se-resize', i++))
      }

      const geo = this.graph.model.getGeometry(this.state.cell)

      if (geo != null && !geo.relative && !this.graph.isSwimlane(this.state.cell) &&
        this.graph.isLabelMovable(this.state.cell)) {
        // Marks this as the label handle for getHandleForEvent
        this.labelShape = this.createSizer(mxConstants.CURSOR_LABEL_HANDLE, mxEvent.LABEL_HANDLE,
          mxConstants.LABEL_HANDLE_SIZE, mxConstants.LABEL_HANDLE_FILLCOLOR)
        sizers.push(this.labelShape)
      }
    } else if (this.graph.isCellMovable(this.state.cell) && !resizable &&
      this.state.width < 2 && this.state.height < 2) {
      this.labelShape = this.createSizer(mxConstants.CURSOR_MOVABLE_VERTEX,
        mxEvent.LABEL_HANDLE, null, mxConstants.LABEL_HANDLE_FILLCOLOR)
      sizers.push(this.labelShape)
    }

    // Adds the rotation handler
    if (this.rotationShape == null) {
      this.rotationShape = this.createSizer(this.rotationCursor, mxEvent.ROTATION_HANDLE,
        mxConstants.HANDLE_SIZE + 3, mxConstants.HANDLE_FILLCOLOR)
      sizers.push(this.rotationShape)
    }

    return sizers
  }

  /**
   * Function: destroyCustomHandles
   *
   * Destroys the handler and all its resources and DOM nodes.
   */
  mxVertexHandler.prototype.destroyCustomHandles = function () {
    if (this.customHandles != null) {
      for (let i = 0; i < this.customHandles.length; i++) {
        if (this.customHandles[i] != null) {
          this.customHandles[i].destroy()
        }
      }

      this.customHandles = null
    }
  }

  /**
   * Function: destroySizers
   *
   * Destroys the handler and all its resources and DOM nodes.
   */
  mxVertexHandler.prototype.destroySizers = function () {
    if (this.sizers != null) {
      for (let i = 0; i < this.sizers.length; i++) {
        this.sizers[i].destroy()
      }

      this.sizers = null
      this.rotationShape = null
    }
  }
  /**
   * Function: destroy
   *
   * Destroys the handler and all its resources and DOM nodes.
   */
  mxVertexHandler.prototype.destroy = function () {
    if (this.escapeHandler != null) {
      this.state.view.graph.removeListener(this.escapeHandler)
      this.escapeHandler = null
    }

    if (this.preview != null) {
      this.preview.destroy()
      this.preview = null
    }

    if (this.ghostPreview != null) {
      this.ghostPreview.destroy()
      this.ghostPreview = null
    }

    if (this.selectionBorder != null) {
      this.selectionBorder.destroy()
      this.selectionBorder = null
    }

    if (this.parentHighlight != null) {
      this.destroyParentHighlight()
    }

    this.labelShape = null
    this.removeHint()
    this.destroySizers()
    this.destroyCustomHandles()
  }
  mxOutput.mxVertexHandler = mxVertexHandler
}
