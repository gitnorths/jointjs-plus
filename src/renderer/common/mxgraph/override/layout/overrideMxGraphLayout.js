export function overrideMxGraphLayout (mxOutput) {
  const { mxGraphLayout } = mxOutput
  /**
   * Function: isVertexIgnored
   *
   * Returns a boolean indicating if the given <mxCell> should be ignored by
   * the algorithm. This implementation returns false for all vertices.
   *
   * Parameters:
   *
   * vertex - <mxCell> whose ignored state should be returned.
   */
  mxGraphLayout.prototype.isVertexIgnored = function (vertex) {
    return !this.graph.getModel().isVertex(vertex) ||
      !this.graph.getModel().isVisible(vertex)
  }

  /**
   * Function: isEdgeIgnored
   *
   * Returns a boolean indicating if the given <mxCell> should be ignored by
   * the algorithm. This implementation returns false for all vertices.
   *
   * Parameters:
   *
   * cell - <mxCell> whose ignored state should be returned.
   */
  mxGraphLayout.prototype.isEdgeIgnored = function (edge) {
    const model = this.graph.getModel()

    return !model.isEdge(edge) ||
      !this.graph.getModel().isVisible(edge) ||
      model.getTerminal(edge, true) == null ||
      model.getTerminal(edge, false) == null
  }
  mxOutput.mxGraphLayout = mxGraphLayout
}
