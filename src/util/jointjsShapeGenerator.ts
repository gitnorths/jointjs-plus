import * as R from 'ramda'
import { dia } from '@joint/plus'
import { SymbolBlockVarInput, SymbolBlockVarOutput, SymbolBlockVersion } from '@/model/dto'
import { PortLabelLayoutsName, PortLayoutsName, SvgTagName } from './jointjsConsts'
import { computedTextWidth, formatPathIdType } from '@/util/index'
import { Benchmark } from '@/util/consts'

function getMaxStrLength (ioArray: Array<SymbolBlockVarInput | SymbolBlockVarOutput>) {
  let maxLength = 0
  for (const io of ioArray) {
    const length = computedTextWidth(io.name, Benchmark.fontSize) + Benchmark.fontSize / 2
    maxLength = Math.max(maxLength, length)
  }
  return maxLength
}

export function syncWidth (version: SymbolBlockVersion) {
  // name的长度对gridSize向上取整，两边让出两倍grid的空格
  const nameLength = Math.ceil(computedTextWidth(version.name, Benchmark.fontSize) / Benchmark.gridSize) + 2
  // 输出最长长度 + 输入最长长度对gridSize向上取整，中间空出两倍grid的空格
  const ioContentLength = Math.ceil((getMaxStrLength(version.inputs) + getMaxStrLength(version.outputs)) / Benchmark.gridSize) + 2

  return Math.max(ioContentLength, nameLength) * Benchmark.gridSize
}

export function syncHeight (version: SymbolBlockVersion) {
  const maxLen = Math.max(version.inputs.length, version.outputs.length)
  return (Math.max(maxLen, 1) + 2) * Benchmark.lineHeight * Benchmark.gridSize
}

export const inputPortGroup: dia.Element.PortGroup = {
  position: { name: PortLayoutsName.Absolute },
  markup: [{ tagName: SvgTagName.Circle, selector: 'portBody' }],
  attrs: {
    portBody: { magnet: true }
  },
  label: {
    markup: [{ tagName: SvgTagName.Text, selector: 'label' }],
    position: { name: PortLabelLayoutsName.Right, args: { x: Benchmark.fontSize / 2 } }
  }
}

export const outputPortGroup: dia.Element.PortGroup = {
  position: { name: PortLayoutsName.Absolute },
  markup: [{ tagName: SvgTagName.Circle, selector: 'portBody' }],
  attrs: {
    portBody: { magnet: true }
  },
  label: {
    markup: [{ tagName: SvgTagName.Text, selector: 'label' }],
    position: { name: PortLabelLayoutsName.Left, args: { x: -(Benchmark.fontSize / 2) } }
  }
}

export function generateJointSymbolGraph (version: SymbolBlockVersion) {
  const width = syncWidth(version)
  const height = syncHeight(version)

  const jointGraphJson: dia.Element.GenericAttributes<dia.Cell.Selectors> = {
    type: formatPathIdType(version.pathId),
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
        tagName: SvgTagName.Path,
        selector: 'headLine',
        attributes: {
          stroke: `${Benchmark.stroke}`,
          strokeWidth: `${Benchmark.strokeWidth}`
        }
      },
      {
        tagName: SvgTagName.Text,
        selector: 'label',
        attributes: {
          x: (width - computedTextWidth(version.name, Benchmark.fontSize)) / 2,
          y: Benchmark.gridSize,
          fill: Benchmark.fontColor,
          fontSize: `${Benchmark.fontSize}px`,
          dominantBaseline: 'central'
        },
        textContent: version.name
      }
    ],
    size: { width, height },
    attrs: {
      body: {
        width: 'calc(w)',
        height: 'calc(h)'
      },
      headLine: {
        d: `M 0 ${Benchmark.gridSize * Benchmark.lineHeight} L calc(w) ${Benchmark.gridSize * Benchmark.lineHeight}`
      }
    },
    ports: {
      groups: {
        input: inputPortGroup,
        output: outputPortGroup
      },
      items: []
    }
  }

  const portItems: dia.Element.Port[] = []
  if (R.isNotEmpty(version.inputs)) {
    version.inputs
      .sort((a, b) => a.index - b.index)
      .forEach((input, index) => {
        const port: dia.Element.Port = {
          id: input.name,
          group: 'input',
          attrs: {
            portBody: {
              cx: 0,
              cy: 0,
              r: Benchmark.portRadius,
              fill: Benchmark.fill,
              stroke: Benchmark.stroke
            },
            label: {
              fill: Benchmark.fontColor,
              fontSize: `${Benchmark.fontSize}px`,
              text: input.name
            }
          },
          args: {
            x: 0,
            y: `${(index + 2) * Benchmark.gridSize * Benchmark.lineHeight * 100 / height}%`
          }
        }
        portItems.push(port)
      })
  }
  if (R.isNotEmpty(version.outputs)) {
    version.outputs
      .sort((a, b) => a.index - b.index)
      .forEach((output, index) => {
        const port: dia.Element.Port = {
          id: output.name,
          group: 'output',
          attrs: {
            portBody: {
              cx: 0,
              cy: 0,
              r: Benchmark.portRadius,
              fill: Benchmark.fill,
              stroke: Benchmark.stroke
            },
            label: {
              fill: Benchmark.fontColor,
              fontSize: `${Benchmark.fontSize}px`,
              text: output.name
            }
          },
          args: {
            x: '100%',
            y: `${(index + 2) * Benchmark.gridSize * Benchmark.lineHeight * 100 / height}%`
          }
        }
        portItems.push(port)
      })
  }
  if (jointGraphJson && jointGraphJson.ports) {
    jointGraphJson.ports.items = portItems
  }
  // 使用jointjs的toJSON方法
  const element = new dia.Element(jointGraphJson)
  element.set('id', version.pathId)
  return JSON.stringify(element.toJSON())
}
