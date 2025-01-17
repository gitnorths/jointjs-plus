import * as R from 'ramda'
import { ElementCompact } from 'xml-js'
import { SymbolBlockVersion } from '@/model/dto'
import { dia } from '@joint/plus'
import { formatPathIdType } from '@/util'

export function getShapeSize (ele: ElementCompact) {
  const xArr = []
  const yArr = []
  if (R.isNotEmpty(ele.elements)) {
    for (const symbolEle of ele.elements) {
      const graphObj = symbolEle.attributes
      const className = graphObj.class_name
      if (className === 'CGLineObject') {
        const graphEle = R.find((ele: ElementCompact) => ele.name === 'GRAPH')(symbolEle.elements)
        if (graphEle && R.isNotEmpty(graphEle.elements)) {
          for (const ele of graphEle.elements) {
            if (/Line/.test(ele.name)) {
              const lineObj = ele.attributes
              xArr.push(Number(lineObj.x1))
              xArr.push(Number(lineObj.x2))
              yArr.push(Number(lineObj.y1))
              yArr.push(Number(lineObj.y2))
            }
          }
        }
      } else if (className === 'CGRectangleObject') {
        const graphEle = R.find((ele: ElementCompact) => ele.name === 'GRAPH')(symbolEle.elements)
        if (graphEle && R.isNotEmpty(graphEle.elements)) {
          for (const ele of graphEle.elements) {
            if (/Rect/.test(ele.name)) {
              const rectObj = ele.attributes
              xArr.push(Number(rectObj.x))
              xArr.push(Number(rectObj.x) + Number(rectObj.width))
              yArr.push(Number(rectObj.y))
              yArr.push(Number(rectObj.y) + Number(rectObj.height))
            }
          }
        }
      }
    }
  }
  return {
    w: (Math.max(...xArr) - Math.min(...xArr)),
    h: (Math.max(...yArr) - Math.min(...yArr))
  }
}

