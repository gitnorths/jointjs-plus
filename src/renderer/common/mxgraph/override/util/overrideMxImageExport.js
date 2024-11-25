export function overrideMxImageExport (mxOutput) {
  const { mxImageExport, mxShape } = mxOutput

  /**
   * Function: getTitleForCellState
   *
   * Returns the title for the given cell state and canvas. This returns null.
   */
  mxImageExport.prototype.getTitleForCellState = function (state, canvas) {
    return null
  }

  /**
   * Function: getLinkForCellState
   *
   * Returns the link for the given cell state and canvas. This returns null.
   */
  mxImageExport.prototype.getLinkForCellState = function (state, canvas) {
    return null
  }

  /**
   * Function: getLinkTargetForCellState
   *
   * Returns the link target for the given cell state and canvas. This returns null.
   */
  mxImageExport.prototype.getLinkTargetForCellState = function (state, canvas) {
    return null
  }

  /**
   * Function: drawCellState
   *
   * Draws the given state to the given canvas.
   */
  mxImageExport.prototype.drawCellState = function (state, canvas) {
    // Experimental feature
    const link = this.getLinkForCellState(state, canvas)

    if (link != null) {
      canvas.setLink(link, this.getLinkTargetForCellState(state, canvas))
    }

    // Experimental feature
    const title = this.getTitleForCellState(state, canvas)

    if (title != null) {
      canvas.setTitle(title)
    }

    // Paints the shape and text
    this.drawShape(state, canvas)
    this.drawText(state, canvas)

    if (title != null) {
      canvas.setTitle(null)
    }

    if (link != null) {
      canvas.setLink(null)
    }
  }

  /**
   * Function: drawShape
   *
   * Draws the shape of the given state.
   */
  mxImageExport.prototype.drawShape = function (state, canvas) {
    if (state.shape instanceof mxShape) {
      this.doDrawShape(state.shape, canvas)
    }
  }

  /**
   * Function: drawText
   *
   * Draws the text of the given state.
   */
  mxImageExport.prototype.drawText = function (state, canvas) {
    this.doDrawShape(state.text, canvas)
  }

  /**
   * Function: doDrawShape
   *
   * Draws the given shape on the given canvas.
   */
  mxImageExport.prototype.doDrawShape = function (shape, canvas) {
    if (shape != null && shape.checkBounds()) {
      const root = canvas.root
      const node = shape.node

      canvas.root = shape.createSvg()
      root.appendChild(canvas.root)
      shape.node = canvas.root
      canvas.save()

      shape.beforePaint(canvas)
      shape.paint(canvas)
      shape.afterPaint(canvas)

      canvas.restore()
      shape.node = node
      canvas.root = root
    }
  }

  mxOutput.mxImageExport = mxImageExport
}
