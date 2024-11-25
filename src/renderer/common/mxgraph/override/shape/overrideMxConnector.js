export function overrideMxConnector (mxOutput) {
  const { mxConstants, mxConnector, mxUtils, mxPolyline, mxMarker } = mxOutput
  /**
   * Function: paintEdgeShape
   *
   * Paints the line shape.
   */
  mxConnector.prototype.paintEdgeShape = function (c, pts) {
    // The indirection via functions for markers is needed in
    // order to apply the offsets before painting the line and
    // paint the markers after painting the line.paintLine
    const sourceMarker = this.createMarker(c, pts, true)
    const targetMarker = this.createMarker(c, pts, false)
    mxPolyline.prototype.paintEdgeShape.apply(this, arguments)

    // Disables shadows, dashed styles and fixes fill color for markers
    c.setShadow(false)
    c.setDashed(false)

    if (sourceMarker != null) {
      c.setFillColor(mxUtils.getValue(this.style,
        mxConstants.STYLE_STARTFILLCOLOR, this.stroke))
      sourceMarker()
    }

    if (targetMarker != null) {
      c.setFillColor(mxUtils.getValue(this.style,
        mxConstants.STYLE_ENDFILLCOLOR, this.stroke))
      targetMarker()
    }
  }

  /**
   * Function: createMarker
   *
   * Prepares the marker by adding offsets in pts and returning a function to
   * paint the marker.
   */
  mxConnector.prototype.createMarker = function (c, pts, source) {
    let result = null
    const n = pts.length
    const type = mxUtils.getValue(this.style, (source)
      ? mxConstants.STYLE_STARTARROW
      : mxConstants.STYLE_ENDARROW)
    const p0 = (source) ? pts[1] : pts[n - 2]
    const pe = (source) ? pts[0] : pts[n - 1]

    if (type != null && p0 != null && pe != null) {
      // Computes the norm and the inverse norm
      const dx = pe.x - p0.x
      const dy = pe.y - p0.y
      const dist = Math.sqrt(dx * dx + dy * dy)

      const unitX = dx / dist
      const unitY = dy / dist

      const size = mxUtils.getNumber(this.style, (source)
        ? mxConstants.STYLE_STARTSIZE
        : mxConstants.STYLE_ENDSIZE, mxConstants.DEFAULT_MARKERSIZE)

      // Allow for stroke width in the end point used and the
      // orthogonal vectors describing the direction of the marker
      const filled = this.style[(source)
        ? mxConstants.STYLE_STARTFILL
        : mxConstants.STYLE_ENDFILL] !== 0

      result = mxMarker.createMarker(c, this, type, pe, unitX, unitY,
        size, source, this.strokewidth, filled)
    }

    return result
  }
  mxOutput.mxConnector = mxConnector
}
