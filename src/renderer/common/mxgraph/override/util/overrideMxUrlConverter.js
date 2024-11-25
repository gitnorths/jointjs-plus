export function overrideMxUrlConverter (mxOutput) {
  const { mxUrlConverter } = mxOutput
  /**
   * Function: isRelativeUrl
   *
   * Returns true if the given URL is relative.
   */
  mxUrlConverter.prototype.isRelativeUrl = function (url) {
    return typeof url === 'string' && url.substring(0, 10) !== 'data:image' &&
      url.substring(0, 7) !== 'http://' && url.substring(0, 7) !== 'file://' &&
      url.substring(0, 8) !== 'https://' && url.substring(0, 2) !== '//'
  }

  mxOutput.mxUrlConverter = mxUrlConverter
}
