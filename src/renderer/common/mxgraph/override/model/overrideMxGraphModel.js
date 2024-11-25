export function overrideMxGraphModel (mxOutput) {
  const { mxGraphModel, mxObjectIdentity } = mxOutput
  /**
   * Function: getCells
   *
   * Returns the cells in this model.
   */
  mxGraphModel.prototype.getCells = function () {
    const result = []

    if (this.cells != null) {
      for (const key in this.cells) {
        result.push(this.cells[key])
      }
    }

    return result
  }

  /**
   * Function: getCellCount
   *
   * Returns the number of cells in the model.
   */
  mxGraphModel.prototype.getCellCount = function () {
    let count = 0

    if (this.cells != null) {
      for (const key in this.cells) {
        count++
      }
    }

    return count
  }
  /**
   * Function: cloneCell
   *
   * Returns a deep clone of the given <mxCell> (including
   * the children) which is created using <cloneCells>.
   *
   * Parameters:
   *
   * cell - <mxCell> to be cloned.
   * includeChildren - Optional boolean indicating if the cells should be cloned
   * with all descendants. Default is true.
   * identical - Optional boolean to keep the identity of cloned cells.
   * Default is false.
   */
  mxGraphModel.prototype.cloneCell = function (cell, includeChildren, identical) {
    if (cell != null) {
      return this.cloneCells([cell], includeChildren, null, identical)[0]
    }

    return null
  }
  /**
   * Function: cloneCells
   *
   * Returns an array of clones for the given array of <mxCells>.
   * Depending on the value of includeChildren, a deep clone is created for
   * each cell. Connections are restored based if the corresponding
   * cell is contained in the passed in array.
   *
   * Parameters:
   *
   * cells - Array of <mxCell> to be cloned.
   * includeChildren - Optional boolean indicating if the cells should be cloned
   * with all descendants. Default is true.
   * mapping - Optional mapping for existing clones.
   * identical - Optional boolean to keep the cell IDs. Default is false.
   */
  mxGraphModel.prototype.cloneCells = function (cells, includeChildren, mapping, identical) {
    includeChildren = (includeChildren != null) ? includeChildren : true
    mapping = (mapping != null) ? mapping : {}
    identical = (identical != null) ? identical : false
    const clones = []

    for (let i = 0; i < cells.length; i++) {
      if (cells[i] != null) {
        clones.push(this.cloneCellImpl(cells[i], mapping, includeChildren, identical))
      } else {
        clones.push(null)
      }
    }

    for (let i = 0; i < clones.length; i++) {
      if (clones[i] != null) {
        this.restoreClone(clones[i], cells[i], mapping)
      }
    }

    return clones
  }

  /**
   * Function: cloneCellImpl
   *
   * Inner helper method for cloning cells recursively.
   */
  mxGraphModel.prototype.cloneCellImpl = function (cell, mapping, includeChildren, identical) {
    const ident = mxObjectIdentity.get(cell)
    let clone = mapping[ident]

    if (clone == null) {
      clone = this.cellCloned(cell)
      mapping[ident] = clone

      if (identical) {
        clone.id = cell.id
      }

      if (includeChildren) {
        const childCount = this.getChildCount(cell)

        for (let i = 0; i < childCount; i++) {
          const cloneChild = this.cloneCellImpl(
            this.getChildAt(cell, i),
            mapping, true, identical)
          clone.insert(cloneChild)
        }
      }
    }

    return clone
  }
  mxOutput.mxGraphModel = mxGraphModel
}
