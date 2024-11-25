<template>
  <el-dialog
    title="新增目录"
    :visible.sync="dialogVisible"
    width="400px"
    append-to-body
    @keyup.enter.native="confirm"
    @submit.native.prevent>
    <div>
      <el-form :model="form" label-width="100px" size="mini">
        <el-form-item label="目录名:">
          <el-input v-model="form.name" placeholder="请输入目录名称"></el-input>
        </el-form-item>
      </el-form>
    </div>
    <template v-slot:footer>
      <div>
        <el-button size="small" @click="closeDialog">取消</el-button>
        <el-button size="small" type="primary" @click="confirm">确定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script>
import { instanceModel } from '@/renderer/pages/nextStudio/action'
import { LcdMenu } from '@/model/dto'
import { YesNoEnum } from '@/model/enum'

export default {
  name: 'lcdMenuAddFolderDialog',
  data () {
    return {
      currentLcdMenu: null,
      dialogVisible: false,
      form: {
        name: ''
      }
    }
  },
  methods: {
    openDialog (dropLcdMenu) {
      this.dialogVisible = true
      this.currentLcdMenu = dropLcdMenu
    },
    closeDialog () {
      this.dialogVisible = false
      this.currentLcdMenu = null
      this.form = {
        name: ''
      }
    },
    async addMenu () {
      const menuObj = new LcdMenu()
      menuObj.name = this.form.name
      menuObj.functionName = ''
      menuObj.isFolder = YesNoEnum.YES
      menuObj.index = this.currentLcdMenu.menuList.length || 0
      const newMenu = await instanceModel(menuObj, this.currentLcdMenu.id)

      newMenu.parentNode = this.currentLcdMenu
      this.currentLcdMenu.menuList.push(newMenu)
      this.currentLcdMenu.children.push(newMenu)
    },
    async confirm () {
      if (!this.form.name) {
        this.$message.warning('目录名不能为空！')
        return
      }
      try {
        await this.addMenu()
      } catch (e) {
        this.$logger.error(e)
      } finally {
        this.closeDialog()
      }
    }
  },
  mounted () {
    this.$vbus.$on('OPEN_LCD_NEW_FOLDER_DIALOG', this.openDialog)
  },
  destroyed () {
    this.$vbus.$off('OPEN_LCD_NEW_FOLDER_DIALOG', this.openDialog)
  }
}
</script>

<style scoped>
</style>
