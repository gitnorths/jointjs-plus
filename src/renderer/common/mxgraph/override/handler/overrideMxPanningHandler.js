export function overrideMxPanningHandler (mxOutput) {
  const { mxEvent, mxEventObject, mxUtils } = mxOutput

  /**
   * Class: mxPanningHandler
   *
   * Event handler that pans and creates popupmenus. To use the left
   * mousebutton for panning without interfering with cell moving and
   * resizing, use <isUseLeftButton> and <isIgnoreCell>. For grid size
   * steps while panning, use <useGrid>. This handler is built-into
   * <mxGraph.panningHandler> and enabled using <mxGraph.setPanning>.
   *
   * Constructor: mxPanningHandler
   *
   * Constructs an event handler that creates a <mxPopupMenu>
   * and pans the graph.
   *
   * Event: mxEvent.PAN_START
   *
   * Fires when the panning handler changes its <active> state to true. The
   * <code>event</code> property contains the corresponding <mxMouseEvent>.
   *
   * Event: mxEvent.PAN
   *
   * Fires while handle is processing events. The <code>event</code> property contains
   * the corresponding <mxMouseEvent>.
   *
   * Event: mxEvent.PAN_END
   *
   * Fires when the panning handler changes its <active> state to false. The
   * <code>event</code> property contains the corresponding <mxMouseEvent>.
   */
  function mxPanningHandler (graph) {
    if (graph != null) {
      this.graph = graph
      this.graph.addMouseListener(this)

      // Handles force panning event
      this.forcePanningHandler = mxUtils.bind(this, function (sender, evt) {
        const evtName = evt.getProperty('eventName')
        const me = evt.getProperty('event')

        if (evtName === mxEvent.MOUSE_DOWN && this.isForcePanningEvent(me)) {
          this.start(me)
          this.active = true
          this.fireEvent(new mxEventObject(mxEvent.PAN_START, 'event', me))
          me.consume()
        }
      })

      this.graph.addListener(mxEvent.FIRE_MOUSE_EVENT, this.forcePanningHandler)

      // Handles pinch gestures
      this.gestureHandler = mxUtils.bind(this, function (sender, eo) {
        if (this.isPinchEnabled()) {
          const evt = eo.getProperty('event')

          if (!mxEvent.isConsumed(evt) && evt.type === 'gesturestart') {
            this.initialScale = this.graph.view.scale

            // Forces start of panning when pinch gesture starts
            if (!this.active && this.mouseDownEvent != null) {
              this.start(this.mouseDownEvent)
              this.mouseDownEvent = null
            }
          } else if (evt.type === 'gestureend' && this.initialScale != null) {
            this.initialScale = null
          }

          if (this.initialScale != null) {
            this.zoomGraph(evt)
          }
        }
      })

      this.graph.addListener(mxEvent.GESTURE, this.gestureHandler)

      this.mouseUpListener = mxUtils.bind(this, function () {
        if (this.active) {
          this.reset()
        }
      })

      // Stops scrolling on every mouseup anywhere in the
      // document and when the mouse leaves the window
      mxEvent.addGestureListeners(document, null, null, this.mouseUpListener)
      mxEvent.addListener(document, 'mouseleave', this.mouseUpListener)
    }
  }

  mxPanningHandler.prototype = Object.create(mxOutput.mxPanningHandler.prototype)

  /**
   * Function: reset
   *
   * Resets the state of this handler.
   */
  mxPanningHandler.prototype.reset = function () {
    this.graph.isMouseDown = false
    this.panningTrigger = false
    this.mouseDownEvent = null
    this.active = false
    this.dx = null
    this.dy = null
  }

  /**
   * Function: destroy
   *
   * Destroys the handler and all its resources and DOM nodes.
   */
  mxPanningHandler.prototype.destroy = function () {
    this.graph.removeMouseListener(this)
    this.graph.removeListener(this.forcePanningHandler)
    this.graph.removeListener(this.gestureHandler)
    mxEvent.removeGestureListeners(document, null, null, this.mouseUpListener)
    mxEvent.removeListener(document, 'mouseleave', this.mouseUpListener)
  }
  mxOutput.mxPanningHandler = mxPanningHandler
}
