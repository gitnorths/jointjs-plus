<template>
  <el-dialog
    width="500px"
    :title="title"
    :visible.sync="visible"
    :close-on-click-modal="false"
    v-drag>
    <el-form ref="symbolLibForm" :label-width="formLabelWidth" :model="symbolLib" :rules="rules"
             @keyup.enter.native="checkForm">
      <el-form-item label="原始名称" prop="orgName" v-if="isUpdate">
        <el-input v-model="symbolLib.orgName" readonly></el-input>
      </el-form-item>
      <el-form-item label="名称" prop="name">
        <el-input v-model="symbolLib.name" placeholder="请输入符号库的名称"></el-input>
      </el-form-item>
      <el-form-item label="描述" prop="desc">
        <el-input v-model="symbolLib.desc" placeholder="请输入符号库的描述"></el-input>
      </el-form-item>
    </el-form>
    <template v-slot:footer>
      <div class="dialog-footer">
        <el-button @click="resetForm">取 消</el-button>
        <el-button type="primary" @click="checkForm">确 定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script>
import * as R from 'ramda'
import { createNewSymbolLIb, updateSymbolLib } from '@/renderer/pages/symbolMaker/action'

export default {
  name: 'SymbolLibDialog',
  data () {
    return {
      formLabelWidth: '80px',
      symbolLib: {
        orgName: '',
        name: '',
        desc: '',
        index: 0
      },
      rules: {
        name: [
          { validator: this.validateName(), trigger: 'blur' }
        ]
      }
    }
  },
  computed: {
    visible: {
      // getter
      get: function () {
        return this.$store.getters.symbolLibDialogVisible
      },
      // setter
      set: function (newValue) {
        this.$store.commit('setSymbolLibDialogVisible', newValue)
        if (!newValue) this.$refs.symbolLibForm.resetFields()
      }
    },
    currentDto () {
      return this.$store.getters.currentTreeNodeData
    },
    isUpdate () {
      return this.$store.getters.isUpdate
    },
    isCreate () {
      return !this.isUpdate
    },
    title () {
      return this.isUpdate ? '修改符号库' : '新建符号库'
    }
  },
  methods: {
    validateName () {
      return (rule, value, callback) => {
        if (!value) {
          callback(new Error('请输入名称'))
        } else if (value.length > 49) {
          callback(new Error('长度在49个字符以内'))
        } else {
          const arr = this.isUpdate
            ? this.currentDto.children.filter((lib) => lib.name !== this.symbolLib.orgName)
            : this.currentDto.children

          const nameConflict = R.find((lib) => new RegExp(value, 'i').test(lib.name))(arr)
          if (R.isNotNil(nameConflict)) {
            callback(new Error(`当前符号仓存在名为 ${nameConflict.name} 的符号库`))
          } else {
            callback()
          }
        }
      }
    },
    // 对话框重置
    resetForm () {
      this.$store.commit('setUpdate', false)
      this.$refs.symbolLibForm.resetFields()
      this.visible = false
    },
    // 校验表单
    checkForm () {
      this.$refs.symbolLibForm.validate(async (valid) => {
        // 校验表单
        if (!valid) {
          this.$message.warning('有未填项或不合规内容，请核查')
          return false
        }

        try {
          if (this.isCreate) {
            this.symbolLib.index = this.currentDto.children.length
            const result = await createNewSymbolLIb(this.symbolLib, this.currentDto)
            result.parent = this.currentDto
            this.currentDto.children.push(result)
          } else {
            await updateSymbolLib(this.symbolLib, this.currentDto.parent)
            // 更新成功，同步状态
            this.currentDto.name = this.symbolLib.name
            this.currentDto.desc = this.symbolLib.desc
          }
          this.resetForm()
        } catch (err) {
          this.$notification.openErrorNotification(`${this.title} ${this.symbolLib.name} 失败，${err}`).logger()
        }
      })
    }
  },
  mounted () {
    if (this.isUpdate && this.currentDto) {
      this.symbolLib.orgName = this.currentDto.name
      this.symbolLib.name = this.currentDto.name
      this.symbolLib.desc = this.currentDto.desc
    }
  }
}
</script>
