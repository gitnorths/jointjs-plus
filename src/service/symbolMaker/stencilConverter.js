import * as xmlBuilder from 'xmlbuilder'
import { mxCodec, mxGraph, mxUtils } from '@/renderer/pages/symbolMaker/views/components/workArea/symbolBlockVersionView/mxgraph'
import { SymbolBlockConstants } from '@/renderer/pages/symbolMaker/views/components/workArea/workAreaConfig'

export const SHAPE_CONFIG = {
  fontSize: 6,
  fontFamily: 'Arial',
  headSize: 10, // 图形功能块实例名部分矩形的高度
  gridSize: 5, // mxgraph背景单元格的尺寸，单位为px
  lineHeight: 2 // 行高，单位为单元格，即2表示行高2个单元格
}

export function createNewShape (block, stencilName) {
  const shape = xmlBuilder.create('shape', {
    headless: true,
    keepNullAttributes: false
  })
    .att('name', stencilName)
    .att('w', block.width)
    .att('h', block.height)
    .att('strokewidth', 'inherit')
    .att('aspect', 'variable')

  const connections = shape.ele('connections')
  const foreground = shape.ele('foreground')
  const background = shape.ele('background')
  // background.ele('fillcolor', { color: '#000000' });
  genAlias(foreground, background, block)
  genInterface(connections, foreground, block)

  return shape.end()
}

function genAlias (foreground, background, block) {
  // 符号分割为标题部分和IO部分两个矩形
  const rectArray = [{
    w: Number(block.width),
    h: SHAPE_CONFIG.headSize,
    x: 0,
    y: 0
  }, {
    w: Number(block.width),
    h: Number(block.height) - SHAPE_CONFIG.headSize,
    x: 0,
    y: SHAPE_CONFIG.headSize
  }]
  rectArray.forEach((rect) => {
    background.ele('rect', rect)
    background.ele('fillstroke')
  })
  // 绘制标题
  const aliasAttr = {
    // str: block.instName || block.name,
    str: 'name',
    x: (Number(block.width) - computedTextWidth(block.name)) / 2,
    y: (Number(SHAPE_CONFIG.headSize) - SHAPE_CONFIG.fontSize) / 2,
    localized: 1
  }
  foreground.ele('fontfamily', { family: SHAPE_CONFIG.fontFamily })
  foreground.ele('fontsize', { size: SHAPE_CONFIG.fontSize })
  foreground.ele('text', aliasAttr)
}

function genInterface (connections, foreground, block) {
  if (block.inputs.length) {
    const inputShow = block.inputs.filter((input) => {
      return !input.integralVisible
    })
    inputShow.forEach((input, index) => {
      handleInterface(input, index, 'input', block, connections, foreground)
    })
  }
  if (block.outputs.length) {
    const outputShow = block.outputs.filter((output) => {
      return !output.integralVisible
    })
    outputShow.forEach((output, index) => {
      handleInterface(output, index, 'output', block, connections, foreground)
    })
  }
}

export function computedTextWidth (text) {
  const span = document.createElement('span')
  span.innerHTML = text
  span.style.visibility = 'hidden'
  span.style.fontSize = `${SHAPE_CONFIG.fontSize}px`
  span.setAttribute('class', 'fontSize')
  const body = document.body
  body.appendChild(span)
  const width = span.offsetWidth
  body.removeChild(span)
  return width
}

