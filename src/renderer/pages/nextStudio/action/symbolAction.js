import { ipcRenderer } from 'electron'
import { MessageBox } from 'element-ui'
import * as R from 'ramda'
import { dia } from '@joint/plus'
import store from '@/renderer/pages/nextStudio/store'
import notification from '@/renderer/common/notification'
import VBus from '@/renderer/common/vbus'
import { ProtoSymbolArchive, ProtoSymbolBlock, ProtoSymbolLib } from '@/model/dto'
import { formatPathIdType } from '@/util'

const addArchiveToStencilRegistry = (archiveList) => {
  if (!archiveList || R.isEmpty(archiveList)) {
    return
  }
  // 要先清理一下除了base之外的库
  const namespace = {}
  const oldNamespace = store.getters.symbolNameSpace
  namespace.base = oldNamespace.base

  for (const archive of archiveList) {
    const archiveNameSpace = namespace[archive.name.toLowerCase()] || {}
    if (R.isNotEmpty(archive.children)) {
      for (const lib of archive.children) {
        const libNameSpace = archiveNameSpace[lib.name.toLowerCase()] || {}
        if (R.isNotEmpty(lib.children)) {
          for (const symbolBlockProto of lib.children) {
            store.commit('addSymbolProtoToMap', symbolBlockProto)

            const symbolNameSpace = libNameSpace[symbolBlockProto.name.toLowerCase()] || {}
            // 将pathId改为.拼接，用于namespace
            const type = formatPathIdType(symbolBlockProto.pathId)
            symbolNameSpace[symbolBlockProto.version.toLowerCase()] = dia.Element.define(type, JSON.parse(symbolBlockProto.graphic))
            libNameSpace[symbolBlockProto.name.toLowerCase()] = symbolNameSpace
          }
        }
        archiveNameSpace[lib.name.toLowerCase()] = libNameSpace
      }
    }
    namespace[archive.name.toLowerCase()] = archiveNameSpace
  }
  store.commit('setSymbolNameSpace', namespace)
}

const ConstraintDotSize = { w: 2, h: 2 }

export const GraphSizeMap = {
  'base/extend/labelin/v1r0p0': { w: 95, h: 10 },
  'base/extend/labelout/v1r0p0': { w: 95, h: 10 },
  'base/extend/cconstblock/v1r0p0': { w: 95, h: 10 },
  'base/extend/cbrokencircleblock/v1r0p0': { w: 10, h: 10 },
  'base/op/cast/v1r0p0': { w: 10, h: 10 }
}

function getLabelInGraph () {
  const name = 'base/extend/labelin/v1r0p0'
  const type = formatPathIdType(name)
  const markupJson = []
  const LabelGraphSize = GraphSizeMap[name]
  const jointGraphJson = {
    type,
    markup: '',
    size: { width: LabelGraphSize.w, height: LabelGraphSize.h },
    attr: {},
    ports: {
      groups: {
        output: {
          position: { name: 'absolute' },
          markup: [{ tagName: 'circle', selector: 'portBody' }],
          attrs: {
            portBody: { magnet: true }
          },
          label: {
            markup: [{ tagName: 'text', selector: 'label' }],
            position: { name: 'left', args: { x: -6 } }
          }
        }
      },
      items: []
    }
  }
  const d = `M 0 ${LabelGraphSize.h} ` +
    `L ${LabelGraphSize.w - (LabelGraphSize.h / 2)} ${LabelGraphSize.h} ` +
    `L ${LabelGraphSize.w} ${LabelGraphSize.h / 2} ` +
    `L ${LabelGraphSize.w - (LabelGraphSize.h / 2)} 0 ` +
    'L 0 0 ' +
    'Z'
  markupJson.push({
    tagName: 'path',
    attributes: { d, strokeWidth: '1', stroke: '#000000', fill: '#ffffff' }
  })

  jointGraphJson.markup = markupJson

  const port = {
    id: 'LabelIn',
    group: 'output',
    markup: [{ tagName: 'circle', selector: 'portBody' }],
    attrs: {
      label: {
        fontFamily: 'Arial',
        fontSize: '6px',
        text: ''
      },
      portBody: {
        cx: 0,
        cy: 0,
        r: ConstraintDotSize.w / 2,
        fill: '#ffffff',
        stroke: '#000000'
      }
    },
    args: {
      x: LabelGraphSize.w,
      y: LabelGraphSize.h / 2
    }
  }
  jointGraphJson.ports.items.push(port)

  // 使用jointjs的toJSON方法
  const element = new dia.Element(jointGraphJson)
  element.set('id', name)
  return dia.Element.define(type, element.toJSON())
}

