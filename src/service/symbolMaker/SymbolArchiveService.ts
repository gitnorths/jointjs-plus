import path from 'path'
import fse from 'fs-extra'
import * as R from 'ramda'
import { SymbolArchive, SymbolBlock, SymbolBlockVersion, SymbolLib } from '@/model/dto'
import { SymbolLibLoader } from '../symbolMaker/loader/SymbolLibLoader'
import { DataSourceManager } from '../dbConnection/dataSourceManager'
import { Dao } from '../dao'
import { SymbolLibEntity } from '../entity/symbolArchives/SymbolLibEntity'
import { SymbolBlockEntity } from '../entity/symbolArchives/SymbolBlockEntity'
import { SymbolBlockVersionEntity } from '../entity/symbolArchives/SymbolBlockVersionEntity'
import { SymbolBlockVarInputEntity } from '../entity/symbolArchives/SymbolBlockVarInputEntity'
import { SymbolBlockVarOutputEntity } from '../entity/symbolArchives/SymbolBlockVarOutputEntity'
import { SymbolBlockVarInnerEntity } from '../entity/symbolArchives/SymbolBlockVarInnerEntity'
import { SymbolBlockVarParamEntity } from '../entity/symbolArchives/SymbolBlockVarParamEntity'
import { SymbolBlockVarOtherEntity } from '../entity/symbolArchives/SymbolBlockVarOtherEntity'
import { SymbolArchiveEntity } from '../entity/symbolArchives/SymbolArchiveEntity'
import { ARCHIVE_FILE_EXT_NAME } from '@/util/consts'

export class SymbolArchiveService {
  public static async openSymbolArchive (dbPath: string) {
    // 检查路径是否存在
    if (!dbPath.endsWith(ARCHIVE_FILE_EXT_NAME)) {
      throw new Error(`打开符号仓失败！${dbPath}文件名错误，请选择*${ARCHIVE_FILE_EXT_NAME}文件`)
    }
    const realPath = path.resolve(dbPath)
    if (!fse.existsSync(realPath)) {
      throw new Error(`打开符号仓失败！${realPath}不存在`)
    }
    const dbName = path.basename(realPath, ARCHIVE_FILE_EXT_NAME)
    // 只有打开工程才会建立数据库连接后不释放
    const dataSource = await DataSourceManager.createSymbolArchiveDataSource(dbName, realPath)

    const symbolArchiveEntities = await dataSource.getRepository(SymbolArchiveEntity).find()
    if (R.isEmpty(symbolArchiveEntities)) {
      // 不存在实体
      throw new Error('打开符号仓失败！数据为空')
    } else if (symbolArchiveEntities.length > 1) {
      // 存在多个实体
      throw new Error('打开符号仓失败！数据不唯一')
    }

    // 查找全部数据
    const symbolLibEntities = await dataSource.getRepository(SymbolLibEntity).find({ order: { index: 'ASC' } })
    const symbolBlockEntities = await dataSource.getRepository(SymbolBlockEntity).find({ order: { index: 'ASC' } })
    const symbolVersionEntities = await dataSource.getRepository(SymbolBlockVersionEntity).find({ order: { index: 'ASC' } })

    const symbolGroup = R.groupBy<SymbolBlockEntity>((entity) => entity.parentPathId)(symbolBlockEntities)
    const versionGroup = R.groupBy<SymbolBlockVersionEntity>((entity) => entity.parentPathId)(symbolVersionEntities)

    const symbolArchive = new SymbolArchive(symbolArchiveEntities[0])
    symbolArchive.dbPath = realPath

    if (R.isNotEmpty(symbolLibEntities)) {
      for (const libEntity of symbolLibEntities) {
        if (libEntity.parentPathId === symbolArchive.pathId) {
          const symbolLib = new SymbolLib(libEntity, symbolArchive)
          symbolArchive.children.push(symbolLib)

          const blockEntities = symbolGroup[symbolLib.pathId]
          if (blockEntities && R.isNotEmpty(blockEntities)) {
            for (const blockEntity of blockEntities) {
              const symbolBlock = new SymbolBlock(blockEntity, symbolLib)
              symbolLib.children.push(symbolBlock)

              const versionEntities = versionGroup[symbolBlock.pathId]
              if (versionEntities && R.isNotEmpty(versionEntities)) {
                symbolBlock.children = versionEntities.map((versionEntity) => new SymbolBlockVersion(versionEntity, symbolBlock))
              }
            }
          }
        }
      }
    }

    return symbolArchive
  }

