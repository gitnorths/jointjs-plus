export function overrideMxCellMarker (mxOutput) {
  const { mxCellMarker } = mxOutput
  /**
   * Function: destroy
   *
   * Destroys the handler and all its resources and DOM nodes.
   */
  mxCellMarker.prototype.destroy = function () {
    this.highlight.destroy()
  }

  mxOutput.mxCellMarker = mxCellMarker
}