function getLabelOutGraph () {
  const name = 'base/extend/labelout/v1r0p0'
  const type = formatPathIdType(name)
  const markupJson = []
  const LabelGraphSize = GraphSizeMap[name]
  const jointGraphJson = {
    type,
    markup: '',
    size: { width: LabelGraphSize.w, height: LabelGraphSize.h },
    attr: {},
    ports: {
      groups: {
        input: {
          position: { name: 'absolute' },
          markup: [{ tagName: 'circle', selector: 'portBody' }],
          attrs: {
            portBody: { magnet: true }
          },
          label: {
            markup: [{ tagName: 'text', selector: 'label' }],
            position: { name: 'right', args: { x: 6 } }
          }
        }
      },
      items: []
    }
  }
  const d = `M ${LabelGraphSize.h / 2} 0 ` +
    `L 0 ${LabelGraphSize.h / 2} ` +
    `L ${LabelGraphSize.h / 2} ${LabelGraphSize.h} ` +
    `L ${LabelGraphSize.w} ${LabelGraphSize.h} ` +
    `L ${LabelGraphSize.w} 0 ` +
    'Z'
  markupJson.push({
    tagName: 'path',
    attributes: { d, strokeWidth: '1', stroke: '#000000', fill: '#ffffff' }
  })

  jointGraphJson.markup = markupJson

  const port = {
    id: 'LabelOut',
    group: 'input',
    attrs: {
      label: {
        fontFamily: 'Arial',
        fontSize: '6px',
        text: ''
      },
      portBody: {
        cx: 0,
        cy: 0,
        r: ConstraintDotSize.w / 2,
        fill: '#ffffff',
        stroke: '#000000'
      }
    },
    args: {
      x: 0,
      y: LabelGraphSize.h / 2
    }
  }
  jointGraphJson.ports.items.push(port)

  // 使用jointjs的toJSON方法
  const element = new dia.Element(jointGraphJson)
  element.set('id', name)
  return dia.Element.define(type, element.toJSON())
}

function getConstGraph () {
  const name = 'base/extend/CConstBlock/V1R0P0'.toLowerCase()
  const type = formatPathIdType(name)
  const markupJson = []
  const graphSize = GraphSizeMap[name]
  const jointGraphJson = {
    type,
    markup: '',
    size: { width: graphSize.w, height: graphSize.h },
    attr: {},
    ports: {
      groups: {
        output: {
          position: { name: 'absolute' },
          markup: [{ tagName: 'circle', selector: 'portBody' }],
          attrs: {
            portBody: { magnet: true }
          },
          label: {
            markup: [{ tagName: 'text', selector: 'label' }],
            position: { name: 'left', args: { x: -6 } }
          }
        }
      },
      items: []
    }
  }
  const d = `M 0 ${graphSize.h} ` +
    `L ${graphSize.w} ${graphSize.h} ` +
    `L ${graphSize.w} 0 ` +
    'L 0 0 ' +
    'Z'
  markupJson.push({
    tagName: 'path',
    attributes: { d, strokeWidth: '1', stroke: '#000000', fill: '#ffffff' }
  })

  jointGraphJson.markup = markupJson

  const port = {
    id: 'COut1',
    group: 'output',
    attrs: {
      label: {
        fontFamily: 'Arial',
        fontSize: '6px',
        text: ''
      },
      portBody: {
        magnet: true,
        cx: 0,
        cy: 0,
        r: ConstraintDotSize.w / 2,
        fill: '#ffffff',
        stroke: '#000000'
      }
    },
    args: {
      x: graphSize.w,
      y: graphSize.h / 2
    }
  }
  jointGraphJson.ports.items.push(port)

  // 使用jointjs的toJSON方法
  const element = new dia.Element(jointGraphJson)
  element.set('id', name)
  return dia.Element.define(type, element.toJSON())
}

