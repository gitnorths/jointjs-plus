export function overrideMxMarker (mxOutput) {
  const { mxMarker, mxConstants } = mxOutput

  mxMarker.addMarker('baseDash', function (canvas, shape, type, pe, unitX, unitY, size, source, sw, filled) {
    const nx = unitX * (size + sw + 1)
    const ny = unitY * (size + sw + 1)

    return function () {
      canvas.begin()
      canvas.moveTo(pe.x - ny / 2, pe.y + nx / 2)
      canvas.lineTo(pe.x + ny / 2, pe.y - nx / 2)
      canvas.stroke()
    }
  })

  mxMarker.addMarker('doubleBlock', function (canvas, shape, type, pe, unitX, unitY, size, source, sw, filled) {
    const widthFactor = 2

    const endOffsetX = unitX * sw * 1.118
    const endOffsetY = unitY * sw * 1.118

    unitX = unitX * (size + sw)
    unitY = unitY * (size + sw)

    const pt = pe.clone()
    pt.x -= endOffsetX
    pt.y -= endOffsetY

    const f = (type !== mxConstants.ARROW_CLASSIC && type !== mxConstants.ARROW_CLASSIC_THIN) ? 1 : 3 / 4
    pe.x += -unitX * f * 2 - endOffsetX
    pe.y += -unitY * f * 2 - endOffsetY

    return function () {
      canvas.begin()
      canvas.moveTo(pt.x, pt.y)
      canvas.lineTo(pt.x - unitX - unitY / widthFactor, pt.y - unitY + unitX / widthFactor)
      canvas.lineTo(pt.x + unitY / widthFactor - unitX, pt.y - unitY - unitX / widthFactor)
      canvas.close()
      canvas.moveTo(pt.x - unitX, pt.y - unitY)
      canvas.lineTo(pt.x - 2 * unitX - 0.5 * unitY, pt.y + 0.5 * unitX - 2 * unitY)
      canvas.lineTo(pt.x - 2 * unitX + 0.5 * unitY, pt.y - 0.5 * unitX - 2 * unitY)
      canvas.close()

      if (filled) {
        canvas.fillAndStroke()
      } else {
        canvas.stroke()
      }
    }
  })

  mxMarker.addMarker('manyOptional', function (c, shape, type, pe, unitX, unitY, size, source, sw, filled) {
    const nx = unitX * (size + sw + 1)
    const ny = unitY * (size + sw + 1)
    const a = size / 2
    const px = pe.x
    const py = pe.y

    pe.x -= 2 * nx - unitX * sw / 2
    pe.y -= 2 * ny - unitY * sw / 2

    return function () {
      c.begin()
      c.ellipse(px - 1.5 * nx - a, py - 1.5 * ny - a, 2 * a, 2 * a)
      filled ? c.fillAndStroke() : c.stroke()

      c.begin()
      c.moveTo(px, py)
      c.lineTo(px - nx, py - ny)

      c.moveTo(px + ny / 2, py - nx / 2)
      c.lineTo(px - nx, py - ny)
      c.lineTo(px - ny / 2, py + nx / 2)

      c.stroke()
    }
  })

  mxOutput.mxMarker = mxMarker
}
