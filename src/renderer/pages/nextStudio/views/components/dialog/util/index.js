import * as R from 'ramda'

export const deltaStatus = {
  Unchanged: 0, Added: 1, Changed: 2, Deleted: 3
}

export class CompareTreeNode {
  constructor () {
    this.objectHashId = ''
    this.label = ''
    this.iconClass = ''
    this.index = 0
    this.peerIndex = 0
    this.ref = ''
    this.status = deltaStatus.Unchanged
    this.moved = 0
    this.children = []
  }
}

export function generateEmptyNode (objectHashId, status, moved) {
  const emptyNode = new CompareTreeNode()
  emptyNode.objectHashId = `${objectHashId}_null`
  // emptyNode.label = emptyNode.objectHashId
  emptyNode.status = status
  emptyNode.moved = moved
  return emptyNode
}

export function findNotMovedPrevious (position, arr) {
  const previous = arr[position - 1]
  if (previous) {
    // 没有previousStatus说明该节点没发生变化。或者该节点是空节点
    if (previous.moved) {
      return findNotMovedPrevious(position - 1, arr)
    } else {
      return previous
    }
  } else {
    return null
  }
}

export function findRightNotMovedNext (currentTgtIndex, leftArr, rightArr) {
  // 在右侧数组中找出排在该位移对象后，且没有发生删除或者位移的对象p
  if (currentTgtIndex + 1 < rightArr.length) {
    const rightTargetNext = rightArr[currentTgtIndex + 1]
    // 在左侧数组中找到p对应的坐标，在该位置前面插空补位
    const srcIndexInLeftChildren = R.findIndex((node) => {
      if (rightTargetNext.objectHashId.endsWith('_null')) {
        return rightTargetNext.objectHashId === `${node.objectHashId}_null`
      } else {
        if (rightTargetNext.status === deltaStatus.Added || rightTargetNext.moved) {
          return node.objectHashId === `${rightTargetNext.objectHashId}_null`
        } else {
          return node.objectHashId === rightTargetNext.objectHashId
        }
      }
    })(leftArr)
    if (srcIndexInLeftChildren < 0) {
      return findRightNotMovedNext(currentTgtIndex + 1, leftArr, rightArr)
    } else {
      return srcIndexInLeftChildren
    }
  } else {
    return rightArr.length - 1
  }
}

export function fillEmptyArrNode (leftTreeData, rightTreeData) {
  const leftOrgArr = leftTreeData && R.isNotEmpty(leftTreeData) ? [...leftTreeData] : []
  const rightOrgArr = rightTreeData && R.isNotEmpty(rightTreeData) ? [...rightTreeData] : []

  for (let i = 0; i < leftOrgArr.length; i++) {
    const leftNode = leftOrgArr[i]

    if (leftNode.status === deltaStatus.Deleted) {
      // 左侧删除，需要找到当前节点之前没有发生位移的节点a，在右侧找到a的坐标，并在该坐标后面插入空
      const leftPreviousNotMoved = findNotMovedPrevious(i, leftTreeData)
      if (leftPreviousNotMoved) {
        const rightPosition = R.findIndex((node) => node.objectHashId === leftPreviousNotMoved.objectHashId || node.objectHashId === `${leftPreviousNotMoved.objectHashId}_null`)(rightTreeData) + 1
        rightTreeData.splice(rightPosition, 0, generateEmptyNode(leftNode.objectHashId, deltaStatus.Deleted))
      } else {
        rightTreeData.splice(0, 0, generateEmptyNode(leftNode.objectHashId, deltaStatus.Deleted))
      }
    }
  }

  for (let i = 0; i < rightOrgArr.length; i++) {
    const rightNode = rightOrgArr[i]
    if (rightNode.status === deltaStatus.Added) {
      // 右侧新增，需要在左侧数组相同坐标位置补位插空
      const currentIndex = R.findIndex((node) => (rightNode.objectHashId === node.objectHashId))(rightTreeData)
      const rightPreviousNotMoved = findNotMovedPrevious(currentIndex, rightTreeData)
      if (rightPreviousNotMoved) {
        const leftPosition = R.findIndex((node) => (rightPreviousNotMoved.objectHashId === node.objectHashId || rightPreviousNotMoved.objectHashId === `${node.objectHashId}_null` || `${rightPreviousNotMoved.objectHashId}_null` === node.objectHashId))(leftTreeData) + 1
        leftTreeData.splice(leftPosition, 0, generateEmptyNode(rightNode.objectHashId, deltaStatus.Added))
      } else {
        leftTreeData.splice(0, 0, generateEmptyNode(rightNode.objectHashId, deltaStatus.Added))
      }
    }
  }

  for (let i = 0; i < leftOrgArr.length; i++) {
    const leftNode = leftOrgArr[i]
    const correspondRightNode = R.find(R.propEq(leftNode.objectHashId, 'objectHashId'))(rightOrgArr)

    if (leftNode.moved) {
      // 数组元素发生了位移
      const movedPosition = R.findIndex(R.propEq(leftNode.objectHashId, 'objectHashId'))(rightOrgArr)
      leftNode.peerIndex = movedPosition
      correspondRightNode.peerIndex = i

      const currentSrcIndex = R.findIndex(R.propEq(leftNode.objectHashId, 'objectHashId'))(leftTreeData)
      // 在左侧数组中找出排在该位移对象前的对象q
      const leftSrcPrevious = leftTreeData[currentSrcIndex - 1]
      // 在右侧数组中找出q对应的坐标，在该位置后面插空补位
      const rightMovePosition = leftSrcPrevious
        ? R.findIndex((node) => {
        if (leftSrcPrevious.objectHashId.endsWith('_null')) {
          return leftSrcPrevious.objectHashId === `${node.objectHashId}_null`
        } else {
          if (leftSrcPrevious.status === deltaStatus.Deleted || leftSrcPrevious.moved) {
            return node.objectHashId === `${leftSrcPrevious.objectHashId}_null`
          } else {
            return node.objectHashId === leftSrcPrevious.objectHashId
          }
        }
      })(rightTreeData) + 1
        : 0
      rightTreeData.splice(rightMovePosition, 0, generateEmptyNode(leftNode.objectHashId, deltaStatus.Unchanged, 1))

      const currentTgtIndex = R.findIndex(R.propEq(leftNode.objectHashId, 'objectHashId'))(rightTreeData)
      const leftMovePosition = findRightNotMovedNext(currentTgtIndex, leftTreeData, rightTreeData)
      leftTreeData.splice(leftMovePosition, 0, generateEmptyNode(correspondRightNode.objectHashId, deltaStatus.Unchanged, 1))
    }
  }

  for (let i = 0; i < Math.max(leftTreeData.length, rightTreeData.length); i++) {
    const leftChildren = leftTreeData[i] ? leftTreeData[i].children : []
    const rightChildren = rightTreeData[i] ? rightTreeData[i].children : []
    fillEmptyArrNode(leftChildren, rightChildren)
  }
}

