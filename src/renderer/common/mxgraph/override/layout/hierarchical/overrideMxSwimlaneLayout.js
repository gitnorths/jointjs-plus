export function overrideMxSwimlaneLayout (mxOutput) {
  const { mxSwimlaneLayout, mxObjectIdentity } = mxOutput

  /**
   * Traverses the (directed) graph invoking the given function for each
   * visited vertex and edge. The function is invoked with the current vertex
   * and the incoming edge as a parameter. This implementation makes sure
   * each vertex is only visited once. The function may return false if the
   * traversal should stop at the given vertex.
   *
   * Parameters:
   *
   * vertex - <mxCell> that represents the vertex where the traversal starts.
   * directed - boolean indicating if edges should only be traversed
   * from source to target. Default is true.
   * edge - Optional <mxCell> that represents the incoming edge. This is
   * null for the first step of the traversal.
   * allVertices - Array of cell paths for the visited cells.
   * swimlaneIndex - the laid out order index of the swimlane vertex is contained in
   */
  mxSwimlaneLayout.prototype.traverse = function (vertex, directed, edge, allVertices, currentComp,
    hierarchyVertices, filledVertexSet, swimlaneIndex) {
    if (vertex != null && allVertices != null) {
      // Has this vertex been seen before in any traversal
      // And if the filled vertex set is populated, only
      // process vertices in that it contains
      const vertexID = mxObjectIdentity.get(vertex)

      if ((allVertices[vertexID] == null) &&
        (filledVertexSet == null ? true : filledVertexSet[vertexID] != null)) {
        if (currentComp[vertexID] == null) {
          currentComp[vertexID] = vertex
        }
        if (allVertices[vertexID] == null) {
          allVertices[vertexID] = vertex
        }

        if (filledVertexSet !== null) {
          delete filledVertexSet[vertexID]
        }

        const edges = this.getEdges(vertex)
        const model = this.graph.model

        for (let i = 0; i < edges.length; i++) {
          let otherVertex = this.getVisibleTerminal(edges[i], true)
          const isSource = otherVertex === vertex

          if (isSource) {
            otherVertex = this.getVisibleTerminal(edges[i], false)
          }

          let otherIndex = 0
          // Get the swimlane index of the other terminal
          while (otherIndex < this.swimlanes.length && !model.isAncestor(this.swimlanes[otherIndex], otherVertex)) {
            otherIndex++
          }

          if (otherIndex >= this.swimlanes.length) {
            continue
          }

          // Traverse if the other vertex is within the same swimlane
          // as the current vertex, or if the swimlane index of the other
          // vertex is greater than that of this vertex
          if ((otherIndex > swimlaneIndex) ||
            ((!directed || isSource) && otherIndex === swimlaneIndex)) {
            currentComp = this.traverse(otherVertex, directed, edges[i], allVertices,
              currentComp, hierarchyVertices,
              filledVertexSet, otherIndex)
          }
        }
      } else {
        if (currentComp[vertexID] == null) {
          // We've seen this vertex before, but not in the current component
          // This component and the one it's in need to be merged
          for (let i = 0; i < hierarchyVertices.length; i++) {
            const comp = hierarchyVertices[i]

            if (comp[vertexID] != null) {
              for (const key in comp) {
                currentComp[key] = comp[key]
              }

              // Remove the current component from the hierarchy set
              hierarchyVertices.splice(i, 1)
              return currentComp
            }
          }
        }
      }
    }

    return currentComp
  }
  mxOutput.mxSwimlaneLayout = mxSwimlaneLayout
}
