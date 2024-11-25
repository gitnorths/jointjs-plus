export function overrideMxGeometry (mxOutput) {
  const { mxGeometry } = mxOutput
  /**
   * Function: translate
   *
   * Translates the geometry by the specified amount. That is, <x> and <y> of the
   * geometry, the <sourcePoint>, <targetPoint> and all <points> are translated
   * by the given amount. <x> and <y> are only translated if <relative> is false.
   * If <TRANSLATE_CONTROL_POINTS> is false, then <points> are not modified by
   * this function.
   *
   * Parameters:
   *
   * dx - Number that specifies the x-coordinate of the translation.
   * dy - Number that specifies the y-coordinate of the translation.
   * ignorePosition - Specifies if the position should be ignored.
   */
  mxGeometry.prototype.translate = function (dx, dy, ignorePosition) {
    dx = parseFloat(dx)
    dy = parseFloat(dy)

    // Translates the geometry
    if (!this.relative && !ignorePosition) {
      this.x = parseFloat(this.x) + dx
      this.y = parseFloat(this.y) + dy
    }

    // Translates the source point
    if (this.sourcePoint != null) {
      this.sourcePoint.x = parseFloat(this.sourcePoint.x) + dx
      this.sourcePoint.y = parseFloat(this.sourcePoint.y) + dy
    }

    // Translates the target point
    if (this.targetPoint != null) {
      this.targetPoint.x = parseFloat(this.targetPoint.x) + dx
      this.targetPoint.y = parseFloat(this.targetPoint.y) + dy
    }

    // Translate the control points
    if (this.TRANSLATE_CONTROL_POINTS && this.points != null) {
      for (let i = 0; i < this.points.length; i++) {
        if (this.points[i] != null) {
          this.points[i].x = parseFloat(this.points[i].x) + dx
          this.points[i].y = parseFloat(this.points[i].y) + dy
        }
      }
    }
  }
  mxOutput.mxGeometry = mxGeometry
}
