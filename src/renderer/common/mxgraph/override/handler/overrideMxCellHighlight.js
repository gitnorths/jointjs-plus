export function overrideMxCellHighlight (mxOutput) {
  const { mxCellHighlight, mxConstants, mxEvent, mxRectangle } = mxOutput
  /**
   * Function: createShape
   *
   * Creates and returns the highlight shape for the given state.
   */
  mxCellHighlight.prototype.createShape = function () {
    const shape = this.graph.cellRenderer.createShape(this.state)

    shape.svgStrokeTolerance = this.graph.tolerance
    shape.points = this.state.absolutePoints
    shape.apply(this.state)
    shape.stroke = this.highlightColor
    shape.opacity = this.opacity
    shape.isDashed = this.dashed
    shape.isShadow = false

    shape.dialect = mxConstants.DIALECT_SVG
    shape.init(this.graph.getView().getOverlayPane())
    mxEvent.redirectMouseEvents(shape.node, this.graph, this.state)

    if (this.graph.dialect !== mxConstants.DIALECT_SVG) {
      shape.pointerEvents = false
    } else {
      shape.svgPointerEvents = 'stroke'
    }

    return shape
  }

  /**
   * Function: repaint
   *
   * Updates the highlight after a change of the model or view.
   */
  mxCellHighlight.prototype.repaint = function () {
    if (this.state != null && this.shape != null) {
      this.shape.scale = this.state.view.scale

      if (this.graph.model.isEdge(this.state.cell)) {
        this.shape.strokewidth = this.getStrokeWidth()
        this.shape.points = this.state.absolutePoints
        this.shape.outline = false
      } else {
        this.shape.bounds = new mxRectangle(this.state.x - this.spacing, this.state.y - this.spacing,
          this.state.width + 2 * this.spacing, this.state.height + 2 * this.spacing)
        this.shape.rotation = Number(this.state.style[mxConstants.STYLE_ROTATION] || '0')
        this.shape.strokewidth = this.getStrokeWidth() / this.state.view.scale
        this.shape.outline = true
      }

      // Uses cursor from shape in highlight
      if (this.state.shape != null) {
        this.shape.setCursor(this.state.shape.getCursor())
      }

      this.shape.redraw()
    }
  }

  /**
   * Function: isHighlightAt
   *
   * Returns true if this highlight is at the given position.
   */
  mxCellHighlight.prototype.isHighlightAt = function (x, y) {
    let hit = false

    // Quirks mode is currently not supported as it used a different coordinate system
    if (this.shape != null && document.elementFromPoint != null) {
      let elt = document.elementFromPoint(x, y)

      while (elt != null) {
        if (elt === this.shape.node) {
          hit = true
          break
        }

        elt = elt.parentNode
      }
    }

    return hit
  }
  mxOutput.mxCellHighlight = mxCellHighlight
}
