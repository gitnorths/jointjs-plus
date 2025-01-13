export const SHAPE_CONFIG = {
  fontSize: 6,
  fontFamily: 'Arial',
  headSize: 10, // 图形功能块实例名部分矩形的高度
  gridSize: 5, // 背景单元格的尺寸，单位为px
  lineHeight: 2 // 行高，单位为单元格，即2表示行高2个单元格
}

export function createNewShape (block, stencilName) {
  // background.ele('fillcolor', { color: '#000000' });
  genInterface(block)
  return ''
}

function genInterface (block) {
  if (block.inputs.length) {
    const inputShow = block.inputs.filter((input) => {
      return !input.integralVisible
    })
    inputShow.forEach((input, index) => {
      handleInterface(input, index, 'input', block)
    })
  }
  if (block.outputs.length) {
    const outputShow = block.outputs.filter((output) => {
      return !output.integralVisible
    })
    outputShow.forEach((output, index) => {
      handleInterface(output, index, 'output', block)
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

function handleInterface (io, index, type, block) {
  // todo
}
