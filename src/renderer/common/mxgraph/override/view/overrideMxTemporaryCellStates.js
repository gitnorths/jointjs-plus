export function overrideMxTemporaryCellStates (mxOutput) {
  const { mxDictionary, mxRectangle } = mxOutput

  // mxTemporaryCellStates start
  /**
   * Class: mxTemporaryCellStates
   *
   * Creates a temporary set of cell states.
   */
  function mxTemporaryCellStates (view, scale, cells, isCellVisibleFn, getLinkForCellState, getLinkTargetForCellState) {
    scale = (scale != null) ? scale : 1
    this.view = view

    // Stores the previous state
    this.oldValidateCellState = view.validateCellState
    this.oldBounds = view.getGraphBounds()
    this.oldStates = view.getStates()
    this.oldScale = view.getScale()
    this.oldDoRedrawShape = view.graph.cellRenderer.doRedrawShape

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this

    // Overrides doRedrawShape and paint shape to add links on shapes
    if (getLinkForCellState != null) {
      view.graph.cellRenderer.doRedrawShape = function (state) {
        const oldPaint = state.shape.paint

        state.shape.paint = function (c) {
          const link = getLinkForCellState(state)

          if (link != null) {
            c.setLink(link, (getLinkTargetForCellState != null) ? getLinkTargetForCellState(state) : null)
          }

          oldPaint.apply(this, arguments)

          if (link != null) {
            c.setLink(null)
          }
        }

        self.oldDoRedrawShape.apply(view.graph.cellRenderer, arguments)
        state.shape.paint = oldPaint
      }
    }

    // Overrides validateCellState to ignore invisible cells
    view.validateCellState = function (cell, resurse) {
      if (cell == null || isCellVisibleFn == null || isCellVisibleFn(cell)) {
        return self.oldValidateCellState.apply(view, arguments)
      }

      return null
    }

    // Creates space for new states
    view.setStates(new mxDictionary())
    view.setScale(scale)

    if (cells != null) {
      view.resetValidationState()
      let bbox = null

      // Validates the vertices and edges without adding them to
      // the model so that the original cells are not modified
      for (let i = 0; i < cells.length; i++) {
        const bounds = view.getBoundingBox(view.validateCellState(view.validateCell(cells[i])))

        if (bbox == null) {
          bbox = bounds
        } else {
          bbox.add(bounds)
        }
      }

      view.setGraphBounds(bbox || new mxRectangle())
    }
  }

  mxTemporaryCellStates.prototype = Object.create(mxOutput.mxTemporaryCellStates.prototype)

  // mxTemporaryCellStates end
  mxOutput.mxTemporaryCellStates = mxTemporaryCellStates
}
