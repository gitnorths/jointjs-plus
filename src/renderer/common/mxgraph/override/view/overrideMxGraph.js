export function overrideMxGraph (mxOutput) {
  const {
    mxCell,
    mxClient,
    mxConstants,
    mxDictionary,
    mxEvent,
    mxEventObject,
    mxGeometry,
    mxGraphModel,
    mxLabel,
    mxMouseEvent,
    mxPoint,
    mxRectangle,
    mxResources,
    mxSvgCanvas2D,
    mxUtils
  } = mxOutput

// mxGraph start
  function mxGraph (container, model, renderHint, stylesheet, rendering) {
    // Initializes the variable in case the prototype has been
    // modified to hold some listeners (which is possible because
    // the createHandlers call is executed regardless of the
    // arguments passed into the ctor).
    this.mouseListeners = null

    // Converts the renderHint into a dialect
    this.renderHint = renderHint

    if (mxClient.IS_SVG) {
      this.dialect = mxConstants.DIALECT_SVG
    } else if (renderHint === mxConstants.RENDERING_HINT_FASTEST) {
      this.dialect = mxConstants.DIALECT_STRICTHTML
    } else if (renderHint === mxConstants.RENDERING_HINT_FASTER) {
      this.dialect = mxConstants.DIALECT_PREFERHTML
    } else {
      this.dialect = mxConstants.DIALECT_MIXEDHTML
    }

    // Initializes the main members that do not require a container
    this.model = (model != null) ? model : new mxGraphModel()
    this.multiplicities = []
    this.imageBundles = []
    this.cellRenderer = this.createCellRenderer()
    this.setSelectionModel(this.createSelectionModel())
    this.setStylesheet((stylesheet != null) ? stylesheet : this.createStylesheet())
    this.view = this.createGraphView()
    this.view.rendering = (rendering != null) ? rendering : this.view.rendering

    // Adds a graph model listener to update the view
    this.graphModelChangeListener = mxUtils.bind(this, function (sender, evt) {
      this.graphModelChanged(evt.getProperty('edit').changes)
    })

    this.model.addListener(mxEvent.CHANGE, this.graphModelChangeListener)

    // Installs basic event handlers with disabled default settings.
    this.createHandlers()

    // Initializes the display if a container was specified
    if (container != null) {
      this.init(container)
    }

    if (this.view.rendering) {
      this.view.revalidate()
    }
  }

  mxGraph.prototype = Object.create(mxOutput.mxGraph.prototype)

  /**
   * Variable: tapAndHoldDelay
   *
   * Specifies the time for a tap and hold. Default is 350 ms.
   */
  mxGraph.prototype.tapAndHoldDelay = 350

  /**
   * Function: init
   *
   * Initializes the <container> and creates the respective datastructures.
   *
   * Parameters:
   *
   * container - DOM node that will contain the graph display.
   */
  mxGraph.prototype.init = function (container) {
    this.container = container

    // Initializes the in-place editor
    this.cellEditor = this.createCellEditor()

    // Initializes the container using the view
    this.view.init()

    // Updates the size of the container for the current graph
    this.sizeDidChange()

    // Hides tooltips and resets tooltip timer if mouse leaves container
    mxEvent.addListener(container, 'mouseleave', mxUtils.bind(this, function (evt) {
      if (this.tooltipHandler != null && this.tooltipHandler.div != null && this.tooltipHandler.div !== evt.relatedTarget) {
        this.tooltipHandler.hide()
      }
    }))

    // Automatic deallocation of memory
    if (mxClient.IS_IE) {
      mxEvent.addListener(window, 'unload', mxUtils.bind(this, function () {
        this.destroy()
      }))

      // Disable shift-click for text
      mxEvent.addListener(container, 'selectstart', mxUtils.bind(this, function (evt) {
        return this.isEditing() || (!this.isMouseDown && !mxEvent.isShiftDown(evt))
      }))
    }
  }

  /**
   * Function: getSelectionCellsForChanges
   *
   * Returns the cells to be selected for the given array of changes.
   *
   * Parameters:
   *
   * ignoreFn - Optional function that takes a change and returns true if the
   * change should be ignored.
   *
   */
  mxGraph.prototype.getSelectionCellsForChanges = function (changes, ignoreFn) {
    const dict = new mxDictionary()
    const cells = []

    const addCell = mxUtils.bind(this, function (cell) {
      if (cell != null && !dict.get(cell) && this.model.contains(cell) && !this.model.isLayer(cell)) {
        if (this.model.isEdge(cell) || this.model.isVertex(cell)) {
          dict.put(cell, true)
          cells.push(cell)
        } else {
          const childCount = this.model.getChildCount(cell)

          for (let i = 0; i < childCount; i++) {
            addCell(this.model.getChildAt(cell, i))
          }
        }
      }
    })

    for (let i = 0; i < changes.length; i++) {
      const change = changes[i]

      // FIXME if (change.constructor !== mxRootChange && (ignoreFn == null || !ignoreFn(change))) {
      if (change.constructor.name !== 'mxRootChange' && (ignoreFn == null || !ignoreFn(change))) {
        addCell(this.getCellForChange(change))
      }
    }

    return cells
  }

  /**
   * Function: getCellForChange
   *
   * Returns the cell associated with the given change.
   *
   * Parameters:
   *
   * change - The change to return the cell for.
   */
  mxGraph.prototype.getCellForChange = function (change) {
    let cell = null

    // if (change instanceof mxChildChange) {
    if (change.constructor.name === 'mxChildChange') {
      cell = change.child
    } else if (change.cell != null && change.cell instanceof mxCell) {
      cell = change.cell
    }

    return cell
  }
  /**
   * Function: startEditing
   *
   * Calls <startEditingAtCell> using the given cell or the first selection
   * cell.
   *
   * Parameters:
   *
   * evt - Optional mouse event that triggered the editing.
   * initialText - Optional string that specifies the initial editing value.
   */
  mxGraph.prototype.startEditing = function (evt, initialText) {
    this.startEditingAtCell(null, evt, initialText)
  }
  /**
   * Function: startEditingAtCell
   *
   * Fires a <startEditing> event and invokes <mxCellEditor.startEditing>
   * on <editor>. After editing was started, a <editingStarted> event is
   * fired.
   *
   * Parameters:
   *
   * cell - <mxCell> to start the in-place editor for.
   * evt - Optional mouse event that triggered the editing.
   * initialText - Optional string that specifies the initial editing value.
   */
  mxGraph.prototype.startEditingAtCell = function (cell, evt, initialText) {
    if (evt == null || !mxEvent.isMultiTouchEvent(evt)) {
      if (cell == null) {
        cell = this.getSelectionCell()

        if (cell != null && !this.isCellEditable(cell)) {
          cell = null
        }
      }

      if (cell != null) {
        this.fireEvent(new mxEventObject(mxEvent.START_EDITING, 'cell', cell, 'event', evt))
        this.cellEditor.startEditing(cell, evt, initialText)
        this.fireEvent(new mxEventObject(mxEvent.EDITING_STARTED, 'cell', cell, 'event', evt))
      }
    }
  }
  /**
   * Function: fit
   *
   * Scales the graph such that the complete diagram fits into <container> and
   * returns the current scale in the view. To fit an initial graph prior to
   * rendering, set <mxGraphView.rendering> to false prior to changing the model
   * and execute the following after changing the model.
   *
   * (code)
   * graph.fit();
   * graph.view.rendering = true;
   * graph.refresh();
   * (end)
   *
   * To fit and center the graph, the following code can be used.
   *
   * (code)
   * var margin = 2;
   * var max = 3;
   *
   * var bounds = graph.getGraphBounds();
   * var cw = graph.container.clientWidth - margin;
   * var ch = graph.container.clientHeight - margin;
   * var w = bounds.width / graph.view.scale;
   * var h = bounds.height / graph.view.scale;
   * var s = Math.min(max, Math.min(cw / w, ch / h));
   *
   * graph.view.scaleAndTranslate(s,
   *   (margin + cw - w * s) / (2 * s) - bounds.x / graph.view.scale,
   *   (margin + ch - h * s) / (2 * s) - bounds.y / graph.view.scale);
   * (end)
   *
   * Parameters:
   *
   * border - Optional number that specifies the border. Default is <border>.
   * keepOrigin - Optional boolean that specifies if the translate should be
   * changed. Default is false.
   * margin - Optional margin in pixels. Default is 0.
   * enabled - Optional boolean that specifies if the scale should be set or
   * just returned. Default is true.
   * ignoreWidth - Optional boolean that specifies if the width should be
   * ignored. Default is false.
   * ignoreHeight - Optional boolean that specifies if the height should be
   * ignored. Default is false.
   * maxHeight - Optional maximum height.
   */
  mxGraph.prototype.fit = function (border, keepOrigin, margin, enabled, ignoreWidth, ignoreHeight, maxHeight) {
    if (this.container != null) {
      border = (border != null) ? border : this.getBorder()
      keepOrigin = (keepOrigin != null) ? keepOrigin : false
      margin = (margin != null) ? margin : 0
      enabled = (enabled != null) ? enabled : true
      ignoreWidth = (ignoreWidth != null) ? ignoreWidth : false
      ignoreHeight = (ignoreHeight != null) ? ignoreHeight : false

      // Adds spacing and border from css
      const cssBorder = this.getBorderSizes()
      let w1 = this.container.offsetWidth - cssBorder.x - cssBorder.width - 1
      let h1 = (maxHeight != null) ? maxHeight : this.container.offsetHeight - cssBorder.y - cssBorder.height - 1
      let bounds = this.view.getGraphBounds()

      if (bounds.width > 0 && bounds.height > 0) {
        if (keepOrigin && bounds.x != null && bounds.y != null) {
          bounds = bounds.clone()
          bounds.width += bounds.x
          bounds.height += bounds.y
          bounds.x = 0
          bounds.y = 0
        }

        // LATER: Use unscaled bounding boxes to fix rounding errors
        const s = this.view.scale
        let w2 = bounds.width / s
        let h2 = bounds.height / s

        // Fits to the size of the background image if required
        if (this.backgroundImage != null && this.backgroundImage.width != null && this.backgroundImage.height != null) {
          w2 = Math.max(w2, this.backgroundImage.width - bounds.x / s)
          h2 = Math.max(h2, this.backgroundImage.height - bounds.y / s)
        }

        const b = ((keepOrigin) ? border : 2 * border) + margin + 1

        w1 -= b
        h1 -= b

        let s2 = (((ignoreWidth) ? h1 / h2 : (ignoreHeight) ? w1 / w2 : Math.min(w1 / w2, h1 / h2)))

        if (this.minFitScale != null) {
          s2 = Math.max(s2, this.minFitScale)
        }

        if (this.maxFitScale != null) {
          s2 = Math.min(s2, this.maxFitScale)
        }

        if (enabled) {
          if (!keepOrigin) {
            if (!mxUtils.hasScrollbars(this.container)) {
              const x0 = (bounds.x != null) ? Math.floor(this.view.translate.x - bounds.x / s + border / s2 + margin / 2) : border
              const y0 = (bounds.y != null) ? Math.floor(this.view.translate.y - bounds.y / s + border / s2 + margin / 2) : border

              this.view.scaleAndTranslate(s2, x0, y0)
            } else {
              this.view.setScale(s2)
              const b2 = this.getGraphBounds()

              if (b2.x != null) {
                this.container.scrollLeft = b2.x
              }

              if (b2.y != null) {
                this.container.scrollTop = b2.y
              }
            }
          } else if (this.view.scale !== s2) {
            this.view.setScale(s2)
          }
        } else {
          return s2
        }
      }
    }

    return this.view.scale
  }

  /**
   * Function: sizeDidChange
   *
   * Called when the size of the graph has changed. This implementation fires
   * a <size> event after updating the clipping region of the SVG element in
   * SVG-bases browsers.
   */
  mxGraph.prototype.sizeDidChange = function () {
    const bounds = this.getGraphBounds()

    if (this.container != null) {
      const border = this.getBorder()

      let width = Math.max(0, bounds.x) + bounds.width + 2 * border
      let height = Math.max(0, bounds.y) + bounds.height + 2 * border

      if (this.minimumContainerSize != null) {
        width = Math.max(width, this.minimumContainerSize.width)
        height = Math.max(height, this.minimumContainerSize.height)
      }

      if (this.resizeContainer) {
        this.doResizeContainer(width, height)
      }

      if (this.preferPageSize || (!mxClient.IS_IE && this.pageVisible)) {
        const size = this.getPreferredPageSize(bounds, Math.max(1, width), Math.max(1, height))

        if (size != null) {
          width = size.width * this.view.scale
          height = size.height * this.view.scale
        }
      }

      if (this.minimumGraphSize != null) {
        width = Math.max(width, this.minimumGraphSize.width * this.view.scale)
        height = Math.max(height, this.minimumGraphSize.height * this.view.scale)
      }

      width = Math.ceil(width)
      height = Math.ceil(height)

      if (this.dialect === mxConstants.DIALECT_SVG) {
        const root = this.view.getDrawPane().ownerSVGElement

        if (root != null) {
          root.style.minWidth = Math.max(1, width) + 'px'
          root.style.minHeight = Math.max(1, height) + 'px'
          root.style.width = '100%'
          root.style.height = '100%'
        }
      } else {
        this.view.canvas.style.minWidth = Math.max(1, width) + 'px'
        this.view.canvas.style.minHeight = Math.max(1, height) + 'px'
      }

      this.updatePageBreaks(this.pageBreaksVisible, width, height)
    }

    this.fireEvent(new mxEventObject(mxEvent.SIZE, 'bounds', bounds))
  }

  /**
   * Function: getCellStyle
   *
   * Returns an array of key, value pairs representing the cell style for the
   * given cell. If no string is defined in the model that specifies the
   * style, then the default style for the cell is returned or an empty object,
   * if no style can be found. Note: You should try and get the cell state
   * for the given cell and use the cached style in the state before using
   * this method.
   *
   * Parameters:
   *
   * cell - <mxCell> whose style should be returned as an array.
   * resolve - Optional boolean that specifies if any special values such as none
   * or default, special short URIs, image keys etc should be resolved in the
   * return value. Default is true.
   */
  mxGraph.prototype.getCellStyle = function (cell, resolve) {
    resolve = (resolve != null) ? resolve : true
    const stylename = this.model.getStyle(cell)
    let style

    // Gets the default style for the cell
    if (this.model.isEdge(cell)) {
      style = this.stylesheet.getDefaultEdgeStyle()
    } else {
      style = this.stylesheet.getDefaultVertexStyle()
    }

    // Resolves the stylename using the above as the default
    if (stylename != null && stylename.length > 0) {
      style = this.stylesheet.getCellStyle(stylename, style, resolve)
    } else if (style != null) {
      style = mxUtils.clone(style)
    }

    // Returns a non-null value if no style can be found
    if (style == null) {
      style = {}
    } else if (resolve) {
      style = this.postProcessCellStyle(cell, style)
    }

    return style
  }

  /**
   * Function: postProcessCellStyle
   *
   * Tries to resolve the value for the image style in the image bundles and
   * turns short data URIs as defined in mxImageBundle to data URIs as
   * defined in RFC 2397 of the IETF.
   */
  mxGraph.prototype.postProcessCellStyle = function (cell, style) {
    if (style != null) {
      const key = style[mxConstants.STYLE_IMAGE]
      let image = this.getImageFromBundles(key)

      if (image != null) {
        style[mxConstants.STYLE_IMAGE] = image
      } else {
        image = key
      }

      // Converts short data uris to normal data uris
      if (image != null && typeof image.substring === 'function' && image.substring(0, 11) === 'data:image/') {
        if (image.substring(0, 20) === 'data:image/svg+xml,<') {
          // Required for FF and IE11
          image = image.substring(0, 19) + encodeURIComponent(image.substring(19))
        } else if (image.substring(0, 22) !== 'data:image/svg+xml,%3C') {
          const comma = image.indexOf(',')

          // Adds base64 encoding prefix if needed
          if (comma > 0 && image.substring(comma - 7, comma + 1) !== ';base64,') {
            image = image.substring(0, comma) + ';base64,' + image.substring(comma + 1)
          }
        }

        style[mxConstants.STYLE_IMAGE] = image
      }
    }

    return style
  }
  /**
   * Function: toggleCellStyles
   *
   * Toggles the boolean value for the given key in the style of the given cells
   * and returns the new value as 0 or 1. If no cells are specified, then the
   * selection cells are used. For example, this can be used to toggle
   * <mxConstants.STYLE_ROUNDED> or any other style with a boolean value.
   *
   * Parameter:
   *
   * key - String representing the key for the boolean value to be toggled.
   * defaultValue - Optional boolean default value if no value is defined.
   * Default is false.
   * cells - Optional array of <mxCells> whose styles should be modified.
   * Default is the selection cells.
   */
  mxGraph.prototype.toggleCellStyles = function (key, defaultValue, cells) {
    defaultValue = (defaultValue != null) ? defaultValue : false
    cells = cells || this.getEditableCells(this.getSelectionCells())
    let value = null

    if (cells != null && cells.length > 0) {
      const style = this.getCurrentCellStyle(cells[0])
      value = (mxUtils.getValue(style, key, defaultValue)) ? 0 : 1
      this.setCellStyles(key, value, cells)
    }

    return value
  }
  /**
   * Function: setCellStyles
   *
   * Sets the key to value in the styles of the given cells. This will modify
   * the existing cell styles in-place and override any existing assignment
   * for the given key. If no cells are specified, then the selection cells
   * are changed. If no value is specified, then the respective key is
   * removed from the styles.
   *
   * Parameters:
   *
   * key - String representing the key to be assigned.
   * value - String representing the new value for the key.
   * cells - Optional array of <mxCells> to change the style for. Default is
   * the selection cells.
   */
  mxGraph.prototype.setCellStyles = function (key, value, cells) {
    cells = cells || this.getEditableCells(this.getSelectionCells())
    mxUtils.setCellStyles(this.model, cells, key, value)
  }
  /**
   * Function: setCellStyleFlags
   *
   * Sets or toggles the given bit for the given key in the styles of the
   * specified cells.
   *
   * Parameters:
   *
   * key - String representing the key to toggle the flag in.
   * flag - Integer that represents the bit to be toggled.
   * value - Boolean value to be used or null if the value should be toggled.
   * cells - Optional array of <mxCells> to change the style for. Default is
   * the selection cells.
   */
  mxGraph.prototype.setCellStyleFlags = function (key, flag, value, cells) {
    cells = cells || this.getEditableCells(this.getSelectionCells())

    if (cells != null && cells.length > 0) {
      if (value == null) {
        const style = this.getCurrentCellStyle(cells[0])
        const current = parseInt(style[key] || 0)
        value = !((current & flag) === flag)
      }

      mxUtils.setCellStyleFlags(this.model, cells, key, flag, value)
    }
  }
  /**
   * Function: getOriginForCell
   *
   * Returns the absolute origin for the given cell.
   */
  mxGraph.prototype.getOriginForCell = function (cell) {
    let parent = this.model.getParent(cell)
    const result = new mxPoint()

    while (parent != null) {
      const geo = this.getCellGeometry(parent)

      if (geo != null && !geo.relative) {
        result.x += geo.x
        result.y += geo.y
      }

      parent = this.model.getParent(parent)
    }

    return result
  }
  /**
   * Function: alignCells
   *
   * Aligns the given cells vertically or horizontally according to the given
   * alignment using the optional parameter as the coordinate.
   *
   * Parameters:
   *
   * align - Specifies the alignment. Possible values are all constants in
   * mxConstants with an ALIGN prefix.
   * cells - Array of <mxCells> to be aligned.
   * param - Optional coordinate for the alignment.
   */
  mxGraph.prototype.alignCells = function (align, cells, param) {
    if (cells == null) {
      cells = this.getMovableCells(this.getSelectionCells())
    }

    if (cells != null && cells.length > 1) {
      // Finds the required coordinate for the alignment
      if (param == null) {
        for (let i = 0; i < cells.length; i++) {
          const origin = this.getOriginForCell(cells[i])
          const geo = this.getCellGeometry(cells[i])

          if (!this.model.isEdge(cells[i]) && geo != null && !geo.relative) {
            if (param == null) {
              if (align === mxConstants.ALIGN_CENTER) {
                param = origin.x + geo.x + geo.width / 2
                break
              } else if (align === mxConstants.ALIGN_RIGHT) {
                param = origin.x + geo.x + geo.width
              } else if (align === mxConstants.ALIGN_TOP) {
                param = origin.y + geo.y
              } else if (align === mxConstants.ALIGN_MIDDLE) {
                param = origin.y + geo.y + geo.height / 2
                break
              } else if (align === mxConstants.ALIGN_BOTTOM) {
                param = origin.y + geo.y + geo.height
              } else {
                param = origin.x + geo.x
              }
            } else {
              if (align === mxConstants.ALIGN_RIGHT) {
                param = Math.max(param, origin.x + geo.x + geo.width)
              } else if (align === mxConstants.ALIGN_TOP) {
                param = Math.min(param, origin.y + geo.y)
              } else if (align === mxConstants.ALIGN_BOTTOM) {
                param = Math.max(param, origin.y + geo.y + geo.height)
              } else {
                param = Math.min(param, origin.x + geo.x)
              }
            }
          }
        }
      }

      // Aligns the cells to the coordinate
      if (param != null) {
        // Processes from parent to child
        cells = mxUtils.sortCells(cells)

        this.model.beginUpdate()
        try {
          for (let i = 0; i < cells.length; i++) {
            const origin = this.getOriginForCell(cells[i])
            let geo = this.getCellGeometry(cells[i])

            if (!this.model.isEdge(cells[i]) && geo != null && !geo.relative) {
              geo = geo.clone()

              if (align === mxConstants.ALIGN_CENTER) {
                geo.x = param - origin.x - geo.width / 2
              } else if (align === mxConstants.ALIGN_RIGHT) {
                geo.x = param - origin.x - geo.width
              } else if (align === mxConstants.ALIGN_TOP) {
                geo.y = param - origin.y
              } else if (align === mxConstants.ALIGN_MIDDLE) {
                geo.y = param - origin.y - geo.height / 2
              } else if (align === mxConstants.ALIGN_BOTTOM) {
                geo.y = param - origin.y - geo.height
              } else {
                geo.x = param - origin.x
              }

              this.resizeCell(cells[i], geo)
            }
          }

          this.fireEvent(new mxEventObject(mxEvent.ALIGN_CELLS, 'align', align, 'cells', cells))
        } finally {
          this.model.endUpdate()
        }
      }
    }

    return cells
  }
  /**
   * Function: orderCells
   *
   * Moves the given cells to the front or back. The change is carried out
   * using <cellsOrdered>. This method fires <mxEvent.ORDER_CELLS> while the
   * transaction is in progress.
   *
   * Parameters:
   *
   * back - Boolean that specifies if the cells should be moved to back.
   * cells - Array of <mxCells> to move to the background. If null is
   * specified then the selection cells are used.
   * increment - Optional boolean that specifies if the cells should be
   * moved by just one layer.
   */
  mxGraph.prototype.orderCells = function (back, cells, increment) {
    if (cells == null) {
      cells = mxUtils.sortCells(this.getEditableCells(this.getSelectionCells()), true)
    }

    this.model.beginUpdate()
    try {
      this.cellsOrdered(cells, back, increment)
      this.fireEvent(new mxEventObject(mxEvent.ORDER_CELLS, 'back', back, 'cells', cells, 'increment', increment))
    } finally {
      this.model.endUpdate()
    }

    return cells
  }
  /**
   * Function: cellsOrdered
   *
   * Moves the given cells to the front or back. This method fires
   * <mxEvent.CELLS_ORDERED> while the transaction is in progress.
   *
   * Parameters:
   *
   * cells - Array of <mxCells> whose order should be changed.
   * back - Boolean that specifies if the cells should be moved to back.
   * increment - Optional boolean that specifies if the cells should be
   * moved by just one layer.
   */
  mxGraph.prototype.cellsOrdered = function (cells, back, increment) {
    if (cells != null) {
      this.model.beginUpdate()
      try {
        for (let i = 0; i < cells.length; i++) {
          const parent = this.model.getParent(cells[i])

          if (back) {
            if (increment) {
              this.model.add(parent, cells[i], Math.max(0, parent.getIndex(cells[i]) - 1))
            } else {
              this.model.add(parent, cells[i], i)
            }
          } else {
            if (increment) {
              this.model.add(parent, cells[i], Math.min(this.model.getChildCount(parent) - 1, parent.getIndex(cells[i]) + 1))
            } else {
              this.model.add(parent, cells[i], this.model.getChildCount(parent) - 1)
            }
          }
        }

        this.fireEvent(new mxEventObject(mxEvent.CELLS_ORDERED, 'back', back, 'cells', cells, 'increment', increment))
      } finally {
        this.model.endUpdate()
      }
    }
  }
  /**
   * Function: groupCells
   *
   * Adds the cells into the given group. The change is carried out using
   * <cellsAdded>, <cellsMoved> and <cellsResized>. This method fires
   * <mxEvent.GROUP_CELLS> while the transaction is in progress. Returns the
   * new group. A group is only created if there is at least one entry in the
   * given array of cells.
   *
   * Parameters:
   *
   * group - <mxCell> that represents the target group. If null is specified
   * then a new group is created using <createGroupCell>.
   * border - Optional integer that specifies the border between the child
   * area and the group bounds. Default is 0.
   * cells - Optional array of <mxCells> to be grouped. If null is specified
   * then the selection cells are used.
   */
  mxGraph.prototype.groupCells = function (group, border, cells) {
    if (cells == null) {
      cells = mxUtils.sortCells(this.getSelectionCells(), true)
    }

    cells = this.getCellsForGroup(cells)

    if (group == null) {
      group = this.createGroupCell(cells)
    }

    const bounds = this.getBoundsForGroup(group, cells, border)

    if (cells.length > 1 && bounds != null) {
      // Uses parent of group or previous parent of first child
      let parent = this.model.getParent(group)

      if (parent == null) {
        parent = this.model.getParent(cells[0])
      }

      this.model.beginUpdate()
      try {
        // Checks if the group has a geometry and
        // creates one if one does not exist
        if (this.getCellGeometry(group) == null) {
          this.model.setGeometry(group, new mxGeometry())
        }

        // Resizes the group
        this.cellsResized([group], [bounds], false)

        // Adds the group into the parent
        let index = this.model.getChildCount(parent)
        this.cellsAdded([group], parent, index, null, null, false, false, false)

        // Adds the children into the group and moves
        index = this.model.getChildCount(group)
        this.cellsAdded(cells, group, index, null, null, false, false, false)
        this.cellsMoved(cells, -bounds.x, -bounds.y, false, false, false)

        this.fireEvent(new mxEventObject(mxEvent.GROUP_CELLS, 'group', group, 'border', border, 'cells', cells))
      } finally {
        this.model.endUpdate()
      }
    }

    return group
  }
  /**
   * Function: ungroupCells
   *
   * Ungroups the given cells by moving the children the children to their
   * parents parent and removing the empty groups. Returns the children that
   * have been removed from the groups.
   *
   * Parameters:
   *
   * cells - Array of cells to be ungrouped. If null is specified then the
   * selection cells are used.
   */
  mxGraph.prototype.ungroupCells = function (cells) {
    let result = []

    if (cells == null) {
      cells = this.getCellsForUngroup()
    }

    if (cells != null && cells.length > 0) {
      this.model.beginUpdate()
      try {
        for (let i = 0; i < cells.length; i++) {
          let children = this.model.getChildren(cells[i])

          if (children != null && children.length > 0) {
            children = children.slice()
            const parent = this.model.getParent(cells[i])
            const index = this.model.getChildCount(parent)

            this.cellsAdded(children, parent, index, null, null, true)
            result = result.concat(children)

            // Fix relative child cells
            for (let j = 0; j < children.length; j++) {
              if (this.model.isVertex(children[j])) {
                const state = this.view.getState(children[j])
                let geo = this.getCellGeometry(children[j])

                if (state != null && geo != null && geo.relative) {
                  geo = geo.clone()
                  geo.x = state.origin.x
                  geo.y = state.origin.y
                  geo.relative = false

                  this.model.setGeometry(children[j], geo)
                }
              }
            }
          }
        }

        this.removeCellsAfterUngroup(cells)
        this.fireEvent(new mxEventObject(mxEvent.UNGROUP_CELLS, 'cells', cells))
      } finally {
        this.model.endUpdate()
      }
    }

    return result
  }
  /**
   * Function: getCellsForUngroup
   *
   * Returns the selection cells that can be ungrouped.
   */
  mxGraph.prototype.getCellsForUngroup = function () {
    const cells = this.getEditableCells(this.getSelectionCells())

    // Finds the cells with children
    const tmp = []

    for (let i = 0; i < cells.length; i++) {
      if (this.model.isVertex(cells[i]) && this.model.getChildCount(cells[i]) > 0) {
        tmp.push(cells[i])
      }
    }

    return tmp
  }
  /**
   * Function: cloneCells
   *
   * Returns the clones for the given cells. The clones are created recursively
   * using <mxGraphModel.cloneCells>. If the terminal of an edge is not in the
   * given array, then the respective end is assigned a terminal point and the
   * terminal is removed.
   *
   * Parameters:
   *
   * cells - Array of <mxCells> to be cloned.
   * allowInvalidEdges - Optional boolean that specifies if invalid edges
   * should be cloned. Default is true.
   * mapping - Optional mapping for existing clones.
   * keepPosition - Optional boolean indicating if the position of the cells should
   * be updated to reflect the lost parent cell. Default is false.
   */
  mxGraph.prototype.cloneCells = function (cells, allowInvalidEdges, mapping, keepPosition) {
    allowInvalidEdges = (allowInvalidEdges != null) ? allowInvalidEdges : true
    let clones = null

    if (cells != null) {
      // Creates a dictionary for fast lookups
      const dict = new mxDictionary()
      const tmp = []

      for (let i = 0; i < cells.length; i++) {
        dict.put(cells[i], true)
        tmp.push(cells[i])
      }

      if (tmp.length > 0) {
        const scale = this.view.scale
        const trans = this.view.translate
        clones = this.model.cloneCells(cells, true, mapping)

        for (let i = 0; i < cells.length; i++) {
          if (!allowInvalidEdges && this.model.isEdge(clones[i]) && this.getEdgeValidationError(clones[i], this.model.getTerminal(clones[i], true), this.model.getTerminal(clones[i], false)) != null) {
            clones[i] = null
          } else {
            const g = this.model.getGeometry(clones[i])

            if (g != null) {
              const state = this.view.getState(cells[i])
              const pstate = this.view.getState(this.model.getParent(cells[i]))

              if (state != null && pstate != null) {
                const dx = pstate.origin.x
                const dy = pstate.origin.y

                if (this.model.isEdge(clones[i])) {
                  const pts = state.absolutePoints

                  if (pts != null) {
                    // Checks if the source is cloned or sets the terminal point
                    let src = this.model.getTerminal(cells[i], true)

                    if (src != null) {
                      while (src != null && !dict.get(src)) {
                        src = this.model.getParent(src)
                      }

                      if (src == null && pts[0] != null) {
                        g.setTerminalPoint(new mxPoint(Math.round(pts[0].x / scale - trans.x - dx), Math.round(pts[0].y / scale - trans.y - dy)), true)
                      }
                    }

                    if (!keepPosition) {
                      const pt = g.getTerminalPoint(true)

                      if (pt != null) {
                        pt.x += dx
                        pt.y += dy
                      }
                    }

                    // Checks if the target is cloned or sets the terminal point
                    let trg = this.model.getTerminal(cells[i], false)

                    if (trg != null) {
                      while (trg != null && !dict.get(trg)) {
                        trg = this.model.getParent(trg)
                      }

                      const n = pts.length - 1

                      if (trg == null && pts[n] != null) {
                        g.setTerminalPoint(new mxPoint(Math.round(pts[n].x / scale - trans.x - dx), Math.round(pts[n].y / scale - trans.y - dy)), false)
                      }
                    }

                    if (!keepPosition) {
                      const pt = g.getTerminalPoint(false)

                      if (pt != null) {
                        pt.x += dx
                        pt.y += dy
                      }
                    }

                    // Translates the control points
                    const points = g.points

                    if (!keepPosition && points != null) {
                      for (let j = 0; j < points.length; j++) {
                        if (points[j] != null) {
                          points[j].x += dx
                          points[j].y += dy
                        }
                      }
                    }
                  }
                } else if (!keepPosition) {
                  g.translate(dx, dy)
                }
              }
            }
          }
        }
      } else {
        clones = []
      }
    }

    return clones
  }
  /**
   * Function: cellsAdded
   *
   * Adds the specified cells to the given parent. This method fires
   * <mxEvent.CELLS_ADDED> while the transaction is in progress.
   */
  mxGraph.prototype.cellsAdded = function (cells, parent, index, source, target, absolute, constrain, extend) {
    if (cells != null && parent != null && index != null) {
      this.model.beginUpdate()
      try {
        const parentState = (absolute) ? this.view.getState(parent) : null
        const o1 = (parentState != null) ? parentState.origin : null
        const zero = new mxPoint(0, 0)

        for (let i = 0; i < cells.length; i++) {
          if (cells[i] == null) {
            index--
          } else {
            const previous = this.model.getParent(cells[i])

            // Keeps the cell at its absolute location
            if (o1 != null && cells[i] !== parent && parent !== previous) {
              const oldState = this.view.getState(previous)
              const o2 = (oldState != null) ? oldState.origin : zero
              let geo = this.model.getGeometry(cells[i])

              if (geo != null) {
                const dx = o2.x - o1.x
                const dy = o2.y - o1.y

                // FIXME: Cells should always be inserted first before any other edit
                // to avoid forward references in sessions.
                geo = geo.clone()
                geo.translate(dx, dy)

                if (!geo.relative && this.model.isVertex(cells[i]) && !this.isAllowNegativeCoordinates()) {
                  geo.x = Math.max(0, geo.x)
                  geo.y = Math.max(0, geo.y)
                }

                this.model.setGeometry(cells[i], geo)
              }
            }

            // Decrements all following indices
            // if cell is already in parent
            if (parent === previous && index + i > this.model.getChildCount(parent)) {
              index--
            }

            // Stops maintaining edge parent on edges that are being added
            const updateEdgeParent = this.model.updateEdgeParent

            this.model.updateEdgeParent = function (edge, root) {
              if (mxUtils.indexOf(cells, edge) < 0) {
                updateEdgeParent.apply(this, arguments)
              }
            }

            this.model.add(parent, cells[i], index + i)
            this.model.updateEdgeParent = updateEdgeParent

            if (this.autoSizeCellsOnAdd) {
              this.autoSizeCell(cells[i], true)
            }

            // Extends the parent or constrains the child
            if ((extend == null || extend) && this.isExtendParentsOnAdd(cells[i]) && this.isExtendParent(cells[i])) {
              this.extendParent(cells[i])
            }

            // Additionally constrains the child after extending the parent
            if (constrain == null || constrain) {
              this.constrainChild(cells[i])
            }

            // Sets the source terminal
            if (source != null) {
              this.cellConnected(cells[i], source, true)
            }

            // Sets the target terminal
            if (target != null) {
              this.cellConnected(cells[i], target, false)
            }
          }
        }

        this.fireEvent(new mxEventObject(mxEvent.CELLS_ADDED, 'cells', cells, 'parent', parent, 'index', index, 'source', source, 'target', target, 'absolute', absolute))
      } finally {
        this.model.endUpdate()
      }
    }
  }
  /**
   * Function: splitEdge
   *
   * Splits the given edge by adding the newEdge between the previous source
   * and the given cell and reconnecting the source of the given edge to the
   * given cell. This method fires <mxEvent.SPLIT_EDGE> while the transaction
   * is in progress. Returns the new edge that was inserted.
   *
   * Parameters:
   *
   * edge - <mxCell> that represents the edge to be splitted.
   * cells - <mxCells> that represents the cells to insert into the edge.
   * newEdge - <mxCell> that represents the edge to be inserted.
   * dx - Optional integer that specifies the vector to move the cells.
   * dy - Optional integer that specifies the vector to move the cells.
   * x - Integer that specifies the x-coordinate of the drop location.
   * y - Integer that specifies the y-coordinate of the drop location.
   * parent - Optional parent to insert the cell. If null the parent of
   * the edge is used.
   */
  mxGraph.prototype.splitEdge = function (edge, cells, newEdge, dx, dy, x, y, parent) {
    dx = dx || 0
    dy = dy || 0

    parent = (parent != null) ? parent : this.model.getParent(edge)
    const source = this.model.getTerminal(edge, true)

    this.model.beginUpdate()
    try {
      if (newEdge == null) {
        newEdge = this.cloneCell(edge)

        // Removes waypoints before/after new cell
        const state = this.view.getState(edge)
        let geo = this.getCellGeometry(newEdge)

        if (geo != null && geo.points != null && state != null) {
          const t = this.view.translate
          const s = this.view.scale
          const idx = mxUtils.findNearestSegment(state, (dx + t.x) * s, (dy + t.y) * s)
          geo.points = geo.points.slice(0, idx)

          geo = this.getCellGeometry(edge)

          if (geo != null && geo.points != null) {
            geo = geo.clone()
            geo.points = geo.points.slice(idx)
            this.model.setGeometry(edge, geo)
          }
        }
      }

      this.cellsMoved(cells, dx, dy, false, false)
      this.cellsAdded([newEdge], parent, this.model.getChildCount(parent), source, cells[0], false)
      this.cellsAdded(cells, parent, this.model.getChildCount(parent), null, null, true)
      this.cellConnected(edge, cells[0], true)
      this.fireEvent(new mxEventObject(mxEvent.SPLIT_EDGE, 'edge', edge, 'cells', cells, 'newEdge', newEdge, 'dx', dx, 'dy', dy))
    } finally {
      this.model.endUpdate()
    }

    return newEdge
  }
  /**
   * Function: updateAlternateBounds
   *
   * Updates or sets the alternate bounds in the given geometry for the given
   * cell depending on whether the cell is going to be collapsed. If no
   * alternate bounds are defined in the geometry and
   * <collapseToPreferredSize> is true, then the preferred size is used for
   * the alternate bounds. The top, left corner is always kept at the same
   * location.
   *
   * Parameters:
   *
   * cell - <mxCell> for which the geometry is being udpated.
   * g - <mxGeometry> for which the alternate bounds should be updated.
   * willCollapse - Boolean indicating if the cell is going to be collapsed.
   */
  mxGraph.prototype.updateAlternateBounds = function (cell, geo, willCollapse) {
    if (cell != null && geo != null) {
      const style = this.getCurrentCellStyle(cell)

      if (geo.alternateBounds == null) {
        let bounds = geo

        if (this.collapseToPreferredSize) {
          const gridEnabled = mxUtils.getValue(style, mxConstants.STYLE_AUTOSIZE_GRID, (this.gridEnabled) ? '1' : '0') === '1'
          const tmp = this.getPreferredSizeForCell(cell, null, gridEnabled)

          if (tmp != null) {
            bounds = tmp

            const startSize = mxUtils.getValue(style, mxConstants.STYLE_STARTSIZE)

            if (startSize > 0) {
              bounds.height = Math.max(bounds.height, startSize)
            }
          }
        }

        geo.alternateBounds = new mxRectangle(0, 0, bounds.width, bounds.height)
      }

      if (geo.alternateBounds != null) {
        geo.alternateBounds.x = geo.x
        geo.alternateBounds.y = geo.y

        const alpha = mxUtils.toRadians(style[mxConstants.STYLE_ROTATION] || 0)

        if (alpha !== 0) {
          const dx = geo.alternateBounds.getCenterX() - geo.getCenterX()
          const dy = geo.alternateBounds.getCenterY() - geo.getCenterY()

          const cos = Math.cos(alpha)
          const sin = Math.sin(alpha)

          const dx2 = cos * dx - sin * dy
          const dy2 = sin * dx + cos * dy

          geo.alternateBounds.x += dx2 - dx
          geo.alternateBounds.y += dy2 - dy
        }
      }
    }
  }
  /**
   * Function: cellSizeUpdated
   *
   * Updates the size of the given cell in the model using
   * <getPreferredSizeForCell> to get the new size.
   *
   * Parameters:
   *
   * cell - <mxCell> for which the size should be changed.
   * ignoreChildren - Boolean indicating if children should be ignored. Default
   * is false.
   */
  mxGraph.prototype.cellSizeUpdated = function (cell, ignoreChildren) {
    if (cell != null) {
      this.model.beginUpdate()
      try {
        const style = this.getCellStyle(cell)
        let geo = this.model.getGeometry(cell)

        if (geo != null) {
          let w = null
          const fixedWidth = mxUtils.getValue(style, mxConstants.STYLE_FIXED_WIDTH, false)

          if (fixedWidth) {
            w = geo.width - 2 * parseFloat(mxUtils.getValue(style, mxConstants.STYLE_SPACING, 2)) - parseFloat(mxUtils.getValue(style, mxConstants.STYLE_SPACING_LEFT, 0)) - parseFloat(mxUtils.getValue(style, mxConstants.STYLE_SPACING_RIGHT, 0))
          }

          const gridEnabled = mxUtils.getValue(style, mxConstants.STYLE_AUTOSIZE_GRID, (this.gridEnabled) ? '1' : '0') === '1'
          const size = this.getPreferredSizeForCell(cell, w, gridEnabled)

          if (size != null) {
            const collapsed = this.isCellCollapsed(cell)
            geo = geo.clone()

            if (this.isSwimlane(cell)) {
              let cellStyle = this.model.getStyle(cell)

              if (cellStyle == null) {
                cellStyle = ''
              }

              if (mxUtils.getValue(style, mxConstants.STYLE_HORIZONTAL, true)) {
                cellStyle = mxUtils.setStyle(cellStyle, mxConstants.STYLE_STARTSIZE, size.height + 8)

                if (collapsed) {
                  geo.height = size.height + 8
                }

                if (!fixedWidth) {
                  geo.width = size.width
                }
              } else {
                cellStyle = mxUtils.setStyle(cellStyle, mxConstants.STYLE_STARTSIZE, size.width + 8)

                if (collapsed && !fixedWidth) {
                  geo.width = size.width + 8
                }

                geo.height = size.height
              }

              this.model.setStyle(cell, cellStyle)
            } else {
              const state = this.view.createState(cell)
              const align = (state.style[mxConstants.STYLE_ALIGN] || mxConstants.ALIGN_CENTER)
              const valign = this.getVerticalAlign(state)

              if (state.style[mxConstants.STYLE_ASPECT] === 'fixed') {
                size.height = Math.round((geo.height * size.width * 100) / geo.width) / 100
              }

              if (valign === mxConstants.ALIGN_BOTTOM) {
                geo.y += geo.height - size.height
              } else if (valign === mxConstants.ALIGN_MIDDLE) {
                geo.y += Math.round((geo.height - size.height) / 2)
              }

              geo.height = size.height

              if (!fixedWidth) {
                if (align === mxConstants.ALIGN_RIGHT) {
                  geo.x += geo.width - size.width
                } else if (align === mxConstants.ALIGN_CENTER) {
                  geo.x += Math.round((geo.width - size.width) / 2)
                }

                geo.width = size.width
              }
            }

            if (!ignoreChildren && !collapsed) {
              const bounds = this.view.getBounds(this.model.getChildren(cell))

              if (bounds != null) {
                const tr = this.view.translate
                const scale = this.view.scale

                const width = (bounds.x + bounds.width) / scale - geo.x - tr.x
                const height = (bounds.y + bounds.height) / scale - geo.y - tr.y

                geo.height = Math.max(geo.height, height)

                if (!fixedWidth) {
                  geo.width = Math.max(geo.width, width)
                }
              }
            }

            this.cellsResized([cell], [geo], false)
          }
        }
      } finally {
        this.model.endUpdate()
      }
    }
  }
  /**
   * Function: getPreferredSizeForCell
   *
   * Returns the preferred width and height of the given <mxCell> as an
   * <mxRectangle>. To implement a minimum width, add a new style eg.
   * minWidth in the vertex and override this method as follows.
   *
   * (code)
   * var graphGetPreferredSizeForCell = graph.getPreferredSizeForCell;
   * graph.getPreferredSizeForCell = function(cell)
   * {
   *   var result = graphGetPreferredSizeForCell.apply(this, arguments);
   *   var style = this.getCellStyle(cell);
   *
   *   if (style['minWidth'] > 0)
   *   {
   *     result.width = Math.max(style['minWidth'], result.width);
   *   }
   *
   *   return result;
   * };
   * (end)
   *
   * Parameters:
   *
   * cell - <mxCell> for which the preferred size should be returned.
   * textWidth - Optional maximum text width for word wrapping.
   */
  mxGraph.prototype.getPreferredSizeForCell = function (cell, textWidth, gridEnabled) {
    gridEnabled = (gridEnabled != null) ? gridEnabled : this.gridEnabled
    let result = null

    if (cell != null) {
      const state = this.view.createState(cell)
      const style = state.style

      if (!this.model.isEdge(cell)) {
        const fontSize = style[mxConstants.STYLE_FONTSIZE] || mxConstants.DEFAULT_FONTSIZE
        let dx = 0
        let dy = 0

        // Adds dimension of image if shape is a label
        if (this.getImage(state) != null || style[mxConstants.STYLE_IMAGE] != null) {
          if (style[mxConstants.STYLE_SHAPE] === mxConstants.SHAPE_LABEL) {
            if (style[mxConstants.STYLE_VERTICAL_ALIGN] === mxConstants.ALIGN_MIDDLE) {
              dx += parseFloat(mxUtils.getValue(style, mxConstants.STYLE_IMAGE_WIDTH, mxLabel.prototype.imageSize))
            }

            if (style[mxConstants.STYLE_ALIGN] !== mxConstants.ALIGN_CENTER) {
              dy += parseFloat(mxUtils.getValue(style, mxConstants.STYLE_IMAGE_HEIGHT, mxLabel.prototype.imageSize))
            }
          }
        }

        // Adds spacings
        dx += 2 * parseFloat(mxUtils.getValue(style, mxConstants.STYLE_SPACING, 2))
        dx += parseFloat(mxUtils.getValue(style, mxConstants.STYLE_SPACING_LEFT, 2))
        dx += parseFloat(mxUtils.getValue(style, mxConstants.STYLE_SPACING_RIGHT, 2))

        dy += 2 * parseFloat(mxUtils.getValue(style, mxConstants.STYLE_SPACING, 2))
        dy += parseFloat(mxUtils.getValue(style, mxConstants.STYLE_SPACING_TOP, 2))
        dy += parseFloat(mxUtils.getValue(style, mxConstants.STYLE_SPACING_BOTTOM, 2))

        // Add spacing for collapse/expand icon
        // LATER: Check alignment and use constants
        // for image spacing
        const image = this.getFoldingImage(state)

        if (image != null) {
          dx += image.width + 8
        }

        // Adds space for label
        let value = this.cellRenderer.getLabelValue(state)

        if (value != null && value.length > 0) {
          if (!this.isHtmlLabel(state.cell)) {
            value = mxUtils.htmlEntities(value, false)
          } else if (textWidth != null) {
            textWidth += mxSvgCanvas2D.prototype.foreignObjectPadding
          }

          value = value.replace(/\n/g, '<br>')

          const size = mxUtils.getSizeForString(value, fontSize, style[mxConstants.STYLE_FONTFAMILY], textWidth, style[mxConstants.STYLE_FONTSTYLE])
          let width = size.width + dx
          let height = size.height + dy

          if (!mxUtils.getValue(style, mxConstants.STYLE_HORIZONTAL, true)) {
            [height, width] = [width, height]
          }

          if (gridEnabled) {
            width = this.snap(width + this.gridSize / 2)
            height = this.snap(height + this.gridSize / 2)
          }

          result = new mxRectangle(0, 0, width, height)
        } else {
          const gs2 = 4 * this.gridSize
          result = new mxRectangle(0, 0, gs2, gs2)
        }
      }
    }

    return result
  }
  /**
   * Function: cellResized
   *
   * Resizes the parents recursively so that they contain the complete area
   * of the resized child cell.
   *
   * Parameters:
   *
   * cell - <mxCell> whose bounds should be changed.
   * bounds - <mxRectangles> that represent the new bounds.
   * ignoreRelative - Boolean that indicates if relative cells should be ignored.
   * recurse - Optional boolean that specifies if the children should be resized.
   */
  mxGraph.prototype.cellResized = function (cell, bounds, ignoreRelative, recurse) {
    const prev = this.model.getGeometry(cell)

    if (prev != null && (prev.x !== bounds.x || prev.y !== bounds.y || prev.width !== bounds.width || prev.height !== bounds.height)) {
      const geo = prev.clone()

      if (!ignoreRelative && geo.relative) {
        const offset = geo.offset

        if (offset != null) {
          offset.x += bounds.x - geo.x
          offset.y += bounds.y - geo.y
        }
      } else {
        geo.x = bounds.x
        geo.y = bounds.y
      }

      geo.width = bounds.width
      geo.height = bounds.height

      if (!geo.relative && this.model.isVertex(cell) && !this.isAllowNegativeCoordinates()) {
        geo.x = Math.max(0, geo.x)
        geo.y = Math.max(0, geo.y)
      }

      this.model.beginUpdate()
      try {
        if (recurse) {
          this.resizeChildCells(cell, geo)
        }

        this.model.setGeometry(cell, geo)

        if (!this.isCellCollapsed(cell)) {
          this.constrainChildCells(cell)
        }
      } finally {
        this.model.endUpdate()
      }
    }

    return prev
  }

  /**
   * Function: translateCell
   *
   * Translates the geometry of the given cell and stores the new,
   * translated geometry in the model as an atomic change.
   */
  mxGraph.prototype.translateCell = function (cell, dx, dy) {
    let geo = this.model.getGeometry(cell)

    if (geo != null) {
      dx = parseFloat(dx)
      dy = parseFloat(dy)
      geo = geo.clone()
      geo.translate(dx, dy, this.model.isEdge(cell))

      if (!geo.relative && this.model.isVertex(cell) && !this.isAllowNegativeCoordinates()) {
        geo.x = Math.max(0, parseFloat(`${geo.x}`))
        geo.y = Math.max(0, parseFloat(`${geo.y}`))
      }

      if (geo.relative && !this.model.isEdge(cell)) {
        const parent = this.model.getParent(cell)
        let angle = 0

        if (this.model.isVertex(parent)) {
          const style = this.getCurrentCellStyle(parent)
          angle = mxUtils.getValue(style, mxConstants.STYLE_ROTATION, 0)
        }

        if (angle !== 0) {
          const rad = mxUtils.toRadians(-angle)
          const cos = Math.cos(rad)
          const sin = Math.sin(rad)
          const pt = mxUtils.getRotatedPoint(new mxPoint(dx, dy), cos, sin, new mxPoint(0, 0))
          dx = pt.x
          dy = pt.y
        }

        if (geo.offset == null) {
          geo.offset = new mxPoint(Math.round(dx), Math.round(dy))
        } else {
          geo.offset.x = Math.round(parseFloat(`${geo.offset.x + dx}`))
          geo.offset.y = Math.round(parseFloat(`${geo.offset.y + dy}`))
        }
      }

      this.model.setGeometry(cell, geo)
    }
  }

  /**
   * Function: enterGroup
   *
   * Uses the given cell as the root of the displayed cell hierarchy. If no
   * cell is specified then the selection cell is used. The cell is only used
   * if <isValidRoot> returns true.
   *
   * Parameters:
   *
   * cell - Optional <mxCell> to be used as the new root. Default is the
   * selection cell.
   */
  mxGraph.prototype.enterGroup = function (cell) {
    cell = cell || this.getSelectionCell()

    if (cell != null && this.isValidRoot(cell)) {
      this.view.setCurrentRoot(cell)
      this.clearSelection()

      const gb = mxRectangle.fromRectangle(this.getGraphBounds())
      gb.x -= this.view.translate.x
      gb.y -= this.view.translate.y
      this.scrollRectToVisible(gb)
    }
  }
  /**
   * Function: exitGroup
   *
   * Changes the current root to the next valid root in the displayed cell
   * hierarchy.
   */
  mxGraph.prototype.exitGroup = function () {
    const root = this.model.getRoot()
    const current = this.getCurrentRoot()

    if (current != null) {
      let next = this.model.getParent(current)

      // Finds the next valid root in the hierarchy
      while (next !== root && !this.isValidRoot(next) && this.model.getParent(next) !== root) {
        next = this.model.getParent(next)
      }

      // Clears the current root if the new root is
      // the model's root or one of the layers.
      if (next === root || this.model.getParent(next) === root) {
        this.view.setCurrentRoot(null)
      } else {
        this.view.setCurrentRoot(next)
      }

      const state = this.view.getState(current)

      // Selects the previous root in the graph
      if (state != null) {
        this.setSelectionCell(current)
        this.scrollCellToVisible(current)
      }
    }
  }
  /**
   * Function: getBoundingBoxFromGeometry
   *
   * Returns the bounding box for the geometries of the vertices in the
   * given array of cells. This can be used to find the graph bounds during
   * a layout operation (ie. before the last endUpdate) as follows:
   *
   * (code)
   * var cells = graph.getChildCells(graph.getDefaultParent(), true, true);
   * var bounds = graph.getBoundingBoxFromGeometry(cells, true);
   * (end)
   *
   * This can then be used to move cells to the origin:
   *
   * (code)
   * if (bounds.x < 0 || bounds.y < 0)
   * {
   *   graph.moveCells(cells, -Math.min(bounds.x, 0), -Math.min(bounds.y, 0))
   * }
   * (end)
   *
   * Or to translate the graph view:
   *
   * (code)
   * if (bounds.x < 0 || bounds.y < 0)
   * {
   *   graph.view.setTranslate(-Math.min(bounds.x, 0), -Math.min(bounds.y, 0));
   * }
   * (end)
   *
   * Parameters:
   *
   * cells - Array of <mxCells> whose bounds should be returned.
   * includeEdges - Specifies if edge bounds should be included by computing
   * the bounding box for all points in geometry. Default is false.
   * ancestors - Optional array of ancestor cells to be taken into account
   * when computing the absolute position of child cells.
   * includeStrokeWidth - Optional boolean to indicate if the strokeWidth
   * should be added to the bounding box. Default is false.
   */
  mxGraph.prototype.getBoundingBoxFromGeometry = function (cells, includeEdges, ancestors, includeStrokeWidth) {
    includeEdges = (includeEdges != null) ? includeEdges : false
    let result = null

    if (cells != null) {
      for (let i = 0; i < cells.length; i++) {
        if (includeEdges || this.model.isVertex(cells[i])) {
          // Computes the bounding box for the points in the geometry
          const geo = this.getCellGeometry(cells[i])

          if (geo != null) {
            const parent = this.model.getParent(cells[i])
            let bbox = null

            if (this.model.isEdge(cells[i])) {
              const addPoint = function (pt) {
                if (pt != null) {
                  if (bbox == null) {
                    bbox = new mxRectangle(pt.x, pt.y, 0, 0)
                  } else {
                    bbox.add(new mxRectangle(pt.x, pt.y, 0, 0))
                  }
                }
              }

              if (this.model.getTerminal(cells[i], true) == null) {
                addPoint(geo.getTerminalPoint(true))
              }

              if (this.model.getTerminal(cells[i], false) == null) {
                addPoint(geo.getTerminalPoint(false))
              }

              const pts = geo.points

              if (pts != null) {
                for (let j = 0; j < pts.length; j++) {
                  addPoint(pts[j])
                }
              }

              if (bbox != null && this.model.isVertex(parent) && mxUtils.indexOf((ancestors != null) ? ancestors : cells, parent) >= 0) {
                const tmp = this.getBoundingBoxFromGeometry([parent], false, (ancestors != null) ? ancestors : cells, includeStrokeWidth)

                if (tmp != null) {
                  bbox.x += tmp.x
                  bbox.y += tmp.y
                }
              }
            } else {
              if (geo.relative) {
                if (this.model.isVertex(parent) && parent !== this.view.currentRoot) {
                  const tmp = this.getBoundingBoxFromGeometry([parent], false, (ancestors != null) ? ancestors : cells, includeStrokeWidth)

                  if (tmp != null) {
                    bbox = new mxRectangle(geo.x * tmp.width, geo.y * tmp.height, geo.width, geo.height)

                    if (mxUtils.indexOf((ancestors != null) ? ancestors : cells, parent) >= 0) {
                      bbox.x += tmp.x
                      bbox.y += tmp.y
                    }
                  }
                }
              } else {
                bbox = mxRectangle.fromRectangle(geo)

                if (this.model.isVertex(parent) && mxUtils.indexOf((ancestors != null) ? ancestors : cells, parent) >= 0) {
                  const tmp = this.getBoundingBoxFromGeometry([parent], false, (ancestors != null) ? ancestors : cells, includeStrokeWidth)

                  if (tmp != null) {
                    bbox.x += tmp.x
                    bbox.y += tmp.y
                  }
                }
              }

              if (bbox != null && geo.offset != null) {
                bbox.x += geo.offset.x
                bbox.y += geo.offset.y
              }

              const style = this.getCurrentCellStyle(cells[i])

              if (bbox != null) {
                const angle = mxUtils.getValue(style, mxConstants.STYLE_ROTATION, 0)

                if (angle !== 0) {
                  bbox = mxUtils.getBoundingBox(bbox, angle)
                }
              }
            }

            if (bbox != null) {
              if (includeStrokeWidth) {
                const style = this.getCurrentCellStyle(cells[i], true)

                if (style != null) {
                  const strokeWidth = mxUtils.getNumber(style, mxConstants.STYLE_STROKEWIDTH, 1)
                  bbox.grow(strokeWidth / 2)
                }
              }

              if (result == null) {
                result = mxRectangle.fromRectangle(bbox)
              } else {
                result.add(bbox)
              }
            }
          }
        }
      }
    }

    return result
  }
  /**
   * Function: panGraph
   *
   * Shifts the graph display by the given amount. This is used to preview
   * panning operations, use <mxGraphView.setTranslate> to set a persistent
   * translation of the view. Fires <mxEvent.PAN>.
   *
   * Parameters:
   *
   * dx - Amount to shift the graph along the x-axis.
   * dy - Amount to shift the graph along the y-axis.
   */
  mxGraph.prototype.panGraph = function (dx, dy) {
    if (this.useScrollbarsForPanning && mxUtils.hasScrollbars(this.container)) {
      this.container.scrollLeft = -dx
      this.container.scrollTop = -dy
    } else {
      const canvas = this.view.getCanvas()

      if (this.dialect === mxConstants.DIALECT_SVG) {
        // Puts everything inside the container in a DIV so that it
        // can be moved without changing the state of the container
        if (dx === 0 && dy === 0) {
          // Workaround for ignored removeAttribute on SVG element in IE9 standards
          if (mxClient.IS_IE) {
            canvas.setAttribute('transform', 'translate(' + dx + ',' + dy + ')')
          } else {
            canvas.removeAttribute('transform')
          }

          if (this.shiftPreview1 != null) {
            let child = this.shiftPreview1.firstChild

            while (child != null) {
              const next = child.nextSibling
              this.container.appendChild(child)
              child = next
            }

            if (this.shiftPreview1.parentNode != null) {
              this.shiftPreview1.parentNode.removeChild(this.shiftPreview1)
            }

            this.shiftPreview1 = null

            this.container.appendChild(canvas.parentNode)

            child = this.shiftPreview2.firstChild

            while (child != null) {
              const next = child.nextSibling
              this.container.appendChild(child)
              child = next
            }

            if (this.shiftPreview2.parentNode != null) {
              this.shiftPreview2.parentNode.removeChild(this.shiftPreview2)
            }

            this.shiftPreview2 = null
          }
        } else {
          canvas.setAttribute('transform', 'translate(' + dx + ',' + dy + ')')

          if (this.shiftPreview1 == null) {
            // Needs two divs for stuff before and after the SVG element
            this.shiftPreview1 = document.createElement('div')
            this.shiftPreview1.style.position = 'absolute'
            this.shiftPreview1.style.overflow = 'visible'

            this.shiftPreview2 = document.createElement('div')
            this.shiftPreview2.style.position = 'absolute'
            this.shiftPreview2.style.overflow = 'visible'

            let current = this.shiftPreview1
            let child = this.container.firstChild

            while (child != null) {
              const next = child.nextSibling

              // SVG element is moved via transform attribute
              if (child !== canvas.parentNode) {
                current.appendChild(child)
              } else {
                current = this.shiftPreview2
              }

              child = next
            }

            // Inserts elements only if not empty
            if (this.shiftPreview1.firstChild != null) {
              if (canvas.parentNode != null && canvas.parentNode.parentNode === this.container) {
                this.container.insertBefore(this.shiftPreview1, canvas.parentNode)
              } else {
                this.container.appendChild(this.shiftPreview1)
              }
            }

            if (this.shiftPreview2.firstChild != null) {
              this.container.appendChild(this.shiftPreview2)
            }
          }

          this.shiftPreview1.style.left = dx + 'px'
          this.shiftPreview1.style.top = dy + 'px'
          this.shiftPreview2.style.left = dx + 'px'
          this.shiftPreview2.style.top = dy + 'px'
        }
      } else {
        canvas.style.left = dx + 'px'
        canvas.style.top = dy + 'px'
      }

      this.panDx = dx
      this.panDy = dy

      this.fireEvent(new mxEventObject(mxEvent.PAN))
    }
  }

  /**
   * Function: zoom
   *
   * Zooms the graph using the given factor. Center is an optional boolean
   * argument that keeps the graph scrolled to the center. If the center argument
   * is omitted, then <centerZoom> will be used as its value.
   */
  mxGraph.prototype.zoom = function (factor, center, multiplier) {
    center = (center != null) ? center : this.centerZoom
    let scale = Math.round(this.view.scale * factor * 100) / 100

    if (multiplier != null) {
      scale = Math.round(scale * multiplier) / multiplier
    }

    const state = this.view.getState(this.getSelectionCell())
    factor = scale / this.view.scale

    if (this.keepSelectionVisibleOnZoom && state != null) {
      const rect = new mxRectangle(state.x * factor, state.y * factor, state.width * factor, state.height * factor)

      // Refreshes the display only once if a scroll is carried out
      this.view.scale = scale

      if (!this.scrollRectToVisible(rect)) {
        this.view.revalidate()

        // Forces an event to be fired but does not revalidate again
        this.view.setScale(scale)
      }
    } else {
      const hasScrollbars = mxUtils.hasScrollbars(this.container)

      if (center && !hasScrollbars) {
        let dx = this.container.offsetWidth
        let dy = this.container.offsetHeight

        if (factor > 1) {
          const f = (factor - 1) / (scale * 2)
          dx *= -f
          dy *= -f
        } else {
          const f = (1 / factor - 1) / (this.view.scale * 2)
          dx *= f
          dy *= f
        }

        this.view.scaleAndTranslate(scale, this.view.translate.x + dx, this.view.translate.y + dy)
      } else {
        // Allows for changes of translate and scrollbars during setscale
        const tx = this.view.translate.x
        const ty = this.view.translate.y
        const sl = this.container.scrollLeft
        const st = this.container.scrollTop

        this.view.setScale(scale)

        if (hasScrollbars) {
          let dx = 0
          let dy = 0

          if (center) {
            dx = this.container.offsetWidth * (factor - 1) / 2
            dy = this.container.offsetHeight * (factor - 1) / 2
          }

          this.container.scrollLeft = (this.view.translate.x - tx) * this.view.scale + Math.round(sl * factor + dx)
          this.container.scrollTop = (this.view.translate.y - ty) * this.view.scale + Math.round(st * factor + dy)
        }
      }
    }
  }
  /**
   * Function: isConstrainedEvent
   *
   * Returns true if the given mouse event should be aligned to the grid.
   */
  mxGraph.prototype.isConstrainedEvent = function (evt) {
    return mxEvent.isShiftDown(evt) && !mxEvent.isAltDown(evt)
  }
  /**
   * Function: getTooltip
   *
   * Returns the string or DOM node that represents the tooltip for the given
   * state, node and coordinate pair. This implementation checks if the given
   * node is a folding icon or overlay and returns the respective tooltip. If
   * this does not result in a tooltip, the handler for the cell is retrieved
   * from <selectionCellsHandler> and the optional getTooltipForNode method is
   * called. If no special tooltip exists here then <getTooltipForCell> is used
   * with the cell in the given state as the argument to return a tooltip for the
   * given state.
   *
   * Parameters:
   *
   * state - <mxCellState> whose tooltip should be returned.
   * node - DOM node that is currently under the mouse.
   * x - X-coordinate of the mouse.
   * y - Y-coordinate of the mouse.
   */
  mxGraph.prototype.getTooltip = function (state, node, x, y) {
    let tip = null

    if (state != null) {
      // Checks if the mouse is over the folding icon
      if (state.control != null && (node === state.control.node || node.parentNode === state.control.node)) {
        tip = this.collapseExpandResource
        tip = mxUtils.htmlEntities(mxResources.get(tip) || tip).replace(/\\n/g, '<br>')
      }

      if (tip == null && state.overlays != null) {
        state.overlays.visit(function (id, shape) {
          // LATER: Exit loop if tip is not null
          if (tip == null && (node === shape.node || node.parentNode === shape.node)) {
            tip = mxUtils.htmlEntities(shape.overlay.toString()).replace(/\\n/g, '<br>')
          }
        })
      }

      if (tip == null) {
        const handler = this.selectionCellsHandler.getHandler(state.cell)

        if (handler != null && typeof (handler.getTooltipForNode) === 'function') {
          tip = handler.getTooltipForNode(node)
        }
      }

      if (tip == null) {
        tip = this.getTooltipForCell(state.cell)
      }
    }

    return tip
  }
  /**
   * Function: getLinkTargetForCell
   *
   * Returns the string to be used as the link target for the given cell. This
   * implementation returns null.
   *
   * Parameters:
   *
   * cell - <mxCell> whose link target should be returned.
   */
  mxGraph.prototype.getLinkTargetForCell = function (cell) {
    return null
  }
  /**
   * Function: setEnabled
   *
   * Specifies if the graph should allow any interactions. This
   * implementation updates <enabled>.
   *
   * Parameters:
   *
   * value - Boolean indicating if the graph should be enabled.
   */
  mxGraph.prototype.setEnabled = function (value) {
    this.enabled = value
    this.fireEvent(new mxEventObject('enabledChanged', 'enabled', value))
  }
  /**
   * Function: getRotatableCells
   *
   * Returns the cells which are rotatable in the given array of cells.
   */
  mxGraph.prototype.getRotatableCells = function (cells) {
    return this.model.filterCells(cells, mxUtils.bind(this, function (cell) {
      return this.isCellRotatable(cell)
    }))
  }
  /**
   * Function: getResizableCells
   *
   * Returns all cells that are resizable and not locked.
   */
  mxGraph.prototype.getResizableCells = function (cells) {
    return this.model.filterCells(cells, mxUtils.bind(this, function (cell) {
      return this.isCellResizable(cell)
    }))
  }
  /**
   * Function: getEditableCells
   *
   * Returns all cells that are editable and not locked.
   */
  mxGraph.prototype.getEditableCells = function (cells) {
    return this.model.filterCells(cells, mxUtils.bind(this, function (cell) {
      return this.isCellEditable(cell)
    }))
  }
  /**
   * Function: isValidDropTarget
   *
   * Returns true if the given cell is a valid drop target for the specified
   * cells. If <splitEnabled> is true then this returns <isSplitTarget> for
   * the given arguments else it returns true if the cell is not collapsed
   * and its child count is greater than 0.
   *
   * Parameters:
   *
   * cell - <mxCell> that represents the possible drop target.
   * cells - <mxCells> that should be dropped into the target.
   * evt - Mouseevent that triggered the invocation.
   */
  mxGraph.prototype.isValidDropTarget = function (cell, cells, evt) {
    return cell != null && !this.isCellLocked(cell) && ((this.isSplitEnabled() && this.isSplitTarget(cell, cells, evt)) || (!this.model.isEdge(cell) && (this.isSwimlane(cell) || (this.model.getChildCount(cell) > 0 && !this.isCellCollapsed(cell)))))
  }
  /**
   * Function: getCells
   *
   * Returns the child vertices and edges of the given parent that are contained
   * in the given rectangle. The result is added to the optional result array,
   * which is returned. If no result array is specified then a new array is
   * created and returned.
   *
   * Parameters:
   *
   * x - X-coordinate of the rectangle.
   * y - Y-coordinate of the rectangle.
   * width - Width of the rectangle.
   * height - Height of the rectangle.
   * parent - <mxCell> that should be used as the root of the recursion.
   * Default is current root of the view or the root of the model.
   * result - Optional array to store the result in.
   * intersection - Optional <mxRectangle> to check shapes for intersection.
   * ignoreFn - Optional function to check if a cell state is ignored.
   * includeDescendants - Optional boolean flag to add descendants to the result.
   * Default is false.
   */
  mxGraph.prototype.getCells = function (x, y, width, height, parent, result, intersection, ignoreFn, includeDescendants) {
    result = (result != null) ? result : []

    if (width > 0 || height > 0 || intersection != null) {
      const model = this.getModel()
      const right = x + width
      const bottom = y + height

      if (parent == null) {
        parent = this.getCurrentRoot()

        if (parent == null) {
          parent = model.getRoot()
        }
      }

      if (parent != null) {
        const childCount = model.getChildCount(parent)

        for (let i = 0; i < childCount; i++) {
          const cell = model.getChildAt(parent, i)
          const state = this.view.getState(cell)

          if (state != null && this.isCellVisible(cell) && (ignoreFn == null || !ignoreFn(state))) {
            const deg = mxUtils.getValue(state.style, mxConstants.STYLE_ROTATION) || 0
            let box = state

            if (deg !== 0) {
              box = mxUtils.getBoundingBox(box, deg)
            }

            const hit = (intersection != null && model.isVertex(cell) && mxUtils.intersects(intersection, box)) || (intersection != null && model.isEdge(cell) && mxUtils.intersects(intersection, box)) || (intersection == null && (model.isEdge(cell) || model.isVertex(cell)) && box.x >= x && box.y + box.height <= bottom && box.y >= y && box.x + box.width <= right)

            if (hit) {
              result.push(cell)
            }

            if (!hit || includeDescendants) {
              this.getCells(x, y, width, height, cell, result, intersection, ignoreFn, includeDescendants)
            }
          }
        }
      }
    }

    return result
  }

  /**
   * Function: traverse
   *
   * Traverses the (directed) graph invoking the given function for each
   * visited vertex and edge. The function is invoked with the current vertex
   * and the incoming edge as a parameter. This implementation makes sure
   * each vertex is only visited once. The function may return false if the
   * traversal should stop at the given vertex.
   *
   * Example:
   *
   * (code)
   * mxLog.show();
   * var cell = graph.getSelectionCell();
   * graph.traverse(cell, false, function(vertex, edge)
   * {
   *   mxLog.debug(graph.getLabel(vertex));
   * });
   * (end)
   *
   * Parameters:
   *
   * vertex - <mxCell> that represents the vertex where the traversal starts.
   * directed - Optional boolean indicating if edges should only be traversed
   * from source to target. Default is true.
   * func - Visitor function that takes the current vertex and the incoming
   * edge as arguments. The traversal stops if the function returns false.
   * edge - Optional <mxCell> that represents the incoming edge. This is
   * null for the first step of the traversal.
   * visited - Optional <mxDictionary> from edges to true for the visited cells.
   * inverse - Optional boolean to traverse in inverse direction. Default is false.
   * This is ignored if directed is false.
   */
  mxGraph.prototype.traverse = function (vertex, directed, func, edge, visited, inverse) {
    if (func != null && vertex != null) {
      directed = (directed != null) ? directed : true
      inverse = (inverse != null) ? inverse : false
      visited = visited || new mxDictionary()

      if (edge == null || !visited.get(edge)) {
        visited.put(edge, true)
        const result = func(vertex, edge)

        if (result == null || result) {
          const edgeCount = this.model.getEdgeCount(vertex)

          if (edgeCount > 0) {
            for (let i = 0; i < edgeCount; i++) {
              const e = this.model.getEdgeAt(vertex, i)
              const isSource = this.model.getTerminal(e, true) === vertex

              if (!directed || (!inverse === isSource)) {
                const next = this.model.getTerminal(e, !isSource)
                this.traverse(next, directed, func, e, visited, inverse)
              }
            }
          }
        }
      }
    }
  }

  /**
   * Function: isAncestorSelected
   *
   * Returns true if the given cell or of any of its ancestors in the
   * current view is selected.
   */
  mxGraph.prototype.isAncestorSelected = function (cell) {
    let parent = this.model.getParent(cell)

    while (parent != null && parent !== this.getCurrentRoot()) {
      if (this.isCellSelected(parent)) {
        return true
      }

      parent = this.model.getParent(parent)
    }

    return false
  }

  /**
   * Function: isEventIgnored
   *
   * Returns true if the event should be ignored in <fireMouseEvent>.
   */
  mxGraph.prototype.isEventIgnored = function (evtName, me, sender) {
    const mouseEvent = mxEvent.isMouseEvent(me.getEvent())
    let result = false

    // Drops events that are fired more than once
    if (me.getEvent() === this.lastEvent) {
      result = true
    } else {
      this.lastEvent = me.getEvent()
    }

    // Installs event listeners to capture the complete gesture from the event source
    // for non-MS touch events as a workaround for all events for the same geture being
    // fired from the event source even if that was removed from the DOM.
    if (this.eventSource != null && evtName !== mxEvent.MOUSE_MOVE) {
      mxEvent.removeGestureListeners(this.eventSource, null, this.mouseMoveRedirect, this.mouseUpRedirect)
      this.mouseMoveRedirect = null
      this.mouseUpRedirect = null
      this.eventSource = null
    } else if (!mxClient.IS_GC && this.eventSource != null && me.getSource() !== this.eventSource) {
      result = true
    } else if (mxClient.IS_TOUCH && evtName === mxEvent.MOUSE_DOWN && !mouseEvent && !mxEvent.isPenEvent(me.getEvent())) {
      this.eventSource = me.getSource()
      let pointerId = null

      // Workaround for mixed event types during one gesture in Chrome on Linux
      if (mxClient.IS_ANDROID || !mxClient.IS_LINUX || !mxClient.IS_GC) {
        pointerId = me.getEvent().pointerId
      }

      this.mouseMoveRedirect = mxUtils.bind(this, function (evt) {
        if (pointerId == null || evt.pointerId === pointerId) {
          this.fireMouseEvent(mxEvent.MOUSE_MOVE, new mxMouseEvent(evt, this.getStateForTouchEvent(evt)))
        }
      })
      this.mouseUpRedirect = mxUtils.bind(this, function (evt) {
        this.fireMouseEvent(mxEvent.MOUSE_UP, new mxMouseEvent(evt, this.getStateForTouchEvent(evt)))
        pointerId = null
      })

      mxEvent.addGestureListeners(this.eventSource, null, this.mouseMoveRedirect, this.mouseUpRedirect)
    }

    // Factored out the workarounds for FF to make it easier to override/remove
    // Note this method has side effects!
    if (this.isSyntheticEventIgnored(evtName, me, sender)) {
      result = true
    }

    // Never fires mouseUp/-Down for double clicks
    if (!mxEvent.isPopupTrigger(this.lastEvent) && evtName !== mxEvent.MOUSE_MOVE && this.lastEvent.detail === 2) {
      return true
    }

    // Filters out of sequence events or mixed event types during a gesture
    if (evtName === mxEvent.MOUSE_UP && this.isMouseDown) {
      this.isMouseDown = false
    } else if (evtName === mxEvent.MOUSE_DOWN && !this.isMouseDown) {
      this.isMouseDown = true
      this.isMouseTrigger = mouseEvent
    } else if (!result && (((!mxClient.IS_FF || evtName !== mxEvent.MOUSE_MOVE) && this.isMouseDown && this.isMouseTrigger !== mouseEvent) || (evtName === mxEvent.MOUSE_DOWN && this.isMouseDown) || (evtName === mxEvent.MOUSE_UP && !this.isMouseDown))) {
      // Drops mouse events that are fired during touch gestures as a workaround for Webkit
      // and mouse events that are not in sync with the current internal button state
      result = true
    }

    if (!result && evtName === mxEvent.MOUSE_DOWN) {
      this.lastMouseX = me.getX()
      this.lastMouseY = me.getY()
    }

    return result
  }
  /**
   * Function: isPointerEventIgnored
   *
   * Returns true if the given event should be ignored in the case of
   * moultitouch events to just handle the pointer that started the
   * gesture.
   *
   * Parameters:
   *
   * evtName - String that specifies the type of event to be dispatched.
   * me - <mxMouseEvent> to be fired.
   */
  mxGraph.prototype.isPointerEventIgnored = function (evtName, me) {
    let result = false

    // Multitouch event filtering
    if (mxClient.IS_ANDROID || !mxClient.IS_LINUX || !mxClient.IS_GC) {
      const id = me.getEvent().pointerId

      if (evtName === mxEvent.MOUSE_DOWN) {
        if (this.currentPointerId != null && this.currentPointerId !== id) {
          result = true
        } else if (this.currentPointerId == null) {
          this.currentPointerId = me.getEvent().pointerId
        }
      } else if (evtName === mxEvent.MOUSE_MOVE) {
        if (this.currentPointerId != null && this.currentPointerId !== id) {
          result = true
        }
      } else if (evtName === mxEvent.MOUSE_UP) {
        this.currentPointerId = null
      }
    }

    return result
  }
  /**
   * Function: fireMouseEvent
   *
   * Dispatches the given event in the graph event dispatch loop. Possible
   * event names are <mxEvent.MOUSE_DOWN>, <mxEvent.MOUSE_MOVE> and
   * <mxEvent.MOUSE_UP>. All listeners are invoked for all events regardless
   * of the consumed state of the event.
   *
   * Parameters:
   *
   * evtName - String that specifies the type of event to be dispatched.
   * me - <mxMouseEvent> to be fired.
   * sender - Optional sender argument. Default is this.
   */
  mxGraph.prototype.fireMouseEvent = function (evtName, me, sender) {
    if (this.isEventSourceIgnored(evtName, me)) {
      if (this.tooltipHandler != null) {
        this.tooltipHandler.hide()
      }

      return
    }

    if (this.isPointerEventIgnored(evtName, me)) {
      this.tapAndHoldValid = false

      return
    }

    if (sender == null) {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      sender = this
    }

    // Updates the graph coordinates in the event
    me = this.updateMouseEvent(me, evtName)

    // Detects and processes double taps for touch-based devices which do not have native double click events
    // or where detection of double click is not always possible (IE10+). Note that this can only handle
    // double clicks on cells because the sequence of events in IE prevents detection on the background, it fires
    // two mouse ups, one of which without a cell but no mousedown for the second click which means we cannot
    // detect which mouseup(s) are part of the first click, ie we do not know when the first click ends.
    if ((!this.nativeDblClickEnabled && !mxEvent.isPopupTrigger(me.getEvent())) || (this.doubleTapEnabled && mxClient.IS_TOUCH && (mxEvent.isTouchEvent(me.getEvent()) || mxEvent.isPenEvent(me.getEvent())))) {
      const currentTime = new Date().getTime()

      if (evtName === mxEvent.MOUSE_DOWN) {
        if (this.lastTouchEvent != null && this.lastTouchEvent !== me.getEvent() && currentTime - this.lastTouchTime < this.doubleTapTimeout && Math.abs(this.lastTouchX - me.getX()) < this.doubleTapTolerance && Math.abs(this.lastTouchY - me.getY()) < this.doubleTapTolerance && this.doubleClickCounter < 2) {
          this.doubleClickCounter++
          let doubleClickFired = false

          if (evtName === mxEvent.MOUSE_UP) {
            if (me.getCell() === this.lastTouchCell && this.lastTouchCell != null) {
              this.lastTouchTime = 0
              const cell = this.lastTouchCell
              this.lastTouchCell = null

              // Fires native dblclick event via event source
              // NOTE: This fires two double click events on edges in quirks mode. While
              // trying to fix this, we realized that nativeDoubleClick can be disabled for
              // quirks and IE10+ (or we didn't find the case mentioned above where it
              // would not work), i.e. all double clicks seem to be working without this.
              this.dblClick(me.getEvent(), cell)
              doubleClickFired = true
            }
          } else {
            this.fireDoubleClick = true
            this.lastTouchTime = 0
          }

          if (doubleClickFired) {
            mxEvent.consume(me.getEvent())
            return
          }
        } else if (this.lastTouchEvent == null || this.lastTouchEvent !== me.getEvent()) {
          this.lastTouchCell = me.getCell()
          this.lastTouchX = me.getX()
          this.lastTouchY = me.getY()
          this.lastTouchTime = currentTime
          this.lastTouchEvent = me.getEvent()
          this.doubleClickCounter = 0
        }
      } else if ((this.isMouseDown || evtName === mxEvent.MOUSE_UP) && this.fireDoubleClick) {
        this.fireDoubleClick = false
        const cell = this.lastTouchCell
        this.lastTouchCell = null
        this.isMouseDown = false

        // Workaround for Chrome/Safari not firing native double click events for double touch on background
        const valid = (cell != null) || ((mxEvent.isTouchEvent(me.getEvent()) || mxEvent.isPenEvent(me.getEvent())) && (mxClient.IS_GC || mxClient.IS_SF))

        if (valid && Math.abs(this.lastTouchX - me.getX()) < this.doubleTapTolerance && Math.abs(this.lastTouchY - me.getY()) < this.doubleTapTolerance) {
          this.dblClick(me.getEvent(), cell)
        } else {
          mxEvent.consume(me.getEvent())
        }

        return
      }
    }

    if (!this.isEventIgnored(evtName, me, sender)) {
      // Updates the event state via getEventState
      me.state = this.getEventState(me.getState())
      this.fireEvent(new mxEventObject(mxEvent.FIRE_MOUSE_EVENT, 'eventName', evtName, 'event', me))

      if ((mxClient.IS_OP || mxClient.IS_SF || mxClient.IS_GC || mxClient.IS_IE11 || (mxClient.IS_IE && mxClient.IS_SVG) || me.getEvent().target !== this.container)) {
        if (evtName === mxEvent.MOUSE_MOVE && this.isMouseDown && this.autoScroll && !mxEvent.isMultiTouchEvent(me.getEvent)) {
          this.scrollPointToVisible(me.getGraphX(), me.getGraphY(), this.autoExtend)
        } else if (evtName === mxEvent.MOUSE_UP && this.ignoreScrollbars && this.translateToScrollPosition && (this.container.scrollLeft !== 0 || this.container.scrollTop !== 0)) {
          const s = this.view.scale
          const tr = this.view.translate
          this.view.setTranslate(tr.x - this.container.scrollLeft / s, tr.y - this.container.scrollTop / s)
          this.container.scrollLeft = 0
          this.container.scrollTop = 0
        }

        if (this.mouseListeners != null) {
          // Does not change returnValue in Opera
          if (!me.getEvent().preventDefault) {
            me.getEvent().returnValue = true
          }

          for (let i = 0; i < this.mouseListeners.length; i++) {
            const l = this.mouseListeners[i]

            if (evtName === mxEvent.MOUSE_DOWN) {
              l.mouseDown(sender, me)
            } else if (evtName === mxEvent.MOUSE_MOVE) {
              l.mouseMove(sender, me)
            } else if (evtName === mxEvent.MOUSE_UP) {
              l.mouseUp(sender, me)
            }
          }
        }

        // Invokes the click handler
        if (evtName === mxEvent.MOUSE_UP) {
          this.click(me)
        }
      }

      // Detects tapAndHold events using a timer
      if ((mxEvent.isTouchEvent(me.getEvent()) || mxEvent.isPenEvent(me.getEvent())) && evtName === mxEvent.MOUSE_DOWN && this.tapAndHoldEnabled && !this.tapAndHoldInProgress) {
        this.tapAndHoldInProgress = true
        this.initialTouchX = me.getGraphX()
        this.initialTouchY = me.getGraphY()

        const handler = function () {
          if (this.tapAndHoldValid) {
            this.tapAndHold(me)
          }

          this.tapAndHoldInProgress = false
          this.tapAndHoldValid = false
        }

        if (this.tapAndHoldThread) {
          window.clearTimeout(this.tapAndHoldThread)
        }

        this.tapAndHoldThread = window.setTimeout(mxUtils.bind(this, handler), this.tapAndHoldDelay)
        this.tapAndHoldValid = true
      } else if (evtName === mxEvent.MOUSE_UP) {
        this.tapAndHoldInProgress = false
        this.tapAndHoldValid = false
      } else if (this.tapAndHoldValid) {
        this.tapAndHoldValid = Math.abs(this.initialTouchX - me.getGraphX()) < this.tolerance && Math.abs(this.initialTouchY - me.getGraphY()) < this.tolerance
      }

      // Stops editing for all events other than from cellEditor
      if (evtName === mxEvent.MOUSE_DOWN && this.isEditing() && !this.cellEditor.isEventSource(me.getEvent())) {
        this.stopEditing(!this.isInvokesStopCellEditing())
      }

      this.consumeMouseEvent(evtName, me, sender)
    }
  }
  /**
   * Function: consumeMouseEvent
   *
   * Consumes the given <mxMouseEvent> if it's a touchStart event.
   */
  mxGraph.prototype.consumeMouseEvent = function (evtName, me, sender) {
    this.fireEvent(new mxEventObject(mxEvent.CONSUME_MOUSE_EVENT, 'eventName', evtName, 'event', me))

    // Workaround for duplicate click in Windows 8 with Chrome/FF/Opera with touch
    if (evtName === mxEvent.MOUSE_DOWN && mxEvent.isTouchEvent(me.getEvent())) {
      me.consume(false)
    }
  }
// mxGraph end
  mxOutput.mxGraph = mxGraph
}
