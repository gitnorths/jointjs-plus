export function overrideMxCodec (mxOutput) {
  const { mxCodec, mxConstants, mxLog, mxUtils, mxCell, mxCellPath, mxCodecRegistry } = mxOutput
  /**
   * Variable: allowlist
   *
   * Array of strings that specifies the types to be decoded. Null means all
   * types are allowed. Default is null.
   */
  mxCodec.allowlist = null

  /**
   * Function: isObjectIgnored
   *
   * Returns true if the given object is ignored by the codec. This
   * implementation returns false if the given object is not null.
   */
  mxCodec.prototype.isObjectIgnored = function (obj) {
    return obj == null
  }

  /**
   * Function: getId
   *
   * Returns the ID of the specified object. This implementation
   * calls <reference> first and if that returns null handles
   * the object as an <mxCell> by returning their IDs using
   * <mxCell.getId>. If no ID exists for the given cell, then
   * an on-the-fly ID is generated using <mxCellPath.create>.
   *
   * Parameters:
   *
   * obj - Object to return the ID for.
   */
  mxCodec.prototype.getId = function (obj) {
    let id = null

    if (obj != null && !this.isObjectIgnored(obj)) {
      id = this.reference(obj)

      if (id == null && obj instanceof mxCell) {
        id = obj.getId()

        if (id == null) {
          // Uses an on-the-fly Id
          id = mxCellPath.create(obj)

          if (id.length === 0) {
            id = 'root'
          }
        }
      }
    }

    return id
  }

  /**
   * Function: encode
   *
   * Encodes the specified object and returns the resulting
   * XML node.
   *
   * Parameters:
   *
   * obj - Object to be encoded.
   */
  mxCodec.prototype.encode = function (obj) {
    let node = null

    if (obj != null && obj.constructor != null && !this.isObjectIgnored(obj)) {
      const enc = mxCodecRegistry.getCodec(obj.constructor)

      if (enc != null) {
        node = enc.encode(this, obj)
      } else {
        if (mxUtils.isNode(obj)) {
          node = mxUtils.importNode(this.document, obj, true)
        } else {
          mxLog.warn('mxCodec.encode: No codec for ' + mxUtils.getFunctionName(obj.constructor))
        }
      }
    }

    return node
  }

  /**
   * Function: decode
   *
   * Decodes the given XML node. The optional "into"
   * argument specifies an existing object to be
   * used. If no object is given, then a new instance
   * is created using the constructor from the codec.
   *
   * The function returns the passed in object or
   * the new instance if no object was given.
   *
   * Parameters:
   *
   * node - XML node to be decoded.
   * into - Optional object to be decodec into.
   */
  mxCodec.prototype.decode = function (node, into) {
    this.updateElements()
    let obj = null

    if (node != null && node.nodeType === mxConstants.NODETYPE_ELEMENT) {
      const ctor = this.getConstructor(node.nodeName)
      const dec = mxCodecRegistry.getCodec(ctor)

      if (dec != null) {
        obj = dec.decode(this, node, into)
      } else {
        obj = node.cloneNode(true)
        obj.removeAttribute('as')
      }
    }

    return obj
  }

  /**
   * Function: isConstructorAllowed
   *
   * Returns true if the given constructor name is allowed to be
   * instantiated.
   *
   * Parameters:
   *
   * name - Name of the constructor to be checked.
   */
  mxCodec.prototype.isConstructorAllowed = function (name) {
    return mxCodec.allowlist == null || mxUtils.indexOf(mxCodec.allowlist, name) >= 0
  }

  /**
   * Function: getConstructor
   *
   * Returns the constructor for the given object type.
   *
   * Parameters:
   *
   * name - Name of the type to be returned.
   */
  mxCodec.prototype.getConstructor = function (name) {
    let ctor = null

    try {
      if (this.isConstructorAllowed(name)) {
        ctor = window[name]
      }
    } catch (err) {
      // ignore
    }

    return ctor
  }

  /**
   * Function: encodeCell
   *
   * Encoding of cell hierarchies is built-into the core, but
   * is a higher-level function that needs to be explicitely
   * used by the respective object encoders (e.g. <mxModelCodec>,
   * <mxChildChangeCodec> and <mxRootChangeCodec>). This
   * implementation writes the given cell and its children as a
   * (flat) sequence into the given node. The children are not
   * encoded if the optional includeChildren is false. The
   * function is in charge of adding the result into the
   * given node and has no return value.
   *
   * Parameters:
   *
   * cell - <mxCell> to be encoded.
   * node - Parent XML node to add the encoded cell into.
   * includeChildren - Optional boolean indicating if the
   * function should include all descendents. Default is true.
   */
  mxCodec.prototype.encodeCell = function (cell, node, includeChildren) {
    if (!this.isObjectIgnored(cell)) {
      const cellNode = this.encode(cell)

      if (cellNode != null) {
        node.appendChild(cellNode)
      }

      if (includeChildren == null || includeChildren) {
        const childCount = cell.getChildCount()

        for (let i = 0; i < childCount; i++) {
          this.encodeCell(cell.getChildAt(i), node)
        }
      }
    }
  }
  mxOutput.mxCodec = mxCodec
}
