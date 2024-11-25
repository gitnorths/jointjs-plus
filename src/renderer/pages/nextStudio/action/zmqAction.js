import * as net from 'net'
import * as R from 'ramda'
import { v4 as uuid } from 'uuid'
import { MessageBox } from 'element-ui'
import store from '@/renderer/pages/nextStudio/store'
import { ConnectStatus, DebugSignal } from '@/renderer/pages/nextStudio/model/DebugSignal'
import { getObjContext } from '@/renderer/pages/nextStudio/action/station'
import VBus from '@/renderer/common/vbus'
import logger from '@/renderer/common/logger'
import notification from '@/renderer/common/notification'
import { openSaveDialog, openWindowDialog } from '@/renderer/common/action'
import { getFirstPath } from '@/renderer/common/util'
import * as fse from 'fs-extra'
import * as path from 'path'
import * as iconv from 'iconv-lite'
import { dateToTime } from 'influx/lib/src/grammar'
import { ipcRenderer } from 'electron'
import { Precision } from 'influx'
import { NextStudioService } from '@/service/NextStudioService'
import { format10 } from '@/util'

const zmq = require('zeromq')

const DEFAULT_TCP_PORT = 62002

const MAX_DEVICE_SIGNAL_NUM = 100
const MAX_BOARD_SIGNAL_NUM = 20

function formatReqStr (obj) {
  return JSON.stringify(obj, null, 4)
}

// 打开信号
export const openDebugSignal = async (na) => {
  // 校验是否已经达到限制
  const openedSignalsMap = store.getters.openedSignals
  const allOpenedSignals = openedSignalsMap
    ? Object.values(openedSignalsMap).filter((debugSignal) => debugSignal.connectStatus !== ConnectStatus.CLOSED)
    : []

  if (allOpenedSignals.length >= MAX_DEVICE_SIGNAL_NUM) {
    notification.openWarningNotification(`装置连接数已满[${MAX_DEVICE_SIGNAL_NUM}]，请先关闭一些信号！`).logger()
    return
  } else {
    const naSlot = /^B\d{2}/.exec(na)[0]
    const boardOpenedSignals = allOpenedSignals.filter(sig => sig.na.startsWith(naSlot))
    if (boardOpenedSignals && boardOpenedSignals.length >= MAX_BOARD_SIGNAL_NUM) {
      notification.openWarningNotification(`板卡${naSlot}连接数已满[${MAX_BOARD_SIGNAL_NUM}]，请先关闭一些信号！`).logger()
      return
    }
  }
  // 寻找已经打开的信号
  const existSignal = store.getters.na2DebugSignal(na)
  // 信号添加到store
  const toOpenSignal = existSignal || new DebugSignal(na)
  toOpenSignal.connectStatus = ConnectStatus.OPENING
  if (!existSignal) {
    // 新建的信号需要构造deviceNa
    const naPrefixMap = store.getters.naPrefixMap
    const debugBoardType = store.getters.debugBoardType
    const regEx = /^B\d+\[\d+:\d+]/
    if (regEx.test(na)) {
      const prefix = na.match(regEx)[0]
      // naPrefixMap是一个关联类型的对象
      const naPrefixTypeMap = naPrefixMap.get(prefix)
      const boardSlot = na.match(/^B\d+/)[0]
      const newPrefix = naPrefixTypeMap[debugBoardType[boardSlot]]
      toOpenSignal.deviceNa = newPrefix ? na.replace(regEx, newPrefix) : na
    } else {
      toOpenSignal.deviceNa = na
    }
  }

  const debugAddress = store.getters.debugAddress

  const req = new zmq.Request()
  req.connect(debugAddress)
  try {
    const openReqData = formatReqStr({
      msg_type: 'OPEN_DEBUG_VAR_REQ',
      msg_data: { var_name: toOpenSignal.deviceNa, client_id: store.getters.clientId }
    })

    await req.send(openReqData)

    const [result] = await req.receive()
    const str = result.toString()
    const { msg_type, ret_data } = JSON.parse(str)
    if (msg_type === 'OPEN_DEBUG_VAR_RET') {
      const { ret } = ret_data
      if (ret === 0) {
        toOpenSignal.connectStatus = ConnectStatus.OPENED
        toOpenSignal.type = ret_data.type
        toOpenSignal.format = ret_data.format
        notification.openSuccessNotification(`成功打开信号：${toOpenSignal.na}！`).logger()
        store.commit('addToOpenedSignals', toOpenSignal)
        VBus.$emit('REFRESH_OPENED_SIGNALS')
      } else {
        // 信号状态改为关闭
        toOpenSignal.connectStatus = ConnectStatus.CLOSED
        notification.openErrorNotification(`信号 ${toOpenSignal.na} 打开失败！`).logger()
      }
    }
    return toOpenSignal
  } catch (e) {
    notification.openErrorNotification(`信号 ${toOpenSignal.na} 打开失败！${e}`).logger()
  } finally {
    req.disconnect(debugAddress)
  }
}

