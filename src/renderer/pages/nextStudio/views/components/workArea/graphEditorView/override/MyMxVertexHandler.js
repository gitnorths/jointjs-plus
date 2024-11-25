import {
  mxCellRenderer,
  mxCellState,
  mxConstants,
  mxEvent,
  mxGraphHandler,
  mxHandle,
  mxImageShape,
  mxLine,
  mxPoint,
  mxRectangle,
  mxRectangleShape,
  mxResources,
  mxStencilRegistry,
  mxUtils,
  mxVertexHandler
} from '@/renderer/common/mxgraph'
import { createHint, formatHintText } from './common'
import { MyMxGraph } from './MyMxGraph'
import { MyEditor } from './MyEditor'

export class MyMxVertexHandler extends mxVertexHandler {
  constructor (state) {
    super(state)
    /**
     * Moves rotation handle to top, right corner.
     */
    this.rotationHandleVSpacing = -12
    this.TABLE_HANDLE_COLOR = '#fca000'
    this.rotationEnabled = true // fixme
    this.manageSizers = true
    this.parentHighlightEnabled = true
    this.tolerance = 12 // Larger tolerance for real touch devices
    this.livePreview = true
    this.rowHandleImage = MyMxGraph.createSvgImage(14, 12,
      '<rect x="2" y="2" width="10" height="3" stroke-width="1" stroke="#ffffff" fill="' + '#29b6f2' + '"/>' +
      '<rect x="2" y="7" width="10" height="3" stroke-width="1" stroke="#ffffff" fill="' + '#29b6f2' + '"/>')
  }

  // +++++++++++++ 原型方法start ++++++++++++++
  /**
   * Forces preview for title size in tables, table rows, table cells and swimlanes.
   */
  isGhostPreview () {
    return super.isGhostPreview() && !this.graph.isTable(this.state.cell) &&
      !this.graph.isTableRow(this.state.cell) && !this.graph.isTableCell(this.state.cell) &&
      !this.graph.isSwimlane(this.state.cell)
  }

  /**
   * Creates the shape used to draw the selection border.
   */
  createParentHighlightShape (bounds) {
    const shape = super.createParentHighlightShape(bounds)

    shape.stroke = '#C0C0C0'
    shape.strokewidth = 1

    return shape
  }

  /**
   * Moves rotation handle to top, right corner.
   */
  getRotationHandlePosition () {
    const padding = this.getHandlePadding()

    return new mxPoint(this.bounds.x + this.bounds.width - this.rotationHandleVSpacing + padding.x / 2,
      this.bounds.y + this.rotationHandleVSpacing - padding.y / 2)
  }

  /**
   * Enables recursive resize for groups.
   */
  isRecursiveResize (state, me) {
    return this.graph.isRecursiveVertexResize(state) && !mxEvent.isAltDown(me.getEvent())
  }

  /**
   * Enables centered resize events.
   */
  isCenteredEvent (state, me) {
    return mxEvent.isControlDown(me.getEvent()) || mxEvent.isMetaDown(me.getEvent())
  }

  /**
   * Hides rotation handle for table cells and rows.
   */
  isRotationHandleVisible () {
    return super.isRotationHandleVisible() &&
      !this.graph.isTableCell(this.state.cell) &&
      !this.graph.isTableRow(this.state.cell) &&
      !this.graph.isTable(this.state.cell)
  }

  /**
   * Hides rotation handle for table cells and rows.
   */
  getSizerBounds () {
    if (this.graph.isTableCell(this.state.cell)) {
      return this.graph.view.getState(this.graph.model.getParent(this.graph.model.getParent(this.state.cell)))
    } else {
      return this.bounds
    }
  }

  /**
   * Hides rotation handle for table cells and rows.
   */
  isParentHighlightVisible () {
    return super.isParentHighlightVisible() &&
      !this.graph.isTableCell(this.state.cell) &&
      !this.graph.isTableRow(this.state.cell)
  }

  /**
   * Hides rotation handle for table cells and rows.
   */
  isCustomHandleVisible (handle) {
    return handle.tableHandle ||
      (super.isCustomHandleVisible(handle) &&
        (!this.graph.isTable(this.state.cell) ||
          this.graph.isCellSelected(this.state.cell)))
  }

  /**
   * Adds selection border inset for table cells and rows.
   */
  getSelectionBorderInset () {
    let result = 0

    if (this.graph.isTableRow(this.state.cell)) {
      result = 1
    } else if (this.graph.isTableCell(this.state.cell)) {
      result = 2
    }

    return result
  }

