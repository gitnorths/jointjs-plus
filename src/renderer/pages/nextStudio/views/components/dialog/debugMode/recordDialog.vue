<template>
  <vxe-modal
    v-model="dialogVisible"
    :title="title"
    width="500"
    height="300"
    esc-closable
    show-close
    destroy-on-close
    :before-hide-method="beforeCloseHandler"
    transfer
    ref="modal">
    <el-container style="height: 100%">
      <el-main style="height: 100%;">
        <el-row style="margin-top: 50px">
          <el-col :span="8">
            <el-input-number v-model="hour" :min="0" controls-position="right"/>
            小时
          </el-col>
          <el-col :span="8">
            <el-input-number v-model="min" :min="0" :max="60" controls-position="right"/>
            分钟
          </el-col>
          <el-col :span="8">
            <el-input-number v-model="sec" :min="0" :max="60" controls-position="right"/>
            秒
          </el-col>
        </el-row>
      </el-main>
      <el-footer height="60px">
        <div style="width: 100%; display: flex; justify-content: center;margin-top: 10px">
          <el-button @click="cancel">取消</el-button>
          <el-button type="primary" @click="confirm">确认</el-button>
        </div>
      </el-footer>
    </el-container>
  </vxe-modal>
</template>

<script>
import { INFLUX_DEFAULT_RETENTION_POLICY, InfluxClient } from '@/renderer/common/influxDB/influxClient'
import { startInfluxD } from '@/renderer/common/influxDB/influxD'

export default {
  name: 'recordDialog',
  data () {
    return {
      dialogVisible: false,
      hour: 0,
      min: 0,
      sec: 0
    }
  },
  computed: {
    deviceDto () {
      return this.$store.getters.device
    },
    title () {
      return this.deviceDto ? `录制 ${this.deviceDto.name}` : '录制'
    },
    seconds () {
      return this.hour * 3600 + this.min * 60 + this.sec
    }
  },
  watch: {},
  methods: {
    openDialog () {
      this.dialogVisible = true
    },
    beforeCloseHandler () {
      this.hour = 0
      this.min = 0
      this.sec = 0
    },
    cancel () {
      this.dialogVisible = false
    },
    influxStart () {
      const message = this.seconds > 0 ? `influxd服务连接成功，开始记录...${this.seconds} 秒后自动退出` : 'influxd服务连接成功，开始记录...'
      this.$notification.openSuccessNotification(message).logger()
      this.$store.commit('setRecordCountDown', this.seconds)
      this.$store.commit('setRecordStatus', true)
      this.cancel()
    },
    checkInfluxDbNames () {
      return this.influxClient.getDatabaseNames()
        .then((names) => {
          if (!names.includes(this.deviceDto.name)) {
            this.$notification.openInfoNotification(`influx数据库 ${this.deviceDto.name} 不存在，新建中...`).logger()
            this.influxClient.createDatabase()
              .then(() => {
                this.$notification.openSuccessNotification(`influx数据库 ${this.deviceDto.name} 新建成功。`).logger()
                this.influxClient.createRetentionPolicy().then(() => {
                  this.influxStart()
                })
              })
              .catch(e => {
                this.$notification.openErrorNotification(`influx数据库 ${this.deviceDto.name} 新建失败 ${e}`).logger()
              })
          } else {
            this.$confirm(`已存在名为${this.deviceDto.name}的数据库，是否继续写入？`, {
              confirmButtonText: '确定',
              cancelButtonText: '取消',
              type: 'warning'
            })
              .then(() => {
                this.influxClient.showRetentionPolicies().then(policies => {
                  const policyNames = policies ? policies.map(policy => policy.name) : []
                  if (!policyNames.includes(INFLUX_DEFAULT_RETENTION_POLICY)) {
                    this.$notification.openInfoNotification('influxd不存在时长为180天的数据保留策略，新建中...').logger()
                    this.influxClient.createRetentionPolicy().then(() => {
                      this.influxStart()
                    })
                  } else {
                    this.influxStart()
                  }
                })
              })
              .catch(() => {
                this.cancel()
              })
          }
        })
    },
    confirm () {
      this.$notification.openInfoNotification(`${this.hour}h ${this.min}m ${this.sec}s 共` + this.seconds)
      this.influxClient = this.$store.getters.influxClient
      if (!this.influxClient) {
        this.influxClient = new InfluxClient(this.deviceDto.name)
        this.$store.commit('setInfluxClient', this.influxClient)
      }
      this.checkInfluxDbNames()
        .catch(e => {
          if (/connect ECONNREFUSED/.test(e)) {
            this.$logger.warn(`influxd服务无法访问: ${e}`)
            return this.$confirm('无法访问本地influxd服务，可能是服务未启动，是否尝试开启？', {
              confirmButtonText: '确定',
              cancelButtonText: '取消',
              type: 'warning'
            }).then(() => {
              startInfluxD()
              setTimeout(() => {
                this.checkInfluxDbNames().catch(e => {
                  this.$notification.openErrorNotification(`influxd服务连接失败，请检查日志 ${e}`).logger()
                })
              }, 3000)
            }).catch(() => {
              this.$notification.openWarningNotification('influxd未连接，用户取消操作').logger()
            })
          }
          this.$notification.openErrorNotification(`influxd数据库名称查询失败 ${e}`).logger()
        })
    }
  },
  mounted () {
    this.$vbus.$on('OPEN_DEBUG_RECORD_DIALOG', this.openDialog)
  },
  destroyed () {
    this.$vbus.$off('OPEN_DEBUG_RECORD_DIALOG', this.openDialog)
  }
}
</script>

<style scoped>
.el-input-number {
  width: 100px;
}

</style>
