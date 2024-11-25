import { mxEvent, mxPanningHandler } from '@/renderer/common/mxgraph'
import { MyMxGraph } from './MyMxGraph'

export class MyMxPanningHandler extends mxPanningHandler {
  // eslint-disable-next-line no-useless-constructor
  constructor (graph) {
    super(graph)
    // TODO
  }

  // One finger pans (no rubberBand selection) must start regardless of mouse button
  isPanningTrigger (me) {
    const evt = me.getEvent()
    if (MyMxGraph.touchStyle) {
      return (me.getState() == null && !mxEvent.isMouseEvent(evt)) ||
        (mxEvent.isPopupTrigger(evt) && (me.getState() == null ||
          mxEvent.isControlDown(evt) || mxEvent.isShiftDown(evt)))
    } else {
      // Removes ctrl+shift as panning trigger for space splitting
      return (mxEvent.isLeftMouseButton(evt) && ((this.useLeftButtonForPanning &&
        me.getState() == null) || (mxEvent.isControlDown(evt) &&
        !mxEvent.isShiftDown(evt)))) || (this.usePopupTrigger &&
        mxEvent.isPopupTrigger(evt))
    }
  }
}
