import * as R from 'ramda'
import { In } from 'typeorm'
import { DataSourceManager } from '@/service/dbConnection/dataSourceManager'
import {
  SettingGroupItemEntity,
  SettingGroupItemMergeEntity,
  SymbolBlockVarOutputInstEntity,
  SymbolBlockVarParamInstEntity
} from '@/service/entity/deviceEntities'
import { SettingGroupItem, SettingGroupItemMerge } from '@/model/dto'
import { EnableStatusEnum } from '@/model/enum'

export class SettingGroupService {
  public static async openSettingGroup (obj: any, dbName: string) {
    const result: SettingGroupItem[] = []
    if (!obj) {
      return result
    }
    const dataSource = DataSourceManager.getDataSource(dbName)
    if (!dataSource) {
      throw new Error(`定值分组打开失败，数据源${dbName}不存在`)
    }
    const itemEntities = await dataSource.getRepository(SettingGroupItemEntity).find({
      where: { groupId: obj.id }, order: { index: 'ASC' }
    })
    if (R.isEmpty(itemEntities)) {
      return result
    }
    const naArr = itemEntities.map(entity => entity.name)

    // FIXME 验证是否有 sql 语句过长的报错
    const mergeEntities = await dataSource.getRepository(SettingGroupItemMergeEntity).find({
      where: { itemId: In(itemEntities.map(entity => entity.id)) },
      order: { index: 'ASC' }
    })
    if (R.isNotEmpty(mergeEntities)) {
      mergeEntities.forEach(merge => {
        naArr.push(merge.name)
      })
    }
    const mergeGroup = R.groupBy<SettingGroupItemMergeEntity>(R.prop('itemId'))(mergeEntities)
    // FIXME 验证是否有 sql 语句过长的报错
    const paramEntities = await dataSource.getRepository(SymbolBlockVarParamInstEntity).find({
      where: { sAddr: In(naArr) }
    })
    const paramGroup = R.groupBy<SymbolBlockVarParamInstEntity>(R.prop('sAddr'))(paramEntities)

    const outputEntities = await dataSource.getRepository(SymbolBlockVarOutputInstEntity).find({
      where: { sAddr: In(naArr) }
    })
    const outputGroup = R.groupBy<SymbolBlockVarOutputInstEntity>(R.prop('sAddr'))(outputEntities)

    for (const itemEntity of itemEntities) {
      const item = new SettingGroupItem(itemEntity)
      const params = paramGroup[item.name]
      if (params && R.isNotEmpty(params)) {
        item.status = params[0].status
      } else {
        const outputs = outputGroup[item.name]
        if (outputs && R.isNotEmpty(outputs)) {
          item.status = outputs[0].status
        } else {
          item.status = EnableStatusEnum.DIRTY
        }
      }

      const merges = mergeGroup[itemEntity.id]
      if (merges && R.isNotEmpty(merges)) {
        item.merges = merges.map(merge => {
          const mergeItem = new SettingGroupItemMerge(merge)
          const mergeParams = paramGroup[mergeItem.name]
          if (mergeParams && R.isNotEmpty(mergeParams)) {
            mergeItem.status = mergeParams[0].status
          } else {
            const outputs = outputGroup[mergeItem.name]
            if (outputs && R.isNotEmpty(outputs)) {
              mergeItem.status = outputs[0].status
            } else {
              mergeItem.status = EnableStatusEnum.DIRTY
            }
          }
          return mergeItem
        })
      }
      result.push(item)
    }

    return result
  }
}