  /**
   * Adds custom handles for table cells.
   */
  getSelectionBorderBounds () {
    return super.getSelectionBorderBounds().grow(-this.getSelectionBorderInset())
  }

  /**
   * Adds custom handles for table cells.
   */
  createCustomHandles () {
    // Lazy lookup for shape constructor
    // if (TableLineShape == null) {
    const TableLineShape = mxCellRenderer.defaultShapes.tableLine
    // }
    let handles = super.createCustomHandles()

    if (this.graph.isTable(this.state.cell) && this.graph.isCellMovable(this.state.cell)) {
      const graph = this.graph
      const model = graph.model
      const s = graph.view.scale
      const tableState = this.state
      const sel = this.selectionBorder
      const x0 = this.state.origin.x + graph.view.translate.x
      const y0 = this.state.origin.y + graph.view.translate.y

      if (handles == null) {
        handles = []
      }

      function moveLine (line, dx, dy) {
        const result = []

        for (let i = 0; i < line.length; i++) {
          const pt = line[i]
          result.push((pt == null)
            ? null
            : new mxPoint(
              (x0 + pt.x + dx) * s, (y0 + pt.y + dy) * s))
        }

        return result
      }

      // Adds handles for rows and columns
      const rows = graph.view.getCellStates(model.getChildCells(this.state.cell, true))

      if (rows.length > 0) {
        const cols = model.getChildCells(rows[0].cell, true)
        const colLines = graph.getTableLines(this.state.cell, false, true)
        const rowLines = graph.getTableLines(this.state.cell, true, false)

        // Adds row height handles
        for (let i = 0; i < rows.length; i++) {
          (mxUtils.bind(this, function (index) {
            const rowState = rows[index]
            let handle = null

            if (graph.isCellMovable(rowState.cell)) {
              const nextRow = (index < rows.length - 1) ? rows[index + 1] : null
              const ngeo = (nextRow != null) ? graph.getCellGeometry(nextRow.cell) : null
              const ng = (ngeo != null && ngeo.alternateBounds != null) ? ngeo.alternateBounds : ngeo

              const shape = (rowLines[index] != null)
                ? new TableLineShape(rowLines[index], mxConstants.NONE, 1)
                : new mxLine(new mxRectangle(), mxConstants.NONE, 1, false)
              shape.isDashed = sel.isDashed
              shape.svgStrokeTolerance++

              handle = new mxHandle(rowState, 'row-resize', null, shape)
              handle.tableHandle = true
              let dy = 0

              handle.shape.node.parentNode.insertBefore(handle.shape.node,
                handle.shape.node.parentNode.firstChild)

              handle.redraw = function () {
                if (this.shape != null) {
                  this.shape.stroke = (dy === 0) ? mxConstants.NONE : sel.stroke

                  if (this.shape.constructor === TableLineShape) {
                    this.shape.line = moveLine(rowLines[index], 0, dy)
                    this.shape.updateBoundsFromLine()
                  } else {
                    const start = graph.getActualStartSize(tableState.cell, true)
                    this.shape.bounds.height = 1
                    this.shape.bounds.y = this.state.y + this.state.height + dy * s
                    this.shape.bounds.x = tableState.x + ((index === rows.length - 1)
                      ? 0
                      : start.x * s)
                    this.shape.bounds.width = tableState.width - ((index === rows.length - 1)
                      ? 0
                      : (start.width + start.x) + s)
                  }

                  this.shape.redraw()
                }
              }

              let shiftPressed = false

              handle.setPosition = function (bounds, pt, me) {
                dy = Math.max(MyMxGraph.minTableRowHeight - bounds.height,
                  pt.y - bounds.y - bounds.height)
                shiftPressed = mxEvent.isShiftDown(me.getEvent())

                if (ng != null && shiftPressed) {
                  dy = Math.min(dy, ng.height - MyMxGraph.minTableRowHeight)
                }
              }

              handle.execute = function (me) {
                if (dy !== 0) {
                  graph.setTableRowHeight(this.state.cell,
                    dy, !shiftPressed)
                } else if (!this.blockDelayedSelection) {
                  const temp = graph.getCellAt(me.getGraphX(),
                    me.getGraphY()) || tableState.cell
                  graph.graphHandler.selectCellForEvent(temp, me)
                }

                dy = 0
              }

              handle.reset = function () {
                dy = 0
              }
            }

            handles.push(handle)
          }))(i)
        }

        // Adds column width handles
        for (let i = 0; i < cols.length; i++) {
          (mxUtils.bind(this, function (index) {
            let colState = graph.view.getState(cols[index])
            const geo = graph.getCellGeometry(cols[index])
            const g = (geo.alternateBounds != null) ? geo.alternateBounds : geo

            if (colState == null) {
              colState = new mxCellState(graph.view, cols[index],
                graph.getCellStyle(cols[index]))
              colState.x = tableState.x + geo.x * s
              colState.y = tableState.y + geo.y * s
              colState.width = g.width * s
              colState.height = g.height * s
              colState.updateCachedBounds()
            }

            const nextCol = (index < cols.length - 1) ? cols[index + 1] : null
            const ngeo = (nextCol != null) ? graph.getCellGeometry(nextCol) : null
            const ng = (ngeo != null && ngeo.alternateBounds != null) ? ngeo.alternateBounds : ngeo

            const shape = (colLines[index] != null)
              ? new TableLineShape(colLines[index], mxConstants.NONE, 1)
              : new mxLine(new mxRectangle(), mxConstants.NONE, 1, true)
            shape.isDashed = sel.isDashed

            // Workaround for event handling on overlapping cells with tolerance
            shape.svgStrokeTolerance++
            const handle = new mxHandle(colState, 'col-resize', null, shape)
            handle.tableHandle = true
            let dx = 0

            handle.shape.node.parentNode.insertBefore(handle.shape.node,
              handle.shape.node.parentNode.firstChild)

            handle.redraw = function () {
              if (this.shape != null) {
                this.shape.stroke = (dx === 0) ? mxConstants.NONE : sel.stroke

                if (this.shape.constructor === TableLineShape) {
                  this.shape.line = moveLine(colLines[index], dx, 0)
                  this.shape.updateBoundsFromLine()
                } else {
                  const start = graph.getActualStartSize(tableState.cell, true)
                  this.shape.bounds.width = 1
                  this.shape.bounds.x = this.state.x + (g.width + dx) * s
                  this.shape.bounds.y = tableState.y + ((index === cols.length - 1)
                    ? 0
                    : start.y * s)
                  this.shape.bounds.height = tableState.height - ((index === cols.length - 1)
                    ? 0
                    : (start.height + start.y) * s)
                }

                this.shape.redraw()
              }
            }

            let shiftPressed = false

            handle.setPosition = function (bounds, pt, me) {
              dx = Math.max(MyMxGraph.minTableColumnWidth - g.width,
                pt.x - bounds.x - g.width)
              shiftPressed = mxEvent.isShiftDown(me.getEvent())

              if (ng != null && !shiftPressed) {
                dx = Math.min(dx, ng.width - MyMxGraph.minTableColumnWidth)
              }
            }

            handle.execute = function (me) {
              if (dx !== 0) {
                graph.setTableColumnWidth(this.state.cell,
                  dx, shiftPressed)
              } else if (!self.blockDelayedSelection) {
                const temp = graph.getCellAt(me.getGraphX(),
                  me.getGraphY()) || tableState.cell
                graph.graphHandler.selectCellForEvent(temp, me)
              }

              dx = 0
            }

            // Stops repaint of text label via vertex handler
            handle.positionChanged = function () {
              // do nothing
            }

            handle.reset = function () {
              dx = 0
            }

            handles.push(handle)
          }))(i)
        }
      }
    }
    // FIXMe
    // if (this.graph.isCellRotatable(this.state.cell))
    //   // LATER: Make locked state independent of rotatable flag, fix toggle if default is false
    //   // if (this.graph.isCellResizable(this.state.cell) || this.graph.isCellMovable(this.state.cell))
    // {
    //   let name = this.state.style.shape
    //
    //   if (mxCellRenderer.defaultShapes[name] == null &&
    //     mxStencilRegistry.getStencil(name) == null) {
    //     name = mxConstants.SHAPE_RECTANGLE
    //   } else if (this.state.view.graph.isSwimlane(this.state.cell)) {
    //     name = mxConstants.SHAPE_SWIMLANE
    //   }
    //
    //   let fn = handleFactory[name]
    //
    //   if (fn == null && this.state.shape != null && this.state.shape.isRoundable()) {
    //     fn = handleFactory[mxConstants.SHAPE_RECTANGLE]
    //   }
    //
    //   if (fn != null) {
    //     const temp = fn(this.state)
    //
    //     if (temp != null) {
    //       if (handles == null) {
    //         handles = temp
    //       } else {
    //         handles = handles.concat(temp)
    //       }
    //     }
    //   }
    // }

    // Reserve gives point handles precedence over line handles
    return (handles != null) ? handles.reverse() : null
  }

