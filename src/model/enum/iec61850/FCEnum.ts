export enum FCEnum {
  ST, // STatus Information 状态信息
  MX, // Measurand analogue value X 测量模拟量值X
  CO, // ContrOl控制
  SP, // SetPoint 设定点
  SG, // Setting Group 定值组
  SE, // Setting Group Editable 定值组可编辑
  SV, // Sampled Value 采样值
  CF, // ConFiguration 配置
  DC, // DesCripation 描述
  EX, // EXtended definition 扩展定义
}

export function getFCEnumByStr (str: string) {
  switch (str) {
    case 'ST':
      return FCEnum.ST
    case 'MX':
      return FCEnum.MX
    case 'CO':
      return FCEnum.CO
    case 'SP':
      return FCEnum.SP
    case 'SG':
      return FCEnum.SG
    case 'SE':
      return FCEnum.SE
    case 'SV':
      return FCEnum.SV
    case 'CF':
      return FCEnum.CF
    case 'DC':
      return FCEnum.DC
    case 'EX':
      return FCEnum.EX
  }
}
