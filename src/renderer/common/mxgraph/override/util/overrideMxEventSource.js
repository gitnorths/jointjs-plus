export function overrideMxEventSource (mxOutput) {
  const { mxEventSource, mxEventObject } = mxOutput

  /**
   * Function: fireEvent
   *
   * Dispatches the given event to the listeners which are registered for
   * the event. The sender argument is optional. The current execution scope
   * ("this") is used for the listener invocation (see <mxUtils.bind>).
   *
   * Example:
   *
   * (code)
   * fireEvent(new mxEventObject("eventName", key1, val1, .., keyN, valN))
   * (end)
   *
   * Parameters:
   *
   * evt - <mxEventObject> that represents the event.
   * sender - Optional sender to be passed to the listener. Default value is
   * the return value of <getEventSource>.
   */
  mxEventSource.prototype.fireEvent = function (evt, sender) {
    if (this.eventListeners != null && this.isEventsEnabled()) {
      if (evt == null) {
        evt = new mxEventObject()
      }

      if (sender == null) {
        sender = this.getEventSource()
      }

      if (sender == null) {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        sender = this
      }

      for (let i = 0; i < this.eventListeners.length; i += 2) {
        const listen = this.eventListeners[i]

        if (listen == null || listen === evt.getName()) {
          // Workaround for closure compiler bug where args are
          // null in listeners for FF if an array var is used
          this.eventListeners[i + 1].apply(this, [sender, evt])
        }
      }
    }
  }
  mxOutput.mxEventSource = mxEventSource
}
