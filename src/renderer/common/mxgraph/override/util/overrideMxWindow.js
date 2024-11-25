export function overrideMxWindow (mxOutput) {
  const {
    mxClient,
    mxEvent,
    mxEventObject,
    mxUtils,
    mxWindow
  } = mxOutput
  // mxWindow start

  /**
   * Function: init
   *
   * Initializes the DOM tree that represents the window.
   */
  mxWindow.prototype.init = function (x, y, width, height, style) {
    style = (style != null) ? style : 'mxWindow'

    this.div = document.createElement('div')
    this.div.className = style

    this.div.style.left = x + 'px'
    this.div.style.top = y + 'px'
    this.table = document.createElement('table')
    this.table.className = style

    // Disables built-in pan and zoom in IE10 and later
    if (mxClient.IS_POINTER) {
      this.div.style.touchAction = 'none'
    }

    // Workaround for table size problems in FF
    if (width != null) {
      this.div.style.width = width + 'px'
      this.table.style.width = width + 'px'
    }

    if (height != null) {
      this.div.style.height = height + 'px'
      this.table.style.height = height + 'px'
    }

    // Creates title row
    const tbody = document.createElement('tbody')
    let tr = document.createElement('tr')

    this.title = document.createElement('td')
    this.title.className = style + 'Title'

    this.buttons = document.createElement('div')
    this.buttons.style.position = 'absolute'
    this.buttons.style.display = 'inline-block'
    this.buttons.style.right = '4px'
    this.buttons.style.top = '5px'
    this.title.appendChild(this.buttons)

    tr.appendChild(this.title)
    tbody.appendChild(tr)

    // Creates content row and table cell
    tr = document.createElement('tr')
    this.td = document.createElement('td')
    this.td.className = style + 'Pane'

    if (document.documentMode === 7) {
      this.td.style.height = '100%'
    }

    this.contentWrapper = document.createElement('div')
    this.contentWrapper.className = style + 'Pane'
    this.contentWrapper.style.width = '100%'
    this.contentWrapper.appendChild(this.content)

    // Workaround for div around div restricts height
    // of inner div if outerdiv has hidden overflow
    if (this.content.nodeName.toUpperCase() !== 'DIV') {
      this.contentWrapper.style.height = '100%'
    }

    // Puts all content into the DOM
    this.td.appendChild(this.contentWrapper)
    tr.appendChild(this.td)
    tbody.appendChild(tr)
    this.table.appendChild(tbody)
    this.div.appendChild(this.table)

    // Puts the window on top of other windows when clicked
    const activator = mxUtils.bind(this, function (evt) {
      this.activate()
    })

    mxEvent.addGestureListeners(this.title, activator)
    mxEvent.addGestureListeners(this.table, activator)

    this.hide()
  }

  /**
   * Function: setResizable
   *
   * Sets if the window should be resizable. To avoid interference with some
   * built-in features of IE10 and later, the use of the following code is
   * recommended if there are resizable <mxWindow>s in the page:
   *
   * (code)
   * if (mxClient.IS_POINTER)
   * {
   *   document.body.style.msTouchAction = 'none';
   * }
   * (end)
   */
  mxWindow.prototype.setResizable = function (resizable) {
    if (resizable) {
      if (this.resize == null) {
        this.resize = document.createElement('img')
        this.resize.style.position = 'absolute'
        this.resize.style.bottom = '0px'
        this.resize.style.right = '0px'
        this.resize.style.zIndex = '2'

        this.resize.setAttribute('src', this.resizeImage)
        this.resize.style.cursor = 'nwse-resize'

        let startX = null
        let startY = null
        let width = null
        let height = null
        // Adds a temporary pair of listeners to intercept
        // the gesture event in the document
        const dragHandler = mxUtils.bind(this, function (evt) {
          if (startX != null && startY != null) {
            const dx = mxEvent.getClientX(evt) - startX
            const dy = mxEvent.getClientY(evt) - startY

            this.setSize(width + dx, height + dy)

            this.fireEvent(new mxEventObject(mxEvent.RESIZE, 'event', evt))
            mxEvent.consume(evt)
          }
        })

        const dropHandler = mxUtils.bind(this, function (evt) {
          if (startX != null && startY != null) {
            startX = null
            startY = null
            mxEvent.removeGestureListeners(document, null, dragHandler, dropHandler)
            this.fireEvent(new mxEventObject(mxEvent.RESIZE_END, 'event', evt))
            mxEvent.consume(evt)
          }
        })
        const start = mxUtils.bind(this, function (evt) {
          // LATER: pointerdown starting on border of resize does start
          // the drag operation but does not fire consecutive events via
          // one of the listeners below (does pan instead).
          // Workaround: document.body.style.msTouchAction = 'none'
          this.activate()
          startX = mxEvent.getClientX(evt)
          startY = mxEvent.getClientY(evt)
          width = this.div.offsetWidth
          height = this.div.offsetHeight

          mxEvent.addGestureListeners(document, null, dragHandler, dropHandler)
          this.fireEvent(new mxEventObject(mxEvent.RESIZE_START, 'event', evt))
          mxEvent.consume(evt)
        })

        mxEvent.addGestureListeners(this.resize, start, dragHandler, dropHandler)
        this.div.appendChild(this.resize)
      } else {
        this.resize.style.display = 'inline'
      }
    } else if (this.resize != null) {
      this.resize.style.display = 'none'
    }
  }

  /**
   * Function: setSize
   *
   * Sets the size of the window.
   */
  mxWindow.prototype.setSize = function (width, height) {
    width = Math.max(this.minimumSize.width, width)
    height = Math.max(this.minimumSize.height, height)

    // Workaround for table size problems in FF
    this.div.style.width = width + 'px'
    this.div.style.height = height + 'px'

    this.table.style.width = width + 'px'
    this.table.style.height = height + 'px'

    this.contentWrapper.style.height = (this.div.offsetHeight -
      this.title.offsetHeight - this.contentHeightCorrection) + 'px'
  }

  /**
   * Function: setMinimizable
   *
   * Sets if the window is minimizable.
   */
  mxWindow.prototype.setMinimizable = function (minimizable) {
    this.minimizeImg.style.display = (minimizable) ? '' : 'none'
  }

  /**
   * Function: toggleMinimized
   *
   * Minimizes the window.
   */
  mxWindow.prototype.toggleMinimized = function (evt) {
    this.activate()

    if (!this.minimized) {
      this.minimized = true

      this.minimizeImg.setAttribute('src', this.normalizeImage)
      this.minimizeImg.setAttribute('title', 'Normalize')
      this.contentWrapper.style.display = 'none'
      this.maxDisplay = this.maximize.style.display

      this.maximize.style.display = 'none'
      this.height = this.table.style.height

      const minSize = this.getMinimumSize()

      if (minSize.height > 0) {
        this.div.style.height = minSize.height + 'px'
        this.table.style.height = minSize.height + 'px'
      }

      if (minSize.width > 0) {
        this.div.style.width = minSize.width + 'px'
        this.table.style.width = minSize.width + 'px'
      }

      if (this.resize != null) {
        this.resize.style.visibility = 'hidden'
      }

      this.fireEvent(new mxEventObject(mxEvent.MINIMIZE, 'event', evt))
    } else {
      this.minimized = false

      this.minimizeImg.setAttribute('src', this.minimizeImage)
      this.minimizeImg.setAttribute('title', 'Minimize')
      this.contentWrapper.style.display = '' // default
      this.maximize.style.display = this.maxDisplay

      this.div.style.height = this.height
      this.table.style.height = this.height

      if (this.resize != null) {
        this.resize.style.visibility = ''
      }

      this.fireEvent(new mxEventObject(mxEvent.NORMALIZE, 'event', evt))
    }
  }

  /**
   * Function: installMinimizeHandler
   *
   * Installs the event listeners required for minimizing the window.
   */
  mxWindow.prototype.installMinimizeHandler = function () {
    this.minimizeImg = document.createElement('img')

    this.minimizeImg.setAttribute('src', this.minimizeImage)
    this.minimizeImg.setAttribute('title', 'Minimize')
    this.minimizeImg.style.cursor = 'pointer'
    this.minimizeImg.style.marginLeft = '2px'
    this.minimizeImg.style.display = 'none'

    this.buttons.appendChild(this.minimizeImg)

    this.minimized = false
    this.maxDisplay = null
    this.height = null

    const funct = mxUtils.bind(this, function (evt) {
      this.toggleMinimized(evt)
      mxEvent.consume(evt)
    })

    mxEvent.addGestureListeners(this.minimizeImg, funct)
  }

  /**
   * Function: installMaximizeHandler
   *
   * Installs the event listeners required for maximizing the window.
   */
  mxWindow.prototype.installMaximizeHandler = function () {
    this.maximize = document.createElement('img')

    this.maximize.setAttribute('src', this.maximizeImage)
    this.maximize.setAttribute('title', 'Maximize')
    this.maximize.style.cursor = 'default'
    this.maximize.style.marginLeft = '2px'
    this.maximize.style.cursor = 'pointer'
    this.maximize.style.display = 'none'

    this.buttons.appendChild(this.maximize)

    let maximized = false
    let x = null
    let y = null
    let height = null
    let width = null
    let minDisplay = null

    const funct = mxUtils.bind(this, function (evt) {
      this.activate()

      if (this.maximize.style.display !== 'none') {
        if (!maximized) {
          maximized = true

          this.maximize.setAttribute('src', this.normalizeImage)
          this.maximize.setAttribute('title', 'Normalize')
          this.contentWrapper.style.display = ''
          minDisplay = this.minimizeImg.style.display
          this.minimizeImg.style.display = 'none'

          // Saves window state
          x = parseInt(this.div.style.left)
          y = parseInt(this.div.style.top)
          height = this.table.style.height
          width = this.table.style.width

          this.div.style.left = '0px'
          this.div.style.top = '0px'
          const docHeight = Math.max(document.body.clientHeight || 0, document.documentElement.clientHeight || 0)

          this.div.style.width = (document.body.clientWidth - 2) + 'px'
          this.div.style.height = (docHeight - 2) + 'px'

          this.table.style.width = (document.body.clientWidth - 2) + 'px'
          this.table.style.height = (docHeight - 2) + 'px'

          if (this.resize != null) {
            this.resize.style.visibility = 'hidden'
          }

          const style = mxUtils.getCurrentStyle(this.contentWrapper)

          if (style.overflow === 'auto' || this.resize != null) {
            this.contentWrapper.style.height = (this.div.offsetHeight -
              this.title.offsetHeight - this.contentHeightCorrection) + 'px'
          }

          this.fireEvent(new mxEventObject(mxEvent.MAXIMIZE, 'event', evt))
        } else {
          maximized = false

          this.maximize.setAttribute('src', this.maximizeImage)
          this.maximize.setAttribute('title', 'Maximize')
          this.contentWrapper.style.display = ''
          this.minimizeImg.style.display = minDisplay

          // Restores window state
          this.div.style.left = x + 'px'
          this.div.style.top = y + 'px'

          this.div.style.height = height
          this.div.style.width = width

          const style = mxUtils.getCurrentStyle(this.contentWrapper)

          if (style.overflow === 'auto' || this.resize != null) {
            this.contentWrapper.style.height = (this.div.offsetHeight -
              this.title.offsetHeight - this.contentHeightCorrection) + 'px'
          }

          this.table.style.height = height
          this.table.style.width = width

          if (this.resize != null) {
            this.resize.style.visibility = ''
          }

          this.fireEvent(new mxEventObject(mxEvent.NORMALIZE, 'event', evt))
        }

        mxEvent.consume(evt)
      }
    })

    mxEvent.addGestureListeners(this.maximize, funct)
    mxEvent.addListener(this.title, 'dblclick', funct)
  }

  /**
   * Function: setVisible
   *
   * Shows or hides the window depending on the given flag.
   *
   * Parameters:
   *
   * visible - Boolean indicating if the window should be made visible.
   */
  mxWindow.prototype.setVisible = function (visible) {
    if (this.div != null) {
      if (this.isVisible() !== visible) {
        if (visible) {
          this.show()
        } else {
          this.hide()
        }
      } else {
        this.fireEvent(new mxEventObject((visible)
          ? mxEvent.SHOW
          : mxEvent.HIDE))
      }
    }
  }

  /**
   * Function: show
   *
   * Shows the window.
   */
  mxWindow.prototype.show = function () {
    this.div.style.display = ''
    this.activate()

    const style = mxUtils.getCurrentStyle(this.contentWrapper)

    if ((style.overflow === 'auto' || this.resize != null) &&
      this.contentWrapper.style.display !== 'none') {
      this.contentWrapper.style.height = (this.div.offsetHeight -
        this.title.offsetHeight - this.contentHeightCorrection) + 'px'
    }

    this.fireEvent(new mxEventObject(mxEvent.SHOW))
  }
// mxWindow end
  mxOutput.mxWindow = mxWindow
}