// 关闭信号
const closeDebugVar = async (openedSignal) => {
  notification.openInfoNotification(`关闭信号：${openedSignal.na}中...`)
  openedSignal.connectStatus = ConnectStatus.CLOSING

  const debugAddress = store.getters.debugAddress
  const req = new zmq.Request()
  req.connect(debugAddress)
  try {
    const closeReqData = formatReqStr({
      msg_type: 'CLOSE_DEBUG_VAR_REQ',
      msg_data: { var_name: openedSignal.deviceNa, client_id: store.getters.clientId }
    })

    await req.send(closeReqData)

    const [result] = await req.receive()
    const str = result.toString()
    const { msg_type, ret_data } = JSON.parse(str)
    if (msg_type === 'CLOSE_DEBUG_VAR_RET') {
      if (ret_data.ret === 0) {
        openedSignal.connectStatus = ConnectStatus.CLOSED
        notification.openSuccessNotification(`成功关闭信号：${openedSignal.na}！`).logger()
        store.commit('removeFromOpenedSignals', openedSignal.na)
        VBus.$emit('REFRESH_OPENED_SIGNALS')
      } else {
        openedSignal.connectStatus = ConnectStatus.OPENED
        notification.openErrorNotification(`信号 ${openedSignal.na} 关闭失败！`).logger()
      }
    } else {
      notification.openErrorNotification(`信号 ${openedSignal.na} 关闭失败！${str}`).logger()
    }
  } catch (e) {
    notification.openErrorNotification(`信号 ${openedSignal.na} 关闭失败！${e}`).logger()
  } finally {
    req.disconnect(debugAddress)
  }
}

export const setDebugSignalValue = async (openedSignal, fromQuit = false) => {
  if (!fromQuit) {
    notification.openInfoNotification(`设置信号 ${openedSignal.na} 的变量值...`)
  }
  // 查看是否是回滚操作的信号
  const toCloseSignal = store.getters.deviceNa2CloseSignal(openedSignal.deviceNa)
  const debugAddress = store.getters.debugAddress
  const req = new zmq.Request()
  req.connect(debugAddress)

  try {
    const setValueReqData = formatReqStr({
      msg_type: 'MODIFY_DEBUG_VAR_REQ',
      msg_data: {
        var_name: openedSignal.deviceNa,
        value: openedSignal.debugSetValue,
        client_id: store.getters.clientId
      }
    })

    await req.send(setValueReqData)

    const [result] = await req.receive()
    const str = result.toString()
    const { msg_type, ret_data } = JSON.parse(str)
    if (msg_type === 'MODIFY_DEBUG_VAR_RET') {
      if (ret_data.ret === 0) {
        openedSignal.history.push({ value: openedSignal.debugSetValue, date: Date.now() })
        openedSignal.debugSetValue = null

        if (toCloseSignal) {
          const message = `成功回滚信号：${openedSignal.na}！`
          if (!fromQuit) {
            notification.openSuccessNotification(message).logger()
          } else {
            logger.info(message)
          }
          await closeDebugVar(toCloseSignal)
        } else {
          notification.openSuccessNotification(`成功修改信号：${openedSignal.na}！`).logger()
        }
      } else {
        notification.openErrorNotification(`信号 ${openedSignal.na} ${openedSignal ? '修改' : '回退'}失败！` + openedSignal.debugSetValue).logger()
      }
    } else {
      notification.openErrorNotification(`信号 ${openedSignal.na} ${openedSignal ? '修改' : '回退'}失败！` + str).logger()
    }
  } catch (e) {
    notification.openErrorNotification(`信号 ${openedSignal.na} ${openedSignal ? '修改' : '回退'}失败！` + e).logger()
  } finally {
    req.disconnect(debugAddress)
  }
}

