import { SymbolArchiveService } from './symbolMaker/SymbolArchiveService'
import { SymbolBlockVersionService } from '@/service/symbolMaker/SymbolBlockVersionService'
import { SymbolLibService } from '@/service/symbolMaker/SymbolLibService'
import { SymbolArchive, SymbolBlock, SymbolLib } from '@/model/dto'
import { SymbolBlockService } from '@/service/symbolMaker/SymbolBlockService'

export class SymbolMakerService {
  /**
   * 导入已有的符号库
   * @param requestData
   */
  public static importSymbolArchive (requestData: {
    toolVersion: string,
    name: string,
    organization: string,
    llsymPath: string,
    saveDir: string
  }) {
    return SymbolArchiveService.importSymbolArchive(requestData)
  }

  /**
   * 打开符号库
   * @param dbPath
   */
  public static openSymbolArchive (dbPath: string) {
    return SymbolArchiveService.openSymbolArchive(dbPath)
  }

  /**
   * 新建符号库
   * @param requestData
   */
  public static createSymbolArchive (requestData: {
    toolVersion: string,
    name: string,
    organization: string,
    saveDir: string
  }) {
    return SymbolArchiveService.createSymbolArchive(requestData)
  }

  public static updateSymbolArchive () {
    return SymbolArchiveService.updateSymbolArchive()
  }

  public static openSymbolBlockVersion (requestData: { archiveName: string, pathId: string }) {
    return SymbolBlockVersionService.openSymbolBlockVersion(requestData)
  }

  public static createSymbolLib (requestData: { name: string, desc: string, index: number }, archive: SymbolArchive) {
    return SymbolLibService.createSymbolLib(requestData, archive)
  }

  public static async updateSymbolLib (obj: SymbolLib, archive: SymbolArchive) {
    return SymbolLibService.updateSymbolLib(obj, archive)
  }

  public static async createSymbolBlock (newBlock: {
    name: string;
    desc: string,
    index: number
  }, symbolLib: SymbolLib) {
    return SymbolBlockService.createSymbolBlock(newBlock, symbolLib)
  }

  static async updateSymbolBlock (obj: SymbolBlock, symbolLib: SymbolLib) {
    return SymbolBlockService.updateSymbolBlock(obj, symbolLib)
  }

  static save () {
    // TODO
  }
}
