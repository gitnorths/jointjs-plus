export function overrideMxSwimlane (mxOutput) {
  const { mxSwimlane, mxShape, mxUtils, mxConstants, mxRectangle } = mxOutput
  /**
   * Function: apply
   *
   * Extends mxShape to update the swimlane styles.
   *
   * Parameters:
   *
   * state - <mxCellState> of the corresponding cell.
   */
  mxSwimlane.prototype.apply = function (state) {
    const old = this.spacing
    mxShape.prototype.apply.apply(this, arguments)

    if (this.style != null) {
      this.laneFill = mxUtils.getValue(this.style,
        mxConstants.STYLE_SWIMLANE_FILLCOLOR,
        mxConstants.NONE)
    }
  }

  /**
   * Function: isRoundable
   *
   * Adds roundable support.
   */
  mxSwimlane.prototype.isRoundable = function () {
    return true
  }
  /**
   * Function: getLabelBounds
   *
   * Returns the bounding box for the label.
   */
  mxSwimlane.prototype.getLabelBounds = function (rect) {
    const flipH = mxUtils.getValue(this.style, mxConstants.STYLE_FLIPH, 0) === 1
    const flipV = mxUtils.getValue(this.style, mxConstants.STYLE_FLIPV, 0) === 1
    const bounds = new mxRectangle(rect.x, rect.y, rect.width, rect.height)
    const horizontal = this.isHorizontal()
    const start = this.getTitleSize()

    // East is default
    const shapeVertical = (this.direction === mxConstants.DIRECTION_NORTH ||
      this.direction === mxConstants.DIRECTION_SOUTH)
    const realHorizontal = horizontal === !shapeVertical
    const realFlipH = !realHorizontal && flipH !==
      (this.direction === mxConstants.DIRECTION_SOUTH ||
        this.direction === mxConstants.DIRECTION_WEST)
    const realFlipV = realHorizontal && flipV !==
      (this.direction === mxConstants.DIRECTION_SOUTH ||
        this.direction === mxConstants.DIRECTION_WEST)

    // Shape is horizontal
    if (!shapeVertical) {
      const tmp = Math.min(bounds.height, start * this.scale)

      if (realFlipH || realFlipV) {
        bounds.y += bounds.height - tmp
      }

      bounds.height = tmp
    } else {
      const tmp = Math.min(bounds.width, start * this.scale)

      if (realFlipH || realFlipV) {
        bounds.x += bounds.width - tmp
      }

      bounds.width = tmp
    }

    return bounds
  }

  /**
   * Function: getGradientBounds
   *
   * Returns the bounding box for the gradient box for this shape.
   */
  mxSwimlane.prototype.getGradientBounds = function (c, x, y, w, h) {
    const start = this.getTitleSize()

    if (this.isHorizontal()) {
      return new mxRectangle(x, y, w, Math.min(start, h))
    } else {
      return new mxRectangle(x, y, Math.min(start, w), h)
    }
  }

  /**
   * Function: paintVertexShape
   *
   * Paints the swimlane vertex shape.
   */
  mxSwimlane.prototype.paintVertexShape = function (c, x, y, w, h) {
    if (!this.outline) {
      let start = this.getTitleSize()
      let r = 0

      if (this.isHorizontal()) {
        start = Math.min(start, h)
      } else {
        start = Math.min(start, w)
      }

      c.translate(x, y)

      if (!this.isRounded) {
        this.paintSwimlane(c, x, y, w, h, start)
      } else {
        r = this.getSwimlaneArcSize(w, h, start)
        r = Math.min(((this.isHorizontal()) ? h : w) - start, Math.min(start, r))
        this.paintRoundedSwimlane(c, x, y, w, h, start, r)
      }

      const sep = mxUtils.getValue(this.style, mxConstants.STYLE_SEPARATORCOLOR, mxConstants.NONE)
      this.paintSeparator(c, x, y, w, h, start, sep)

      if (this.image != null) {
        const bounds = this.getImageBounds(x, y, w, h)
        const clipPath = mxUtils.getValue(this.style, mxConstants.STYLE_CLIP_PATH, null)
        c.image(bounds.x - x, bounds.y - y, bounds.width, bounds.height,
          this.image, false, false, false, clipPath)
      }

      if (this.glass) {
        c.setShadow(false)
        this.paintGlassEffect(c, 0, 0, w, start, r)
      }
    }
  }

  /**
   * Function: configurePointerEvents
   *
   * Paints the swimlane vertex shape.
   */
  mxSwimlane.prototype.configurePointerEvents = function (c) {
    let events = true
    let head = true
    let body = true

    if (this.style != null) {
      events = mxUtils.getValue(this.style, mxConstants.STYLE_POINTER_EVENTS, '1') === '1'
      head = mxUtils.getValue(this.style, mxConstants.STYLE_SWIMLANE_HEAD, 1) === 1
      body = mxUtils.getValue(this.style, mxConstants.STYLE_SWIMLANE_BODY, 1) === 1
    }
    if (events || head || body) {
      mxShape.prototype.configurePointerEvents.apply(this, arguments)
    }
  }

  /**
   * Function: paintSwimlane
   *
   * Paints the swimlane vertex shape.
   */
  mxSwimlane.prototype.paintSwimlane = function (c, x, y, w, h, start) {
    const fill = this.laneFill
    let events = true
    let line = true
    let head = true
    let body = true

    if (this.style != null) {
      events = mxUtils.getValue(this.style, mxConstants.STYLE_POINTER_EVENTS, '1') === '1'
      line = mxUtils.getValue(this.style, mxConstants.STYLE_SWIMLANE_LINE, 1) === 1
      head = mxUtils.getValue(this.style, mxConstants.STYLE_SWIMLANE_HEAD, 1) === 1
      body = mxUtils.getValue(this.style, mxConstants.STYLE_SWIMLANE_BODY, 1) === 1
    }

    if (this.isHorizontal()) {
      c.begin()
      c.moveTo(0, start)
      c.lineTo(0, 0)
      c.lineTo(w, 0)
      c.lineTo(w, start)

      if (head) {
        c.fillAndStroke()
      } else {
        c.fill()
      }

      if (start < h) {
        if (fill === mxConstants.NONE || !events) {
          c.pointerEvents = false
        }

        if (fill !== mxConstants.NONE) {
          c.setFillColor(fill)
        }

        c.begin()
        c.moveTo(0, start)
        c.lineTo(0, h)
        c.lineTo(w, h)
        c.lineTo(w, start)

        if (body) {
          if (fill === mxConstants.NONE) {
            c.stroke()
          } else if (body) {
            c.fillAndStroke()
          }
        } else if (fill !== mxConstants.NONE) {
          c.fill()
        }
      }
    } else {
      c.begin()
      c.moveTo(start, 0)
      c.lineTo(0, 0)
      c.lineTo(0, h)
      c.lineTo(start, h)

      if (head) {
        c.fillAndStroke()
      } else {
        c.fill()
      }

      if (start < w) {
        if (fill === mxConstants.NONE || !events) {
          c.pointerEvents = false
        }

        if (fill !== mxConstants.NONE) {
          c.setFillColor(fill)
        }

        c.begin()
        c.moveTo(start, 0)
        c.lineTo(w, 0)
        c.lineTo(w, h)
        c.lineTo(start, h)

        if (body) {
          if (fill === mxConstants.NONE) {
            c.stroke()
          } else if (body) {
            c.fillAndStroke()
          }
        } else if (fill !== mxConstants.NONE) {
          c.fill()
        }
      }
    }

    if (line) {
      this.paintDivider(c, x, y, w, h, start, fill === mxConstants.NONE)
    }
  }

  /**
   * Function: paintRoundedSwimlane
   *
   * Paints the swimlane vertex shape.
   */
  mxSwimlane.prototype.paintRoundedSwimlane = function (c, x, y, w, h, start, r) {
    const fill = this.laneFill
    let events = true
    let line = true
    let head = true
    let body = true

    if (this.style != null) {
      events = mxUtils.getValue(this.style, mxConstants.STYLE_POINTER_EVENTS, '1') === '1'
      line = mxUtils.getValue(this.style, mxConstants.STYLE_SWIMLANE_LINE, 1) === 1
      head = mxUtils.getValue(this.style, mxConstants.STYLE_SWIMLANE_HEAD, 1) === 1
      body = mxUtils.getValue(this.style, mxConstants.STYLE_SWIMLANE_BODY, 1) === 1
    }

    if (this.isHorizontal()) {
      c.begin()
      c.moveTo(w, start)
      c.lineTo(w, r)
      c.quadTo(w, 0, w - Math.min(w / 2, r), 0)
      c.lineTo(Math.min(w / 2, r), 0)
      c.quadTo(0, 0, 0, r)
      c.lineTo(0, start)

      if (head) {
        c.fillAndStroke()
      } else {
        c.fill()
      }

      if (start < h) {
        if (fill === mxConstants.NONE || !events) {
          c.pointerEvents = false
        }

        if (fill !== mxConstants.NONE) {
          c.setFillColor(fill)
        }

        c.begin()
        c.moveTo(0, start)
        c.lineTo(0, h - r)
        c.quadTo(0, h, Math.min(w / 2, r), h)
        c.lineTo(w - Math.min(w / 2, r), h)
        c.quadTo(w, h, w, h - r)
        c.lineTo(w, start)

        if (body) {
          if (fill === mxConstants.NONE) {
            c.stroke()
          } else if (body) {
            c.fillAndStroke()
          }
        } else if (fill !== mxConstants.NONE) {
          c.fill()
        }
      }
    } else {
      c.begin()
      c.moveTo(start, 0)
      c.lineTo(r, 0)
      c.quadTo(0, 0, 0, Math.min(h / 2, r))
      c.lineTo(0, h - Math.min(h / 2, r))
      c.quadTo(0, h, r, h)
      c.lineTo(start, h)

      if (head) {
        c.fillAndStroke()
      } else {
        c.fill()
      }

      if (start < w) {
        if (fill === mxConstants.NONE || !events) {
          c.pointerEvents = false
        }

        if (fill !== mxConstants.NONE) {
          c.setFillColor(fill)
        }

        c.begin()
        c.moveTo(start, h)
        c.lineTo(w - r, h)
        c.quadTo(w, h, w, h - Math.min(h / 2, r))
        c.lineTo(w, Math.min(h / 2, r))
        c.quadTo(w, 0, w - r, 0)
        c.lineTo(start, 0)

        if (body) {
          if (fill === mxConstants.NONE) {
            c.stroke()
          } else if (body) {
            c.fillAndStroke()
          }
        } else if (fill !== mxConstants.NONE) {
          c.fill()
        }
      }
    }

    if (line) {
      this.paintDivider(c, x, y, w, h, start, fill === mxConstants.NONE)
    }
  }

  /**
   * Function: paintDivider
   *
   * Paints the divider between swimlane title and content area.
   */
  mxSwimlane.prototype.paintDivider = function (c, x, y, w, h, start, shadow) {
    if (start !== 0) {
      if (!shadow) {
        c.setShadow(false)
      }

      c.begin()

      if (this.isHorizontal()) {
        c.moveTo(0, start)
        c.lineTo(w, start)
      } else {
        c.moveTo(start, 0)
        c.lineTo(start, h)
      }

      c.stroke()
    }
  }

  mxOutput.mxSwimlane = mxSwimlane
}
