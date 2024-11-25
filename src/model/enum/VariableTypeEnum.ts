export enum VariableTypeEnum {
  ANY = -1,
  BOOL, // BIT1_TYPE
  INT8, // INT8_TYPE
  UINT8, // UINT8_TYPE
  INT16, // INT16_TYPE
  UINT16, // UINT16_TYPE
  INT32, // INT32_TYPE
  UINT32, // UINT32_TYPE
  INT64, // INT64_TYPE
  UINT64, // UINT64_TYPE
  FLOAT32, // FLOAT_TYPE
  FLOAT64, // DOUBLE_TYPE
  SOE_BOOL, // SOE_BOOL_TYPE
  SOE_DBPOS, // SOE_DBPOS_TYPE
  SOE_FLOAT, // SOE_FLOAT_TYPE
  CPLXF32, // COMPLEX_FLOAT_TYPE
  STRING, // STRING_TYPE
  STRUCT, // STRUCT_TYPE
  POINTER, // POINTER_TYPE
}

export function getVariableTypeString (type: VariableTypeEnum) {
  switch (type) {
    case VariableTypeEnum.ANY:
      return 'Any'
    case VariableTypeEnum.BOOL:
      return 'BOOL'
    case VariableTypeEnum.INT8:
      return 'INT8'
    case VariableTypeEnum.UINT8:
      return 'UINT8'
    case VariableTypeEnum.INT16:
      return 'INT16'
    case VariableTypeEnum.UINT16:
      return 'UINT16'
    case VariableTypeEnum.INT32:
      return 'INT32'
    case VariableTypeEnum.UINT32:
      return 'UINT32'
    case VariableTypeEnum.INT64:
      return 'INT64'
    case VariableTypeEnum.UINT64:
      return 'UINT64'
    case VariableTypeEnum.FLOAT32:
      return 'FLOAT32'
    case VariableTypeEnum.FLOAT64:
      return 'FLOAT64'
    case VariableTypeEnum.SOE_BOOL:
      return 'SOE_BOOL'
    case VariableTypeEnum.SOE_DBPOS:
      return 'SOE_DBPOS'
    case VariableTypeEnum.SOE_FLOAT:
      return 'SOE_FLOAT'
    case VariableTypeEnum.CPLXF32:
      return 'CPLXF32'
    case VariableTypeEnum.STRING:
      return 'STRING'
    case VariableTypeEnum.STRUCT:
      return 'STRUCT'
    case VariableTypeEnum.POINTER:
      return 'POINTER'
  }
}

export function getRegTypeString (type: VariableTypeEnum) {
  switch (type) {
    case VariableTypeEnum.ANY:
      return ''
    case VariableTypeEnum.BOOL:
      return 'b1'
    case VariableTypeEnum.INT8:
      return 'i8'
    case VariableTypeEnum.UINT8:
      return 'u8'
    case VariableTypeEnum.INT16:
      return 'i16'
    case VariableTypeEnum.UINT16:
      return 'u16'
    case VariableTypeEnum.INT32:
      return 'i32'
    case VariableTypeEnum.UINT32:
      return 'u32'
    case VariableTypeEnum.INT64:
      return 'i64'
    case VariableTypeEnum.UINT64:
      return 'u64'
    case VariableTypeEnum.FLOAT32:
      return 'f'
    case VariableTypeEnum.FLOAT64:
      return 'd'
    case VariableTypeEnum.SOE_BOOL:
      return 'soeb'
    case VariableTypeEnum.SOE_DBPOS:
      return 'soed'
    case VariableTypeEnum.SOE_FLOAT:
      return 'soef'
    case VariableTypeEnum.CPLXF32:
      return 'cmpxf'
    case VariableTypeEnum.STRING:
      return 's'
    case VariableTypeEnum.STRUCT:
      return 'st'
    case VariableTypeEnum.POINTER:
      return 'p'
  }
}

export function getFormatString (type: VariableTypeEnum) {
  switch (type) {
    case VariableTypeEnum.ANY:
      return ''
    case VariableTypeEnum.BOOL:
      return '%x'
    case VariableTypeEnum.INT8:
      return '%d'
    case VariableTypeEnum.UINT8:
      return '%u'
    case VariableTypeEnum.INT16:
      return '%d'
    case VariableTypeEnum.UINT16:
      return '%u'
    case VariableTypeEnum.INT32:
      return '%ld'
    case VariableTypeEnum.UINT32:
      return '%lu'
    case VariableTypeEnum.INT64:
      return '%lld'
    case VariableTypeEnum.UINT64:
      return '%llu'
    case VariableTypeEnum.FLOAT32:
      return '%7.2f' // "%7.2f" "%.f" "%.1f" "%.2f" "%.3f" "%.4f" "%.5f" "%.0f"
    case VariableTypeEnum.FLOAT64:
      return '%7.2lf' // "%7.2fl" "%.lf" "%.1lf" "%.2lf" "%.3lf" "%.4lf" "%.5lf" "%.0lf"
    case VariableTypeEnum.SOE_BOOL:
      return ''
    case VariableTypeEnum.SOE_DBPOS:
      return ''
    case VariableTypeEnum.SOE_FLOAT:
      return ''
    case VariableTypeEnum.CPLXF32:
      return ''
    case VariableTypeEnum.STRING:
      return '%s'
    case VariableTypeEnum.STRUCT:
      return ''
    case VariableTypeEnum.POINTER:
      return '%p'
  }
}

export function getVariableTypeEnum (type: string) {
  switch (type) {
    case 'Any':
      return VariableTypeEnum.ANY
    case 'BOOL':
      return VariableTypeEnum.BOOL
    case 'INT8':
      return VariableTypeEnum.INT8
    case 'UINT8':
      return VariableTypeEnum.UINT8
    case 'INT16':
      return VariableTypeEnum.INT16
    case 'UINT16':
      return VariableTypeEnum.UINT16
    case 'INT32':
      return VariableTypeEnum.INT32
    case 'UINT32':
      return VariableTypeEnum.UINT32
    case 'INT64':
      return VariableTypeEnum.INT64
    case 'UINT64':
      return VariableTypeEnum.UINT64
    case 'FLOAT32':
      return VariableTypeEnum.FLOAT32
    case 'FLOAT64':
      return VariableTypeEnum.FLOAT64
    case 'SOE_BOOL':
      return VariableTypeEnum.SOE_BOOL
    case 'SOE_DBPOS':
      return VariableTypeEnum.SOE_DBPOS
    case 'SOE_FLOAT':
      return VariableTypeEnum.SOE_FLOAT
    case 'CPLXF32':
      return VariableTypeEnum.CPLXF32
    case 'STRING':
      return VariableTypeEnum.STRING
    case 'STRUCT':
      return VariableTypeEnum.STRUCT
    case 'POINTER':
      return VariableTypeEnum.POINTER
    default:
      return VariableTypeEnum.ANY
  }
}
