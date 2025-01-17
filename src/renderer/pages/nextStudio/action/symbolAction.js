import { ipcRenderer } from 'electron'
import { MessageBox } from 'element-ui'
import * as R from 'ramda'
import { dia } from '@joint/plus'
import store from '@/renderer/pages/nextStudio/store'
import notification from '@/renderer/common/notification'
import VBus from '@/renderer/common/vbus'
import { ProtoSymbolArchive, ProtoSymbolBlock, ProtoSymbolLib } from '@/model/dto'
import { formatPathIdType } from '@/util'
import { Benchmark } from '@/util/consts'
import { SvgTagName } from '@/util/jointjsConsts'
import { inputPortGroup, outputPortGroup } from '@/util/jointjsShapeGenerator'

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

export const GraphSizeMap = {
  'base/extend/labelin/v1r0p0': { w: 140, h: 20 },
  'base/extend/labelout/v1r0p0': { w: 140, h: 20 },
  'base/extend/cconstblock/v1r0p0': { w: 140, h: 20 },
  'base/extend/cbrokencircleblock/v1r0p0': { w: 20, h: 20 },
  'base/op/cast/v1r0p0': { w: 20, h: 20 }
}

function getLabelInGraph () {
  const name = 'base/extend/labelin/v1r0p0'
  const type = formatPathIdType(name)
  const LabelGraphSize = GraphSizeMap[name]
  const jointGraphJson = {
    type,
    markup: [
      {
        tagName: SvgTagName.Path,
        selector: 'outLine',
        attributes: {
          strokeWidth: Benchmark.strokeWidth,
          stroke: Benchmark.stroke,
          fill: Benchmark.fill
        }
      },
      {
        tagName: SvgTagName.Text,
        selector: 'label',
        attributes: {
          fill: Benchmark.fontColor,
          fontSize: `${Benchmark.fontSize}px`,
          dominantBaseline: 'central'
        },
        textContent: 'LabelIn'
      }
    ],
    size: { width: LabelGraphSize.w, height: LabelGraphSize.h },
    attrs: {
      label: {
        x: Benchmark.fontSize / 2,
        y: 'calc(h/2)'
      },
      outLine: {
        d: 'M 0 calc(h) ' +
          'L calc(w - calc(h/2)) calc(h) ' +
          'L calc(w) calc(h/2) ' +
          'L calc(w - calc(h/2)) 0 ' +
          'L 0 0 ' +
          'Z'
      }
    },
    ports: {
      groups: {
        output: outputPortGroup
      },
      items: [{
        id: 'LabelIn',
        group: 'output',
        markup: [{ tagName: SvgTagName.Circle, selector: 'portBody' }],
        attrs: {
          label: {
            fontSize: Benchmark.fontSize,
            text: ''
          }
        },
        args: {
          x: '100%',
          y: '50%'
        }
      }]
    }
  }

  // 使用jointjs的toJSON方法
  const element = new dia.Element(jointGraphJson)
  element.set('id', name)
  return dia.Element.define(type, element.toJSON())
}

function getLabelOutGraph () {
  const name = 'base/extend/labelout/v1r0p0'
  const type = formatPathIdType(name)
  const LabelGraphSize = GraphSizeMap[name]
  const jointGraphJson = {
    type,
    markup: [
      {
        tagName: SvgTagName.Path,
        selector: 'outLine',
        attributes: {
          strokeWidth: Benchmark.strokeWidth,
          stroke: Benchmark.stroke,
          fill: Benchmark.fill
        }
      },
      {
        tagName: SvgTagName.Text,
        selector: 'label',
        attributes: {
          fill: Benchmark.fontColor,
          fontSize: `${Benchmark.fontSize}px`,
          dominantBaseline: 'central'
        },
        textContent: 'LabelOut'
      }
    ],
    size: { width: LabelGraphSize.w, height: LabelGraphSize.h },
    attrs: {
      label: {
        x: 'calc(h/2)',
        y: 'calc(h/2)'
      },
      outLine: {
        d: 'M calc(h/2) 0 ' +
          'L 0 calc(h/2) ' +
          'L calc(h/2) calc(h) ' +
          'L calc(w) calc(h) ' +
          'L calc(w) 0 ' +
          'Z'
      }
    },
    ports: {
      groups: {
        input: inputPortGroup
      },
      items: [
        {
          id: 'LabelOut',
          group: 'input',
          attrs: {
            label: {
              fontSize: Benchmark.fontSize,
              text: ''
            }
          },
          args: {
            x: 0,
            y: '50%'
          }
        }
      ]
    }
  }

  // 使用jointjs的toJSON方法
  const element = new dia.Element(jointGraphJson)
  element.set('id', name)
  return dia.Element.define(type, element.toJSON())
}

