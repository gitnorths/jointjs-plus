<template>
  <el-dialog
    :title="create ? '新建定值组' : `修改${dataForm.desc}`"
    :visible.sync="dialogVisible"
    width="400px"
    append-to-body
    :close-on-click-modal=false
    @keyup.enter.native="confirm"
    @submit.native.prevent>
    <el-form :model="dataForm" label-position="left" label-width="100px" size="small">
      <el-form-item label="组名">
        <el-input v-model="dataForm.name" :disabled="naReadonly" placeholder="请输入组名"/>
      </el-form-item>
      <el-form-item label="描述">
        <el-input v-model="dataForm.desc" placeholder="请输入组中文描述"/>
      </el-form-item>
      <el-form-item label-width="0">
        <el-checkbox v-model="dataForm.multiSet" :true-label="trueLabel" :false-label="falseLabel">多区设置
        </el-checkbox>
        <el-checkbox v-model="dataForm.reset" :true-label="trueLabel" :false-label="falseLabel">整定后重启</el-checkbox>
        <el-checkbox v-model="dataForm.remoteEnable" :true-label="trueLabel" :false-label="falseLabel">允许远方修改
        </el-checkbox>
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
  name: 'settingGroupDialog',
  data () {
    return {
      trueLabel: 1,
      falseLabel: 0,
      settingGroup: null,
      callback: () => {
        // TODO
      },
      create: false,
      naReadonly: true,
      dataForm: {
        na: '', // 组名
        cn: '', // 组中文描述
        en: '', // 组英文描述
        multiSet: 0, // 多区设置
        reset: 0, // 整定后重启
        remoteEnable: 0 // 允许远方修改
      },
      dialogVisible: false
    }
  },
  methods: {
    resetDataForm () {
      this.dataForm.name = ''
      this.dataForm.desc = ''
      this.dataForm.multiSet = 0
      this.dataForm.reset = 0
      this.dataForm.remoteEnable = 0
    },
    openDialog (settingGroup, naReadonly = true, create = false, callback) {
      if (R.isNil(settingGroup)) {
        return
      }
      this.create = create
      this.naReadonly = naReadonly
      this.callback = callback
      this.settingGroup = settingGroup
      this.resetDataForm()
      Object.assign(this.dataForm, this.settingGroup)
      this.dialogVisible = true
    },
    confirm () {
      this.settingGroup.name = this.dataForm.name
      this.settingGroup.desc = this.dataForm.desc
      this.settingGroup.multiSet = this.dataForm.multiSet
      this.settingGroup.reset = this.dataForm.reset
      this.settingGroup.remoteEnable = this.dataForm.remoteEnable
      this.callback(this.settingGroup)
      this.dialogVisible = false
    }
  },
  mounted () {
    this.$vbus.$on('OPEN_SETTING_GROUP_DIALOG', this.openDialog)
  },
  destroyed () {
    this.$vbus.$off('OPEN_SETTING_GROUP_DIALOG', this.openDialog)
  }
}
</script>

<style lang="scss">
</style>
