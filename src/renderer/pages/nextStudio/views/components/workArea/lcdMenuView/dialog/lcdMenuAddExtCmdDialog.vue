<template>
  <el-dialog
    title='外部命令'
    :visible.sync="dialogVisible"
    width="400px"
    append-to-body
    @keyup.enter.native="confirm"
    @submit.native.prevent>
    <div>
      <el-tree
        node-key="key"
        default-expand-all
        show-checkbox
        :expand-on-click-node=false
        :data="cmdOptList"
        :props="treeProps"
        check-on-click-node
        ref="extCmdTree">
        <template v-slot="{ data }">
          <div>
            <div style="display: inline-block;width: 75px">{{ data.label }}</div>
            <el-divider direction="vertical"></el-divider>
            <span>{{ data.desc }}</span>
          </div>
        </template>
      </el-tree>
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
import { getAllExtCmd, instanceModel } from '@/renderer/pages/nextStudio/action'
import { YesNoEnum } from '@/model/enum'
import { LcdMenu } from '@/model/dto'

export default {
  name: 'lcdMenuAddExtCmdDialog',
  data () {
    return {
      dialogVisible: false,
      dragData: '',
      dropLcdMenu: null,
      cmdOptList: [],
      defaultCheckedKeys: [],
      treeProps: { disabled: (data, node) => this.defaultCheckedKeys.includes(data.key) }
    }
  },
  methods: {
    getDefaultCheckedKeys (menuList) {
      if (menuList && R.isNotEmpty(menuList)) {
        menuList.forEach((menu) => {
          if (menu.isFolder === YesNoEnum.NO && /LCDExternCmdPage\d+/.test(menu.functionName)) {
            this.defaultCheckedKeys.push(menu.functionName.replace(/LCDExternCmdPage/, 'cmd'))
          }
        })
      }
    },
    async openDialog (dragData, dropLcdMenu) {
      this.dialogVisible = true
      this.defaultCheckedKeys = []
      this.dragData = dragData
      this.dropLcdMenu = dropLcdMenu
      this.cmdOptList = await getAllExtCmd()
      this.getDefaultCheckedKeys(dropLcdMenu.menuList)
      this.$nextTick(() => {
        this.$refs.extCmdTree.setCheckedKeys(this.defaultCheckedKeys)
      })
    },
    closeDialog () {
      this.dialogVisible = false
    },
    async confirm () {
      const loading = openWindowLoading(`新建${this.dragData.name}菜单中...`)
      try {
        const checkedCmdList = this.$refs.extCmdTree.getCheckedNodes(false, true).map((v) => v.key)
        for (const key of checkedCmdList) {
          if (!this.defaultCheckedKeys.includes(key)) {
            const lcdMenu = new LcdMenu()
            const cmdOpt = R.find(R.propEq(key, 'key'))(this.cmdOptList)
            const appendix = key.replace('cmd', '')
            lcdMenu.name = cmdOpt.desc || cmdOpt.label
            lcdMenu.isFolder = YesNoEnum.NO
            lcdMenu.index = this.dropLcdMenu.menuList.length
            lcdMenu.functionName = this.dragData.function + appendix
            const savedLcd = await instanceModel(lcdMenu, this.dropLcdMenu.id)
            savedLcd.parentNode = this.dropLcdMenu
            this.dropLcdMenu.menuList.push(savedLcd)
          }
        }
        this.dropLcdMenu.children = this.dropLcdMenu.getChildren()
      } catch (e) {
        this.$logger.error(e)
      } finally {
        this.closeDialog()
        loading.close()
      }
    }
  },
  mounted () {
    this.$vbus.$on('OPEN_LCD_NEW_EXT_CMD_DIALOG', this.openDialog)
  },
  destroyed () {
    this.$vbus.$off('OPEN_LCD_NEW_EXT_CMD_DIALOG', this.openDialog)
  }
}
</script>

<style scoped>

</style>
