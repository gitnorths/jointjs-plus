export function overrideMxLabel (mxOutput) {
  const { mxLabel, mxUtils, mxConstants } = mxOutput
  /**
   * Function: paintImage
   *
   * Generic background painting implementation.
   */
  mxLabel.prototype.paintImage = function (c, x, y, w, h) {
    if (this.image != null) {
      const bounds = this.getImageBounds(x, y, w, h)
      const clipPath = mxUtils.getValue(this.style, mxConstants.STYLE_CLIP_PATH, null)
      c.image(bounds.x, bounds.y, bounds.width, bounds.height, this.image, false, false, false, clipPath)
    }
  }
  mxOutput.mxLabel = mxLabel
}
