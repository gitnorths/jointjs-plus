export function overrideMxStencil (mxOutput) {
  const { mxConstants, mxPoint, mxStencil, mxUtils, mxStencilRegistry } = mxOutput
  /**
   * Function: parseColor
   *
   * Returns the color for given value.
   */
  mxStencil.prototype.parseColor = function (canvas, shape, node, value) {
    if (value === 'stroke') {
      value = shape.stroke
    } else if (value === 'fill') {
      value = shape.fill
    }

    return value
  }

  /**
   * Function: drawNode
   *
   * Draws this stencil inside the given bounds.
   */
  mxStencil.prototype.drawNode = function (canvas, shape, node, aspect, disableShadow, paint) {
    const name = node.nodeName
    const x0 = aspect.x
    const y0 = aspect.y
    const sx = aspect.width
    const sy = aspect.height
    const minScale = Math.min(sx, sy)

    if (name === 'save') {
      canvas.save()
    } else if (name === 'restore') {
      canvas.restore()
    } else if (paint) {
      if (name === 'path') {
        canvas.begin()

        let parseRegularly = true

        if (node.getAttribute('rounded') === '1') {
          parseRegularly = false

          const arcSize = Number(node.getAttribute('arcSize'))
          let pointCount = 0
          const segs = []

          // Renders the elements inside the given path
          let childNode = node.firstChild

          while (childNode != null) {
            if (childNode.nodeType === mxConstants.NODETYPE_ELEMENT) {
              const childName = childNode.nodeName

              if (childName === 'move' || childName === 'line') {
                if (childName === 'move' || segs.length === 0) {
                  segs.push([])
                }

                segs[segs.length - 1].push(new mxPoint(x0 + Number(childNode.getAttribute('x')) * sx,
                  y0 + Number(childNode.getAttribute('y')) * sy))
                pointCount++
              } else {
                // We only support move and line for rounded corners
                parseRegularly = true
                break
              }
            }

            childNode = childNode.nextSibling
          }

          if (!parseRegularly && pointCount > 0) {
            for (let i = 0; i < segs.length; i++) {
              let close = false
              const ps = segs[i][0]
              const pe = segs[i][segs[i].length - 1]

              if (ps.x === pe.x && ps.y === pe.y) {
                segs[i].pop()
                close = true
              }

              this.addPoints(canvas, segs[i], true, arcSize, close)
            }
          } else {
            parseRegularly = true
          }
        }

        if (parseRegularly) {
          // Renders the elements inside the given path
          let childNode = node.firstChild

          while (childNode != null) {
            if (childNode.nodeType === mxConstants.NODETYPE_ELEMENT) {
              this.drawNode(canvas, shape, childNode, aspect, disableShadow, paint)
            }

            childNode = childNode.nextSibling
          }
        }
      } else if (name === 'close') {
        canvas.close()
      } else if (name === 'move') {
        canvas.moveTo(x0 + Number(node.getAttribute('x')) * sx, y0 + Number(node.getAttribute('y')) * sy)
      } else if (name === 'line') {
        canvas.lineTo(x0 + Number(node.getAttribute('x')) * sx, y0 + Number(node.getAttribute('y')) * sy)
      } else if (name === 'quad') {
        canvas.quadTo(x0 + Number(node.getAttribute('x1')) * sx,
          y0 + Number(node.getAttribute('y1')) * sy,
          x0 + Number(node.getAttribute('x2')) * sx,
          y0 + Number(node.getAttribute('y2')) * sy)
      } else if (name === 'curve') {
        canvas.curveTo(x0 + Number(node.getAttribute('x1')) * sx,
          y0 + Number(node.getAttribute('y1')) * sy,
          x0 + Number(node.getAttribute('x2')) * sx,
          y0 + Number(node.getAttribute('y2')) * sy,
          x0 + Number(node.getAttribute('x3')) * sx,
          y0 + Number(node.getAttribute('y3')) * sy)
      } else if (name === 'arc') {
        canvas.arcTo(Number(node.getAttribute('rx')) * sx,
          Number(node.getAttribute('ry')) * sy,
          Number(node.getAttribute('x-axis-rotation')),
          Number(node.getAttribute('large-arc-flag')),
          Number(node.getAttribute('sweep-flag')),
          x0 + Number(node.getAttribute('x')) * sx,
          y0 + Number(node.getAttribute('y')) * sy)
      } else if (name === 'rect') {
        canvas.rect(x0 + Number(node.getAttribute('x')) * sx,
          y0 + Number(node.getAttribute('y')) * sy,
          Number(node.getAttribute('w')) * sx,
          Number(node.getAttribute('h')) * sy)
      } else if (name === 'roundrect') {
        let arcsize = Number(node.getAttribute('arcsize'))

        if (arcsize === 0) {
          arcsize = mxConstants.RECTANGLE_ROUNDING_FACTOR * 100
        }

        const w = Number(node.getAttribute('w')) * sx
        const h = Number(node.getAttribute('h')) * sy
        const factor = Number(arcsize) / 100
        const r = Math.min(w * factor, h * factor)

        canvas.roundrect(x0 + Number(node.getAttribute('x')) * sx,
          y0 + Number(node.getAttribute('y')) * sy,
          w, h, r, r)
      } else if (name === 'ellipse') {
        canvas.ellipse(x0 + Number(node.getAttribute('x')) * sx,
          y0 + Number(node.getAttribute('y')) * sy,
          Number(node.getAttribute('w')) * sx,
          Number(node.getAttribute('h')) * sy)
      } else if (name === 'image') {
        if (!shape.outline) {
          const src = this.evaluateAttribute(node, 'src', shape)

          canvas.image(x0 + Number(node.getAttribute('x')) * sx,
            y0 + Number(node.getAttribute('y')) * sy,
            Number(node.getAttribute('w')) * sx,
            Number(node.getAttribute('h')) * sy,
            src, false, node.getAttribute('flipH') === '1',
            node.getAttribute('flipV') === '1')
        }
      } else if (name === 'text') {
        if (!shape.outline) {
          const str = this.evaluateTextAttribute(node, 'str', shape)
          let rotation = node.getAttribute('vertical') === '1' ? -90 : 0

          if (node.getAttribute('align-shape') === '0') {
            const dr = shape.rotation

            // Depends on flipping
            const flipH = mxUtils.getValue(shape.style, mxConstants.STYLE_FLIPH, 0) === 1
            const flipV = mxUtils.getValue(shape.style, mxConstants.STYLE_FLIPV, 0) === 1

            if (flipH && flipV) {
              rotation -= dr
            } else if (flipH || flipV) {
              rotation += dr
            } else {
              rotation -= dr
            }
          }

          rotation -= node.getAttribute('rotation')

          canvas.text(x0 + Number(node.getAttribute('x')) * sx,
            y0 + Number(node.getAttribute('y')) * sy,
            0, 0, str, node.getAttribute('align') || 'left',
            node.getAttribute('valign') || 'top', false, '',
            null, false, rotation)
        }
      } else if (name === 'include-shape') {
        const stencil = mxStencilRegistry.getStencil(node.getAttribute('name'))

        if (stencil != null) {
          const x = x0 + Number(node.getAttribute('x')) * sx
          const y = y0 + Number(node.getAttribute('y')) * sy
          const w = Number(node.getAttribute('w')) * sx
          const h = Number(node.getAttribute('h')) * sy

          stencil.drawShape(canvas, shape, x, y, w, h)
        }
      } else if (name === 'fillstroke') {
        canvas.fillAndStroke()
      } else if (name === 'fill') {
        canvas.fill()
      } else if (name === 'stroke') {
        canvas.stroke()
      } else if (name === 'strokewidth') {
        const s = (node.getAttribute('fixed') === '1') ? 1 : minScale
        canvas.setStrokeWidth(Number(node.getAttribute('width')) * s)
      } else if (name === 'dashed') {
        canvas.setDashed(node.getAttribute('dashed') === '1')
      } else if (name === 'dashpattern') {
        let value = node.getAttribute('pattern')

        if (value != null) {
          const tmp = value.split(' ')
          const pat = []

          for (let i = 0; i < tmp.length; i++) {
            if (tmp[i].length > 0) {
              pat.push(Number(tmp[i]) * minScale)
            }
          }

          value = pat.join(' ')
          canvas.setDashPattern(value)
        }
      } else if (name === 'strokecolor') {
        canvas.setStrokeColor(this.parseColor(canvas, shape, node, node.getAttribute('color')))
      } else if (name === 'linecap') {
        canvas.setLineCap(node.getAttribute('cap'))
      } else if (name === 'linejoin') {
        canvas.setLineJoin(node.getAttribute('join'))
      } else if (name === 'miterlimit') {
        canvas.setMiterLimit(Number(node.getAttribute('limit')))
      } else if (name === 'fillcolor') {
        canvas.setFillColor(this.parseColor(canvas, shape, node, node.getAttribute('color')))
      } else if (name === 'alpha') {
        canvas.setAlpha(node.getAttribute('alpha'))
      } else if (name === 'fillalpha') {
        canvas.setAlpha(node.getAttribute('alpha'))
      } else if (name === 'strokealpha') {
        canvas.setAlpha(node.getAttribute('alpha'))
      } else if (name === 'fontcolor') {
        canvas.setFontColor(this.parseColor(canvas, shape, node, node.getAttribute('color')))
      } else if (name === 'fontstyle') {
        canvas.setFontStyle(node.getAttribute('style'))
      } else if (name === 'fontfamily') {
        canvas.setFontFamily(node.getAttribute('family'))
      } else if (name === 'fontsize') {
        canvas.setFontSize(Number(node.getAttribute('size')) * minScale)
      }

      if (disableShadow && (name === 'fillstroke' || name === 'fill' || name === 'stroke')) {
        disableShadow = false
        canvas.setShadow(false)
      }
    }
  }

  mxOutput.mxStencil = mxStencil
}
