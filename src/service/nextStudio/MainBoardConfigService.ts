import { FuncKeysConfig, LEDConfigItem, MainBoardConfig, MainBoardSlotConfig, PanelConfig } from '@/model/dto'
import { HWConfigEntity } from '@/service/entity/deviceEntities'
import { DataSourceManager } from '@/service/dbConnection/dataSourceManager'
import * as R from 'ramda'

export class MainBoardConfigService {
  public static async openMainBoardConfig (obj: MainBoardConfig, dbName: string) {
    if (!obj) {
      return null
    }
    const dataSource = DataSourceManager.getDataSource(dbName)
    if (!dataSource) {
      throw new Error(`母板打开失败，数据源${dbName}不存在`)
    }
    const hardwareConfigEntities = await dataSource.getRepository(HWConfigEntity).find({ relations: ['slots'] })
    // FIXME
    const hardwareConfigEntity = hardwareConfigEntities[0]

    const result = new MainBoardConfig(obj)
    if (hardwareConfigEntity) {
      result.type = hardwareConfigEntity.mainBoardType
      if (R.isNotEmpty(hardwareConfigEntity.slots)) {
        for (const slotEntity of hardwareConfigEntity.slots) {
          result.slots.push(new MainBoardSlotConfig(slotEntity))
        }
      }
      result.slots = result.slots.sort((a, b) => a.slot - b.slot)
    }
    return result
  }

  public static async openPanelConfig (dbName: string, obj: PanelConfig) {
    if (!obj) {
      return null
    }
    const dataSource = DataSourceManager.getDataSource(dbName)
    if (!dataSource) {
      throw new Error(`硬件打开失败，数据源${dbName}不存在`)
    }
    const hardwareConfigEntities = await dataSource.getRepository(HWConfigEntity).find({ relations: ['funcKeys', 'leds'] })
    // FIXME
    const hardwareConfigEntity = hardwareConfigEntities[0]

    const result = new PanelConfig(obj)
    if (hardwareConfigEntity) {
      result.type = hardwareConfigEntity.panelType
      if (R.isNotEmpty(hardwareConfigEntity.funcKeys)) {
        for (const funcKey of hardwareConfigEntity.funcKeys) {
          result.funcKeys.push(new FuncKeysConfig(funcKey))
        }
      }
      if (R.isNotEmpty(hardwareConfigEntity.leds)) {
        for (const led of hardwareConfigEntity.leds) {
          result.lecConfig.push(new LEDConfigItem(led))
        }
      }
    }
    return result
  }
}
