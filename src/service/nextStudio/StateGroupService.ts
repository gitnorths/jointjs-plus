import * as R from 'ramda'
import { In } from 'typeorm'
import { DataSourceManager } from '@/service/dbConnection/dataSourceManager'
import { StateGroupItemEntity, SymbolBlockVarOutputInstEntity } from '@/service/entity/deviceEntities'
import { StateGroupItem } from '@/model/dto'
import { EnableStatusEnum } from '@/model/enum'

export class StateGroupService {
  public static async openStateGroup (obj: any, dbName: string) {
    const result: StateGroupItem[] = []
    if (!obj) {
      return result
    }
    const dataSource = DataSourceManager.getDataSource(dbName)
    if (!dataSource) {
      throw new Error(`状态分组打开失败，数据源${dbName}不存在`)
    }
    const itemEntities = await dataSource.getRepository(StateGroupItemEntity).find({
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
      const item = new StateGroupItem(itemEntity)
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
