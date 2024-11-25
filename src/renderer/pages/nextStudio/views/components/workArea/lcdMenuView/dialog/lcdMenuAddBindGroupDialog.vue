<template>
  <el-dialog
    :title='`绑定${dragData.name}`'
    :visible.sync="dialogVisible"
    width="400px"
    append-to-body
    @keyup.enter.native="confirm"
    @submit.native.prevent>
    <div>
      <el-input prefix-icon="el-icon-search" size="small" placeholder="输入关键字进行过滤" v-model="filterText"/>
      <el-tree
        node-key="id"
        default-expand-all
        show-checkbox
        :expand-on-click-node=false
        :data="bindData"
        :props="treeProps"
        :filter-node-method="filterNode"
        check-on-click-node
        ref="bindGroupTreeView">
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
import { LcdBindGroupFunctionName, LcdMenuNameConst } from '../lcdMenuConst'
import { openWindowLoading } from '@/renderer/common/action'
import { getAllInterlockGroupId, instanceModel } from '@/renderer/pages/nextStudio/action'
import { YesNoEnum } from '@/model/enum'
import { LcdMenu } from '@/model/dto'

export default {
  name: 'lcdMenuAddBindGroupDialog',
  data () {
    return {
      dialogVisible: false,
      dragData: '',
      dropLcdMenu: null,
      bindGroup: null,
      disabledKeys: [],
      defaultCheckedKeys: [],
      bindData: [], // 绑定分组tree数组,
      filterText: '', // 快捷搜索框
      treeProps: { label: 'cn', disabled: (data, node) => this.disabledKeys.includes(data.id) }
    }
  },
  watch: {
    filterText (val) {
      this.$refs.bindGroupTreeView.filter(val)
    }
  },
  methods: {
    filterNode (value, data) {
      return !value ? true : data.desc.indexOf(value) !== -1
    },
    calcBindGroupCfg (dragType, deviceConfig) {
      switch (dragType) {
        case LcdMenuNameConst.BinaryGroup:
          return deviceConfig.binaryGroup
        case LcdMenuNameConst.AnalogGroup:
          return deviceConfig.analogGroup
        case LcdMenuNameConst.SettingGroup:
          return deviceConfig.settingGroup
        case LcdMenuNameConst.InterlockStatus:
          return deviceConfig.settingGroup
        case LcdMenuNameConst.InterlockSettingGroup:
          return deviceConfig.settingGroup
        case LcdMenuNameConst.ControlGroup:
          return deviceConfig.ctrl
        case LcdMenuNameConst.RecordSet:
          return deviceConfig.recordSet
        case LcdMenuNameConst.RefTableGroup:
          return deviceConfig.refTab
      }
    },
    getInterlockGroup (groupList, allInterlockGroup) {
      groupList.forEach(group => {
        if (R.isNotEmpty(group.groupList)) {
          this.getInterlockGroup(group.groupList, allInterlockGroup)
        } else if (group.isManageGroup !== YesNoEnum.YES && allInterlockGroup.includes(group.id)) {
          this.bindData.push(group)
        }
      })
    },
    getSettingGroup (groupList) {
      this.bindData = groupList.filter(group => !/Internal_Settings/i.test(group.name))
    },
    calcBindData (allInterlockGroup) {
      switch (this.dragData.name) {
        case LcdMenuNameConst.RecordSet:
          this.bindData = [this.bindGroup.frequency, this.bindGroup.faultInfo, this.bindGroup.trigger]
          return
        case LcdMenuNameConst.InterlockSettingGroup:
          this.getInterlockGroup(this.bindGroup.groupList, allInterlockGroup)
          return
        case LcdMenuNameConst.InterlockStatus:
          this.getInterlockGroup(this.bindGroup.groupList, allInterlockGroup)
          return
        case LcdMenuNameConst.SettingGroup:
          this.getSettingGroup(this.bindGroup.groupList)
          return
        default :
          this.bindData = this.bindGroup.groupList
      }
    },
    getDefaultCheckedKeys (menuList) {
      if (menuList && R.isNotEmpty(menuList)) {
        menuList.forEach((menu) => {
          if (menu.isFolder === YesNoEnum.NO) {
            let groupId = menu.bindId
            if (this.dragData.name === LcdMenuNameConst.SettingGroup || this.dragData.name === LcdMenuNameConst.InterlockSettingGroup || this.dragData.name === LcdMenuNameConst.InterlockStatus) {
              groupId = groupId.replace('SettingGroup', '')
            } else if (this.dragData.name === LcdMenuNameConst.BinaryGroup) {
              groupId = groupId.replace('BinaryGroup', '')
            } else if (this.dragData.name === LcdMenuNameConst.AnalogGroup) {
              groupId = groupId.replace('AnalogGroup', '')
            } else if (this.dragData.name === LcdMenuNameConst.RefTableGroup) {
              groupId = groupId.replace('RefTableGroup', '')
            }

            if (this.dragData.name === LcdMenuNameConst.SettingGroup) {
              if (menu.functionName === LcdBindGroupFunctionName.SettingGroup) {
                this.defaultCheckedKeys.push(groupId)
              }
            } else if (this.dragData.name === LcdMenuNameConst.InterlockSettingGroup) {
              if (menu.functionName === LcdBindGroupFunctionName.InterlockSettingGroup) {
                this.defaultCheckedKeys.push(groupId)
              }
            } else if (this.dragData.name === LcdMenuNameConst.InterlockStatus) {
              if (menu.functionName === LcdBindGroupFunctionName.InterlockStatus) {
                this.defaultCheckedKeys.push(groupId)
              }
            } else {
              this.defaultCheckedKeys.push(groupId)
            }
          } else if (menu.bindId) {
            this.getDefaultCheckedKeys(menu.menuList)
          }
        })
      }
    },
    async openDialog (dragData, dropLcdMenu, deviceConfig) {
      this.dialogVisible = true
      this.clear()
      this.dragData = dragData
      this.dropLcdMenu = dropLcdMenu
      this.bindGroup = this.calcBindGroupCfg(this.dragData.name, deviceConfig)
      const allInterlockGroup = await getAllInterlockGroupId()
      this.calcBindData(allInterlockGroup)
      this.getDefaultCheckedKeys(dropLcdMenu.menuList)
      this.$nextTick(() => {
        this.$refs.bindGroupTreeView.setCheckedKeys(this.defaultCheckedKeys)
        this.disabledKeys = this.$refs.bindGroupTreeView.getCheckedKeys(false)
      })
    },
    clear () {
      this.bindGroup = null
      this.bindData = []
      this.defaultCheckedKeys = []
      this.disabledKeys = []
      this.filterText = ''
    },
    closeDialog () {
      this.dialogVisible = false
    },
    async confirm () {
      const loading = openWindowLoading(`绑定${this.dragData.name}分组中...`)
      try {
        const arrNodeId = this.$refs.bindGroupTreeView.getCheckedNodes(false, true).map((v) => v.id)
        await this.bindChildGroup(this.bindData, arrNodeId, this.dropLcdMenu)
      } catch (e) {
        this.$logger.error(e)
      } finally {
        this.closeDialog()
        loading.close()
      }
    },
    async bindChildGroup (groupList, arrNodeId, parentLcd) {
      if (!groupList || groupList.length === 0) {
        return
      }
      for (const group of groupList) {
        if (arrNodeId.includes(group.id)) {
          const bindId = `${group.id}${group.clazzName}`
          const existLcdMenu = R.find(R.propEq(bindId, 'bindId'))(parentLcd.menuList)
          if (existLcdMenu && (existLcdMenu.isFolder === YesNoEnum.YES || existLcdMenu.functionName === this.dragData.function)) {
            await this.bindChildGroup(group.groupList, arrNodeId, existLcdMenu)
          } else {
            const lcdMenu = new LcdMenu()
            lcdMenu.name = group.desc
            lcdMenu.isFolder = group.isManageGroup
            lcdMenu.index = parentLcd.menuList.length
            lcdMenu.bindId = bindId
            lcdMenu.functionName = lcdMenu.isFolder === YesNoEnum.YES ? '' : this.dragData.function
            const savedLcd = await instanceModel(lcdMenu, parentLcd.id)
            savedLcd.parentNode = parentLcd

            await this.bindChildGroup(group.groupList, arrNodeId, savedLcd)

            parentLcd.menuList.push(savedLcd)
            parentLcd.children = parentLcd.getChildren()
          }
        }
      }
    }
  },
  mounted () {
    this.$vbus.$on('OPEN_LCD_NEW_BIND_GROUP_DIALOG', this.openDialog)
  },
  destroyed () {
    this.$vbus.$off('OPEN_LCD_NEW_BIND_GROUP_DIALOG', this.openDialog)
  }
}
</script>

<style scoped>
</style>
