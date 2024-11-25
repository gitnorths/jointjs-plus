export function overrideMxConstants (mxOutput) {
  const { mxConstants } = mxOutput
  /**
   * Variable: SHADOWCOLOR
   *
   * Defines the color to be used to draw shadows in shapes and windows.
   * Default is #808080.
   */
  mxConstants.SHADOWCOLOR = '#808080'
  /**
   * Variable: VML_SHADOWCOLOR
   *
   * Used for shadow color in filters where transparency is not supported
   * (Microsoft Internet Explorer). Default is #808080.
   */
  mxConstants.VML_SHADOWCOLOR = '#808080'
  /**
   * Variable: SHADOW_BLUR
   *
   * Specifies the blur of the shadow. Default is 2.
   */
  mxConstants.SHADOW_BLUR = 2

  /**
   * Variable: STYLE_FILL_STYLE
   *
   * Defines the key for the fill style.
   */
  mxConstants.STYLE_FILL_STYLE = 'fillStyle'
  /**
   * Variable: STYLE_BLOCK_SPACING
   *
   * Defines the key for the blockSpacing style. Possible values are 0 and 1.
   * The default is 0. A value of 1 will not ignore spacing if overflow block
   * is used. * Value is "overflow".
   */
  mxConstants.STYLE_BLOCK_SPACING = 'blockSpacing'
  /**
   * Variable: STYLE_TEXT_SHADOW
   *
   * Defines the key for the text shadow style. The type of the value is Boolean.
   * Value is "textShadow".
   */
  mxConstants.STYLE_TEXT_SHADOW = 'textShadow'

  /**
   * Variable: STYLE_SHADOW_OFFSET_X
   *
   * Defines the key for the shadow offset x style. The type of the value is int.
   * Value is "shadowOffsetX".
   */
  mxConstants.STYLE_SHADOW_OFFSET_X = 'shadowOffsetX'

  /**
   * Variable: STYLE_SHADOW_OFFSET_Y
   *
   * Defines the key for the shadow offset y style. The type of the value is int.
   * Value is "shadowOffsetY".
   */
  mxConstants.STYLE_SHADOW_OFFSET_Y = 'shadowOffsetY'

  /**
   * Variable: STYLE_SHADOW_BLUR
   *
   * Defines the key for the shadow blur style. The type of the value is int.
   * Value is "shadowBlur".
   */
  mxConstants.STYLE_SHADOW_BLUR = 'shadowBlur'

  /**
   * Variable: STYLE_SHADOWCOLOR
   *
   * Defines the key for the shadow color style. The type of the value is int.
   * Value is "shadowColor".
   */
  mxConstants.STYLE_SHADOWCOLOR = 'shadowColor'

  /**
   * Variable: STYLE_SHADOW_OPACITY
   *
   * Defines the key for the shadow opacity style. The type of the value is int.
   * Value is "shadowOpacity".
   */
  mxConstants.STYLE_SHADOW_OPACITY = 'shadowOpacity'
  /**
   * Variable: STYLE_SWIMLANE_HEAD
   *
   * Defines the key for the swimlaneHead style. This style specifies whether
   * the title region of a swimlane should be visible. Use 0 for hidden or 1
   * (default) for visible. Value is "swimlaneHead".
   */
  mxConstants.STYLE_SWIMLANE_HEAD = 'swimlaneHead'

  /**
   * Variable: STYLE_SWIMLANE_BODY
   *
   * Defines the key for the swimlaneBody style. This style specifies whether
   * the body region of a swimlane should be visible. Use 0 for hidden or 1
   * (default) for visible. Value is "swimlaneBody".
   */
  mxConstants.STYLE_SWIMLANE_BODY = 'swimlaneBody'
  /**
   * Variable: STYLE_ENDFILLCOLOR
   *
   * Defines the key for the endFillColor style. If not specified then the
   * stroke color is used to fill the markers. Value is "endFillColor".
   */
  mxConstants.STYLE_ENDFILLCOLOR = 'endFillColor'
  /**
   * Variable: STYLE_STARTFILLCOLOR
   *
   * Defines the key for the startFillColor style. If not specified then the
   * stroke color is used to fill the markers. Value is "startFillColor".
   */
  mxConstants.STYLE_STARTFILLCOLOR = 'startFillColor'
  /**
   * Variable: STYLE_AUTOSIZE_GRID
   *
   * Defines if the grid should be used for autosize. Default is null, meaning
   * the current state of gridEnabled in the graph is used. Possible values are
   * null, 0 or 1, meaning use default, ignore or use the grid. Value is
   * "autosizeGrid".
   */
  mxConstants.STYLE_AUTOSIZE_GRID = 'autosizeGrid'

  /**
   * Variable: STYLE_FIXED_WIDTH
   *
   * Defines the key for the fixedWidth style. This specifies if the width should
   * be changed if a cell is resized. Possible values are 0 or 1. Default is 0.
   * Value is "fixedWidth".
   */
  mxConstants.STYLE_FIXED_WIDTH = 'fixedWidth'
  /**
   * Variable: STYLE_CLIP_PATH
   *
   * Defines image CSS clip-path. Value used as is.
   */
  mxConstants.STYLE_CLIP_PATH = 'clipPath'
  /**
   * Variable: DIRECTION_RADIAL
   *
   * Constant for direction radial. Default is radial.
   */
  mxConstants.DIRECTION_RADIAL = 'radial'
  /**
   * Variable: TEXT_DIRECTION_VERTICAL_LR
   *
   * Constant for vertical text direction left to right. Default is ltr.
   * Use this value for vertical left to right text direction.
   */
  mxConstants.TEXT_DIRECTION_VERTICAL_LR = 'vertical-lr'

  /**
   * Variable: TEXT_DIRECTION_VERTICAL_RL
   *
   * Constant for vertical text direction right to left. Default is rtl.
   * Use this value for vertical right to left text direction.
   */
  mxConstants.TEXT_DIRECTION_VERTICAL_RL = 'vertical-rl'

  mxOutput.mxConstants = mxConstants
}
