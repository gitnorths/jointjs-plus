import { InfluxDB, Precision } from 'influx'

export const INFLUX_DEFAULT_HOST = '127.0.0.1'
export const INFLUX_DEFAULT_PORT = 8086
export const INFLUX_DEFAULT_RETENTION_POLICY = '180d'

export class InfluxClient {
  constructor (dbName, host, port) {
    this.dbName = dbName
    this.host = host || INFLUX_DEFAULT_HOST
    this.port = port || INFLUX_DEFAULT_PORT

    this.influxDB = new InfluxDB({
      host: this.host,
      port: this.port,
      database: this.dbName
    })
  }

  getDatabaseNames () {
    return this.influxDB.getDatabaseNames()
  }

  createDatabase () {
    return this.influxDB.createDatabase(this.dbName)
  }

  showRetentionPolicies () {
    return this.influxDB.showRetentionPolicies(this.dbName)
  }

  createRetentionPolicy () {
    return this.influxDB.createRetentionPolicy(INFLUX_DEFAULT_RETENTION_POLICY, {
      database: this.dbName,
      duration: INFLUX_DEFAULT_RETENTION_POLICY,
      replication: 1,
      isDefault: true
    })
  }

  writePoints (points) {
    return this.influxDB.writePoints(points, {
      database: this.dbName,
      retentionPolicy: INFLUX_DEFAULT_RETENTION_POLICY,
      precision: Precision.Milliseconds
    })
  }

  getMeasurements () {
    return this.influxDB.getMeasurements(this.dbName)
  }

  getRecords (naList, start, end) {
    if (!naList && naList.length === 0) {
      return []
    }
    const measurements = naList.map(na => `"${na}"`).join(', ')
    const query = `select * from ${measurements} where time >= ${start} AND time <= ${end}`
    return this.influxDB.query(query)
  }

  query (query) {
    return this.influxDB.query(query)
  }
}
