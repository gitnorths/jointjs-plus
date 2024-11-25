import { mxEvent, mxGraphHandler, mxRectangle, mxUtils } from '@/renderer/common/mxgraph'
import { createHint, formatHintText } from './common'
import { MyEditor } from './MyEditor'
import { MyMxGuide } from '@/renderer/pages/nextStudio/views/components/workArea/graphEditorView/override/MyMxGuide'

export class MyMxGraphHandler extends mxGraphHandler {
  constructor (graph) {
    super(graph)

    this.guidesEnabled = true // Enables guides
    this.removeEmptyParents = true // Removes parents where all child cells are moved out
    this.maxLivePreview = 16
  }

  // +++++++++++++ 原型方法start ++++++++++++++
  /**
   * @override
   * Disables removing relative children and table rows and cells from parents
   */
  shouldRemoveCellsFromParent (parent, cells, evt) {
    if (this.graph.isCellSelected(parent)) {
      return false
    }

    for (let i = 0; i < cells.length; i++) {
      if (this.graph.isTableCell(cells[i]) || this.graph.isTableRow(cells[i])) {
        return false
      } else if (this.graph.getModel().isVertex(cells[i])) {
        const geo = this.graph.getCellGeometry(cells[i])

        if (geo != null && geo.relative) {
          return false
        }
      }
    }

    return super.shouldRemoveCellsFromParent(parent, cells, evt)
  }

  /**
   * @override
   * Selects tables before cells and rows.
   */
  isPropagateSelectionCell (cell, immediate, me) {
    let result
    const parent = this.graph.model.getParent(cell)

    if (immediate) {
      const geo = (this.graph.model.isEdge(cell))
        ? null
        : this.graph.getCellGeometry(cell)

      result = !this.graph.model.isEdge(parent) &&
        !this.graph.isSiblingSelected(cell) &&
        ((geo != null && geo.relative) ||
          !this.graph.isContainer(parent) ||
          this.graph.isPart(cell))
    } else {
      result = super.isPropagateSelectionCell(cell, immediate, me)

      if (this.graph.isTableCell(cell) || this.graph.isTableRow(cell)) {
        let table = parent

        if (!this.graph.isTable(table)) {
          table = this.graph.model.getParent(table)
        }

        result = !this.graph.selectionCellsHandler.isHandled(table) ||
          (this.graph.isCellSelected(table) && this.graph.isToggleEvent(me.getEvent())) ||
          (this.graph.isCellSelected(cell) && !this.graph.isToggleEvent(me.getEvent())) ||
          (this.graph.isTableCell(cell) && this.graph.isCellSelected(parent))
      }
    }

    return result
  }

  /**
   * Hold Alt to ignore drop target.
   */
  isValidDropTarget (target, me) {
    return super.isValidDropTarget(target, me) && !mxEvent.isAltDown(me.getEvent)
  }

  /**
   * Updates the hint for the current operation.
   */
  updateHint (me) {
    if (this.pBounds != null && (this.shape != null || this.livePreviewActive)) {
      if (this.hint == null) {
        this.hint = createHint()
        this.graph.container.appendChild(this.hint)
      }

      const t = this.graph.view.translate
      const s = this.graph.view.scale
      const x = this.roundLength((this.bounds.x + this.currentDx) / s - t.x)
      const y = this.roundLength((this.bounds.y + this.currentDy) / s - t.y)
      const unit = this.graph.view.unit

      this.hint.innerHTML = formatHintText(x, unit) + ', ' + formatHintText(y, unit)

      this.hint.style.left = (this.pBounds.x + this.currentDx +
        Math.round((this.pBounds.width - this.hint.clientWidth) / 2)) + 'px'
      this.hint.style.top = (this.pBounds.y + this.currentDy +
        this.pBounds.height + MyEditor.hintOffset) + 'px'
    }
  }

  /**
   * Updates the hint for the current operation.
   */
  removeHint () {
    if (this.hint != null) {
      if (this.hint.parentNode != null) {
        this.hint.parentNode.removeChild(this.hint)
      }

      this.hint = null
    }
  }

  // Special case for single edge label handle moving in which case the text bounding box is used
  getBoundingBox (cells) {
    if (cells != null && cells.length === 1) {
      const model = this.graph.getModel()
      const parent = model.getParent(cells[0])
      const geo = this.graph.getCellGeometry(cells[0])

      if (model.isEdge(parent) && geo != null && geo.relative) {
        const state = this.graph.view.getState(cells[0])

        if (state != null && state.width < 2 && state.height < 2 && state.text != null &&
          state.text.boundingBox != null) {
          return mxRectangle.fromRectangle(state.text.boundingBox)
        }
      }
    }

    return super.getBoundingBox(cells)
  }

  // Ignores child cells with part style as guides
  getGuideStates () {
    const states = super.getGuideStates()
    let result = []

    // NOTE: Could do via isStateIgnored hook
    for (let i = 0; i < states.length; i++) {
      if (mxUtils.getValue(states[i].style, 'part', '0') !== '1') {
        result.push(states[i])
      }
    }

    // 实例方法
    // Create virtual cell state for page centers
    if (this.graph.pageVisible) {
      const guides = []

      const pf = this.graph.pageFormat
      const ps = this.graph.pageScale
      const pw = pf.width * ps
      const ph = pf.height * ps
      const t = this.graph.view.translate
      const s = this.graph.view.scale

      const layout = this.graph.getPageLayout()

      for (let i = 0; i < layout.width; i++) {
        guides.push(new mxRectangle(((layout.x + i) * pw + t.x) * s,
          (layout.y * ph + t.y) * s, pw * s, ph * s))
      }

      for (let j = 1; j < layout.height; j++) {
        guides.push(new mxRectangle((layout.x * pw + t.x) * s,
          ((layout.y + j) * ph + t.y) * s, pw * s, ph * s))
      }

      // Page center guides have precedence over normal guides
      result = guides.concat(result)
    }

    return result
  }

  // +++++++++++++ 原型方法end ++++++++++++++
  /**
   * 使用自定义mxGuide
   * Function: start
   *
   * Starts the handling of the mouse gesture.
   */
  start (cell, x, y, cells) {
    super.start(cell, x, y, cells)
    this.guide = new MyMxGuide(this.graph, this.getGuideStates())
  }
}