/*
* delta._t = 'a' 代表左右两边的数据都是数组类型：下划线+数字下标代表删除或者位移；直接数字下标代表新建或者删除
*   delta._1 = [leftValue, 0, 0] 最后一个0代表左侧有数据删除
*   delta._2 = [leftValue, 1, 3] 最后一个3代表左侧有数据坐标发生变化，1代表新的坐标
*   delta.3  = [rightValue] 右侧有数据新增
*   delta.4  = {propName:[leftValue,rightValue]}代表数据的某个属性发生变化
* delta[propName] 代表左右两边都是对象：
*   delta[propName] = [newValue] 右侧对象新增属性
*   delta[propName] = [oldValue, newValue] 对象属性发生变化
*   delta[propName] = [oldValue, 0, 0] 对象删除属性
*/

function recursiveDelta (obj, status) {
  Object.keys(obj)
    .filter(key => key !== '_status' && key !== '_propStatus')
    .forEach(key => {
      const val = obj[key]
      if (val instanceof Array) {
        const propStatus = obj._propStatus || {}
        const propStatusObj = propStatus[key] || { status: deltaStatus.Unchanged, moved: 0 }
        propStatusObj.status = status
        propStatus[key] = propStatusObj
        obj._propStatus = propStatus
        val.forEach(item => {
          if (item instanceof Object) {
            const statusObj = item._status || { status: deltaStatus.Unchanged, moved: 0 }
            statusObj.status = status
            item._status = statusObj
            recursiveDelta(item, status)
          }
        })
      } else if (val instanceof Object) {
        const statusObj = val._status || { status: deltaStatus.Unchanged, moved: 0 }
        statusObj.status = status
        val._status = statusObj
        recursiveDelta(val, status)
      } else {
        const propStatus = obj._propStatus || {}
        const propStatusObj = propStatus[key] || { status: deltaStatus.Unchanged, moved: 0 }
        propStatusObj.status = status
        propStatus[key] = propStatusObj
        obj._propStatus = propStatus
      }
    })
}