// 关闭信号
export const closeDebugSignal = async (openedSignal) => {
  if (openedSignal.modified || (openedSignal.history && openedSignal.history.length > 0)) {
    // 信号修改过，提示用户回退
    try {
      await MessageBox.confirm('当前信号被修改过，需要先回退修改记录', '提示', {
        distinguishCancelAndClose: true,
        confirmButtonText: '回退',
        cancelButtonText: '不回退',
        type: 'warning',
        center: true
      })
      openedSignal.debugSetValue = openedSignal.oldValue
      // 加入回退
      store.commit('addToCloseSignals', openedSignal)
      await setDebugSignalValue(openedSignal)
    } catch (action) {
      if (action === 'cancel') {
        await closeDebugVar(openedSignal)
        return
      } else if (action === 'close') {
        return
      }
      notification.openErrorNotification(`信号 ${openedSignal.na} 回退失败！请检查错误日志`).logger()
    } finally {
      store.commit('removeFromCloseSignals', openedSignal.deviceNa)
    }
  } else {
    await closeDebugVar(openedSignal)
  }
}

export const enterDebugMode = async () => {
  // 校验是否所有内容都已经保存
  const tagDeltaExist = store.getters.tagDeltaExist
  if (tagDeltaExist) {
    try {
      await MessageBox.confirm('需要先保存工程，是否继续？', '提示', {
        confirmButtonText: '保存',
        cancelButtonText: '取消',
        type: 'warning',
        center: true
      })
      await store.dispatch('saveAll')
    } catch (action) {
      if (action === 'cancel') {
        return
      }
      notification.openErrorNotification('工程保存失败!请检查错误日志').logger()
      return
    }
  }
  VBus.$emit('OPEN_CONNECT_DEVICE_DIALOG')
}

