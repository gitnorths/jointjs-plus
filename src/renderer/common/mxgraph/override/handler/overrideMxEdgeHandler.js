export function overrideMxEdgeHandler (mxOutput) {
  const {
    mxEdgeHandler,
    mxConstraintHandler,
    mxConnectionConstraint,
    mxConstants,
    mxEvent,
    mxVertexHandler,
    mxUtils,
    mxClient,
    mxRectangle,
    mxPoint,
    mxGraphHandler
  } = mxOutput
  /**
   * Variable: virtualBendOpacity
   *
   * Opacity to be used for virtual bends (see <virtualBendsEnabled>).
   * Default is 40.
   */
  mxEdgeHandler.prototype.virtualBendOpacity = 40
  /**
   * Function: init
   *
   * Initializes the shapes required for this edge handler.
   */
  mxEdgeHandler.prototype.init = function () {
    this.graph = this.state.view.graph
    this.marker = this.createMarker()

    // Clones the original points from the cell
    // and makes sure at least one point exists
    this.points = []

    // Uses the absolute points of the state
    // for the initial configuration and preview
    this.abspoints = this.getSelectionPoints(this.state)
    this.shape = this.createSelectionShape(this.abspoints)
    this.shape.dialect = (this.graph.dialect !== mxConstants.DIALECT_SVG)
      ? mxConstants.DIALECT_MIXEDHTML
      : mxConstants.DIALECT_SVG
    this.shape.init(this.graph.getView().getOverlayPane())
    this.shape.svgStrokeTolerance = 0
    this.shape.pointerEvents = false
    mxEvent.redirectMouseEvents(this.shape.node, this.graph, this.state)

    if (this.graph.isCellMovable(this.state.cell)) {
      this.shape.setCursor(mxConstants.CURSOR_MOVABLE_EDGE)
    }

    // Updates preferHtml
    this.preferHtml = this.state.text != null &&
      this.state.text.node.parentNode === this.graph.container

    if (!this.preferHtml) {
      // Checks source terminal
      const sourceState = this.state.getVisibleTerminalState(true)

      if (sourceState != null) {
        this.preferHtml = sourceState.text != null &&
          sourceState.text.node.parentNode === this.graph.container
      }

      if (!this.preferHtml) {
        // Checks target terminal
        const targetState = this.state.getVisibleTerminalState(false)

        if (targetState != null) {
          this.preferHtml = targetState.text != null &&
            targetState.text.node.parentNode === this.graph.container
        }
      }
    }

    this.updateParentHighlight()
    this.refresh()
    this.redraw()
  }

  /**
   * Function: createLabelShape
   *
   * Creates, initializes and returns the label shape.
   */
  mxEdgeHandler.prototype.createLabelShape = function () {
    const shape = this.createLabelHandleShape()
    this.initBend(shape)

    return shape
  }

  /**
   * Function: getConstraintHandler
   *
   * Returns the constraint handler. This implementation creates a new
   * <mxConstraintHandler> if one does not yet exist.
   */
  mxEdgeHandler.prototype.getConstraintHandler = function () {
    if (this.constraintHandler == null) {
      this.constraintHandler = this.createConstraintHandler()
    }

    return this.constraintHandler
  }

  /**
   * Function: createConstraintHandler
   *
   * Creates and returns a new <mxConstraintHandler> for this handler.
   */
  mxEdgeHandler.prototype.createConstraintHandler = function () {
    return new mxConstraintHandler(this.graph)
  }
  /**
   * Function: destroyParentHighlight
   *
   * Destroys the parent highlight.
   */
  mxEdgeHandler.prototype.destroyParentHighlight = mxVertexHandler.prototype.destroyParentHighlight

  /**
   * Function: getSelectionColor
   *
   * Returns <mxConstants.EDGE_SELECTION_COLOR>.
   */
  mxEdgeHandler.prototype.getSelectionColor = function () {
    return (this.graph.isCellEditable(this.state.cell))
      ? mxConstants.EDGE_SELECTION_COLOR
      : mxConstants.LOCKED_HANDLE_FILLCOLOR
  }
  /**
   * Function: createBends
   *
   * Creates and returns the bends used for modifying the edge. This is
   * typically an array of <mxRectangleShapes>.
   */
  mxEdgeHandler.prototype.createBends = function () {
    const cell = this.state.cell
    const bends = []

    if (this.abspoints != null) {
      for (let i = 0; i < this.abspoints.length; i++) {
        if (this.isHandleVisible(i)) {
          const source = i === 0
          const target = i === this.abspoints.length - 1
          const terminal = source || target

          if (terminal || this.graph.isCellBendable(cell)) {
            (mxUtils.bind(this, function (index) {
              const bend = this.createHandleShape(index, null, index === this.abspoints.length - 1)
              this.initBend(bend, mxUtils.bind(this, mxUtils.bind(this, function () {
                if (this.dblClickRemoveEnabled) {
                  this.removePoint(this.state, index)
                }
              })))

              if (this.isHandleEnabled(i)) {
                bend.setCursor((terminal) ? mxConstants.CURSOR_TERMINAL_HANDLE : mxConstants.CURSOR_BEND_HANDLE)
              }

              bends.push(bend)

              if (!terminal) {
                this.points.push(new mxPoint(0, 0))
                bend.node.style.visibility = 'hidden'
              }
            }))(i)
          }
        }
      }
    }

    return bends
  }
  /**
   * Function: createVirtualBends
   *
   * Creates and returns the bends used for modifying the edge. This is
   * typically an array of <mxRectangleShapes>.
   */
  mxEdgeHandler.prototype.createVirtualBends = function () {
    const bends = []

    if (this.abspoints != null && this.abspoints.length > 0 &&
      this.graph.isCellBendable(this.state.cell)) {
      for (let i = 1; i < this.abspoints.length; i++) {
        (mxUtils.bind(this, function (bend) {
          this.initBend(bend)
          bend.setCursor(mxConstants.CURSOR_VIRTUAL_BEND_HANDLE)
          bends.push(bend)
        }))(this.createHandleShape())
      }
    }

    return bends
  }

  /**
   * Function: initBend
   *
   * Helper method to initialize the given bend.
   *
   * Parameters:
   *
   * bend - <mxShape> that represents the bend to be initialized.
   */
  mxEdgeHandler.prototype.initBend = function (bend, dblClick) {
    if (this.preferHtml) {
      bend.dialect = mxConstants.DIALECT_STRICTHTML
      bend.init(this.graph.container)
    } else {
      bend.dialect = (this.graph.dialect !== mxConstants.DIALECT_SVG)
        ? mxConstants.DIALECT_MIXEDHTML
        : mxConstants.DIALECT_SVG
      bend.init(this.graph.getView().getOverlayPane())
    }

    mxEvent.redirectMouseEvents(bend.node, this.graph, this.state,
      null, null, null, dblClick)

    if (mxClient.IS_TOUCH) {
      bend.node.setAttribute('pointer-events', 'none')
    }
  }
  /**
   * Function: getHandleForEvent
   *
   * Returns the index of the handle for the given event.
   */
  mxEdgeHandler.prototype.getHandleForEvent = function (me) {
    let result = null

    if (this.state != null) {
      // Connection highlight may consume events before they reach sizer handle
      const tol = (!mxEvent.isMouseEvent(me.getEvent())) ? 2 * this.tolerance : 0
      const hit = (!this.allowHandleBoundsCheck)
        ? null
        : new mxRectangle(me.getGraphX() - tol, me.getGraphY() - tol, tol, tol)
      let minDistSq = null

      function checkShape (shape) {
        if (shape != null && (me.isSource(shape) ||
          shape.intersectsRectangle(hit))) {
          const dx = me.getGraphX() - shape.bounds.getCenterX()
          const dy = me.getGraphY() - shape.bounds.getCenterY()
          const tmp = dx * dx + dy * dy

          if (minDistSq == null || tmp <= minDistSq) {
            minDistSq = tmp

            return true
          }
        }

        return false
      }

      if (this.customHandles != null && this.isCustomHandleEvent(me)) {
        // Inverse loop order to match display order
        for (let i = this.customHandles.length - 1; i >= 0; i--) {
          if (checkShape(this.customHandles[i].shape)) {
            // LATER: Return reference to active shape
            return mxEvent.CUSTOM_HANDLE - i
          }
        }
      }

      if (this.state.text != null && (me.isSource(this.state.text) ||
        checkShape(this.labelShape))) {
        result = mxEvent.LABEL_HANDLE
      }

      if (this.bends != null) {
        for (let i = 0; i < this.bends.length; i++) {
          if (checkShape(this.bends[i])) {
            result = i
          }
        }
      }

      if (this.virtualBends != null && this.isAddVirtualBendEvent(me)) {
        for (let i = 0; i < this.virtualBends.length; i++) {
          if (checkShape(this.virtualBends[i])) {
            result = mxEvent.VIRTUAL_HANDLE - i
          }
        }
      }
    }

    return result
  }
  /**
   * Function: mouseDown
   *
   * Handles the event by checking if a special element of the handler
   * was clicked, in which case the index parameter is non-null. The
   * indices may be one of <LABEL_HANDLE> or the number of the respective
   * control point. The source and target points are used for reconnecting
   * the edge.
   */
  mxEdgeHandler.prototype.mouseDown = function (sender, me) {
    if (this.graph.isCellEditable(this.state.cell)) {
      const handle = this.getHandleForEvent(me)

      if (this.bends != null && this.bends[handle] != null) {
        const b = this.bends[handle].bounds
        this.snapPoint = new mxPoint(b.getCenterX(), b.getCenterY())
      }

      if (this.addEnabled && handle == null && this.isAddPointEvent(me.getEvent())) {
        this.addPoint(this.state, me.getEvent())
        me.consume()
      } else if (handle != null && !me.isConsumed() && this.graph.isEnabled()) {
        if (this.removeEnabled && this.isRemovePointEvent(me.getEvent())) {
          this.removePoint(this.state, handle)
        } else if (handle !== mxEvent.LABEL_HANDLE || this.graph.isLabelMovable(me.getCell())) {
          if (handle <= mxEvent.VIRTUAL_HANDLE) {
            mxUtils.setOpacity(this.virtualBends[mxEvent.VIRTUAL_HANDLE - handle].node, 100)
          }

          this.mouseDownX = me.getX()
          this.mouseDownY = me.getY()
          this.handle = handle
        }

        if (!mxEvent.isShiftDown(me.getEvent())) {
          me.consume()
        }
      }
    }
  }
  /**
   * Function: getSnapToTerminalTolerance
   *
   * Returns the tolerance for the guides. Default value is 2.
   */
  mxEdgeHandler.prototype.getSnapToTerminalTolerance = function () {
    return 2
  }
  /**
   * Function: getPointForEvent
   *
   * Returns the point for the given event.
   */
  mxEdgeHandler.prototype.getPointForEvent = function (me) {
    const view = this.graph.getView()
    const scale = view.scale
    const point = new mxPoint(this.roundLength(me.getGraphX() / scale) * scale,
      this.roundLength(me.getGraphY() / scale) * scale)

    const tt = this.getSnapToTerminalTolerance()
    let overrideX = false
    let overrideY = false

    if (tt > 0 && this.isSnapToTerminalsEvent(me)) {
      function snapToPoint (pt) {
        if (pt != null) {
          const x = pt.x

          if (Math.abs(point.x - x) < tt) {
            point.x = x
            overrideX = true
          }

          const y = pt.y

          if (Math.abs(point.y - y) < tt) {
            point.y = y
            overrideY = true
          }
        }
      }

      function snapToTerminal (terminal) {
        if (terminal != null) {
          snapToPoint.call(this, new mxPoint(view.getRoutingCenterX(terminal),
            view.getRoutingCenterY(terminal)))
        }
      }

      snapToTerminal.call(this, this.state.getVisibleTerminalState(true))
      snapToTerminal.call(this, this.state.getVisibleTerminalState(false))
      const pts = this.state.absolutePoints

      if (pts != null) {
        for (let i = 0; i < pts.length; i++) {
          if ((i > 0 || !this.state.isFloatingTerminalPoint(true)) &&
            (i < pts.length - 1 || !this.state.isFloatingTerminalPoint(false))) {
            snapToPoint.call(this, this.state.absolutePoints[i])
          }
        }
      }
    }

    if (this.graph.isGridEnabledEvent(me.getEvent())) {
      const tr = view.translate

      if (!overrideX) {
        point.x = (this.graph.snap(point.x / scale - tr.x) + tr.x) * scale
      }

      if (!overrideY) {
        point.y = (this.graph.snap(point.y / scale - tr.y) + tr.y) * scale
      }
    }

    return point
  }

  /**
   * Function: getPreviewTerminalState
   *
   * Updates the given preview state taking into account the state of the constraint handler.
   */
  mxEdgeHandler.prototype.getPreviewTerminalState = function (me) {
    const constraintHandler = this.getConstraintHandler()
    constraintHandler.update(me, this.isSource, true, me.isSource(this.marker.highlight.shape) ? null : this.currentPoint)

    if (constraintHandler.currentFocus != null && constraintHandler.currentConstraint != null) {
      // Handles special case where grid is large and connection point is at actual point in which
      // case the outline is not followed as long as we're < gridSize / 2 away from that point
      if (this.marker.highlight != null && this.marker.highlight.state != null &&
        this.marker.highlight.state.cell === constraintHandler.currentFocus.cell) {
        // Direct repaint needed if cell already highlighted
        if (this.marker.highlight.shape.stroke !== 'transparent') {
          this.marker.highlight.shape.stroke = 'transparent'
          this.marker.highlight.repaint()
        }
      } else {
        this.marker.markCell(constraintHandler.currentFocus.cell, 'transparent')
      }

      const model = this.graph.getModel()
      const other = this.graph.view.getTerminalPort(this.state,
        this.graph.view.getState(model.getTerminal(this.state.cell,
          !this.isSource)), !this.isSource)
      const otherCell = (other != null) ? other.cell : null
      const source = (this.isSource) ? constraintHandler.currentFocus.cell : otherCell
      const target = (this.isSource) ? otherCell : constraintHandler.currentFocus.cell

      // Updates the error message of the handler
      this.error = this.validateConnection(source, target)
      let result = null

      if (this.error == null) {
        result = constraintHandler.currentFocus
      }

      if (this.error != null || (result != null &&
        !this.isCellEnabled(result.cell))) {
        constraintHandler.reset()
      }

      return result
    } else if (!this.graph.isIgnoreTerminalEvent(me.getEvent())) {
      this.marker.process(me)
      const state = this.marker.getValidState()

      if (state != null && !this.isCellEnabled(state.cell)) {
        constraintHandler.reset()
        this.marker.reset()
      }

      return this.marker.getValidState()
    } else {
      this.marker.reset()

      return null
    }
  }
  /**
   * Function: isOutlineConnectEvent
   *
   * Returns true if <outlineConnect> is true and the source of the event is the
   * outline shape or shift is pressed.
   */
  mxEdgeHandler.prototype.isOutlineConnectEvent = function (me) {
    if (mxEvent.isShiftDown(me.getEvent()) && mxEvent.isAltDown(me.getEvent())) {
      return false
    } else {
      const offset = mxUtils.getOffset(this.graph.container)
      const evt = me.getEvent()

      const clientX = mxEvent.getClientX(evt)
      const clientY = mxEvent.getClientY(evt)

      const doc = document.documentElement
      const left = (window.pageXOffset || doc.scrollLeft) - (doc.clientLeft || 0)
      const top = (window.pageYOffset || doc.scrollTop) - (doc.clientTop || 0)

      const gridX = this.currentPoint.x - this.graph.container.scrollLeft + offset.x - left
      const gridY = this.currentPoint.y - this.graph.container.scrollTop + offset.y - top

      return this.outlineConnect && ((mxEvent.isShiftDown(me.getEvent()) &&
        !mxEvent.isAltDown(me.getEvent())) || (me.isSource(this.marker.highlight.shape) ||
        (!mxEvent.isShiftDown(me.getEvent()) && mxEvent.isAltDown(me.getEvent()) &&
          me.getState() != null) || this.marker.highlight.isHighlightAt(clientX, clientY) ||
        ((gridX !== clientX || gridY !== clientY) && me.getState() == null &&
          this.marker.highlight.isHighlightAt(gridX, gridY))))
    }
  }

  /**
   * Function: updatePreviewState
   *
   * Updates the given preview state taking into account the state of the constraint handler.
   */
  mxEdgeHandler.prototype.updatePreviewState = function (edge, point, terminalState, me, outline) {
    // Computes the points for the edge style and terminals
    const sourceState = (this.isSource) ? terminalState : this.state.getVisibleTerminalState(true)
    const targetState = (this.isTarget) ? terminalState : this.state.getVisibleTerminalState(false)

    let sourceConstraint = this.graph.getConnectionConstraint(edge, sourceState, true)
    let targetConstraint = this.graph.getConnectionConstraint(edge, targetState, false)

    const constraintHandler = this.getConstraintHandler()
    let constraint = constraintHandler.currentConstraint

    if (constraint == null && outline) {
      if (terminalState != null) {
        // Handles special case where mouse is on outline away from actual end point
        // in which case the grid is ignored and mouse point is used instead
        if (me.isSource(this.marker.highlight.shape)) {
          point = new mxPoint(me.getGraphX(), me.getGraphY())
        }

        constraint = this.graph.getOutlineConstraint(point, terminalState, me)
        constraintHandler.setFocus(me, terminalState, this.isSource)
        constraintHandler.currentConstraint = constraint
        constraintHandler.currentPoint = point
      } else {
        constraint = new mxConnectionConstraint()
      }
    }

    if (this.outlineConnect && this.marker.highlight != null && this.marker.highlight.shape != null) {
      const s = this.graph.view.scale

      if (constraintHandler.currentConstraint != null &&
        constraintHandler.currentFocus != null) {
        this.marker.highlight.shape.stroke = (outline) ? mxConstants.OUTLINE_HIGHLIGHT_COLOR : 'transparent'
        this.marker.highlight.shape.strokewidth = mxConstants.OUTLINE_HIGHLIGHT_STROKEWIDTH / s / s
        this.marker.highlight.repaint()
      } else if (this.marker.hasValidState()) {
        this.marker.highlight.shape.stroke = (this.graph.isCellConnectable(me.getCell()) &&
          this.marker.getValidState() !== me.getState())
          ? 'transparent'
          : mxConstants.DEFAULT_VALID_COLOR
        this.marker.highlight.shape.strokewidth = mxConstants.HIGHLIGHT_STROKEWIDTH / s / s
        this.marker.highlight.repaint()
      }
    }

    if (this.isSource) {
      sourceConstraint = constraint
    } else if (this.isTarget) {
      targetConstraint = constraint
    }

    if (this.isSource || this.isTarget) {
      if (constraint != null && constraint.point != null) {
        edge.style[(this.isSource) ? mxConstants.STYLE_EXIT_X : mxConstants.STYLE_ENTRY_X] = constraint.point.x
        edge.style[(this.isSource) ? mxConstants.STYLE_EXIT_Y : mxConstants.STYLE_ENTRY_Y] = constraint.point.y
      } else {
        delete edge.style[(this.isSource) ? mxConstants.STYLE_EXIT_X : mxConstants.STYLE_ENTRY_X]
        delete edge.style[(this.isSource) ? mxConstants.STYLE_EXIT_Y : mxConstants.STYLE_ENTRY_Y]
      }
    }

    edge.setVisibleTerminalState(sourceState, true)
    edge.setVisibleTerminalState(targetState, false)

    if (!this.isSource || sourceState != null) {
      edge.view.updateFixedTerminalPoint(edge, sourceState, true, sourceConstraint)
    }

    if (!this.isTarget || targetState != null) {
      edge.view.updateFixedTerminalPoint(edge, targetState, false, targetConstraint)
    }

    if ((this.isSource || this.isTarget) && terminalState == null) {
      edge.setAbsoluteTerminalPoint(point, this.isSource)

      if (this.marker.getMarkedState() == null) {
        this.error = (this.graph.allowDanglingEdges) ? null : ''
      }
    }

    edge.view.updatePoints(edge, this.points, sourceState, targetState)
    edge.view.updateFloatingTerminalPoints(edge, sourceState, targetState)
  }

  /**
   * Function: mouseMove
   *
   * Handles the event by updating the preview.
   */
  mxEdgeHandler.prototype.mouseMove = function (sender, me) {
    if (this.index != null && this.marker != null) {
      const constraintHandler = this.getConstraintHandler()
      this.currentPoint = this.getPointForEvent(me)
      this.error = null

      // Uses the current point from the constraint handler if available
      if (this.snapPoint != null && mxEvent.isShiftDown(me.getEvent()) &&
        !this.graph.isIgnoreTerminalEvent(me.getEvent()) &&
        constraintHandler.currentFocus == null &&
        constraintHandler.currentFocus !== this.state) {
        if (Math.abs(this.snapPoint.x - this.currentPoint.x) <
          Math.abs(this.snapPoint.y - this.currentPoint.y)) {
          this.currentPoint.x = this.snapPoint.x
        } else {
          this.currentPoint.y = this.snapPoint.y
        }
      }

      if (this.index <= mxEvent.CUSTOM_HANDLE && this.index > mxEvent.VIRTUAL_HANDLE) {
        if (this.customHandles != null) {
          this.customHandles[mxEvent.CUSTOM_HANDLE - this.index].processEvent(me)
          this.customHandles[mxEvent.CUSTOM_HANDLE - this.index].positionChanged()

          if (this.shape != null && this.shape.node != null) {
            this.shape.node.style.display = 'none'
          }
        }
      } else if (this.isLabel) {
        this.label.x = this.currentPoint.x
        this.label.y = this.currentPoint.y
      } else {
        let outline
        this.points = this.getPreviewPoints(this.currentPoint, me)
        let terminalState = (this.isSource || this.isTarget) ? this.getPreviewTerminalState(me) : null

        if (constraintHandler.currentConstraint != null &&
          constraintHandler.currentFocus != null &&
          constraintHandler.currentPoint != null) {
          this.currentPoint = constraintHandler.currentPoint.clone()
        } else if (this.outlineConnect) {
          // Need to check outline before cloning terminal state
          outline = (this.isSource || this.isTarget) ? this.isOutlineConnectEvent(me) : false

          if (outline) {
            terminalState = this.marker.highlight.state
          } else if (terminalState != null && terminalState !== me.getState() &&
            this.graph.isCellConnectable(me.getCell()) &&
            this.marker.highlight.shape != null) {
            this.marker.highlight.shape.stroke = 'transparent'
            this.marker.highlight.repaint()
            terminalState = null
          }
        }

        if (terminalState != null && !this.isCellEnabled(terminalState.cell)) {
          terminalState = null
          this.marker.reset()
        }

        const clone = this.clonePreviewState(this.currentPoint, (terminalState != null) ? terminalState.cell : null)
        this.updatePreviewState(clone, this.currentPoint, terminalState, me, outline)

        // Sets the color of the preview to valid or invalid, updates the
        // points of the preview and redraws
        const color = (this.error == null) ? this.marker.validColor : this.marker.invalidColor
        this.setPreviewColor(color)
        this.abspoints = clone.absolutePoints
        this.active = true
        this.updateHint(me, this.currentPoint, clone)
      }

      // This should go before calling isOutlineConnectEvent above. As a workaround
      // we add an offset of gridSize to the hint to avoid problem with hit detection
      // in highlight.isHighlightAt (which uses comonentFromPoint)
      this.drawPreview()
      mxEvent.consume(me.getEvent())
      me.consume()
    } else if (!mxEvent.isShiftDown(me.getEvent()) && this.handle != null &&
      this.mouseDownX != null && this.mouseDownY != null) {
      const tol = this.graph.tolerance

      if ((Math.abs(this.mouseDownX - me.getX()) > tol ||
        Math.abs(this.mouseDownY - me.getY()) > tol)) {
        this.start(this.mouseDownX, this.mouseDownY, this.handle)
      }
    }
  }
  /**
   * Function: mouseUp
   *
   * Handles the event to applying the previewed changes on the edge by
   * using <moveLabel>, <connect> or <changePoints>.
   */
  mxEdgeHandler.prototype.mouseUp = function (sender, me) {
    // Workaround for wrong event source in Webkit
    if (this.index != null && this.marker != null) {
      if (this.shape != null && this.shape.node != null) {
        this.shape.node.style.display = ''
      }

      let edge = this.state.cell
      const index = this.index
      this.index = null

      // Ignores event if mouse has not been moved
      if (me.getX() !== this.startX || me.getY() !== this.startY) {
        const clone = !this.graph.isIgnoreTerminalEvent(me.getEvent()) &&
          this.cloneEnabled && this.graph.isCloneEvent(me.getEvent()) &&
          this.graph.isCellsCloneable()

        // Displays the reason for not carriying out the change
        // if there is an error message with non-zero length
        if (this.error != null) {
          if (this.error.length > 0) {
            this.graph.validationAlert(this.error)
          }
        } else if (index <= mxEvent.CUSTOM_HANDLE && index > mxEvent.VIRTUAL_HANDLE) {
          if (this.customHandles != null) {
            const model = this.graph.getModel()

            model.beginUpdate()
            try {
              this.customHandles[mxEvent.CUSTOM_HANDLE - index].execute(me)

              if (this.shape != null && this.shape.node != null) {
                this.shape.apply(this.state)
                this.shape.redraw()
              }
            } finally {
              model.endUpdate()
            }
          }
        } else if (this.isLabel) {
          this.moveLabel(this.state, this.label.x, this.label.y)
        } else if (this.isSource || this.isTarget) {
          let terminal = null

          if (this.constraintHandler != null &&
            this.constraintHandler.currentConstraint != null &&
            this.constraintHandler.currentFocus != null) {
            terminal = this.constraintHandler.currentFocus.cell
          }

          if (terminal == null && this.marker.hasValidState() && this.marker.highlight != null &&
            this.marker.highlight.shape != null &&
            this.marker.highlight.shape.stroke !== 'transparent' &&
            this.marker.highlight.shape.stroke !== 'white') {
            terminal = this.marker.validState.cell
          }

          if (terminal != null) {
            const model = this.graph.getModel()
            const parent = model.getParent(edge)

            model.beginUpdate()
            try {
              // Clones and adds the cell
              if (clone) {
                let geo = model.getGeometry(edge)
                const clonedEdge = this.graph.cloneCell(edge)
                model.add(parent, clonedEdge, model.getChildCount(parent))

                if (geo != null) {
                  geo = geo.clone()
                  model.setGeometry(clonedEdge, geo)
                }

                const other = model.getTerminal(edge, !this.isSource)
                this.graph.connectCell(clonedEdge, other, !this.isSource)
                edge = clonedEdge
              }

              edge = this.connect(edge, terminal, this.isSource, clone, me)
            } finally {
              model.endUpdate()
            }
          } else if (this.graph.isAllowDanglingEdges()) {
            const pt = this.abspoints[(this.isSource) ? 0 : this.abspoints.length - 1]
            pt.x = this.roundLength(pt.x / this.graph.view.scale - this.graph.view.translate.x)
            pt.y = this.roundLength(pt.y / this.graph.view.scale - this.graph.view.translate.y)

            const pstate = this.graph.getView().getState(
              this.graph.getModel().getParent(edge))

            if (pstate != null) {
              pt.x -= pstate.origin.x
              pt.y -= pstate.origin.y
            }

            pt.x -= this.graph.panDx / this.graph.view.scale
            pt.y -= this.graph.panDy / this.graph.view.scale

            // Destroys and recreates this handler
            edge = this.changeTerminalPoint(edge, pt, this.isSource, clone)
          }
        } else if (this.active) {
          edge = this.changePoints(edge, this.points, clone)
        } else {
          this.graph.getView().invalidate(this.state.cell)
          this.graph.getView().validate(this.state.cell)
        }
      } else if (this.graph.isToggleEvent(me.getEvent())) {
        this.graph.selectCellForEvent(this.state.cell, me.getEvent())
      }

      // Resets the preview color the state of the handler if this
      // handler has not been recreated
      if (this.marker != null) {
        this.reset()

        // Updates the selection if the edge has been cloned
        if (edge !== this.state.cell) {
          this.graph.setSelectionCell(edge)
        }
      }

      me.consume()
    } else if (this.handle != null && this.bends != null &&
      !mxEvent.isAltDown(me.getEvent()) && (this.handle === 0 ||
        this.handle === this.bends.length - 1)) {
      const terminal = this.state.getVisibleTerminal(this.handle === 0)

      if (terminal != null) {
        this.graph.selectCellForEvent(terminal, me.getEvent())
        me.consume()
      }
    }

    this.handle = null
    this.mouseDownX = null
    this.mouseDownY = null
  }
  /**
   * Function: reset
   *
   * Resets the state of this handler.
   */
  mxEdgeHandler.prototype.reset = function () {
    if (this.active) {
      this.refresh()
    }

    this.error = null
    this.index = null
    this.label = null
    this.points = null
    this.handle = null
    this.startX = null
    this.startY = null
    this.mouseDownX = null
    this.mouseDownY = null
    this.snapPoint = null
    this.isLabel = false
    this.isSource = false
    this.isTarget = false
    this.active = false

    if (this.livePreview && this.sizers != null) {
      for (let i = 0; i < this.sizers.length; i++) {
        if (this.sizers[i] != null) {
          this.sizers[i].node.style.display = ''
        }
      }
    }

    if (this.marker != null) {
      this.marker.reset()
    }

    if (this.constraintHandler != null) {
      this.constraintHandler.reset()
    }

    if (this.customHandles != null) {
      for (let i = 0; i < this.customHandles.length; i++) {
        this.customHandles[i].reset()
      }
    }

    this.setPreviewColor(mxConstants.EDGE_SELECTION_COLOR)
    this.removeHint()
    this.redraw()
  }
  /**
   * Function: connect
   *
   * Changes the terminal or terminal point of the given edge in the graph
   * model.
   *
   * Parameters:
   *
   * edge - <mxCell> that represents the edge to be reconnected.
   * terminal - <mxCell> that represents the new terminal.
   * isSource - Boolean indicating if the new terminal is the source or
   * target terminal.
   * isClone - Boolean indicating if the new connection should be a clone of
   * the old edge.
   * me - <mxMouseEvent> that contains the mouse up event.
   */
  mxEdgeHandler.prototype.connect = function (edge, terminal, isSource, isClone, me) {
    const model = this.graph.getModel()

    model.beginUpdate()
    try {
      let constraint = (this.constraintHandler != null)
        ? this.constraintHandler.currentConstraint
        : null

      if (constraint == null) {
        constraint = new mxConnectionConstraint()
      }

      this.graph.connectCell(edge, terminal, isSource, constraint)
    } finally {
      model.endUpdate()
    }

    return edge
  }
  /**
   * Function: redraw
   *
   * Redraws the preview, and the bends- and label control points.
   */
  mxEdgeHandler.prototype.redraw = function (ignoreHandles) {
    if (this.state != null && this.state.absolutePoints != null) {
      this.abspoints = this.state.absolutePoints.slice()
      const g = this.graph.getModel().getGeometry(this.state.cell)

      if (g != null) {
        const pts = g.points

        if (this.bends != null && this.bends.length > 0) {
          if (pts != null) {
            if (this.points == null) {
              this.points = []
            }

            for (let i = 1; i < this.bends.length - 1; i++) {
              if (this.bends[i] != null && this.abspoints[i] != null) {
                this.points[i - 1] = pts[i - 1]
              }
            }
          }
        }
      }

      this.drawPreview()

      if (!ignoreHandles) {
        this.redrawHandles()
      }
    }
  }

  /**
   * Function: isTerminalHandleVisible
   *
   * Redraws the handles.
   */
  mxEdgeHandler.prototype.isTerminalHandleVisible = function (source) {
    return true
  }

  /**
   * Function: redrawHandles
   *
   * Redraws the handles.
   */
  mxEdgeHandler.prototype.redrawHandles = function () {
    const cell = this.state.cell

    // Updates the handle for the label position
    if (this.labelShape != null) {
      const b = this.labelShape.bounds
      this.label = new mxPoint(this.state.absoluteOffset.x, this.state.absoluteOffset.y)
      this.labelShape.bounds = new mxRectangle(Math.round(this.label.x - b.width / 2),
        Math.round(this.label.y - b.height / 2), b.width, b.height)

      // Shows or hides the label handle depending on the label
      const lab = this.graph.getLabel(cell)
      this.labelShape.visible = lab != null && lab.length > 0 &&
        this.graph.isCellEditable(this.state.cell) &&
        this.graph.isLabelMovable(cell) &&
        this.isHandlesVisible()
    }

    if (this.bends != null && this.bends.length > 0) {
      const n = this.abspoints.length - 1

      const p0 = this.abspoints[0]
      const x0 = p0.x
      const y0 = p0.y

      let b = this.bends[0].bounds
      this.bends[0].bounds = new mxRectangle(Math.floor(x0 - b.width / 2),
        Math.floor(y0 - b.height / 2), b.width, b.height)
      this.bends[0].fill = this.getHandleFillColor(0)
      this.bends[0].redraw()

      if (this.manageLabelHandle) {
        this.checkLabelHandle(this.bends[0].bounds)
      }

      this.bends[0].node.style.visibility = (!this.isHandlesVisible() ||
        !this.isTerminalHandleVisible(true))
        ? 'hidden'
        : ''

      const pe = this.abspoints[n]
      const xn = pe.x
      const yn = pe.y

      const bn = this.bends.length - 1
      b = this.bends[bn].bounds
      this.bends[bn].bounds = new mxRectangle(Math.floor(xn - b.width / 2),
        Math.floor(yn - b.height / 2), b.width, b.height)
      this.bends[bn].fill = this.getHandleFillColor(bn)
      this.bends[bn].redraw()

      if (this.manageLabelHandle) {
        this.checkLabelHandle(this.bends[bn].bounds)
      }

      this.bends[bn].node.style.visibility = (!this.isHandlesVisible() ||
        !this.isTerminalHandleVisible(false))
        ? 'hidden'
        : ''
      this.redrawInnerBends(p0, pe)
    }

    if (this.abspoints != null && this.virtualBends != null && this.virtualBends.length > 0) {
      let last = this.abspoints[0]

      for (let i = 0; i < this.virtualBends.length; i++) {
        if (this.virtualBends[i] != null && this.abspoints[i + 1] != null) {
          const pt = this.abspoints[i + 1]
          const b = this.virtualBends[i]
          const x = last.x + (pt.x - last.x) / 2
          const y = last.y + (pt.y - last.y) / 2
          b.bounds = new mxRectangle(Math.floor(x - b.bounds.width / 2),
            Math.floor(y - b.bounds.height / 2), b.bounds.width, b.bounds.height)
          b.redraw()
          mxUtils.setOpacity(b.node, this.virtualBendOpacity)
          last = pt

          if (this.manageLabelHandle) {
            this.checkLabelHandle(b.bounds)
          }

          b.node.style.visibility = (!this.isHandlesVisible()) ? 'hidden' : ''
        }
      }
    }

    if (this.labelShape != null) {
      this.labelShape.redraw()
    }

    if (this.customHandles != null) {
      for (let i = 0; i < this.customHandles.length; i++) {
        const temp = this.customHandles[i].shape.node.style.display
        this.customHandles[i].redraw()
        this.customHandles[i].shape.node.style.display = temp

        // Hides custom handles during text editing
        this.customHandles[i].shape.node.style.visibility =
          (this.graph.isEditing() || !this.isHandlesVisible() ||
            !this.isCustomHandleVisible(this.customHandles[i]))
            ? 'hidden'
            : ''
      }
    }
  }

  /**
   * Function: isCustomHandleVisible
   *
   * Returns true if the given custom handle is visible.
   */
  mxEdgeHandler.prototype.isCustomHandleVisible = function (handle) {
    return this.state.view.graph.getSelectionCount() === 1
  }
  /**
   * Function: hideHandles
   *
   * Shortcut to <hideSizers>.
   */
  mxEdgeHandler.prototype.setHandlesVisible = function (visible) {
    if (this.bends != null) {
      for (let i = 0; i < this.bends.length; i++) {
        if (this.bends[i] != null) {
          this.bends[i].node.style.display = (visible) ? '' : 'none'
        }
      }
    }

    if (this.virtualBends != null) {
      for (let i = 0; i < this.virtualBends.length; i++) {
        if (this.virtualBends[i] != null) {
          this.virtualBends[i].node.style.display = (visible) ? '' : 'none'
        }
      }
    }

    if (this.labelShape != null) {
      this.labelShape.node.style.display = (visible) ? '' : 'none'
    }

    if (this.customHandles != null) {
      for (let i = 0; i < this.customHandles.length; i++) {
        this.customHandles[i].setVisible(visible)
      }
    }
  }
  /**
   * Function: redrawInnerBends
   *
   * Updates and redraws the inner bends.
   *
   * Parameters:
   *
   * p0 - <mxPoint> that represents the location of the first point.
   * pe - <mxPoint> that represents the location of the last point.
   */
  mxEdgeHandler.prototype.redrawInnerBends = function (p0, pe) {
    for (let i = 1; i < this.bends.length - 1; i++) {
      if (this.bends[i] != null) {
        if (this.abspoints[i] != null) {
          const x = this.abspoints[i].x
          const y = this.abspoints[i].y

          const b = this.bends[i].bounds
          this.bends[i].bounds = new mxRectangle(Math.round(x - b.width / 2),
            Math.round(y - b.height / 2), b.width, b.height)

          if (this.manageLabelHandle) {
            this.checkLabelHandle(this.bends[i].bounds)
          } else if (this.handleImage == null && this.labelShape.visible && mxUtils.intersects(this.bends[i].bounds, this.labelShape.bounds)) {
            const w = mxConstants.HANDLE_SIZE + 3
            const h = mxConstants.HANDLE_SIZE + 3
            this.bends[i].bounds = new mxRectangle(Math.round(x - w / 2), Math.round(y - h / 2), w, h)
          }

          this.bends[i].redraw()
          this.bends[i].node.style.visibility = (!this.isHandlesVisible()) ? 'hidden' : ''
        } else {
          this.bends[i].destroy()
          this.bends[i] = null
        }
      }
    }
  }
  /**
   * Function: isHandlesVisible
   *
   * Returns true if all handles should be visible.
   */
  mxEdgeHandler.prototype.isHandlesVisible = function () {
    return !this.graph.isCellLocked(this.state.cell) &&
      (mxGraphHandler.prototype.maxCells <= 0 ||
        this.graph.getSelectionCount() <= mxGraphHandler.prototype.maxCells)
  }

  /**
   * Function: refresh
   *
   * Refreshes the bends of this handler.
   */
  mxEdgeHandler.prototype.refresh = function () {
    if (this.state != null) {
      this.abspoints = this.getSelectionPoints(this.state)
      this.points = []

      if (this.shape != null) {
        this.shape.isDashed = this.isSelectionDashed()
        this.shape.stroke = this.getSelectionColor()
        this.shape.isShadow = false
        this.shape.redraw()
      }

      if (this.bends != null) {
        this.destroyBends(this.bends)
        this.bends = null
      }

      if (this.isHandlesVisible()) {
        this.bends = this.createBends()
      }

      if (this.virtualBends != null) {
        this.destroyBends(this.virtualBends)
        this.virtualBends = null
      }

      if (this.isHandlesVisible()) {
        this.virtualBends = this.createVirtualBends()
      }

      if (this.customHandles != null) {
        this.destroyBends(this.customHandles)
        this.customHandles = null
      }

      if (this.isHandlesVisible()) {
        this.customHandles = this.createCustomHandles()
      }

      if (this.labelShape != null) {
        this.labelShape.destroy()
        this.labelShape = null
      }

      if (this.isHandlesVisible()) {
        this.labelShape = this.createLabelShape()

        // Puts label node on top of bends
        if (this.labelShape != null && this.labelShape.node != null &&
          this.labelShape.node.parentNode != null) {
          this.labelShape.node.parentNode.appendChild(this.labelShape.node)
        }
      }
    }
  }
  /**
   * Function: destroy
   *
   * Destroys the handler and all its resources and DOM nodes. This does
   * normally not need to be called as handlers are destroyed automatically
   * when the corresponding cell is deselected.
   */
  mxEdgeHandler.prototype.destroy = function () {
    if (this.escapeHandler != null) {
      this.state.view.graph.removeListener(this.escapeHandler)
      this.escapeHandler = null
    }

    if (this.marker != null) {
      this.marker.destroy()
      this.marker = null
    }

    if (this.shape != null) {
      this.shape.destroy()
      this.shape = null
    }

    if (this.labelShape != null) {
      this.labelShape.destroy()
      this.labelShape = null
    }

    if (this.constraintHandler != null) {
      this.constraintHandler.destroy()
      this.constraintHandler = null
    }

    if (this.parentHighlight != null) {
      this.destroyParentHighlight()
    }

    this.destroyBends(this.virtualBends)
    this.virtualBends = null

    this.destroyBends(this.customHandles)
    this.customHandles = null

    this.destroyBends(this.bends)
    this.bends = null

    this.removeHint()
  }
  mxOutput.mxEdgeHandler = mxEdgeHandler
}
