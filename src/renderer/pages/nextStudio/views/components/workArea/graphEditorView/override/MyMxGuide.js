import { mxConstants, mxEvent, mxGuide, mxPolyline } from '@/renderer/common/mxgraph'

export class MyMxGuide extends mxGuide {
  // eslint-disable-next-line no-useless-constructor
  constructor (graph, states) {
    super(graph, states)
  }

  // +++++++++++++ 原型方法start ++++++++++++++
  // Overrides color for virtual guides for page centers
  getGuideColor (state, horizontal) {
    return (state.cell == null) ? '#ffa500' /* orange */ : mxConstants.GUIDE_COLOR
  }

  // Alt-move disables guides
  isEnabledForEvent (evt) {
    return !mxEvent.isAltDown(evt) || mxEvent.isShiftDown(evt)
  }

  /**
   * No dashed shapes.
   */
  createGuideShape (horizontal) {
    const guide = new mxPolyline([], mxConstants.GUIDE_COLOR, mxConstants.GUIDE_STROKEWIDTH)

    return guide
  }

  // +++++++++++++ 原型方法end ++++++++++++++
}
