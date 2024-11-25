export function overrideMxConstraintHandler (mxOutput) {
  const { mxConstraintHandler, mxEvent, mxUtils, mxRectangle, mxConstants, mxImageShape } = mxOutput
  /**
   * Function: isKeepFocusEvent
   *
   * Returns true if the current focused state should not be changed for the given event.
   * This returns true if shift is pressed and alt is not pressed.
   */
  mxConstraintHandler.prototype.isKeepFocusEvent = function (me) {
    return mxEvent.isShiftDown(me.getEvent()) && !mxEvent.isAltDown(me.getEvent())
  }

  /**
   * Function: update
   *
   * Updates the state of this handler based on the given <mxMouseEvent>.
   * Source is a boolean indicating if the cell is a source or target.
   */
  mxConstraintHandler.prototype.update = function (me, source, existingEdge, point) {
    if (this.isEnabled() && !this.isEventIgnored(me)) {
      // Lazy installation of mouseleave handler
      if (this.mouseleaveHandler == null && this.graph.container != null) {
        this.mouseleaveHandler = mxUtils.bind(this, function () {
          this.reset()
        })

        mxEvent.addListener(this.graph.container, 'mouseleave', this.resetHandler)
      }

      const tol = this.getTolerance(me)
      const x = (point != null) ? point.x : me.getGraphX()
      const y = (point != null) ? point.y : me.getGraphY()
      const grid = new mxRectangle(x - tol, y - tol, 2 * tol, 2 * tol)
      const mouse = new mxRectangle(me.getGraphX() - tol, me.getGraphY() - tol, 2 * tol, 2 * tol)
      const state = this.graph.view.getState(this.getCellForEvent(me, point))

      // Keeps focus icons visible while over vertex bounds and no other cell under mouse or shift is pressed
      if (!this.isKeepFocusEvent(me) && (this.currentFocusArea == null || this.currentFocus == null ||
        (state != null) || !this.graph.getModel().isVertex(this.currentFocus.cell) ||
        !mxUtils.intersects(this.currentFocusArea, mouse)) && (state !== this.currentFocus)) {
        this.currentFocusArea = null
        this.currentFocus = null
        this.setFocus(me, state, source)
      }

      this.currentConstraint = null
      this.currentPoint = null
      let minDistSq = null

      if (this.focusIcons != null && this.constraints != null &&
        (state == null || this.currentFocus === state)) {
        const cx = mouse.getCenterX()
        const cy = mouse.getCenterY()

        for (let i = 0; i < this.focusIcons.length; i++) {
          const dx = cx - this.focusIcons[i].bounds.getCenterX()
          const dy = cy - this.focusIcons[i].bounds.getCenterY()
          const tmp1 = dx * dx + dy * dy

          if ((this.intersects(this.focusIcons[i], mouse, source, existingEdge) || (point != null &&
              this.intersects(this.focusIcons[i], grid, source, existingEdge))) &&
            (minDistSq == null || tmp1 < minDistSq)) {
            this.currentConstraint = this.constraints[i]
            this.currentPoint = this.focusPoints[i]
            minDistSq = tmp1

            const tmp = this.focusIcons[i].bounds.clone()
            tmp.grow(mxConstants.HIGHLIGHT_SIZE + 1)
            tmp.width -= 1
            tmp.height -= 1

            if (this.focusHighlight == null) {
              const hl = this.createHighlightShape()
              hl.dialect = mxConstants.DIALECT_SVG
              hl.pointerEvents = false

              hl.init(this.graph.getView().getOverlayPane())
              this.focusHighlight = hl

              const getState = mxUtils.bind(this, function () {
                return (this.currentFocus != null) ? this.currentFocus : state
              })

              mxEvent.redirectMouseEvents(hl.node, this.graph, getState)
            }

            this.focusHighlight.bounds = tmp
            this.focusHighlight.redraw()
          }
        }
      }

      if (this.currentConstraint == null) {
        this.destroyFocusHighlight()
      }
    } else {
      this.currentConstraint = null
      this.currentFocus = null
      this.currentPoint = null
    }
  }

  /**
   * Function: setFocus
   *
   * Transfers the focus to the given state as a source or target terminal. If
   * the handler is not enabled then the outline is painted, but the constraints
   * are ignored.
   */
  mxConstraintHandler.prototype.setFocus = function (me, state, source) {
    this.constraints = (state != null && !this.isStateIgnored(state, source) &&
      this.graph.isCellConnectable(state.cell))
      ? ((this.isEnabled())
        ? (this.graph.getAllConnectionConstraints(state, source) || [])
        : [])
      : null

    // Only uses cells which have constraints
    if (this.constraints != null) {
      this.currentFocus = state
      this.currentFocusArea = new mxRectangle(state.x, state.y, state.width, state.height)

      if (this.focusIcons != null) {
        for (let i = 0; i < this.focusIcons.length; i++) {
          this.focusIcons[i].destroy()
        }

        this.focusIcons = null
        this.focusPoints = null
      }

      this.focusPoints = []
      this.focusIcons = []

      for (let i = 0; i < this.constraints.length; i++) {
        const cp = this.graph.getConnectionPoint(state, this.constraints[i])
        const img = this.getImageForConstraint(state, this.constraints[i], cp)

        const src = img.src
        const bounds = new mxRectangle(Math.round(cp.x - img.width / 2),
          Math.round(cp.y - img.height / 2), img.width, img.height)
        const icon = new mxImageShape(bounds, src)
        icon.dialect = (this.graph.dialect !== mxConstants.DIALECT_SVG)
          ? mxConstants.DIALECT_MIXEDHTML
          : mxConstants.DIALECT_SVG
        icon.preserveImageAspect = false
        icon.init(this.graph.getView().getDecoratorPane())

        // Move the icon behind all other overlays
        if (icon.node.previousSibling != null) {
          icon.node.parentNode.insertBefore(icon.node, icon.node.parentNode.firstChild)
        }

        const getState = mxUtils.bind(this, function () {
          return (this.currentFocus != null) ? this.currentFocus : state
        })

        icon.redraw()

        mxEvent.redirectMouseEvents(icon.node, this.graph, getState)
        this.currentFocusArea.add(icon.bounds)
        this.focusIcons.push(icon)
        this.focusPoints.push(cp)
      }

      this.currentFocusArea.grow(this.getTolerance(me))
    } else {
      this.destroyIcons()
      this.destroyFocusHighlight()
    }
  }
  mxOutput.mxConstraintHandler = mxConstraintHandler
}
