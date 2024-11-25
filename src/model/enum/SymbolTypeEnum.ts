export enum SymbolTypeEnum {
  SYM_TYPE_NULL = -1, // 未定义类型
  SYM_COMPONENT = 0, // 元件符号
  SYM_BUS, // 总线符号
  SYM_LOGIC, // 逻辑符号
  SYM_COMM, // 通信符号
  SYM_GRAPH, // 图元符号（废弃）
  SYM_EXTEND, // 二次扩展符号
  SYM_LCD, // LCD菜单符号
  SYM_CONST, // 常量符号(废弃)
  SYM_VARGROUP, // 信号分组符号
  SYM_COMPONENT_GP, // 组合逻辑符号
  SYM_OP, // 操作符
}

export function getSymbolTypeEnum (type: string) {
  switch (type) {
    case 'SYM_TYPE_NULL':
      return SymbolTypeEnum.SYM_TYPE_NULL
    case 'SYM_COMPONENT':
      return SymbolTypeEnum.SYM_COMPONENT
    case 'SYM_BUS':
      return SymbolTypeEnum.SYM_BUS
    case 'SYM_LOGIC':
      return SymbolTypeEnum.SYM_LOGIC
    case 'SYM_COMM':
      return SymbolTypeEnum.SYM_COMM
    case 'SYM_GRAPH':
      return SymbolTypeEnum.SYM_GRAPH
    case 'SYM_EXTEND':
      return SymbolTypeEnum.SYM_EXTEND
    case 'SYM_LCD':
      return SymbolTypeEnum.SYM_LCD
    case 'SYM_CONST':
      return SymbolTypeEnum.SYM_CONST
    case 'SYM_VARGROUP':
      return SymbolTypeEnum.SYM_VARGROUP
    case 'SYM_COMPONENT_GP':
      return SymbolTypeEnum.SYM_COMPONENT_GP
    case 'SYM_OP':
      return SymbolTypeEnum.SYM_OP
    default:
      return SymbolTypeEnum.SYM_TYPE_NULL
  }
}
