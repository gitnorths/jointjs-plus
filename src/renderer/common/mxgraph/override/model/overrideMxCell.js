export function overrideMxCell (mxOutput) {
  const { mxCell } = mxOutput
  /**
   * Function: cloneValue
   *
   * Returns a clone of the cell's user object.
   */
  mxCell.prototype.cloneValue = function (value) {
    value = (value != null) ? value : this.getValue()

    if (value != null) {
      if (typeof (value.clone) === 'function') {
        value = value.clone()
      } else if (!isNaN(value.nodeType)) {
        value = value.cloneNode(true)
      }
    }

    return value
  }
  mxOutput.mxCell = mxCell
}
