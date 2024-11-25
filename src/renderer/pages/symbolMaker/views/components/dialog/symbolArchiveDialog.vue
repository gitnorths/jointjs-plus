<template>
  <el-dialog
    width="500px"
    :title="title"
    :visible.sync="visible"
    :close-on-click-modal="false"
    id="newSymbolArchiveDialog"
    v-drag>
    <el-form ref="archiveForm" :label-width="formLabelWidth" :model="archive" :rules="rules"
             @keyup.enter.native="confirm">
      <el-form-item label="原名称" prop="name" v-if="isUpdate">
        <el-input v-model="archive.orgName" readonly></el-input>
      </el-form-item>
      <el-form-item label="名称" prop="name">
        <el-input v-model="archive.name" placeholder="请输入符号仓的名称" clearable></el-input>
      </el-form-item>
      <el-form-item label="组织" prop="organization">
        <el-autocomplete v-model="archive.organization" :fetch-suggestions="querySearch" placeholder="请输入内容"
                         clearable></el-autocomplete>
      </el-form-item>
      <el-form-item label="描述" prop="desc">
        <el-input v-model="archive.desc" placeholder="请输入符号仓的描述" clearable></el-input>
      </el-form-item>
      <el-form-item label="llsym路径" prop="llsymPath" v-if="isImport">
        <el-input v-model="archive.llsymPath" readonly></el-input>
      </el-form-item>
      <el-form-item label="保存目录" prop="directory" v-if="!isUpdate">
        <el-input v-model="archive.directory" placeholder="点击右侧图标选择本地目录" clearable>
          <template v-slot:append>
            <i class="el-input__icon el-icon-folder-opened folderIcon" @click="setDirectory"/>
          </template>
        </el-input>
      </el-form-item>
    </el-form>
    <template v-slot:footer>
      <div class="dialog-footer">
        <el-button @click="reset">取 消</el-button>
        <el-button type="primary" @click="confirm">确 定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script>
import {
  createNewArchive,
  importLLSYM,
  setSaveDirectory,
  updateSymbolArchive
} from '@/renderer/pages/symbolMaker/action'
import * as R from 'ramda'

export default {
  name: 'SymbolArchiveDialog',
  data () {
    return {
      formLabelWidth: '80px',
      archive: {
        orgName: '',
        name: '',
        organization: '',
        desc: '',
        llsymPath: '',
        directory: ''
      },
      organizations: [
        { value: '中研院' },
        { value: '思源弘瑞' },
        { value: '思源清能' }
      ],
      rules: {
        directory: [
          { required: true, message: '请选择本地存储目录', trigger: 'change' }
        ],
        name: [
          { validator: this.nameValidator(), trigger: 'blur' }
        ]
      }
    }
  },
  computed: {
    visible: {
      get: function () {
        return this.$store.getters.archiveDialogVisible
      },
      set: function (newValue) {
        this.$store.commit('setArchiveDialogVisible', newValue)
        if (!newValue) this.$refs.archiveForm.resetFields()
      }
    },
    llsymPath () {
      return this.$store.getters.llsymPath
    },
    currentDto () {
      return this.$store.getters.currentTreeNodeData
    },
    isUpdate () {
      return this.$store.getters.isUpdate
    },
    isImport () {
      return R.isNotNil(this.llsymPath) && R.isNotEmpty(this.llsymPath)
    },
    isCreate () {
      return !this.isImport && !this.isUpdate
    },
    title () {
      return this.isUpdate
        ? '修改符号仓'
        : this.isImport
          ? '导入符号仓'
          : '新建符号仓'
    }
  },
  methods: {
    nameValidator () {
      return (rule, value, callback) => {
        if (!value) {
          callback(new Error('请填写符号仓名称'))
        } else {
          callback()
        }
      }
    },
    querySearch (queryString, cb) {
      const organizations = this.organizations
      const results = queryString ? organizations.filter(this.createFilter(queryString)) : organizations
      // 调用 callback 返回建议列表的数据
      cb(results)
    },
    createFilter (queryString) {
      return (restaurant) => {
        return (restaurant.value.toLowerCase().indexOf(queryString.toLowerCase()) === 0)
      }
    },
    // 打开对话框选择本地工作副本目录
    async setDirectory () {
      const directory = await setSaveDirectory()
      if (R.isNotNil(directory)) {
        this.archive.directory = directory
      }
    },
    reset () {
      this.$refs.archiveForm.resetFields()
      this.$store.commit('setUpdate', false)
      this.$store.commit('setllsymPath', '')
      this.$store.commit('setArchiveDialogVisible', false)
    },
    // 校验表单
    confirm () {
      this.$refs.archiveForm.validate(async (valid) => {
        // 校验表单
        if (!valid) {
          this.$message.warning('有未填项或不合规内容，请核查')
          return false
        }
        try {
          if (this.isImport) {
            await importLLSYM(this.archive)
          } else if (this.isCreate) {
            await createNewArchive(this.archive)
          } else if (this.isUpdate) {
            await updateSymbolArchive(this.archive)
          }
          this.reset()
        } catch (err) {
          this.$notification.openErrorNotification(`${this.title} ${this.archive.name} 失败，${err}`).logger()
        }
      })
    }
  },
  mounted () {
    this.archive.llsymPath = this.$store.getters.llsymPath
    if (this.isUpdate && this.currentDto) {
      this.archive.name = this.currentDto.name
      this.archive.orgName = this.currentDto.name
      this.archive.organization = this.currentDto.organization
      this.archive.desc = this.currentDto.desc
    }
  }
}
</script>
<style lang="scss" scoped>
#newSymbolArchiveDialog {
  .el-autocomplete {
    width: 100%;
  }

  .folderIcon {
    cursor: pointer;
    font-size: 18px
  }

}
</style>
