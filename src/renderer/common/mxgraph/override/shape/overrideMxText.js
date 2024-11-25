export function overrideMxText (mxOutput) {
  const { mxText, mxConstants, mxUtils, mxClient, mxShape, mxRectangle, mxPoint, mxSvgCanvas2D } = mxOutput
  /**
   * Function: configurePointerEvents
   *
   * Configures the pointer events for the given canvas.
   */
  mxText.prototype.configurePointerEvents = function (c) {
    // do nothing
  }

  /**
   * Function: getActualTextDirection
   *
   * Returns the actual text direction.
   */
  mxText.prototype.getActualTextDirection = function () {
    let dir = this.textDirection

    if (dir === mxConstants.TEXT_DIRECTION_AUTO) {
      dir = this.getAutoDirection()
    }

    if (dir !== mxConstants.TEXT_DIRECTION_LTR &&
      dir !== mxConstants.TEXT_DIRECTION_RTL &&
      dir !== mxConstants.TEXT_DIRECTION_VERTICAL_LR &&
      dir !== mxConstants.TEXT_DIRECTION_VERTICAL_RL) {
      dir = null
    }

    return dir
  }
  /**
   * Function: paint
   *
   * Generic rendering code.
   */
  mxText.prototype.paint = function (c, update) {
    // Scale is passed-through to canvas
    const s = this.scale
    const x = this.bounds.x / s
    const y = this.bounds.y / s
    const w = this.bounds.width / s
    const h = this.bounds.height / s

    this.updateTransform(c, x, y, w, h)
    this.configureCanvas(c, x, y, w, h)
    this.updateSvgFilters((c != null) ? c.state.scale : s)

    const dir = this.getActualTextDirection()

    if (update) {
      c.updateText(x, y, w, h, this.align, this.valign, this.wrap, this.overflow,
        this.clipped, this.getTextRotation(), dir, this.node)
    } else {
      // Checks if text contains HTML markup
      const realHtml = mxUtils.isNode(this.value) || this.dialect === mxConstants.DIALECT_STRICTHTML

      // Always renders labels as HTML in VML
      const fmt = (realHtml) ? 'html' : ''
      let val = this.value

      if (!realHtml && fmt === 'html') {
        val = mxUtils.htmlEntities(val, false)
      }

      if (fmt === 'html' && !mxUtils.isNode(this.value)) {
        val = mxUtils.replaceTrailingNewlines(val, '<div><br></div>')
      }

      // Handles trailing newlines to make sure they are visible in rendering output
      val = (!mxUtils.isNode(this.value) && this.replaceLinefeeds && fmt === 'html')
        ? val.replace(/\n/g, '<br/>')
        : val

      c.text(x, y, w, h, val, this.align, this.valign, this.wrap, fmt,
        this.overflow, this.clipped, this.getTextRotation(), dir)
    }
  }

  /**
   * Function: redraw
   *
   * Renders the text using the given DOM nodes.
   */
  mxText.prototype.redraw = function () {
    if (this.visible && this.checkBounds() && this.cacheEnabled && this.lastValue === this.value &&
      (mxUtils.isNode(this.value) || this.dialect === mxConstants.DIALECT_STRICTHTML)) {
      if (this.node.nodeName === 'DIV') {
        if (mxClient.IS_SVG) {
          this.redrawHtmlShapeWithCss3()
        } else {
          this.updateSize(this.node, (this.state == null || this.state.view.textDiv == null))

          if (mxClient.IS_IE && (document.documentMode == null || document.documentMode <= 8)) {
            this.updateHtmlFilter()
          } else {
            this.updateHtmlTransform()
          }
        }
      } else {
        const canvas = this.createCanvas()

        if (canvas != null && canvas.updateText != null) {
          // Specifies if events should be handled
          canvas.pointerEvents = this.pointerEvents

          this.paint(canvas, true)
          this.destroyCanvas(canvas)
        } else {
          // Fallback if canvas does not support updateText (VML)
          mxShape.prototype.redraw.apply(this, arguments)
        }
      }
    } else {
      mxShape.prototype.redraw.apply(this, arguments)

      if (mxUtils.isNode(this.value) || this.dialect === mxConstants.DIALECT_STRICTHTML) {
        this.lastValue = this.value
      } else {
        this.lastValue = null
      }
    }
  }

  /**
   * Function: updateBoundingBox
   *
   * Updates the <boundingBox> for this shape using the given node and position.
   */
  mxText.prototype.updateBoundingBox = function () {
    let node = this.node
    this.boundingBox = this.bounds.clone()
    const rot = this.getTextRotation()

    const h = (this.style != null) ? mxUtils.getValue(this.style, mxConstants.STYLE_LABEL_POSITION, mxConstants.ALIGN_CENTER) : null
    const v = (this.style != null) ? mxUtils.getValue(this.style, mxConstants.STYLE_VERTICAL_LABEL_POSITION, mxConstants.ALIGN_MIDDLE) : null

    if (!this.ignoreStringSize && node != null && this.overflow !== 'fill' && (!this.clipped ||
      !this.ignoreClippedStringSize || h !== mxConstants.ALIGN_CENTER || v !== mxConstants.ALIGN_MIDDLE)) {
      let ow = null
      let oh = null

      if (node.ownerSVGElement != null) {
        if (node.firstChild != null && node.firstChild.firstChild != null &&
          node.firstChild.firstChild.nodeName === 'foreignObject' &&
          node.firstChild.firstChild.firstChild != null &&
          node.firstChild.firstChild.firstChild.firstChild != null) {
          // Uses second inner DIV for font metrics
          node = node.firstChild.firstChild.firstChild.firstChild
          oh = node.offsetHeight * this.scale

          if (this.overflow === 'width') {
            ow = this.boundingBox.width
          } else {
            ow = node.offsetWidth * this.scale
          }
        } else {
          try {
            const b = node.getBBox()

            // Workaround for bounding box of empty string
            if (typeof (this.value) === 'string' && mxUtils.trim(this.value) === 0) {
              this.boundingBox = null
            } else if (b.width === 0 && b.height === 0) {
              this.boundingBox = null
            } else {
              this.boundingBox = new mxRectangle(b.x, b.y, b.width, b.height)
            }

            return
          } catch (e) {
            // Ignores NS_ERROR_FAILURE in FF if container display is none.
          }
        }
      } else {
        const td = (this.state != null) ? this.state.view.textDiv : null

        // Use cached offset size
        if (this.offsetWidth != null && this.offsetHeight != null) {
          ow = this.offsetWidth * this.scale
          oh = this.offsetHeight * this.scale
        } else {
          // Cannot get node size while container hidden so a
          // shared temporary DIV is used for text measuring
          if (td != null) {
            this.updateFont(td)
            this.updateSize(td, false)
            this.updateInnerHtml(td)

            node = td
          }

          let sizeDiv = node

          if (document.documentMode === 8 && !mxClient.IS_EM) {
            const w = Math.round(this.bounds.width / this.scale)

            if (this.wrap && w > 0) {
              node.style.wordWrap = mxConstants.WORD_WRAP
              node.style.whiteSpace = 'normal'

              if (node.style.wordWrap !== 'break-word') {
                // Innermost DIV is used for measuring text
                let divs = sizeDiv.getElementsByTagName('div')

                if (divs.length > 0) {
                  sizeDiv = divs[divs.length - 1]
                }

                ow = sizeDiv.offsetWidth + 2
                divs = this.node.getElementsByTagName('div')

                if (this.clipped) {
                  ow = Math.min(w, ow)
                }

                // Second last DIV width must be updated in DOM tree
                if (divs.length > 1) {
                  divs[divs.length - 2].style.width = ow + 'px'
                }
              }
            } else {
              node.style.whiteSpace = 'nowrap'
            }
          } else if (sizeDiv.firstChild != null && sizeDiv.firstChild.nodeName === 'DIV') {
            sizeDiv = sizeDiv.firstChild
          }

          this.offsetWidth = sizeDiv.offsetWidth + this.textWidthPadding
          this.offsetHeight = sizeDiv.offsetHeight

          ow = this.offsetWidth * this.scale
          oh = this.offsetHeight * this.scale
        }
      }

      if (ow != null && oh != null) {
        this.boundingBox = new mxRectangle(this.bounds.x,
          this.bounds.y, ow, oh)
      }
    }

    if (this.boundingBox != null) {
      if (rot !== 0) {
        // Accounts for pre-rotated x and y
        const bbox = mxUtils.getBoundingBox(new mxRectangle(
            this.margin.x * this.boundingBox.width,
            this.margin.y * this.boundingBox.height,
            this.boundingBox.width, this.boundingBox.height),
          rot, new mxPoint(0, 0))

        this.unrotatedBoundingBox = mxRectangle.fromRectangle(this.boundingBox)
        this.unrotatedBoundingBox.x += this.margin.x * this.unrotatedBoundingBox.width
        this.unrotatedBoundingBox.y += this.margin.y * this.unrotatedBoundingBox.height

        this.boundingBox.x += bbox.x
        this.boundingBox.y += bbox.y
        this.boundingBox.width = bbox.width
        this.boundingBox.height = bbox.height
      } else {
        this.boundingBox.x += this.margin.x * this.boundingBox.width
        this.boundingBox.y += this.margin.y * this.boundingBox.height
        this.unrotatedBoundingBox = null
      }
    }
  }
  /**
   * Function: isShadowEnabled
   *
   * Removes all child nodes and resets all CSS.
   */
  mxText.prototype.isShadowEnabled = function () {
    return (this.style != null)
      ? mxUtils.getValue(this.style,
        mxConstants.STYLE_TEXT_SHADOW, false)
      : false
  }

  /**
   * Function: redrawHtmlShapeWithCss3
   *
   * Updates the HTML node(s) to reflect the latest bounds and scale.
   */
  mxText.prototype.redrawHtmlShapeWithCss3 = function () {
    const w = Math.max(0, Math.round(this.bounds.width / this.scale))
    const h = Math.max(0, Math.round(this.bounds.height / this.scale))
    const flex = 'position: absolute; left: ' + Math.round(this.bounds.x) + 'px; ' +
      'top: ' + Math.round(this.bounds.y) + 'px; pointer-events: none; '
    const block = this.getTextCss()
    const dir = this.getActualTextDirection()

    mxSvgCanvas2D.createCss(w + 2, h, this.align, this.valign, this.wrap, this.overflow, this.clipped, dir,
      (this.background != null) ? mxUtils.htmlEntities(this.background) : null,
      (this.border != null) ? mxUtils.htmlEntities(this.border) : null,
      flex, block, this.scale, mxUtils.bind(this, function (dx, dy, flex, item, block, ofl) {
        const r = this.getTextRotation()
        let tr = ((this.scale !== 1) ? 'scale(' + this.scale + ') ' : '') +
          ((r !== 0) ? 'rotate(' + r + 'deg) ' : '') +
          ((this.margin.x !== 0 || this.margin.y !== 0)
            ? 'translate(' + (this.margin.x * 100) + '%,' +
            (this.margin.y * 100) + '%)'
            : '')

        if (tr !== '') {
          tr = 'transform-origin: 0 0; transform: ' + tr + '; '
        }

        if (this.overflow === 'block' && this.valign === mxConstants.ALIGN_MIDDLE) {
          tr += 'max-height: ' + (h + 1) + 'px;'
        }

        if (ofl === '') {
          flex += item
          item = 'display:inline-block; min-width: 100%; ' + tr
        } else {
          item += tr

          if (mxClient.IS_SF) {
            item += '-webkit-clip-path: content-box;'
          }
        }

        if (this.overflow === 'block') {
          item += 'width: 100%; '
        }

        if (this.opacity < 100) {
          block += 'opacity: ' + (this.opacity / 100) + '; '
        }

        this.node.setAttribute('style', flex)

        const html = (mxUtils.isNode(this.value)) ? this.value.outerHTML : this.getHtmlValue()

        if (this.node.firstChild == null) {
          this.node.innerHTML = '<div><div>' + html + '</div></div>'

          if (mxClient.IS_IE11) {
            this.fixFlexboxForIe11(this.node)
          }
        }

        this.node.firstChild.firstChild.setAttribute('style', block)
        this.node.firstChild.setAttribute('style', item)
      }))
  }

  /**
   * Function: fixFlexboxForIe11
   *
   * Rewrites flexbox CSS for IE11 to work around overflow issues.
   */
  mxText.prototype.fixFlexboxForIe11 = function (node) {
    const elts = node.querySelectorAll('div[style*="display: flex; justify-content: flex-end;"]')

    for (let i = 0; i < elts.length; i++) {
      // Fixes right aligned elements to allow for overflow
      elts[i].style.justifyContent = 'flex-start'
      elts[i].style.flexDirection = 'row-reverse'
    }

    // LATER: Overflow center with flexbox in IE11 that keeps word wrapping
    if (!this.wrap) {
      const elts = node.querySelectorAll('div[style*="display: flex; justify-content: center;"]')
      const w = -window.innerWidth

      for (let i = 0; i < elts.length; i++) {
        elts[i].style.marginLeft = w + 'px'
        elts[i].style.marginRight = w + 'px'
      }
    }
  }
  if (mxText.prototype.hasOwnProperty('isParseVml')) {
    delete mxText.prototype.isParseVml
  }

  /**
   * Function: updateHtmlFilter
   *
   * Rotated text rendering quality is bad for IE9 quirks/IE8 standards
   */
  mxText.prototype.updateHtmlFilter = function () {
    const style = this.node.style
    const dx = this.margin.x
    let dy = this.margin.y
    const s = this.scale

    // Resets filter before getting offsetWidth
    mxUtils.setOpacity(this.node, this.opacity)

    // Adds 1 to match table height in 1.x
    let ow = 0
    let oh = 0
    const td = (this.state != null) ? this.state.view.textDiv : null
    let sizeDiv = this.node

    // Fallback for hidden text rendering in IE quirks mode
    if (td != null) {
      td.style.overflow = ''
      td.style.height = ''
      td.style.width = ''

      this.updateFont(td)
      this.updateSize(td, false)
      this.updateInnerHtml(td)

      const w = Math.round(this.bounds.width / this.scale)

      if (this.wrap && w > 0) {
        td.style.whiteSpace = 'normal'
        td.style.wordWrap = mxConstants.WORD_WRAP
        ow = w

        if (this.clipped) {
          ow = Math.min(ow, this.bounds.width)
        }

        td.style.width = ow + 'px'
      } else {
        td.style.whiteSpace = 'nowrap'
      }

      sizeDiv = td

      if (sizeDiv.firstChild != null && sizeDiv.firstChild.nodeName === 'DIV') {
        sizeDiv = sizeDiv.firstChild

        if (this.wrap && td.style.wordWrap === 'break-word') {
          sizeDiv.style.width = '100%'
        }
      }

      // Required to update the height of the text box after wrapping width is known
      if (!this.clipped && this.wrap && w > 0) {
        ow = sizeDiv.offsetWidth + this.textWidthPadding
        td.style.width = ow + 'px'
      }

      oh = sizeDiv.offsetHeight + 2
    } else if (sizeDiv.firstChild != null && sizeDiv.firstChild.nodeName === 'DIV') {
      sizeDiv = sizeDiv.firstChild
      oh = sizeDiv.offsetHeight
    }

    ow = sizeDiv.offsetWidth + this.textWidthPadding

    if (this.clipped) {
      oh = Math.min(oh, this.bounds.height)
    }

    let w = this.bounds.width / s
    let h = this.bounds.height / s

    // Handles special case for live preview with no wrapper DIV and no textDiv
    if (this.overflow === 'fill') {
      oh = h
      ow = w
    } else if (this.overflow === 'width') {
      oh = sizeDiv.scrollHeight
      ow = w
    }

    // Stores for later use
    this.offsetWidth = ow
    this.offsetHeight = oh

    h = oh

    if (this.overflow !== 'fill' && this.overflow !== 'width') {
      if (this.clipped) {
        ow = Math.min(w, ow)
      }

      w = ow

      // Simulates max-width CSS in quirks mode
      if (this.wrap) {
        style.width = Math.round(w) + 'px'
      }
    }

    h *= s
    w *= s

    // Rotation case is handled via VML canvas
    let rad = this.getTextRotation() * (Math.PI / 180)

    // Precalculate cos and sin for the rotation
    const real_cos = parseFloat(parseFloat(Math.cos(rad)).toFixed(8))
    const real_sin = parseFloat(parseFloat(Math.sin(-rad)).toFixed(8))

    rad %= 2 * Math.PI

    if (rad < 0) {
      rad += 2 * Math.PI
    }

    rad %= Math.PI

    if (rad > Math.PI / 2) {
      rad = Math.PI - rad
    }

    const cos = Math.cos(rad)
    const sin = Math.sin(-rad)

    const tx = w * -(dx + 0.5)
    const ty = h * -(dy + 0.5)

    const top_fix = (h - h * cos + w * sin) / 2 + real_sin * tx - real_cos * ty
    const left_fix = (w - w * cos + h * sin) / 2 - real_cos * tx - real_sin * ty

    if (rad !== 0) {
      const f = 'progid:DXImageTransform.Microsoft.Matrix(M11=' + real_cos + ', M12=' +
        real_sin + ', M21=' + (-real_sin) + ', M22=' + real_cos + ', sizingMethod=\'auto expand\')'

      if (style.filter != null && style.filter.length > 0) {
        style.filter += ' ' + f
      } else {
        style.filter = f
      }
    }

    // Workaround for rendering offsets
    dy = 0

    style.zoom = s
    style.left = Math.round(this.bounds.x + left_fix - w / 2) + 'px'
    style.top = Math.round(this.bounds.y + top_fix - h / 2 + dy) + 'px'
  }

  /**
   * Function: updateValue
   *
   * Updates the HTML node(s) to reflect the latest bounds and scale.
   */
  mxText.prototype.updateValue = function () {
    if (mxUtils.isNode(this.value)) {
      this.node.innerText = ''
      this.node.appendChild(this.value)
    } else {
      let val = this.value

      if (this.dialect !== mxConstants.DIALECT_STRICTHTML) {
        val = mxUtils.htmlEntities(val, false)
      }

      // Handles trailing newlines to make sure they are visible in rendering output
      val = mxUtils.replaceTrailingNewlines(val, '<div><br></div>')
      val = (this.replaceLinefeeds) ? val.replace(/\n/g, '<br/>') : val
      const bg = (this.background != null && this.background !== mxConstants.NONE) ? this.background : null
      const bd = (this.border != null && this.border !== mxConstants.NONE) ? this.border : null

      if (this.overflow === 'fill' || this.overflow === 'width') {
        if (bg != null) {
          this.node.style.backgroundColor = bg
        }

        if (bd != null) {
          this.node.style.border = '1px solid ' + bd
        }
      } else {
        let css = ''

        if (bg != null) {
          css += 'background-color:' + mxUtils.htmlEntities(bg) + ';'
        }

        if (bd != null) {
          css += 'border:1px solid ' + mxUtils.htmlEntities(bd) + ';'
        }

        // Wrapper DIV for background, zoom needed for inline in quirks
        // and to measure wrapped font sizes in all browsers
        // FIXME: Background size in quirks mode for wrapped text
        const lh = (mxConstants.ABSOLUTE_LINE_HEIGHT)
          ? (this.size * mxConstants.LINE_HEIGHT) + 'px'
          : mxConstants.LINE_HEIGHT
        val = '<div style="zoom:1;' + css + 'display:inline-block;_display:inline;text-decoration:inherit;' +
          'padding-bottom:1px;padding-right:1px;line-height:' + lh + '">' + val + '</div>'
      }

      this.node.innerHTML = val

      // Sets text direction
      const divs = this.node.getElementsByTagName('div')

      if (divs.length > 0) {
        // LATER: Add vertical writing-mode support
        let dir = this.textDirection

        if (dir === mxConstants.TEXT_DIRECTION_AUTO && this.dialect !== mxConstants.DIALECT_STRICTHTML) {
          dir = this.getAutoDirection()
        }

        if (dir === mxConstants.TEXT_DIRECTION_LTR || dir === mxConstants.TEXT_DIRECTION_RTL) {
          divs[divs.length - 1].setAttribute('dir', dir)
        } else {
          divs[divs.length - 1].removeAttribute('dir')
        }
      }
    }
  }
  /**
   * Function: updateSize
   *
   * Updates the HTML node(s) to reflect the latest bounds and scale.
   */
  mxText.prototype.updateSize = function (node, enableWrap) {
    const w = Math.max(0, Math.round(this.bounds.width / this.scale))
    const h = Math.max(0, Math.round(this.bounds.height / this.scale))
    const style = node.style

    // NOTE: Do not use maxWidth here because wrapping will
    // go wrong if the cell is outside of the viewable area
    if (this.clipped) {
      style.overflow = 'hidden'
      style.maxHeight = h + 'px'
      style.maxWidth = w + 'px'
    } else if (this.overflow === 'fill') {
      style.width = (w + 1) + 'px'
      style.height = (h + 1) + 'px'
      style.overflow = 'hidden'
    } else if (this.overflow === 'width') {
      style.width = (w + 1) + 'px'
      style.maxHeight = (h + 1) + 'px'
      style.overflow = 'hidden'
    } else if (this.overflow === 'block') {
      style.width = (w + 1) + 'px'
    }

    if (this.wrap && w > 0) {
      style.wordWrap = mxConstants.WORD_WRAP
      style.whiteSpace = 'normal'
      style.width = w + 'px'

      if (enableWrap && this.overflow !== 'fill' && this.overflow !== 'width') {
        let sizeDiv = node

        if (sizeDiv.firstChild != null && sizeDiv.firstChild.nodeName === 'DIV') {
          sizeDiv = sizeDiv.firstChild

          if (node.style.wordWrap === 'break-word') {
            sizeDiv.style.width = '100%'
          }
        }

        let tmp = sizeDiv.offsetWidth

        // Workaround for text measuring in hidden containers
        if (tmp === 0) {
          const prev = node.parentNode
          node.style.visibility = 'hidden'
          document.body.appendChild(node)
          tmp = sizeDiv.offsetWidth
          node.style.visibility = ''
          prev.appendChild(node)
        }

        tmp += 3

        if (this.clipped) {
          tmp = Math.min(tmp, w)
        }

        style.width = tmp + 'px'
      }
    } else {
      style.whiteSpace = 'nowrap'
    }
  }
  /**
   * Function: getSpacing
   *
   * Returns the spacing as an <mxPoint>.
   */
  mxText.prototype.getSpacing = function (noBase, margin) {
    let dx = 0
    let dy = 0

    if ((margin != null && margin.x === -0.5) ||
      (margin == null && this.align === mxConstants.ALIGN_CENTER)) {
      dx = (this.spacingLeft - this.spacingRight) / 2
    } else if ((margin != null && margin.x === -1) ||
      (margin == null && this.align === mxConstants.ALIGN_RIGHT)) {
      dx = -this.spacingRight - (noBase ? 0 : this.baseSpacingRight)
    } else {
      dx = this.spacingLeft + (noBase ? 0 : this.baseSpacingLeft)
    }

    if (this.valign === mxConstants.ALIGN_MIDDLE) {
      dy = (this.spacingTop - this.spacingBottom) / 2
    } else if (this.valign === mxConstants.ALIGN_BOTTOM) {
      dy = -this.spacingBottom - (noBase ? 0 : this.baseSpacingBottom)
    } else {
      dy = this.spacingTop + (noBase ? 0 : this.baseSpacingTop)
    }

    return new mxPoint(dx, dy)
  }

  if (mxText.prototype.hasOwnProperty('isParseVml')) {
    delete mxText.prototype.isParseVml
  }
  if (mxText.prototype.hasOwnProperty('updateVmlContainer')) {
    delete mxText.prototype.updateVmlContainer
  }
  mxOutput.mxText = mxText
}