function handleInterface (io, index, type, block, connections, foreground) {
  if (io.integralVisible) return // 若勾选完全隐藏，则shape不生成此连接点
  // 构建连接点
  const constraintAttr = {
    name: io.name,
    x: type === 'input' ? 0 : 1,
    y: ((SHAPE_CONFIG.lineHeight * SHAPE_CONFIG.gridSize * (index + 1)) - ((SHAPE_CONFIG.lineHeight - 1) * SHAPE_CONFIG.gridSize) + SHAPE_CONFIG.headSize) / block.height,
    perimeter: '0',
    type
  }
  connections.ele('constraint', constraintAttr)
  // 构建连接点的圆点
  foreground.ele('ellipse', {
    w: 2,
    h: 2,
    x: type === 'input' ? -1 : block.width - 1,
    y: (SHAPE_CONFIG.lineHeight * SHAPE_CONFIG.gridSize * (index + 1)) - ((SHAPE_CONFIG.lineHeight - 1) * SHAPE_CONFIG.gridSize) - 1 + SHAPE_CONFIG.headSize,
    type
  })
  foreground.ele('fillstroke')
  if (io.textVisible) return // 若勾选隐藏文字，则shape不生成此连接点对应的text
  // 构建连接点名称
  foreground.ele('fontfamily', { family: SHAPE_CONFIG.fontFamily })
  foreground.ele('fontsize', { size: SHAPE_CONFIG.fontSize })
  const connectNodeTextAttr = {
    // str: io.alias || io.name,
    str: `${type === 'input' ? 'inputs' : 'outputs'}.${io.name}.alias,${type === 'input' ? 'inputs' : 'outputs'}.${io.name}.name`,
    x: type === 'input' ? 3 : block.width - 3,
    y: (SHAPE_CONFIG.lineHeight * SHAPE_CONFIG.gridSize * (index + 1)) - ((SHAPE_CONFIG.lineHeight - 1) * SHAPE_CONFIG.gridSize) - (SHAPE_CONFIG.fontSize / 2) + SHAPE_CONFIG.headSize,
    align: type === 'input' ? 'left' : 'right',
    type,
    localized: 1
  }
  foreground.ele('text', connectNodeTextAttr)
}

let graph = null
let backgroundCell = null
let connections = null
let foreground = null
let background = null

// 根据mxgraphModel内容转换成Shape内容
export function mxGraphModel2Shape (mxGraphModelXml, stencilName) {
  graph = new mxGraph()
  // 获取mxgraphModelXML内容
  const doc = mxUtils.parseXml(mxGraphModelXml)
  const root = doc.documentElement
  const dec = new mxCodec(root.ownerDocument)
  const model = graph.getModel()
  dec.decode(root, model)
  // 获取背景区域
  backgroundCell = model.getCell('backgroundCell')
  const cells = model.cells
  // 新建 shape 内容
  const shape = xmlBuilder.create('shape', {
    headless: true,
    keepNullAttributes: false
  })
    .att('name', stencilName)
    .att('w', backgroundCell.geometry.width)
    .att('h', backgroundCell.geometry.height)
    .att('strokewidth', '1')
    .att('aspect', 'variable')
  // 新增 连接柱
  connections = shape.ele('connections')
  // 新增 前景
  foreground = shape.ele('foreground')
  // 新增 背景
  background = shape.ele('background')
  // cells
  // 递归输出
  getCell(cells[0], 0, 0)
  return shape.end()
}

