import * as R from 'ramda'
import { In } from 'typeorm'
import { DataSourceManager } from '@/service/dbConnection/dataSourceManager'
import { EventInfoGroupItemEntity, SymbolBlockVarOutputInstEntity } from '@/service/entity/deviceEntities'
import { EventInfoGroupItem } from '@/model/dto'
import { EnableStatusEnum } from '@/model/enum'

export class EventInfoGroupService {
  public static async openEventInfoGroup (obj: any, dbName: string) {
    const result: EventInfoGroupItem[] = []
    if (!obj) {
      return result
    }
    const dataSource = DataSourceManager.getDataSource(dbName)
    if (!dataSource) {
      throw new Error(`事件信息分组打开失败，数据源${dbName}不存在`)
    }
    const itemEntities = await dataSource.getRepository(EventInfoGroupItemEntity).find({
      where: { groupId: obj.id }, order: { index: 'ASC' }
    })
    if (R.isEmpty(itemEntities)) {
      return result
    }
    const naArr = itemEntities.map(entity => entity.name)

    // FIXME 验证是否有 sql 语句过长的报错
    const outputEntities = await dataSource.getRepository(SymbolBlockVarOutputInstEntity).find({
      where: { sAddr: In(naArr) }
    })
    const outputGroup = R.groupBy<SymbolBlockVarOutputInstEntity>(R.prop('sAddr'))(outputEntities)

    for (const itemEntity of itemEntities) {
      const item = new EventInfoGroupItem(itemEntity)
      const outputs = outputGroup[item.name]
      if (outputs && R.isNotEmpty(outputs)) {
        item.status = outputs[0].status
      } else {
        item.status = EnableStatusEnum.DIRTY
      }
      result.push(item)
    }

    return result
  }
}
