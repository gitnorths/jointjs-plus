export function overrideMxGraphView (mxOutput) {
  const {
    mxClient,
    mxConstants,
    mxEvent,
    mxGraphView,
    mxImageShape,
    mxLog,
    mxMouseEvent,
    mxRectangle,
    mxResources,
    mxUtils
  } = mxOutput

  // mxGraphView start
  /**
   * Function: invalidate
   *
   * Invalidates the state of the given cell, all its descendants and
   * connected edges.
   *
   * Parameters:
   *
   * cell - Optional <mxCell> to be invalidated. Default is the root of the
   * model.
   */
  mxGraphView.prototype.invalidate = function (cell, recurse, includeEdges) {
    const model = this.graph.getModel()
    cell = cell || model.getRoot()

    if (cell != null) {
      recurse = (recurse != null) ? recurse : true
      includeEdges = (includeEdges != null) ? includeEdges : true

      const state = this.getState(cell)

      if (state != null) {
        state.invalid = true
      }

      // Avoids infinite loops for invalid graphs
      if (!cell.invalidating) {
        cell.invalidating = true

        // Recursively invalidates all descendants
        if (recurse) {
          const childCount = model.getChildCount(cell)

          for (let i = 0; i < childCount; i++) {
            const child = model.getChildAt(cell, i)
            this.invalidate(child, recurse, includeEdges)
          }
        }

        // Propagates invalidation to all connected edges
        if (includeEdges) {
          const edgeCount = model.getEdgeCount(cell)

          for (let i = 0; i < edgeCount; i++) {
            this.invalidate(model.getEdgeAt(cell, i), recurse, includeEdges)
          }
        }

        delete cell.invalidating
      }
    }
  }
  /**
   * Function: validate
   *
   * Calls <validateCell> and <validateCellState> and updates the <graphBounds>
   * using <getBoundingBox>. Finally the background is validated using
   * <validateBackground>.
   *
   * Parameters:
   *
   * cell - Optional <mxCell> to be used as the root of the validation.
   * Default is <currentRoot> or the root of the model.
   */
  mxGraphView.prototype.validate = function (cell) {
    const t0 = mxLog.enter('mxGraphView.validate')
    window.status = mxResources.get(this.updatingDocumentResource) || this.updatingDocumentResource

    this.resetValidationState()

    // Improves IE rendering speed by minimizing reflows
    let prevDisplay = null

    if (this.canvas != null && this.textDiv == null && (document.documentMode === 8 && !mxClient.IS_EM)) {
      // Placeholder keeps scrollbar positions when canvas is hidden
      this.placeholder = document.createElement('div')
      this.placeholder.style.position = 'absolute'
      this.placeholder.style.width = this.canvas.clientWidth + 'px'
      this.placeholder.style.height = this.canvas.clientHeight + 'px'
      this.canvas.parentNode.appendChild(this.placeholder)

      prevDisplay = this.drawPane.style.display
      this.canvas.style.display = 'none'

      // Creates temporary DIV used for text measuring in mxText.updateBoundingBox
      this.textDiv = document.createElement('div')
      this.textDiv.style.position = 'absolute'
      this.textDiv.style.whiteSpace = 'nowrap'
      this.textDiv.style.visibility = 'hidden'
      this.textDiv.style.display = 'inline-block'
      this.textDiv.style.zoom = '1'

      document.body.appendChild(this.textDiv)
    }

    if (cell == null) {
      cell = ((this.currentRoot != null) ? this.currentRoot : this.graph.getModel().getRoot())
    }
    const state = this.validateCellState(this.validateCell(cell))
    const graphBounds = this.getBoundingBox(state, true, true)
    this.setGraphBounds((graphBounds != null) ? graphBounds : this.getEmptyBounds())
    this.validateBackground()

    if (prevDisplay != null) {
      this.canvas.style.display = prevDisplay
      this.textDiv.parentNode.removeChild(this.textDiv)

      if (this.placeholder != null) {
        this.placeholder.parentNode.removeChild(this.placeholder)
      }

      // Textdiv cannot be reused
      this.textDiv = null
    }

    this.resetValidationState()

    window.status = mxResources.get(this.doneResource) || this.doneResource
    mxLog.leave('mxGraphView.validate', t0)
  }
  /**
   * Function: updateBoundingBox
   *
   * Updates the bounding boxes for the given cell state.
   *
   * Parameters:
   *
   * state - <mxCellState> whose bounding boxes should be updated.
   */
  mxGraphView.prototype.updateBoundingBox = function (state) {
    if (state.shape != null) {
      state.shape.updateBoundingBox()
    }

    if (state.text != null) {
      state.text.updateBoundingBox()
    }
  }
  /**
   * Function: getBoundingBox
   *
   * Returns the bounding box of the shape and the label for the given
   * <mxCellState> and its children if recurse is true.
   *
   * Parameters:
   *
   * state - <mxCellState> whose bounding box should be returned.
   * recurse - Optional boolean indicating if the children should be included.
   * Default is true.
   * update - Optional boolean indicating if the bounding boxes
   * should be updated. Default is false.
   */
  mxGraphView.prototype.getBoundingBox = function (state, recurse, update) {
    recurse = (recurse != null) ? recurse : true
    update = (update != null) ? update : false

    let bbox = null

    if (state != null) {
      if (update) {
        this.updateBoundingBox(state)
      }

      function checkBounds (shape) {
        return shape != null && shape.boundingBox != null && !isNaN(shape.boundingBox.x) && !isNaN(shape.boundingBox.y) && !isNaN(shape.boundingBox.width) && !isNaN(shape.boundingBox.height)
      }

      function add (shape) {
        if (checkBounds(shape)) {
          if (bbox == null) {
            bbox = shape.boundingBox.clone()
          } else {
            bbox.add(shape.boundingBox)
          }
        }
      }

      add(state.shape)
      add(state.text)

      if (recurse) {
        const model = this.graph.getModel()
        const childCount = model.getChildCount(state.cell)

        for (let i = 0; i < childCount; i++) {
          const bounds = this.getBoundingBox(this.getState(model.getChildAt(state.cell, i)), recurse, update)

          if (bounds != null) {
            if (bbox == null) {
              bbox = bounds
            } else {
              bbox.add(bounds)
            }
          }
        }
      }
    }

    return bbox
  }
  /**
   * Function: validateBackgroundImage
   *
   * Validates the background image.
   */
  mxGraphView.prototype.validateBackgroundImage = function () {
    const bg = this.graph.getBackgroundImage()

    if (bg != null) {
      if (this.backgroundImage == null || this.backgroundImage.image !== bg.src) {
        if (this.backgroundImage != null) {
          this.backgroundImage.destroy()
        }

        const bounds = new mxRectangle(0, 0, 1, 1)

        this.backgroundImage = new mxImageShape(bounds, bg.src)
        this.backgroundImage.dialect = this.graph.dialect
        this.backgroundImage.init(this.backgroundPane)
        this.backgroundImage.redraw()
      }

      this.redrawBackgroundImage(this.backgroundImage, bg)
    } else if (this.backgroundImage != null) {
      this.backgroundImage.destroy()
      this.backgroundImage = null
    }
  }
  /**
   * Function: redrawBackgroundImage
   *
   * Updates the bounds and redraws the background image.
   *
   * Example:
   *
   * If the background image should not be scaled, this can be replaced with
   * the following.
   *
   * (code)
   * mxGraphView.prototype.redrawBackground = function(backgroundImage, bg)
   * {
   *   backgroundImage.bounds.x = this.translate.x;
   *   backgroundImage.bounds.y = this.translate.y;
   *   backgroundImage.bounds.width = bg.width;
   *   backgroundImage.bounds.height = bg.height;
   *
   *   backgroundImage.redraw();
   * };
   * (end)
   *
   * Parameters:
   *
   * backgroundImage - <mxImageShape> that represents the background image.
   * bg - <mxImage> that specifies the image and its dimensions.
   */
  mxGraphView.prototype.redrawBackgroundImage = function (backgroundImage, bg) {
    const bounds = new mxRectangle(this.scale * (this.translate.x + bg.x), this.scale * (this.translate.y + bg.y), this.scale * bg.width, this.scale * bg.height)

    if (backgroundImage.scale !== this.scale || !bounds.equals(backgroundImage.bounds)) {
      backgroundImage.scale = this.scale
      backgroundImage.bounds = bounds

      // Updates bounds of image or svg to keep rendered content
      if (backgroundImage.node != null && backgroundImage.node.nodeName === 'g' && (backgroundImage.node.firstChild.nodeName === 'image' || backgroundImage.node.firstChild.nodeName === 'svg')) {
        backgroundImage.node.firstChild.setAttribute('x', bounds.x)
        backgroundImage.node.firstChild.setAttribute('y', bounds.y)
        backgroundImage.node.firstChild.setAttribute('width', bounds.width)
        backgroundImage.node.firstChild.setAttribute('height', bounds.height)
      } else {
        backgroundImage.redraw()
      }
    }
  }
  /**
   * Function: isContainerEvent
   *
   * Returns true if the event origin is one of the drawing panes or
   * containers of the view.
   */
  mxGraphView.prototype.isContainerEvent = function (evt) {
    const source = mxEvent.getSource(evt)

    return source === this.graph.container || this.backgroundPane.contains(source) || source === this.canvas.parentNode || source === this.canvas || source === this.drawPane || source === this.overlayPane || source === this.decoratorPane
  }

  /**
   * Function: init
   *
   * Initializes the graph event dispatch loop for the specified container
   * and invokes <create> to create the required DOM nodes for the display.
   */
  mxGraphView.prototype.init = function () {
    this.installListeners()

    // Creates the DOM nodes for the respective display dialect
    const graph = this.graph

    if (graph.dialect === mxConstants.DIALECT_SVG) {
      this.createSvg()
    } else {
      this.createHtml()
    }
  }

  /**
   * Function: installListeners
   *
   * Installs the required listeners in the container.
   */
  mxGraphView.prototype.installListeners = function () {
    const graph = this.graph
    const container = graph.container

    if (container != null) {
      // Support for touch device gestures (eg. pinch to zoom)
      // Double-tap handling is implemented in mxGraph.fireMouseEvent
      if (mxClient.IS_TOUCH) {
        mxEvent.addListener(container, 'gesturestart', mxUtils.bind(this, function (evt) {
          graph.fireGestureEvent(evt)
          mxEvent.consume(evt)
        }))

        mxEvent.addListener(container, 'gesturechange', mxUtils.bind(this, function (evt) {
          graph.fireGestureEvent(evt)
          mxEvent.consume(evt)
        }))

        mxEvent.addListener(container, 'gestureend', mxUtils.bind(this, function (evt) {
          graph.fireGestureEvent(evt)
          mxEvent.consume(evt)
        }))
      }

      // Adds basic listeners for graph event dispatching
      mxEvent.addGestureListeners(container, mxUtils.bind(this, function (evt) {
        // Condition to avoid scrollbar events starting a rubberband selection
        if (this.isContainerEvent(evt) && ((!mxClient.IS_IE && !mxClient.IS_IE11 && !mxClient.IS_GC && !mxClient.IS_OP && !mxClient.IS_SF) || !this.isScrollEvent(evt))) {
          graph.fireMouseEvent(mxEvent.MOUSE_DOWN, new mxMouseEvent(evt))
        }
      }), mxUtils.bind(this, function (evt) {
        if (this.isContainerEvent(evt)) {
          graph.fireMouseEvent(mxEvent.MOUSE_MOVE, new mxMouseEvent(evt))
        }
      }), mxUtils.bind(this, function (evt) {
        if (this.isContainerEvent(evt)) {
          graph.fireMouseEvent(mxEvent.MOUSE_UP, new mxMouseEvent(evt))
        }
      }))

      // Adds listener for double click handling on background, this does always
      // use native event handler, we assume that the DOM of the background
      // does not change during the double click
      mxEvent.addListener(container, 'dblclick', mxUtils.bind(this, function (evt) {
        if (this.isContainerEvent(evt)) {
          graph.dblClick(evt)
        }
      }))

      // Workaround for touch events which started on some DOM node
      // on top of the container, in which case the cells under the
      // mouse for the move and up events are not detected.
      const getState = function (evt) {
        let state = null

        // Workaround for touch events which started on some DOM node
        // on top of the container, in which case the cells under the
        // mouse for the move and up events are not detected.
        if (mxClient.IS_TOUCH) {
          const x = mxEvent.getClientX(evt)
          const y = mxEvent.getClientY(evt)

          // Dispatches the drop event to the graph which
          // consumes and executes the source function
          const pt = mxUtils.convertPoint(container, x, y)
          state = graph.view.getState(graph.getCellAt(pt.x, pt.y))
        }

        return state
      }

      // Adds basic listeners for graph event dispatching outside of the
      // container and finishing the handling of a single gesture
      // Implemented via graph event dispatch loop to avoid duplicate events
      // in Firefox and Chrome
      graph.addMouseListener({
        mouseDown: function (sender, me) {
          graph.popupMenuHandler.hideMenu()
        },
        mouseMove: function () {
          // todo
        },
        mouseUp: function () {
          // todo
        }
      })

      this.moveHandler = mxUtils.bind(this, function (evt) {
        // Hides the tooltip if mouse is outside container
        if (graph.tooltipHandler != null && graph.tooltipHandler.isHideOnHover()) {
          graph.tooltipHandler.hide()
        }

        if (this.captureDocumentGesture && graph.isMouseDown && graph.container != null && !this.isContainerEvent(evt) && graph.container.style.display !== 'none' && graph.container.style.visibility !== 'hidden' && !mxEvent.isConsumed(evt)) {
          graph.fireMouseEvent(mxEvent.MOUSE_MOVE, new mxMouseEvent(evt, getState(evt)))
        }
      })

      this.endHandler = mxUtils.bind(this, function (evt) {
        if (this.captureDocumentGesture && graph.isMouseDown && graph.container != null && !this.isContainerEvent(evt) && graph.container.style.display !== 'none' && graph.container.style.visibility !== 'hidden') {
          graph.fireMouseEvent(mxEvent.MOUSE_UP, new mxMouseEvent(evt))
        }
      })

      mxEvent.addGestureListeners(document, null, this.moveHandler, this.endHandler)
    }
  }

  /**
   * Function: createHtml
   *
   * Creates the DOM nodes for the HTML display.
   */
  mxGraphView.prototype.createHtml = function () {
    const container = this.graph.container

    if (container != null) {
      this.canvas = this.createHtmlPane('100%', '100%')
      this.canvas.style.overflow = 'hidden'

      // Uses minimal size for inner DIVs on Canvas. This is required
      // for correct event processing in IE. If we have an overlapping
      // DIV then the events on the cells are only fired for labels.
      this.backgroundPane = this.createHtmlPane('1px', '1px')
      this.drawPane = this.createHtmlPane('1px', '1px')
      this.overlayPane = this.createHtmlPane('1px', '1px')
      this.decoratorPane = this.createHtmlPane('1px', '1px')

      this.canvas.appendChild(this.backgroundPane)
      this.canvas.appendChild(this.drawPane)
      this.canvas.appendChild(this.overlayPane)
      this.canvas.appendChild(this.decoratorPane)

      container.appendChild(this.canvas)
      this.updateContainerStyle(container)
    }
  }

  if (mxGraphView.prototype.hasOwnProperty('optimizeVmlReflows')) {
    delete mxGraphView.prototype.optimizeVmlReflows
  }
  if (mxGraphView.prototype.hasOwnProperty('createVml')) {
    delete mxGraphView.prototype.createVml
  }
  if (mxGraphView.prototype.hasOwnProperty('createVmlPane')) {
    delete mxGraphView.prototype.createVmlPane
  }
// mxGraphView end
  mxOutput.mxGraphView = mxGraphView
}
