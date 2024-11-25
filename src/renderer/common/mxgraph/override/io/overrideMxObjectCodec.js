export function overrideMxObjectCodec (mxOutput) {
  const { mxObjectCodec } = mxOutput
  /**
   * Function: isIgnoredAttribute
   *
   * Returns true if the given attribute should be ignored. This implementation
   * returns true if the attribute name is "as" or "id" or if the attribute
   * points to a function on the given object.
   *
   * Parameters:
   *
   * dec - <mxCodec> that controls the decoding process.
   * attr - XML attribute to be decoded.
   * obj - Object to encode the attribute into.
   */
  mxObjectCodec.prototype.isIgnoredAttribute = function (dec, attr, obj) {
    return attr.nodeName === 'as' || attr.nodeName === 'id' ||
      typeof obj[attr.nodeName] === 'function'
  }

  /**
   * Function: addObjectValue
   *
   * Sets the decoded child node as a value of the given object. If the
   * object is a map, then the value is added with the given fieldname as a
   * key. If the fieldname is not empty, then setFieldValue is called or
   * else, if the object is a collection, the value is added to the
   * collection. For strongly typed languages it may be required to
   * override this with the correct code to add an entry to an object.
   */
  mxObjectCodec.prototype.addObjectValue = function (obj, fieldname, value, template) {
    if (value != null && value !== template) {
      if (fieldname != null && fieldname.length > 0) {
        obj[fieldname] = value
      } else if (obj.constructor === Array) {
        obj.push(value)
      } else {
        throw new Error('Could not add object')
      }
      // mxLog.debug('Decoded '+mxUtils.getFunctionName(obj.constructor)+'.'+fieldname+': '+value);
    }
  }
  mxOutput.mxObjectCodec = mxObjectCodec
}