function getBreakCircleGraph () {
  const name = 'base/extend/CBrokenCircleBlock/V1R0P0'.toLowerCase()
  const type = formatPathIdType(name)
  const markupJson = []
  const graphSize = GraphSizeMap[name]
  const jointGraphJson = {
    type,
    markup: '',
    size: { width: graphSize.w, height: graphSize.h },
    attr: {},
    ports: {
      groups: {
        input: {
          position: { name: 'absolute' },
          markup: [{ tagName: 'circle', selector: 'portBody' }],
          attrs: {
            portBody: { magnet: true }
          },
          label: {
            markup: [{ tagName: 'text', selector: 'label' }],
            position: { name: 'right', args: { x: 6 } }
          }
        },
        output: {
          position: { name: 'absolute' },
          markup: [{ tagName: 'circle', selector: 'portBody' }],
          attrs: {
            portBody: { magnet: true }
          },
          label: {
            markup: [{ tagName: 'text', selector: 'label' }],
            position: { name: 'left', args: { x: -6 } }
          }
        }
      },
      items: []
    }
  }
  markupJson.push({
    tagName: 'circle',
    attributes: {
      cx: graphSize.w / 2,
      cy: graphSize.h / 2,
      r: graphSize.w / 2,
      strokeWidth: '1',
      stroke: '#000000',
      fill: '#ffffff'
    }
  })

  jointGraphJson.markup = markupJson

  const inputPort = {
    id: 'cIn1',
    group: 'input',
    attrs: {
      label: {
        fontFamily: 'Arial',
        fontSize: '6px',
        text: ''
      },
      portBody: {
        magnet: true,
        cx: 0,
        cy: 0,
        r: ConstraintDotSize.w / 2,
        fill: '#ffffff',
        stroke: '#000000'
      }
    },
    args: {
      x: 0,
      y: graphSize.h / 2
    }
  }
  const outputPort = {
    id: 'cOut1',
    group: 'output',
    attrs: {
      label: {
        fontFamily: 'Arial',
        fontSize: '6px',
        text: ''
      },
      portBody: {
        magnet: true,
        cx: 0,
        cy: 0,
        r: ConstraintDotSize.w / 2,
        fill: '#ffffff',
        stroke: '#000000'
      }
    },
    args: {
      x: graphSize.w,
      y: graphSize.h / 2
    }
  }
  jointGraphJson.ports.items.push(inputPort)
  jointGraphJson.ports.items.push(outputPort)

  // 使用jointjs的toJSON方法
  const element = new dia.Element(jointGraphJson)
  element.set('id', name)
  return dia.Element.define(type, element.toJSON())
}

function getCastGraph () {
  const name = 'base/op/Cast/V1R0P0'.toLowerCase()
  const type = formatPathIdType(name)
  const markupJson = []
  const graphSize = GraphSizeMap[name]
  const jointGraphJson = {
    type,
    markup: '',
    size: { width: graphSize.w, height: graphSize.h },
    attr: {},
    ports: {
      groups: {
        input: {
          position: { name: 'absolute' },
          markup: [{ tagName: 'circle', selector: 'portBody' }],
          attrs: {
            portBody: { magnet: true }
          },
          label: {
            markup: [{ tagName: 'text', selector: 'label' }],
            position: { name: 'right', args: { x: 6 } }
          }
        },
        output: {
          position: { name: 'absolute' },
          markup: [{ tagName: 'circle', selector: 'portBody' }],
          attrs: {
            portBody: { magnet: true }
          },
          label: {
            markup: [{ tagName: 'text', selector: 'label' }],
            position: { name: 'left', args: { x: -6 } }
          }
        }
      },
      items: []
    }
  }
  markupJson.push({
    tagName: 'rect',
    attributes: {
      x: 0,
      y: 0,
      width: graphSize.w,
      height: graphSize.h,
      strokeWidth: '1',
      stroke: '#000000',
      fill: '#ffffff'
    }
  })

  jointGraphJson.markup = markupJson

  const inputPort = {
    id: 'CIn',
    group: 'input',
    attrs: {
      label: {
        fontFamily: 'Arial',
        fontSize: '6px',
        text: ''
      },
      portBody: {
        magnet: true,
        cx: 0,
        cy: 0,
        r: ConstraintDotSize.w / 2,
        fill: '#ffffff',
        stroke: '#000000'
      }
    },
    args: {
      x: 0,
      y: graphSize.h / 2
    }
  }
  const outputPort = {
    id: 'COut',
    group: 'output',
    attrs: {
      label: {
        fontFamily: 'Arial',
        fontSize: '6px',
        text: ''
      },
      portBody: {
        magnet: true,
        cx: 0,
        cy: 0,
        r: ConstraintDotSize.w / 2,
        fill: '#ffffff',
        stroke: '#000000'
      }
    },
    args: {
      x: graphSize.w,
      y: graphSize.h / 2
    }
  }
  jointGraphJson.ports.items.push(inputPort)
  jointGraphJson.ports.items.push(outputPort)

  // 使用jointjs的toJSON方法
  const element = new dia.Element(jointGraphJson)
  element.set('id', name)
  return dia.Element.define(type, element.toJSON())
}

export const initToolBaseSymbol = () => {
  // FIXME 添加LIN/LOUT/Const的Graph
  const namespace = {
    base: {
      extend: {
        labelin: { v1r0p0: getLabelInGraph() },
        labelout: { v1r0p0: getLabelOutGraph() },
        cconstblock: { v1r0p0: getConstGraph() },
        cbrokencircleblock: { v1r0p0: getBreakCircleGraph() }
      },
      op: {
        cast: { v1r0p0: getCastGraph() }
      }
    }
  }
  store.commit('setSymbolNameSpace', namespace)
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
