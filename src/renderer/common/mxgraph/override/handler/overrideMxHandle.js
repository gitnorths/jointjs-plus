export function overrideMxHandle (mxOutput) {
  const { mxHandle } = mxOutput
  /**
   * Function: positionChanged
   *
   * Should be called after <setPosition> in <processEvent>.
   * This repaints the state using <mxCellRenderer>.
   */
  mxHandle.prototype.positionChanged = function () {
    if (this.state.text != null) {
      this.state.text.apply(this.state)
    }

    if (this.state.shape != null) {
      this.graph.cellRenderer.configureShape(this.state)
    }

    this.graph.cellRenderer.redraw(this.state, true)
  }
  mxOutput.mxHandle = mxHandle
}
