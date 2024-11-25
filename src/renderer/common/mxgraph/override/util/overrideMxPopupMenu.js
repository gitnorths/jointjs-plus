export function overrideMxPopupMenu (mxOutput) {
  const { mxPopupMenu, mxUtils, mxEvent } = mxOutput

  /**
   * Function: addItem
   *
   * Adds the given item to the given parent item. If no parent item is specified
   * then the item is added to the top-level menu. The return value may be used
   * as the parent argument, ie. as a submenu item. The return value is the table
   * row that represents the item.
   *
   * Paramters:
   *
   * title - String that represents the title of the menu item.
   * image - Optional URL for the image icon.
   * funct - Function associated that takes a mouseup or touchend event.
   * parent - Optional item returned by <addItem>.
   * iconCls - Optional string that represents the CSS class for the image icon.
   * IconsCls is ignored if image is given.
   * enabled - Optional boolean indicating if the item is enabled. Default is true.
   * active - Optional boolean indicating if the menu should implement any event handling.
   * Default is true.
   * noHover - Optional boolean to disable hover state.
   */
  mxPopupMenu.prototype.addItem = function (title, image, funct, parent, iconCls, enabled, active, noHover) {
    parent = parent || this
    this.itemCount++

    // Smart separators only added if element contains items
    if (parent.willAddSeparator) {
      if (parent.containsItems) {
        this.addSeparator(parent, true)
      }

      parent.willAddSeparator = false
    }

    parent.containsItems = true
    const tr = document.createElement('tr')
    tr.className = 'mxPopupMenuItem'
    const col1 = document.createElement('td')
    col1.className = 'mxPopupMenuIcon'

    // Adds the given image into the first column
    if (image != null) {
      const img = document.createElement('img')
      img.src = image
      col1.appendChild(img)
    } else if (iconCls != null) {
      const div = document.createElement('div')
      div.className = iconCls
      col1.appendChild(div)
    }

    tr.appendChild(col1)

    if (this.labels) {
      const col2 = document.createElement('td')
      col2.className = 'mxPopupMenuItem' +
        ((enabled != null && !enabled) ? ' mxDisabled' : '')

      mxUtils.write(col2, title)
      col2.align = 'left'
      tr.appendChild(col2)

      const col3 = document.createElement('td')
      col3.className = 'mxPopupMenuItem' +
        ((enabled != null && !enabled) ? ' mxDisabled' : '')
      col3.style.paddingRight = '6px'
      col3.style.textAlign = 'right'

      tr.appendChild(col3)

      if (parent.div == null) {
        this.createSubmenu(parent)
      }
    }

    parent.tbody.appendChild(tr)

    if (active !== false && enabled !== false) {
      let currentSelection = null

      mxEvent.addGestureListeners(tr,
        mxUtils.bind(this, function (evt) {
          this.eventReceiver = tr

          if (parent.activeRow !== tr && parent.activeRow !== parent) {
            if (parent.activeRow != null && parent.activeRow.div.parentNode != null) {
              this.hideSubmenu(parent)
            }

            if (tr.div != null) {
              this.showSubmenu(parent, tr)
              parent.activeRow = tr
            }
          }

          // Workaround for lost current selection in page because of focus in IE
          if (document.selection != null && document.documentMode === 8) {
            currentSelection = document.selection.createRange()
          }

          mxEvent.consume(evt)
        }),
        mxUtils.bind(this, function (evt) {
          if (parent.activeRow !== tr && parent.activeRow !== parent) {
            if (parent.activeRow != null && parent.activeRow.div.parentNode != null) {
              this.hideSubmenu(parent)
            }

            if (this.autoExpand && tr.div != null) {
              this.showSubmenu(parent, tr)
              parent.activeRow = tr
            }
          }

          // Sets hover style because TR in IE doesn't have hover
          if (!noHover) {
            tr.className = 'mxPopupMenuItemHover'
          }
        }),
        mxUtils.bind(this, function (evt) {
          // EventReceiver avoids clicks on a submenu item
          // which has just been shown in the mousedown
          if (this.eventReceiver === tr) {
            if (parent.activeRow !== tr) {
              this.hideMenu()
            }

            // Workaround for lost current selection in page because of focus in IE
            if (currentSelection != null) {
              // Workaround for "unspecified error" in IE8 standards
              try {
                currentSelection.select()
              } catch (e) {
                // ignore
              }

              currentSelection = null
            }

            if (funct != null) {
              funct(evt)
            }
          }

          this.eventReceiver = null
          mxEvent.consume(evt)
        })
      )

      // Resets hover style because TR in IE doesn't have hover
      if (!noHover) {
        mxEvent.addListener(tr, 'mouseout',
          mxUtils.bind(this, function (evt) {
            tr.className = 'mxPopupMenuItem'
          })
        )
      }
    }

    return tr
  }
  /**
   * Function: showSubmenu
   *
   * Shows the submenu inside the given parent row.
   */
  mxPopupMenu.prototype.showSubmenu = function (parent, row) {
    if (row.div != null) {
      row.div.style.left = (parent.div.offsetLeft +
        row.offsetLeft + row.offsetWidth - 1) + 'px'
      row.div.style.top = (parent.div.offsetTop + row.offsetTop) + 'px'
      document.body.appendChild(row.div)

      // Moves the submenu to the left side if there is no space
      const left = parseInt(row.div.offsetLeft)
      const width = parseInt(row.div.offsetWidth)
      const offset = mxUtils.getDocumentScrollOrigin(document)

      const b = document.body
      const d = document.documentElement

      const right = offset.x + (b.clientWidth || d.clientWidth)

      if (left + width > right) {
        row.div.style.left = Math.max(0, parent.div.offsetLeft - width + 16) + 'px'
      }

      // Show scrollbar if menu is larger than available height
      row.div.style.overflowY = 'auto'
      row.div.style.overflowX = 'hidden'
      const h0 = Math.max(document.body.clientHeight, document.documentElement.clientHeight)
      row.div.style.maxHeight = (h0 - 10) + 'px'

      mxUtils.fit(row.div)
    }
  }

  mxOutput.mxPopupMenu = mxPopupMenu
}
