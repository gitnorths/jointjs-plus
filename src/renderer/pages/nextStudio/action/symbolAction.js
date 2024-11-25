import { ipcRenderer } from 'electron'
import { MessageBox } from 'element-ui'
import * as R from 'ramda'
import * as xmlBuilder from 'xmlbuilder'
import { mxStencil, mxStencilRegistry, mxUtils } from '@/renderer/common/mxgraph'
import store from '@/renderer/pages/nextStudio/store'
import notification from '@/renderer/common/notification'
import VBus from '@/renderer/common/vbus'
import { ProtoSymbolArchive, ProtoSymbolBlock, ProtoSymbolLib } from '@/model/dto'

const addToStencilRegistry = (stencil) => {
  const xmlNode = mxUtils.parseXml(stencil)
  const shape = xmlNode.firstChild
  const name = shape.getAttribute('name')
  const newStencil = new mxStencil(shape)
  mxStencilRegistry.addStencil(name, newStencil)
}

const addSymbol = (symbolBlockProto) => {
  store.commit('addSymbolProtoToMap', symbolBlockProto)
  if (symbolBlockProto.graphic) {
    addToStencilRegistry(symbolBlockProto.graphic)
  }
}

const addArchiveToStencilRegistry = (archiveList) => {
  if (!archiveList || R.isEmpty(archiveList)) {
    return
  }
  R.compose(
    R.forEach(addSymbol),
    R.flatten(),
    R.pluck('children'),
    R.flatten(),
    R.pluck('children')
  )(archiveList)
}

const ConstraintDotSize = { w: 2, h: 2 }

export const GraphSizeMap = {
  'base/extend/labelin/1.0': { w: 95, h: 10 },
  'base/extend/labelout/1.0': { w: 95, h: 10 },
  'base/extend/cconstblock/1.0': { w: 95, h: 10 }
}

function getLabelInGraph () {
  const name = 'base/extend/labelin/1.0'
  const LabelGraphSize = GraphSizeMap[name]
  const shape = xmlBuilder.create('shape', { headless: true, keepNullAttributes: false })
    .att('name', name)
    .att('w', LabelGraphSize.w)
    .att('h', LabelGraphSize.h)
    .att('aspect', 'variable')
    .att('strokewidth', 'inherit')
  const connections = shape.ele('connections')
  connections.ele('constraint', { name: 'OUT', x: 1, y: 0.5, perimeter: '0' })

  const background = shape.ele('background')

  const pathNode = background.ele('path')
  pathNode.ele('move', { x: 0, y: LabelGraphSize.h })
  pathNode.ele('line', { x: LabelGraphSize.w - (LabelGraphSize.h / 2), y: LabelGraphSize.h })
  pathNode.ele('line', { x: LabelGraphSize.w, y: LabelGraphSize.h / 2 })
  pathNode.ele('line', { x: LabelGraphSize.w - (LabelGraphSize.h / 2), y: 0 })
  pathNode.ele('line', { x: 0, y: 0 })
  pathNode.ele('close')

  const foreground = shape.ele('foreground')
  foreground.ele('fillstroke')

  foreground.ele('fontfamily', { family: 'Arial' })
  foreground.ele('fontsize', { size: 6 })
  foreground.ele('text', {
    str: 'name', // FIXME instName or desc or abbr // TODO value
    x: 0.8333333333333334,
    y: 2.0833333333333335,
    localized: 1
  })

  foreground.ele('ellipse', {
    w: ConstraintDotSize.w,
    h: ConstraintDotSize.h,
    x: LabelGraphSize.w - (ConstraintDotSize.w / 2),
    y: (LabelGraphSize.h / 2) - (ConstraintDotSize.h / 2)
  })
  foreground.ele('fillstroke')

  return shape.end()
}

function getLabelOutGraph () {
  const name = 'base/extend/labelout/1.0'
  const LabelGraphSize = GraphSizeMap[name]
  const shape = xmlBuilder.create('shape', { headless: true, keepNullAttributes: false })
    .att('name', name)
    .att('w', LabelGraphSize.w)
    .att('h', LabelGraphSize.h)
    .att('aspect', 'variable')
    .att('strokewidth', 'inherit')
  const connections = shape.ele('connections')
  connections.ele('constraint', { name: 'IN', x: 0, y: 0.5, perimeter: '0' })

  const background = shape.ele('background')

  const pathNode = background.ele('path')
  pathNode.ele('move', { x: LabelGraphSize.h / 2, y: 0 })
  pathNode.ele('line', { x: 0, y: LabelGraphSize.h / 2 })
  pathNode.ele('line', { x: LabelGraphSize.h / 2, y: LabelGraphSize.h })
  pathNode.ele('line', { x: LabelGraphSize.w, y: LabelGraphSize.h })
  pathNode.ele('line', { x: LabelGraphSize.w, y: 0 })
  pathNode.ele('close')

  const foreground = shape.ele('foreground')
  foreground.ele('fillstroke')

  foreground.ele('fontfamily', { family: 'Arial' })
  foreground.ele('fontsize', { size: 6 })
  foreground.ele('text', {
    str: 'name', // FIXME instName or desc or abbr // TODO value
    x: 5.833333333333333,
    y: 2.0833333333333335,
    localized: 1
  })

  foreground.ele('ellipse', {
    w: ConstraintDotSize.w,
    h: ConstraintDotSize.h,
    x: 0 - (ConstraintDotSize.w / 2),
    y: (LabelGraphSize.h / 2) - (ConstraintDotSize.h / 2)
  })
  foreground.ele('fillstroke')

  return shape.end()
}

