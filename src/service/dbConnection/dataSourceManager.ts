import path from 'path'
import { DataSource } from 'typeorm'
import * as archiveEntities from '@/service/entity/symbolArchiveEntities'
import * as deviceEntities from '@/service/entity/deviceEntities'

export class DataSourceManager {
  private static dataSourceMap: Map<string, DataSource> = new Map<string, DataSource>()

  public static async createSymbolArchiveDataSource (dbName: string, dir: string, passwd?: string) {
    return await this.createBetterSqliteDataSource(dbName, dir, Object.values(archiveEntities), passwd)
  }

  public static async createDeviceDataSource (dbName: string, dir: string, passwd?: string) {
    return await this.createBetterSqliteDataSource(dbName, dir, Object.values(deviceEntities), passwd)
  }

  private static async createBetterSqliteDataSource (dbName: string, dir: string, entities: any[], passwd?: string) {
    // 关闭已有的链接
    await this.closeDataSource(dbName)
    // 新建dataSource
    const dataSource = new DataSource({
      database: path.resolve(dir),
      type: 'better-sqlite3',
      driver: require('better-sqlite3-multiple-ciphers'),
      logging: false,
      logger: 'file',
      entities,
      prepareDatabase: db => {
        db.pragma('cipher=\'sqlcipher\'')
        if (passwd) {
          db.pragma(`key='${passwd}'`)
        }
      }
    })
    this.dataSourceMap.set(dbName, dataSource)
    // 建立连接
    await dataSource.initialize()

    return dataSource
  }

  public static getDataSource (dbName: string) {
    return this.dataSourceMap.get(dbName)
  }

  public static async closeDataSource (dbName: string) {
    if (this.dataSourceMap.has(dbName)) {
      const existDataSource = this.dataSourceMap.get(dbName)
      try {
        if (existDataSource?.isInitialized) {
          await existDataSource?.destroy()
        }
      } catch (e) {
        console.log('数据源销毁失败')
        throw e
      }
    }
  }
}
