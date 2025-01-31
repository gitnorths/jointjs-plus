export function format10 (num: number) {
  return num < 10 ? `0${num}` : num
}

export function formatSaddrPrefix (
  { slot, cpuIndex, coreIndex }: { slot: number, cpuIndex: number, coreIndex: number }
) {
  return `B${format10(slot)}.P${cpuIndex}C${coreIndex}`
}

// 获取数字每一位为1的position信息
export function getExponents (num: number) {
  const exponents = []
  let position = 0

  while (num > 0) {
    // 检查最低位是否为 1
    if (num & 1) {
      exponents.push(position) // 如果最低位是 1，记录它的位置（指数）
    }
    num = num >> 1 // 右移，检查下一位
    position++
  }

  return exponents
}

// 形如 1.0 或者 1.0.0的格式 转换为 V1R0P0格式
export function formatVersion (ver: string) {
  const regex = /(\d+)\.(\d+)\.?(\d?)$/
  if (regex.test(ver)) {
    const result = regex.exec(ver)
    return result ? ver.replace(regex, `V${result[1]}R${result[2]}P${result[3] || 0}`) : ver
  } else {
    return ver
  }
}

// 将pathId转换为符合jonitJs namespace要求的类型
export function formatPathIdType (pathId: string) {
  if (pathId) {
    return pathId.split('/').join('.')
  }
  return ''
}

// 根据fontSize计算文本的实际长度
export function computedTextWidth (text: string, fontSize: number) {
  const span = document.createElement('span')
  span.innerHTML = text
  span.style.visibility = 'hidden'
  span.style.fontSize = `${fontSize}px`
  span.setAttribute('class', 'fontSize')
  const body = document.body
  body.appendChild(span)
  const width = span.offsetWidth
  body.removeChild(span)
  return width
}

// FIXME
export function isReservedGroupName (name: string) {
  return /^(STATE|YX|YC|MEA)$/.test(name) ||
    /^(CTRL|YK|YT|YM|DRIVE)$/.test(name) ||
    /^(RECORD|ACC|ADJUST)$/.test(name) ||
    /^(REPORT|FAULT|TRIP|SOE|CHG|CHECK|RUN|CUSTOM)$/.test(name) ||
    /^(EVENT_INFO|TRIP_PARA)_TABLE$/.test(name) ||
    /^(PROTECT|PROJECT|VLINK)_TABLE$/.test(name)
}