  /**
   * Hides additional handles
   */
  setHandlesVisible (visible) {
    super.setHandlesVisible(visible)

    if (this.moveHandles != null) {
      for (let i = 0; i < this.moveHandles.length; i++) {
        if (this.moveHandles[i] != null) {
          this.moveHandles[i].node.style.visibility = (visible) ? '' : 'hidden'
        }
      }
    }

    if (this.cornerHandles != null) {
      for (let i = 0; i < this.cornerHandles.length; i++) {
        this.cornerHandles[i].node.style.visibility = (visible) ? '' : 'hidden'
      }
    }
  }

  /**
   * Function: isMoveHandlesVisible
   *
   * Initializes the shapes required for this vertex handler.
   */
  isMoveHandlesVisible () {
    return this.graph.isTable(this.state.cell) &&
      this.graph.isCellMovable(this.state.cell)
  }

  /**
   * Creates or updates special handles for moving rows.
   */
  refreshMoveHandles () {
    const showMoveHandles = this.isMoveHandlesVisible()

    if (showMoveHandles && this.moveHandles == null) {
      this.moveHandles = this.createMoveHandles()
    } else if (!showMoveHandles && this.moveHandles != null) {
      this.destroyMoveHandles()
    }

    // Destroys existing handles
    if (showMoveHandles && this.moveHandles != null) {
      for (let i = 0; i < this.moveHandles.length; i++) {
        if (this.moveHandles[i] != null) {
          this.moveHandles[i].parentNode.removeChild(this.moveHandles[i])
        }
      }

      this.moveHandles = null
    }
  }

