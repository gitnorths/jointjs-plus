export function overrideMxRectangleShape (mxOutput) {
  const { mxRectangleShape, mxConstants, mxUtils } = mxOutput
  /**
   * Function: paintBackground
   *
   * Generic background painting implementation.
   */
  mxRectangleShape.prototype.paintBackground = function (c, x, y, w, h) {
    if (this.isRounded) {
      let r

      if (mxUtils.getValue(this.style, mxConstants.STYLE_ABSOLUTE_ARCSIZE, 0) === '1') {
        r = Math.min(w / 2, Math.min(h / 2, mxUtils.getValue(this.style,
          mxConstants.STYLE_ARCSIZE, mxConstants.LINE_ARCSIZE) / 2))
      } else {
        const f = mxUtils.getValue(this.style, mxConstants.STYLE_ARCSIZE,
          mxConstants.RECTANGLE_ROUNDING_FACTOR * 100) / 100
        r = Math.min(w * f, h * f)
      }

      c.roundrect(x, y, w, h, r, r)
    } else {
      c.rect(x, y, w, h)
    }

    c.fillAndStroke()
  }

  /**
   * Function: isRoundable
   *
   * Adds roundable support.
   */
  mxRectangleShape.prototype.isRoundable = function () {
    return true
  }

  mxOutput.mxRectangleShape = mxRectangleShape
}
