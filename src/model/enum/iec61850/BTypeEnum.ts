export enum BTypeEnum {
  BOOLEAN,
  INT8,
  INT16,
  INT24,
  INT32,
  INT128,
  INT8U,
  INT16U,
  INT24U,
  INT32U,
  FLOAT32,
  FLOAT64,
  Enum,
  Dbpos,
  Tcmd,
  Quality,
  Timestamp,
  VisString32,
  VisString64,
  VisString255,
  Octet64,
  Struct,
  EntryTime,
  Unicode255,
  Check,
}

export function getBTypeEnumByStr (str: string) {
  switch (str) {
    case 'BOOLEAN':
      return BTypeEnum.BOOLEAN
    case 'INT8':
      return BTypeEnum.INT8
    case 'INT16':
      return BTypeEnum.INT16
    case 'INT24':
      return BTypeEnum.INT24
    case 'INT32':
      return BTypeEnum.INT32
    case 'INT128':
      return BTypeEnum.INT128
    case 'INT8U':
      return BTypeEnum.INT8U
    case 'INT16U':
      return BTypeEnum.INT16U
    case 'INT24U':
      return BTypeEnum.INT24U
    case 'INT32U':
      return BTypeEnum.INT32U
    case 'FLOAT32':
      return BTypeEnum.FLOAT32
    case 'FLOAT64':
      return BTypeEnum.FLOAT64
    case 'Enum':
      return BTypeEnum.Enum
    case 'Dbpos':
      return BTypeEnum.Dbpos
    case 'Tcmd':
      return BTypeEnum.Tcmd
    case 'Quality':
      return BTypeEnum.Quality
    case 'Timestamp':
      return BTypeEnum.Timestamp
    case 'VisString32':
      return BTypeEnum.VisString32
    case 'VisString64':
      return BTypeEnum.VisString64
    case 'VisString255':
      return BTypeEnum.VisString255
    case 'Octet64':
      return BTypeEnum.Octet64
    case 'Struct':
      return BTypeEnum.Struct
    case 'EntryTime':
      return BTypeEnum.EntryTime
    case 'Unicode255':
      return BTypeEnum.Unicode255
    case 'Check':
      return BTypeEnum.Check
  }
}