  /**
   * Creates or updates special handles for moving rows.
   */
  createMoveHandles () {
    const graph = this.graph
    const model = graph.model
    const handles = []

    for (let i = 0; i < model.getChildCount(this.state.cell); i++) {
      (mxUtils.bind(this, function (rowState) {
        if (rowState != null && model.isVertex(rowState.cell) &&
          graph.isCellMovable(rowState.cell)) {
          const bounds = new mxRectangle(0, 0, this.rowHandleImage.width, this.rowHandleImage.height)
          const moveHandle = new mxImageShape(bounds, this.rowHandleImage.src)
          moveHandle.rowState = rowState
          moveHandle.dialect = (this.graph.dialect !== mxConstants.DIALECT_SVG) ? mxConstants.DIALECT_MIXEDHTML : mxConstants.DIALECT_SVG
          moveHandle.init(this.graph.getView().getOverlayPane())
          moveHandle.node.style.cursor = 'move'

          mxEvent.addGestureListeners(moveHandle.node, mxUtils.bind(this, function (evt) {
            this.graph.popupMenuHandler.hideMenu()
            this.graph.stopEditing(false)

            if (this.graph.isToggleEvent(evt) ||
              !this.graph.isCellSelected(rowState.cell)) {
              this.graph.selectCellForEvent(rowState.cell, evt)
            }

            if (!mxEvent.isPopupTrigger(evt)) {
              this.graph.graphHandler.start(this.state.cell,
                mxEvent.getClientX(evt), mxEvent.getClientY(evt),
                this.graph.getSelectionCells())
              this.graph.graphHandler.cellWasClicked = true
              this.graph.isMouseTrigger = mxEvent.isMouseEvent(evt)
              this.graph.isMouseDown = true
            }

            mxEvent.consume(evt)
          }), null, mxUtils.bind(this, function (evt) {
            if (mxEvent.isPopupTrigger(evt)) {
              this.graph.popupMenuHandler.popup(mxEvent.getClientX(evt),
                mxEvent.getClientY(evt), rowState.cell, evt)
              mxEvent.consume(evt)
            }
          }))

          handles.push(moveHandle)
        } else {
          handles.push(null)
        }
      }))(this.graph.view.getState(model.getChildAt(this.state.cell, i)))
    }

    return handles
  }

