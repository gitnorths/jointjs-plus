export function overrideMxSelectionCellsHandler (mxOutput) {
  const { mxEvent, mxEventSource, mxEventObject, mxDictionary, mxUtils } = mxOutput

  /**
   * Class: mxSelectionCellsHandler
   *
   * An event handler that manages cell handlers and invokes their mouse event
   * processing functions.
   *
   * Group: Events
   *
   * Event: mxEvent.ADD
   *
   * Fires if a cell has been added to the selection. The <code>state</code>
   * property contains the <mxCellState> that has been added.
   *
   * Event: mxEvent.REMOVE
   *
   * Fires if a cell has been remove from the selection. The <code>state</code>
   * property contains the <mxCellState> that has been removed.
   *
   * Parameters:
   *
   * graph - Reference to the enclosing <mxGraph>.
   */
  function mxSelectionCellsHandler (graph) {
    mxEventSource.call(this)

    this.graph = graph
    this.handlers = new mxDictionary()
    this.graph.addMouseListener(this)

    this.redrawHandler = mxUtils.bind(this, function (sender, evt) {
      if (this.isEnabled()) {
        this.refresh(false)
      }
    })

    this.refreshHandler = mxUtils.bind(this, function (sender, evt) {
      if (this.isEnabled()) {
        this.refresh(true)
      }
    })

    this.graph.addListener(mxEvent.EDITING_STOPPED, this.redrawHandler)
    this.graph.addListener(mxEvent.EDITING_STARTED, this.redrawHandler)
    this.graph.getSelectionModel().addListener(mxEvent.CHANGE, this.redrawHandler)
    this.graph.getModel().addListener(mxEvent.CHANGE, this.refreshHandler)
    this.graph.getView().addListener(mxEvent.SCALE, this.refreshHandler)
    this.graph.getView().addListener(mxEvent.TRANSLATE, this.refreshHandler)
    this.graph.getView().addListener(mxEvent.SCALE_AND_TRANSLATE, this.refreshHandler)
    this.graph.getView().addListener(mxEvent.DOWN, this.refreshHandler)
    this.graph.getView().addListener(mxEvent.UP, this.refreshHandler)
  }

  mxSelectionCellsHandler.prototype = Object.create(mxOutput.mxSelectionCellsHandler.prototype)
  /**
   * Function: refresh
   *
   * Reloads or updates all handlers.
   */
  mxSelectionCellsHandler.prototype.refresh = function (refreshHandlers) {
    // Removes all existing handlers
    const oldHandlers = this.handlers
    this.handlers = new mxDictionary()

    // Creates handles for all selection cells
    const tmp = mxUtils.sortCells(this.getHandledSelectionCells(), false)

    // Forces refresh if old/new count is below/above max cells
    if (!refreshHandlers && this.graph.graphHandler.maxCells > 0 &&
      this.graph.getSelectionCount() > 0) {
      const oldCount = oldHandlers.getCount()

      if (oldCount > 0) {
        refreshHandlers = (oldCount <= this.graph.graphHandler.maxCells) !==
          (this.graph.getSelectionCount() <= this.graph.graphHandler.maxCells)
      }
    }

    // Destroys or updates old handlers
    for (let i = 0; i < tmp.length; i++) {
      const state = this.graph.view.getState(tmp[i])

      if (state != null) {
        let handler = oldHandlers.remove(tmp[i])

        if (handler != null) {
          if (handler.state !== state) {
            handler.destroy()
            handler = null
          } else if (!this.isHandlerActive(handler)) {
            if (refreshHandlers) {
              handler.refresh()
            }

            handler.redraw()
          }
        }

        if (handler != null) {
          this.handlers.put(tmp[i], handler)
        }
      }
    }

    // Destroys unused handlers
    oldHandlers.visit(mxUtils.bind(this, function (key, handler) {
      this.fireEvent(new mxEventObject(mxEvent.REMOVE, 'state', handler.state))
      handler.destroy()
    }))

    // Creates new handlers and updates parent highlight on existing handlers
    for (let i = 0; i < tmp.length; i++) {
      const state = this.graph.view.getState(tmp[i])

      if (state != null) {
        let handler = this.handlers.get(tmp[i])

        if (handler == null) {
          handler = this.graph.createHandler(state)
          this.fireEvent(new mxEventObject(mxEvent.ADD, 'state', state))
          this.handlers.put(tmp[i], handler)
        } else {
          handler.updateParentHighlight()
        }
      }
    }
  }

  /**
   * Function: destroy
   *
   * Destroys the handler and all its resources and DOM nodes.
   */
  mxSelectionCellsHandler.prototype.destroy = function () {
    this.graph.removeMouseListener(this)

    if (this.refreshHandler != null) {
      this.graph.getSelectionModel().removeListener(this.redrawHandler)
      this.graph.getModel().removeListener(this.refreshHandler)
      this.graph.getView().removeListener(this.refreshHandler)
      this.graph.removeListener(this.redrawHandler)
      this.redrawHandler = null
      this.refreshHandler = null
    }
  }
  mxOutput.mxSelectionCellsHandler = mxSelectionCellsHandler
}