  public static async createSymbolArchive (
    requestData: { toolVersion: string; name: string; organization: string; saveDir: string }
  ) {
    const archiveDir = path.join(requestData.saveDir, requestData.name)
    const existDir = fse.existsSync(archiveDir)
    if (existDir) {
      throw new Error(`新建符号仓失败！与 '${requestData.name}' 同名的目录已存在，请重新选择路径。`)
    }
    const dataBasePath = path.join(archiveDir, `${requestData.name}${ARCHIVE_FILE_EXT_NAME}`)

    const symbolArchive = new SymbolArchive(requestData)
    symbolArchive.pathId = symbolArchive.name.toLowerCase()

    try {
      const dataSource = await DataSourceManager.createSymbolArchiveDataSource(symbolArchive.name, dataBasePath)
      await dataSource.synchronize()

      const symbolArchiveEntity = new SymbolArchiveEntity(symbolArchive)
      await dataSource.getRepository(SymbolArchiveEntity).save(symbolArchiveEntity)
      // TODO 添加一些默认配置
      return dataBasePath
    } catch (e) {
      throw new Error('新建符号仓失败！数据库写库错误' + e)
    } finally {
      await DataSourceManager.closeDataSource(symbolArchive.name)
    }
  }

  public static async updateSymbolArchive () {
    // TODO
  }

  public static async importSymbolArchive (
    requestData: { toolVersion: string, name: string, organization: string, llsymPath: string, saveDir: string }
  ) {
    const { toolVersion, name, organization, llsymPath, saveDir } = requestData

    // 验证路径
    const { realPath, dataBasePath } = this.checkPathValid(llsymPath, saveDir, name)
    // 数据转换
    const symbolArchive = new SymbolLibLoader().loadSymbolArchive({ name, organization, llsymPath: realPath })
    // 工具版本
    symbolArchive.toolVersion = toolVersion
    // 保存数据
    await this.saveToDb(symbolArchive, dataBasePath)
    // 数据入库
    return dataBasePath
  }

  private static checkPathValid (llsymPath: string, destPath: string, repoName: string) {
    if (!llsymPath || !llsymPath.endsWith('.llsym')) {
      throw new Error('导入符号仓失败！请选择*.llsym文件.')
    }
    const realPath = path.resolve(__dirname, llsymPath)

    if (!fse.existsSync(realPath)) {
      throw new Error(`导入符号仓失败！${realPath}不存在`)
    }
    if (!fse.statSync(realPath).isFile()) {
      throw new Error(`导入符号仓失败！${realPath}不是有效的文件`)
    }
    const archiveDir = path.join(destPath, repoName)
    const existDir = fse.existsSync(archiveDir)
    if (existDir) {
      throw new Error(`导入符号仓失败！与 '${repoName}' 同名的目录已存在，请重新选择路径。`)
    }
    const dataBasePath = path.join(archiveDir, `${repoName}${ARCHIVE_FILE_EXT_NAME}`)

    return { realPath, dataBasePath }
  }

