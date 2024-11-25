import { mxCellRenderer, mxUtils } from '@/renderer/common/mxgraph'

export class MyMxCellRenderer extends mxCellRenderer {
  // +++++++++++++ 原型方法start ++++++++++++++
  /**
   * @override
   * Forces repaint if routed points have changed.
   */
  isShapeInvalid (state, shape) {
    return super.isShapeInvalid(state, shape) ||
      (state.routedPoints != null && shape.routedPoints != null &&
        !mxUtils.equalPoints(shape.routedPoints, state.routedPoints))
  }

  /**
   * @override
   * Adds custom stencils defined via shape=stencil(value) style. The value is a base64 encoded, compressed and
   * URL encoded XML definition of the shape according to the stencil definition language of mxGraph.
   *
   * Needs to be in this file to make sure its part of the embed client code. Also, the check for ZLib is
   * different from for the Editor code.
   */
  createShape (state) {
    // if (state.style != null && typeof (pako) !== 'undefined') {
    //   const shape = mxUtils.getValue(state.style, mxConstants.STYLE_SHAPE, null)
    //
    //   // Extracts and decodes stencil XML if shape has the form shape=stencil(value)
    //   if (shape != null && typeof shape === 'string' && shape.substring(0, 8) === 'stencil(') {
    //     try {
    //       const stencil = shape.substring(8, shape.length - 1)
    //       const doc = mxUtils.parseXml(MyMxGraph.decompress(stencil)) // FIXME
    //
    //       return new mxShape(new mxStencil(doc.documentElement))
    //     } catch (e) {
    //       if (window.console != null) {
    //         console.log('Error in shape: ' + e)
    //       }
    //     }
    //   }
    // }

    return super.createShape(state)
  }

  /**
   * @override
   * Handling of special nl2Br style for not converting newlines to breaks in HTML labels.
   * NOTE: Since it's easier to set this when the label is created we assume that it does
   * not change during the lifetime of the mxText instance.
   */
  initializeLabel (state) {
    if (state.text != null) {
      state.text.replaceLinefeeds = mxUtils.getValue(state.style, 'nl2Br', '1') !== '0'
    }

    super.initializeLabel(state)
  }
  // +++++++++++++ 原型方法end ++++++++++++++
}
