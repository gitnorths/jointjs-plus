export function overrideMxGuide (mxOutput) {
  const { mxConstants, mxGuide, mxPoint } = mxOutput
  /**
   * Function: move
   *
   * Moves the <bounds> by the given <mxPoint> and return the snapped point.
   */
  mxGuide.prototype.move = function (bounds, delta, gridEnabled, clone) {
    if (this.states != null && (this.horizontal || this.vertical) && bounds != null && delta != null) {
      const scale = this.graph.getView().scale
      const tt = this.getGuideTolerance(gridEnabled) * scale
      const b = bounds.clone()
      b.x += delta.x
      b.y += delta.y
      let overrideX = false
      let stateX = null
      let valueX = null
      let overrideY = false
      let stateY = null
      let valueY = null
      let ttX = tt
      let ttY = tt
      const left = b.x
      const right = b.x + b.width
      const center = b.getCenterX()
      const top = b.y
      const bottom = b.y + b.height
      const middle = b.getCenterY()

      // Snaps the left, center and right to the given x-coordinate
      function snapX (x, state, centerAlign) {
        let override = false

        if (centerAlign && Math.abs(x - center) < ttX) {
          delta.x = x - bounds.getCenterX()
          ttX = Math.abs(x - center)
          override = true
        } else if (!centerAlign) {
          if (Math.abs(x - left) < ttX) {
            delta.x = x - bounds.x
            ttX = Math.abs(x - left)
            override = true
          } else if (Math.abs(x - right) < ttX) {
            delta.x = x - bounds.x - bounds.width
            ttX = Math.abs(x - right)
            override = true
          }
        }

        if (override) {
          stateX = state
          valueX = x

          if (this.guideX == null) {
            this.guideX = this.createGuideShape(true)

            // Makes sure to use either SVG shapes in order to implement
            // event-transparency on the background area of the rectangle since
            // HTML shapes do not let mouse events through even when transparent
            this.guideX.dialect = mxConstants.DIALECT_SVG
            this.guideX.pointerEvents = false
            this.guideX.init(this.graph.getView().getOverlayPane())
          }
        }

        overrideX = overrideX || override
      }

      // Snaps the top, middle or bottom to the given y-coordinate
      function snapY (y, state, centerAlign) {
        let override = false

        if (centerAlign && Math.abs(y - middle) < ttY) {
          delta.y = y - bounds.getCenterY()
          ttY = Math.abs(y - middle)
          override = true
        } else if (!centerAlign) {
          if (Math.abs(y - top) < ttY) {
            delta.y = y - bounds.y
            ttY = Math.abs(y - top)
            override = true
          } else if (Math.abs(y - bottom) < ttY) {
            delta.y = y - bounds.y - bounds.height
            ttY = Math.abs(y - bottom)
            override = true
          }
        }

        if (override) {
          stateY = state
          valueY = y

          if (this.guideY == null) {
            this.guideY = this.createGuideShape(false)

            // Makes sure to use either SVG shapes in order to implement
            // event-transparency on the background area of the rectangle since
            // HTML shapes do not let mouse events through even when transparent
            this.guideY.dialect = mxConstants.DIALECT_SVG
            this.guideY.pointerEvents = false
            this.guideY.init(this.graph.getView().getOverlayPane())
          }
        }

        overrideY = overrideY || override
      }

      for (let i = 0; i < this.states.length; i++) {
        const state = this.states[i]

        if (state != null && !this.isStateIgnored(state)) {
          // Align x
          if (this.horizontal) {
            snapX.call(this, state.getCenterX(), state, true)
            snapX.call(this, state.x, state, false)
            snapX.call(this, state.x + state.width, state, false)

            // Aligns left and right of shape to center of page
            if (state.cell == null) {
              snapX.call(this, state.getCenterX(), state, false)
            }
          }

          // Align y
          if (this.vertical) {
            snapY.call(this, state.getCenterY(), state, true)
            snapY.call(this, state.y, state, false)
            snapY.call(this, state.y + state.height, state, false)

            // Aligns left and right of shape to center of page
            if (state.cell == null) {
              snapY.call(this, state.getCenterY(), state, false)
            }
          }
        }
      }

      // Moves cells to the raster if not aligned
      this.graph.snapDelta(delta, bounds, !gridEnabled, overrideX, overrideY)
      delta = this.getDelta(bounds, stateX, delta.x, stateY, delta.y)

      // Redraws the guides
      const c = this.graph.container

      if (!overrideX && this.guideX != null) {
        this.guideX.node.style.visibility = 'hidden'
      } else if (this.guideX != null) {
        let minY = null
        let maxY = null

        if (stateX != null) {
          minY = Math.min(bounds.y + delta.y - this.graph.panDy, stateX.y)
          maxY = Math.max(bounds.y + bounds.height + delta.y - this.graph.panDy, stateX.y + stateX.height)
        }

        if (minY != null && maxY != null) {
          this.guideX.points = [new mxPoint(valueX, minY), new mxPoint(valueX, maxY)]
        } else {
          this.guideX.points = [new mxPoint(valueX, -this.graph.panDy),
            new mxPoint(valueX, c.scrollHeight - 3 - this.graph.panDy)]
        }

        this.guideX.stroke = this.getGuideColor(stateX, true)
        this.guideX.node.style.visibility = 'visible'
        this.guideX.redraw()
      }

      if (!overrideY && this.guideY != null) {
        this.guideY.node.style.visibility = 'hidden'
      } else if (this.guideY != null) {
        let minX = null
        let maxX = null

        if (stateY != null) {
          minX = Math.min(bounds.x + delta.x - this.graph.panDx, stateY.x)
          maxX = Math.max(bounds.x + bounds.width + delta.x - this.graph.panDx, stateY.x + stateY.width)
        }

        if (minX != null && maxX != null) {
          this.guideY.points = [new mxPoint(minX, valueY), new mxPoint(maxX, valueY)]
        } else {
          this.guideY.points = [new mxPoint(-this.graph.panDx, valueY),
            new mxPoint(c.scrollWidth - 3 - this.graph.panDx, valueY)]
        }

        this.guideY.stroke = this.getGuideColor(stateY, false)
        this.guideY.node.style.visibility = 'visible'
        this.guideY.redraw()
      }
    }

    return delta
  }

  mxOutput.mxGuide = mxGuide
}