function getConstGraph () {
  const name = 'base/extend/CConstBlock/V1R0P0'.toLowerCase()
  const type = formatPathIdType(name)
  const graphSize = GraphSizeMap[name]
  const jointGraphJson = {
    type,
    markup: [
      {
        tagName: SvgTagName.Rect,
        selector: 'body',
        attributes: {
          x: 0,
          y: 0,
          fill: `${Benchmark.fill}`,
          stroke: `${Benchmark.stroke}`,
          strokeWidth: `${Benchmark.strokeWidth}`
        }
      },
      {
        tagName: SvgTagName.Text,
        selector: 'label',
        attributes: {
          fill: Benchmark.fontColor,
          fontSize: `${Benchmark.fontSize}px`,
          dominantBaseline: 'central'
        },
        textContent: 'CConstBlock'
      }
    ],
    size: { width: graphSize.w, height: graphSize.h },
    attrs: {
      body: {
        width: 'calc(w)',
        height: 'calc(h)'
      },
      label: {
        x: Benchmark.fontSize / 2,
        y: 'calc(h/2)'
      }
    },
    ports: {
      groups: {
        output: outputPortGroup
      },
      items: [
        {
          id: 'COut1',
          group: 'output',
          attrs: {
            label: {
              fontSize: Benchmark.fontSize,
              text: ''
            }
          },
          args: {
            x: '100%',
            y: '50%'
          }
        }
      ]
    }
  }

  // 使用jointjs的toJSON方法
  const element = new dia.Element(jointGraphJson)
  element.set('id', name)
  return dia.Element.define(type, element.toJSON())
}

function getBreakCircleGraph () {
  const name = 'base/extend/CBrokenCircleBlock/V1R0P0'.toLowerCase()
  const type = formatPathIdType(name)
  const graphSize = GraphSizeMap[name]
  const jointGraphJson = {
    type,
    markup: [
      {
        tagName: SvgTagName.Circle,
        selector: 'body',
        attributes: {
          r: graphSize.w / 2,
          strokeWidth: Benchmark.strokeWidth,
          stroke: Benchmark.stroke,
          fill: Benchmark.fill
        }
      }
    ],
    size: { width: graphSize.w, height: graphSize.h },
    attrs: {
      body: {
        cx: 'calc(w/2)',
        cy: 'calc(h/2)'
      }
    },
    ports: {
      groups: {
        input: inputPortGroup,
        output: outputPortGroup
      },
      items: [
        {
          id: 'cIn1',
          group: 'input',
          attrs: {
            label: {
              fontSize: Benchmark.fontSize,
              text: ''
            }
          },
          args: {
            x: 0,
            y: '50%'
          }
        },
        {
          id: 'cOut1',
          group: 'output',
          attrs: {
            label: {
              fontSize: Benchmark.fontSize,
              text: ''
            }
          },
          args: {
            x: '100%',
            y: '50%'
          }
        }
      ]
    }
  }

  // 使用jointjs的toJSON方法
  const element = new dia.Element(jointGraphJson)
  element.set('id', name)
  return dia.Element.define(type, element.toJSON())
}

function getCastGraph () {
  const name = 'base/op/Cast/V1R0P0'.toLowerCase()
  const type = formatPathIdType(name)
  const graphSize = GraphSizeMap[name]
  const jointGraphJson = {
    type,
    markup: [
      {
        tagName: 'rect',
        selector: 'body',
        attributes: {
          x: 0,
          y: 0,
          strokeWidth: Benchmark.strokeWidth,
          stroke: Benchmark.stroke,
          fill: Benchmark.fill
        }
      }
    ],
    size: { width: graphSize.w, height: graphSize.h },
    attrs: {
      body: {
        width: 'calc(w)',
        height: 'calc(h)'
      }
    },
    ports: {
      groups: {
        input: inputPortGroup,
        output: outputPortGroup
      },
      items: [
        {
          id: 'CIn',
          group: 'input',
          attrs: {
            label: {
              fontSize: Benchmark.fontSize,
              text: ''
            }
          },
          args: {
            x: 0,
            y: '50%'
          }
        },
        {
          id: 'COut',
          group: 'output',
          attrs: {
            label: {
              fontSize: Benchmark.fontSize,
              text: ''
            }
          },
          args: {
            x: '100%',
            y: '50%'
          }
        }
      ]
    }
  }

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
