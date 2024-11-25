import { mxCellMarker, mxCellState, mxConnectionHandler, mxEvent, mxUtils } from '@/renderer/common/mxgraph'

export class MyMxConnectionHandler extends mxConnectionHandler {
  constructor (graph, factoryMethod) {
    super(graph, factoryMethod)
    // Overrides edge preview to use current edge shape and default style
    this.livePreview = true
    this.cursor = 'corsshair'
    this.waypointsEnabled = true
    // Enables connections along the outline, virtual waypoints, parent highlight etc
    this.outlineConnect = true
    this.moveIconFront = true
  }

  // +++++++++++++ 原型方法start ++++++++++++++
  /**
   * @override
   * Overrides to ignore hotspot only for target terminal
   * */
  createMarker () {
    const marker = super.createMarker()

    marker.intersects = mxUtils.bind(this, function (state, evt) {
      if (this.isConnecting()) {
        return true
      }

      return mxCellMarker.prototype.intersects.call(marker, state, evt)
    })

    const markerGetCell = marker.getCell
    marker.getCell = mxUtils.bind(this, function (me) {
      const result = markerGetCell(me)

      this.error = null

      return result
    })

    return marker
  }

  // Extends connection handler to enable ctrl+drag for cloning source cell
  // since copyOnConnect is now disabled by default
  isCreateTarget (evt) {
    return this.graph.isCloneEvent(evt) !== super.isCreateTarget(evt)
  }

  // Uses current edge style for connect preview
  // FIXME
  createEdgeState (me) {
    // const style = this.graph.createCurrentEdgeStyle()
    // const edge = this.graph.createEdge(null, null, null, null, null, style)
    // const state = new mxCellState(this.graph.view, edge, this.graph.getCellStyle(edge))
    //
    // for (const key in this.graph.currentEdgeStyle) {
    //   state.style[key] = this.graph.currentEdgeStyle[key]
    // }
    //
    // // Applies newEdgeStyle for preview
    // if (this.previous != null) {
    //   const temp = this.previous.style.newEdgeStyle
    //
    //   if (temp != null) {
    //     try {
    //       const styles = JSON.parse(temp)
    //
    //       for (const key in styles) {
    //         state.style[key] = styles[key]
    //       }
    //     } catch (e) {
    //       // ignore
    //     }
    //   }
    // }
    //
    // state.style = this.graph.postProcessCellStyle(state.cell, state.style)
    //
    // return state

    const edge = this.graph.createEdge(null, null, null, null, null)
    return new mxCellState(this.graph.view, edge, this.graph.getCellStyle(edge))
  }

  // Overrides dashed state with current edge style
  createShape () {
    const shape = super.createShape()

    // fixme
    // shape.isDashed = this.graph.currentEdgeStyle[mxConstants.STYLE_DASHED] === '1'

    return shape
  }

  updatePreview (valid) {
    // do not change color of preview
  }

  /**
   * Disables starting new connections if control is pressed.
   */
  isStartEvent (me) {
    return super.isStartEvent(me) &&
      !mxEvent.isControlDown(me.getEvent()) &&
      !mxEvent.isShiftDown(me.getEvent())
  }

  // Disables connection points
  init () {
    super.init()

    this.constraintHandler.isEnabled = mxUtils.bind(this, function () {
      return this.graph.connectionHandler.isEnabled()
    })
  }

  // +++++++++++++ 原型方法end ++++++++++++++
  isConnectableCell () {
    return false
  }
}
