import { SymbolBlockVersion } from '@/model/dto'
import * as R from 'ramda'
import { ElementCompact } from 'xml-js'
import { create, XMLElement } from 'xmlbuilder'

export function genShapeNode (ele: ElementCompact, symbolBlock: SymbolBlockVersion) {
  // "name", string, required.  The stencil name that uniquely identifies the shape.
  // "w" and "h" are optional decimal view bounds.  This defines your co-ordinate system for the graphics operations in the shape.  The default is 100,100.
  // "aspect", optional string.  Either "variable", the default, or "fixed".
  //   Fixed means always render the shape with the aspect ratio defined by the ratio w/h.
  //   Variable causes the ratio to match that of the geometry of the current vertex.
  // "strokewidth", optional string.  Either an integer or the string "inherit".
  //   "inherit" indicates that the strokeWidth of the cell is only changed on scaling, not on resizing.  Default is "1".
  //   If numeric values are used, the strokeWidth of the cell is changed on both scaling and resizing and the value defines the multiple that is applied to the width.
  // const [repoName, libName, symbolName, version] = symbolBlock.pathId.split('/')
  const shapeSize = getShapeSize(ele)

  const shape = create('shape', { headless: true, keepNullAttributes: false })
    .att('name', symbolBlock.pathId)
    .att('w', shapeSize.w)
    .att('h', shapeSize.h)
    .att('aspect', 'variable')
    .att('strokewidth', 'inherit')

  return { shapeSize, shape }
}

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
export function genTextNode (symbolEle: ElementCompact, foreground: XMLElement) {
  // For font styling there are.
  // fontstyle, an ORed bit pattern of bold (1), italic (2) and underline (4), i.e. bold underline is "5".
  // fontfamily, is a string defining the typeface to be used.
  // fontcolor, this sets the color that fonts are rendered in when text is drawn.
  // fontsize, an integer,

  let fontstyle = 0
  let fontfamily = '宋体'
  let fontcolor = '#000000'
  let fontSize = 12

  // text elements have the following attributes.
  // "str", the text string to display, required.
  // "x" and "y", the decimal location (x,y) of the text element, required.
  // "align", the horizontal alignment of the text element, either "left", "center" or "right".  Optional, default is "left".
  // "valign", the vertical alignment of the text element, either "top", "middle" or "bottom".  Optional, default is "top".
  // "localized", 0 or 1, if 1 then the "str" actually contains a key to use to fetch the value out of mxResources.  Optional, default is mxStencil.defaultLocalized.
  // "vertical", 0 or 1, if 1 the label is rendered vertically (rotated by 90 degrees).  Optional, default is 0.
  // "rotation", angle in degrees (0 to 360).  The angle to rotate the text by.  Optional, default is 0.
  // "align-shape", 0 or 1, if 0 ignore the rotation of the shape when setting the text rotation.  Optional, default is 1.
  let str = ''
  let x = 0
  let y = 0

  const graphEle = R.find((ele: ElementCompact) => ele.name === 'GRAPH')(symbolEle.elements)
  if (graphEle && R.isNotEmpty(graphEle.elements)) {
    for (const ele of graphEle.elements) {
      if (/Text/.test(ele.name)) {
        const textObj = ele.attributes
        // fontstyle
        if (/1/.test(textObj.bold)) {
          fontstyle += 1
        }
        if (/1/.test(textObj.italic)) {
          fontstyle += 2
        }
        if (/1/.test(textObj.underline)) {
          fontstyle += 4
        }

        fontfamily = textObj.family
        fontcolor = textObj.color
        fontSize = Number(textObj.pixelsize)

        str = textObj.content

        // FIXME textObj.flags 对齐方式
      } else if (/Rect/.test(ele.name)) {
        const rectObj = ele.attributes
        x = Number(rectObj.x)
        y = Number(rectObj.y) + Number(rectObj.height) / 2 - fontSize / 2
      }
    }
  }

  foreground.ele('fontcolor', { color: fontcolor })
  foreground.ele('fontstyle', { style: fontstyle })
  foreground.ele('fontfamily', { family: fontfamily })
  foreground.ele('fontsize', { size: fontSize })
  foreground.ele('text', { str, x, y })
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
export function genRectNode (symbolEle: ElementCompact, foreground: XMLElement, background?: XMLElement) {
  // rect, attributes “x”, “y”, “w”, “h”, all required decimals
  let x = 0
  let y = 0
  let w = 0
  let h = 0
  let strokecolor = '#000000'
  let strokewidth = '1'
  let fillcolor = '#ffffff'

  const graphEle = R.find((ele: ElementCompact) => ele.name === 'GRAPH')(symbolEle.elements)
  if (graphEle && R.isNotEmpty(graphEle.elements)) {
    for (const ele of graphEle.elements) {
      if (/Rect/.test(ele.name)) {
        const rectObj = ele.attributes
        x = Number(rectObj.x)
        y = Number(rectObj.y)
        w = Number(rectObj.width)
        h = Number(rectObj.height)
      } else if (/Pen/.test(ele.name)) {
        // 线样式
        const penObj = ele.attributes
        strokecolor = penObj.color
        strokewidth = penObj.width
      } else if (/Brush/.test(ele.name)) {
        // 填充样式
        const brushObj = ele.attributes
        fillcolor = brushObj.color
      }
    }
  }

  if (background) {
    background.ele('strokecolor', { color: strokecolor })
    background.ele('fillcolor', { color: fillcolor })
    background.ele('strokewidth', { width: strokewidth })
    background.ele('rect', { w, h, x, y })
  } else {
    foreground.ele('strokecolor', { color: strokecolor })
    foreground.ele('fillcolor', { color: fillcolor })
    foreground.ele('strokewidth', { width: strokewidth })
    foreground.ele('rect', { w, h, x, y })
  }

  foreground.ele('fillstroke')
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
export function genLineNode (symbolEle: ElementCompact, foreground: XMLElement) {
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
  let strokecolor = '#000000'
  let strokewidth = 'strokewidth'

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
        strokecolor = penObj.color
        strokewidth = penObj.width
      }
    }
  }

  if ((x1 - x2 === 0) && (y1 - y2 === 0)) {
    return
  }
  foreground.ele('strokecolor', { color: strokecolor })
  foreground.ele('strokewidth', { width: strokewidth })

  const pathNode = foreground.ele('path')
  pathNode.ele('move', { x: x1, y: y1 })
  pathNode.ele('line', { x: x2, y: y2 })

  foreground.ele('stroke')
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
export function genConnectNode (symbolEle: ElementCompact,
  shapeSize: { w: number, h: number }, connections: XMLElement, foreground: XMLElement, isInput: boolean) {
  // 生成连接点
  let x = 0
  let y = 0
  let pointW = 2
  let name = ''
  let strokecolor = '#000000'
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
              strokecolor = penObj.color
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

  connections.ele('constraint', {
    name,
    x: x / shapeSize.w,
    y: y / shapeSize.h,
    perimeter: '0',
    type: isInput ? 'input' : 'output'
  })

  foreground.ele('strokecolor', { color: strokecolor })
  foreground.ele('fillcolor', { color: fillcolor })
  foreground.ele('strokewidth', { width: '1' })
  foreground.ele('ellipse', {
    w: pointW,
    h: pointW,
    x: x - pointW / 2,
    y: y - pointW / 2,
    type: isInput ? 'input' : 'output'
  })
  foreground.ele('fillstroke')
}

