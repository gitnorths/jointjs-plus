import { Message } from 'element-ui'
import logger from '@/renderer/common/logger'
import * as R from 'ramda'

const openNotification = (duration, type, message, closeHandler) => {
  Message[type]({
    duration,
    message,
    showClose: true,
    onClose: closeHandler
  })
}
const curryOpenNotification = R.curry(openNotification)

const openAutoCloseNotification = curryOpenNotification(2000)
const openInfoNotification = openAutoCloseNotification('info')
const openSuccessNotification = openAutoCloseNotification('success')
const openWarningNotification = openAutoCloseNotification('warning')
const openErrorNotification = openAutoCloseNotification('error')

const Notification = {
  openInfoNotification (message = '信息', closeHandler = undefined) {
    setTimeout(() => openInfoNotification(message, closeHandler))
    return {
      logger: () => {
        logger.info(message)
      }
    }
  },
  openSuccessNotification (message = '成功', closeHandler) {
    setTimeout(() => openSuccessNotification(message, closeHandler))
    return {
      logger: () => {
        logger.info(message)
      }
    }
  },
  openWarningNotification (message = '警告', closeHandler) {
    setTimeout(() => openWarningNotification(message, closeHandler))
    return {
      logger: () => {
        logger.warn(message)
      }
    }
  },
  openErrorNotification (message = '失败', closeHandler) {
    setTimeout(() => openErrorNotification(message, closeHandler))
    return {
      logger: () => {
        logger.error(message)
      }
    }
  }
}

export default Notification
