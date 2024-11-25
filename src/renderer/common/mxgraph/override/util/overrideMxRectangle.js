export function overrideMxRectangle (mxOutput) {
  const { mxRectangle } = mxOutput
  /**
   * Function: fromPoint
   *
   * Returns a new <mxRectangle> from the given <mxPoint>.
   */
  mxRectangle.fromPoint = function (pt) {
    return new mxRectangle(pt.x, pt.y, 0, 0)
  }

  mxOutput.mxRectangle = mxRectangle
}
