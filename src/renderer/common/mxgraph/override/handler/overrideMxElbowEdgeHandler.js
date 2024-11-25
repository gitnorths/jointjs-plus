export function overrideMxElbowEdgeHandler (mxOutput) {
  const { mxElbowEdgeHandler, mxEvent, mxConstants, mxUtils, mxPoint } = mxOutput
  /**
   * Function: createBends
   *
   * Overrides <mxEdgeHandler.createBends> to create custom bends.
   */
  mxElbowEdgeHandler.prototype.createBends = function () {
    const bends = []

    // Source
    let bend = this.createHandleShape(0)
    this.initBend(bend)
    bend.setCursor(mxConstants.CURSOR_TERMINAL_HANDLE)
    bends.push(bend)

    // Virtual
    bends.push(this.createVirtualBend(mxUtils.bind(this, function (evt) {
      if (!mxEvent.isConsumed(evt) && this.flipEnabled) {
        this.graph.flipEdge(this.state.cell, evt)
        mxEvent.consume(evt)
      }
    })))

    this.points.push(new mxPoint(0, 0))

    // Target
    bend = this.createHandleShape(2, null, true)
    this.initBend(bend)
    bend.setCursor(mxConstants.CURSOR_TERMINAL_HANDLE)
    bends.push(bend)

    return bends
  }

  /**
   * Function: createVirtualBends
   *
   * Returns null.
   */
  mxElbowEdgeHandler.prototype.createVirtualBends = function () {
    return null
  }
  mxOutput.mxElbowEdgeHandler = mxElbowEdgeHandler
}
