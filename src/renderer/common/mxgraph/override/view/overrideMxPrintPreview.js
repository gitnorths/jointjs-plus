export function overrideMxPrintPreview (mxOutput) {
  const {
    mxClient,
    mxConstants,
    mxEvent,
    mxImageShape,
    mxPoint,
    mxPrintPreview,
    mxRectangle,
    mxTemporaryCellStates,
    mxUtils
  } = mxOutput
  // mxPrintView start
  /**
   * Variable: addPageCss
   *
   * Holds the <mxRectangle> that defines the page format.
   */
  mxPrintPreview.prototype.addPageCss = false
  /**
   * Variable: pixelsPerInch
   *
   * CSS page size ratio. Default is 96.
   */
  mxPrintPreview.prototype.pixelsPerInch = 96
  /**
   * Variable: pageMargin
   *
   * CSS page margin in px. Default is 27.
   */
  mxPrintPreview.prototype.pageMargin = 27
  /**
   * Variable: overflowClipMargin
   *
   * overflowClipMargin for SVG container. Default is 1px.
   */
  mxPrintPreview.prototype.overflowClipMargin = '1px'
  /**
   * Variable: gridSize
   *
   * Size for the background grid.
   */
  mxPrintPreview.prototype.gridSize = null
  /**
   * Variable: gridSteps
   *
   * Steps for the background grid.
   */
  mxPrintPreview.prototype.gridSteps = null
  /**
   * Variable: gridColor
   *
   * Color for the background grid.
   */
  mxPrintPreview.prototype.gridColor = null
  /**
   * Variable: gridStrokeWidth
   *
   * Stroke width for the background grid. Default is 0.5.
   */
  mxPrintPreview.prototype.gridStrokeWidth = 0.5
  /**
   * Variable: defaultCss
   *
   * Default CSS for the HEAD section of the print preview. Shape shadows cause
   * the output to get resterized and are therefore disabled for print and PDF.
   */
  mxPrintPreview.prototype.defaultCss = 'g[style*="filter: drop-shadow("] {\n' + '  filter: none !important;\n' + '}\n' + '@media screen {\n' + '  body {\n' + '    background: gray;\n' + '    transform: scale(0.7);\n' + '    transform-origin: 0 0;\n' + '  }\n' + '  body > div {\n' + '    margin-bottom: 20px;\n' + '    box-sizing: border-box;\n' + '  }\n' + '  a, a * {\n' + '    pointer-events: none;\n' + '  }\n' + '}\n' + '@media print {\n' + '  body {\n' + '    margin: 0px;\n' + '  }\n' + '  * {\n' + '    -webkit-print-color-adjust: exact;\n' + '  }\n' + '}'

  /**
   * Function: getDocType
   *
   * Returns the string that should go before the HTML tag in the print preview
   * page. This implementation returns an X-UA meta tag for
   * IE8 in IE8 standards mode and edge in IE9 standards mode.
   */
  mxPrintPreview.prototype.getDoctype = function () {
    let dt = ''

    if (document.documentMode === 8) {
      dt = '<meta http-equiv="X-UA-Compatible" content="IE=8">'
    } else if (document.documentMode > 8) {
      // Comment needed to make standards doctype apply in IE
      dt = '<!--[if IE]><meta http-equiv="X-UA-Compatible" content="IE=edge"><![endif]-->'
    }

    return dt
  }
  /**
   * Function: appendGraph
   *
   * Adds the given graph to the existing print preview.
   */
  mxPrintPreview.prototype.appendGraph = function (graph, scale, x0, y0, forcePageBreaks, keepOpen, id, pageFormat, cells) {
    this.graph = graph
    this.scale = (scale != null) ? scale : 1 / graph.pageScale
    this.x0 = x0
    this.y0 = y0
    this.open(null, null, forcePageBreaks, keepOpen, id, pageFormat, cells)
  }
  /**
   * Function: getPageClassCss
   *
   * Gets the CSS for the given page CSS class and page format.
   */
  mxPrintPreview.prototype.getPageClassCss = function (pageClass, pageFormat) {
    const pm = this.pageMargin
    const ppi = this.pixelsPerInch
    const size = ((pageFormat.width / ppi)).toFixed(2) + 'in ' + ((pageFormat.height / ppi)).toFixed(2) + 'in'

    let css = '@page ' + pageClass + ' {\n' + '  margin: 0;\n' + '  size: ' + mxUtils.htmlEntities(size) + ';\n' + '}\n' + '.' + pageClass + ' {\n' + '  page: ' + pageClass + ';\n' + ((mxClient.IS_SF) ? '  padding: ' + mxUtils.htmlEntities((pm / ppi).toFixed(2)) + 'in;\n' : '') + '  width: ' + mxUtils.htmlEntities(((pageFormat.width / ppi)).toFixed(2)) + 'in;\n' + '  height: ' + mxUtils.htmlEntities(((pageFormat.height / ppi)).toFixed(2)) + 'in;\n' + '}\n'

    if (!mxClient.IS_SF) {
      css += '.' + pageClass + ' > svg {\n' + '  margin: ' + mxUtils.htmlEntities((pm / ppi).toFixed(2)) + 'in;\n' + '}\n'
    }

    return css
  }
  /**
   * Function: open
   *
   * Shows the print preview window. The window is created here if it does
   * not exist.
   *
   * Parameters:
   *
   * css - Optional CSS string to be used in the head section.
   * targetWindow - Optional window that should be used for rendering. If
   * this is specified then no HEAD tag, CSS and BODY tag will be written.
   */
  mxPrintPreview.prototype.open = function (css, targetWindow, forcePageBreaks, keepOpen, id, pageFormat, cells) {
    let div = null
    // Closing the window while the page is being rendered may cause an
    // exception in IE. This and any other exceptions are simply ignored.
    const previousInitializeOverlay = this.graph.cellRenderer.initializeOverlay
    try {
      const customPageFormat = pageFormat != null
      pageFormat = mxRectangle.fromRectangle((pageFormat != null) ? pageFormat : this.pageFormat)

      // Adds 1 px border for pagination to match rendering in application
      const pw = pageFormat.width + 1
      let ph = pageFormat.height + 1

      // Temporarily overrides the method to redirect rendering of overlays
      // to the draw pane so that they are visible in the printout
      if (this.printOverlays) {
        this.graph.cellRenderer.initializeOverlay = function (state, overlay) {
          overlay.init(state.view.getDrawPane())
        }
      }

      if (this.printControls) {
        this.graph.cellRenderer.initControl = function (state, control, handleEvents, clickHandler) {
          control.dialect = state.view.graph.dialect
          control.init(state.view.getDrawPane())
        }
      }

      this.wnd = (targetWindow != null) ? targetWindow : this.wnd
      let isNewWindow = false

      if (this.wnd == null) {
        isNewWindow = true
        this.wnd = window.open()
      }

      const doc = this.wnd.document

      if (isNewWindow) {
        const dt = this.getDoctype()

        if (dt != null && dt.length > 0) {
          doc.writeln(dt)
        }

        if (document.compatMode === 'CSS1Compat') {
          doc.writeln('<!DOCTYPE html>')
        }

        doc.writeln('<html>')
        doc.writeln('<head>')
        this.writeHead(doc, css)
        doc.writeln('</head>')
        doc.writeln('<body>')
      }

      // Computes the horizontal and vertical page count
      const bounds = mxRectangle.fromRectangle((cells != null) ? this.graph.getBoundingBox(cells) : this.graph.getGraphBounds())
      const currentScale = this.graph.getView().getScale()
      const sc = currentScale / this.scale
      const tr = this.graph.getView().getTranslate()

      // Uses the absolute origin with no offset for all printing
      if (!this.autoOrigin) {
        this.x0 -= tr.x * this.scale
        this.y0 -= tr.y * this.scale
        bounds.width += bounds.x
        bounds.height += bounds.y
        bounds.x = 0
        bounds.y = 0
        this.border = 0
      }

      // Store the available page area
      const availableWidth = pw - (this.border * 2)
      const availableHeight = ph - (this.border * 2)

      // Adds margins to page format
      ph += this.marginTop + this.marginBottom

      // Compute the unscaled, untranslated bounds to find
      // the number of vertical and horizontal pages
      bounds.width /= sc
      bounds.height /= sc

      const hpages = Math.max(1, Math.ceil((bounds.width + this.x0) / availableWidth))
      const vpages = Math.max(1, Math.ceil((bounds.height + this.y0) / availableHeight))
      this.pageCount = hpages * vpages
      let pageClass = null

      // Adds CSS for individual page formats
      if (customPageFormat) {
        if (this.pendingCss == null) {
          this.pageFormatClass = {}
          this.pendingCss = ''
        }

        pageClass = mxUtils.htmlEntities('gePageFormat-' + String(pageFormat.width).replaceAll('.', '_') + '-' + String(pageFormat.height).replaceAll('.', '_'))

        if (this.pageFormatClass[pageClass] == null) {
          this.pageFormatClass[pageClass] = true
          this.pendingCss += this.getPageClassCss(pageClass, pageFormat)
        }
      }

      const addPage = mxUtils.bind(this, function (div) {
        // Border of the DIV (aka page) inside the document
        if (this.borderColor != null) {
          div.style.borderColor = this.borderColor
          div.style.borderStyle = 'solid'
          div.style.borderWidth = '1px'
        }

        // Needs to be assigned directly because IE doesn't support
        // child selectors, e.g. body > div { background: white; }
        div.style.background = this.backgroundColor

        if (pageClass != null) {
          div.classList.add(pageClass)
        } else {
          div.style.width = pageFormat.width + 'px'
          div.style.height = pageFormat.height + 'px'
        }

        doc.body.appendChild(div)
      })

      const cov = this.getCoverPages(pw, ph)

      if (cov != null) {
        for (let i = 0; i < cov.length; i++) {
          addPage(cov[i], true)
        }
      }

      const apx = this.getAppendices(pw, ph)

      // Appends each page to the page output for printing, making
      // sure there will be a page break after each page (i.e. div)
      for (let i = 0; i < vpages; i++) {
        const dy = i * availableHeight / this.scale - this.y0 / this.scale + (bounds.y - tr.y * currentScale) / currentScale - ((i === 0) ? 0 : 1)

        for (let j = 0; j < hpages; j++) {
          if (this.wnd == null) {
            return null
          }

          const dx = j * availableWidth / this.scale - this.x0 / this.scale + (bounds.x - tr.x * currentScale) / currentScale - ((j === 0) ? 0 : 1)
          const pageNum = i * hpages + j + 1
          div = doc.createElement('div')
          div.style.display = 'flex'
          div.style.alignItems = 'center'
          div.style.justifyContent = 'center'
          const clip = new mxRectangle(dx, dy, availableWidth, availableHeight)
          this.addGraphFragment(-dx, -dy, this.scale, pageNum, div, clip)

          // Adds given ID as anchor for internal links in first page
          if (id != null && i === 0 && j === 0) {
            div.setAttribute('id', id)
          }

          addPage(div, true)
        }
      }

      if (apx != null) {
        for (let i = 0; i < apx.length; i++) {
          addPage(apx[i], i < apx.length - 1)
        }
      }

      if (isNewWindow && !keepOpen) {
        this.closeDocument()
      }

      this.wnd.focus()
    } catch (e) {
      // Removes the DIV from the document in case of an error
      if (div != null && div.parentNode != null) {
        div.parentNode.removeChild(div)
      }

      if (window.console != null) {
        console.error(e)
      }
    } finally {
      this.graph.cellRenderer.initializeOverlay = previousInitializeOverlay
    }

    return this.wnd
  }
  /**
   * Function: addPendingCss
   *
   * Writes any pending CSS to the document.
   */
  mxPrintPreview.prototype.addPendingCss = function (doc) {
    if (this.pendingCss != null) {
      const style = doc.createElement('style')
      style.setAttribute('type', 'text/css')
      style.appendChild(doc.createTextNode(this.pendingCss))
      const head = doc.getElementsByTagName('head')[0]
      head.appendChild(style)
      this.pendingCss = null
    }
  }
  /**
   * Function: closeDocument
   *
   * Writes the closing tags for body and page after calling <writePostfix>.
   */
  mxPrintPreview.prototype.closeDocument = function () {
    try {
      if (this.wnd != null && this.wnd.document != null) {
        const doc = this.wnd.document

        this.writePostfix(doc)
        doc.writeln('</body>')
        doc.writeln('</html>')
        doc.close()
        this.addPendingCss(doc)

        // Removes all event handlers in the print output
        mxEvent.release(doc.body)
      }
    } catch (e) {
      // ignore any errors resulting from wnd no longer being available
    }
  }
  /**
   * Function: writeHead
   *
   * Writes the HEAD section into the given document, without the opening
   * and closing HEAD tags.
   */
  mxPrintPreview.prototype.writeHead = function (doc, css) {
    if (this.title != null) {
      doc.writeln('<title>' + mxUtils.htmlEntities(this.title) + '</title>')
    }

    // Adds all required stylesheets
    mxClient.link('stylesheet', mxClient.basePath + '/css/common.css', doc)

    // Removes horizontal rules and page selector from print output
    doc.writeln('<style type="text/css">')
    doc.writeln(this.defaultCss)
    const pf = this.pageFormat

    // Sets printer defaults
    if (this.addPageCss && pf != null) {
      const size = ((pf.width / this.pixelsPerInch)).toFixed(2) + 'in ' + ((pf.height / this.pixelsPerInch)).toFixed(2) + 'in'

      doc.writeln('@page {')
      doc.writeln('  margin: ' + mxUtils.htmlEntities((this.pageMargin / this.pixelsPerInch).toFixed(2)) + 'in;')
      doc.writeln('  size: ' + mxUtils.htmlEntities(size) + ';')
      doc.writeln('}')
    }

    if (css != null) {
      doc.writeln(mxUtils.htmlEntities(css, false, false, false))
    }

    doc.writeln('</style>')
  }
  /**
   * Function: writePostfix
   *
   * Called before closing the body of the page. This implementation is empty.
   */
  mxPrintPreview.prototype.writePostfix = function (doc) {
    // empty
  }
  /**
   * Function: isCellVisible
   *
   * Returns true if the given cell should be painted. This returns true.
   *
   * Parameters:
   *
   * cell - <mxCell> whose visible state should be checked.
   */
  mxPrintPreview.prototype.isCellVisible = function (cell) {
    return true
  }
  /**
   * Function: drawBackgroundImage
   *
   * Draws the given background image.
   */
  mxPrintPreview.prototype.drawBackgroundImage = function (img) {
    img.redraw()
  }
  /**
   * Function: addGraphFragment
   *
   * Adds a graph fragment to the given div.
   *
   * Parameters:
   *
   * dx - Horizontal translation for the diagram.
   * dy - Vertical translation for the diagram.
   * scale - Scale for the diagram.
   * pageNumber - Number of the page to be rendered.
   * div - Div that contains the output.
   * clip - Contains the clipping rectangle as an <mxRectangle>.
   */
  mxPrintPreview.prototype.addGraphFragment = function (dx, dy, scale, pageNumber, div, clip) {
    const view = this.graph.getView()
    const previousContainer = this.graph.container
    this.graph.container = div

    const canvas = view.getCanvas()
    const backgroundPane = view.getBackgroundPane()
    const drawPane = view.getDrawPane()
    const overlayPane = view.getOverlayPane()
    const realScale = scale

    if (this.graph.dialect === mxConstants.DIALECT_SVG) {
      view.createSvg()

      // Uses CSS transform for scaling
      if (this.useCssTransforms()) {
        const g = view.getDrawPane().parentNode
        g.setAttribute('transformOrigin', '0 0')
        g.setAttribute('transform', 'scale(' + scale + ',' + scale + ')' + 'translate(' + dx + ',' + dy + ')')

        scale = 1
        dx = 0
        dy = 0
      }
    } else {
      view.createHtml()
    }

    // Disables events on the view
    const eventsEnabled = view.isEventsEnabled()
    view.setEventsEnabled(false)

    // Disables the graph to avoid cursors
    const graphEnabled = this.graph.isEnabled()
    this.graph.setEnabled(false)

    // Resets the translation
    const translate = view.getTranslate()
    view.translate = new mxPoint(dx, dy)

    // Avoids destruction of existing handlers
    const updateHandler = this.graph.selectionCellsHandler.updateHandler
    this.graph.selectionCellsHandler.updateHandler = function () {
      // TODO
    }

    // Redraws only states that intersect the clip
    const redraw = this.graph.cellRenderer.redraw
    const states = view.states
    const s = view.scale

    let bgImg = null

    if (this.printBackgroundImage) {
      const bg = this.getBackgroundImage()

      if (bg != null) {
        const bounds = new mxRectangle(Math.round(dx * s + bg.x), Math.round(dy * s + bg.y), bg.width - 1, bg.height - 1)

        bgImg = new mxImageShape(bounds, bg.src)
        bgImg.dialect = this.graph.dialect
      }
    }

    // Gets the transformed clip for intersection check below
    if (this.clipping) {
      const tempClip = new mxRectangle((clip.x + translate.x + 1.5) * s, (clip.y + translate.y + 1.5) * s, (clip.width - 1.5) * s / realScale, (clip.height - 1.5) * s / realScale)
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const self = this

      // Checks clipping rectangle for speedup
      // Must create terminal states for edge clipping even if terminal outside of clip
      this.graph.cellRenderer.redraw = function (state, force, rendering) {
        if (state != null) {
          // Gets original state from graph to find bounding box
          const orig = states.get(state.cell)

          if (orig != null) {
            const bbox = view.getBoundingBox(orig, false)

            // Stops rendering if outside clip for speedup but ignores
            // edge labels where width and height is set to 0
            if (bbox != null && bbox.width > 0 && bbox.height > 0 && !mxUtils.intersects(tempClip, bbox)) {
              return
            }
          }

          if (!self.isCellVisible(state.cell)) {
            return
          }
        }

        redraw.apply(this, arguments)
      }

      if (bgImg != null) {
        const temp = new mxRectangle(bgImg.bounds.x * s + (translate.x - dx) * s, bgImg.bounds.y * s + (translate.y - dy) * s, bgImg.bounds.width * s, bgImg.bounds.height * s)

        if (!mxUtils.intersects(tempClip, temp)) {
          bgImg = null
        }
      }
    }

    if (bgImg != null) {
      bgImg.init(view.backgroundPane)
      this.drawBackgroundImage(bgImg)
    }

    let temp = null

    try {
      // Creates the temporary cell states in the view and
      // draws them onto the temporary DOM nodes in the view
      const cells = [this.getRoot()]
      temp = new mxTemporaryCellStates(view, scale, cells, null, mxUtils.bind(this, function (state) {
        return this.getLinkForCellState(state)
      }))
    } finally {
      // Removes everything but the SVG node
      let tmp = div.firstChild

      while (tmp != null) {
        const next = tmp.nextSibling
        const name = tmp.nodeName.toLowerCase()

        if (name === 'svg') {
          tmp.style.top = ''
          tmp.style.left = ''
          tmp.style.width = ''
          tmp.style.height = ''
          tmp.style.display = ''
          tmp.style.maxWidth = '100%'
          tmp.style.maxHeight = '100%'
          tmp.style.overflow = (mxClient.IS_SF) ? 'hidden' : 'clip'
          tmp.style.overflowClipMargin = this.overflowClipMargin
          tmp.setAttribute('viewBox', '0 0 ' + ((mxClient.IS_SF) ? ((clip.width + 1) + ' ' + (clip.height + 1)) : ((clip.width - 1) + ' ' + (clip.height - 1))))

          this.addGrid(tmp, clip)

          // Workaround for no dimension in Safari
          if (mxClient.IS_SF) {
            if (clip.width > clip.height) {
              tmp.style.height = '100%'
            } else {
              tmp.style.width = '100%'
            }
          }
        } else if (!this.isTextLabel(tmp)) {
          // Tries to fetch all text labels and only text labels
          tmp.parentNode.removeChild(tmp)
        }

        tmp = next
      }

      // Completely removes the overlay pane to remove more handles
      view.overlayPane.parentNode.removeChild(view.overlayPane)

      // Restores the state of the view
      this.graph.setEnabled(graphEnabled)
      this.graph.container = previousContainer
      this.graph.cellRenderer.redraw = redraw
      this.graph.selectionCellsHandler.updateHandler = updateHandler
      view.canvas = canvas
      view.backgroundPane = backgroundPane
      view.drawPane = drawPane
      view.overlayPane = overlayPane
      view.translate = translate
      temp.destroy()
      view.setEventsEnabled(eventsEnabled)
    }
  }
  /**
   * Function: addGrid
   *
   * Returns true if the given node is a test label.
   */
  mxPrintPreview.prototype.addGrid = function (svg, clip) {
    if (this.gridSize > 0 && this.gridSteps > 0 && this.gridColor != null) {
      const grid = this.createSvgGrid(svg, clip)
      const defsElt = mxUtils.getSvgDefs(svg)

      if (defsElt.nextSibling != null) {
        defsElt.parentNode.insertBefore(grid, defsElt.nextSibling)
      } else {
        defsElt.parentNode.appendChild(grid)
      }
    }
  }
  /**
   * Function: createSvgGrid
   *
   * Creates the SVG grid.
   */
  mxPrintPreview.prototype.createSvgGrid = function (svg, clip) {
    let size = this.gridSize
    const svgDoc = svg.ownerDocument
    const group = (svgDoc.createElementNS != null) ? svgDoc.createElementNS(mxConstants.NS_SVG, 'g') : svgDoc.createElement('g')

    const xp = mxUtils.mod(Math.ceil(Math.round(clip.x) / size), this.gridSteps)
    let x = mxUtils.mod(size - mxUtils.mod(Math.round(clip.x), size), size)

    const yp = mxUtils.mod(Math.ceil(Math.round(clip.y) / size), this.gridSteps)
    let y = mxUtils.mod(size - mxUtils.mod(Math.round(clip.y), size), size)

    x *= this.scale
    y *= this.scale
    size *= this.scale

    const hlines = Math.ceil(clip.height / size)

    for (let i = 0; i < hlines; i++) {
      const line = (svgDoc.createElementNS != null) ? svgDoc.createElementNS(mxConstants.NS_SVG, 'line') : svgDoc.createElement('line')
      line.setAttribute('x1', `${0}`)
      line.setAttribute('y1', (i * size) + y)
      line.setAttribute('x2', clip.width)
      line.setAttribute('y2', (i * size) + y)
      line.setAttribute('stroke', this.gridColor)
      line.setAttribute('opacity', (mxUtils.mod(i + yp, this.gridSteps) === 0) ? '1' : '0.2')
      line.setAttribute('stroke-width', '0.5')
      group.appendChild(line)
    }

    const vlines = Math.ceil(clip.width / size)

    for (let i = 0; i < vlines; i++) {
      const line = (svgDoc.createElementNS != null) ? svgDoc.createElementNS(mxConstants.NS_SVG, 'line') : svgDoc.createElement('line')
      line.setAttribute('x1', (i * size) + x)
      line.setAttribute('y1', `${0}`)
      line.setAttribute('x2', (i * size) + x)
      line.setAttribute('y2', clip.height)
      line.setAttribute('stroke', this.gridColor)
      line.setAttribute('opacity', (mxUtils.mod(i + xp, this.gridSteps) === 0) ? '1' : '0.2')
      line.setAttribute('stroke-width', '0.5')
      group.appendChild(line)
    }

    return group
  }

  /**
   * Function: isTextLabel
   *
   * Returns true if the given node is a test label.
   */
  mxPrintPreview.prototype.isTextLabel = function (node) {
    return node.style.cursor === 'default' || node.nodeName.toLowerCase() === 'div'
  }
  /**
   * Function: getBackgroundImage
   *
   * Returns the current background image.
   */
  mxPrintPreview.prototype.getBackgroundImage = function () {
    return this.graph.backgroundImage
  }

  if (mxPrintPreview.prototype.hasOwnProperty('addPageBreak')) {
    delete mxPrintPreview.prototype.addPageBreak
  }
  if (mxPrintPreview.prototype.hasOwnProperty('createPageSelector')) {
    delete mxPrintPreview.prototype.createPageSelector
  }
  if (mxPrintPreview.prototype.hasOwnProperty('renderPage')) {
    delete mxPrintPreview.prototype.renderPage
  }
  if (mxPrintPreview.prototype.hasOwnProperty('insertBackgroundImage')) {
    delete mxPrintPreview.prototype.insertBackgroundImage
  }
  // mxPrintView end
  mxOutput.mxPrintPreview = mxPrintPreview
}
