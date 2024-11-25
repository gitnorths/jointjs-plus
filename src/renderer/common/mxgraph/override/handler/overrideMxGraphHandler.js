export function overrideMxGraphHandler (mxOutput) {
  const {
    mxGraphHandler,
    mxEvent,
    mxDictionary,
    mxConstants,
    mxClient,
    mxRectangleShape,
    mxUtils,
    mxGuide,
    mxCellHighlight,
    mxPoint
  } = mxOutput
  /**
   * Function: getInitialCellForEvent
   *
   * Hook to return initial cell for the given event. This returns
   * the topmost cell that is not a swimlane or is selected.
   */
  mxGraphHandler.prototype.getInitialCellForEvent = function (me) {
    let state = me.getState()

    if ((!this.graph.isToggleEvent(me.getEvent()) || !mxEvent.isAltDown(me.getEvent())) &&
      state != null && !this.graph.isCellSelected(state.cell)) {
      const model = this.graph.model
      let next = this.graph.view.getState(model.getParent(state.cell))

      while (next != null && !this.graph.isCellSelected(next.cell) &&
      (model.isVertex(next.cell) || model.isEdge(next.cell)) &&
      this.isPropagateSelectionCell(state.cell, true, me) &&
      next.cell !== this.graph.getCurrentRoot()) {
        state = next
        next = this.graph.view.getState(this.graph.getModel().getParent(state.cell))
      }
    }

    return (state != null) ? state.cell : null
  }

  /**
   * Function: isDelayedSelection
   *
   * Returns true if the cell or one of its ancestors is selected.
   */
  mxGraphHandler.prototype.isDelayedSelection = function (cell, me) {
    if (!this.graph.isToggleEvent(me.getEvent()) || !mxEvent.isAltDown(me.getEvent())) {
      while (cell != null) {
        if (this.graph.selectionCellsHandler.isHandled(cell)) {
          return this.graph.cellEditor.getEditingCell() !== cell
        }

        cell = this.graph.model.getParent(cell)
      }
    }

    return this.graph.isToggleEvent(me.getEvent())
  }

  /**
   * Function: selectCellForEvent
   *
   * Selects the given cell for the given <mxMouseEvent>.
   */
  mxGraphHandler.prototype.selectCellForEvent = function (cell, me) {
    const state = this.graph.view.getState(cell)

    if (state != null) {
      if (me.isSource(state.control)) {
        this.graph.selectCellForEvent(cell, me.getEvent())
      } else {
        if (!this.graph.isToggleEvent(me.getEvent()) ||
          !mxEvent.isAltDown(me.getEvent())) {
          const model = this.graph.getModel()
          let parent = model.getParent(cell)

          while (this.graph.view.getState(parent) != null &&
          (model.isVertex(parent) || (model.isEdge(parent) &&
            !this.graph.isToggleEvent(me.getEvent()))) &&
          this.isPropagateSelectionCell(cell, false, me) &&
          parent !== this.graph.getCurrentRoot()) {
            cell = parent
            parent = model.getParent(cell)
          }
        }

        this.graph.selectCellForEvent(cell, me.getEvent())
      }
    }

    return cell
  }
  /**
   * Function: mouseDown
   *
   * Handles the event by selecing the given cell and creating a handle for
   * it. By consuming the event all subsequent events of the gesture are
   * redirected to this handler.
   */
  mxGraphHandler.prototype.mouseDown = function (sender, me) {
    this.mouseDownX = me.getX()
    this.mouseDownY = me.getY()
    const evt = me.getEvent()

    const forceMove = mxEvent.isAltDown(evt) && mxEvent.isShiftDown(evt) &&
      !this.graph.isSelectionEmpty()

    if (!me.isConsumed() && this.isEnabled() && this.graph.isEnabled() &&
      (me.getState() != null || forceMove) && !mxEvent.isMultiTouchEvent(evt)) {
      let cell = this.getInitialCellForEvent(me)
      this.delayedSelection = this.isDelayedSelection(cell, me)
      this.cell = null

      if (cell == null && forceMove) {
        cell = this.graph.getSelectionCell()
      }

      const selectionCount = this.graph.getSelectionCount()

      if (this.isSelectEnabled() && !this.delayedSelection) {
        this.graph.selectCellForEvent(cell, evt)
      }

      if (mxEvent.isTouchEvent(me.getEvent()) && this.graph.isCellSelected(cell) &&
        selectionCount > 0) {
        this.blockDelayedSelection = true
        this.delayedSelection = true
      }

      if (this.isMoveEnabled()) {
        if (this.delayedSelection) {
          this.cell = cell
        } else {
          this.start(cell, me.getX(), me.getY())
        }

        this.cellWasClicked = true

        if (!this.graph.isCellLocked(cell)) {
          this.consumeMouseEvent(mxEvent.MOUSE_DOWN, me)
        }
      }
    }
  }

  /**
   * Function: getCells
   *
   * Returns the cells to be modified by this handler. This implementation
   * returns all selection cells that are movable, or the given initial cell if
   * the given cell is not selected and movable. This handles the case of moving
   * unselectable or unselected cells.
   *
   * Parameters:
   *
   * initialCell - <mxCell> that triggered this handler.
   */
  mxGraphHandler.prototype.getCells = function (initialCell, cells) {
    if (cells == null && !this.delayedSelection &&
      this.graph.isCellMovable(initialCell)) {
      return [this.graph.getCompositeParent(initialCell)]
    } else {
      cells = (cells != null) ? cells : this.graph.getSelectionCells()
      const dict = new mxDictionary()

      // Gets composite parents
      const comp = []

      for (let i = 0; i < cells.length; i++) {
        const cell = this.graph.getCompositeParent(cells[i])

        if (dict.get(cell) == null) {
          dict.put(cell, true)
          comp.push(cell)
        }
      }

      // Removes descendants
      const result = []

      for (let i = 0; i < comp.length; i++) {
        let temp = this.graph.model.getParent(comp[i])

        while (dict.get(temp) == null && temp != null) {
          temp = this.graph.model.getParent(temp)
        }

        if (temp == null) {
          result.push(comp[i])
        }
      }

      return this.graph.getMovableCells(result)
    }
  }

  /**
   * Function: createPreviewShape
   *
   * Creates the shape used to draw the preview for the given bounds.
   */
  mxGraphHandler.prototype.createPreviewShape = function (bounds) {
    const shape = new mxRectangleShape(bounds, null, this.previewColor)
    shape.isDashed = true

    if (this.htmlPreview) {
      shape.dialect = mxConstants.DIALECT_STRICTHTML
      shape.init(this.graph.container)
    } else {
      // Makes sure to use either SVG shapes in order to implement
      // event-transparency on the background area of the rectangle since
      // HTML shapes do not let mouseevents through even when transparent
      shape.dialect = mxConstants.DIALECT_SVG
      shape.init(this.graph.getView().getOverlayPane())
      shape.pointerEvents = false

      // Workaround for artifacts on iOS
      if (mxClient.IS_IOS) {
        shape.getSvgScreenOffset = function () {
          return 0
        }
      }
    }

    return shape
  }

  /**
   * Function: start
   *
   * Starts the handling of the mouse gesture.
   */
  mxGraphHandler.prototype.start = function (cell, x, y, cells) {
    const model = this.graph.model
    const geo = model.getGeometry(cell)

    if (this.first == null && (this.graph.isCellMovable(cell) && ((!model.isEdge(cell) ||
        this.graph.getSelectionCount() > 1 || (geo.points != null && geo.points.length > 0) ||
        model.getTerminal(cell, true) == null || model.getTerminal(cell, false) == null) ||
      this.graph.allowDanglingEdges))) {
      this.cell = cell
      this.first = mxUtils.convertPoint(this.graph.container, x, y)
      this.cells = (cells != null) ? cells : this.getCells(this.cell)
      this.bounds = this.graph.getView().getBounds(this.cells)
      this.pBounds = this.getPreviewBounds(this.cells)
      this.allCells = new mxDictionary()
      this.cloning = false
      this.cellCount = 0

      for (let i = 0; i < this.cells.length; i++) {
        this.cellCount += this.addStates(this.cells[i], this.allCells)
      }

      if (this.guidesEnabled) {
        this.guide = new mxGuide(this.graph, this.getGuideStates())
        const parent = this.graph.model.getParent(cell)
        const ignore = this.graph.model.getChildCount(parent) < 2

        // Uses connected states as guides
        const connected = new mxDictionary()
        const opps = this.graph.getOpposites(this.graph.getEdges(this.cell), this.cell)

        for (let i = 0; i < opps.length; i++) {
          const state = this.graph.view.getState(opps[i])

          if (state != null && !connected.get(state)) {
            connected.put(state, true)
          }
        }

        this.guide.isStateIgnored = mxUtils.bind(this, function (state) {
          const p = this.graph.model.getParent(state.cell)

          return state.cell != null && ((!this.cloning &&
              this.isCellMoving(state.cell)) ||
            (state.cell !== (this.target || parent) && !ignore &&
              !connected.get(state) &&
              (this.target == null || this.graph.model.getChildCount(
                this.target) >= 2) && p !== (this.target || parent)))
        })
      }
    }
  }
  /**
   * Function: useGuidesForEvent
   *
   * Returns true if the guides should be used for the given <mxMouseEvent>.
   * This implementation returns <mxGuide.isEnabledForEvent>.
   */
  mxGraphHandler.prototype.useGuidesForEvent = function (me) {
    return (this.guide != null)
      ? this.guide.isEnabledForEvent(me.getEvent()) &&
      !this.isConstrainedEvent(me)
      : true
  }

  /**
   * Function: isValidDropTarget
   *
   * Returns true if the given cell is a valid drop target.
   */
  mxGraphHandler.prototype.isValidDropTarget = function (target, me) {
    for (let i = 0; i < this.cells.length; i++) {
      if (this.graph.model.getParent(this.cells[i]) !== target) {
        return true
      }
    }

    return false
  }

  /**
   * Function: mouseMove
   *
   * Handles the event by highlighting possible drop targets and updating the
   * preview.
   */
  mxGraphHandler.prototype.mouseMove = function (sender, me) {
    const graph = this.graph
    const tol = graph.tolerance

    // Adds cell to selection and start moving cells
    if (this.first == null && this.delayedSelection && this.cell != null &&
      this.mouseDownX != null && this.mouseDownY != null &&
      (Math.abs(this.mouseDownX - me.getX()) > tol ||
        Math.abs(this.mouseDownY - me.getY()) > tol)) {
      this.delayedSelection = false
      this.cellWasClicked = true

      if (!this.graph.isCellSelected(this.cell) &&
        !mxEvent.isAltDown(me.getEvent())) {
        if (this.graph.isToggleEvent(me.getEvent())) {
          graph.addSelectionCell(this.cell)
        } else if (!this.graph.isAncestorSelected(this.cell)) {
          graph.setSelectionCell(this.cell)
        }
      }

      let cells = graph.getSelectionCells()

      if (!this.graph.isToggleEvent(me.getEvent()) ||
        !mxEvent.isAltDown(me.getEvent()) ||
        graph.isSelectionEmpty()) {
        cells = cells.concat(this.cell)
      }

      this.start(this.cell, this.mouseDownX, this.mouseDownY,
        this.getCells(null, cells))
    }

    let delta = (this.first != null) ? this.getDelta(me) : null

    if (!me.isConsumed() && graph.isMouseDown && this.cell != null &&
      delta != null && this.bounds != null && !this.suspended) {
      // Stops moving if a multi touch event is received
      if (mxEvent.isMultiTouchEvent(me.getEvent())) {
        this.reset()
        return
      }

      if (this.shape != null || this.livePreviewActive || this.cloning ||
        Math.abs(delta.x) > tol || Math.abs(delta.y) > tol) {
        // Highlight is used for highlighting drop targets
        if (this.highlight == null) {
          this.highlight = new mxCellHighlight(this.graph,
            mxConstants.DROP_TARGET_COLOR, 3)
        }

        const clone = graph.isCloneEvent(me.getEvent()) &&
          graph.isCellsCloneable() &&
          this.isCloneEnabled()
        const gridEnabled = graph.isGridEnabledEvent(me.getEvent())
        let cell = me.getCell()
        cell = (cell != null && mxUtils.indexOf(this.cells, cell) < 0)
          ? cell
          : graph.getCellAt(me.getGraphX(), me.getGraphY(), null, null, null,
            mxUtils.bind(this, function (state, x, y) {
              return mxUtils.indexOf(this.cells, state.cell) >= 0
            }))

        let hideGuide = true
        let target = null
        this.cloning = clone

        if (graph.isDropEnabled() && this.highlightEnabled) {
          // Contains a call to getCellAt to find the cell under the mouse
          target = graph.getDropTarget(this.cells, me.getEvent(), cell, clone)
        }

        let state = graph.getView().getState(target)
        let highlight = false

        if (state != null && (clone || this.isValidDropTarget(target, me))) {
          if (this.target !== target) {
            this.target = target
            this.setHighlightColor(mxConstants.DROP_TARGET_COLOR)
          }

          highlight = true
        } else {
          this.target = null

          if (this.connectOnDrop && cell != null && this.cells.length === 1 &&
            graph.getModel().isVertex(cell) && graph.isCellConnectable(cell)) {
            state = graph.getView().getState(cell)

            if (state != null) {
              const error = graph.getEdgeValidationError(null, this.cell, cell)
              const color = (error == null)
                ? mxConstants.VALID_COLOR
                : mxConstants.INVALID_CONNECT_TARGET_COLOR
              this.setHighlightColor(color)
              highlight = true
            }
          }
        }

        if (state != null && highlight) {
          this.highlight.highlight(state)
        } else {
          this.highlight.hide()
        }

        if (this.guide != null && this.useGuidesForEvent(me)) {
          delta = this.guide.move(this.bounds, delta, gridEnabled, clone)
          hideGuide = false
        } else {
          delta = graph.snapDelta(delta, this.bounds, !gridEnabled, false, false)
        }

        if (this.guide != null && hideGuide) {
          this.guide.hide()
        }

        // Constrained movement if shift key is pressed
        if (this.isConstrainedEvent(me)) {
          if (Math.abs(delta.x) > Math.abs(delta.y)) {
            delta.y = 0
          } else {
            delta.x = 0
          }
        }

        this.checkPreview()

        if (this.currentDx !== delta.x || this.currentDy !== delta.y) {
          this.currentDx = delta.x
          this.currentDy = delta.y
          this.updatePreview()
        }
      }

      this.updateHint(me)
      this.consumeMouseEvent(mxEvent.MOUSE_MOVE, me)

      // Cancels the bubbling of events to the container so
      // that the droptarget is not reset due to an mouseMove
      // fired on the container with no associated state.
      mxEvent.consume(me.getEvent())
    } else if ((this.isMoveEnabled() || this.isCloneEnabled()) && this.updateCursor && !me.isConsumed() &&
      (me.getState() != null || me.sourceState != null) && !graph.isMouseDown) {
      let cursor = graph.getCursorForMouseEvent(me)

      if (cursor == null && graph.isEnabled() && graph.isCellMovable(me.getCell())) {
        if (graph.getModel().isEdge(me.getCell())) {
          cursor = mxConstants.CURSOR_MOVABLE_EDGE
        } else {
          cursor = mxConstants.CURSOR_MOVABLE_VERTEX
        }
      }

      // Sets the cursor on the original source state under the mouse
      // instead of the event source state which can be the parent
      if (cursor != null && me.sourceState != null) {
        me.sourceState.setCursor(cursor)
      }
    }
  }

  /**
   * Function: isConstrainedEvent
   *
   * Returns true if the given event is constrained.
   */
  mxGraphHandler.prototype.isConstrainedEvent = function (me) {
    return (this.target == null || this.graph.isCloneEvent(me.getEvent())) &&
      this.graph.isConstrainedEvent(me.getEvent())
  }

  /**
   * Function: updateLivePreview
   *
   * Updates the bounds of the preview shape.
   */
  mxGraphHandler.prototype.updateLivePreview = function (dx, dy) {
    if (!this.suspended) {
      const states = []

      if (this.allCells != null) {
        this.allCells.visit(mxUtils.bind(this, function (key, state) {
          const realState = this.graph.view.getState(state.cell)

          // Checks if cell was removed or replaced
          if (realState !== state) {
            state.destroy()

            if (realState != null) {
              this.allCells.put(state.cell, realState)
            } else {
              this.allCells.remove(state.cell)
            }

            state = realState
          }

          if (state != null) {
            // Saves current state
            const tempState = state.clone()
            states.push([state, tempState])

            // Makes transparent for events to detect drop targets
            if (state.shape != null) {
              if (state.shape.originalPointerEvents == null) {
                state.shape.originalPointerEvents = state.shape.pointerEvents
              }

              state.shape.pointerEvents = false

              if (state.text != null) {
                if (state.text.originalPointerEvents == null) {
                  state.text.originalPointerEvents = state.text.pointerEvents
                }

                state.text.pointerEvents = false
              }
            }

            // Temporarily changes position
            if (this.graph.model.isVertex(state.cell)) {
              if (!this.cloning || this.graph.isCellCloneable(state.cell)) {
                state.x += dx
                state.y += dy
              }

              // Draws the live preview
              if (!this.cloning) {
                state.view.graph.cellRenderer.redraw(state, true)

                // Forces redraw of connected edges after all states
                // have been updated but avoids update of state
                state.view.invalidate(state.cell)
                state.invalid = false

                // Hides folding icon
                if (state.control != null && state.control.node != null) {
                  state.control.node.style.visibility = 'hidden'
                }
              } else if (state.text != null) {
                // Clone live preview may use text bounds
                state.text.updateBoundingBox()

                // Fixes preview box for edge labels
                if (state.text.boundingBox != null) {
                  state.text.boundingBox.x += dx
                  state.text.boundingBox.y += dy
                }

                if (state.text.unrotatedBoundingBox != null) {
                  state.text.unrotatedBoundingBox.x += dx
                  state.text.unrotatedBoundingBox.y += dy
                }
              }
            }
          }
        }))
      }

      // Resets the handler if everything was removed
      if (states.length === 0) {
        this.reset()
      } else {
        // Redraws connected edges
        const s = this.graph.view.scale

        for (let i = 0; i < states.length; i++) {
          const state = states[i][0]

          if (this.graph.model.isEdge(state.cell) && (!this.cloning ||
            this.graph.isCellCloneable(state.cell))) {
            const geometry = this.graph.getCellGeometry(state.cell)
            const points = []

            if (geometry != null && geometry.points != null) {
              for (let j = 0; j < geometry.points.length; j++) {
                if (geometry.points[j] != null) {
                  points.push(new mxPoint(
                    geometry.points[j].x + dx / s,
                    geometry.points[j].y + dy / s))
                }
              }
            }

            let source = state.visibleSourceState
            let target = state.visibleTargetState
            const pts = states[i][1].absolutePoints

            if (source == null || !this.isCellMoving(source.cell)) {
              const pt0 = pts[0]
              state.setAbsoluteTerminalPoint(new mxPoint(pt0.x + dx, pt0.y + dy), true)
              source = null
            } else {
              state.view.updateFixedTerminalPoint(state, source, true,
                this.graph.getConnectionConstraint(state, source, true))
            }

            if (target == null || !this.isCellMoving(target.cell)) {
              const ptn = pts[pts.length - 1]
              state.setAbsoluteTerminalPoint(new mxPoint(ptn.x + dx, ptn.y + dy), false)
              target = null
            } else {
              state.view.updateFixedTerminalPoint(state, target, false,
                this.graph.getConnectionConstraint(state, target, false))
            }

            state.view.updatePoints(state, points, source, target)
            state.view.updateFloatingTerminalPoints(state, source, target)
            state.view.updateEdgeLabelOffset(state)
            state.invalid = false

            // Draws the live preview but avoids update of state
            if (!this.cloning) {
              state.view.graph.cellRenderer.redraw(state, true)
            }
          }
        }

        this.graph.view.validate()
        this.redrawHandles(states)
        this.resetPreviewStates(states)
      }
    }
  }

  /**
   * Function: mouseUp
   *
   * Handles the event by applying the changes to the selection cells.
   */
  mxGraphHandler.prototype.mouseUp = function (sender, me) {
    if (!me.isConsumed()) {
      if (this.livePreviewUsed) {
        this.resetLivePreview()
      }

      if (this.cell != null && this.first != null &&
        this.currentDx != null && this.currentDy != null &&
        (this.shape != null || this.livePreviewUsed || this.cloning)) {
        const graph = this.graph
        const cell = me.getCell()

        if (this.connectOnDrop && this.target == null && cell != null && graph.getModel().isVertex(cell) &&
          graph.isCellConnectable(cell) && graph.isEdgeValid(null, this.cell, cell)) {
          graph.connectionHandler.connect(this.cell, cell, me.getEvent())
        } else {
          const scale = graph.getView().scale
          const dx = this.roundLength(this.currentDx / scale)
          const dy = this.roundLength(this.currentDy / scale)
          const target = this.target

          if (graph.isSplitEnabled() && graph.isSplitTarget(target, this.cells, me.getEvent())) {
            graph.splitEdge(target, this.cells, null, dx, dy,
              me.getGraphX(), me.getGraphY())
          } else {
            this.moveCells(this.cells, dx, dy, this.cloning, this.target, me.getEvent())
          }
        }
      } else if (this.isSelectEnabled() && this.delayedSelection &&
        !this.blockDelayedSelection && this.cell != null) {
        this.selectDelayed(me)
      }
    }

    // Consumes the event if a cell was initially clicked
    if (this.cellWasClicked) {
      this.consumeMouseEvent(mxEvent.MOUSE_UP, me)
    }

    this.reset()
  }

  /**
   * Function: reset
   *
   * Resets the state of this handler.
   */
  mxGraphHandler.prototype.reset = function () {
    if (this.livePreviewUsed) {
      this.resetLivePreview()
      this.setHandlesVisibleForCells(
        this.graph.selectionCellsHandler.getHandledSelectionCells(), true)
    }

    this.destroyShapes()
    this.removeHint()

    this.blockDelayedSelection = false
    this.delayedSelection = false
    this.livePreviewActive = null
    this.livePreviewUsed = null
    this.cellWasClicked = false
    this.suspended = null
    this.currentDx = null
    this.currentDy = null
    this.cellCount = null
    this.cloning = false
    this.allCells = null
    this.pBounds = null
    this.guides = null
    this.target = null
    this.first = null
    this.cells = null
    this.cell = null
  }

  /**
   * Function: moveCells
   *
   * Moves the given cells by the specified amount.
   */
  mxGraphHandler.prototype.moveCells = function (cells, dx, dy, clone, target, evt) {
    if (clone) {
      cells = this.graph.getCloneableCells(cells)
    }

    // Removes cells from parent
    let parent = this.graph.getModel().getParent(this.cell)

    // Handles transparent group being dragged via child cells
    if (!this.graph.isCellSelected(this.cell) && this.graph.isCellSelected(parent)) {
      parent = this.graph.getModel().getParent(parent)
    }

    if (target == null && evt != null && this.isRemoveCellsFromParent() &&
      this.shouldRemoveCellsFromParent(parent, cells, evt)) {
      target = this.graph.getDefaultParent()
    }

    // Cloning into locked cells is not allowed
    clone = clone && !this.graph.isCellLocked(target || this.graph.getDefaultParent())

    this.graph.getModel().beginUpdate()
    try {
      const parents = []

      // Removes parent if all child cells are removed
      if (!clone && target != null && this.removeEmptyParents) {
        // Collects all non-selected parents
        const dict = new mxDictionary()

        for (let i = 0; i < cells.length; i++) {
          dict.put(cells[i], true)
        }

        // LATER: Recurse up the cell hierarchy
        for (let i = 0; i < cells.length; i++) {
          const par = this.graph.model.getParent(cells[i])

          if (par != null && !dict.get(par)) {
            dict.put(par, true)
            parents.push(par)
          }
        }
      }

      // Passes all selected cells in order to correctly clone or move into
      // the target cell. The method checks for each cell if its movable.
      cells = this.graph.moveCells(cells, dx, dy, clone, target, evt)

      // Removes parent if all child cells are removed
      const temp = []

      for (let i = 0; i < parents.length; i++) {
        if (this.shouldRemoveParent(parents[i])) {
          temp.push(parents[i])
        }
      }

      this.graph.removeCells(temp, false)
    } finally {
      this.graph.getModel().endUpdate()
    }

    // Selects the new cells if cells have been cloned
    if (clone) {
      this.graph.setSelectionCells(cells)
    }

    if (this.isSelectEnabled() && this.scrollOnMove) {
      this.graph.scrollCellToVisible(cells[0])
    }
  }
  mxOutput.mxGraphHandler = mxGraphHandler
}
