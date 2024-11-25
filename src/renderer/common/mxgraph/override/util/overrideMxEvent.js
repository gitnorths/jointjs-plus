export function overrideMxEvent (mxOutput) {
  const { mxClient, mxEvent } = mxOutput
  /**
   * Function: isMouseEvent
   *
   * Returns true if the event was generated using a mouse (not a pen or touch device).
   */
  mxEvent.isMouseEvent = function (evt) {
    // Workaround for mixed event types during one gesture in Chrome on Linux
    if (!mxClient.IS_ANDROID && mxClient.IS_LINUX && mxClient.IS_GC) {
      return true
    } else {
      return (evt.pointerType != null)
        ? (evt.pointerType === 'mouse' || evt.pointerType === evt.MSPOINTER_TYPE_MOUSE)
        : ((evt.mozInputSource != null)
          ? evt.mozInputSource === 1
          : evt.type.indexOf('mouse') === 0)
    }
  }
  /**
   * Variable: CONSUME_MOUSE_EVENT
   *
   * Specifies the event name for consumeMouseEvent.
   */
  mxEvent.CONSUME_MOUSE_EVENT = 'consumeMouseEvent'

  mxOutput.mxEvent = mxEvent
}
