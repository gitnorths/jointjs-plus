export function overrideMxXmlRequest (mxOutput) {
  const { mxUtils, mxXmlRequest } = mxOutput
  // mxXmlRequest start
  /**
   * Variable: acceptResponse
   *
   * Specifies if the response has been processed with onload or onerror.
   */
  mxXmlRequest.prototype.acceptResponse = true
  /**
   * Function: send
   *
   * Send the <request> to the target URL using the specified functions to
   * process the response asychronously.
   *
   * Note: Due to technical limitations, onerror is currently ignored.
   *
   * Parameters:
   *
   * onload - Function to be invoked if a successful response was received.
   * onerror - Function to be called on any error.
   * timeout - Optional timeout in ms before calling ontimeout.
   * ontimeout - Optional function to execute on timeout.
   */
  mxXmlRequest.prototype.send = function (onload, onerror, timeout, ontimeout) {
    this.request = this.create()

    if (this.request != null) {
      if (onload != null) {
        this.request.onreadystatechange = mxUtils.bind(this, function () {
          if (this.isReady() && this.acceptResponse) {
            this.acceptResponse = false
            onload(this)
            this.request.onreadystatechange = null
          }
        })
      }

      this.request.open(this.method, this.url, this.async,
        this.username, this.password)
      this.setRequestHeaders(this.request, this.params)

      if (window.XMLHttpRequest && this.withCredentials) {
        this.request.withCredentials = 'true'
      }

      if (onerror != null) {
        this.request.onerror = mxUtils.bind(this, function (e) {
          if (this.acceptResponse) {
            this.acceptResponse = false
            onerror(this, e)
          }
        })
      }

      if ((document.documentMode == null || document.documentMode > 9) &&
        window.XMLHttpRequest && timeout != null && ontimeout != null) {
        this.request.timeout = timeout
        this.request.ontimeout = ontimeout
      }

      this.request.send(this.params)
    }
  }
  // mxXmlRequest end
  mxOutput.mxXmlRequest = mxXmlRequest
}
