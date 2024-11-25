export function overrideMxAbstractCanvas2D (mxOutput) {
  const { mxConstants, mxAbstractCanvas2D } = mxOutput
  /**
   * Function: createState
   *
   * Creates the state of the this canvas.
   */
  mxAbstractCanvas2D.prototype.createState = function () {
    return {
      dx: 0,
      dy: 0,
      scale: 1,
      alpha: 1,
      fillAlpha: 1,
      strokeAlpha: 1,
      fillColor: null,
      gradientFillAlpha: 1,
      gradientColor: null,
      gradientAlpha: 1,
      gradientDirection: null,
      strokeColor: null,
      strokeWidth: 1,
      dashed: false,
      dashPattern: '3 3',
      fixDash: false,
      lineCap: 'flat',
      lineJoin: 'miter',
      miterLimit: 10,
      fontColor: '#000000',
      fontBackgroundColor: null,
      fontBorderColor: null,
      fontSize: mxConstants.DEFAULT_FONTSIZE,
      fontFamily: mxConstants.DEFAULT_FONTFAMILY,
      fontStyle: 0,
      shadow: false,
      shadowStyle: null,
      shadowColor: mxConstants.SHADOWCOLOR,
      shadowAlpha: mxConstants.SHADOW_OPACITY,
      shadowDx: mxConstants.SHADOW_OFFSET_X,
      shadowDy: mxConstants.SHADOW_OFFSET_Y,
      rotation: 0,
      rotationCx: 0,
      rotationCy: 0
    }
  }
  /**
   * Function: setTitle
   *
   * Sets the current title text. Hook for subclassers.
   */
  mxAbstractCanvas2D.prototype.setTitle = function (title) {
    // nop
  }

  /**
   * Function: setLink
   *
   * Sets the current link. Hook for subclassers.
   */
  mxAbstractCanvas2D.prototype.setLink = function (link, target) {
    // nop
  }
  /**
   * Function: setFillStyle
   *
   * Sets the current fill style.
   */
  mxAbstractCanvas2D.prototype.setFillStyle = function (value) {
    if (value === mxConstants.NONE) {
      value = null
    }

    this.state.fillStyle = value
  }
  /**
   * Function: setShadow
   *
   * Enables or disables and configures the current shadow.
   */
  mxAbstractCanvas2D.prototype.setShadow = function (enabled, style) {
    this.state.shadow = enabled
    this.state.shadowStyle = style
  }

  mxOutput.mxAbstractCanvas2D = mxAbstractCanvas2D
}
