import * as R from 'ramda'
import { SymbolBlock, SymbolLib } from '@/model/dto'
import { DataSourceManager } from '@/service/dbConnection/dataSourceManager'
import { SymbolBlockEntity, SymbolLibEntity } from '@/service/entity/symbolArchiveEntities'

export class SymbolBlockService {
  public static async createSymbolBlock (
    requestData: { name: string; desc: string, index: number }, symbolLib: SymbolLib
  ) {
    if (!requestData || !symbolLib || !symbolLib.parent) {
      throw new Error('新建符号失败，输入不能为空')
    }
    const dataSource = DataSourceManager.getDataSource(symbolLib.parent.name)
    if (!dataSource) {
      throw new Error('新建符号失败，数据库连接不存在')
    }
    const libEntity = await dataSource.getRepository(SymbolLibEntity).findOne({ where: { pathId: symbolLib.pathId } })
    if (!libEntity) {
      throw new Error(`新建符号失败，符号库${symbolLib.name}不存在`)
    }
    const dao = dataSource.getRepository(SymbolBlockEntity)

    const entity = new SymbolBlockEntity(requestData, libEntity)
    entity.pathId = `${libEntity.pathId}/${requestData.name}`.toLowerCase()
    const existEntity = await dao.find({ where: { pathId: entity.pathId } })
    if (R.isNotEmpty(existEntity)) {
      throw new Error(`新建符号失败，已存在名为${requestData.name}的符号`)
    }
    await dao.save(entity)

    return new SymbolBlock(entity)
  }

  public static async updateSymbolBlock (obj: SymbolBlock, lib: SymbolLib) {
    // TODO
  }
}
