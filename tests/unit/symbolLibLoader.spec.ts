import path from 'path'
import fse from 'fs-extra'
import { SymbolArchiveService } from '@/service/symbolMaker/SymbolArchiveService'
import { ARCHIVE_FILE_EXT_NAME } from '@/util/consts'

describe('SymbolLibLoaderTest', () => {
  const saveDir = path.join(__dirname, '../temp')
  const name = 'platform'
  const request = {
    toolVersion: '3.0.0',
    name,
    organization: '中研院',
    llsymPath: path.resolve('D:\\Code\\dcvisualstudio_new\\run\\bin\\symbols\\symbols.llsym'),
    saveDir
  }
  const dbPath = path.join(saveDir, request.name, `${request.name}${ARCHIVE_FILE_EXT_NAME}`)

  beforeAll(() => {
    fse.removeSync(path.join(saveDir, name))
  })

  it('should save lib to Repo', async () => {
    const dataBasePath = await SymbolArchiveService.importSymbolArchive(request)
    expect(dataBasePath).toEqual(dbPath)
  })
})
