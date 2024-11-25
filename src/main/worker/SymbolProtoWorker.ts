import * as path from 'path'
import * as fse from 'fs-extra'
import * as R from 'ramda'
import Database from 'better-sqlite3-multiple-ciphers'
import { parentPort } from 'node:worker_threads'
import { DEVICE_FILE_EXT_NAME } from '@/util/consts'
import { ProtoSymbolArchive, ProtoSymbolBlock, ProtoSymbolLib } from '@/model/dto'

async function getSymbolProto (dbPath: string) {
// 检查路径是否存在
  if (!dbPath.endsWith(DEVICE_FILE_EXT_NAME)) {
    throw new Error(`打开装置失败！${dbPath}文件名错误，请选择*${DEVICE_FILE_EXT_NAME}文件`)
  }
  const realPath = path.resolve(dbPath)
  if (!fse.existsSync(realPath)) {
    throw new Error(`打开装置失败！${realPath}不存在`)
  }
  const db = new Database(realPath)
  try {
    const results = []
    const archiveRows: any[] = db.prepare(`SELECT *
                                           FROM proto_symbol_archive`).all()
    const libRows: any[] = db.prepare(`SELECT *
                                       FROM proto_symbol_lib
                                       ORDER BY 'index'`).all()
    const symbolRows: any[] = db.prepare(`SELECT *
                                          FROM proto_symbol_block
                                          ORDER BY 'index'`).all()
    const libGroup = R.groupBy<any>(R.prop('parentPathId'))(libRows)
    const symbolGroup = R.groupBy<any>(R.prop('parentPathId'))(symbolRows)

    if (archiveRows && R.isNotEmpty(archiveRows)) {
      for (const archiveRow of archiveRows) {
        const archive = new ProtoSymbolArchive(archiveRow)
        const libRows = libGroup[archiveRow.pathId]
        if (libRows && R.isNotEmpty(libRows)) {
          for (const libRow of libRows) {
            const lib = new ProtoSymbolLib(libRow, archive)
            const symbolRows = symbolGroup[libRow.pathId]
            if (symbolRows && R.isNotEmpty(symbolRows)) {
              for (const symbolRow of symbolRows) {
                const symbol = new ProtoSymbolBlock(symbolRow, lib)
                lib.children.push(symbol)
              }
            }
            archive.children.push(lib)
          }
        }
        results.push(archive)
      }
    }
    return results
  } finally {
    db.close()
  }
}

parentPort?.on('message', async (message) => {
  // FIXME
  console.log('Received message from main thread:', message)
  const result = await getSymbolProto(message.dbPath)
  // 将结果发送回主线程
  parentPort?.postMessage(result)
})
