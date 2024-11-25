export function overrideMxPopupMenuHandler (mxOutput) {
  const { mxPopupMenuHandler, mxUtils } = mxOutput
  /**
   * Function: mouseUp
   *
   * Handles the event by setting the translation on the view or showing the
   * popupmenu.
   */
  mxPopupMenuHandler.prototype.mouseUp = function (sender, me, popup) {
    const doConsume = popup == null

    popup = (popup != null)
      ? popup
      : mxUtils.bind(this, function (cell) {
        const origin = mxUtils.getScrollOrigin()
        this.popup(me.getX() + origin.x + 1, me.getY() + origin.y + 1, cell, me.getEvent())
      })

    if (this.popupTrigger && this.inTolerance && this.triggerX != null && this.triggerY != null) {
      const cell = this.getCellForPopupEvent(me)

      // Selects the cell for which the context menu is being displayed
      if (this.graph.isEnabled() && this.isSelectOnPopup(me) &&
        cell != null && !this.graph.isCellSelected(cell)) {
        this.graph.setSelectionCell(cell)
      } else if (this.clearSelectionOnBackground && cell == null) {
        this.graph.clearSelection()
      }

      // Hides the tooltip if there is one
      this.graph.tooltipHandler.hide()

      // Menu is shifted by 1 pixel so that the mouse up event
      // is routed via the underlying shape instead of the DIV
      popup(cell)

      if (doConsume) {
        me.consume()
      }
    }

    this.popupTrigger = false
    this.inTolerance = false
  }
  mxOutput.mxPopupMenuHandler = mxPopupMenuHandler
}
