<template>
  <el-dialog
    :title="`${create ? '新建' : '修改'}页面`"
    :visible.sync="dialogVisible"
    width="400px"
    :close-on-click-modal=false
    class="pageAttrDialog"
    append-to-body
    @keyup.enter.native="confirm"
    @submit.native.prevent>
    <el-form :model="dataForm" label-position="left" label-width="100px" size="small">
      <el-form-item label="页面名称">
        <el-input v-model="dataForm.name" placeholder="请输入页面名称"/>
      </el-form-item>
      <el-form-item label="页面大小">
        <el-select v-model="dataForm.pageInfo" placeholder="请选择页面大小" style="width: 100%">
          <el-option label="A3" value="A3"/>
          <el-option label="A4" value="A4"/>
        </el-select>
      </el-form-item>
      <el-form-item label="任务等级">
        <el-select v-model="dataForm.level" placeholder="请选择任务等级" style="width: 100%">
          <el-option label="Level1" :value=1></el-option>
          <el-option label="Level2" :value=2></el-option>
          <el-option label="Level3" :value=3></el-option>
          <el-option label="Level4" :value=4></el-option>
          <el-option label="LevelAny" :value=5></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="投退状态">
        <el-switch v-model="dataForm.status"
                   active-text="投入"
                   :active-value="enableStatus.ON"
                   inactive-text="退出"
                   :inactive-value="enableStatus.OFF"/>
      </el-form-item>
      <el-form-item label="可见性" v-if="userType !== 'engineer'">
        <el-switch v-model="dataForm.visible"
                   active-text="工程可见"
                   :active-value="1"
                   inactive-text="仅研发"
                   :inactive-value="0"/>
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
import * as R from 'ramda'
import { EnableStatusEnum } from '@/model/enum'

export default {
  name: 'pageAttrDialog',
  data () {
    return {
      create: false,
      page: null,
      callback: () => {
        // TODO
      },
      dataForm: {
        name: '', // 页面名称
        pageInfo: 'A4', // 页面大小
        level: 'any', // fixme
        status: EnableStatusEnum.ON, // 投退状态
        visible: 1 // 工程可见
      },
      dialogVisible: false
    }
  },
  computed: {
    enableStatus () {
      return EnableStatusEnum
    },
    userType () {
      return this.$store.getters.userType
    }
  },
  methods: {
    resetDataForm () {
      this.dataForm = {
        name: '', // 页面名称
        pageInfo: 'A4', // 页面大小
        level: 'any', // fixme
        status: EnableStatusEnum.ON, // 投退状态
        visible: 1 // 工程可见
      }
    },
    openDialog (page, create = false, callback) {
      this.create = create
      this.callback = callback
      this.page = page
      if (R.isNil(this.page)) {
        return
      }
      this.resetDataForm()
      Object.assign(this.dataForm, this.page)
      this.dialogVisible = true
    },
    closeDialog () {
      this.dialogVisible = false
    },
    confirm () {
      this.callback(this.dataForm)
    }
  },
  mounted () {
    this.$vbus.$on('OPEN_PAGE_ATTR_DIALOG', this.openDialog)
    this.$vbus.$on('CLOSE_PAGE_ATTR_DIALOG', this.closeDialog)
  },
  destroyed () {
    this.$vbus.$off('OPEN_PAGE_ATTR_DIALOG', this.openDialog)
    this.$vbus.$off('CLOSE_PAGE_ATTR_DIALOG', this.closeDialog)
  }
}
</script>

<style lang="scss">
</style>