  /**
   * Function: destroyMoveHandles
   *
   * Destroys the handler and all its resources and DOM nodes.
   */
  destroyMoveHandles () {
    if (this.moveHandles != null) {
      for (let i = 0; i < this.moveHandles.length; i++) {
        if (this.moveHandles[i] != null) {
          this.moveHandles[i].destroy()
        }
      }

      this.moveHandles = null
    }
  }

  /**
   * Function: destroyCornerHandles
   *
   * Destroys the handler and all its resources and DOM nodes.
   */
  destroyCornerHandles () {
    if (this.cornerHandles != null) {
      for (let i = 0; i < this.cornerHandles.length; i++) {
        if (this.cornerHandles[i] != null && this.cornerHandles[i].node != null &&
          this.cornerHandles[i].node.parentNode != null) {
          this.cornerHandles[i].node.parentNode.removeChild(this.cornerHandles[i].node)
        }
      }

      this.cornerHandles = null
    }
  }

  /**
   * Adds handle padding for editing cells and exceptions.
   */
  refresh () {
    super.refresh()

    this.destroyMoveHandles()
    this.destroyCornerHandles()

    if (this.graph.isTable(this.state.cell) && this.graph.isCellMovable(this.state.cell)) {
      this.refreshMoveHandles()
    } else if (this.graph.getSelectionCount() === 1 &&
      this.graph.isCellMovable(this.state.cell) &&
      (this.graph.isTableCell(this.state.cell) ||
        this.graph.isTableRow(this.state.cell))) {
      // Draws corner rectangles for single selected table cells and rows
      this.cornerHandles = []

      for (let i = 0; i < 4; i++) {
        const shape = new mxRectangleShape(new mxRectangle(0, 0, 6, 6),
          '#ffffff', mxConstants.HANDLE_STROKECOLOR)
        shape.dialect = mxConstants.DIALECT_SVG
        shape.init(this.graph.view.getOverlayPane())
        this.cornerHandles.push(shape)
      }
    }

    if (this.graph.isTable(this.state.cell) &&
      this.graph.isCellMovable(this.state.cell)) {
      this.refreshMoveHandles()
    }

    const link = this.graph.getLinkForCell(this.state.cell)
    const links = this.graph.getLinksForState(this.state)
    this.updateLinkHint(link, links)
  }

  /**
   * Adds handle padding for editing cells and exceptions.
   */
  getHandlePadding () {
    let result = new mxPoint(0, 0)
    let tol = this.tolerance
    let name = this.state.style.shape

    if (mxCellRenderer.defaultShapes[name] == null &&
      mxStencilRegistry.getStencil(name) == null) {
      name = mxConstants.SHAPE_RECTANGLE
    }

    // Checks if custom handles are overlapping with the shape border
    let handlePadding = this.graph.isTable(this.state.cell) || this.graph.cellEditor.getEditingCell() === this.state.cell

    if (!handlePadding) {
      if (this.customHandles != null) {
        for (let i = 0; i < this.customHandles.length; i++) {
          if (this.customHandles[i] != null &&
            this.customHandles[i].shape != null &&
            this.customHandles[i].shape.bounds != null) {
            const b = this.customHandles[i].shape.bounds
            const px = b.getCenterX()
            const py = b.getCenterY()

            if ((Math.abs(this.state.x - px) < b.width / 2) ||
              (Math.abs(this.state.y - py) < b.height / 2) ||
              (Math.abs(this.state.x + this.state.width - px) < b.width / 2) ||
              (Math.abs(this.state.y + this.state.height - py) < b.height / 2)) {
              handlePadding = true
              break
            }
          }
        }
      }
    }

    if (handlePadding && this.sizers != null &&
      this.sizers.length > 0 && this.sizers[0] != null) {
      tol /= 2

      // Makes room for row move handle
      if (this.graph.isTable(this.state.cell)) {
        tol += 7
      }

      result.x = this.sizers[0].bounds.width + tol
      result.y = this.sizers[0].bounds.height + tol
    } else {
      result = super.getHandlePadding()
    }

    return result
  }

