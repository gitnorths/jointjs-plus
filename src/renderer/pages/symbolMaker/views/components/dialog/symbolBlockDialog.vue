<template>
  <el-dialog
    width="500px"
    :title="title"
    :visible.sync="visible"
    :close-on-click-modal="false"
    v-drag>
    <el-form ref="symbolBlockForm" :label-width="formLabelWidth" :model="symbolBlock" :rules="rules"
             @keyup.enter.native="checkForm">
      <el-form-item label="原始名称" prop="orgName" v-if="isUpdate">
        <el-input v-model="symbolBlock.orgName" readonly></el-input>
      </el-form-item>
      <el-form-item label="名称" prop="name">
        <el-input v-model="symbolBlock.name" placeholder="请输入符号名"></el-input>
      </el-form-item>
      <el-form-item label="描述" prop="desc">
        <el-input v-model="symbolBlock.desc" placeholder="请输入符号的描述"></el-input>
      </el-form-item>
    </el-form>
    <div slot="footer" class="dialog-footer">
      <el-button @click="resetForm">取 消</el-button>
      <el-button type="primary" @click="checkForm">确 定</el-button>
    </div>
  </el-dialog>
</template>

<script>
import * as R from 'ramda'
import { createNewBlock, updateSymbolBlock } from '@/renderer/pages/symbolMaker/action'

export default {
  name: 'SymbolBlockDialog',
  data () {
    return {
      formLabelWidth: '80px',
      symbolBlock: {
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
      get: function () {
        return this.$store.getters.symbolBlockDialogVisible
      },
      set: function (newValue) {
        this.$store.commit('setSymbolBlockDialogVisible', newValue)
        if (!newValue) this.$refs.symbolBlockForm.resetFields()
      }
    },
    currentDto () {
      return this.$store.getters.currentTreeNodeData
    },
    isUpdate () {
      return this.$store.getters.isUpdate
    },
    title () {
      return this.isUpdate ? '更新符号块' : '新建符号块'
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
            ? this.currentDto.children.filter((block) => block.name !== this.symbolBlock.orgName)
            : this.currentDto.children

          const nameConflict = R.find((block) => new RegExp(value, 'i').test(block.name))(arr)
          if (R.isNotNil(nameConflict)) {
            callback(new Error(`当前符号库存在名为 ${nameConflict.name} 的符号块`))
          } else {
            callback()
          }
        }
      }
    },
    resetForm () {
      this.$store.commit('setUpdate', false)
      this.$refs.symbolBlockForm.resetFields()
      this.visible = false
    },
    // 校验表单
    checkForm () {
      this.$refs.symbolBlockForm.validate(async (valid) => {
        // 校验表单
        if (!valid) {
          this.$message.warning('有未填项或不合规内容，请核查')
          return false
        }

        try {
          if (this.isCreate) {
            this.symbolBlock.index = this.currentDto.children.length
            const result = createNewBlock(this.symbolBlock, this.currentDto)
            this.currentDto.children.push(result)
            // 新建符号块直接打开
            this.$store.commit('addNodeToWorkTagsContainer', result)
          } else {
            await updateSymbolBlock(this.symbolBlock, this.currentDto)
            // 更新成功，同步状态
            this.currentDto.name = this.symbolBlock.name
            this.currentDto.desc = this.symbolBlock.desc
          }
          this.resetForm()
        } catch (err) {
          this.$notification.openErrorNotification(`新建符号块 ${this.symbolBlock.name} 失败，${err}`).logger()
        }
      })
    }
  },
  mounted () {
    if (this.isUpdate && this.currentDto) {
      this.symbolBlock.orgName = this.currentDto.name
      this.symbolBlock.name = this.currentDto.name
      this.symbolBlock.desc = this.currentDto.desc
    }
  }
}
</script>