export function genConnectNodeText (symbolEle: ElementCompact, foreground: XMLElement) {
  let fontstyle = 0
  let fontfamily = '宋体'
  let fontcolor = '#000000'
  let fontSize = 12

  let str = ''
  let x = 0
  let y = 0
  let align = ''
  let rectObj

  for (const dgEle of symbolEle.elements) {
    if (/DATA/.test(dgEle.name)) {
      if (R.isNotEmpty(dgEle.elements)) {
        for (const ele of dgEle.elements) {
          if (/Parameter/.test(ele.name)) {
            // 去除前缀 前导零
            str = ele.attributes.Name.replace(/^.*\./, '').replace(/\[0*([0-9]+)]/, '[$1]')
          }
        }
      }
    } else if (/GRAPH/.test(dgEle.name)) {
      if (R.isNotEmpty(dgEle.elements)) {
        for (const ele of dgEle.elements) {
          if (/Text/.test(ele.name)) {
            const textObj = ele.attributes
            // fontstyle
            if (/1/.test(textObj.bold)) {
              fontstyle += 1
            }
            if (/1/.test(textObj.italic)) {
              fontstyle += 2
            }
            if (/1/.test(textObj.underline)) {
              fontstyle += 4
            }

            fontfamily = textObj.family
            fontcolor = textObj.color
            fontSize = Number(textObj.pixelsize)

            str = textObj.content
            // textObj.flags 对齐方式0x01左对齐 0x02右对齐
            if (/2$/.test(textObj.flags)) {
              align = 'right'
            }
          } else if (/Rect/.test(ele.name)) {
            rectObj = ele.attributes
            x = Number(rectObj.x)
            y = Number(rectObj.y) + Number(rectObj.height) / 2 - fontSize / 2
          }
        }
      }
    }
  }

  // foreground.ele('text', {
  //   str: x === 0
  //     ? `inputs.${connectNode.$.n}.alias,inputs.${connectNode.$.n}.name`
  //     : `outputs.${connectNode.$.n}.alias,outputs.${connectNode.$.n}.name`,
  //   x: /1/.test(textAlign) ? x - halfFontSize : x + halfFontSize,
  //   y: y - halfFontSize,
  //   align: /1/.test(textAlign) ? 'right' : null,
  //   // showText: rn ? 1 : 0,
  //   localized: 1,
  //   type: Number(connectNode.$.t) === 0 ? 'input' : 'output'
  // })
  foreground.ele('fontcolor', { color: fontcolor })
  foreground.ele('fontstyle', { style: fontstyle })
  foreground.ele('fontfamily', { family: fontfamily })
  foreground.ele('fontsize', { size: fontSize })
  if (align === 'right') {
    x = x + Number(rectObj.width)
  }
  foreground.ele('text', { str, x, y, align })
}
