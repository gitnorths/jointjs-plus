export function overrideMxStylesheet (mxOutput) {
  const { mxConstants, mxStylesheet, mxUtils } = mxOutput

  // mxStylesheet start
  /**
   * Function: getCellStyle
   *
   * Returns the cell style for the specified stylename or the given
   * defaultStyle if no style can be found for the given stylename.
   *
   * Parameters:
   *
   * name - String of the form [(stylename|key=value);] that represents the style.
   * defaultStyle - Default style to be returned if no style can be found.
   * resolve - Specifies if the value "none" should be removed. Default is true.
   */
  mxStylesheet.prototype.getCellStyle = function (name, defaultStyle, resolve) {
    resolve = (resolve != null) ? resolve : true
    let style = defaultStyle

    if (name != null && name.length > 0) {
      const pairs = name.split(';')

      if (style != null && name.charAt(0) !== ';') {
        style = mxUtils.clone(style)
      } else {
        style = {}
      }

      // Parses each key, value pair into the existing style
      for (let i = 0; i < pairs.length; i++) {
        const tmp = pairs[i]
        const pos = tmp.indexOf('=')

        if (pos >= 0) {
          const key = tmp.substring(0, pos)
          const value = tmp.substring(pos + 1)

          if (value === mxConstants.NONE && resolve) {
            delete style[key]
          } else if (mxUtils.isNumeric(value)) {
            style[key] = parseFloat(value)
          } else {
            style[key] = value
          }
        } else {
          // Merges the entries from a named style
          const tmpStyle = this.styles[tmp]

          if (tmpStyle != null) {
            for (const key in tmpStyle) {
              style[key] = tmpStyle[key]
            }
          }
        }
      }
    }

    return style
  }
// mxStylesheet end
  mxOutput.mxStylesheet = mxStylesheet
}
