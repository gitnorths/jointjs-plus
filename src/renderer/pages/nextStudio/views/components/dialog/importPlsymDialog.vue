<template>
  <el-dialog
    width="600px"
    class="importPlsymDialog"
    title="导入装置"
    :visible.sync="dialogVisible"
    append-to-body
    show-close
    :close-on-click-modal=false
    :close-on-press-escape=false
    @keyup.enter.native="confirm"
    @submit.native.prevent>
    <div class="formContainer">
      <el-form :model="dataForm" ref="form" label-position="right" :label-width="formLabelWidth" :rules="rules"
               @keyup.enter.native="confirm">
        <el-form-item label="装置名称" prop="name">
          <el-input v-model="dataForm.name" placeholder="请输入装置的名称" clearable></el-input>
        </el-form-item>
        <el-form-item label="文件路径：" prop="plsymFilePath">
          <el-input v-model="dataForm.plsymFilePath" readonly></el-input>
        </el-form-item>
        <el-form-item label="保存路径：" prop="projectSaveDir">
          <el-input v-model="dataForm.projectSaveDir" placeholder="点击右侧图标选择本地目录" clearable>
            <template v-slot:append>
              <i class="el-input__icon el-icon-folder-opened folderIcon" @click="selectProjectSaveDir"/>
            </template>
          </el-input>
        </el-form-item>
      </el-form>
    </div>
    <template v-slot:footer>
      <div>
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" @click="confirm">导入</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script>
import { openWindowDialog } from '@/renderer/common/action'
import { importPlsym } from '@/renderer/pages/nextStudio/action'
import { getFirstPath } from '@/renderer/common/util'
import path from 'path'

export default {
  name: 'importPlsymDialog',
  data () {
    return {
      formLabelWidth: '120px',
      dialogVisible: false,
      rules: {
        name: {
          required: true,
          target: 'change',
          message: '装置文件地址不能为空'
        },
        plsymFilePath: {
          required: true,
          target: 'change',
          message: '工程文件地址不能为空'
        },
        projectSaveDir: {
          required: true,
          target: 'change',
          message: '保存地址不能为空'
        }
      },
      dataForm: {
        name: '',
        plsymFilePath: '',
        projectSaveDir: ''
      }
    }
  },
  methods: {
    openDialog (plsymFilePath) {
      this.dataForm.plsymFilePath = plsymFilePath
      this.dataForm.name = path.basename(plsymFilePath, '.plsym')
      this.dataForm.projectSaveDir = ''
      this.dialogVisible = true
    },
    closeDialog () {
      this.$refs.form.resetFields()
      this.dialogVisible = false
    },
    confirm () {
      this.$refs.form.validate(async (valid) => {
        if (valid) {
          try {
            await importPlsym(this.dataForm)
          } catch (e) {
            this.$notification.openErrorNotification(e).logger()
          }
        }
      })
    },
    async selectProjectSaveDir () {
      const openDialogReturnValue = await openWindowDialog({
        title: '请选择工程保存位置',
        properties: ['openDirectory']
      })
      const filePath = getFirstPath(openDialogReturnValue.filePaths)
      if (/[\u4E00-\u9FA5]/.test(filePath)) {
        this.$notification.openWarningNotification('不支持包含中文的路径')
        return
      }
      if (filePath) {
        this.dataForm.projectSaveDir = filePath
      }
    }
  },
  mounted () {
    this.$vbus.$on('OPEN_IMPORT_DEVICE_DIALOG', this.openDialog)
    this.$vbus.$on('CLOSE_IMPORT_DEVICE_DIALOG', this.closeDialog)
  },
  destroyed () {
    this.$vbus.$off('OPEN_IMPORT_DEVICE_DIALOG', this.openDialog)
    this.$vbus.$off('CLOSE_IMPORT_DEVICE_DIALOG', this.closeDialog)
  }
}
</script>

<style lang="scss">
</style>