  /**
   * Updates the hint for the current operation.
   */
  updateHint (me) {
    if (this.index !== mxEvent.LABEL_HANDLE) {
      if (this.hint == null) {
        this.hint = createHint()
        this.state.view.graph.container.appendChild(this.hint)
      }

      if (this.index === mxEvent.ROTATION_HANDLE) {
        this.hint.innerHTML = this.currentAlpha + '&deg;'
      } else {
        const s = this.state.view.scale
        const unit = this.state.view.unit
        this.hint.innerHTML = formatHintText(this.roundLength(this.bounds.width / s), unit) + ' x ' +
          formatHintText(this.roundLength(this.bounds.height / s), unit)
      }

      const rot = (this.currentAlpha != null) ? this.currentAlpha : this.state.style[mxConstants.STYLE_ROTATION] || '0'
      let bb = mxUtils.getBoundingBox(this.bounds, rot)

      if (bb == null) {
        bb = this.bounds
      }

      this.hint.style.left = bb.x + Math.round((bb.width - this.hint.clientWidth) / 2) + 'px'
      this.hint.style.top = (bb.y + bb.height + MyEditor.hintOffset) + 'px'

      if (this.linkHint != null) {
        this.linkHint.style.display = 'none'
      }
    }
  }

  /**
   * Updates the hint for the current operation.
   */
  removeHint () {
    mxGraphHandler.prototype.removeHint()

    if (this.linkHint != null) {
      this.linkHint.style.display = ''
    }
  }

  createSizerShape (bounds, index, fillColor, image) {
    // image = (index === mxEvent.ROTATION_HANDLE)
    //   ? HoverIcons.prototype.rotationHandle
    //   : (index === mxEvent.LABEL_HANDLE) ? this.secondaryHandleImage : image

    return super.createSizerShape(bounds, index, fillColor, image)
  }

  // Uses text bounding box for edge labels
  getSelectionBounds (state) {
    const model = this.graph.getModel()
    const parent = model.getParent(state.cell)
    const geo = this.graph.getCellGeometry(state.cell)

    if (model.isEdge(parent) && geo != null && geo.relative && state.width < 2 && state.height < 2 && state.text != null && state.text.boundingBox != null) {
      const bbox = state.text.unrotatedBoundingBox || state.text.boundingBox

      return new mxRectangle(Math.round(bbox.x), Math.round(bbox.y), Math.round(bbox.width), Math.round(bbox.height))
    } else {
      return super.getSelectionBounds(state)
    }
  }

  // Redirects moving of edge labels to mxGraphHandler by not starting here.
  // This will use the move preview of mxGraphHandler (see above).
  mouseDown (sender, me) {
    const model = this.graph.getModel()
    const parent = model.getParent(this.state.cell)
    const geo = this.graph.getCellGeometry(this.state.cell)

    // Lets rotation events through
    const handle = this.getHandleForEvent(me)

    if (handle === mxEvent.ROTATION_HANDLE || !model.isEdge(parent) || geo == null || !geo.relative ||
      this.state == null || this.state.width >= 2 || this.state.height >= 2) {
      super.mouseDown(sender, me)
    }
  }

  // Invokes turn on single click on rotation handle
  rotateClick () {
    const stroke = mxUtils.getValue(this.state.style, mxConstants.STYLE_STROKECOLOR, mxConstants.NONE)
    const fill = mxUtils.getValue(this.state.style, mxConstants.STYLE_FILLCOLOR, mxConstants.NONE)

    if (this.state.view.graph.model.isVertex(this.state.cell) &&
      stroke === mxConstants.NONE && fill === mxConstants.NONE) {
      const angle = mxUtils.mod(mxUtils.getValue(this.state.style, mxConstants.STYLE_ROTATION, 0) + 90, 360)
      this.state.view.graph.setCellStyles(mxConstants.STYLE_ROTATION, angle, [this.state.cell])
    } else {
      this.state.view.graph.turnShapes([this.state.cell])
    }
  }

  // Workaround for "isConsumed not defined" in MS Edge is to use arguments
  mouseMove (sender, me) {
    super.mouseMove(sender, me)

    if (this.graph.graphHandler.first != null) {
      if (this.rotationShape != null && this.rotationShape.node != null) {
        this.rotationShape.node.style.display = 'none'
      }

      if (this.linkHint != null && this.linkHint.style.display !== 'none') {
        this.linkHint.style.display = 'none'
      }
    }
  }

  mouseUp (sender, me) {
    super.mouseUp(sender, me)

    // Shows rotation handle only if one vertex is selected
    if (this.rotationShape != null && this.rotationShape.node != null) {
      this.rotationShape.node.style.display = (this.graph.getSelectionCount() === 1) ? '' : 'none'
    }

    if (this.linkHint != null && this.linkHint.style.display === 'none') {
      this.linkHint.style.display = ''
    }

    // Resets state after gesture
    this.blockDelayedSelection = null
  }