function getConstGraph () {
  const name = 'base/extend/CConstBlock/1.0'.toLowerCase()
  const ConstGraphSize = GraphSizeMap[name]

  const shape = xmlBuilder.create('shape', { headless: true, keepNullAttributes: false })
    .att('name', name)
    .att('w', ConstGraphSize.w)
    .att('h', ConstGraphSize.h)
    .att('aspect', 'variable')
    .att('strokewidth', 'inherit')
  const connections = shape.ele('connections')
  connections.ele('constraint', { name: 'OUT', x: 1, y: 0.5, perimeter: '0' })

  const background = shape.ele('background')

  const pathNode = background.ele('path')
  pathNode.ele('move', { x: 0, y: ConstGraphSize.h })
  pathNode.ele('line', { x: ConstGraphSize.w, y: ConstGraphSize.h })
  pathNode.ele('line', { x: ConstGraphSize.w, y: 0 })
  pathNode.ele('line', { x: 0, y: 0 })
  pathNode.ele('close')

  const foreground = shape.ele('foreground')
  foreground.ele('fillstroke')

  foreground.ele('fontfamily', { family: 'Arial' })
  foreground.ele('fontsize', { size: 6 })
  foreground.ele('text', {
    str: 'outputs.COut1.value', // FIXME instName or desc or abbr // TODO value
    x: 0.8333333333333334,
    y: 2.0833333333333335,
    localized: 1
  })

  foreground.ele('ellipse', {
    w: ConstraintDotSize.w,
    h: ConstraintDotSize.h,
    x: ConstGraphSize.w - (ConstraintDotSize.w / 2),
    y: (ConstGraphSize.h / 2) - (ConstraintDotSize.h / 2)
  })
  foreground.ele('fillstroke')

  return shape.end()
}

export const initToolBaseSymbol = () => {
  // FIXME 添加LIN/LOUT/PageInfo的graph
  const inGraph = getLabelInGraph()
  addToStencilRegistry(inGraph)

  const outGraph = getLabelOutGraph()
  addToStencilRegistry(outGraph)

  const constGraph = getConstGraph()
  addToStencilRegistry(constGraph)
}

const initArchiveProtos = (archive) => {
  const archiveProto = new ProtoSymbolArchive(archive)
  if (R.isNotEmpty(archive.children)) {
    for (const lib of archive.children) {
      const libProto = new ProtoSymbolLib(lib, archiveProto)
      if (R.isNotEmpty(lib.children)) {
        for (const symbol of lib.children) {
          const symbolProto = new ProtoSymbolBlock(symbol, libProto)
          libProto.children.push(symbolProto)
        }
      }
      archiveProto.children.push(libProto)
    }
  }

  return archiveProto
}

export const getDeviceSymbol = () => {
  const protoLoading = store.getters.symbolProtoLoading
  if (protoLoading) {
    notification.openInfoNotification('[SymbolTree] 请等待之前的符号库初始化完成').logger()
    return
  }

  store.commit('setSymbolProtoLoading', true)
  notification.openInfoNotification('[SymbolTree] 符号库初始化中...').logger()

  // 发送事件
  ipcRenderer.invoke('worker:getProtoArchive', store.getters.deviceDbPath)
    .then((value) => {
      const pkgList = value.map(archive => initArchiveProtos(archive))
      store.commit('setArchiveProtos', pkgList)
      VBus.$emit('REFRESH_ARCHIVE_PROTO')
      // 清除原来的stencil
      for (const key in mxStencilRegistry.stencils) {
        // FIXME
        if (!/^base\/extend\/(LabelIN|LabelOUT|CConstBlock)/i.test(key)) {
          delete mxStencilRegistry.stencils[key]
        }
      }
      addArchiveToStencilRegistry(pkgList)
      notification.openInfoNotification('[SymbolTree] 符号库初始化完成').logger()
    })
    .catch((e) => {
      notification.openErrorNotification(`[SymbolTree] 符号库初始化失败 ${e.message}，请刷新后再试`).logger()
    })
    .finally(() => {
      store.commit('setSymbolProtoLoading', false)
    })
}

// 升级符号块
export const updateSymbolArchive = async () => {
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
        notification.openInfoNotification('取消功能块管理')
        return
      }
      notification.openErrorNotification('工程保存失败!请检查错误日志').logger()
      return
    }
  }
  VBus.$emit('OPEN_PACKAGE_UPDATE_DIALOG')
}
