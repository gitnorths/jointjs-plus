import * as path from 'path'
import * as execa from 'execa'

export const startInfluxD = () => {
  const influxDPath = path.join(process.cwd(), 'tools/influxd-1.8.10.exe')
  const influxDProc = execa(influxDPath, null, {
    detached: true,
    shell: true,
    env: { INFLUXDB_REPORTING_DISABLED: true }
  })
  return influxDProc
}
