const mxHierarchicalEdgeStyle = {
  ORTHOGONAL: 1,
  POLYLINE: 2,
  STRAIGHT: 3,
  CURVE: 4
}

export function overrideMxCoordinateAssignment (mxOutput) {
  const { mxCoordinateAssignment, mxConstants, mxPoint } = mxOutput
  /**
   * Function: setEdgePosition
   *
   * Fixes the control points
   */
  mxCoordinateAssignment.prototype.setEdgePosition = function (cell) {
    // For parallel edges we need to seperate out the points a
    // little
    let offsetX = 0
    // Only set the edge control points once

    if (cell.temp[0] !== 101207) {
      let maxRank = cell.maxRank
      let minRank = cell.minRank

      if (maxRank === minRank) {
        maxRank = cell.source.maxRank
        minRank = cell.target.minRank
      }

      let parallelEdgeCount = 0
      const jettys = this.jettyPositions[cell.ids[0]]

      const source = cell.isReversed ? cell.target.cell : cell.source.cell
      const graph = this.layout.graph
      const layoutReversed = this.orientation === mxConstants.DIRECTION_EAST ||
        this.orientation === mxConstants.DIRECTION_SOUTH

      for (let i = 0; i < cell.edges.length; i++) {
        const realEdge = cell.edges[i]
        const realSource = this.layout.getVisibleTerminal(realEdge, true)

        // List oldPoints = graph.getPoints(realEdge);
        const newPoints = []

        // Single length reversed edges end up with the jettys in the wrong
        // places. Since single length edges only have jettys, not segment
        // control points, we just say the edge isn't reversed in this section
        let reversed = cell.isReversed

        if (realSource !== source) {
          // The real edges include all core model edges and these can go
          // in both directions. If the source of the hierarchical model edge
          // isn't the source of the specific real edge in this iteration
          // treat if as reversed
          reversed = !reversed
        }

        // First jetty of edge
        if (jettys != null) {
          const arrayOffset = reversed ? 2 : 0
          let y = reversed
            ? (layoutReversed ? this.rankBottomY[minRank] : this.rankTopY[minRank])
            : (layoutReversed ? this.rankTopY[maxRank] : this.rankBottomY[maxRank])
          let jetty = jettys[parallelEdgeCount * 4 + 1 + arrayOffset]

          if (reversed !== layoutReversed) {
            jetty = -jetty
          }

          y += jetty
          let x = jettys[parallelEdgeCount * 4 + arrayOffset]

          const modelSource = graph.model.getTerminal(realEdge, true)

          if (this.layout.isPort(modelSource) && graph.model.getParent(modelSource) === realSource) {
            const state = graph.view.getState(modelSource)

            if (state != null) {
              x = state.x
            } else {
              x = realSource.geometry.x + cell.source.width * modelSource.geometry.x
            }
          }

          if (this.orientation === mxConstants.DIRECTION_NORTH ||
            this.orientation === mxConstants.DIRECTION_SOUTH) {
            newPoints.push(new mxPoint(x, y))

            if (this.layout.edgeStyle === mxHierarchicalEdgeStyle.CURVE) {
              newPoints.push(new mxPoint(x, y + jetty))
            }
          } else {
            newPoints.push(new mxPoint(y, x))

            if (this.layout.edgeStyle === mxHierarchicalEdgeStyle.CURVE) {
              newPoints.push(new mxPoint(y + jetty, x))
            }
          }
        }

        // Declare variables to define loop through edge points and
        // change direction if edge is reversed

        let loopStart = cell.x.length - 1
        let loopLimit = -1
        let loopDelta = -1
        let currentRank = cell.maxRank - 1

        if (reversed) {
          loopStart = 0
          loopLimit = cell.x.length
          loopDelta = 1
          currentRank = cell.minRank + 1
        }
        // Reversed edges need the points inserted in
        // reverse order
        for (let j = loopStart; (cell.maxRank !== cell.minRank) && j !== loopLimit; j += loopDelta) {
          // The horizontal position in a vertical layout
          const positionX = cell.x[j] + offsetX

          // Work out the vertical positions in a vertical layout
          // in the edge buffer channels above and below this rank
          let topChannelY = (this.rankTopY[currentRank] + this.rankBottomY[currentRank + 1]) / 2.0
          let bottomChannelY = (this.rankTopY[currentRank - 1] + this.rankBottomY[currentRank]) / 2.0

          if (reversed) {
            const tmp = topChannelY
            topChannelY = bottomChannelY
            bottomChannelY = tmp
          }

          if (this.orientation === mxConstants.DIRECTION_NORTH ||
            this.orientation === mxConstants.DIRECTION_SOUTH) {
            newPoints.push(new mxPoint(positionX, topChannelY))
            newPoints.push(new mxPoint(positionX, bottomChannelY))
          } else {
            newPoints.push(new mxPoint(topChannelY, positionX))
            newPoints.push(new mxPoint(bottomChannelY, positionX))
          }

          this.limitX = Math.max(this.limitX, positionX)
          currentRank += loopDelta
        }

        // Second jetty of edge
        if (jettys != null) {
          const arrayOffset = reversed ? 2 : 0
          const rankY = reversed
            ? (layoutReversed ? this.rankTopY[maxRank] : this.rankBottomY[maxRank])
            : (layoutReversed ? this.rankBottomY[minRank] : this.rankTopY[minRank])
          let jetty = jettys[parallelEdgeCount * 4 + 3 - arrayOffset]

          if (reversed !== layoutReversed) {
            jetty = -jetty
          }
          const y = rankY - jetty
          let x = jettys[parallelEdgeCount * 4 + 2 - arrayOffset]

          const modelTarget = graph.model.getTerminal(realEdge, false)
          const realTarget = this.layout.getVisibleTerminal(realEdge, false)

          if (this.layout.isPort(modelTarget) && graph.model.getParent(modelTarget) === realTarget) {
            const state = graph.view.getState(modelTarget)

            if (state != null) {
              x = state.x
            } else {
              x = realTarget.geometry.x + cell.target.width * modelTarget.geometry.x
            }
          }

          if (this.orientation === mxConstants.DIRECTION_NORTH ||
            this.orientation === mxConstants.DIRECTION_SOUTH) {
            if (this.layout.edgeStyle === mxHierarchicalEdgeStyle.CURVE) {
              newPoints.push(new mxPoint(x, y - jetty))
            }

            newPoints.push(new mxPoint(x, y))
          } else {
            if (this.layout.edgeStyle === mxHierarchicalEdgeStyle.CURVE) {
              newPoints.push(new mxPoint(y - jetty, x))
            }

            newPoints.push(new mxPoint(y, x))
          }
        }

        if (cell.isReversed) {
          this.processReversedEdge(cell, realEdge)
        }

        this.layout.setEdgePoints(realEdge, newPoints)

        // Resets edge label position
        if (this.layout.resetEdgeLabels &&
          realEdge.geometry != null) {
          const geometry = realEdge.geometry.clone()
          geometry.relative = true
          geometry.x = 0
          geometry.y = 0

          graph.model.setGeometry(realEdge, geometry)
        }

        // Increase offset so next edge is drawn next to
        // this one
        if (offsetX === 0.0) {
          offsetX = this.parallelEdgeSpacing
        } else if (offsetX > 0) {
          offsetX = -offsetX
        } else {
          offsetX = -offsetX + this.parallelEdgeSpacing
        }

        parallelEdgeCount++
      }

      cell.temp[0] = 101207
    }
  }
  mxOutput.mxCoordinateAssignment = mxCoordinateAssignment
}
