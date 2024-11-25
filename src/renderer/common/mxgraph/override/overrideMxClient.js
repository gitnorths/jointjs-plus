export function overrideMxClient (mxOutput) {
  const { mxClient } = mxOutput

  // mxClient start
  /**
   * Variable: IS_IOS
   *
   * Returns true if the user agent is an iPad, iPhone or iPod.
   */
  mxClient.IS_IOS = (/iP(hone|od|ad)/.test(navigator.platform)) || (navigator.userAgent.match(/Mac/) && navigator.maxTouchPoints && navigator.maxTouchPoints > 2)
  /**
   * Variable: IS_WEBVIEW
   *
   * Returns true if the user agent is a WebView [inside mobile app].
   */
  mxClient.IS_WEBVIEW = (/((iPhone|iPod|iPad).*AppleWebKit(?!.*Version)|; wv)/i.test(navigator.userAgent))
  /**
   * Variable: IS_FF
   *
   * True if the current browser is Firefox.
   */
  mxClient.IS_FF = navigator.userAgent.toLowerCase().indexOf('firefox') > -1
  /**
   * Variable: NO_FO
   *
   * True if foreignObject support is not available. This is the case for
   * Opera, older SVG-based browsers and all versions of IE.
   */
  mxClient.NO_FO = !document.createElementNS ||
    document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject').toString() !== '[object SVGForeignObjectElement]' ||
    navigator.userAgent.indexOf('Opera/') >= 0
  /**
   * Variable: IS_LINUX
   *
   * True if the client is Linux.
   */
  mxClient.IS_LINUX = /\bLinux\b/.test(navigator.appVersion)
  /**
   * Function: isBrowserSupported
   *
   * Returns true if the current browser is supported, that is, if
   * <mxClient.IS_SVG> is true.
   *
   * Example:
   *
   * (code)
   * if (!mxClient.isBrowserSupported())
   * {
   *   mxUtils.error('Browser is not supported!', 200, false);
   * }
   * (end)
   */
  mxClient.isBrowserSupported = function () {
    return mxClient.IS_SVG
  }
  /**
   * Function: link
   *
   * Adds a link node to the head of the document. Use this
   * to add a stylesheet to the page as follows:
   *
   * (code)
   * mxClient.link('stylesheet', filename);
   * (end)
   *
   * where filename is the (relative) URL of the stylesheet. The charset
   * is hardcoded to ISO-8859-1 and the type is text/css.
   *
   * Parameters:
   *
   * rel - String that represents the rel attribute of the link node.
   * href - String that represents the href attribute of the link node.
   * doc - Optional parent document of the link node.
   * id - unique id for the link element to check if it already exists
   */
  mxClient.link = function (rel, href, doc, id) {
    doc = doc || document

    const link = doc.createElement('link')

    link.setAttribute('rel', rel)
    link.setAttribute('href', href)
    link.setAttribute('charset', 'UTF-8')
    link.setAttribute('type', 'text/css')

    if (id) {
      link.setAttribute('id', id)
    }

    const head = doc.getElementsByTagName('head')[0]
    head.appendChild(link)
  }
  if (mxClient.hasOwnProperty('IS_IE6')) {
    delete mxClient.IS_IE6
  }
  if (mxClient.hasOwnProperty('IS_QUIRKS')) {
    delete mxClient.IS_QUIRKS
  }
  if (mxClient.hasOwnProperty('IS_VML')) {
    delete mxClient.IS_VML
  }
  // mxClient end
  mxOutput.mxClient = mxClient
}
