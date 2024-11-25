export function overrideMxImageShape (mxOutput) {
  const { mxImageShape, mxShape, mxRectangleShape, mxUtils, mxConstants } = mxOutput
  /**
   * Function: apply
   *
   * Overrides <mxShape.apply> to replace the fill and stroke colors with the
   * respective values from <mxConstants.STYLE_IMAGE_BACKGROUND> and
   * <mxConstants.STYLE_IMAGE_BORDER>.
   *
   * Applies the style of the given <mxCellState> to the shape. This
   * implementation assigns the following styles to local fields:
   *
   * - <mxConstants.STYLE_IMAGE_BACKGROUND> => fill
   * - <mxConstants.STYLE_IMAGE_BORDER> => stroke
   *
   * Parameters:
   *
   * state - <mxCellState> of the corresponding cell.
   */
  mxImageShape.prototype.apply = function (state) {
    mxShape.prototype.apply.apply(this, arguments)

    this.fill = null
    this.stroke = null
    this.gradient = null

    if (this.style != null) {
      this.preserveImageAspect = mxUtils.getNumber(this.style, mxConstants.STYLE_IMAGE_ASPECT, 1) === 1
      this.imageBackground = mxUtils.getValue(this.style, mxConstants.STYLE_IMAGE_BACKGROUND, null)
      this.imageBorder = mxUtils.getValue(this.style, mxConstants.STYLE_IMAGE_BORDER, null)

      // Legacy support for imageFlipH/V
      this.flipH = this.flipH || mxUtils.getValue(this.style, 'imageFlipH', 0) === 1
      this.flipV = this.flipV || mxUtils.getValue(this.style, 'imageFlipV', 0) === 1

      this.clipPath = mxUtils.getValue(this.style, mxConstants.STYLE_CLIP_PATH, null)
    }
  }

  /**
   * Function: isRoundable
   *
   * Disables inherited roundable support.
   */
  mxImageShape.prototype.isRoundable = function () {
    return false
  }

  /**
   * Function: getImageDataUri
   *
   * Returns the image to be rendered.
   */
  mxImageShape.prototype.getImageDataUri = function () {
    return this.image
  }

  /**
   * Function: configurePointerEvents
   *
   * Configures the pointer events for the given canvas.
   */
  mxImageShape.prototype.configurePointerEvents = function (c) {
    // do nothing
  }

  /**
   * Function: paintVertexShape
   *
   * Generic background painting implementation.
   */
  mxImageShape.prototype.paintVertexShape = function (c, x, y, w, h) {
    if (this.image != null) {
      if (this.imageBackground != null) {
        // Stroke rendering required for shadow
        c.setFillColor(this.imageBackground)
        c.setStrokeColor(this.imageBorder)
        c.rect(x, y, w, h)
        c.fillAndStroke()
      }

      // FlipH/V are implicit via mxShape.updateTransform
      c.image(x, y, w, h, this.getImageDataUri(), this.preserveImageAspect, false, false, this.clipPath)

      if (this.imageBorder != null) {
        c.setShadow(false)
        c.setStrokeColor(this.imageBorder)
        c.rect(x, y, w, h)
        c.stroke()
      }
    } else {
      mxRectangleShape.prototype.paintBackground.apply(this, arguments)
    }
  }

  /**
   * Function: redraw
   *
   * Overrides <mxShape.redraw> to preserve the aspect ratio of images.
   */
  mxImageShape.prototype.redrawHtmlShape = function () {
    this.node.style.left = Math.round(this.bounds.x) + 'px'
    this.node.style.top = Math.round(this.bounds.y) + 'px'
    this.node.style.width = Math.max(0, Math.round(this.bounds.width)) + 'px'
    this.node.style.height = Math.max(0, Math.round(this.bounds.height)) + 'px'
    this.node.innerText = ''

    if (this.image != null) {
      const fill = mxUtils.getValue(this.style, mxConstants.STYLE_IMAGE_BACKGROUND, '')
      const stroke = mxUtils.getValue(this.style, mxConstants.STYLE_IMAGE_BORDER, '')
      this.node.style.backgroundColor = fill
      this.node.style.borderColor = stroke

      const img = document.createElement('img')
      img.setAttribute('border', '0')
      img.style.position = 'absolute'
      img.src = this.image

      let filter = (this.opacity < 100) ? 'alpha(opacity=' + this.opacity + ')' : ''
      this.node.style.filter = filter

      if (this.flipH && this.flipV) {
        filter += 'progid:DXImageTransform.Microsoft.BasicImage(rotation=2)'
      } else if (this.flipH) {
        filter += 'progid:DXImageTransform.Microsoft.BasicImage(mirror=1)'
      } else if (this.flipV) {
        filter += 'progid:DXImageTransform.Microsoft.BasicImage(rotation=2, mirror=1)'
      }

      if (img.style.filter !== filter) {
        img.style.filter = filter
      }

      if (img.nodeName === 'image') {
        img.style.rotation = this.rotation
      } else if (this.rotation !== 0) {
        // LATER: Add flipV/H support
        mxUtils.setPrefixedStyle(img.style, 'transform', 'rotate(' + this.rotation + 'deg)')
      } else {
        mxUtils.setPrefixedStyle(img.style, 'transform', '')
      }

      // Known problem: IE clips top line of image for certain angles
      img.style.width = this.node.style.width
      img.style.height = this.node.style.height

      this.node.style.backgroundImage = ''
      this.node.appendChild(img)
    } else {
      this.setTransparentBackgroundImage(this.node)
    }
  }
  mxOutput.mxImageShape = mxImageShape
}
