import { mxConstants } from '@/renderer/common/mxgraph'

/**
 * Hints on handlers
 */
export function createHint () {
  const hint = document.createElement('div')
  hint.className = 'geHint'
  hint.style.whiteSpace = 'nowrap'
  hint.style.position = 'absolute'

  return hint
}

export function formatHintText (pixels, unit) {
  switch (unit) {
    case mxConstants.POINTS:
      return pixels
    case mxConstants.MILLIMETERS:
      return (pixels / mxConstants.PIXELS_PER_MM).toFixed(1)
    case mxConstants.METERS:
      return (pixels / (mxConstants.PIXELS_PER_MM * 1000)).toFixed(4)
    case mxConstants.INCHES:
      return (pixels / mxConstants.PIXELS_PER_INCH).toFixed(3)
  }
}