  updateLinkHint (link, links) {
    try {
      if (link == null && (links == null || links.length === 0)) {
        if (this.linkHint != null) {
          this.linkHint.parentNode.removeChild(this.linkHint)
          this.linkHint = null
        }
      } else if (link != null || (links != null && links.length > 0)) {
        const img = document.createElement('img')
        img.className = 'geAdaptiveAsset'
        img.setAttribute('src', MyEditor.editImage)
        img.setAttribute('title', mxResources.get('editLink'))
        img.setAttribute('width', '14')
        img.setAttribute('height', '14')
        img.style.paddingLeft = '8px'
        img.style.marginLeft = 'auto'
        img.style.marginBottom = '-1px'
        img.style.cursor = 'pointer'

        const trash = img.cloneNode(true)
        trash.setAttribute('src', MyEditor.trashImage)
        trash.setAttribute('title', mxResources.get('removeIt',
          [mxResources.get('link')]))
        trash.style.paddingLeft = '4px'
        trash.style.marginLeft = '0'

        if (this.linkHint == null) {
          this.linkHint = createHint()
          this.linkHint.style.padding = '6px 8px 6px 8px'
          this.linkHint.style.opacity = '1'
          this.linkHint.style.filter = ''

          this.graph.container.appendChild(this.linkHint)

          mxEvent.addListener(this.linkHint, 'mouseenter', mxUtils.bind(this, function () {
            this.graph.tooltipHandler.hide()
          }))
        }

        this.linkHint.innerText = ''

        if (link != null) {
          const wrapper = document.createElement('div')
          wrapper.style.display = 'flex'
          wrapper.style.alignItems = 'center'
          wrapper.appendChild(this.graph.createLinkForHint(link, null, this.state.cell))

          this.linkHint.appendChild(wrapper)

          if (this.graph.isEnabled() && typeof this.graph.editLink === 'function' &&
            !this.graph.isCellLocked(this.state.cell)) {
            const changeLink = img.cloneNode(true)
            wrapper.appendChild(changeLink)

            mxEvent.addListener(changeLink, 'click', mxUtils.bind(this, function (evt) {
              this.graph.setSelectionCell(this.state.cell)
              this.graph.editLink()
              mxEvent.consume(evt)
            }))

            const trashLink = trash.cloneNode(true)
            wrapper.appendChild(trashLink)

            mxEvent.addListener(trashLink, 'click', mxUtils.bind(this, function (evt) {
              this.graph.setLinkForCell(this.state.cell, null)
              mxEvent.consume(evt)
            }))
          }
        }

        if (links != null) {
          for (let i = 0; i < links.length; i++) {
            (mxUtils.bind(this, function (currentLink, index) {
              const div = document.createElement('div')
              div.style.display = 'flex'
              div.style.alignItems = 'center'
              div.style.marginTop = (link != null || index > 0) ? '6px' : '0px'
              div.appendChild(this.graph.createLinkForHint(
                currentLink.getAttribute('href'),
                mxUtils.getTextContent(currentLink),
                this.state.cell))

              const changeLink = img.cloneNode(true)
              div.appendChild(changeLink)

              const updateLink = mxUtils.bind(this, function (value) {
                const tmp = document.createElement('div')
                tmp.innerHTML = MyMxGraph.sanitizeHtml(this.graph.getLabel(this.state.cell))
                const anchor = tmp.getElementsByTagName('a')[index]

                if (anchor != null) {
                  if (value == null || value === '') {
                    let child = anchor.cloneNode(true).firstChild

                    while (child != null) {
                      anchor.parentNode.insertBefore(child.cloneNode(true), anchor)
                      child = child.nextSibling
                    }

                    anchor.parentNode.removeChild(anchor)
                  } else {
                    anchor.setAttribute('href', value)
                  }

                  this.graph.labelChanged(this.state.cell, tmp.innerHTML)
                }
              })

              mxEvent.addListener(changeLink, 'click', mxUtils.bind(this, function (evt) {
                this.graph.showLinkDialog(currentLink.getAttribute('href') || '',
                  mxResources.get('ok'), updateLink)
                mxEvent.consume(evt)
              }))

              const trashLink = trash.cloneNode(true)
              div.appendChild(trashLink)

              mxEvent.addListener(trashLink, 'click', mxUtils.bind(this, function (evt) {
                updateLink()
                mxEvent.consume(evt)
              }))

              this.linkHint.appendChild(div)
            }))(links[i], i)
          }
        }
      }

      if (this.linkHint != null) {
        MyMxGraph.sanitizeNode(this.linkHint)
      }
    } catch (e) {
      // ignore
    }
  }