// 遍历 mxGraphModelXml 内容 对应转换
function getCell (cell, px, py) {
  // 将当前cell转换
  const styles = graph.getCellStyle(cell)
  // 矩形
  if (styles.shape === 'roundrect') {
    background.ele('dashed', { dashed: styles.dashed })
    const rect = {
      w: Number(cell.geometry.width),
      h: Number(cell.geometry.height),
      x: Number(cell.id === 'backgroundCell' ? 0 : cell.geometry.x),
      y: Number(cell.id === 'backgroundCell' ? 0 : cell.geometry.y),
      arcsize: styles.arcSize
    }
    background.ele(styles.rounded === 1 ? 'roundrect' : 'rect', rect)
    background.ele('fillcolor', { color: styles.fillColor })
    background.ele('strokecolor', { color: styles.strokeColor })
    background.ele('strokewidth', { width: styles.strokeWidth })
    background.ele('fillstroke')
  } else if (styles.shape === 'table') {
    background.ele('dashed', { dashed: styles.dashed })
    const rect = {
      w: Number(cell.geometry.width),
      h: Number(cell.geometry.height),
      x: Number(cell.geometry.x),
      y: Number(cell.geometry.y),
      arcsize: styles.arcSize
    }
    background.ele(styles.rounded === 1 ? 'roundrect' : 'rect', rect)
    background.ele('fillcolor', { color: styles.fillColor })
    background.ele('strokecolor', { color: styles.strokeColor })
    background.ele('strokewidth', { width: styles.strokeWidth })
    background.ele('fillstroke')
    px = cell.geometry.x
    py = cell.geometry.y
  } else if (styles.shape === 'partialRectangle') {
    background.ele('dashed', { dashed: styles.dashed })
    const rect = {
      w: Number(cell.geometry.width),
      h: Number(cell.geometry.height),
      x: Number(cell.geometry.x + px),
      y: Number(cell.geometry.y + py),
      arcsize: styles.arcSize
    }
    background.ele(styles.rounded === 1 ? 'roundrect' : 'rect', rect)
    background.ele('fillcolor', { color: styles.fillColor })
    background.ele('strokecolor', { color: styles.strokeColor })
    background.ele('strokewidth', { width: styles.strokeWidth })
    background.ele('fillstroke')

    px = !cell.geometry ? 0 : cell.geometry.x + px
    py = !cell.geometry ? 0 : cell.geometry.y + py
  } else if (styles.shape === 'text') { // text是自定义的shape
    // 文字
    // x,y根据width和height与aalign，valign共同推导出
    // 参数
    // `inputs.${cell.value}.alias,inputs.${cell.value}.name`,

    const aliasAttr = {
      str: cell.id != null && cell.id.indexOf(SymbolBlockConstants.params) >= 0
        ? `params.${cell.value}.value`
        : cell.value,
      x: Number(cell.geometry.x + cell.geometry.width / 2),
      y: Number(cell.geometry.y + cell.geometry.height / 2),
      valueList: cell.id != null && styles.isOptional != null && styles.isOptional === 1
        ? `params.${cell.value}.valueList`
        : 0,
      localized: styles.localized,
      align: styles.align,
      valign: 'middle',
      rotation: styles.rotation === undefined ? 0 : styles.rotation * -1

    }
    foreground.ele('fontfamily', { family: styles.fontFamily })
    foreground.ele('fontstyle', { style: styles.fontStyle })
    foreground.ele('fontcolor', { color: styles.fontColor })
    foreground.ele('fontsize', { size: styles.fontSize })
    foreground.ele('text', aliasAttr)
    foreground.ele('fillstroke')
  } else if (styles.shape === 'curved') {
    // 曲线
    // 开始
    // 结束
    background.ele('dashed', { dashed: styles.dashed })
    background.ele('strokecolor', { color: styles.strokeColor })
    background.ele('strokewidth', { width: styles.strokeWidth })
    background.ele('fillcolor', { color: styles.fillColor })

    const pathNode = background.ele('path')
    pathNode.ele('move', {
      x: cell.geometry.sourcePoint.x,
      y: cell.geometry.sourcePoint.y
    })
    const points = cell.geometry.points
    if (points === null || points.length === 0) {
      const pointsAttr = {
        x1: cell.geometry.sourcePoint.x,
        y1: cell.geometry.sourcePoint.y,
        x2: cell.geometry.sourcePoint.x,
        y2: cell.geometry.sourcePoint.y,
        x3: cell.geometry.targetPoint.x,
        y3: cell.geometry.targetPoint.y
      }
      pathNode.ele('curve', pointsAttr)
    } else if (points.length >= 1) {
      const pointsAttr = {
        x1: cell.geometry.sourcePoint.x,
        y1: cell.geometry.sourcePoint.y,
        x2: points[0].x,
        y2: points[0].y,
        x3: cell.geometry.targetPoint.x,
        y3: cell.geometry.targetPoint.y
      }
      pathNode.ele('curve', pointsAttr)
    }
    background.ele('fillstroke')
    background.ele('close')
  } else if (styles.shape === 'lines') {
    // 线段
    // 开始
    // 结束
    background.ele('dashed', { dashed: styles.dashed })
    background.ele('fillcolor', { color: styles.fillColor })
    background.ele('strokecolor', { color: styles.strokeColor })
    if (styles.strokeWidth !== undefined) {
      background.ele('strokewidth', { width: styles.strokeWidth })
    }

    const pathNode = background.ele('path')
    pathNode.ele('move', {
      x: cell.geometry.sourcePoint.x + px,
      y: cell.geometry.sourcePoint.y + py
    })
    const points = cell.geometry.points
    if (points !== null) {
      for (let i = 0; i < points.length; i++) {
        pathNode.ele('line', {
          x: points[i].x,
          y: points[i].y
        })
      }
    }
    pathNode.ele('line', {
      x: cell.geometry.targetPoint.x + px,
      y: cell.geometry.targetPoint.y + py
    })
    if (styles.endArrow === 'open') {
      // 如果结束点是箭头，绘制箭头
      const x1 = cell.geometry.sourcePoint.x + px
      const y1 = cell.geometry.sourcePoint.y + py
      const x2 = cell.geometry.targetPoint.x + px
      const y2 = cell.geometry.targetPoint.y + py
      const l = 5 //
      const a = Math.atan2((y2 - y1), (x2 - x1))

      const x3 = x2 - l * Math.cos(a + 30 * Math.PI / 180) // θ=30
      const y3 = y2 - l * Math.sin(a + 30 * Math.PI / 180)
      const x4 = x2 - l * Math.cos(a - 30 * Math.PI / 180)
      const y4 = y2 - l * Math.sin(a - 30 * Math.PI / 180)
      pathNode.ele('move', {
        x: x3,
        y: y3
      })
      pathNode.ele('line', {
        x: x2,
        y: y2
      })
      pathNode.ele('line', {
        x: x4,
        y: y4
      })
    }

    background.ele('fillstroke')
    background.ele('close')
  } else if (cell.id != null && cell.id.indexOf(SymbolBlockConstants.inputs) >= 0) {
    // 输入
    // 构建连接点
    const constraintAttr = {
      name: styles.name,
      x: cell.geometry.x,
      y: cell.geometry.y,
      perimeter: '0',
      type: SymbolBlockConstants.inputs
    }
    connections.ele('constraint', constraintAttr)
    const shape = {
      w: Number(cell.geometry.width),
      h: Number(cell.geometry.height),
      x: Number(cell.geometry.x * backgroundCell.geometry.width - 1),
      y: Number(cell.geometry.y * backgroundCell.geometry.height - 1)
    }
    // 圆
    background.ele('dashed', { dashed: styles.dashed })
    background.ele('strokecolor', { color: styles.strokeColor })
    background.ele('fillcolor', { color: styles.fillColor })
    background.ele('strokewidth', { width: styles.strokeWidth })
    background.ele('ellipse', shape)
    background.ele('fillstroke')
    px = Number(cell.geometry.x * backgroundCell.geometry.width - 1) + px
    py = Number(cell.geometry.y * backgroundCell.geometry.height - 1) + py
    // 文字
    const xOffset = styles.align === 'right' ? (styles.spacingRight + 1) * -1 : styles.spacingLeft + (styles.verticalAlign === 'middle' ? 1 : 0)
    const yOffset = styles.verticalAlign === 'bottom' ? styles.spacingBottom * -1 : styles.align === 'center' ? styles.spacingTop + 1 : styles.spacingTop / 2
    const aliasAttr = {
      str: `inputs.${cell.value}.alias,inputs.${cell.value}.name`,
      x: Number(cell.geometry.x * backgroundCell.geometry.width + xOffset),
      y: Number(cell.geometry.y * backgroundCell.geometry.height + yOffset),
      localized: 1,
      align: styles.align,
      valign: styles.verticalAlign,
      rotation: styles.rotation === undefined ? 0 : styles.rotation * -1,
      type: 'input'
    }
    foreground.ele('fontfamily', { family: styles.fontFamily })
    foreground.ele('fontstyle', { style: styles.fontStyle })
    foreground.ele('fontsize', { size: styles.fontSize })
    foreground.ele('fontcolor', { color: styles.fontColor })
    foreground.ele('text', aliasAttr)
    foreground.ele('fillstroke')
  } else if (cell.id != null && cell.id.indexOf(SymbolBlockConstants.outputs) >= 0) {
    // 输出
    // 构建连接点
    const constraintAttr = {
      name: styles.name,
      x: cell.geometry.x,
      y: cell.geometry.y,
      perimeter: '0',
      type: SymbolBlockConstants.outputs
    }
    connections.ele('constraint', constraintAttr)
    const shape = {
      w: Number(cell.geometry.width),
      h: Number(cell.geometry.height),
      x: Number(cell.geometry.x * backgroundCell.geometry.width - 1),
      y: Number(cell.geometry.y * backgroundCell.geometry.height - 1)
    }
    background.ele('dashed', { dashed: styles.dashed })
    background.ele('strokecolor', { color: styles.strokeColor })
    background.ele('fillcolor', { color: styles.fillColor })
    background.ele('strokewidth', { width: styles.strokeWidth })
    background.ele('ellipse', shape)
    background.ele('fillstroke')
    px = Number(cell.geometry.x * backgroundCell.geometry.width - 1) + px
    py = Number(cell.geometry.y * backgroundCell.geometry.height - 1) + py
    const xOffset = styles.align === 'right' ? (styles.spacingRight + 1) * -1 : styles.spacingLeft + (styles.verticalAlign === 'middle' ? 1 : 0)
    const yOffset = styles.verticalAlign === 'bottom' ? styles.spacingBottom * -1 : styles.align === 'center' ? styles.spacingTop + 1 : styles.spacingTop / 2
    // 文字
    const aliasAttr = {
      str: `outputs.${cell.value}.alias,outputs.${cell.value}.name`,
      x: Number(cell.geometry.x * backgroundCell.geometry.width + xOffset),
      y: Number(cell.geometry.y * backgroundCell.geometry.height + yOffset),
      localized: 1,
      align: styles.align,
      valign: styles.verticalAlign,
      rotation: styles.rotation === undefined ? 0 : styles.rotation * -1,
      type: 'output'
    }
    foreground.ele('fontfamily', { family: styles.fontFamily })
    foreground.ele('fontstyle', { style: styles.fontStyle })
    foreground.ele('fontsize', { size: styles.fontSize })
    foreground.ele('fontcolor', { color: styles.fontColor })
    foreground.ele('text', aliasAttr)
    foreground.ele('fillstroke')
  } else if (styles.shape === 'ellipse') {
    background.ele('dashed', { dashed: styles.dashed })
    const shape = {
      w: Number(cell.geometry.width),
      h: Number(cell.geometry.height),
      x: Number(cell.geometry.x),
      y: Number(cell.geometry.y)
    }
    background.ele('strokecolor', { color: styles.strokeColor })
    background.ele('fillcolor', { color: styles.fillColor })
    background.ele('strokewidth', { width: styles.strokeWidth })
    background.ele('ellipse', shape)

    background.ele('fillstroke')
  } else if (styles.shape === 'image') {
    const image = {
      src: styles.image.replace(',', ';base64,'),
      w: Number(cell.geometry.width),
      h: Number(cell.geometry.height),
      x: Number(cell.geometry.x),
      y: Number(cell.geometry.y),
      flipH: Number(styles.flipH),
      flipV: Number(styles.flipV)
    }
    background.ele('image', image)
  } else if (styles.shape === 'rectangle') {
    // TODO
  } else if (styles.shape != null) {
    // Sub-shapes
    foreground.ele('dashed', { dashed: styles.dashed })
    const shape = {
      name: styles.shape,
      w: Number(cell.geometry.width),
      h: Number(cell.geometry.height),
      x: Number(cell.geometry.x),
      y: Number(cell.geometry.y)
    }
    foreground.ele('fillcolor', { color: styles.fillColor })
    foreground.ele('strokecolor', { color: styles.strokeColor })
    foreground.ele('strokewidth', { width: styles.strokeWidth })
    foreground.ele('include-shape', shape)
  }

  if (cell.children == null) {
    return
  }

  // 逆序输出chidren
  for (let i = 0; i < cell.children.length; i++) {
    // 递归输出子元素
    getCell(cell.children[i], px, py)
  }
}
