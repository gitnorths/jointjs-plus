import * as R from 'ramda'
import { In } from 'typeorm'
import { DataSourceManager } from '@/service/dbConnection/dataSourceManager'
import {
  SymbolBlockVarOutputInstEntity,
  WaveConfigEntity,
  WaveFrequencyItemEntity,
  WaveGroupItemEntity
} from '@/service/entity/deviceEntities'
import { EnableStatusEnum } from '@/model/enum'
import { WaveConfig, WaveFrequencyItem, WaveGroupItem } from '@/model/dto'

export class WaveGroupService {
  public static async openWaveConfig (obj: any, dbName: string) {
    if (!obj) {
      return null
    }
    const dataSource = DataSourceManager.getDataSource(dbName)
    if (!dataSource) {
      throw new Error(`录波实例打开失败，数据源${dbName}不存在`)
    }
    const configEntity = await dataSource.getRepository(WaveConfigEntity).findOne({ where: { instId: obj.id } })
    if (!configEntity) {
      return null
    }
    const config = new WaveConfig(configEntity)

    const frequencyEntities = await dataSource.getRepository(WaveFrequencyItemEntity).find({
      where: { waveConfigId: configEntity.id }, order: { index: 'ASC' }
    })
    if (frequencyEntities && R.isNotEmpty(frequencyEntities)) {
      config.frequencies = frequencyEntities.map(freq => new WaveFrequencyItem(freq))
    }

    return config
  }

  public static async openWaveGroup (obj: any, dbName: string) {
    const result: WaveGroupItem[] = []
    if (!obj) {
      return result
    }
    const dataSource = DataSourceManager.getDataSource(dbName)
    if (!dataSource) {
      throw new Error(`录波分组打开失败，数据源${dbName}不存在`)
    }
    const itemEntities = await dataSource.getRepository(WaveGroupItemEntity).find({
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

    // TODO 赋值的变量状态查询
    for (const itemEntity of itemEntities) {
      const item = new WaveGroupItem(itemEntity)
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
