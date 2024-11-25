export class DebugSignal {
  constructor (na) {
    this.na = na // 短地址 BXX[n:n].XXX.XXX
    this.deviceNa = '' // 计算后的短地址 BXX.XXX.XXX
    this.type = '' // 变量类型
    this.format = '' // 显示格式
    this.connectStatus = '' // 当前信号的连接状态
    this.relateList = new Set() // 当前信号被关联的业务id
    this.debugGetValue = '' // 装置上送值
    this.debugSetValue = '' // 设置值，如果设置成功会添加到history后制空；
    this.modified = false // 是否被修改
    this.oldValue = '' // 第一次修改前的值，用于回滚
    this.history = [] // 修改历史记录
    this.records = [] // 录波记录，实时显示使用
    this.annotation = '' // 用户对信号的注解
  }

  addToRecords (record) {
    if (this.records.length < 20) {
      this.records.push(record)
    } else {
      this.records.shift()
      this.records.push(record)
    }
  }
}

export const ConnectStatus = {
  CLOSED: 0,
  OPENED: 1,
  OPENING: 2,
  CLOSING: 3
}
