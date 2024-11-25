import { mxPopupMenuHandler } from '@/renderer/common/mxgraph'

export class MyMxPopupMenuHandler extends mxPopupMenuHandler {
  constructor (graph, factoryMethod) {
    super(graph, factoryMethod)
    this.autoExpand = true
  }

  // +++++++++++++ 原型方法start ++++++++++++++
  /**
   * Returns last selected ancestor
   */
  getCellForPopupEvent (me) {
    let cell = me.getCell()
    const model = this.graph.getModel()
    let parent = model.getParent(cell)
    const state = this.graph.view.getState(parent)
    let selected = this.graph.isCellSelected(cell)

    // eslint-disable-next-line no-unmodified-loop-condition
    while (state != null && (model.isVertex(parent) || model.isEdge(parent))) {
      const temp = this.graph.isCellSelected(parent)
      selected = selected || temp

      if (temp || (!selected && (this.graph.isTableCell(cell) || this.graph.isTableRow(cell)))) {
        cell = parent
      }

      parent = model.getParent(parent)
    }

    return cell
  }

  // +++++++++++++ 原型方法end ++++++++++++++
}
