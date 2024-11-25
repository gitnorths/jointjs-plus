export enum DbCatEnum {
  app_db, // 应用处理
  mx_db, // 电流电压
  pq_db, // 功率
  cos_db, // 功率因数
  f_db, // 频率
  gse_db, // goose直流量变化
  ex1_db, // 扩展类型1
  ex2_db // 扩展类型2
}

export function getDbCatEnumString (type: DbCatEnum) {
  switch (type) {
    case DbCatEnum.app_db:
      return 'app_db'
    case DbCatEnum.mx_db:
      return 'mx_db'
    case DbCatEnum.pq_db:
      return 'pq_db'
    case DbCatEnum.cos_db:
      return 'cos_db'
    case DbCatEnum.f_db:
      return 'f_db'
    case DbCatEnum.gse_db:
      return 'gse_db'
    case DbCatEnum.ex1_db:
      return 'ex1_db'
    case DbCatEnum.ex2_db:
      return 'ex2_db'
  }
}

export function getDbCatEnumFromString (type: string) {
  switch (type) {
    case 'app_db':
      return DbCatEnum.app_db
    case 'mx_db':
      return DbCatEnum.mx_db
    case 'pq_db':
      return DbCatEnum.pq_db
    case 'cos_db':
      return DbCatEnum.cos_db
    case 'f_db' :
      return DbCatEnum.f_db
    case 'gse_db':
      return DbCatEnum.gse_db
    case 'ex1_db' :
      return DbCatEnum.ex1_db
    case 'ex2_db':
      return DbCatEnum.ex2_db
  }
}
