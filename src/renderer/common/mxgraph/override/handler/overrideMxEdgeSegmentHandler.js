export function overrideMxEdgeSegmentHandler (mxOutput) {
  const { mxEdgeSegmentHandler, mxPoint, mxConstants } = mxOutput
  /**
   * Function: createBends
   *
   * Adds custom bends for the center of each segment.
   */
  mxEdgeSegmentHandler.prototype.createBends = function () {
    const bends = []
    const pts = this.getCurrentPoints()

    if (pts != null) {
      // Source
      let bend = this.createHandleShape(0)
      this.initBend(bend)
      bend.setCursor(mxConstants.CURSOR_TERMINAL_HANDLE)
      bends.push(bend)

      // Waypoints (segment handles)
      if (this.graph.isCellBendable(this.state.cell)) {
        if (this.points == null) {
          this.points = []
        }

        for (let i = 0; i < pts.length - 1; i++) {
          bend = this.createVirtualBend()
          bends.push(bend)
          let horizontal = Math.round(pts[i].x - pts[i + 1].x) === 0

          // Special case where dy is 0 as well
          if (Math.round(pts[i].y - pts[i + 1].y) === 0 && i < pts.length - 2) {
            horizontal = Math.round(pts[i].x - pts[i + 2].x) === 0
          }

          bend.setCursor((horizontal) ? 'col-resize' : 'row-resize')
          this.points.push(new mxPoint(0, 0))
        }
      }

      // Target
      bend = this.createHandleShape(pts.length, null, true)
      this.initBend(bend)
      bend.setCursor(mxConstants.CURSOR_TERMINAL_HANDLE)
      bends.push(bend)
    }

    return bends
  }

  /**
   * Function: createVirtualBends
   *
   * Returns null.
   */
  mxEdgeSegmentHandler.prototype.createVirtualBends = function () {
    return null
  }

  if (mxEdgeSegmentHandler.prototype.hasOwnProperty('redraw')) {
    delete mxEdgeSegmentHandler.prototype.redraw
  }

  mxOutput.mxEdgeSegmentHandler = mxEdgeSegmentHandler
}
