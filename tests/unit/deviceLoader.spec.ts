import * as fse from 'fs-extra'
import * as path from 'path'
import { NextStudioService } from '@/service/NextStudioService'
import { DataSourceManager } from '@/service/dbConnection/dataSourceManager'

describe('DeviceLoaderTest', () => {
  jest.setTimeout(60000)

  const saveDir = path.join(__dirname, '../temp')
  const name = 'QNAPEC-411'
  const plsymPath = path.resolve('D:\\NextStudioTest\\QNAPEC-411（主控装置）\\20240815-2\\VisualProgramTool2.6\\run\\bin\\driver\\UDC-001\\S1.0\\UDC-001_S1.0.plsym')

  const dataBasePath = path.join(saveDir, 'QNAPEC-411/QNAPEC-411.device.db')

  beforeAll(() => {
    fse.removeSync(path.join(saveDir, name))
  })

  it('should load device', async () => {
    const dbPath = await NextStudioService.importDevice({ toolVersion: '3.0.0', name, plsymPath, saveDir })
    expect(dbPath).toEqual(dataBasePath)
  })

  it('should open device', async () => {
    const device = await NextStudioService.openDevice(dataBasePath)
    expect(device).not.toBeNull()
    expect(device.series).toEqual(name)
  })

  afterAll(async () => {
    await DataSourceManager.closeDataSource(name)
  })
})
