export function overrideMxConnectionHandler (mxOutput) {
  const {
    mxConnectionHandler,
    mxEvent,
    mxLog,
    mxPoint,
    mxEventObject,
    mxUtils,
    mxMouseEvent,
    mxPolyline,
    mxConstants,
    mxRectangle,
    mxImageShape,
    mxGeometry
  } = mxOutput
  /**
   * Variable: movePreviewAway
   *
   * Switch to enable moving the preview away from the mousepointer. This is required in browsers
   * where the preview cannot be made transparent to events and if the built-in hit detection on
   * the HTML elements in the page should be used. Default is the value of false.
   */
  mxConnectionHandler.prototype.movePreviewAway = false

  /**
   * Function: isInsertBefore
   *
   * Returns <insertBeforeSource> for non-loops and false for loops.
   *
   * Parameters:
   *
   * edge - <mxCell> that represents the edge to be inserted.
   * source - <mxCell> that represents the source terminal.
   * target - <mxCell> that represents the target terminal.
   * evt - Mousedown event of the connect gesture.
   * dropTarget - <mxCell> that represents the cell under the mouse when it was
   * released.
   */
  mxConnectionHandler.prototype.isInsertBefore = function (edge, source, target, evt, dropTarget) {
    return this.insertBeforeSource && source !== target &&
      this.graph.model.getParent(edge) ===
      this.graph.model.getParent(source)
  }

  /**
   * Function: createShape
   *
   * Creates the preview shape for new connections.
   */
  mxConnectionHandler.prototype.createShape = function () {
    // Creates the edge preview
    const shape = (this.livePreview && this.edgeState != null)
      ? this.graph.cellRenderer.createShape(this.edgeState)
      : new mxPolyline([], mxConstants.INVALID_COLOR)
    shape.dialect = mxConstants.DIALECT_SVG
    shape.scale = this.graph.view.scale
    shape.svgStrokeTolerance = 0
    shape.pointerEvents = false
    shape.isDashed = true
    shape.init(this.graph.getView().getOverlayPane())
    mxEvent.redirectMouseEvents(shape.node, this.graph, null)

    return shape
  }

  if (mxConnectionHandler.prototype.hasOwnProperty('movePreviewAway')) {
    delete mxConnectionHandler.prototype.movePreviewAway
  }
  /**
   * Function: createIcons
   *
   * Creates the array <mxImageShapes> that represent the connect icons for
   * the given <mxCellState>.
   *
   * Parameters:
   *
   * state - <mxCellState> whose connect icons should be returned.
   */
  mxConnectionHandler.prototype.createIcons = function (state) {
    const image = this.getConnectImage(state)

    if (image != null && state != null) {
      this.iconState = state
      const icons = []

      // Cannot use HTML for the connect icons because the icon receives all
      // mouse move events in IE, must use SVG instead even if the
      // connect-icon appears behind the selection border and the selection
      // border consumes the events before the icon gets a chance
      const bounds = new mxRectangle(0, 0, image.width, image.height)
      const icon = new mxImageShape(bounds, image.src, null, null, 0)
      icon.preserveImageAspect = false

      if (this.isMoveIconToFrontForState(state)) {
        icon.dialect = mxConstants.DIALECT_STRICTHTML
        icon.init(this.graph.container)
      } else {
        icon.dialect = mxConstants.DIALECT_SVG
        icon.init(this.graph.getView().getOverlayPane())

        // Move the icon back in the overlay pane
        if (this.moveIconBack && icon.node.previousSibling != null) {
          icon.node.parentNode.insertBefore(icon.node, icon.node.parentNode.firstChild)
        }
      }

      icon.node.style.cursor = mxConstants.CURSOR_CONNECT

      // Events transparency
      const getState = mxUtils.bind(this, function () {
        return (this.currentState != null) ? this.currentState : state
      })

      // Updates the local icon before firing the mouse down event.
      const mouseDown = mxUtils.bind(this, function (evt) {
        if (!mxEvent.isConsumed(evt)) {
          this.icon = icon
          this.graph.fireMouseEvent(mxEvent.MOUSE_DOWN,
            new mxMouseEvent(evt, getState()))
        }
      })

      mxEvent.redirectMouseEvents(icon.node, this.graph, getState, mouseDown)

      icons.push(icon)
      this.redrawIcons(icons, this.iconState)

      return icons
    }

    return null
  }

  /**
   * Function: isOutlineConnectEvent
   *
   * Returns true if <outlineConnect> is true and the source of the event is the
   * outline shape or shift is pressed.
   */
  mxConnectionHandler.prototype.isOutlineConnectEvent = function (me) {
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
   * Function: mouseMove
   *
   * Handles the event by updating the preview edge or by highlighting
   * a possible source or target terminal.
   */
  mxConnectionHandler.prototype.mouseMove = function (sender, me) {
    if (!me.isConsumed() && (this.ignoreMouseDown || this.first != null || !this.graph.isMouseDown)) {
      // Handles special case when handler is disabled during highlight
      if (!this.isEnabled() && this.currentState != null) {
        this.destroyIcons()
        this.currentState = null
      }

      const view = this.graph.getView()
      const scale = view.scale
      const tr = view.translate
      let point = new mxPoint(me.getGraphX(), me.getGraphY())
      this.error = null

      if (this.graph.isGridEnabledEvent(me.getEvent())) {
        point = new mxPoint((this.graph.snap(point.x / scale - tr.x) + tr.x) * scale,
          (this.graph.snap(point.y / scale - tr.y) + tr.y) * scale)
      }

      this.snapToPreview(me, point)
      this.currentPoint = point

      if ((this.first != null || (this.isEnabled() && this.graph.isEnabled())) &&
        (this.shape != null || this.first == null ||
          Math.abs(me.getGraphX() - this.first.x) > this.graph.tolerance ||
          Math.abs(me.getGraphY() - this.first.y) > this.graph.tolerance)) {
        this.updateCurrentState(me, point)
      }

      if (this.first != null) {
        let constraint = null
        let current = point

        // Uses the current point from the constraint handler if available
        if (this.constraintHandler.currentConstraint != null &&
          this.constraintHandler.currentFocus != null &&
          this.constraintHandler.currentPoint != null) {
          constraint = this.constraintHandler.currentConstraint
          current = this.constraintHandler.currentPoint.clone()
        } else if (this.previous != null && mxEvent.isShiftDown(me.getEvent()) &&
          !this.graph.isIgnoreTerminalEvent(me.getEvent())) {
          let pt = new mxPoint(this.previous.getCenterX(), this.previous.getCenterY())

          if (this.sourceConstraint != null) {
            pt = this.first
          }

          if (Math.abs(pt.x - point.x) <
            Math.abs(pt.y - point.y)) {
            point.x = pt.x
          } else {
            point.y = pt.y
          }
        }

        let pt2 = this.first

        // Moves the connect icon with the mouse
        if (this.selectedIcon != null) {
          const w = this.selectedIcon.bounds.width
          const h = this.selectedIcon.bounds.height

          if (this.currentState != null && this.targetConnectImage) {
            const pos = this.getIconPosition(this.selectedIcon, this.currentState)
            this.selectedIcon.bounds.x = pos.x
            this.selectedIcon.bounds.y = pos.y
          } else {
            const bounds = new mxRectangle(me.getGraphX() + this.connectIconOffset.x,
              me.getGraphY() + this.connectIconOffset.y, w, h)
            this.selectedIcon.bounds = bounds
          }

          this.selectedIcon.redraw()
        }

        // Uses edge state to compute the terminal points
        if (this.edgeState != null) {
          this.updateEdgeState(current, constraint)
          current = this.edgeState.absolutePoints[this.edgeState.absolutePoints.length - 1]
          pt2 = this.edgeState.absolutePoints[0]
        } else {
          if (this.currentState != null) {
            if (this.constraintHandler.currentConstraint == null) {
              const tmp = this.getTargetPerimeterPoint(this.currentState, me)

              if (tmp != null) {
                current = tmp
              }
            }
          }

          // Computes the source perimeter point
          if (this.sourceConstraint == null && this.previous != null) {
            const next = (this.waypoints != null && this.waypoints.length > 0)
              ? this.waypoints[0]
              : current
            const tmp = this.getSourcePerimeterPoint(this.previous, next, me)

            if (tmp != null) {
              pt2 = tmp
            }
          }
        }

        // Makes sure the cell under the mousepointer can be detected
        // by moving the preview shape away from the mouse. This
        // makes sure the preview shape does not prevent the detection
        // of the cell under the mousepointer even for slow gestures.
        if (this.currentState == null && this.movePreviewAway) {
          let tmp = pt2

          if (this.edgeState != null && this.edgeState.absolutePoints.length >= 2) {
            const tmp2 = this.edgeState.absolutePoints[this.edgeState.absolutePoints.length - 2]

            if (tmp2 != null) {
              tmp = tmp2
            }
          }

          const dx = current.x - tmp.x
          const dy = current.y - tmp.y

          const len = Math.sqrt(dx * dx + dy * dy)

          if (len === 0) {
            return
          }

          // Stores old point to reuse when creating edge
          this.originalPoint = current.clone()
          current.x -= dx * 4 / len
          current.y -= dy * 4 / len
        } else {
          this.originalPoint = null
        }

        // Creates the preview shape (lazy)
        if (this.shape == null) {
          const dx = Math.abs(me.getGraphX() - this.first.x)
          const dy = Math.abs(me.getGraphY() - this.first.y)

          if (dx > this.graph.tolerance || dy > this.graph.tolerance) {
            this.shape = this.createShape()

            if (this.edgeState != null) {
              this.shape.apply(this.edgeState)
            }

            // Revalidates current connection
            this.updateCurrentState(me, point)
          }
        }

        // Updates the points in the preview edge
        if (this.shape != null) {
          if (this.edgeState != null) {
            this.shape.points = this.edgeState.absolutePoints
          } else {
            let pts = [pt2]

            if (this.waypoints != null) {
              pts = pts.concat(this.waypoints)
            }

            pts.push(current)
            this.shape.points = pts
          }

          this.drawPreview()
        }

        // Makes sure endpoint of edge is visible during connect
        if (this.cursor != null) {
          this.graph.container.style.cursor = this.cursor
        }

        mxEvent.consume(me.getEvent())
        me.consume()
      } else if (!this.isEnabled() || !this.graph.isEnabled()) {
        this.constraintHandler.reset()
      } else if (this.previous !== this.currentState && this.edgeState == null) {
        this.destroyIcons()

        // Sets the cursor on the current shape
        if (this.currentState != null && this.error == null && this.constraintHandler.currentConstraint == null) {
          this.icons = this.createIcons(this.currentState)

          if (this.icons == null) {
            this.currentState.setCursor(mxConstants.CURSOR_CONNECT)
            me.consume()
          }
        }

        this.previous = this.currentState
      } else if (this.previous === this.currentState && this.currentState != null && this.icons == null &&
        !this.graph.isMouseDown) {
        // Makes sure that no cursors are changed
        me.consume()
      }

      if (!this.graph.isMouseDown && this.currentState != null && this.icons != null) {
        let hitsIcon = false
        const target = me.getSource()

        for (let i = 0; i < this.icons.length && !hitsIcon; i++) {
          hitsIcon = target === this.icons[i].node || target.parentNode === this.icons[i].node
        }

        if (!hitsIcon) {
          this.updateIcons(this.currentState, this.icons, me)
        }
      }
    } else {
      this.constraintHandler.reset()
    }
  }

  /**
   * Function: drawPreview
   *
   * Redraws the preview edge using the color and width returned by
   * <getEdgeColor> and <getEdgeWidth>.
   */
  mxConnectionHandler.prototype.drawPreview = function () {
    this.updatePreview(this.error == null)

    if (this.edgeState != null) {
      this.edgeState.shape = this.shape
      this.graph.cellRenderer.postConfigureShape(this.edgeState)
      this.edgeState.shape = null
    }

    this.shape.redraw()
  }

  /**
   * Function: connect
   *
   * Connects the given source and target using a new edge. This
   * implementation uses <createEdge> to create the edge.
   *
   * Parameters:
   *
   * source - <mxCell> that represents the source terminal.
   * target - <mxCell> that represents the target terminal.
   * evt - Mousedown event of the connect gesture.
   * dropTarget - <mxCell> that represents the cell under the mouse when it was
   * released.
   */
  mxConnectionHandler.prototype.connect = function (source, target, evt, dropTarget) {
    if (target != null || this.isCreateTarget(evt) || this.graph.allowDanglingEdges) {
      // Uses the common parent of source and target or
      // the default parent to insert the edge
      const model = this.graph.getModel()
      let terminalInserted = false
      let edge = null

      model.beginUpdate()
      try {
        if (source != null && target == null && !this.graph.isIgnoreTerminalEvent(evt) && this.isCreateTarget(evt)) {
          target = this.createTargetVertex(evt, source)

          if (target != null) {
            dropTarget = this.graph.getDropTarget([target], evt, dropTarget)
            terminalInserted = true

            // Disables edges as drop targets if the target cell was created
            // FIXME: Should not shift if vertex was aligned (same in Java)
            if (dropTarget == null || !this.graph.getModel().isEdge(dropTarget)) {
              const pstate = this.graph.getView().getState(dropTarget)

              if (pstate != null) {
                const tmp = model.getGeometry(target)
                tmp.x -= pstate.origin.x
                tmp.y -= pstate.origin.y
              }
            } else {
              dropTarget = this.graph.getDefaultParent()
            }

            this.graph.addCell(target, dropTarget)
          }
        }

        let parent = this.graph.getDefaultParent()
        const refSource = this.graph.getReferenceTerminal(source)
        const refTarget = this.graph.getReferenceTerminal(target)
        let refParent = parent

        if (refSource != null && refTarget != null) {
          refParent = model.getNearestCommonAncestor(refSource, refTarget)
        } else if (refSource != null) {
          refParent = model.getParent(refSource)
        }

        if (refParent != null && !model.isEdge(refParent) &&
          refParent !== model.getRoot()) {
          parent = refParent
        }

        // Uses the value of the preview edge state for inserting
        // the new edge into the graph
        let value = null
        let style = null

        if (this.edgeState != null) {
          value = this.edgeState.cell.value
          style = this.edgeState.cell.style
        }

        edge = this.insertEdge(parent, null, value, source, target, style)

        if (edge != null) {
          // Updates the connection constraints
          this.graph.setConnectionConstraint(edge, source, true, this.sourceConstraint)
          this.graph.setConnectionConstraint(edge, target, false, this.constraintHandler.currentConstraint)

          // Uses geometry of the preview edge state
          if (this.edgeState != null) {
            model.setGeometry(edge, this.edgeState.cell.geometry)
          }

          // Inserts non-overlapping edge before source
          if (this.isInsertBefore(edge, source, target, evt, dropTarget) &&
            (this.constraintHandler.currentConstraint == null ||
              this.constraintHandler.currentConstraint.perimeter)) {
            let tmp = source

            while (tmp.parent != null && tmp.geometry != null &&
            tmp.geometry.relative && tmp.parent !== edge.parent) {
              tmp = this.graph.model.getParent(tmp)
            }

            if (tmp != null && tmp.parent != null && tmp.parent === edge.parent) {
              model.add(parent, edge, tmp.parent.getIndex(tmp))
            }
          }

          // Makes sure the edge has a non-null, relative geometry
          let geo = model.getGeometry(edge)

          if (geo == null) {
            geo = new mxGeometry()
            geo.relative = true

            model.setGeometry(edge, geo)
          }

          // Uses scaled waypoints in geometry
          if (this.waypoints != null && this.waypoints.length > 0) {
            const s = this.graph.view.scale
            const tr = this.graph.view.translate
            geo.points = []

            for (let i = 0; i < this.waypoints.length; i++) {
              const pt = this.waypoints[i]
              geo.points.push(new mxPoint(pt.x / s - tr.x, pt.y / s - tr.y))
            }
          }

          if (target == null) {
            const t = this.graph.view.translate
            const s = this.graph.view.scale
            const pt = (this.originalPoint != null)
              ? new mxPoint(this.originalPoint.x / s - t.x, this.originalPoint.y / s - t.y)
              : new mxPoint(this.currentPoint.x / s - t.x, this.currentPoint.y / s - t.y)
            pt.x -= this.graph.panDx / this.graph.view.scale
            pt.y -= this.graph.panDy / this.graph.view.scale

            const pstate = this.graph.getView().getState(model.getParent(edge))

            if (pstate != null) {
              pt.x -= pstate.origin.x
              pt.y -= pstate.origin.y
            }

            geo.setTerminalPoint(pt, false)
          }

          this.fireEvent(new mxEventObject(mxEvent.CONNECT, 'cell', edge, 'terminal', target,
            'event', evt, 'target', dropTarget, 'terminalInserted', terminalInserted))
        }
      } catch (e) {
        mxLog.show()
        mxLog.debug(e.message)
      } finally {
        model.endUpdate()
      }

      if (this.select) {
        this.selectCells(edge, (terminalInserted) ? target : null)
      }
    }
  }
  mxOutput.mxConnectionHandler = mxConnectionHandler
}
