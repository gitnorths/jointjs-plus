import * as R from 'ramda'
import { In } from 'typeorm'
import { DataSourceManager } from '@/service/dbConnection/dataSourceManager'
import { ControlGroupItemEntity, SymbolBlockInstEntity } from '@/service/entity/deviceEntities'
import { ControlGroupItem } from '@/model/dto'
import { EnableStatusEnum } from '@/model/enum'

export class ControlGroupService {
  public static async openControlGroup (obj: any, dbName: string) {
    const result: ControlGroupItem[] = []
    if (!obj) {
      return result
    }
    const dataSource = DataSourceManager.getDataSource(dbName)
    if (!dataSource) {
      throw new Error(`控制分组打开失败，数据源${dbName}不存在`)
    }
    const itemEntities = await dataSource.getRepository(ControlGroupItemEntity).find({
      where: { groupId: obj.id }, order: { index: 'ASC' }
    })
    if (R.isEmpty(itemEntities)) {
      return result
    }
    const naArr = itemEntities.map(entity => entity.name)

    // FIXME 验证是否有 sql 语句过长的报错
    const instEntities = await dataSource.getRepository(SymbolBlockInstEntity).find({
      where: { sAddr: In(naArr) }
    })
    const instGroup = R.groupBy<SymbolBlockInstEntity>(R.prop('sAddr'))(instEntities)

    for (const itemEntity of itemEntities) {
      const item = new ControlGroupItem(itemEntity)
      const symbols = instGroup[item.name]
      if (symbols && R.isNotEmpty(symbols)) {
        item.status = symbols[0].status
      } else {
        item.status = EnableStatusEnum.DIRTY
      }
      result.push(item)
    }

    return result
  }
}
