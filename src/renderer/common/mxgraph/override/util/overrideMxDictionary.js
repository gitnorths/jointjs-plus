export function overrideMxDictionary (mxOutput) {
  const { mxDictionary } = mxOutput
  /**
   * Function: getCount
   *
   * Returns the number of objects in this dictionary.
   */
  mxDictionary.prototype.getCount = function () {
    let count = 0

    for (const key in this.map) {
      count++
    }

    return count
  }
  mxOutput.mxDictionary = mxDictionary
}
