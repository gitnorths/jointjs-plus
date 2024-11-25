export function overrideMxHierarchicalLayout (mxOutput) {
  const { mxHierarchicalLayout } = mxOutput
  /**
   * Variable: resetEdgeLabels
   *
   * Specifies if edge label positions should be reset to the center of the
   * edge. Default is true.
   */
  mxHierarchicalLayout.prototype.resetEdgeLabels = true
  mxOutput.mxHierarchicalLayout = mxHierarchicalLayout
}
