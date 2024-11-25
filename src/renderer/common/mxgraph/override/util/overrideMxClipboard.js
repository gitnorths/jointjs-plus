export function overrideMxClipboard (mxOutput) {
  const { mxClipboard } = mxOutput
  /**
   * Function: cut
   *
   * Cuts the given array of <mxCells> from the specified graph.
   * If cells is null then the selection cells of the graph will
   * be used. Returns the cells that have been cut from the graph.
   *
   * Parameters:
   *
   * graph - <mxGraph> that contains the cells to be cut.
   * cells - Optional array of <mxCells> to be cut.
   */
  mxClipboard.cut = function (graph, cells) {
    cells = mxClipboard.copy(graph, cells)
    mxClipboard.insertCount = 0
    mxClipboard.removeCells(graph, cells, false)

    return cells
  }

  /**
   * Function: removeCells
   *
   * Hook to remove the given cells from the given graph after
   * a cut operation.
   *
   * Parameters:
   *
   * graph - <mxGraph> that contains the cells to be cut.
   * cells - Array of <mxCells> to be cut.
   * includeEdges - Optional boolean which specifies if all connected edges
   * should be removed as well. Default is true.
   */
  mxClipboard.removeCells = function (graph, cells, includeEdges) {
    graph.removeCells(cells, includeEdges)
  }

  mxOutput.mxClipboard = mxClipboard
}
