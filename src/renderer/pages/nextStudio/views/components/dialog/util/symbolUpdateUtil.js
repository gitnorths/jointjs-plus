import * as R from 'ramda'
import {
  CompareTreeNode,
  deltaStatus,
  fillEmptyArrNode,
  genStatusMap
} from '@/renderer/pages/nextStudio/views/components/dialog/util/index'

const objHashFunc = (obj) => {
  if (obj.pathId) {
    return obj.pathId
  }
}

export function generateTreeData (pkgCompareResult) {
  const leftTreeData = []
  const rightTreeData = []
  for (const { orgPkg, newPkg, delta } of pkgCompareResult) {
    // 缓存pathId对应节点的编辑状态 Added/Changed/Moved/Deleted
    genStatusMap({ delta, left: orgPkg, right: newPkg }, objHashFunc)
    // 将pkg转成树结构
    if (orgPkg) {
      const leftPkgNode = generatePkgNode(orgPkg)
      leftTreeData.push(leftPkgNode)
    }
    if (newPkg) {
      const rightPkgNode = generatePkgNode(newPkg)
      rightTreeData.push(rightPkgNode)
    }
  }
  fillEmptyArrNode(leftTreeData, rightTreeData)
  return { leftTreeData, rightTreeData }
}

function generatePkgNode (pkg) {
  const pkgNode = new CompareTreeNode()
  pkgNode.ref = pkg
  pkgNode.objectHashId = pkg.pathId
  pkgNode.label = pkg.name + (pkg.describe ? ` (${pkg.describe})` : '')
  pkgNode.iconClass = 'fa fa-box-archive'
  pkgNode.status = pkg._status ? pkg._status.status : deltaStatus.Unchanged
  pkgNode.moved = pkg._status ? pkg._status.moved : 0
  pkgNode.disabled = true

  if (R.isNotEmpty(pkg.groups)) {
    pkg.groups.forEach((group, grpIndex) => {
      const groupNode = new CompareTreeNode()
      groupNode.ref = group
      groupNode.objectHashId = group.pathId
      groupNode.label = group.name + (group.describe ? ` (${group.describe})` : '')
      groupNode.index = grpIndex
      groupNode.iconClass = 'fa fa-folder'
      groupNode.status = group._status ? group._status.status : deltaStatus.Unchanged
      groupNode.moved = group._status ? group._status.moved : 0
      groupNode.disabled = true

      pkgNode.children.push(groupNode)

      if (R.isNotEmpty(group.funcBlocks)) {
        group.funcBlocks.forEach((vfb, vfbIndex) => {
          const vfbNode = new CompareTreeNode()
          vfbNode.ref = vfb
          vfbNode.objectHashId = vfb.pathId
          vfbNode.label = vfb.name
          vfbNode.index = vfbIndex
          vfbNode.iconClass = 'fa fa-cube'
          vfbNode.status = vfb._status ? vfb._status.status : deltaStatus.Unchanged
          vfbNode.moved = vfb._status ? vfb._status.moved : 0

          vfbNode.children.push(...generateSymbolNode(vfb))

          groupNode.children.push(vfbNode)
        })
      }
    })
  }
  return pkgNode
}

function generateSymbolNode (symbolBlock) {
  const inputNode = new CompareTreeNode()
  inputNode.ref = symbolBlock.inputs
  inputNode.objectHashId = symbolBlock.pathId + '.inputs'
  inputNode.label = '输入列表'
  inputNode.iconClass = 'fa fa-sign-in'
  inputNode.status = symbolBlock._propStatus && symbolBlock._propStatus.inputs ? symbolBlock._propStatus.inputs.status : deltaStatus.Unchanged
  inputNode.disabled = true
  if (R.isNotEmpty(symbolBlock.inputs)) {
    symbolBlock.inputs.forEach((input, index) => {
      const treeNode = new CompareTreeNode()
      treeNode.ref = input
      treeNode.label = input.name
      treeNode.objectHashId = input.pathId
      treeNode.index = index
      treeNode.iconClass = ''
      treeNode.status = input._status ? input._status.status : deltaStatus.Unchanged
      treeNode.moved = input._status ? input._status.moved : 0
      inputNode.children.push(treeNode)
    })
  }

  const outputNode = new CompareTreeNode()
  outputNode.ref = symbolBlock.outputs
  outputNode.objectHashId = symbolBlock.pathId + '.outputs'
  outputNode.label = '输出列表'
  outputNode.iconClass = 'fa fa-sign-out'
  outputNode.status = symbolBlock._propStatus && symbolBlock._propStatus.outputs ? symbolBlock._propStatus.outputs.status : deltaStatus.Unchanged
  outputNode.disabled = true
  if (R.isNotEmpty(symbolBlock.outputs)) {
    symbolBlock.outputs.forEach((output, index) => {
      const treeNode = new CompareTreeNode()
      treeNode.ref = output
      treeNode.label = output.name
      treeNode.objectHashId = output.pathId
      treeNode.index = index
      treeNode.iconClass = ''
      treeNode.status = output._status ? output._status.status : deltaStatus.Unchanged
      treeNode.moved = output._status ? output._status.moved : 0
      outputNode.children.push(treeNode)
    })
  }

  const paramNode = new CompareTreeNode()
  paramNode.ref = symbolBlock.params
  paramNode.objectHashId = symbolBlock.pathId + '.params'
  paramNode.label = '参数列表'
  paramNode.iconClass = 'fa fa-inbox'
  paramNode.status = symbolBlock._propStatus && symbolBlock._propStatus.params ? symbolBlock._propStatus.params.status : deltaStatus.Unchanged
  paramNode.disabled = true
  if (R.isNotEmpty(symbolBlock.params)) {
    symbolBlock.params.forEach((param, index) => {
      const treeNode = new CompareTreeNode()
      treeNode.ref = param
      treeNode.label = param.name
      treeNode.objectHashId = param.pathId
      treeNode.index = index
      treeNode.iconClass = ''
      treeNode.status = param._status ? param._status.status : deltaStatus.Unchanged
      treeNode.moved = param._status ? param._status.moved : 0
      paramNode.children.push(treeNode)
    })
  }
  return [inputNode, outputNode, paramNode]
}
