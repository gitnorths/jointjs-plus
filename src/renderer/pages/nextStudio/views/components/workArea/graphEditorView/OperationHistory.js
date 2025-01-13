export class HistoryStack {
  constructor (mxUndoManager) {
    // FIXME
    if (this.mxUndoManager) {
      this.mxUndoManager.clear()
    }
    this.undoStack = [] // undo数据栈
    this.redoStack = [] // redo数据栈
    this.mxUndoManager = mxUndoManager
  }

  addToHistory (actionRecord) {
    // FIXME 先不设置最大操作数
    // 历史记录超过最大值，先删除最开始的操作记录
    // if (this.undoStack.length >= this.max) {
    //   this.undoStack.shift()
    // }
    // 将记录放到undo栈里
    this.undoStack.push(actionRecord)
  }

  undo () {
    const actionRecord = this.undoStack.pop()
    if (!actionRecord) {
      return
    }
    actionRecord.undo()
    if (actionRecord.isMxUndoManaged) {
      this.mxUndoManager.undo()
    }
    this.redoStack.push(actionRecord)
    return actionRecord
  }

  redo () {
    const actionRecord = this.redoStack.pop()
    if (!actionRecord) {
      return
    }
    actionRecord.redo()
    if (actionRecord.isMxUndoManaged) {
      this.mxUndoManager.redo()
    }
    this.undoStack.push(actionRecord)
    return actionRecord
  }
}

export class ActionRecord {
  constructor (isMxUndoManaged, editData, propName, oldValue, newValue) {
    this.isMxUndoManaged = isMxUndoManaged
    this.editData = editData
    this.propName = propName
    this.oldValue = oldValue
    this.newValue = newValue
  }

  undo () {
    if (this.editData) {
      this.editData[this.propName] = this.oldValue
    }
  }

  redo () {
    if (this.editData) {
      this.editData[this.propName] = this.newValue
    }
  }
}
