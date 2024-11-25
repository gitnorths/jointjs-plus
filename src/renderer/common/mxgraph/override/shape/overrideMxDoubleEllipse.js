export function overrideMxDoubleEllipse (mxOutput) {
  const { mxDoubleEllipse } = mxOutput

  if (mxDoubleEllipse.prototype.hasOwnProperty('vmlScale')) {
    delete mxDoubleEllipse.prototype.vmlScale
  }
  mxOutput.mxDoubleEllipse = mxDoubleEllipse
}
