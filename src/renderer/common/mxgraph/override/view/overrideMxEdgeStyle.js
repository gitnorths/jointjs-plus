export function overrideMxEdgeStyle (mxOutput) {
  const {
    mxConstants,
    mxEdgeStyle,
    mxPoint,
    mxRectangle,
    mxUtils
  } = mxOutput
  // mxEdgeStyle start

  /**
   * Function: SegmentConnector
   *
   * Implements an orthogonal edge style. Use <mxEdgeSegmentHandler>
   * as an interactive handler for this style.
   *
   * state - <mxCellState> that represents the edge to be updated.
   * sourceScaled - <mxCellState> that represents the source terminal.
   * targetScaled - <mxCellState> that represents the target terminal.
   * controlHints - List of relative control points.
   * result - Array of <mxPoints> that represent the actual points of the
   * edge.
   */
  mxEdgeStyle.SegmentConnector = function (state, sourceScaled, targetScaled, controlHints, result) {
    // Creates array of all way- and terminal points
    const pts = mxEdgeStyle.scalePointArray(state.absolutePoints, state.view.scale)
    const source = mxEdgeStyle.scaleCellState(sourceScaled, state.view.scale)
    const target = mxEdgeStyle.scaleCellState(targetScaled, state.view.scale)
    const tol = 1

    // Adds translated unscaled points for precise collision checks
    const tempPoints = []

    function addPoint (pt) {
      tempPoints.push(pt)
    }

    // Whether the first segment outgoing from the source end is horizontal
    let lastPushed = (result.length > 0) ? result[0] : null
    let horizontal = true
    let hint = null

    // Adds waypoints only if outside of tolerance
    function pushPoint (pt) {
      pt.x = Math.round(pt.x * state.view.scale * 10) / 10
      pt.y = Math.round(pt.y * state.view.scale * 10) / 10

      if (lastPushed == null || Math.abs(lastPushed.x - pt.x) >= tol || Math.abs(lastPushed.y - pt.y) >= Math.max(1, state.view.scale)) {
        result.push(pt)
        lastPushed = pt
      }

      return lastPushed
    }

    // Adds the first point
    let pt = pts[0]

    if (pt == null && source != null) {
      pt = new mxPoint(state.view.getRoutingCenterX(source), state.view.getRoutingCenterY(source))
    } else if (pt != null) {
      pt = pt.clone()
    }

    const lastInx = pts.length - 1

    // Adds the waypoints
    let pe
    if (controlHints != null && controlHints.length > 0) {
      // Converts all hints and removes nulls
      let hints = []

      for (let i = 0; i < controlHints.length; i++) {
        const tmp = state.view.transformControlPoint(state, controlHints[i], true)

        if (tmp != null) {
          hints.push(tmp)
        }
      }

      if (hints.length === 0) {
        return
      }

      // Aligns source and target hint to fixed points
      if (pt != null && hints[0] != null) {
        if (Math.abs(hints[0].x - pt.x) < tol) {
          hints[0].x = pt.x
        }

        if (Math.abs(hints[0].y - pt.y) < tol) {
          hints[0].y = pt.y
        }
      }

      pe = pts[lastInx]

      if (pe != null && hints[hints.length - 1] != null) {
        if (Math.abs(hints[hints.length - 1].x - pe.x) < tol) {
          hints[hints.length - 1].x = pe.x
        }

        if (Math.abs(hints[hints.length - 1].y - pe.y) < tol) {
          hints[hints.length - 1].y = pe.y
        }
      }

      hint = hints[0]

      let currentTerm = source
      let currentPt = pts[0]
      let hozChan = false
      let vertChan = false
      let currentHint = hint

      if (currentPt != null) {
        currentTerm = null
      }

      // Check for alignment with fixed points and with channels
      // at source and target segments only
      for (let i = 0; i < 2; i++) {
        const fixedVertAlign = currentPt != null && currentPt.x === currentHint.x
        const fixedHozAlign = currentPt != null && currentPt.y === currentHint.y

        const inHozChan = currentTerm != null && (currentHint.y >= currentTerm.y && currentHint.y <= currentTerm.y + currentTerm.height)
        const inVertChan = currentTerm != null && (currentHint.x >= currentTerm.x && currentHint.x <= currentTerm.x + currentTerm.width)

        hozChan = fixedHozAlign || (currentPt == null && inHozChan)
        vertChan = fixedVertAlign || (currentPt == null && inVertChan)

        // If the current hint falls in both the hor and vert channels in the case
        // of a floating port, or if the hint is exactly co-incident with a
        // fixed point, ignore the source and try to work out the orientation
        // from the target end
        if (i === 0 && ((hozChan && vertChan) || (fixedVertAlign && fixedHozAlign))) {
          // TODO
        } else {
          if (currentPt != null && (!fixedHozAlign && !fixedVertAlign) && (inHozChan || inVertChan)) {
            horizontal = !inHozChan
            break
          }

          if (vertChan || hozChan) {
            horizontal = hozChan

            if (i === 1) {
              // Work back from target end
              horizontal = hints.length % 2 === 0 ? hozChan : vertChan
            }

            break
          }
        }

        currentTerm = target
        currentPt = pts[lastInx]

        if (currentPt != null) {
          currentTerm = null
        }

        currentHint = hints[hints.length - 1]

        if (fixedVertAlign && fixedHozAlign) {
          hints = hints.slice(1)
        }
      }

      if (horizontal && ((pts[0] != null && pts[0].y !== hint.y) || (pts[0] == null && source != null && (hint.y < source.y || hint.y > source.y + source.height)))) {
        addPoint(new mxPoint(pt.x, hint.y))
      } else if (!horizontal && ((pts[0] != null && pts[0].x !== hint.x) || (pts[0] == null && source != null && (hint.x < source.x || hint.x > source.x + source.width)))) {
        addPoint(new mxPoint(hint.x, pt.y))
      }

      if (horizontal) {
        pt.y = hint.y
      } else {
        pt.x = hint.x
      }

      for (let i = 0; i < hints.length; i++) {
        horizontal = !horizontal
        hint = hints[i]

        // mxLog.show();
        // mxLog.debug('hint', i, hint.x, hint.y);

        if (horizontal) {
          pt.y = hint.y
        } else {
          pt.x = hint.x
        }

        addPoint(pt.clone())
      }
    } else {
      hint = pt
      // FIXME: First click in connect preview toggles orientation
      horizontal = true
    }

    // Adds the last point
    pt = pts[lastInx]

    if (pt == null && target != null) {
      pt = new mxPoint(state.view.getRoutingCenterX(target), state.view.getRoutingCenterY(target))
    }

    if (pt != null) {
      if (hint != null) {
        if (horizontal && ((pts[lastInx] != null && pts[lastInx].y !== hint.y) || (pts[lastInx] == null && target != null && (hint.y < target.y || hint.y > target.y + target.height)))) {
          addPoint(new mxPoint(pt.x, hint.y))
        } else if (!horizontal && ((pts[lastInx] != null && pts[lastInx].x !== hint.x) || (pts[lastInx] == null && target != null && (hint.x < target.x || hint.x > target.x + target.width)))) {
          addPoint(new mxPoint(hint.x, pt.y))
        }
      }
    }

    // Removes bends inside the source terminal
    if (pts[0] == null && source != null) {
      while (tempPoints.length > 0 && tempPoints[0] != null && mxUtils.contains(source, tempPoints[0].x, tempPoints[0].y)) {
        tempPoints.splice(0, 1)
      }
    }

    // Removes bends inside the target terminal
    if (pts[lastInx] == null && target != null) {
      while (tempPoints.length > 0 && tempPoints[tempPoints.length - 1] != null && mxUtils.contains(target, tempPoints[tempPoints.length - 1].x, tempPoints[tempPoints.length - 1].y)) {
        tempPoints.splice(tempPoints.length - 1, 1)
      }
    }

    // Scales and smoothens edges
    for (let i = 0; i < tempPoints.length; i++) {
      pushPoint(tempPoints[i])
    }

    // Removes last point if inside tolerance with end point
    if (pe != null && result[result.length - 1] != null && Math.abs(pe.x - result[result.length - 1].x) <= tol && Math.abs(pe.y - result[result.length - 1].y) <= tol) {
      result.splice(result.length - 1, 1)

      // Lines up second last point in result with end point
      if (result[result.length - 1] != null) {
        if (Math.abs(result[result.length - 1].x - pe.x) < tol) {
          result[result.length - 1].x = pe.x
        }

        if (Math.abs(result[result.length - 1].y - pe.y) < tol) {
          result[result.length - 1].y = pe.y
        }
      }
    }
  }
  /**
   * Function: OrthConnector
   *
   * Implements a local orthogonal router between the given
   * cells.
   *
   * Parameters:
   *
   * state - <mxCellState> that represents the edge to be updated.
   * sourceScaled - <mxCellState> that represents the source terminal.
   * targetScaled - <mxCellState> that represents the target terminal.
   * controlHints - List of relative control points.
   * result - Array of <mxPoints> that represent the actual points of the
   * edge.
   *
   */
  mxEdgeStyle.OrthConnector = function (state, sourceScaled, targetScaled, controlHints, result) {
    const graph = state.view.graph
    const source = mxEdgeStyle.scaleCellState(sourceScaled, state.view.scale)
    const target = mxEdgeStyle.scaleCellState(targetScaled, state.view.scale)

    const sourceEdge = source == null ? false : graph.getModel().isEdge(source.cell)
    const targetEdge = target == null ? false : graph.getModel().isEdge(target.cell)

    const pts = mxEdgeStyle.scalePointArray(state.absolutePoints, state.view.scale)

    const p0 = pts[0]
    const pe = pts[pts.length - 1]

    let sourceX = source != null ? source.x : p0.x
    let sourceY = source != null ? source.y : p0.y
    let sourceWidth = source != null ? source.width : 1
    let sourceHeight = source != null ? source.height : 1

    let targetX = target != null ? target.x : pe.x
    let targetY = target != null ? target.y : pe.y
    let targetWidth = target != null ? target.width : 1
    let targetHeight = target != null ? target.height : 1

    let sourceBuffer = mxEdgeStyle.getJettySize(state, true)
    let targetBuffer = mxEdgeStyle.getJettySize(state, false)

    // console.log('sourceBuffer', sourceBuffer);
    // console.log('targetBuffer', targetBuffer);
    // Workaround for loop routing within buffer zone
    if (source != null && target === source) {
      targetBuffer = Math.max(sourceBuffer, targetBuffer)
      sourceBuffer = targetBuffer
    }

    const totalBuffer = targetBuffer + sourceBuffer
    // console.log('totalBuffer', totalBuffer);
    let tooShort = false

    // Checks minimum distance for fixed points and falls back to segment connector
    if (p0 != null && pe != null) {
      const dx = pe.x - p0.x
      const dy = pe.y - p0.y

      tooShort = dx * dx + dy * dy < totalBuffer * totalBuffer
    }

    if (tooShort || (mxEdgeStyle.orthPointsFallback && (controlHints != null && controlHints.length > 0)) || sourceEdge || targetEdge) {
      mxEdgeStyle.SegmentConnector(state, sourceScaled, targetScaled, controlHints, result)

      return
    }

    // Determine the side(s) of the source and target vertices
    // that the edge may connect to
    // portConstraint [source, target]
    const portConstraint = [mxConstants.DIRECTION_MASK_ALL, mxConstants.DIRECTION_MASK_ALL]
    let rotation = 0

    if (source != null) {
      portConstraint[0] = mxUtils.getPortConstraints(source, state, true, mxConstants.DIRECTION_MASK_ALL)
      rotation = mxUtils.getValue(source.style, mxConstants.STYLE_ROTATION, 0)

      // console.log('source rotation', rotation);

      if (rotation !== 0) {
        const newRect = mxUtils.getBoundingBox(new mxRectangle(sourceX, sourceY, sourceWidth, sourceHeight), rotation)
        sourceX = newRect.x
        sourceY = newRect.y
        sourceWidth = newRect.width
        sourceHeight = newRect.height
      }
    }

    if (target != null) {
      portConstraint[1] = mxUtils.getPortConstraints(target, state, false, mxConstants.DIRECTION_MASK_ALL)
      rotation = mxUtils.getValue(target.style, mxConstants.STYLE_ROTATION, 0)

      // console.log('target rotation', rotation);

      if (rotation !== 0) {
        const newRect = mxUtils.getBoundingBox(new mxRectangle(targetX, targetY, targetWidth, targetHeight), rotation)
        targetX = newRect.x
        targetY = newRect.y
        targetWidth = newRect.width
        targetHeight = newRect.height
      }
    }

    // console.log('source' , sourceX, sourceY, sourceWidth, sourceHeight);
    // console.log('targetX' , targetX, targetY, targetWidth, targetHeight);

    if (sourceWidth === 0 || sourceHeight === 0 || targetWidth === 0 || targetHeight === 0) {
      return
    }

    const dir = [0, 0]

    // Work out which faces of the vertices present against each other
    // in a way that would allow a 3-segment connection if port constraints
    // permitted.
    // geo -> [source, target] [x, y, width, height]
    const geo = [[sourceX, sourceY, sourceWidth, sourceHeight], [targetX, targetY, targetWidth, targetHeight]]
    const buffer = [sourceBuffer, targetBuffer]

    for (let i = 0; i < 2; i++) {
      mxEdgeStyle.limits[i][1] = geo[i][0] - buffer[i]
      mxEdgeStyle.limits[i][2] = geo[i][1] - buffer[i]
      mxEdgeStyle.limits[i][4] = geo[i][0] + geo[i][2] + buffer[i]
      mxEdgeStyle.limits[i][8] = geo[i][1] + geo[i][3] + buffer[i]
    }

    // Work out which quad the target is in
    const sourceCenX = geo[0][0] + geo[0][2] / 2.0
    const sourceCenY = geo[0][1] + geo[0][3] / 2.0
    const targetCenX = geo[1][0] + geo[1][2] / 2.0
    const targetCenY = geo[1][1] + geo[1][3] / 2.0

    const dx = sourceCenX - targetCenX
    const dy = sourceCenY - targetCenY

    let quad = 0

    // 0 | 1
    // -----
    // 3 | 2

    if (dx < 0) {
      if (dy < 0) {
        quad = 2
      } else {
        quad = 1
      }
    } else {
      if (dy <= 0) {
        quad = 3

        // Special case on x = 0 and negative y
        if (dx === 0) {
          quad = 2
        }
      }
    }

    // console.log('quad', quad);

    // Check for connection constraints
    let currentTerm = null

    if (source != null) {
      currentTerm = p0
    }

    const constraint = [[0.5, 0.5], [0.5, 0.5]]

    for (let i = 0; i < 2; i++) {
      if (currentTerm != null) {
        constraint[i][0] = (currentTerm.x - geo[i][0]) / geo[i][2]

        if (Math.abs(currentTerm.x - geo[i][0]) <= 1) {
          dir[i] = mxConstants.DIRECTION_MASK_WEST
        } else if (Math.abs(currentTerm.x - geo[i][0] - geo[i][2]) <= 1) {
          dir[i] = mxConstants.DIRECTION_MASK_EAST
        }

        constraint[i][1] = (currentTerm.y - geo[i][1]) / geo[i][3]

        if (Math.abs(currentTerm.y - geo[i][1]) <= 1) {
          dir[i] = mxConstants.DIRECTION_MASK_NORTH
        } else if (Math.abs(currentTerm.y - geo[i][1] - geo[i][3]) <= 1) {
          dir[i] = mxConstants.DIRECTION_MASK_SOUTH
        }
      }

      currentTerm = null

      if (target != null) {
        currentTerm = pe
      }
    }

    const sourceTopDist = geo[0][1] - (geo[1][1] + geo[1][3])
    const sourceLeftDist = geo[0][0] - (geo[1][0] + geo[1][2])
    const sourceBottomDist = geo[1][1] - (geo[0][1] + geo[0][3])
    const sourceRightDist = geo[1][0] - (geo[0][0] + geo[0][2])

    mxEdgeStyle.vertexSeperations[1] = Math.max(sourceLeftDist - totalBuffer, 0)
    mxEdgeStyle.vertexSeperations[2] = Math.max(sourceTopDist - totalBuffer, 0)
    mxEdgeStyle.vertexSeperations[4] = Math.max(sourceBottomDist - totalBuffer, 0)
    mxEdgeStyle.vertexSeperations[3] = Math.max(sourceRightDist - totalBuffer, 0)

    //= =============================================================
    // Start of source and target direction determination

    // Work through the preferred orientations by relative positioning
    // of the vertices and list them in preferred and available order

    const dirPref = []
    const horPref = []
    const vertPref = []

    horPref[0] = (sourceLeftDist >= sourceRightDist) ? mxConstants.DIRECTION_MASK_WEST : mxConstants.DIRECTION_MASK_EAST
    vertPref[0] = (sourceTopDist >= sourceBottomDist) ? mxConstants.DIRECTION_MASK_NORTH : mxConstants.DIRECTION_MASK_SOUTH

    horPref[1] = mxUtils.reversePortConstraints(horPref[0])
    vertPref[1] = mxUtils.reversePortConstraints(vertPref[0])

    const preferredHorizDist = sourceLeftDist >= sourceRightDist ? sourceLeftDist : sourceRightDist
    const preferredVertDist = sourceTopDist >= sourceBottomDist ? sourceTopDist : sourceBottomDist

    const prefOrdering = [[0, 0], [0, 0]]
    let preferredOrderSet = false

    // If the preferred port isn't available, switch it
    for (let i = 0; i < 2; i++) {
      if (dir[i] !== 0x0) {
        continue
      }

      if ((horPref[i] & portConstraint[i]) === 0) {
        horPref[i] = mxUtils.reversePortConstraints(horPref[i])
      }

      if ((vertPref[i] & portConstraint[i]) === 0) {
        vertPref[i] = mxUtils
          .reversePortConstraints(vertPref[i])
      }

      prefOrdering[i][0] = vertPref[i]
      prefOrdering[i][1] = horPref[i]
    }

    if (preferredVertDist > 0 && preferredHorizDist > 0) {
      // Possibility of two segment edge connection
      if (((horPref[0] & portConstraint[0]) > 0) && ((vertPref[1] & portConstraint[1]) > 0)) {
        prefOrdering[0][0] = horPref[0]
        prefOrdering[0][1] = vertPref[0]
        prefOrdering[1][0] = vertPref[1]
        prefOrdering[1][1] = horPref[1]
        preferredOrderSet = true
      } else if (((vertPref[0] & portConstraint[0]) > 0) && ((horPref[1] & portConstraint[1]) > 0)) {
        prefOrdering[0][0] = vertPref[0]
        prefOrdering[0][1] = horPref[0]
        prefOrdering[1][0] = horPref[1]
        prefOrdering[1][1] = vertPref[1]
        preferredOrderSet = true
      }
    }

    if (preferredVertDist > 0 && !preferredOrderSet) {
      prefOrdering[0][0] = vertPref[0]
      prefOrdering[0][1] = horPref[0]
      prefOrdering[1][0] = vertPref[1]
      prefOrdering[1][1] = horPref[1]
      preferredOrderSet = true
    }

    if (preferredHorizDist > 0 && !preferredOrderSet) {
      prefOrdering[0][0] = horPref[0]
      prefOrdering[0][1] = vertPref[0]
      prefOrdering[1][0] = horPref[1]
      prefOrdering[1][1] = vertPref[1]
      preferredOrderSet = true
    }

    // The source and target prefs are now an ordered list of
    // the preferred port selections
    // If the list contains gaps, compact it

    for (let i = 0; i < 2; i++) {
      if (dir[i] !== 0x0) {
        continue
      }

      if ((prefOrdering[i][0] & portConstraint[i]) === 0) {
        prefOrdering[i][0] = prefOrdering[i][1]
      }

      dirPref[i] = prefOrdering[i][0] & portConstraint[i]
      dirPref[i] |= (prefOrdering[i][1] & portConstraint[i]) << 8
      dirPref[i] |= (prefOrdering[1 - i][i] & portConstraint[i]) << 16
      dirPref[i] |= (prefOrdering[1 - i][1 - i] & portConstraint[i]) << 24

      if ((dirPref[i] & 0xF) === 0) {
        dirPref[i] = dirPref[i] << 8
      }

      if ((dirPref[i] & 0xF00) === 0) {
        dirPref[i] = (dirPref[i] & 0xF) | dirPref[i] >> 8
      }

      if ((dirPref[i] & 0xF0000) === 0) {
        dirPref[i] = (dirPref[i] & 0xFFFF) | ((dirPref[i] & 0xF000000) >> 8)
      }

      dir[i] = dirPref[i] & 0xF

      if (portConstraint[i] === mxConstants.DIRECTION_MASK_WEST || portConstraint[i] === mxConstants.DIRECTION_MASK_NORTH || portConstraint[i] === mxConstants.DIRECTION_MASK_EAST || portConstraint[i] === mxConstants.DIRECTION_MASK_SOUTH) {
        dir[i] = portConstraint[i]
      }
    }

    //= =============================================================
    // End of source and target direction determination

    let sourceIndex = dir[0] === mxConstants.DIRECTION_MASK_EAST ? 3 : dir[0]
    let targetIndex = dir[1] === mxConstants.DIRECTION_MASK_EAST ? 3 : dir[1]

    sourceIndex -= quad
    targetIndex -= quad

    if (sourceIndex < 1) {
      sourceIndex += 4
    }

    if (targetIndex < 1) {
      targetIndex += 4
    }

    const routePattern = mxEdgeStyle.routePatterns[sourceIndex - 1][targetIndex - 1]

    // console.log('routePattern', routePattern);

    mxEdgeStyle.wayPoints1[0][0] = geo[0][0]
    mxEdgeStyle.wayPoints1[0][1] = geo[0][1]

    switch (dir[0]) {
      case mxConstants.DIRECTION_MASK_WEST:
        mxEdgeStyle.wayPoints1[0][0] -= sourceBuffer
        mxEdgeStyle.wayPoints1[0][1] += constraint[0][1] * geo[0][3]
        break
      case mxConstants.DIRECTION_MASK_SOUTH:
        mxEdgeStyle.wayPoints1[0][0] += constraint[0][0] * geo[0][2]
        mxEdgeStyle.wayPoints1[0][1] += geo[0][3] + sourceBuffer
        break
      case mxConstants.DIRECTION_MASK_EAST:
        mxEdgeStyle.wayPoints1[0][0] += geo[0][2] + sourceBuffer
        mxEdgeStyle.wayPoints1[0][1] += constraint[0][1] * geo[0][3]
        break
      case mxConstants.DIRECTION_MASK_NORTH:
        mxEdgeStyle.wayPoints1[0][0] += constraint[0][0] * geo[0][2]
        mxEdgeStyle.wayPoints1[0][1] -= sourceBuffer
        break
    }

    let currentIndex = 0

    // Orientation, 0 horizontal, 1 vertical
    let lastOrientation = (dir[0] & (mxConstants.DIRECTION_MASK_EAST | mxConstants.DIRECTION_MASK_WEST)) > 0 ? 0 : 1
    const initialOrientation = lastOrientation
    let currentOrientation = 0

    for (let i = 0; i < routePattern.length; i++) {
      const nextDirection = routePattern[i] & 0xF

      // Rotate the index of this direction by the quad
      // to get the real direction
      let directionIndex = nextDirection === mxConstants.DIRECTION_MASK_EAST ? 3 : nextDirection

      directionIndex += quad

      if (directionIndex > 4) {
        directionIndex -= 4
      }

      const direction = mxEdgeStyle.dirVectors[directionIndex - 1]

      currentOrientation = (directionIndex % 2 > 0) ? 0 : 1
      // Only update the current index if the point moved
      // in the direction of the current segment move,
      // otherwise the same point is moved until there is
      // a segment direction change
      if (currentOrientation !== lastOrientation) {
        currentIndex++
        // Copy the previous way point into the new one
        // We can't base the new position on index - 1
        // because sometime elbows turn out not to exist,
        // then we'd have to rewind.
        mxEdgeStyle.wayPoints1[currentIndex][0] = mxEdgeStyle.wayPoints1[currentIndex - 1][0]
        mxEdgeStyle.wayPoints1[currentIndex][1] = mxEdgeStyle.wayPoints1[currentIndex - 1][1]
      }

      const tar = (routePattern[i] & mxEdgeStyle.TARGET_MASK) > 0
      const sou = (routePattern[i] & mxEdgeStyle.SOURCE_MASK) > 0
      let side = (routePattern[i] & mxEdgeStyle.SIDE_MASK) >> 5
      side = side << quad

      if (side > 0xF) {
        side = side >> 4
      }

      const center = (routePattern[i] & mxEdgeStyle.CENTER_MASK) > 0

      if ((sou || tar) && side < 9) {
        let limit = 0
        const souTar = sou ? 0 : 1

        if (center && currentOrientation === 0) {
          limit = geo[souTar][0] + constraint[souTar][0] * geo[souTar][2]
        } else if (center) {
          limit = geo[souTar][1] + constraint[souTar][1] * geo[souTar][3]
        } else {
          limit = mxEdgeStyle.limits[souTar][side]
        }

        if (currentOrientation === 0) {
          const lastX = mxEdgeStyle.wayPoints1[currentIndex][0]
          const deltaX = (limit - lastX) * direction[0]

          if (deltaX > 0) {
            mxEdgeStyle.wayPoints1[currentIndex][0] += direction[0] * deltaX
          }
        } else {
          const lastY = mxEdgeStyle.wayPoints1[currentIndex][1]
          const deltaY = (limit - lastY) * direction[1]

          if (deltaY > 0) {
            mxEdgeStyle.wayPoints1[currentIndex][1] += direction[1] * deltaY
          }
        }
      } else if (center) {
        // Which center we're travelling to depend on the current direction
        mxEdgeStyle.wayPoints1[currentIndex][0] += direction[0] * Math.abs(mxEdgeStyle.vertexSeperations[directionIndex] / 2)
        mxEdgeStyle.wayPoints1[currentIndex][1] += direction[1] * Math.abs(mxEdgeStyle.vertexSeperations[directionIndex] / 2)
      }

      if (currentIndex > 0 && mxEdgeStyle.wayPoints1[currentIndex][currentOrientation] === mxEdgeStyle.wayPoints1[currentIndex - 1][currentOrientation]) {
        currentIndex--
      } else {
        lastOrientation = currentOrientation
      }
    }

    for (let i = 0; i <= currentIndex; i++) {
      if (i === currentIndex) {
        // Last point can cause last segment to be in
        // same direction as jetty/approach. If so,
        // check the number of points is consistent
        // with the relative orientation of source and target
        // jx. Same orientation requires an even
        // number of turns (points), different requires
        // odd.
        const targetOrientation = (dir[1] & (mxConstants.DIRECTION_MASK_EAST | mxConstants.DIRECTION_MASK_WEST)) > 0 ? 0 : 1
        const sameOrient = targetOrientation === initialOrientation ? 0 : 1

        // (currentIndex + 1) % 2 is 0 for even number of points,
        // 1 for odd
        if (sameOrient !== (currentIndex + 1) % 2) {
          // The last point isn't required
          break
        }
      }

      result.push(new mxPoint(Math.round(mxEdgeStyle.wayPoints1[i][0] * state.view.scale * 10) / 10, Math.round(mxEdgeStyle.wayPoints1[i][1] * state.view.scale * 10) / 10))
    }

    // console.log(result);

    // Removes duplicates
    let index = 1

    while (index < result.length) {
      if (result[index - 1] == null || result[index] == null || result[index - 1].x !== result[index].x || result[index - 1].y !== result[index].y) {
        index++
      } else {
        result.splice(index, 1)
      }
    }
  }
  // mxEdgeStyle end
  mxOutput.mxEdgeStyle = mxEdgeStyle
}
