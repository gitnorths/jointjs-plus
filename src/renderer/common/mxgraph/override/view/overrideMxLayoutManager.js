export function overrideMxLayoutManager (mxOutput) {
  const { mxEvent, mxLayoutManager, mxUtils } = mxOutput
  // mxLayoutManager start
  /**
   * Function: hasLayout
   *
   * Returns true if the given cell has a layout. This implementation invokes
   * <getLayout> with <mxEvent.LAYOUT_CELLS> as the eventName. Override this
   * if creating layouts in <getLayout> is expensive and return true if
   * <getLayout> will return a layout for the given cell for
   * <mxEvent.BEGIN_UPDATE> or <mxEvent.END_UPDATE>.
   */
  mxLayoutManager.prototype.hasLayout = function (cell) {
    return this.getLayout(cell, mxEvent.LAYOUT_CELLS) != null
  }
  /**
   * Function: getCellsForChange
   *
   * Executes all layouts which have been scheduled during the
   * changes.
   */
  mxLayoutManager.prototype.getCellsForChange = function (change) {
    // if (change instanceof mxChildChange) {
    //   return this.addCellsWithLayout(change.child, this.addCellsWithLayout(change.previous))
    // } else if (change instanceof mxValueChange || change instanceof mxTerminalChange || change instanceof mxGeometryChange || change instanceof mxVisibleChange || change instanceof mxStyleChange) {
    //   return this.addCellsWithLayout(change.cell)
    // }
    if (change.constructor.name === 'mxChildChange') {
      return this.addCellsWithLayout(change.child, this.addCellsWithLayout(change.previous))
    } else if (change.constructor.name === 'mxValueChange' ||
      change.constructor.name === 'mxTerminalChange' ||
      change.constructor.name === 'mxGeometryChange' ||
      change.constructor.name === 'mxVisibleChange' ||
      change.constructor.name === 'mxStyleChange') {
      return this.addCellsWithLayout(change.cell)
    }

    return []
  }
  /**
   * Function: addAncestorsWithLayout
   *
   * Adds all ancestors of the given cell that have a layout.
   */
  mxLayoutManager.prototype.addAncestorsWithLayout = function (cell, result) {
    result = (result != null) ? result : []

    if (cell != null) {
      if (this.hasLayout(cell)) {
        result.push(cell)
      }

      if (this.isBubbling()) {
        const model = this.getGraph().getModel()
        this.addAncestorsWithLayout(model.getParent(cell), result)
      }
    }

    return result
  }
  /**
   * Function: executeLayoutForCells
   *
   * Executes all layouts for the given cells in two phases: In the first phase
   * layouts for child cells are executed before layouts for parent cells with
   * <mxEvent.BEGIN_UPDATE>, in the second phase layouts for parent cells are
   * executed before layouts for child cells with <mxEvent.END_UPDATE>.
   */
  mxLayoutManager.prototype.executeLayoutForCells = function (cells) {
    const model = this.getGraph().getModel()

    model.beginUpdate()
    try {
      const sorted = mxUtils.sortCells(cells, false)
      this.layoutCells(sorted, true)
      this.layoutCells(sorted.reverse(), false)
    } finally {
      model.endUpdate()
    }
  }
  // mxLayoutManager end
  mxOutput.mxLayoutManager = mxLayoutManager
}
