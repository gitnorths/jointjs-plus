export function overrideMxStylesheetCodec (mxOutput) {
  const { mxStylesheetCodec } = mxOutput
  /**
   * Variable: allowEval
   *
   * Static global switch that specifies if the use of eval is allowed for
   * evaluating text content. Default is true. Set this to false if stylesheets
   * may contain user input.
   */
  mxStylesheetCodec.allowEval = false
  mxOutput.mxStylesheetCodec = mxStylesheetCodec
}
