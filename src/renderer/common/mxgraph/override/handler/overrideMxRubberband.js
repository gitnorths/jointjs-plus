export function overrideMxRubberband (mxOutput) {
  const { mxRubberband, mxEvent, mxUtils } = mxOutput
  /**
   * Function: isForceRubberbandEvent
   *
   * Returns true if the given <mxMouseEvent> should start rubberband selection.
   * This implementation returns true if the alt key is pressed.
   */
  mxRubberband.prototype.isForceRubberbandEvent = function (me) {
    return mxEvent.isAltDown(me.getEvent()) && !mxEvent.isShiftDown(me.getEvent())
  }
  /**
   * Function: mouseDown
   *
   * Handles the event by initiating a rubberband selection. By consuming the
   * event all subsequent events of the gesture are redirected to this
   * handler.
   */
  mxRubberband.prototype.mouseDown = function (sender, me) {
    if (!me.isConsumed() && this.isEnabled() && this.graph.isEnabled() &&
      (me.getState() == null || this.graph.isCellLocked(me.getCell())) &&
      !mxEvent.isMultiTouchEvent(me.getEvent())) {
      const offset = mxUtils.getOffset(this.graph.container)
      const origin = mxUtils.getScrollOrigin(this.graph.container)
      origin.x -= offset.x
      origin.y -= offset.y
      this.start(me.getX() + origin.x, me.getY() + origin.y)

      // Does not prevent the default for this event so that the
      // event processing chain is still executed even if we start
      // rubberbanding. This is required eg. in ExtJs to hide the
      // current context menu. In mouseMove we'll make sure we're
      // not selecting anything while we're rubberbanding.
      me.consume(false)
    }
  }
  /**
   * Function: repaint
   *
   * Computes the bounding box and updates the style of the <div>.
   */
  mxRubberband.prototype.repaint = function () {
    if (this.div != null) {
      const x = this.currentX - this.graph.panDx
      const y = this.currentY - this.graph.panDy

      this.x = Math.min(this.first.x, x)
      this.y = Math.min(this.first.y, y)
      this.width = Math.max(this.first.x, x) - this.x
      this.height = Math.max(this.first.y, y) - this.y

      const dx = 0
      const dy = 0

      this.div.style.left = (this.x + dx) + 'px'
      this.div.style.top = (this.y + dy) + 'px'
      this.div.style.width = Math.max(1, this.width) + 'px'
      this.div.style.height = Math.max(1, this.height) + 'px'
    }
  }
  mxOutput.mxRubberband = mxRubberband
}