  private static async saveToDb (symbolArchive: SymbolArchive, dataBasePath: string) {
    try {
      // 初始化数据库
      const dataSource = await DataSourceManager.createSymbolArchiveDataSource(symbolArchive.name, dataBasePath)
      await dataSource.synchronize()

      // DTO 转 Entity
      const libEntities: SymbolLibEntity[] = []
      const symbolBlockEntities: SymbolBlockEntity[] = []
      const versionEntities: SymbolBlockVersionEntity[] = []
      const inputEntities: SymbolBlockVarInputEntity[] = []
      const outputEntities: SymbolBlockVarOutputEntity[] = []
      const paramEntities: SymbolBlockVarParamEntity[] = []
      const innerEntities: SymbolBlockVarInnerEntity[] = []
      const otherEntities: SymbolBlockVarOtherEntity[] = []

      const symbolArchiveEntity = new SymbolArchiveEntity(symbolArchive)
      // 符号库
      if (R.isNotEmpty(symbolArchive.children)) {
        for (const symbolLib of symbolArchive.children) {
          const symbolLibEntity = new SymbolLibEntity(symbolLib, symbolArchiveEntity)
          libEntities.push(symbolLibEntity)
          // 符号
          if (R.isNotEmpty(symbolLib.children)) {
            for (const symbolBlock of symbolLib.children) {
              const symbolBlockEntity = new SymbolBlockEntity(symbolBlock, symbolLibEntity)
              symbolBlockEntities.push(symbolBlockEntity)
              // 版本
              if (R.isNotEmpty(symbolBlock.children)) {
                for (const symbolVersion of symbolBlock.children) {
                  const versionEntity = new SymbolBlockVersionEntity(symbolVersion, symbolBlockEntity)
                  versionEntities.push(versionEntity)
                  // 输入
                  if (R.isNotEmpty(symbolVersion.inputs)) {
                    for (const item of symbolVersion.inputs) {
                      inputEntities.push(new SymbolBlockVarInputEntity(item, versionEntity))
                    }
                  }
                  // 输出
                  if (R.isNotEmpty(symbolVersion.outputs)) {
                    for (const item of symbolVersion.outputs) {
                      outputEntities.push(new SymbolBlockVarOutputEntity(item, versionEntity))
                    }
                  }
                  // 参数
                  if (R.isNotEmpty(symbolVersion.params)) {
                    for (const item of symbolVersion.params) {
                      paramEntities.push(new SymbolBlockVarParamEntity(item, versionEntity))
                    }
                  }
                  // 内参
                  if (R.isNotEmpty(symbolVersion.inners)) {
                    for (const item of symbolVersion.inners) {
                      innerEntities.push(new SymbolBlockVarInnerEntity(item, versionEntity))
                    }
                  }
                  // 其他
                  if (R.isNotEmpty(symbolVersion.others)) {
                    for (const item of symbolVersion.others) {
                      otherEntities.push(new SymbolBlockVarOtherEntity(item, versionEntity))
                    }
                  }
                }
              }
            }
          }
        }
      }

      // 写入数据
      await dataSource.transaction(async (entityManager) => {
        await new Dao<SymbolArchiveEntity>(SymbolArchiveEntity, entityManager).save(symbolArchiveEntity)
        await new Dao<SymbolLibEntity>(SymbolLibEntity, entityManager).save(libEntities)
        await new Dao<SymbolBlockEntity>(SymbolBlockEntity, entityManager).save(symbolBlockEntities)
        await new Dao<SymbolBlockVersionEntity>(SymbolBlockVersionEntity, entityManager).save(versionEntities)
        await new Dao<SymbolBlockVarInputEntity>(SymbolBlockVarInputEntity, entityManager).save(inputEntities)
        await new Dao<SymbolBlockVarOutputEntity>(SymbolBlockVarOutputEntity, entityManager).save(outputEntities)
        await new Dao<SymbolBlockVarParamEntity>(SymbolBlockVarParamEntity, entityManager).save(paramEntities)
        await new Dao<SymbolBlockVarInnerEntity>(SymbolBlockVarInnerEntity, entityManager).save(innerEntities)
        await new Dao<SymbolBlockVarOtherEntity>(SymbolBlockVarOtherEntity, entityManager).save(otherEntities)
      })
    } catch (e) {
      throw new Error('导入符号仓失败！符号仓数据写库失败' + e)
    } finally {
      await DataSourceManager.closeDataSource(symbolArchive.name)
    }
  }
}
