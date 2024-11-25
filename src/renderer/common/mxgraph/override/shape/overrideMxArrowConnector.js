export function overrideMxArrowConnector (mxOutput) {
  const { mxConstants, mxArrowConnector, mxUtils } = mxOutput
  /**
   * Function: paintEdgeShape
   *
   * Paints the line shape.
   */
  mxArrowConnector.prototype.paintEdgeShape = function (c, pts) {
    // Geometry of arrow
    let strokeWidth = this.strokewidth

    if (this.outline) {
      strokeWidth = Math.max(1, mxUtils.getNumber(this.style, mxConstants.STYLE_STROKEWIDTH, this.strokewidth))
    }

    const startWidth = this.getStartArrowWidth() + strokeWidth
    const endWidth = this.getEndArrowWidth() + strokeWidth
    const edgeWidth = this.outline ? this.getEdgeWidth() + strokeWidth : this.getEdgeWidth()
    const openEnded = this.isOpenEnded()
    const markerStart = this.isMarkerStart()
    const markerEnd = this.isMarkerEnd()
    const spacing = (openEnded) ? 0 : this.arrowSpacing + strokeWidth / 2
    const startSize = this.startSize + strokeWidth
    const endSize = this.endSize + strokeWidth
    const isRounded = this.isArrowRounded()

    // Base vector (between first points)
    const pe = pts[pts.length - 1]
    const dx = pts[1].x - pts[0].x
    const dy = pts[1].y - pts[0].y
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist === 0) {
      return
    }

    // Computes the norm and the inverse norm
    let nx = dx / dist
    let nx2
    let nx1 = nx
    let ny = dy / dist
    let ny2
    let ny1 = ny
    let orthx = edgeWidth * ny
    let orthy = -edgeWidth * nx

    // Stores the inbound function calls in reverse order in fns
    const fns = []

    if (isRounded) {
      c.setLineJoin('round')
    } else if (pts.length > 2) {
      // Only mitre if there are waypoints
      c.setMiterLimit(1.42)
    }

    c.begin()

    const startNx = nx
    const startNy = ny

    if (markerStart && !openEnded) {
      this.paintMarker(c, pts[0].x, pts[0].y, nx, ny, startSize, startWidth, edgeWidth, spacing, true)
    } else {
      const outStartX = pts[0].x + orthx / 2 + spacing * nx
      const outStartY = pts[0].y + orthy / 2 + spacing * ny
      const inEndX = pts[0].x - orthx / 2 + spacing * nx
      const inEndY = pts[0].y - orthy / 2 + spacing * ny

      if (openEnded) {
        c.moveTo(outStartX, outStartY)

        fns.push(function () {
          c.lineTo(inEndX, inEndY)
        })
      } else {
        c.moveTo(inEndX, inEndY)
        c.lineTo(outStartX, outStartY)
      }
    }

    let dx1 = 0
    let dy1 = 0
    let dist1 = 0

    for (let i = 0; i < pts.length - 2; i++) {
      // Work out in which direction the line is bending
      const pos = mxUtils.relativeCcw(pts[i].x, pts[i].y,
        pts[i + 1].x, pts[i + 1].y,
        pts[i + 2].x, pts[i + 2].y)

      dx1 = pts[i + 2].x - pts[i + 1].x
      dy1 = pts[i + 2].y - pts[i + 1].y

      dist1 = Math.sqrt(dx1 * dx1 + dy1 * dy1)

      if (dist1 !== 0) {
        nx1 = dx1 / dist1
        ny1 = dy1 / dist1

        const tmp1 = nx * nx1 + ny * ny1
        const tmp = Math.max(Math.sqrt((tmp1 + 1) / 2), 0.04)

        // Work out the normal orthogonal to the line through the control point and the edge sides intersection
        nx2 = (nx + nx1)
        ny2 = (ny + ny1)

        const dist2 = Math.sqrt(nx2 * nx2 + ny2 * ny2)

        if (dist2 !== 0) {
          nx2 = nx2 / dist2
          ny2 = ny2 / dist2

          // Higher strokewidths require a larger minimum bend, 0.35 covers all but the most extreme cases
          const strokeWidthFactor = Math.max(tmp, Math.min(this.strokewidth / 200 + 0.04, 0.35))
          const angleFactor = (pos !== 0 && isRounded) ? Math.max(0.1, strokeWidthFactor) : Math.max(tmp, 0.06)

          const outX = pts[i + 1].x + ny2 * edgeWidth / 2 / angleFactor
          const outY = pts[i + 1].y - nx2 * edgeWidth / 2 / angleFactor
          const inX = pts[i + 1].x - ny2 * edgeWidth / 2 / angleFactor
          const inY = pts[i + 1].y + nx2 * edgeWidth / 2 / angleFactor

          if (pos === 0 || !isRounded) {
            // If the two segments are aligned, or if we're not drawing curved sections between segments
            // just draw straight to the intersection point
            c.lineTo(outX, outY);

            (function (x, y) {
              fns.push(function () {
                c.lineTo(x, y)
              })
            })(inX, inY)
          } else if (pos === -1) {
            const c1x = inX + ny * edgeWidth
            const c1y = inY - nx * edgeWidth
            const c2x = inX + ny1 * edgeWidth
            const c2y = inY - nx1 * edgeWidth
            c.lineTo(c1x, c1y)
            c.quadTo(outX, outY, c2x, c2y);

            (function (x, y) {
              fns.push(function () {
                c.lineTo(x, y)
              })
            })(inX, inY)
          } else {
            c.lineTo(outX, outY);

            (function (x, y) {
              const c1x = outX - ny * edgeWidth
              const c1y = outY + nx * edgeWidth
              const c2x = outX - ny1 * edgeWidth
              const c2y = outY + nx1 * edgeWidth

              fns.push(function () {
                c.quadTo(x, y, c1x, c1y)
              })
              fns.push(function () {
                c.lineTo(c2x, c2y)
              })
            })(inX, inY)
          }

          nx = nx1
          ny = ny1
        }
      }
    }

    orthx = edgeWidth * ny1
    orthy = -edgeWidth * nx1

    if (markerEnd && !openEnded) {
      this.paintMarker(c, pe.x, pe.y, -nx, -ny, endSize, endWidth, edgeWidth, spacing, false)
    } else {
      c.lineTo(pe.x - spacing * nx1 + orthx / 2, pe.y - spacing * ny1 + orthy / 2)

      const inStartX = pe.x - spacing * nx1 - orthx / 2
      const inStartY = pe.y - spacing * ny1 - orthy / 2

      if (!openEnded) {
        c.lineTo(inStartX, inStartY)
      } else {
        c.moveTo(inStartX, inStartY)

        fns.splice(0, 0, function () {
          c.moveTo(inStartX, inStartY)
        })
      }
    }

    for (let i = fns.length - 1; i >= 0; i--) {
      fns[i]()
    }

    if (openEnded) {
      c.end()
      c.stroke()
    } else {
      c.close()
      c.fillAndStroke()
    }

    // Workaround for shadow on top of base arrow
    c.setShadow(false)

    // Need to redraw the markers without the low miter limit
    c.setMiterLimit(4)

    if (isRounded) {
      c.setLineJoin('flat')
    }

    if (pts.length > 2) {
      // Only to repaint markers if no waypoints
      // Need to redraw the markers without the low miter limit
      c.setMiterLimit(4)
      if (markerStart && !openEnded) {
        c.begin()
        this.paintMarker(c, pts[0].x, pts[0].y, startNx, startNy, startSize, startWidth, edgeWidth, spacing, true)
        c.stroke()
        c.end()
      }

      if (markerEnd && !openEnded) {
        c.begin()
        this.paintMarker(c, pe.x, pe.y, -nx, -ny, endSize, endWidth, edgeWidth, spacing, true)
        c.stroke()
        c.end()
      }
    }
  }
  mxOutput.mxArrowConnector = mxArrowConnector
}