function genChangeStatusMap (compareResult, objHashFunc) {
  const { left, right, delta } = compareResult
  const leftPropStatus = left._propStatus || {}
  left._propStatus = leftPropStatus
  const rightPropStatus = right._propStatus || {}
  right._propStatus = rightPropStatus

  Object.keys(delta)
    .filter(key => key !== '_status' && key !== '_propStatus')
    .forEach(key => {
      const leftPropStatusObj = leftPropStatus[key] || { status: deltaStatus.Unchanged, moved: 0 }
      leftPropStatus[key] = leftPropStatusObj
      const rightPropStatusObj = rightPropStatus[key] || { status: deltaStatus.Unchanged, moved: 0 }
      rightPropStatus[key] = rightPropStatusObj

      const keyDelta = delta[key]
      if (keyDelta instanceof Array) {
        if (keyDelta.length === 1) {
          rightPropStatusObj.status = deltaStatus.Added
          if (right[key] && right[key] instanceof Object) {
            recursiveDelta(right[key], deltaStatus.Added)
          }
        } else if (keyDelta.length === 2) {
          leftPropStatusObj.status = deltaStatus.Changed
          rightPropStatusObj.status = deltaStatus.Changed
          genStatusMap({ left: left[key], right: right[key], delta: delta[key] }, objHashFunc)
        } else if (keyDelta.length === 3) {
          if (keyDelta[2] === 0) {
            leftPropStatusObj.status = deltaStatus.Deleted
            if (left[key] && left[key] instanceof Object) {
              recursiveDelta(left[key], deltaStatus.Deleted)
            }
          } else if (keyDelta[2] === 2) { // 2 is the magical number that indicates "text diff"
            leftPropStatusObj.status = deltaStatus.Changed
            rightPropStatusObj.status = deltaStatus.Changed
          }
        }
      } else {
        leftPropStatusObj.status = deltaStatus.Changed
        rightPropStatusObj.status = deltaStatus.Changed
        genStatusMap({ left: left[key], right: right[key], delta: delta[key] }, objHashFunc)
      }
    })
}

export function genStatusMap (compareResult, objHashFunc) {
  const { delta, left, right } = compareResult
  if (!delta) {
    // 左右没有差异
    return
  }
  // delta为数组，代表left和right中有一个是空
  // [left, null] 遍历所有属性为对象的节点都设置为deleted
  // [null, right] 遍历所有属性为对象的节点都设置为added
  if (delta instanceof Array) {
    if (left && left instanceof Object && !right) {
      const statusObj = left._status || { status: deltaStatus.Unchanged, moved: 0 }
      statusObj.status = deltaStatus.Deleted
      left._status = statusObj
      recursiveDelta(left, deltaStatus.Deleted)
    } else if (!left && right && right instanceof Object) {
      const statusObj = right._status || { status: deltaStatus.Unchanged, moved: 0 }
      statusObj.status = deltaStatus.Added
      right._status = statusObj
      recursiveDelta(right, deltaStatus.Added)
    }
  } else {
    if (delta._t === 'a') {
      // left和right为数组类型
      if (R.isNotEmpty(left)) {
        left.forEach((leftEle, index) => {
          const leftDelta = delta[`_${index}`]
          if (leftDelta && leftDelta instanceof Array) {
            if (leftEle instanceof Object) {
              const statusObj = leftEle._status || { status: deltaStatus.Unchanged, moved: 0 }
              if (leftDelta[2] === 0) {
                statusObj.status = deltaStatus.Deleted
                recursiveDelta(leftEle, deltaStatus.Deleted)
              } else {
                statusObj.moved = 1
                // 找到right的同一节点
                const correspondRight = R.find((rightEle) => objHashFunc(rightEle) === objHashFunc(leftEle))(right)
                const rightStatusObj = correspondRight._status || { status: deltaStatus.Unchanged, moved: 0 }
                rightStatusObj.moved = 1
                correspondRight._status = rightStatusObj
              }
              leftEle._status = statusObj
            }
          }
        })
      }
      if (R.isNotEmpty(right)) {
        right.forEach((rightEle, index) => {
          const rightDelta = delta[`${index}`]
          if (rightDelta) {
            if (rightEle instanceof Object) {
              const statusObj = rightEle._status || { status: deltaStatus.Unchanged, moved: 0 }
              if (rightDelta instanceof Array) {
                statusObj.status = deltaStatus.Added
                recursiveDelta(rightEle, deltaStatus.Added)
              } else {
                statusObj.status = deltaStatus.Changed
                const correspondLeft = R.find((leftEle) => objHashFunc(leftEle) === objHashFunc(rightEle))(left)
                const leftStatusObj = correspondLeft._status || { status: deltaStatus.Unchanged, moved: 0 }
                leftStatusObj.status = deltaStatus.Changed
                correspondLeft._status = leftStatusObj
                genChangeStatusMap({ left: correspondLeft, right: rightEle, delta: rightDelta }, objHashFunc)
              }
              rightEle._status = statusObj
            }
          }
        })
      }
    } else {
      // left 和 right均为对象，且属性发生变化
      const leftStatusObj = left._status || { status: deltaStatus.Unchanged, moved: 0 }
      leftStatusObj.status = deltaStatus.Changed
      left._status = leftStatusObj
      const rightStatusObj = right._status || { status: deltaStatus.Unchanged, moved: 0 }
      rightStatusObj.status = deltaStatus.Changed
      right._status = rightStatusObj
      genChangeStatusMap({ left, right, delta }, objHashFunc)
    }
  }
}
