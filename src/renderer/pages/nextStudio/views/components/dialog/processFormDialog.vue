<template>
  <el-dialog :title="`${isCreate ? '新建' : '修改'}进程`"
             :visible.sync="visible"
             width="400px"
             append-to-body
             :close-on-click-modal=false
             @keyup.enter.native="saveProcess"
             @submit.native.prevent>
    <el-form ref="form" :model="process" size="small">
      <el-form-item label="进程" :label-width="formLabelWidth">
        <el-input v-model="process.exec" autocomplete="off"></el-input>
      </el-form-item>
      <el-form-item label="实例" :label-width="formLabelWidth">
        <el-input v-model="process.inst"></el-input>
      </el-form-item>
      <el-form-item label="参数" :label-width="formLabelWidth">
        <el-input v-model="process.args"></el-input>
      </el-form-item>
      <el-form-item label="使能" :label-width="formLabelWidth">
        <el-switch v-model="process.enable" :active-value=1 :inactive-value=0></el-switch>
      </el-form-item>
    </el-form>
    <template v-slot:footer>
      <div>
        <el-button size="small" @click="resetForm">取消</el-button>
        <el-button size="small" type="primary" @click="saveProcess">确定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script>
import { v4 as uuid } from 'uuid'
import { instanceModel, updateModel } from '@/renderer/pages/nextStudio/action'

export default {
  name: 'ProcessFormDialog',
  data () {
    return {
      isCreate: false,
      visible: false,
      formLabelWidth: '50px',
      processObj: {
        exec: '',
        inst: '',
        args: '',
        enable: 1,
        clazzName: 'ProcessItem',
        id: '',
        index: 0,
        pageList: []
      },
      process: {},
      coreNode: null
    }
  },
  computed: {
    len () {
      return this.coreNode && this.coreNode.processes ? this.coreNode.processes.length : 0
    }
  },
  mounted () {
    this.$vbus.$on('OPEN_PROCESS_ATTR_DIALOG', this.openDialog)
  },
  destroyed () {
    this.$vbus.$off('OPEN_PROCESS_ATTR_DIALOG', this.openDialog)
  },
  methods: {
    // 对话框重置
    resetForm () {
      this.$refs.form.resetFields()
      this.visible = false
    },
    openDialog (node, isCreate = false) {
      this.isCreate = isCreate
      this.visible = true
      if (isCreate) {
        this.coreNode = node
        this.process = { ...this.processObj }
        this.process.id = uuid()
      } else {
        this.coreNode = node.parentNode
        this.process = { ...node }
      }
    },
    saveProcess () {
      if (this.isCreate) {
        this.createProcess()
          .then(() => {
            this.visible = false
          })
          .catch((e) => {
            this.$notification.openErrorNotification(`进程新建失败${e}`).logger()
          })
      } else {
        this.updateProcess()
          .then(() => {
            this.visible = false
          })
          .catch((e) => {
            this.$notification.openErrorNotification(`进程修改失败${e}`).logger()
          })
      }
    },
    createProcess () {
      // 新建进程
      this.process.index = this.len

      return instanceModel(this.process, this.coreNode.id)
        .then((newProcessValue) => {
          if (this.len) {
            const oldLastProcessNode = this.coreNode.processes[this.len - 1]
            oldLastProcessNode.nextItem = newProcessValue
            oldLastProcessNode.nextItemId = newProcessValue.id
            newProcessValue.previousItem = oldLastProcessNode
          }
          newProcessValue.parentNode = this.coreNode
          this.coreNode.processes.push(newProcessValue)
          this.coreNode.children.push(newProcessValue)
          this.$notification.openSuccessNotification(`新建进程"${newProcessValue.inst}"`).logger()
        })
    },
    updateProcess () {
      // 修改进程
      return updateModel(this.process)
        .then(() => {
          const item = R.find(R.propEq(this.process.id, 'id'))(this.coreNode.processes)
          item.exec = this.process.exec
          item.inst = this.process.inst
          item.args = this.process.args
          item.enable = this.process.enable
          item.title = item.inst
        })
    }
  }
}
</script>

<style scoped>
::v-deep .el-dialog__body {
  padding: 20px 40px 0
}
</style>
