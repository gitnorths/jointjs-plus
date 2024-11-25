export function overrideMxParallelEdgeLayout (mxOutput) {
  const { mxParallelEdgeLayout, mxPoint } = mxOutput
  /**
   * Function: layout
   *
   * Lays out the parallel edges in the given array.
   */
  mxParallelEdgeLayout.prototype.layout = function (parallels) {
    const edge = parallels[0]

    const state = this.graph.view.getState(edge)

    if (state != null && state.absolutePoints != null) {
      const p0 = state.absolutePoints[0]
      const pe = state.absolutePoints[state.absolutePoints.length - 1]

      if (p0 != null && pe != null) {
        const view = this.graph.getView()
        const model = this.graph.getModel()
        const src = model.getGeometry(view.getVisibleTerminal(edge, true))
        const trg = model.getGeometry(view.getVisibleTerminal(edge, false))

        // Routes multiple loops
        if (src === trg) {
          let x0 = src.x + src.width + this.spacing
          const y0 = src.y + src.height / 2

          for (let i = 0; i < parallels.length; i++) {
            this.route(parallels[i], x0, y0)
            x0 += this.spacing
          }
        } else if (src != null && trg != null) {
          const s = this.graph.view.scale
          const tr = this.graph.view.translate

          // Uses model coordinates for routing
          p0.x = p0.x / s - tr.x
          p0.y = p0.y / s - tr.y
          pe.x = pe.x / s - tr.x
          pe.y = pe.y / s - tr.y

          // Routes parallel edges
          const dx = pe.x - p0.x
          const dy = pe.y - p0.y

          const len = Math.sqrt(dx * dx + dy * dy)

          if (len > 0) {
            let x0 = p0.x + dx / 2
            let y0 = p0.y + dy / 2

            const nx = dy * this.spacing / len
            const ny = dx * this.spacing / len

            x0 += nx * (parallels.length - 1) / 2
            y0 -= ny * (parallels.length - 1) / 2

            for (let i = 0; i < parallels.length; i++) {
              this.route(parallels[i], x0, y0)
              x0 -= nx
              y0 += ny
            }
          }
        }
      }
    }
  }

  /**
   * Function: route
   *
   * Routes the given edge via the given point.
   */
  mxParallelEdgeLayout.prototype.route = function (edge, x, y) {
    if (this.graph.isCellMovable(edge)) {
      this.setEdgePoints(edge, [new mxPoint(Math.round(x), Math.round(y))])
    }
  }
  mxOutput.mxParallelEdgeLayout = mxParallelEdgeLayout
}