// 打开保存的信号列表
export const openSignalFile = () => {
  const deviceDbPath = store.getters.deviceDbPath
  openWindowDialog({
    title: '导入信号调试文件',
    defaultPath: path.join(deviceDbPath, '../debugSignals.csv'),
    properties: ['openFile'],
    filters: [{ name: 'debugSignals', extensions: ['csv', 'txt'] }]
  }).then((openDialogReturnValue) => {
    const filePath = getFirstPath(openDialogReturnValue.filePaths)
    if (filePath) {
      const fileContent = fse.readFileSync(filePath)
      if (/\.txt$/.test(filePath)) {
        // 原有txt文件用utf-8编码
        const arr = fileContent.toString().trim().split(/\r?\n/)
        // arr需要先去重，并且识别BXX.XX.XX格式
        // FIXME 短地址中文校验
        // .filter(str => /B(0[1-9]|[1-9][0-9])(\[([1-9]|[1-9][0-9])+:([1-9]|[1-9][0-9])+])?\.\w+\.\w+/.test(str))
        const debugArr = R.uniq(arr).map(str => ({ na: str }))

        store.commit('setWatchedSignals', debugArr)
      } else {
        // csv文件用GB2312
        const decodeContent = iconv.decode(fileContent, 'GB2312')
        const arr = decodeContent.trim().split(/\r?\n/).map(str => {
          const splitArr = str.split(',')
          return { na: splitArr[0].trim(), annotation: splitArr[1] ? splitArr[1].trim() : '' }
        })
        // arr需要先去重，并且识别BXX.XX.XX格式
        // FIXME 短地址中文校验
        // const debugArr = R.uniqBy(R.prop('na'), arr).filter(obj => /B(0[1-9]|[1-9][0-9])(\[([1-9]|[1-9][0-9])+:([1-9]|[1-9][0-9])+])?\.\w+\.\w+/.test(obj.na));
        const debugArr = R.uniqBy(R.prop('na'), arr)
        store.commit('setWatchedSignals', debugArr)
      }
      notification.openSuccessNotification('调试列表导入成功').logger()
    }
  }).catch(e => {
    notification.openErrorNotification('调试列表导入失败: ' + e).logger()
  })
}
// 保存信号列表
export const exportSignalFile = () => {
  const deviceDbPath = store.getters.deviceDbPath
  openSaveDialog({
    title: '导出信号调试文件',
    defaultPath: path.join(deviceDbPath, '../debugSignals.csv'),
    properties: ['showOverwriteConfirmation'],
    filters: [{ name: '*.csv', extensions: ['csv'] }]
  }).then((saveFilePath) => {
    if (saveFilePath.filePath) {
      const watchedSignals = store.getters.watchedSignals
      const content = iconv.encode(watchedSignals.map(row => row.na + ', ' + row.annotation || '').join('\r\n'), 'GB2312')
      fse.writeFileSync(saveFilePath.filePath, content)
      notification.openSuccessNotification('调试列表导出成功').logger()
    }
  }).catch(e => {
    notification.openErrorNotification('调试列表导出失败: ' + e).logger()
  })
}
// 连接装置
export const connectDevice = async (ipV4Address, debugBoardType) => {
  store.commit('setDeviceConnecting', true)
  // 校验ip地址是否可以建立连接
  const netSocket = net.createConnection({ port: DEFAULT_TCP_PORT, host: ipV4Address })
  netSocket.on('ready', async () => {
    store.commit('setDeviceConnecting', false)
    notification.openSuccessNotification('装置连接成功').logger()

    const debugAddress = `tcp://${ipV4Address}:${DEFAULT_TCP_PORT}`

    // 获取装置实际使用的板卡型号信息
    const optBoardReq = new zmq.Request()
    optBoardReq.connect(debugAddress)
    try {
      const optBoardReqData = formatReqStr({ msg_type: 'READ_DEVICE_STATUS_REQ', msg_data: {} })
      await optBoardReq.send(optBoardReqData)

      const [result] = await optBoardReq.receive()
      const str = result.toString()
      const optBoardResp = JSON.parse(str)
      if (optBoardResp.msg_type === 'READ_DEVICE_STATUS_RET') {
        const { board_type } = optBoardResp.ret_data
        const boardType = {}
        Object.keys(board_type).forEach(slot => {
          if (slot) {
            boardType[`B${format10(Number(slot))}`] = board_type[slot]
          }
        })
        store.commit('setDebugBoardType', boardType)
      } else {
        // 旧平台获取不到
        if (debugBoardType) {
          // 用户指定boardType
          store.commit('setDebugBoardType', debugBoardType)
        } else {
          const debugType = {}
          let optBoardNum = 0
          const device = store.getters.device
          // 记录每个槽的当前板卡类型
          const rack = await getObjContext(device.hardware)
          rack.boards.forEach(board => {
            if (board.type && board.optList) {
              const withoutNoneList = board.optList.filter(optType => !/None/i.test(optType))
              if (withoutNoneList.length > 1) {
                optBoardNum++
              }
              debugType[`B${format10(board.slot)}`] = !/None/i.test(board.type) ? board.type : withoutNoneList[0]
            }
          })
          if (optBoardNum > 0) {
            notification.openWarningNotification('无法读取当前装置使用的板卡类型信息，需要手动指定可选板卡的型号').logger()
            VBus.$emit('SHOW_OPT_BOARD_SELECT')
            return
          } else {
            store.commit('setDebugBoardType', debugType)
          }
        }
      }
    } catch (e) {
      notification.openErrorNotification('板卡类型获取失败' + e).logger()
    } finally {
      netSocket.destroy()
      optBoardReq.disconnect(debugAddress)
    }

    const clientId = uuid()
    const reqData = formatReqStr({ msg_type: 'QUERY_DEBUG_VAR_REQ', msg_data: { client_id: clientId } })

    const queryReq = new zmq.Request({ receiveTimeout: 5000 })
    queryReq.connect(debugAddress)
    const timer = setInterval(async () => {
      try {
        await queryReq.send(reqData)
        const [result] = await queryReq.receive()
        const str = result.toString()
        const dateNow = new Date(Date.now())
        const timestamp = dateToTime(dateNow, Precision.Milliseconds)
        const resp = JSON.parse(str)
        const { msg_type, ret_data } = resp
        if (msg_type === 'QUERY_DEBUG_VAR_RET') {
          const { var_list } = ret_data
          const varList = Object.keys(var_list)
          if (varList && R.isNotEmpty(varList)) {
            const recordStatus = store.getters.recordStatus
            const influxClient = store.getters.influxClient
            const points = []
            varList.forEach(varName => {
              const openedSignal = store.getters.deviceNa2DebugSignal(varName)
              if (openedSignal) {
                const { value, old_value, modified } = var_list[varName]
                openedSignal.debugGetValue = value
                openedSignal.oldValue = old_value
                openedSignal.modified = modified
                openedSignal.addToRecords([dateNow.toISOString(), value])
                const watchedSignal = store.getters.na2WatchedSignals(openedSignal.na)
                openedSignal.annotation = watchedSignal ? watchedSignal.annotation : ''

                if (recordStatus) {
                  points.push({
                    measurement: varName,
                    tags: { na: openedSignal.na, deviceNa: openedSignal.deviceNa },
                    fields: {
                      value,
                      type: openedSignal.type,
                      format: openedSignal.format,
                      annotation: openedSignal.annotation
                    },
                    timestamp
                  })
                }
              }
            })
            ipcRenderer.send('zeroMq:queryDebugVarRet', store.getters.openedSignals())
            if (recordStatus) {
              influxClient.writePoints(points).catch(e => {
                notification.openErrorNotification('influxd服务写入异常！' + e).logger()
                notification.openWarningNotification('influxd停止写入').logger()
                store.commit('setRecordStatus', false)
              })
            }
          }
          const currentGraph = store.getters.currentGraph
          if (currentGraph) {
            currentGraph.refresh()
          }
        }
      } catch (e) {
        if (/Socket is busy writing; only one send operation may be in progress at any time/.test(e)) {
          logger.warn('变量查询繁忙' + e)
        } else if (/Operation was not possible or timed out/.test(e)) {
          notification.openErrorNotification('变量查询超时，5秒内未接收到装置侧响应，退出调试模式！').logger()
          store.commit('stopDebugMode')
        } else {
          notification.openErrorNotification('变量查询未知错误，退出调试模式！' + e).logger()
          store.commit('stopDebugMode')
        }
      }
    }, 1000)

    store.commit('startDebugMode', { debugAddress, clientId, queryReq, timer })
    // 短地址前缀映射
    const naMap = await NextStudioService.getNaPrefixMap()
    store.commit('setNaPrefixMap', naMap)

    VBus.$emit('CLOSE_CONNECT_DEVICE_DIALOG')
    VBus.$emit('OPEN_WATCH_DIALOG')
  })

  netSocket.on('error', (err) => {
    store.commit('setDeviceConnecting', false)
    if (/ECONNREFUSED/.test(err.message)) {
      notification.openErrorNotification(`装置连接失败！${ipV4Address} 拒绝访问，请检查IP地址等网络配置！`).logger()
    } else {
      notification.openErrorNotification('装置连接失败' + err).logger()
    }
  })
}

export const quitDebugMode = async () => {
  const openedSignalMap = store.getters.openedSignals
  // 提示用户回退
  const allSignals = openedSignalMap ? Object.values(openedSignalMap) : []
  const modifiedSignals = allSignals.filter(sig => sig.modified) || []
  if (modifiedSignals && R.isNotEmpty(modifiedSignals)) {
    // 信号修改过，提示用户回退
    try {
      await MessageBox.confirm('存在信号被修改过，需要先回退修改记录', '提示', {
        distinguishCancelAndClose: true,
        confirmButtonText: '回退',
        cancelButtonText: '不回退',
        type: 'warning',
        center: true
      })
      for (const sig of modifiedSignals) {
        sig.debugSetValue = sig.oldValue
        // 回退可能出错
        await setDebugSignalValue(sig, true)
      }
      store.commit('stopDebugMode')
    } catch (action) {
      if (action === 'cancel') {
        store.commit('stopDebugMode')
        return
      } else if (action === 'close') {
        return
      }
      notification.openErrorNotification('调试模式退出失败！请检查错误日志' + action).logger()
    }
  }
  store.commit('stopDebugMode')
}