export function loadSymbolGraphJoint (ele: ElementCompact, version: SymbolBlockVersion) {
  const shapeSize = getShapeSize(ele)

  const markupJson: dia.MarkupNodeJSON[] = []

  const inputGroup: dia.Element.PortGroup = {
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

  const outputGroup: dia.Element.PortGroup = {
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

  const jointGraphJson: dia.Element.GenericAttributes<dia.Cell.Selectors> = {
    type: formatPathIdType(version.pathId),
    markup: '',
    size: { width: shapeSize.w, height: shapeSize.h },
    attr: {},
    ports: {
      groups: {
        input: inputGroup,
        output: outputGroup
      },
      items: []
    }
  }

  if (R.isNotEmpty(ele.elements)) {
    const bgElements = []
    const fgElements = []
    for (const symbolEle of ele.elements) {
      const { z_value } = symbolEle.attributes
      if (/0\.00/.test(z_value)) {
        bgElements.push(symbolEle)
      } else {
        fgElements.push(symbolEle)
      }
    }

    // 1 根据z_value确定是否有background元素，目前的符号都是z_value为0.00的CGRectangleObject
    if (R.isNotEmpty(bgElements)) {
      if (bgElements.length > 1) {
        throw new Error(`图形导入失败，${version.pathId} 的背景元素数量大于1`)
      }
      const symbolEle = bgElements[0]
      const { class_name } = symbolEle.attributes
      if (class_name === 'CGRectangleObject') {
        markupJson.push(genRectSvgNode(symbolEle, 'body'))
      }
    }
    // 2 处理前景元素
    if (R.isNotEmpty(fgElements)) {
      const connectNodeTextList = []
      const connectNodeMap = new Map<string, dia.Element.Port>()

      for (const symbolEle of fgElements) {
        const { class_name } = symbolEle.attributes

        if (class_name === 'CGExpandTextObject') {
          markupJson.push(genTextSvgNode(symbolEle, 'label'))
        } else if (class_name === 'CGLineObject') {
          const lineNode = genLineNode(symbolEle)
          if (lineNode) {
            markupJson.push(lineNode)
          }
        } else if (class_name === 'CGRectangleObject') {
          markupJson.push(genRectSvgNode(symbolEle))
        } else if (class_name === 'CGCircleObject') {
          // genCircleNode(trueSize.offset, background, coverArray(graphObj.CIRCLE))
        } else if (class_name === 'CInputConnectNode') {
          genConnectNode(symbolEle, connectNodeMap, true)
        } else if (class_name === 'COutputConnectNode') {
          genConnectNode(symbolEle, connectNodeMap, false)
        } else if (class_name === 'CParameterText') {
          connectNodeTextList.push(symbolEle)
        }
      }
      // 最后统一处理连接点的文本
      for (const symbolEle of connectNodeTextList) {
        genConnectNodeText(symbolEle, connectNodeMap)
      }

      if (jointGraphJson && jointGraphJson.ports) {
        jointGraphJson.ports.items = Array.from(connectNodeMap.values())
      }
    }
  }

  jointGraphJson.markup = markupJson

  // 使用jointjs的toJSON方法
  const element = new dia.Element(jointGraphJson)
  element.set('id', version.pathId)
  version.graphicFile = JSON.stringify(element.toJSON())
}

function qtAlignmentToTextAttr (alignment: number | string, isRtl?: boolean) {
  if (typeof alignment === 'string') {
    alignment = Number(alignment)
  }
  let textAnchor = ''
  let dominantBaseline = ''
  // 默认情况下，Qt::AlignAbsolute 的行为类似 AlignLeft 或 AlignRight
  if (alignment & 0x0010) { // 0x0010 是 Qt::AlignAbsolute 的值
    textAnchor = isRtl ? 'end' : 'start'
  }
  // 水平对齐
  if (alignment & 0x0001) {
    textAnchor = 'start' // 'left'
  } else if (alignment & 0x0002) {
    textAnchor = 'end' // 'right'
  } else if (alignment & 0x0004) {
    textAnchor = 'middle' // 'center'
  } else if (alignment & 0x0008) {
    textAnchor = '' // SVG没有和 'justify' 直接对应的属性
  }

  // 垂直对齐
  if (alignment & 0x0020) {
    dominantBaseline = 'hanging' // 'top'
  } else if (alignment & 0x0040) {
    dominantBaseline = 'text-after-edge' // 'bottom'
  } else if (alignment & 0x0080) {
    dominantBaseline = 'central'
  } else if (alignment & 0x0100) {
    dominantBaseline = 'baseline'
  }

  return { textAnchor, dominantBaseline }
}

/**
 * <SYMBOL class_name="CGExpandTextObject" z_value="1.00">
 *  <DATA/>
 *  <GRAPH>
 *    <Text bold="0" color="#0000ff" content="SY5406A" family="宋体" flags="0x84" italic="0" pixelsize="12" underline="0"/>
 *    <Rect height="28.00" resizable="1" width="68.00" x="20.00" y="-2.00"/>
 *    <Pen color="#0000ff" style="SolidLine" width="1"/>
 *    <Pos x="180.00" y="120.00"/>
 *  </GRAPH>
 *</SYMBOL>
 */

function graphEle2TextAttr (graphEle: ElementCompact | undefined) {
  // For font styling there are.
  let fontFamily = '宋体'
  let fontColor = '#000000'
  let fontSize = '12'
  let fontStyle = '' // normal italic oblique
  let fontWeight = '' // normal bold lighter bolder
  let textDecorationLine = ''
  let textAnchor = ''
  let dominantBaseline = ''

  let textContent = ''
  let x = 0
  let y = 0
  let rectObj

  if (graphEle && R.isNotEmpty(graphEle.elements)) {
    for (const ele of graphEle.elements) {
      if (/Text/.test(ele.name)) {
        const textObj = ele.attributes
        if (/1/.test(textObj.bold)) {
          fontWeight = 'bold'
        }
        if (/1/.test(textObj.italic)) {
          fontStyle = 'italic'
        }
        if (/1/.test(textObj.underline)) {
          textDecorationLine = 'underline'
        }

        fontFamily = textObj.family
        fontColor = textObj.color
        fontSize = textObj.pixelsize

        textContent = textObj.content

        // textObj.flags 对齐方式
        if (textObj.flags) {
          ({ textAnchor, dominantBaseline } = qtAlignmentToTextAttr(textObj.flags))
        }
      } else if (/Rect/.test(ele.name)) {
        rectObj = ele.attributes
        x = Number(rectObj.x)
        y = Number(rectObj.y)
      }
    }
  }
  return {
    fontFamily,
    fontColor,
    fontSize,
    fontStyle,
    fontWeight,
    textDecorationLine,
    textAnchor,
    dominantBaseline,
    textContent,
    x,
    y,
    rectObj
  }
}

function genTextSvgNode (symbolEle: ElementCompact, selector?: string) {
  const graphEle = R.find((ele: ElementCompact) => ele.name === 'GRAPH')(symbolEle.elements)
  const {
    fontFamily,
    fontColor,
    fontSize,
    fontStyle,
    fontWeight,
    textDecorationLine,
    dominantBaseline,
    textContent,
    x,
    y
  } = graphEle2TextAttr(graphEle)

  return {
    tagName: 'text',
    selector,
    attributes: {
      x,
      y: y + Number(fontSize),
      fill: fontColor,
      fontFamily,
      fontSize: `${fontSize}px`,
      fontStyle,
      fontWeight,
      textDecorationLine,
      dominantBaseline
    },
    textContent
  }
}

/**
 *  <SYMBOL class_name="CGRectangleObject" z_value="0.00">
 *    <DATA/>
 *    <GRAPH>
 *      <Rect height="24.00" resizable="1" width="108.00" x="0.00" y="0.00"/>
 *      <Pen color="#000000" style="SolidLine" width="2"/>
 *      <Brush color="#fefe8d" style="SolidPattern"/>
 *      <Pos x="180.00" y="120.00"/>
 *    </GRAPH>
 *  </SYMBOL>
 */
function genRectSvgNode (symbolEle: ElementCompact, selector?: string) {
  let x = '0'
  let y = '0'
  let width = '0'
  let height = '0'
  let stroke = '#000000'
  let strokeWidth = '1'
  let fill = '#ffffff'

  const graphEle = R.find((ele: ElementCompact) => ele.name === 'GRAPH')(symbolEle.elements)
  if (graphEle && R.isNotEmpty(graphEle.elements)) {
    for (const ele of graphEle.elements) {
      if (/Rect/.test(ele.name)) {
        const rectObj = ele.attributes
        x = rectObj.x
        y = rectObj.y
        width = rectObj.width
        height = rectObj.height
      } else if (/Pen/.test(ele.name)) {
        // 线样式
        const penObj = ele.attributes
        stroke = penObj.color
        strokeWidth = penObj.width
      } else if (/Brush/.test(ele.name)) {
        // 填充样式
        const brushObj = ele.attributes
        fill = brushObj.color
      }
    }
  }
  return {
    tagName: 'rect',
    selector,
    attributes: { x, y, width, height, fill, stroke, strokeWidth }
  }
}

/**
 *    <SYMBOL class_name="CGLineObject" z_value="1.00">
 *      <DATA/>
 *      <GRAPH>
 *        <Pen color="#000000" style="SolidLine" width="2"/>
 *        <Line isvhline="1" resizable="1" x1="0.00" x2="108.00" y1="24.00" y2="24.00"/>
 *        <Pos x="180.00" y="120.00"/>
 *      </GRAPH>
 *    </SYMBOL>
 */
function genLineNode (symbolEle: ElementCompact) {
  // Most drawing is contained within a path element.  Again, the graphic primitives are very similar to that of HTML 5 canvas.
  // move to attributes required decimals (x,y).
  // line to attributes required decimals (x,y).
  // quad to required decimals (x2,y2) via control point required decimals (x1,y1).
  // curve to required decimals (x3,y3), via control points required decimals (x1,y1) and (x2,y2).
  // arc, this doesn’t follow the HTML Canvas signatures, instead it’s a copy of the SVG arc command.  The SVG specification documentation gives the best description of its behaviors.  The attributes are named identically, they are decimals and all required.
  // close ends the current subpath and causes an automatic straight line to be drawn from the current point to the initial point of the current subpath.
  let x1 = 0
  let y1 = 0
  let x2 = 0
  let y2 = 0
  let stroke = '#000000'
  let strokeWidth = '1'

  const graphEle = R.find((ele: ElementCompact) => ele.name === 'GRAPH')(symbolEle.elements)
  if (graphEle && R.isNotEmpty(graphEle.elements)) {
    for (const ele of graphEle.elements) {
      if (/Line/.test(ele.name)) {
        const lineObj = ele.attributes
        x1 = Number(lineObj.x1)
        y1 = Number(lineObj.y1)
        x2 = Number(lineObj.x2)
        y2 = Number(lineObj.y2)
      } else if (/Pen/.test(ele.name)) {
        // 线样式
        const penObj = ele.attributes
        stroke = penObj.color
        strokeWidth = penObj.width
      }
    }
  }

  if ((x1 - x2 === 0) && (y1 - y2 === 0)) {
    return null
  }

  const d = `M ${x1} ${y1} L ${x2} ${y2}`

  return {
    tagName: 'path',
    attributes: { d, strokeWidth, stroke }
  }
}

/**
 *    <SYMBOL class_name="CInputConnectNode" z_value="2.00">
 *      <DATA>
 *        <Input index="0" name="kb_16channel_diagnostics.in_fault_00"/>
 *      </DATA>
 *      <GRAPH>
 *        <Point isHollow="1" x="0.00" y="46.00"/>
 *        <Pen color="#000000" style="SolidLine" width="4"/>
 *        <Brush color="#ffffff" style="SolidPattern"/>
 *      </GRAPH>
 *    </SYMBOL>
 */
function genConnectNode (symbolEle: ElementCompact, connectNodeMap: Map<string, dia.Element.Port>, isInput: boolean) {
  const port: dia.Element.Port = { group: isInput ? 'input' : 'output' }

  // 生成连接点
  let x = 0
  let y = 0
  let pointW = 2
  let name = ''
  let stroke = '#000000'
  let fillcolor = '#ffffff'

  if (R.isNotEmpty(symbolEle.elements)) {
    for (const dgEle of symbolEle.elements) {
      if (/DATA/.test(dgEle.name)) {
        if (R.isNotEmpty(dgEle.elements)) {
          for (const ele of dgEle.elements) {
            if (/Input/.test(ele.name)) {
              name = ele.attributes.name
            }
            if (/Output/.test(ele.name)) {
              name = ele.attributes.Name
            }
            // 去除前缀和前导零
            name = name.replace(/^.*\./, '').replace(/\[0*([0-9]+)]/, '[$1]')
          }
        }
      } else if (/GRAPH/.test(dgEle.name)) {
        if (R.isNotEmpty(dgEle.elements)) {
          for (const ele of dgEle.elements) {
            if (/Point/.test(ele.name)) {
              const rectObj = ele.attributes
              x = Number(rectObj.x)
              y = Number(rectObj.y)
            } else if (/Pen/.test(ele.name)) {
              // 线
              const penObj = ele.attributes
              pointW = Number(penObj.width)
              stroke = penObj.color
            } else if (/Brush/.test(ele.name)) {
              // 填充
              const brushObj = ele.attributes
              fillcolor = brushObj.color
            }
          }
        }
      }
    }
  }

  port.id = name
  port.args = { x, y }
  port.attrs = {
    portBody: { cx: 0, cy: 0, r: pointW / 2, fill: fillcolor, stroke },
    label: { text: name }
  }

  connectNodeMap.set(name, port)
}

function genConnectNodeText (symbolEle: ElementCompact, connectNodeMap: Map<string, dia.Element.Port>) {
  let fontFamily, fontColor, fontSize, fontStyle, fontWeight, textDecorationLine, textAnchor, textContent
  for (const dgEle of symbolEle.elements) {
    if (/DATA/.test(dgEle.name)) {
      if (R.isNotEmpty(dgEle.elements)) {
        for (const ele of dgEle.elements) {
          if (/Parameter/.test(ele.name)) {
            // 去除前缀 前导零
            textContent = ele.attributes.Name.replace(/^.*\./, '').replace(/\[0*([0-9]+)]/, '[$1]')
          }
        }
      }
    } else if (/GRAPH/.test(dgEle.name)) {
      ({
        fontFamily,
        fontColor,
        fontSize,
        fontStyle,
        fontWeight,
        textDecorationLine,
        textAnchor,
        textContent
      } = graphEle2TextAttr(dgEle))
    }
  }

  const port = connectNodeMap.get(textContent)
  if (port) {
    // FIXME
    // if (align === 'right') {
    //   x = x + Number(rectObj.width)
    // }
    const attrs = port.attrs
    if (attrs && attrs.label) {
      // attrs.label.x = x
      // attrs.label.y = y
      attrs.label.fill = fontColor
      attrs.label.fontFamily = fontFamily
      attrs.label.fontSize = fontSize + 'px'
      attrs.label.fontStyle = fontStyle
      if (fontWeight) {
        attrs.label.fontWeight = fontWeight
      }
      if (textDecorationLine) {
        attrs.label.textDecorationLine = textDecorationLine
      }
      if (textAnchor) {
        attrs.label.textAnchor = textAnchor
      }
      // if (dominantBaseline) {
      //   attrs.label.dominantBaseline = dominantBaseline
      // }
    }
    port.attrs = attrs

    connectNodeMap.set(textContent, port)
  }
}
