import * as R from 'ramda'
import { CompareTreeNode, deltaStatus, fillEmptyArrNode, genStatusMap } from './index'
import { objHashFunc } from './cfgCompareUtil'

function generateCfgNode (refObj, propName, index, parentObjectHashId, propStatus, ignoreKeys) {
  const propNode = new CompareTreeNode()
  const objHashId = refObj instanceof Array || !(refObj instanceof Object) ? parentObjectHashId ? `${parentObjectHashId}>${propName || refObj}` : `${propName || refObj}` : objHashFunc(refObj)
  propNode.objectHashId = objHashId
  propNode.index = index
  propNode.ref = refObj
  propNode.label = propName || `${objHashId}`
  if (R.isNotNil(refObj)) {
    if (!(refObj instanceof Object)) {
      propNode.label = propName ? `${propName} : ${refObj}` : `${refObj}`
    } else if (R.isNotNil(refObj.targets)) {
      propNode.label = `${refObj.targets.join(',')}`
    }
    if (refObj instanceof Array) {
      refObj.forEach((item, itemIndex) => {
        const childNode = generateCfgNode(item, null, itemIndex, objHashId, refObj._propStatus, ignoreKeys)
        propNode.children.push(childNode)
      })
    } else if (refObj instanceof Object) {
      Object.keys(refObj)
        .filter(key => key !== '_status' && key !== '_propStatus' && (!ignoreKeys || !ignoreKeys.includes(key)))
        .forEach(key => {
          const childNode = generateCfgNode(refObj[key], key, null, objHashId, refObj._propStatus, ignoreKeys)
          propNode.children.push(childNode)
        })
    }
  }
  const statusObj = propStatus && propName
    ? propStatus[propName] || { status: deltaStatus.Unchanged, moved: 0 }
    : refObj
      ? refObj._status || { status: deltaStatus.Unchanged, moved: 0 }
      : { status: deltaStatus.Unchanged, moved: 0 }
  if (statusObj) {
    propNode.status = statusObj.status
    propNode.moved = statusObj.moved
  }

  return propNode
}

function generateTreeData (obj, ignoreKeys) {
  let treeData = []
  if (obj) {
    if (obj instanceof Array) {
      treeData = obj.map((variable, index) => generateCfgNode(variable, null, index, null, null, ignoreKeys))
    } else if (obj instanceof Object) {
      treeData = Object.keys(obj)
        .filter(key => key !== '_propStatus' && key !== '_status')
        .sort((a, b) => a > b ? 1 : -1)
        .map((key) => generateCfgNode(obj[key], key, null, null, obj._propStatus, ignoreKeys))
    }
  }
  return treeData
}

function formTreeTableData (leftTreeData, rightTreeData) {
  const tableData = []
  for (let i = 0; i < Math.max(leftTreeData.length, rightTreeData.length); i++) {
    const left = leftTreeData[i]
    const right = rightTreeData[i]
    const leftChildren = left ? left.children : []
    const rightChildren = right ? right.children : []

    const children = formTreeTableData(leftChildren, rightChildren)

    tableData.push({ left, right, children })
  }
  return tableData
}

// variable差异数据
export function generateDiffData (compareResult, ignoreKeys) {
  genStatusMap(compareResult, objHashFunc)

  const { left, right } = compareResult
  const leftTreeData = generateTreeData(left, ignoreKeys)
  const rightTreeData = generateTreeData(right, ignoreKeys)

  fillEmptyArrNode(leftTreeData, rightTreeData)
  return formTreeTableData(leftTreeData, rightTreeData)
}
