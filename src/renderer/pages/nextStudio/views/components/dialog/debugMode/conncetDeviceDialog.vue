<template>
  <vxe-modal
    v-model="dialogVisible"
    title="连接装置"
    width="500"
    height="400"
    esc-closable
    show-close
    destroy-on-close
    resize
    remember
    :loading="loading"
    :before-hide-method="beforeCloseHandler"
    transfer
    ref="modal">
    <el-container style="height: 100%">
      <el-main style="height: 100%; padding: 0">
        <el-row>
          <el-col :span="5">
            <div style="height: 50px;line-height: 50px">装置IP地址</div>
          </el-col>
          <el-col :span="19">
            <vxe-form :data="ipV4Form" :rules="formRule" ref="xForm" :title-asterisk="false">
              <vxe-form-item field="data1" span="6" :item-render="{}">
                <template v-slot="params">
                  <vxe-input v-model="params.data.data1" clearable
                             @blur="validateIp4(params)"
                             @input="validateIp4(params)"
                             ref="firstInput"></vxe-input>
                </template>
              </vxe-form-item>
              <vxe-form-item title="." field="data2" span="6" :item-render="{}">
                <template v-slot="params">
                  <vxe-input v-model="params.data.data2" clearable
                             @blur="validateIp4(params)"
                             @input="validateIp4(params)"></vxe-input>
                </template>
              </vxe-form-item>
              <vxe-form-item title="." field="data3" span="6" :item-render="{}">
                <template v-slot="params">
                  <vxe-input v-model="params.data.data3" clearable
                             @blur="validateIp4(params)"
                             @input="validateIp4(params)"></vxe-input>
                </template>
              </vxe-form-item>
              <vxe-form-item title="." field="data4" span="6" :item-render="{}">
                <template v-slot="params">
                  <vxe-input v-model="params.data.data4" clearable
                             @blur="validateIp4(params)"
                             @input="validateIp4(params)"></vxe-input>
                </template>
              </vxe-form-item>
            </vxe-form>
          </el-col>
        </el-row>
        <el-row v-if="optBoardSelectVisible">
          <el-col :span="5">
            <div style="height: 50px;line-height: 50px">当前板卡型号</div>
          </el-col>
          <el-col :span="19">
            <vxe-form :data="debugOptBoardType" :title-asterisk="false">
              <vxe-form-item v-for="optBoard of optBoardList" :key="optBoard.slot"
                             :title="`B${format10(optBoard.slot)}`" span="12">
                <template v-slot="{ data }">
                  <vxe-select v-model="data[`B${format10(optBoard.slot)}`]" transfer clearable>
                    <vxe-option :value="boardType" :label="boardType" v-for="boardType of optBoard.optList"
                                :key="boardType"/>
                  </vxe-select>
                </template>
              </vxe-form-item>
            </vxe-form>
          </el-col>
        </el-row>
        <el-row :style="{height: height, 'margin-top': '10px'}">
          <el-table
            height="100%"
            stripe
            size="mini"
            :data="tableData">
            <el-table-column type="index"></el-table-column>
            <el-table-column prop="name" sortable label="名称"></el-table-column>
            <el-table-column prop="ip4" label="ip地址"></el-table-column>
          </el-table>
        </el-row>
      </el-main>
      <el-footer height="40px">
        <div style="width: 100%; display: flex; justify-content: center;margin-top: 10px">
          <el-button size="small" @click="cancel" :disabled="loading">取消</el-button>
          <el-button size="small" type="primary" @click="confirm" :disabled="loading">确认</el-button>
        </div>
      </el-footer>
    </el-container>
  </vxe-modal>
</template>

<script>
import os from 'os'
import { connectDevice, getObjContext } from '@/renderer/pages/nextStudio/action'

const ip4SectionRule = [
  { required: true, message: '请输入0~255之间的整数' },
  {
    validator ({ itemValue }) {
      // 自定义校验
      if (!/^\d+$/.test(itemValue)) {
        return new Error('非法字符')
      }
      if (/^0\d+$/.test(itemValue)) {
        return new Error('请输入0~255之间的整数')
      }
      if (Number(itemValue) > 255 || Number(itemValue) < 0) {
        return new Error('数值应该在0~255之间')
      }
    }
  }
]

