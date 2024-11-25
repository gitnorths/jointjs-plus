export function overrideMxCellState (mxOutput) {
  const { mxCellState, mxUtils } = mxOutput

  // mxCellState start
  /**
   * Function: isFloatingTerminalPoint
   *
   * Returns true if the terminal point for the source or target is floating.
   *
   * Parameters:
   *
   * source - Boolean that specifies the source or target terminal.
   */
  mxCellState.prototype.isFloatingTerminalPoint = function (source) {
    const terminal = this.getVisibleTerminalState(source)

    if (terminal == null) {
      return false
    } else {
      const constraint = this.view.graph.getConnectionConstraint(this, terminal, source)

      return constraint == null || constraint.point == null
    }
  }

  /**
   * Function: clone
   *
   * Returns a clone of this <mxPoint>.
   */
  mxCellState.prototype.clone = function () {
    const clone = new mxCellState(this.view, this.cell, (this.style != null) ? mxUtils.clone(this.style) : null)

    // Clones the absolute points
    if (this.absolutePoints != null) {
      clone.absolutePoints = []

      for (let i = 0; i < this.absolutePoints.length; i++) {
        clone.absolutePoints[i] = this.absolutePoints[i].clone()
      }
    }

    if (this.origin != null) {
      clone.origin = this.origin.clone()
    }

    if (this.absoluteOffset != null) {
      clone.absoluteOffset = this.absoluteOffset.clone()
    }

    if (this.boundingBox != null) {
      clone.boundingBox = this.boundingBox.clone()
    }

    clone.terminalDistance = this.terminalDistance
    clone.segments = this.segments
    clone.length = this.length
    clone.x = this.x
    clone.y = this.y
    clone.width = this.width
    clone.height = this.height
    clone.unscaledWidth = this.unscaledWidth
    clone.unscaledHeight = this.unscaledHeight

    return clone
  }
  // mxCellState end
  mxOutput.mxCellState = mxCellState
}
