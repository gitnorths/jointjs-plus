import { DataSourceManager } from '@/service/dbConnection/dataSourceManager'
import { In } from 'typeorm'
import * as R from 'ramda'
import {
  ConnectLineEntity,
  ConnectLineRouterPointsEntity,
  LabelInEntity,
  LabelOutEntity,
  PageAnnotationEntity,
  SymbolBlockInstEntity,
  SymbolBlockVarInnerInstEntity,
  SymbolBlockVarInputInstEntity,
  SymbolBlockVarOtherInstEntity,
  SymbolBlockVarOutputInstEntity,
  SymbolBlockVarParamInstEntity
} from '@/service/entity/deviceEntities'
import {
  ConnectLine,
  ConnectLineRouterPoints,
  LabelIn,
  LabelOut,
  Page,
  PageAnnotation,
  SymbolBlockInst,
  SymbolBlockVarInnerInst,
  SymbolBlockVarInputInst,
  SymbolBlockVarOtherInst,
  SymbolBlockVarOutputInst,
  SymbolBlockVarParamInst
} from '@/model/dto'

export class PageService {
  public static async openPage (obj: any, dbName: string) {
    if (!obj) {
      return null
    }
    const dataSource = DataSourceManager.getDataSource(dbName)
    if (!dataSource) {
      throw new Error(`页面打开失败，数据源${dbName}不存在`)
    }
    const labelInEntites = await dataSource.getRepository(LabelInEntity).find({ where: { pageId: obj.id } })
    const labelOutEntities = await dataSource.getRepository(LabelOutEntity).find({ where: { pageId: obj.id } })
    const annotationEntities = await dataSource.getRepository(PageAnnotationEntity).find({ where: { pageId: obj.id } })
    const symbolEntities = await dataSource.getRepository(SymbolBlockInstEntity).find({
      where: { pageId: obj.id }, order: { orderInPage: 'ASC' }
    })
    const symbolIdArr = symbolEntities.map(entity => entity.id)

    const inputEntities = await dataSource.getRepository(SymbolBlockVarInputInstEntity).find({
      where: { symbolBlockId: In(symbolIdArr) }, order: { index: 'ASC' }
    })
    const outputEntities = await dataSource.getRepository(SymbolBlockVarOutputInstEntity).find({
      where: { symbolBlockId: In(symbolIdArr) }, order: { index: 'ASC' }
    })
    const paramEntities = await dataSource.getRepository(SymbolBlockVarParamInstEntity).find({
      where: { symbolBlockId: In(symbolIdArr) }, order: { index: 'ASC' }
    })
    const innerEntities = await dataSource.getRepository(SymbolBlockVarInnerInstEntity).find({
      where: { symbolBlockId: In(symbolIdArr) }, order: { index: 'ASC' }
    })
    const otherEntities = await dataSource.getRepository(SymbolBlockVarOtherInstEntity).find({
      where: { symbolBlockId: In(symbolIdArr) }, order: { index: 'ASC' }
    })

    const lineEntities = await dataSource.getRepository(ConnectLineEntity).find({ where: { pageId: obj.id } })
    const lineIdArr = lineEntities.map(entity => entity.id)
    const routerPointEntities = await dataSource.getRepository(ConnectLineRouterPointsEntity).find({
      where: { connectLineId: In(lineIdArr) }, order: { index: 'ASC' }
    })

    const page = new Page(obj, obj.parent)
    if (R.isNotEmpty(annotationEntities)) {
      page.annotations = annotationEntities.map(entity => new PageAnnotation(entity))
    }
    if (R.isNotEmpty(labelInEntites)) {
      page.inLabels = labelInEntites.map(entity => new LabelIn(entity))
    }
    if (R.isNotEmpty(labelOutEntities)) {
      page.outLabels = labelOutEntities.map(entity => new LabelOut(entity))
    }

    if (R.isNotEmpty(symbolEntities)) {
      const inputGroup = R.groupBy<SymbolBlockVarInputInstEntity>(R.prop('symbolBlockId'))(inputEntities)
      const outputGroup = R.groupBy<SymbolBlockVarOutputInstEntity>(R.prop('symbolBlockId'))(outputEntities)
      const paramGroup = R.groupBy<SymbolBlockVarParamInstEntity>(R.prop('symbolBlockId'))(paramEntities)
      const innerGroup = R.groupBy<SymbolBlockVarInnerInstEntity>(R.prop('symbolBlockId'))(innerEntities)
      const otherGroup = R.groupBy<SymbolBlockVarOtherInstEntity>(R.prop('symbolBlockId'))(otherEntities)
      for (const symbolEntity of symbolEntities) {
        const sb = new SymbolBlockInst(symbolEntity)
        const inputs = inputGroup[sb.id]
        if (inputs && R.isNotEmpty(inputs)) {
          sb.inputs = inputs.map(entity => new SymbolBlockVarInputInst(entity))
        }
        const outputs = outputGroup[sb.id]
        if (outputs && R.isNotEmpty(outputs)) {
          sb.outputs = outputs.map(entity => new SymbolBlockVarOutputInst(entity))
        }
        const params = paramGroup[sb.id]
        if (params && R.isNotEmpty(params)) {
          sb.params = params.map(entity => new SymbolBlockVarParamInst(entity))
        }
        const inners = innerGroup[sb.id]
        if (inners && R.isNotEmpty(inners)) {
          sb.inners = inners.map(entity => new SymbolBlockVarInnerInst(entity))
        }
        const others = otherGroup[sb.id]
        if (others && R.isNotEmpty(others)) {
          sb.others = others.map(entity => new SymbolBlockVarOtherInst(entity))
        }
        page.symbolBlocks.push(sb)
      }
    }

    if (R.isNotEmpty(lineEntities)) {
      const pointGroup = R.groupBy<ConnectLineRouterPointsEntity>(R.prop('connectLineId'))(routerPointEntities)
      for (const lineEntity of lineEntities) {
        const line = new ConnectLine(lineEntity)
        const points = pointGroup[line.id]
        if (points && R.isNotEmpty(points)) {
          line.routerPoints = points.map(entity => new ConnectLineRouterPoints(entity))
        }
        page.connectLines.push(line)
      }
    }
    return page
  }
}
