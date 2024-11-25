import { SymbolArchive, SymbolLib } from '@/model/dto'
import { DataSourceManager } from '@/service/dbConnection/dataSourceManager'
import { SymbolArchiveEntity, SymbolLibEntity } from '@/service/entity/symbolArchiveEntities'
import * as R from 'ramda'

export class SymbolLibService {
  public static async createSymbolLib (
    requestData: { name: string; desc: string, index: number }, archive: SymbolArchive
  ) {
    if (!requestData || !archive) {
      throw new Error('新建符号库失败，输入不能为空')
    }
    const dataSource = DataSourceManager.getDataSource(archive.name)
    if (!dataSource) {
      throw new Error('新建符号库失败，数据库连接不存在')
    }
    const symbolArchiveEntity = await dataSource.getRepository(SymbolArchiveEntity).findOne({ where: { pathId: archive.pathId } })
    if (!symbolArchiveEntity) {
      throw new Error(`新建符号库失败，符号仓${archive.name}不存在`)
    }
    const dao = dataSource.getRepository(SymbolLibEntity)

    const entity = new SymbolLibEntity(requestData, symbolArchiveEntity)
    entity.pathId = `${symbolArchiveEntity.pathId}/${requestData.name}`.toLowerCase()
    const existEntity = await dao.find({ where: { pathId: entity.pathId } })
    if (R.isNotEmpty(existEntity)) {
      throw new Error(`新建符号库失败，已存在名为${requestData.name}的符号库`)
    }
    await dao.save(entity)

    return new SymbolLib(entity)
  }

  public static async updateSymbolLib (obj: SymbolLib, archive: SymbolArchive) {
    // TODO
  }
}
