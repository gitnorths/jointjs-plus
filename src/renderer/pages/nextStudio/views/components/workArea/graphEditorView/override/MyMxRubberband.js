import { mxClient, mxEvent, mxRectangle, mxRubberband, mxUtils } from '@/renderer/common/mxgraph'

export class MyMxRubberband extends mxRubberband {
  constructor (graph) {
    super(graph)
    this.fadeOut = true // Enables fading of rubberband
    this.defaultOpacity = 30 // 增加默认不透明度(默认为20)
    this.cancelled = false // Cancelled state
  }

  // +++++++++++++ 原型方法start ++++++++++++++
  // Workaround for Firefox where first mouse down is received
  // after tap and hold if scrollbars are visible, which means
  // start rubberband immediately if no cell is under mouse.
  isForceRubberbandEvent (me) {
    return super.isForceRubberbandEvent(me) ||
      (mxClient.IS_CHROMEOS && mxEvent.isShiftDown(me.getEvent())) ||
      (mxUtils.hasScrollbars(this.graph.container) && mxClient.IS_FF &&
        mxClient.IS_WIN && me.getState() == null && mxEvent.isTouchEvent(me.getEvent()))
  }

  // Overrides/extends rubberband for space handling with Ctrl+Shift(+Alt) drag ("scissors tool")
  isSpaceEvent (me) {
    return this.graph.isEnabled() && !this.graph.isCellLocked(this.graph.getDefaultParent()) &&
      (mxEvent.isControlDown(me.getEvent()) || mxEvent.isMetaDown(me.getEvent())) &&
      mxEvent.isShiftDown(me.getEvent()) && mxEvent.isAltDown(me.getEvent())
  }

  // Cancels ongoing rubberband selection but consumed event to avoid reset of selection
  cancel () {
    if (this.isActive()) {
      this.cancelled = true
      this.reset()
    }
  }

  // Handles moving of cells in both half panes
  mouseUp (sender, me) {
    if (this.cancelled) {
      this.cancelled = false
      me.consume()
    } else {
      const execute = this.div != null && this.div.style.display !== 'none'

      let x0 = null
      let y0 = null
      let dx = null
      let dy = null

      if (this.first != null && this.currentX != null && this.currentY != null) {
        x0 = this.first.x
        y0 = this.first.y
        dx = (this.currentX - x0) / this.graph.view.scale
        dy = (this.currentY - y0) / this.graph.view.scale

        if (!mxEvent.isAltDown(me.getEvent())) {
          dx = this.graph.snap(dx)
          dy = this.graph.snap(dy)

          if (!this.graph.isGridEnabled()) {
            if (Math.abs(dx) < this.graph.tolerance) {
              dx = 0
            }

            if (Math.abs(dy) < this.graph.tolerance) {
              dy = 0
            }
          }
        }
      }

      this.reset()

      if (execute) {
        if (this.isSpaceEvent(me)) {
          this.graph.model.beginUpdate()
          try {
            const cells = this.graph.getCellsBeyond(x0, y0, this.graph.getDefaultParent(), true, true)

            for (let i = 0; i < cells.length; i++) {
              if (this.graph.isCellMovable(cells[i])) {
                const tmp = this.graph.view.getState(cells[i])
                let geo = this.graph.getCellGeometry(cells[i])

                if (tmp != null && geo != null) {
                  geo = geo.clone()
                  geo.translate(dx, dy)
                  this.graph.model.setGeometry(cells[i], geo)
                }
              }
            }
          } finally {
            this.graph.model.endUpdate()
          }
        } else {
          const rect = new mxRectangle(this.x, this.y, this.width, this.height)
          this.graph.selectRegion(rect, me.getEvent())
        }

        me.consume()
      }
    }
  }

  // Handles preview for creating/removing space in diagram
  mouseMove (sender, me) {
    if (!me.isConsumed() && this.first != null) {
      const origin = mxUtils.getScrollOrigin(this.graph.container)
      const offset = mxUtils.getOffset(this.graph.container)
      origin.x -= offset.x
      origin.y -= offset.y
      const x = me.getX() + origin.x
      const y = me.getY() + origin.y
      const dx = this.first.x - x
      const dy = this.first.y - y
      const tol = this.graph.tolerance

      if (this.div != null || Math.abs(dx) > tol || Math.abs(dy) > tol) {
        if (this.div == null) {
          this.div = this.createShape()
        }

        // Clears selection while rubberbanding. This is required because
        // the event is not consumed in mouseDown.
        mxUtils.clearSelection()
        this.update(x, y)

        if (this.isSpaceEvent(me)) {
          const right = this.x + this.width
          const bottom = this.y + this.height
          const scale = this.graph.view.scale

          if (!mxEvent.isAltDown(me.getEvent())) {
            this.width = this.graph.snap(this.width / scale) * scale
            this.height = this.graph.snap(this.height / scale) * scale

            if (!this.graph.isGridEnabled()) {
              if (this.width < this.graph.tolerance) {
                this.width = 0
              }

              if (this.height < this.graph.tolerance) {
                this.height = 0
              }
            }

            if (this.x < this.first.x) {
              this.x = right - this.width
            }

            if (this.y < this.first.y) {
              this.y = bottom - this.height
            }
          }

          this.div.style.borderStyle = 'dashed'
          this.div.style.backgroundColor = 'white'
          this.div.style.left = this.x + 'px'
          this.div.style.top = this.y + 'px'
          this.div.style.width = Math.max(0, this.width) + 'px'
          this.div.style.height = this.graph.container.clientHeight + 'px'
          this.div.style.borderWidth = (this.width <= 0) ? '0px 1px 0px 0px' : '0px 1px 0px 1px'

          if (this.secondDiv == null) {
            this.secondDiv = this.div.cloneNode(true)
            this.div.parentNode.appendChild(this.secondDiv)
          }

          this.secondDiv.style.left = this.x + 'px'
          this.secondDiv.style.top = this.y + 'px'
          this.secondDiv.style.width = this.graph.container.clientWidth + 'px'
          this.secondDiv.style.height = Math.max(0, this.height) + 'px'
          this.secondDiv.style.borderWidth = (this.height <= 0) ? '1px 0px 0px 0px' : '1px 0px 1px 0px'
        } else {
          // Hides second div and restores style
          this.div.style.backgroundColor = ''
          this.div.style.borderWidth = ''
          this.div.style.borderStyle = ''

          if (this.secondDiv != null) {
            this.secondDiv.parentNode.removeChild(this.secondDiv)
            this.secondDiv = null
          }
        }

        me.consume()
      }
    }
  }

  // Removes preview
  reset () {
    if (this.secondDiv != null) {
      this.secondDiv.parentNode.removeChild(this.secondDiv)
      this.secondDiv = null
    }

    super.reset()
  }
}
