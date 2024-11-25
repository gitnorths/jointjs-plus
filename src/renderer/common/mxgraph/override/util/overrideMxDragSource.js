export function overrideMxDragSource (mxOutput) {
  const { mxDragSource, mxUtils, mxEvent } = mxOutput
  /**
   * Function: mouseMove
   *
   * Gets the graph for the given event using <getGraphForEvent>, updates the
   * <currentGraph>, calling <dragEnter> and <dragExit> on the new and old graph,
   * respectively, and invokes <dragOver> if <currentGraph> is not null.
   */
  mxDragSource.prototype.mouseMove = function (evt) {
    let graph = this.getGraphForEvent(evt)

    // Checks if event is inside the bounds of the graph container
    if (graph != null && !this.graphContainsEvent(graph, evt)) {
      graph = null
    }

    if (graph !== this.currentGraph) {
      if (this.currentGraph != null) {
        this.dragExit(this.currentGraph, evt)
      }

      this.currentGraph = graph

      if (this.currentGraph != null) {
        this.dragEnter(this.currentGraph, evt)
      }
    }

    if (this.currentGraph != null) {
      this.dragOver(this.currentGraph, evt)
    }

    if (this.dragElement != null && (this.previewElement == null ||
      this.previewElement.style.visibility !== 'visible')) {
      let x = mxEvent.getClientX(evt)
      let y = mxEvent.getClientY(evt)

      if (this.dragElement.parentNode == null) {
        document.body.appendChild(this.dragElement)
      }

      mxUtils.setOpacity(this.dragElement, this.dragElementOpacity)

      if (this.dragOffset != null) {
        x += this.dragOffset.x
        y += this.dragOffset.y
      }

      const offset = mxUtils.getDocumentScrollOrigin(document)

      this.dragElement.style.left = (x + offset.x) + 'px'
      this.dragElement.style.top = (y + offset.y) + 'px'
    } else if (this.dragElement != null) {
      mxUtils.setOpacity(this.dragElement, 0)
    }

    mxEvent.consume(evt)
  }
  mxOutput.mxDragSource = mxDragSource
}
