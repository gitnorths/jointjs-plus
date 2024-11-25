import { DataSourceManager } from '@/service/dbConnection/dataSourceManager'
import * as R from 'ramda'
import {
  SymbolBlockVarInner,
  SymbolBlockVarInput,
  SymbolBlockVarOther,
  SymbolBlockVarOutput,
  SymbolBlockVarParam,
  SymbolBlockVersion
} from '@/model/dto'
import {
  SymbolBlockVarInnerEntity,
  SymbolBlockVarInputEntity,
  SymbolBlockVarOtherEntity,
  SymbolBlockVarOutputEntity,
  SymbolBlockVarParamEntity,
  SymbolBlockVersionEntity
} from '@/service/entity/symbolArchiveEntities'

export class SymbolBlockVersionService {
  public static async openSymbolBlockVersion (requestData: { archiveName: string, pathId: string }) {
    const dataSource = DataSourceManager.getDataSource(requestData.archiveName)
    if (!dataSource) {
      throw new Error(`数据库连接 ${requestData.archiveName}不存在`)
    }
    const versionEntity = await dataSource.getRepository(SymbolBlockVersionEntity).findOne({ where: { pathId: requestData.pathId } })
    if (!versionEntity) {
      return null
    }

    const inputEntities = await dataSource.getRepository(SymbolBlockVarInputEntity)
      .find({ where: { parentPathId: requestData.pathId }, order: { index: 'ASC' } })
    const outputEntities = await dataSource.getRepository(SymbolBlockVarOutputEntity)
      .find({ where: { parentPathId: requestData.pathId }, order: { index: 'ASC' } })
    const paramEntities = await dataSource.getRepository(SymbolBlockVarParamEntity)
      .find({ where: { parentPathId: requestData.pathId }, order: { index: 'ASC' } })
    const innerEntities = await dataSource.getRepository(SymbolBlockVarInnerEntity)
      .find({ where: { parentPathId: requestData.pathId }, order: { index: 'ASC' } })
    const otherEntities = await dataSource.getRepository(SymbolBlockVarOtherEntity)
      .find({ where: { parentPathId: requestData.pathId }, order: { index: 'ASC' } })

    const symbolBlock = new SymbolBlockVersion(versionEntity)
    if (R.isNotEmpty(inputEntities)) {
      symbolBlock.inputs = inputEntities.map(entity => new SymbolBlockVarInput(entity))
    }
    if (R.isNotEmpty(outputEntities)) {
      symbolBlock.outputs = outputEntities.map(entity => new SymbolBlockVarOutput(entity))
    }
    if (R.isNotEmpty(paramEntities)) {
      symbolBlock.params = paramEntities.map(entity => new SymbolBlockVarParam(entity))
    }
    if (R.isNotEmpty(innerEntities)) {
      symbolBlock.inners = innerEntities.map(entity => new SymbolBlockVarInner(entity))
    }
    if (R.isNotEmpty(otherEntities)) {
      symbolBlock.others = otherEntities.map(entity => new SymbolBlockVarOther(entity))
    }

    return symbolBlock
  }
}
