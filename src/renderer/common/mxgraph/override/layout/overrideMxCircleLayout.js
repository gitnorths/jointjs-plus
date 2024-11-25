export function overrideMxCircleLayout (mxOutput) {
  const { mxCircleLayout } = mxOutput
  /**
   * Function: circle
   *
   * Executes the circular layout for the specified array
   * of vertices and the given radius. This is called from
   * <execute>.
   */
  mxCircleLayout.prototype.circle = function (vertices, r, left, top) {
    const vertexCount = vertices.length
    const phi = 2 * Math.PI / vertexCount

    for (let i = 0; i < vertexCount; i++) {
      if (this.isVertexMovable(vertices[i])) {
        this.setVertexLocation(vertices[i],
          Math.round(left + r + r * Math.cos(i * phi - Math.PI / 2)),
          Math.round(top + r + r * Math.sin(i * phi - Math.PI / 2)))
      }
    }
  }
  mxOutput.mxCircleLayout = mxCircleLayout
}
