export function overrideMxCylinder (mxOutput) {
  const { mxCylinder } = mxOutput

  if (mxCylinder.prototype.hasOwnProperty('svgStrokeTolerance')) {
    delete mxCylinder.prototype.svgStrokeTolerance
  }
  mxOutput.mxCylinder = mxCylinder
}