export default {
  name: 'connectDeviceDialog',
  data () {
    return {
      dialogVisible: false,
      ipV4Form: {
        data1: 100,
        data2: 100,
        data3: 100,
        data4: 100
      },
      tableData: [],
      optBoardSelectVisible: false,
      optBoardList: [],
      debugOptBoardType: {},
      formRule: {
        data1: ip4SectionRule,
        data2: ip4SectionRule,
        data3: ip4SectionRule,
        data4: ip4SectionRule
      }
    }
  },
  computed: {
    loading () {
      return this.$store.getters.deviceConnecting
    },
    device () {
      return this.$store.getters.device
    },
    height () {
      return `calc(100% - ${Math.ceil(this.optBoardList.length / 2) * 50 + 60}px)`
    }
  },
  watch: {
    optBoardSelectVisible (val) {
      if (val) {
        this.optBoardList = []
        // 记录每个槽的当前板卡类型
        getObjContext(this.device.hardware)
          .then((rack) => {
            rack.boards.forEach(board => {
              if (board.optList && board.type) {
                const withoutNoneList = board.optList.filter(optType => !/None/i.test(optType))
                if (withoutNoneList.length > 1) {
                  this.optBoardList.push({ slot: board.slot, optList: withoutNoneList })
                  // FIXME 存在多个可选类型，由用户指定
                  this.$set(this.debugOptBoardType, `B${this.format10(board.slot)}`, '')
                } else {
                  // 只有一个可选类型，直接选择
                  this.$set(this.debugOptBoardType, `B${this.format10(board.slot)}`, withoutNoneList[0])
                }
              }
            })
          })
          .catch((e) => {
            this.$notification.openErrorNotification(`获取数据出错 ${e.message}`)
          })
      }
    }
  },
  methods: {
    showOptBoardSelect () {
      this.optBoardSelectVisible = true
    },
    format10 (str) {
      const num = Number(str)
      return num < 10 ? `0${num}` : num
    },
    openDialog () {
      // 获取客户端网卡信息
      this.dialogVisible = true
      setTimeout(() => {
        this.$refs.firstInput.focus()
      }, 100)
      try {
        const data = os.networkInterfaces()
        if (data) {
          Object.keys(data).forEach(name => {
            const info = data[name]
            if (R.isNotEmpty(info)) {
              const ip4Data = R.find(R.propEq('IPv4', 'family'))(info)
              if (ip4Data && !ip4Data.internal) {
                const ip4 = ip4Data.cidr || ip4Data.address
                this.tableData.push({ name, ip4 })
              }
            }
          })
        }
      } catch (e) {
        this.$notification.openWarningNotification('客户端网卡信息获取失败' + e)
      }
    },
    validateIp4 (params) {
      this.$refs.xForm.updateStatus(params)
    },
    beforeCloseHandler () {
      this.ipV4Form = {
        data1: 100,
        data2: 100,
        data3: 100,
        data4: 100
      }
      this.tableData = []
      this.optBoardSelectVisible = false
      this.optBoardList = []
      this.debugOptBoardType = {}
    },
    cancel () {
      this.dialogVisible = false
    },
    async confirm () {
      try {
        await this.$refs.xForm.validate()
      } catch (e) {
        return new Error(e)
      }
      if (this.optBoardSelectVisible) {
        for (const key of Object.keys(this.debugOptBoardType)) {
          if (!this.debugOptBoardType[key]) {
            this.$notification.openErrorNotification(`${key}需要配置当前调试的板卡型号`)
            return
          }
        }
      }
      // 和装置建立连接
      this.$notification.openInfoNotification('装置连接中...')
      const ipV4 = `${this.ipV4Form.data1}.${this.ipV4Form.data2}.${this.ipV4Form.data3}.${this.ipV4Form.data4}`
      // 和装置建立连接
      await connectDevice(ipV4, this.optBoardSelectVisible ? this.debugOptBoardType : null)
    }
  },
  mounted () {
    this.$vbus.$on('OPEN_CONNECT_DEVICE_DIALOG', this.openDialog)
    this.$vbus.$on('CLOSE_CONNECT_DEVICE_DIALOG', this.cancel)
    this.$vbus.$on('SHOW_OPT_BOARD_SELECT', this.showOptBoardSelect)
  },
  destroyed () {
    this.$vbus.$off('OPEN_CONNECT_DEVICE_DIALOG', this.openDialog)
    this.$vbus.$off('CLOSE_CONNECT_DEVICE_DIALOG', this.cancel)
    this.$vbus.$off('SHOW_OPT_BOARD_SELECT', this.showOptBoardSelect)
  }
}
</script>

<style scoped>

</style>
