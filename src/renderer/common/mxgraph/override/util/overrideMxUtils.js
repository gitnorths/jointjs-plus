export function overrideMxUtils (mxOutput) {
  const {
    mxClient,
    mxConstants,
    mxEvent,
    mxObjectIdentity,
    mxPoint,
    mxRectangle,
    mxSvgCanvas2D,
    mxUtils
  } = mxOutput

  // mxUtils start
  /**
   * Function: lastIndexOf
   *
   * Returns the last index of obj in array or -1 if the array does not contain
   * the given object.
   *
   * Parameters:
   *
   * array - Array to check for the given obj.
   * obj - Object to find in the given array.
   */
  mxUtils.lastIndexOf = function (array, obj) {
    if (array != null && obj != null) {
      for (let i = array.length - 1; i >= 0; i--) {
        if (array[i] === obj) {
          return i
        }
      }
    }

    return -1
  }
  /**
   * Function: addItems
   *
   * Adds all items from the given array to the given array.
   * If an item is an array, then its members are added.
   *
   * Parameters:
   *
   * to - Array to add the items to.
   * from - Array to add the items from.
   */
  mxUtils.addItems = function (to, from) {
    for (let i = 0; i < from.length; i++) {
      if (from[i] != null) {
        if (from[i].constructor === Array) {
          mxUtils.addItems(to, from[i])
        } else if (mxUtils.indexOf(to, from[i]) < 0) {
          to.push(from[i])
        }
      }
    }

    return to
  }
  /**
   * Function: isNode
   *
   * Returns true if the given value is an XML node with the node name
   * and if the optional attribute has the specified value.
   *
   * This implementation assumes that the given value is a DOM node if the
   * nodeType property is numeric, that is, if isNaN returns false for
   * value.nodeType.
   *
   * Parameters:
   *
   * value - Object that should be examined as a node.
   * nodeName - String that specifies the node name.
   * attributeName - Optional attribute name to check.
   * attributeValue - Optional attribute value to check.
   */
  mxUtils.isNode = function (value, nodeName, attributeName, attributeValue) {
    if (value != null && value.constructor === Element && (nodeName == null ||
      value.nodeName.toLowerCase() === nodeName.toLowerCase())) {
      return attributeName == null ||
        value.getAttribute(attributeName) === attributeValue
    }

    return false
  }
  /**
   * Function: visitNodes
   *
   * Calls visitor for each child of the given node, recursively.
   *
   * Parameters:
   *
   * node - Parent DOM node to visit the children of.
   * visitor - Function to be called for each child node.
   */
  mxUtils.visitNodes = function (node, visitor) {
    if (node.nodeType === mxConstants.NODETYPE_ELEMENT) {
      visitor(node)
      node = node.firstChild

      while (node != null) {
        mxUtils.visitNodes(node, visitor)
        node = node.nextSibling
      }
    }
  }
  /**
   * Function: removeChildNodes
   *
   * Removes all child nodes of the given node.
   *
   * Parameters:
   *
   * node - Parent DOM node to remove the children from.
   */
  mxUtils.removeChildNodes = function (node) {
    while (node.lastChild != null) {
      node.removeChild(node.lastChild)
    }
  }
  /**
   * Function: importNodeImplementation
   *
   * Full DOM API implementation for importNode without using importNode API call.
   *
   * Parameters:
   *
   * doc - Document to import the node into.
   * node - Node to be imported.
   * allChildren - If all children should be imported.
   */
  mxUtils.importNodeImplementation = function (doc, node, allChildren) {
    switch (node.nodeType) {
      case 1: /* element */
      {
        const newNode = doc.createElement(node.nodeName)

        if (node.attributes && node.attributes.length > 0) {
          for (let i = 0; i < node.attributes.length; i++) {
            newNode.setAttribute(node.attributes[i].nodeName,
              node.getAttribute(node.attributes[i].nodeName))
          }
        }

        if (allChildren && node.childNodes && node.childNodes.length > 0) {
          for (let i = 0; i < node.childNodes.length; i++) {
            newNode.appendChild(mxUtils.importNodeImplementation(doc, node.childNodes[i], allChildren))
          }
        }

        return newNode
      }
      case 3: /* text */
      case 4: /* cdata-section */
      case 8: /* comment */
      {
        return doc.createTextNode((node.nodeValue != null) ? node.nodeValue : node.value)
      }
    }
  }
  /**
   * Function: createXmlDocument
   *
   * Returns a new, empty XML document.
   */
  mxUtils.createXmlDocument = function () {
    let doc = null

    if (document.implementation && document.implementation.createDocument) {
      doc = document.implementation.createDocument('', '', null)
    }

    return doc
  }
  /**
   * Function: parseXml
   *
   * Parses the specified XML string into a new XML document and returns the
   * new document.
   *
   * Example:
   *
   * (code)
   * var doc = mxUtils.parseXml(
   *   '<mxGraphModel><root><MyDiagram id="0"><mxCell/></MyDiagram>'+
   *   '<MyLayer id="1"><mxCell parent="0" /></MyLayer><MyObject id="2">'+
   *   '<mxCell style="strokeColor=blue;fillColor=red" parent="1" vertex="1">'+
   *   '<mxGeometry x="10" y="10" width="80" height="30" as="geometry"/>'+
   *   '</mxCell></MyObject></root></mxGraphModel>');
   * (end)
   *
   * Parameters:
   *
   * xml - String that contains the XML data.
   */
  mxUtils.parseXml = function (xml) {
    const parser = new DOMParser()

    return parser.parseFromString(xml, 'text/xml')
  }
  /**
   * Function: getSvgDefs
   *
   * Get or create the defs section in the given SVG element.
   */
  mxUtils.getSvgDefs = function (svgRoot) {
    const doc = svgRoot.ownerDocument
    const defs = svgRoot.getElementsByTagName('defs')
    let defsElt = null

    if (defs.length === 0 || defs[0].parentNode !== svgRoot) {
      defsElt = (doc.createElementNS != null)
        ? doc.createElementNS(mxConstants.NS_SVG, 'defs')
        : doc.createElement('defs')

      if (svgRoot.firstChild != null) {
        svgRoot.insertBefore(defsElt, svgRoot.firstChild)
      } else {
        svgRoot.appendChild(defsElt)
      }
    } else {
      defsElt = defs[0]
    }

    return defsElt
  }
  /**
   * Function: htmlEntities
   *
   * Replaces characters (less than, greater than, newlines and quotes) with
   * their HTML entities in the given string and returns the result.
   *
   * Parameters:
   *
   * s - String that contains the characters to be converted.
   * newline - If newlines should be replaced. Default is true.
   * quotes - If single and double quotes should be replaced.
   * Default is true.
   * tab - If tabs should be replaced with &#x9;. Default is true.
   */
  mxUtils.htmlEntities = function (s, newline, quotes, tab) {
    s = String((s != null) ? s : '')

    s = s.replace(/&/g, '&amp;') // 38 26
    s = s.replace(/</g, '&lt;') // 60 3C
    s = s.replace(/>/g, '&gt;') // 62 3E

    if (quotes == null || quotes) {
      s = s.replace(/"/g, '&quot;') // 34 22
      s = s.replace(/'/g, '&#39;') // 39 27
    }

    if (newline == null || newline) {
      s = s.replace(/\n/g, '&#xa;')
    }

    if (tab == null || tab) {
      s = s.replace(/\t/g, '&#x9;')
    }

    return s
  }
  /**
   * Function: decodeHtml
   *
   * Replaces HTML entities with the corresponding characters in the given html string.
   *
   * Parameters:
   * html - String that contains the HTML entities to be decoded.
   */
  mxUtils.decodeHtml = function (html) {
    const txt = document.createElement('textarea')
    txt.innerHTML = html
    return txt.value
  }
  /**
   * Function: getPrettyXML
   *
   * Returns a pretty printed string that represents the XML tree for the
   * given node. This method should only be used to print XML for reading,
   * use <getXml> instead to obtain a string for processing.
   *
   * Parameters:
   *
   * node - DOM node to return the XML for.
   * tab - Optional string that specifies the indentation for one level.
   * Default is two spaces.
   * indent - Optional string that represents the current indentation.
   * Default is an empty string.
   * newline - Option string that represents a linefeed. Default is '\n'.
   */
  mxUtils.getPrettyXml = function (node, tab, indent, newline, ns) {
    const result = []

    if (node != null) {
      tab = (tab != null) ? tab : '  '
      indent = (indent != null) ? indent : ''
      newline = (newline != null) ? newline : '\n'

      if (node.namespaceURI != null && node.namespaceURI !== ns) {
        ns = node.namespaceURI

        if (node.getAttribute('xmlns') == null) {
          node.setAttribute('xmlns', node.namespaceURI)
        }
      }

      if (node.nodeType === mxConstants.NODETYPE_DOCUMENT) {
        result.push(mxUtils.getPrettyXml(node.documentElement, tab, indent, newline, ns))
      } else if (node.nodeType === mxConstants.NODETYPE_DOCUMENT_FRAGMENT) {
        let tmp = node.firstChild

        if (tmp != null) {
          while (tmp != null) {
            result.push(mxUtils.getPrettyXml(tmp, tab, indent, newline, ns))
            tmp = tmp.nextSibling
          }
        }
      } else if (node.nodeType === mxConstants.NODETYPE_COMMENT) {
        const value = mxUtils.getTextContent(node)

        if (value.length > 0) {
          result.push(indent + '<!--' + value + '-->' + newline)
        }
      } else if (node.nodeType === mxConstants.NODETYPE_TEXT) {
        const value = mxUtils.trim(mxUtils.getTextContent(node))

        if (value.length > 0) {
          result.push(indent + mxUtils.htmlEntities(value, false, false) + newline)
        }
      } else if (node.nodeType === mxConstants.NODETYPE_CDATA) {
        const value = mxUtils.getTextContent(node)

        if (value.length > 0) {
          result.push(indent + '<![CDATA[' + value + ']]' + newline)
        }
      } else {
        result.push(indent + '<' + node.nodeName)

        // Creates the string with the node attributes
        // and converts all HTML entities in the values
        const attrs = node.attributes

        if (attrs != null) {
          for (let i = 0; i < attrs.length; i++) {
            const val = mxUtils.htmlEntities(attrs[i].value)
            result.push(' ' + attrs[i].nodeName + '="' + val + '"')
          }
        }

        // Recursively creates the XML string for each child
        // node and appends it here with an indentation
        let tmp = node.firstChild

        if (tmp != null) {
          result.push('>' + newline)

          while (tmp != null) {
            result.push(mxUtils.getPrettyXml(tmp, tab, indent + tab, newline, ns))
            tmp = tmp.nextSibling
          }

          result.push(indent + '</' + node.nodeName + '>' + newline)
        } else {
          result.push(' />' + newline)
        }
      }
    }

    return result.join('')
  }
  /**
   * Function: getNodeValue
   *
   * Returns the node value of the specified node and its
   * text and cdata children as a string. The node values
   * are trimmed and concatenated. Returns null if no value
   * was found.
   *
   * Parameters:
   *
   * node - DOM node to return the node value for.
   */
  mxUtils.getNodeValue = function (node) {
    node = node.firstChild
    const result = []

    while (node != null) {
      if ((node.nodeType === mxConstants.NODETYPE_TEXT ||
          node.nodeType === mxConstants.NODETYPE_CDATA) &&
        node.nodeValue != null) {
        result.push(mxUtils.trim(node.nodeValue))
      }

      node = node.nextSibling
    }

    return (result.length > 0) ? result.join('') : ''
  }
  /**
   * Function: button
   *
   * Returns a new button with the given level and function as an onclick
   * event handler.
   *
   * (code)
   * document.body.appendChild(mxUtils.button('Test', function(evt)
   * {
   *   alert('Hello, World!');
   * }));
   * (end)
   *
   * Parameters:
   *
   * label - String that represents the label of the button.
   * funct - Function to be called if the button is pressed.
   * doc - Optional document to be used for creating the button. Default is the
   * current document.
   */
  mxUtils.button = function (label, funct, doc, className) {
    doc = (doc != null) ? doc : document

    const button = doc.createElement('button')
    mxUtils.write(button, label)

    mxEvent.addListener(button, 'click', function (evt) {
      funct(evt)
    })

    if (className != null) {
      button.className = className
    }

    return button
  }
  /**
   * Function: fit
   *
   * Makes sure the given node is inside the visible area of the window. This
   * is done by setting the left and top in the style.
   */
  mxUtils.fit = function (node, margin) {
    margin = margin || 0
    const ds = mxUtils.getDocumentSize()
    const left = parseInt(node.offsetLeft)
    const width = parseInt(node.offsetWidth)

    const offset = mxUtils.getDocumentScrollOrigin(node.ownerDocument)
    const sl = offset.x
    const st = offset.y
    const right = sl + ds.width - margin

    if (left + width > right) {
      node.style.left = Math.max(sl + margin, right - width) + 'px'
    }

    const top = parseInt(node.offsetTop)
    const height = parseInt(node.offsetHeight)
    const bottom = st + ds.height - margin

    if (top + height > bottom) {
      node.style.top = Math.max(st + margin, bottom - height) + 'px'
    }
  }

  /**
   * Function: isEmptyObject
   *
   * Returns true if the given object has no properties.
   *
   * Parameters:
   *
   * obj - Object to be checked.
   */
  mxUtils.isEmptyObject = function (obj) {
    // for (const key in obj) {
    //   return false
    // }
    //
    // return true

    const keys = Object.keys(obj)
    return !keys || keys.length === 0
  }

  /**
   * Function: clone
   *
   * Recursively clones the specified object ignoring all fieldnames in the
   * given array of transient fields. <mxObjectIdentity.FIELD_NAME> is always
   * ignored by this function.
   *
   * Parameters:
   *
   * obj - Object to be cloned.
   * transients - Optional array of strings representing the fieldname to be
   * ignored.
   * shallow - Optional boolean argument to specify if a shallow clone should
   * be created, that is, one where all object references are not cloned or,
   * in other words, one where only atomic (strings, numbers) values are
   * cloned. Default is false.
   */
  mxUtils.clone = function (obj, transients, shallow) {
    shallow = (shallow != null) ? shallow : false
    let clone = null

    if (obj != null && typeof (obj.constructor) === 'function') {
      if (obj.constructor === Element) {
        clone = obj.cloneNode((shallow != null) ? !shallow : false)
      } else {
        clone = new obj.constructor()

        for (const i in obj) {
          if (i !== mxObjectIdentity.FIELD_NAME && (transients == null ||
            mxUtils.indexOf(transients, i) < 0)) {
            if (!shallow && typeof (obj[i]) === 'object') {
              clone[i] = mxUtils.clone(obj[i])
            } else {
              clone[i] = obj[i]
            }
          }
        }
      }
    }

    return clone
  }

  /**
   * Function: intersectsPoints
   *
   * Returns true if the given rectangle intersects the given points.
   *
   * Parameters:
   *
   * bounds - <mxRectangle> that represents the rectangle.
   * pts - Array of <mxPoints> that represents the points.
   */
  mxUtils.intersectsPoints = function (bounds, pts) {
    for (let i = 0; i < pts.length - 1; i++) {
      if (mxUtils.rectangleIntersectsSegment(bounds, pts[i], pts[i + 1])) {
        return true
      }
    }

    return false
  }

  /**
   * Function: intersects
   *
   * Returns true if the two rectangles intersect.
   *
   * Parameters:
   *
   * a - <mxRectangle> to be checked for intersection.
   * b - <mxRectangle> to be checked for intersection.
   * ignoreSize - Boolean to allow width/height of 0.
   */
  mxUtils.intersects = function (a, b, ignoreSize) {
    let tw = a.width
    let th = a.height
    let rw = b.width
    let rh = b.height

    if (!ignoreSize &&
      (rw <= 0 || rh <= 0 ||
        tw <= 0 || th <= 0)) {
      return false
    }

    const tx = a.x
    const ty = a.y
    const rx = b.x
    const ry = b.y

    rw += rx
    rh += ry
    tw += tx
    th += ty

    return ((rw < rx || rw > tx) &&
      (rh < ry || rh > ty) &&
      (tw < tx || tw > rx) &&
      (th < ty || th > ry))
  }
  /**
   * Function: getDocumentScrollOrigin
   *
   * Returns the scroll origin of the given document or the current document
   * if no document is given.
   */
  mxUtils.getDocumentScrollOrigin = function (doc) {
    const wnd = doc.defaultView || doc.parentWindow

    const x = (wnd != null && window.pageXOffset !== undefined) ? window.pageXOffset : (document.documentElement || document.body.parentNode || document.body).scrollLeft
    const y = (wnd != null && window.pageYOffset !== undefined) ? window.pageYOffset : (document.documentElement || document.body.parentNode || document.body).scrollTop

    return new mxPoint(x, y)
  }
  /**
   * Function: removeJavascriptProtocol
   *
   * Removes leading javascript: protocol from the given link.
   *
   * Parameters:
   *
   * link - String that represents the link.
   */
  mxUtils.removeJavascriptProtocol = function (link) {
    link = (link != null) ? mxUtils.zapGremlins(link) : null

    while (link != null && mxUtils.ltrim(link.toLowerCase()).substring(0, 11) === 'javascript:') {
      link = link.substring(link.toLowerCase().indexOf(':') + 1)
    }

    return link
  }

  /**
   * Function: zapGremlins
   *
   * Removes all illegal control characters with ASCII code <32 except TAB, LF
   * and CR.
   *
   * Parameters:
   *
   * text - String that represents the text.
   */
  mxUtils.zapGremlins = function (text) {
    let lastIndex = 0
    const checked = []

    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i)

      // Removes all control chars except TAB, LF and CR
      if (!((code >= 32 || code === 9 || code === 10 || code === 13) &&
        code !== 0xFFFF && code !== 0xFFFE)) {
        checked.push(text.substring(lastIndex, i))
        lastIndex = i + 1
      }
    }

    if (lastIndex > 0 && lastIndex < text.length) {
      checked.push(text.substring(lastIndex))
    }

    return (checked.length === 0) ? text : checked.join('')
  }
  /**
   * Function: ltrim
   *
   * Strips all whitespaces from the beginning of the string. Without the
   * second parameter, this will trim these characters:
   *
   * - " " (ASCII 32 (0x20)), an ordinary space
   * - "\t" (ASCII 9 (0x09)), a tab
   * - "\n" (ASCII 10 (0x0A)), a new line (line feed)
   * - "\r" (ASCII 13 (0x0D)), a carriage return
   * - "\0" (ASCII 0 (0x00)), the NUL-byte
   * - "\x0B" (ASCII 11 (0x0B)), a vertical tab
   */
  mxUtils.ltrim = function (str, chars) {
    chars = chars || '\\s|\\0'

    return (str != null) ? str.replace(new RegExp('^[' + chars + ']+', 'g'), '') : null
  }
  /**
   * Function: rtrim
   *
   * Strips all whitespaces from the end of the string. Without the second
   * parameter, this will trim these characters:
   *
   * - " " (ASCII 32 (0x20)), an ordinary space
   * - "\t" (ASCII 9 (0x09)), a tab
   * - "\n" (ASCII 10 (0x0A)), a new line (line feed)
   * - "\r" (ASCII 13 (0x0D)), a carriage return
   * - "\0" (ASCII 0 (0x00)), the NUL-byte
   * - "\x0B" (ASCII 11 (0x0B)), a vertical tab
   */
  mxUtils.rtrim = function (str, chars) {
    chars = chars || '\\s|\\0'

    return (str != null) ? str.replace(new RegExp('[' + chars + ']+$', 'g'), '') : null
  }
  /**
   * Function: setOpacity
   *
   * Sets the opacity of the specified DOM node to the given value in %.
   *
   * Parameters:
   *
   * node - DOM node to set the opacity for.
   * value - Opacity in %. Possible values are between 0 and 100.
   */
  mxUtils.setOpacity = function (node, value) {
    if (mxClient.IS_IE && (typeof (document.documentMode) === 'undefined' || document.documentMode < 9)) {
      if (value >= 100) {
        node.style.filter = ''
      } else {
        node.style.filter = 'alpha(opacity=' + value + ')'
      }
    } else {
      node.style.opacity = (value / 100)
    }
  }
  /**
   * Function: createElementNs
   *
   * Helper function for creating an element in a namespace.
   *
   * Parameters:
   *
   * doc - Owner document of the new element.
   * ns - Namespace for the element.
   * tagName - Qualified name of the element.
   */
  mxUtils.createElementNs = function (doc, ns, tagName) {
    if (doc.createElementNS != null) {
      return doc.createElementNS(ns, tagName)
    } else {
      const elt = doc.createElement(tagName)

      if (window.namespace != null) {
        elt.setAttribute('xmlns', ns)
      }

      return elt
    }
  }
  /**
   * Function: createImage
   *
   * Creates and returns an image (IMG node).
   *
   * Parameters:
   *
   * src - URL that points to the image to be displayed.
   */
  mxUtils.createImage = function (src) {
    let imageNode = null
    imageNode = document.createElement('img')
    imageNode.setAttribute('src', src)
    imageNode.setAttribute('border', '0')

    return imageNode
  }
  /**
   * Function: hex2rgb
   *
   * Converts the given hexadecimal color value to an RGBA string.
   */
  mxUtils.hex2rgb = function (value) {
    if (value != null && value.length === 7 && value.charAt(0) === '#') {
      const r = parseInt(value.substring(1, 3), 16)
      const g = parseInt(value.substring(3, 5), 16)
      const b = parseInt(value.substring(5, 7), 16)

      value = 'rgb(' + r + ', ' + g + ', ' + b + ')'
    }

    return value
  }
  /**
   * Function: hex2rgba
   *
   * Converts the given hexadecimal color value to an RGBA string.
   */
  mxUtils.hex2rgba = function (value, alpha) {
    if (value != null && value.length >= 7 && value.charAt(0) === '#') {
      const r = parseInt(value.substring(1, 3), 16)
      const g = parseInt(value.substring(3, 5), 16)
      const b = parseInt(value.substring(5, 7), 16)
      let a = (alpha != null) ? alpha : 1

      if (value.length > 7) {
        a = parseInt(value.substring(7, 9), 16) / 255
      }

      value = 'rgba(' + r + ', ' + g + ', ' + b + ', ' + a + ')'
    }

    return value
  }
  /**
   *  Function: rgba2hex
   *
   *  Converts the given RGBA color value to a hexadecimal string (or return the original input if it's not rgb).
   */
  mxUtils.rgba2hex = function (color) {
    const rgb = color && color.match ? color.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i) : color

    return (rgb && rgb.length === 4)
      ? '#' +
      ('0' + parseInt(rgb[1], 10).toString(16)).slice(-2) +
      ('0' + parseInt(rgb[2], 10).toString(16)).slice(-2) +
      ('0' + parseInt(rgb[3], 10).toString(16)).slice(-2)
      : color
  }
  /**
   * Function: getSizeForString
   *
   * Returns an <mxRectangle> with the size (width and height in pixels) of
   * the given string. The string may contain HTML markup. Newlines should be
   * converted to <br> before calling this method. The caller is responsible
   * for sanitizing the HTML markup.
   *
   * Example:
   *
   * (code)
   * var label = graph.getLabel(cell).replace(/\n/g, "<br>");
   * var size = graph.getSizeForString(label);
   * (end)
   *
   * Parameters:
   *
   * text - String whose size should be returned.
   * fontSize - Integer that specifies the font size in pixels. Default is
   * <mxConstants.DEFAULT_FONTSIZE>.
   * fontFamily - String that specifies the name of the font family. Default
   * is <mxConstants.DEFAULT_FONTFAMILY>.
   * textWidth - Optional width for text wrapping.
   * fontStyle - Optional font style.
   */
  mxUtils.getSizeForString = function (text, fontSize, fontFamily, textWidth, fontStyle) {
    fontSize = (fontSize != null) ? fontSize : mxConstants.DEFAULT_FONTSIZE
    fontFamily = (fontFamily != null) ? fontFamily : mxConstants.DEFAULT_FONTFAMILY
    const div = document.createElement('div')

    // Sets the font size and family
    div.style.fontFamily = fontFamily
    div.style.fontSize = Math.round(fontSize) + 'px'
    div.style.lineHeight = (mxConstants.ABSOLUTE_LINE_HEIGHT)
      ? (fontSize * mxConstants.LINE_HEIGHT) + 'px'
      : (mxConstants.LINE_HEIGHT * mxSvgCanvas2D.prototype.lineHeightCorrection)

    // Sets the font style
    if (fontStyle != null) {
      if ((fontStyle & mxConstants.FONT_BOLD) === mxConstants.FONT_BOLD) {
        div.style.fontWeight = 'bold'
      }

      if ((fontStyle & mxConstants.FONT_ITALIC) === mxConstants.FONT_ITALIC) {
        div.style.fontStyle = 'italic'
      }

      const txtDecor = []

      if ((fontStyle & mxConstants.FONT_UNDERLINE) === mxConstants.FONT_UNDERLINE) {
        txtDecor.push('underline')
      }

      if ((fontStyle & mxConstants.FONT_STRIKETHROUGH) === mxConstants.FONT_STRIKETHROUGH) {
        txtDecor.push('line-through')
      }

      if (txtDecor.length > 0) {
        div.style.textDecoration = txtDecor.join(' ')
      }
    }

    // Disables block layout and outside wrapping and hides the div
    div.style.position = 'absolute'
    div.style.visibility = 'hidden'
    div.style.display = 'inline-block'
    div.style.zoom = '1'

    if (textWidth != null) {
      div.style.width = textWidth + 'px'
      div.style.whiteSpace = 'normal'
    } else {
      div.style.whiteSpace = 'nowrap'
    }

    // Adds the text and inserts into DOM for updating of size
    div.innerHTML = text
    document.body.appendChild(div)

    // Gets the size and removes from DOM
    const size = new mxRectangle(0, 0, div.offsetWidth, div.offsetHeight)
    document.body.removeChild(div)

    return size
  }
  /**
   * Function: getScaleForPageCount
   *
   * Returns the scale to be used for printing the graph with the given
   * bounds across the specifies number of pages with the given format. The
   * scale is always computed such that it given the given amount or fewer
   * pages in the print output. See <mxPrintPreview> for an example.
   *
   * Parameters:
   *
   * pageCount - Specifies the number of pages in the print output.
   * graph - <mxGraph> that should be printed.
   * pageFormat - Optional <mxRectangle> that specifies the page format.
   * Default is <mxConstants.PAGE_FORMAT_A4_PORTRAIT>.
   * border - The border along each side of every page.
   */
  mxUtils.getScaleForPageCount = function (pageCount, graph, pageFormat, border) {
    if (pageCount < 1) {
      // We can't work with less than 1 page, return no scale
      // change
      return 1
    }

    pageFormat = (pageFormat != null) ? pageFormat : mxConstants.PAGE_FORMAT_A4_PORTRAIT
    border = (border != null) ? border : 0

    const availablePageWidth = pageFormat.width - (border * 2)
    const availablePageHeight = pageFormat.height - (border * 2)

    // Work out the number of pages required if the
    // graph is not scaled.
    const graphBounds = mxRectangle.fromRectangle(graph.getGraphBounds())
    const sc = graph.getView().getScale()
    graphBounds.width /= sc
    graphBounds.height /= sc
    const graphWidth = graphBounds.width
    const graphHeight = graphBounds.height
    let scale = 1

    // The ratio of the width/height for each printer page
    const pageFormatAspectRatio = availablePageWidth / availablePageHeight
    // The ratio of the width/height for the graph to be printer
    const graphAspectRatio = graphWidth / graphHeight

    // The ratio of horizontal pages / vertical pages for this
    // graph to maintain its aspect ratio on this page format
    const pagesAspectRatio = graphAspectRatio / pageFormatAspectRatio

    // Factor the square root of the page count up and down
    // by the pages aspect ratio to obtain a horizontal and
    // vertical page count that adds up to the page count
    // and has the correct aspect ratio
    const pageRoot = Math.sqrt(pageCount)
    const pagesAspectRatioSqrt = Math.sqrt(pagesAspectRatio)
    let numRowPages = pageRoot * pagesAspectRatioSqrt
    let numColumnPages = pageRoot / pagesAspectRatioSqrt

    // These value are rarely more than 2 rounding downs away from
    // a total that meets the page count. In cases of one being less
    // than 1 page, the other value can be too high and take more iterations
    // In this case, just change that value to be the page count, since
    // we know the other value is 1
    if (numRowPages < 1 && numColumnPages > pageCount) {
      const scaleChange = numColumnPages / pageCount
      numColumnPages = pageCount
      numRowPages /= scaleChange
    }

    if (numColumnPages < 1 && numRowPages > pageCount) {
      const scaleChange = numRowPages / pageCount
      numRowPages = pageCount
      numColumnPages /= scaleChange
    }

    let currentTotalPages = Math.ceil(numRowPages) * Math.ceil(numColumnPages)

    let numLoops = 0

    // Iterate through while the rounded up number of pages comes to
    // a total greater than the required number
    while (currentTotalPages > pageCount) {
      // Round down the page count (rows or columns) that is
      // closest to its next integer down in percentage terms.
      // i.e. Reduce the page total by reducing the total
      // page area by the least possible amount

      let roundRowDownProportion = Math.floor(numRowPages) / numRowPages
      let roundColumnDownProportion = Math.floor(numColumnPages) / numColumnPages

      // If the round down proportion is, work out the proportion to
      // round down to 1 page less
      if (roundRowDownProportion === 1) {
        roundRowDownProportion = Math.floor(numRowPages - 1) / numRowPages
      }
      if (roundColumnDownProportion === 1) {
        roundColumnDownProportion = Math.floor(numColumnPages - 1) / numColumnPages
      }

      // Check which rounding down is smaller, but in the case of very small roundings
      // try the other dimension instead
      let scaleChange = 1

      // Use the higher of the two values
      if (roundRowDownProportion > roundColumnDownProportion) {
        scaleChange = roundRowDownProportion
      } else {
        scaleChange = roundColumnDownProportion
      }

      numRowPages = numRowPages * scaleChange
      numColumnPages = numColumnPages * scaleChange
      currentTotalPages = Math.ceil(numRowPages) * Math.ceil(numColumnPages)

      numLoops++

      if (numLoops > 10) {
        break
      }
    }

    // Work out the scale from the number of row pages required
    // The column pages will give the same value
    const posterWidth = availablePageWidth * numRowPages
    scale = posterWidth / graphWidth

    // Allow for rounding errors
    return scale * 0.99999
  }
  /**
   * Function: printScreen
   *
   * Prints the specified graph using a new window and the built-in print
   * dialog.
   *
   * This function should be called from within the document with the graph.
   *
   * Parameters:
   *
   * graph - <mxGraph> to be printed.
   */
  mxUtils.printScreen = function (graph) {
    const wnd = window.open()
    mxUtils.show(graph, wnd.document)

    const print = function () {
      wnd.focus()
      wnd.print()
      wnd.close()
    }

    // Workaround for Google Chrome which needs a bit of a
    // delay in order to render the SVG contents
    if (mxClient.IS_GC) {
      wnd.setTimeout(print, 500)
    } else {
      print()
    }
  }
  /**
   * Function: format
   *
   * Rounds all numbers to 2 decimal points.
   */
  mxUtils.format = function (value) {
    return parseFloat(parseFloat(value).toFixed(2))
  }
  // mxUtils end
  mxOutput.mxUtils = mxUtils
}
