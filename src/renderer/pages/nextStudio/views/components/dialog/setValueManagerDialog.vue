<template>
  <el-dialog
    title="管理定值区"
    :visible.sync="dialogVisible"
    width="400px"
    append-to-body
    :close-on-click-modal=false
    @keyup.enter.native="confirm"
    @submit.native.prevent>
    <el-form :model="dataForm" label-position="left" label-width="140px" size="small">
      <el-form-item label="当前定值区" prop="activeGroupNum">
        <el-input-number size="small" v-model="dataForm.activeGroupNum" controls-position="right"
                         placeholder="请输入当前定值区号"
                         :min="1" :max="dataForm.groupNum" style="width: 100%"/>
      </el-form-item>
      <el-form-item label="定值区个数 [1, 30]" prop="groupNum">
        <el-input-number size="small" v-model="dataForm.groupNum" controls-position="right"
                         placeholder="请输入定值区个数" :min="1" :max="30" style="width: 100%"/>
      </el-form-item>
    </el-form>
    <template v-slot:footer>
      <div>
        <el-button size="small" @click="dialogVisible = false">取消</el-button>
        <el-button size="small" type="primary" @click="confirm">确定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script>
export default {
  name: 'setValueManagerDialog',
  data () {
    return {
      dialogVisible: false,
      setValueData: null,
      callback: () => {
        // TODO
      },
      dataForm: {
        activeGroupNum: 0,
        groupNum: 1
      }
    }
  },
  methods: {
    openDialog (setValueData, callback) {
      this.setValueData = setValueData
      this.callback = callback
      Object.assign(this.dataForm, this.setValueData)
      this.dialogVisible = true
    },
    confirm () {
      this.setValueData.groupNum = this.dataForm.groupNum
      this.setValueData.activeGroupNum = this.dataForm.activeGroupNum
      this.callback(this.setValueData)
      this.dialogVisible = false
    }
  },
  mounted () {
    this.$vbus.$on('OPEN_SET_VALUE_MANAGER_DIALOG', this.openDialog)
  },
  destroyed () {
    this.$vbus.$off('OPEN_SET_VALUE_MANAGER_DIALOG', this.openDialog)
  }
}
</script>

<style lang="scss">
</style>