  // Updates special handles
  redrawHandles () {
    if (this.moveHandles != null) {
      for (let i = 0; i < this.moveHandles.length; i++) {
        if (this.moveHandles[i] != null) {
          this.moveHandles[i].bounds.x = Math.round(this.moveHandles[i].rowState.x +
            this.moveHandles[i].rowState.width - this.moveHandles[i].bounds.width / 2)
          this.moveHandles[i].bounds.y = Math.round(this.moveHandles[i].rowState.y +
            (this.moveHandles[i].rowState.height - this.moveHandles[i].bounds.height) / 2)
          this.moveHandles[i].redraw()
        }
      }
    }

    if (this.cornerHandles != null) {
      const inset = this.getSelectionBorderInset()
      const ch = this.cornerHandles
      const w = ch[0].bounds.width / 2
      const h = ch[0].bounds.height / 2

      ch[0].bounds.x = this.state.x - w + inset
      ch[0].bounds.y = this.state.y - h + inset
      ch[0].redraw()
      ch[1].bounds.x = ch[0].bounds.x + this.state.width - 2 * inset
      ch[1].bounds.y = ch[0].bounds.y
      ch[1].redraw()
      ch[2].bounds.x = ch[0].bounds.x
      ch[2].bounds.y = this.state.y + this.state.height - 2 * inset
      ch[2].redraw()
      ch[3].bounds.x = ch[1].bounds.x
      ch[3].bounds.y = ch[2].bounds.y
      ch[3].redraw()

      for (let i = 0; i < this.cornerHandles.length; i++) {
        this.cornerHandles[i].node.style.display = (this.graph.getSelectionCount() === 1) ? '' : 'none'
      }
    }

    // Shows rotation handle only if one vertex is selected
    if (this.rotationShape != null && this.rotationShape.node != null) {
      this.rotationShape.node.setAttribute('title', mxResources.get('rotateTooltip'))
      this.rotationShape.node.style.display = (this.moveHandles == null &&
        (this.graph.getSelectionCount() === 1 && (this.index == null ||
          this.index === mxEvent.ROTATION_HANDLE)))
        ? ''
        : 'none'
    }

    super.redrawHandles()

    if (this.state != null && this.linkHint != null) {
      const c = new mxPoint(this.state.getCenterX(), this.state.getCenterY())
      const tmp = new mxRectangle(this.state.x, this.state.y - 22, this.state.width + 24, this.state.height + 22)
      let bb = mxUtils.getBoundingBox(tmp, this.state.style[mxConstants.STYLE_ROTATION] || '0', c)
      const rs = (bb != null)
        ? mxUtils.getBoundingBox(this.state,
          this.state.style[mxConstants.STYLE_ROTATION] || '0')
        : this.state
      const tb = (this.state.text != null) ? this.state.text.boundingBox : null

      if (bb == null) {
        bb = this.state
      }

      let b = bb.y + bb.height

      if (tb != null) {
        b = Math.max(b, tb.y + tb.height)
      }

      this.linkHint.style.left = Math.max(0, Math.round(rs.x + (rs.width - this.linkHint.clientWidth) / 2)) + 'px'
      this.linkHint.style.top = Math.round(b + this.verticalOffset / 2 + MyEditor.hintOffset) + 'px'
      this.linkHint.style.display = (this.graph.getSelectionCount() > 1) ? 'none' : ''
    }
  }

  // Destroys special handles
  destroy () {
    super.destroy()

    this.destroyMoveHandles()
    this.destroyCornerHandles()

    if (this.linkHint != null) {
      if (this.linkHint.parentNode != null) {
        this.linkHint.parentNode.removeChild(this.linkHint)
      }

      this.linkHint = null
    }

    if (this.changeHandler != null) {
      this.graph.getSelectionModel().removeListener(this.changeHandler)
      this.graph.getModel().removeListener(this.changeHandler)
      this.changeHandler = null
    }

    if (this.editingHandler != null) {
      this.graph.removeListener(this.editingHandler)
      this.editingHandler = null
    }
  }
  // +++++++++++++ 原型方法end ++++++++++++++
}
