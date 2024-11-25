import * as R from 'ramda'
import { In } from 'typeorm'
import { DataSourceManager } from '@/service/dbConnection/dataSourceManager'
import { RecordGroupItemEntity, SymbolBlockVarOutputInstEntity } from '@/service/entity/deviceEntities'
import { RecordGroupItem } from '@/model/dto'
import { EnableStatusEnum } from '@/model/enum'

export class RecordGroupService {
  public static async openRecordGroup (obj: any, dbName: string) {
    const result: RecordGroupItem[] = []
    if (!obj) {
      return result
    }
    const dataSource = DataSourceManager.getDataSource(dbName)
    if (!dataSource) {
      throw new Error(`录制分组打开失败，数据源${dbName}不存在`)
    }
    const itemEntities = await dataSource.getRepository(RecordGroupItemEntity).find({
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
      const item = new RecordGroupItem(itemEntity)
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
