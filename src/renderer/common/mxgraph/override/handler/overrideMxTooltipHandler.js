export function overrideMxTooltipHandler (mxOutput) {
  const { mxTooltipHandler, mxUtils, mxConstants } = mxOutput
  /**
   * Variable: enabled
   *
   * Specifies if events are handled. Default is false.
   */
  mxTooltipHandler.prototype.enabled = false

  /**
   * Function: hideTooltip
   *
   * Hides the tooltip.
   */
  mxTooltipHandler.prototype.hideTooltip = function () {
    if (this.div != null) {
      this.div.style.visibility = 'hidden'
      this.div.innerText = ''
    }
  }

  /**
   * Function: show
   *
   * Shows the tooltip for the specified cell and optional index at the
   * specified location (with a vertical offset of 10 pixels).
   */
  mxTooltipHandler.prototype.show = function (tip, x, y) {
    if (!this.destroyed && tip != null && tip.length > 0) {
      // Initializes the DOM nodes if required
      if (this.div == null) {
        this.init()
      }

      const origin = mxUtils.getScrollOrigin()

      this.div.style.zIndex = this.zIndex
      this.div.style.left = (x + origin.x) + 'px'
      this.div.style.top = (y + mxConstants.TOOLTIP_VERTICAL_OFFSET +
        origin.y) + 'px'

      if (!mxUtils.isNode(tip)) {
        this.div.style.whiteSpace = 'pre-line'
        this.div.innerHTML = tip
      } else {
        this.div.style.whiteSpace = ''
        this.div.innerText = ''
        this.div.appendChild(tip)
      }

      this.div.style.visibility = ''
      mxUtils.fit(this.div)
    }
  }
  mxOutput.mxTooltipHandler = mxTooltipHandler
}
