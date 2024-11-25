<template>
  <div class="lcdDragMenu">
    <div class="lcdPanel"
         :id="mainMenu.id"
         draggable="true"
         @dragover="dragOver($event)"
         @dragenter="dragEnter($event, mainMenu)"
         @dragleave="dragLeave($event, mainMenu)"
         @drop="drop($event, mainMenu)">
      <el-tree
        style="height: 60px;"
        class="lcdPanelTree"
        node-key="id"
        :data="treeData"
        :props="{label: 'name'}"
        draggable
        :allow-drag="() => true"
        :allow-drop="sortTreeAllowDrop"
        @node-drop="handleSortTree"
        :expand-on-click-node="false"
        ref="tree">
        <template v-slot="{node, data}">
          <div class="treeDiv" :id="data.id" @dragover="dragOver($event)" @dragenter="dragEnter($event, data)"
               @dragleave="dragLeave($event, data)" @drop="drop($event, data)" @dblclick="dblClkHandler(node, data)">
            <div class="treeName">
              <div v-if="!showNameInput(data)">
                <i :class="menuIcon(data)" style="color: #1296DB"/>
                <span style="margin-left: 5px">{{ menuPrefix(data) }}</span>
                <span>{{ node.label }}</span>
                <span v-if="data.hidden"> ( <i :class="visibleIcon(data.hidden)"/> 隐藏 )</span>
              </div>
              <el-input v-else v-model="data.name" @blur="updateMenuName(data)" ref="lcdNameInput" clearable/>
              <span class="treeNodeBtnGroup">
              <el-tooltip :content="data.hidden ? '显示' : '隐藏'" placement="top" :open-delay=500>
                <el-button :icon="visibleIcon(!data.hidden)" circle @click="updateMenuHidden(data)" size="mini"/>
              </el-tooltip>
              <el-tooltip content="改名" placement="top" :open-delay=500>
                <el-button type="primary" icon="el-icon-edit" circle @click="showLcdMenuInput(data)" size="mini"
                           v-if="showEditBtn(data)"/>
              </el-tooltip>
              <el-tooltip content="删除" placement="top" :open-delay=500>
                <el-button type="danger" icon="el-icon-delete" circle @click="deleteLcdMenu(data)" size="mini"/>
              </el-tooltip>
            </span>
            </div>
          </div>
        </template>
      </el-tree>
    </div>
    <div class="lcdMenu">
      <div v-for="group in Object.keys(dragMenuObj)"
           :key="`drag-menu-${group}`">
        <el-divider content-position="left">{{ group }}</el-divider>
        <div class="lcdMenuBtn">
          <el-card shadow="hover" v-for="(dragTemplate, index) in dragMenuObj[group]"
                   :key="`${group}-${index}`"
                   class="card">
            <div class="dragZone" draggable="true" @dragstart="dragStart(dragTemplate)" @dragend="dragEnd">
              <img :src="funcIcon(dragTemplate)" alt="" draggable="false"/>
              <span style="display: block">{{ dragTemplate.name }}</span>
            </div>
          </el-card>
        </div>
      </div>
    </div>
    <lcd-menu-add-folder-dialog/>
    <lcd-menu-add-bind-group-dialog/>
    <lcd-menu-add-ext-cmd-dialog/>
  </div>
</template>
<script>
import * as R from 'ramda'
import * as path from 'path'
import * as fse from 'fs-extra'
import LcdMenuAddFolderDialog from './dialog/lcdMenuAddFolderDialog.vue'
import LcdMenuAddBindGroupDialog from './dialog/lcdMenuAddBindGroupDialog.vue'
import LcdMenuAddExtCmdDialog from './dialog/lcdMenuAddExtCmdDialog.vue'
import { LcdMenuNameConst, LcdMenuTypeConst } from './lcdMenuConst'
import { deleteModel, instanceModel, updateModel } from '@/renderer/pages/nextStudio/action'
import { LcdMenu } from '@/model/dto'
import { YesNoEnum } from '@/model/enum'

export default {
  name: 'lcdDragMenu',
  components: {
    LcdMenuAddExtCmdDialog,
    LcdMenuAddBindGroupDialog,
    LcdMenuAddFolderDialog
  },
  props: {
    tagKey: {
      type: String,
      required: true
    }
  },
  data () {
    return {
      lcdTemplates: [],
      dragData: null,
      showLcdNameEditInput: '',
      orgCatalogName: ''
    }
  },
  computed: {
    dragMenuObj () {
      return R.groupBy(R.prop('type'))(this.lcdTemplates)
    },
    lcdMenuConfig () {
      return this.$store.getters.selectDto(this.tagKey)
    },
    mainMenu () {
      return this.lcdMenuConfig.menus.filter((menu) => /主菜单/.test(menu.name) && menu.isFolder === YesNoEnum.YES)[0]
    },
    treeData () {
      return this.mainMenu.children
    },
    deviceConfig () {
      return this.$store.getters.device.config
    }
  },
  methods: {
    menuIcon (data) {
      if (data.bindId) {
        return data.isFolder === YesNoEnum.YES ? 'fa fa-cubes' : 'fa fa-cube'
      }
      return data.isFolder === YesNoEnum.YES ? 'fa fa-folder-open' : 'fa fa-bookmark'
    },
    visibleIcon (hidden) {
      return hidden ? 'fa fa-eye-slash' : 'fa fa-eye'
    },
    menuPrefix (data) {
      if (/^LCDExternCmdPage/.test(data.functionName)) {
        let prefix = data.functionName.replace(/^LCDExternCmdPage/, 'EXT_CMD')
        prefix += ' : '
        return prefix
      }
      return ''
    },
    funcIcon (data) {
      switch (data.name) {
        case LcdMenuNameConst.AnalogGroup:
          return require('@/renderer/pages/nextStudio/assets/lcdIcon/moni.png')
        case LcdMenuNameConst.BinaryGroup:
          return require('@/renderer/pages/nextStudio/assets/lcdIcon/kaiguan.png')
        case LcdMenuNameConst.SettingGroup:
          return require('@/renderer/pages/nextStudio/assets/lcdIcon/dingzhi.png')
        case LcdMenuNameConst.InterlockStatus:
          return require('@/renderer/pages/nextStudio/assets/lcdIcon/liansuo.png')
        case LcdMenuNameConst.InterlockSettingGroup:
          return require('@/renderer/pages/nextStudio/assets/lcdIcon/custom.png')
        case LcdMenuNameConst.RefTableGroup:
          return require('@/renderer/pages/nextStudio/assets/lcdIcon/DIY.png')
        case LcdMenuNameConst.ExtCmd:
          return require('@/renderer/pages/nextStudio/assets/lcdIcon/cmd.png')
      }
      switch (data.type) {
        case LcdMenuTypeConst.Catalog:
          return require('@/renderer/pages/nextStudio/assets/lcdIcon/mulu.png')
        case LcdMenuTypeConst.ReportDisplay:
          return require('@/renderer/pages/nextStudio/assets/lcdIcon/baogao.png')
        case LcdMenuTypeConst.LocalCommand:
          return require('@/renderer/pages/nextStudio/assets/lcdIcon/mingling.png')
        case LcdMenuTypeConst.DeviceInfo:
          return require('@/renderer/pages/nextStudio/assets/lcdIcon/zhuangzhi.png')
        case LcdMenuTypeConst.LCD:
          return require('@/renderer/pages/nextStudio/assets/lcdIcon/LCD.png')
        case LcdMenuTypeConst.SelfTest:
          return require('@/renderer/pages/nextStudio/assets/lcdIcon/zijian.png')
        case LcdMenuTypeConst.Custom:
          return require('@/renderer/pages/nextStudio/assets/lcdIcon/zidingyi.png')
      }
    },
    showNameInput (data) {
      return this.showLcdNameEditInput === data.id
    },
    // 修改按钮是否显示
    showEditBtn (data) {
      if (data.isFolder === YesNoEnum.NO) {
        if (/LCDExternCmdPage/.test(data.functionName)) {
          return true
        }
      } else if (!data.bindId) {
        return true
      }
      return false
    },
    dblClkHandler (node, data) {
      if (data.isFolder === YesNoEnum.YES) {
        if (node.expanded) {
          node.collapse()
        } else {
          node.expand()
        }
      }
    },
    // 控件拖拽开始事件
    dragStart (item) {
      this.dragData = item
    },
    dragEnd () {
      this.dragData = null
    },
    dragOver (ev) {
      ev.preventDefault()
    },
    dragEnter (ev, data) {
      const el = document.getElementById(data.id)
      if (el) {
        el.classList.add('lcdDragOver')
        const parentEl = el.parentElement
        if (parentEl) {
          parentEl.classList.add('lcdDragOver')
        }
      }
    },
    clearDragOverClass (id) {
      const el = document.getElementById(id)
      if (el) {
        el.classList.remove('lcdDragOver')
        const parentEl = el.parentElement
        if (parentEl) {
          parentEl.classList.remove('lcdDragOver')
        }
      }
    },
    dragLeave (ev, data) {
      this.clearDragOverClass(data.id)
    },
    drop (ev, dropTarget) {
      this.clearDragOverClass(dropTarget.id)
      // 不是从空间面板拖拽的，直接结束
      if (!this.dragData) {
        return
      }
      if (dropTarget.isFolder === YesNoEnum.NO || dropTarget.bindId) {
        this.$message.warning('不支持的操作！')
        return
      }
      const dragType = this.dragData.type
      if (dragType === LcdMenuTypeConst.Catalog) {
        this.$vbus.$emit('OPEN_LCD_NEW_FOLDER_DIALOG', dropTarget)
      } else if (dragType === LcdMenuTypeConst.BindGroup) {
        // if (this.dragData.name === LcdMenuNameConst.InterlockStatus) {
        //   this.$vbus.$emit('OPEN_LCD_INTERLOCK_GROUP_DIALOG', this.dragData, dropTarget, this.deviceConfig.settingGroup);
        // } else {
        this.$vbus.$emit('OPEN_LCD_NEW_BIND_GROUP_DIALOG', this.dragData, dropTarget, this.deviceConfig)
        // }
      } else if (dragType === LcdMenuTypeConst.LocalCommand && this.dragData.function === 'LCDExternCmdPage') {
        this.$vbus.$emit('OPEN_LCD_NEW_EXT_CMD_DIALOG', this.dragData, dropTarget)
      } else {
        this.addNewCustomMenu(dropTarget)
      }
    },
    async addNewCustomMenu (dropTarget) {
      const menuObj = new LcdMenu()
      menuObj.name = this.dragData.name
      menuObj.functionName = this.dragData.function
      menuObj.index = dropTarget.children
        ? dropTarget.children.length
        : 0
      menuObj.isFolder = YesNoEnum.NO
      const newMenu = await instanceModel(menuObj, dropTarget.id)
      newMenu.parentNode = dropTarget
      dropTarget.menuList.push(newMenu)
      dropTarget.children.push(newMenu)
    },
    // 同级拖拽约束
    sortTreeAllowDrop (draggingNode, dropNode, type) {
      return draggingNode.data.parentNode.id === dropNode.data.parentNode.id && type !== 'inner'
    },
    handleSortTree (dragNode, dropNode, type) {
      const menuList = dropNode.data.parentNode.menuList
      menuList.splice(menuList.indexOf(dragNode.data), 1)
      switch (type) {
        case 'before':
          menuList.splice(menuList.indexOf(dropNode.data), 0, dragNode.data)
          break
        case 'after':
          menuList.splice(menuList.indexOf(dropNode.data) + 1, 0, dragNode.data)
          break
      }
      for (let i = 0; i < menuList.length; i++) {
        menuList[i].index = i
      }
      updateModel(...menuList)
    },
    showLcdMenuInput (data) {
      this.showLcdNameEditInput = data.id
      this.orgCatalogName = data.name
      this.$nextTick(() => this.$refs.lcdNameInput.$refs.input.focus())
    },
    // 修改目录名称
    updateMenuName (data) {
      if (!data.name) {
        this.$message.warning('目录名不能为空！')
        data.name = this.orgCatalogName
      } else {
        updateModel(data)
      }
      this.orgCatalogName = ''
      this.showLcdNameEditInput = ''
    },
    updateMenuHidden (data) {
      data.hidden = !data.hidden
      updateModel(data)
    },
    deleteLcdMenu (data) {
      this.$confirm(`确定删除【${data.name}】吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
        center: true
      })
        .then(() => deleteModel(data)
          .then(() => {
            const parentNodeChildren = data.parentNode.menuList
            const index = parentNodeChildren.indexOf(data)
            parentNodeChildren.splice(index, 1)
            data.parentNode.children.splice(index, 1)
          })
          .catch((e) => {
            this.$notification.openErrorNotification(`删除菜单失败${e}`).logger()
          }))
    },
    init () {
      const dir = path.join(process.cwd(), 'templates/lcdControl')
      const tempDirList = fse.readdirSync(dir)
      if (R.isNotEmpty(tempDirList)) {
        for (const tempDir of tempDirList) {
          const tempJsonFilePath = path.join(dir, tempDir)
          if (tempDir.endsWith('.json') && fse.statSync(tempJsonFilePath).isFile()) {
            const template = fse.readJsonSync(tempJsonFilePath)
            this.lcdTemplates.push(...template)
          }
        }
      }
    },
    // 同步关联分组数据
    bindGroupUpdate (toUpdateObjArray) {
      const toUpdateId = []
      toUpdateObjArray.forEach((toUpdate) => {
        if (/AnalogGroup|BinaryGroup|SettingGroup|ControlGroup|RefTableGroup/.test(toUpdate.clazzName)) {
          toUpdateId.push(`${toUpdate.id}${toUpdate.clazzName}`)
        }
      })
      if (toUpdateId.length === 0) {
        return
      }
      const bindUpdateArray = []
      const dataFor = (menuList) => {
        if (menuList && menuList.length > 0) {
          for (const menu of menuList) {
            const index = toUpdateId.indexOf(menu.bindId)
            if (index !== -1) {
              menu.name = toUpdateObjArray[index].desc
              bindUpdateArray.push(menu)
            }
            dataFor(menu.menuList)
          }
        }
      }
      dataFor(this.treeData)
    },
    bindGroupDelete (toDeleteObjArray) {
      if (!toDeleteObjArray) {
        return
      }
      const toDeleteId = []
      toDeleteObjArray.forEach((toDel) => {
        if (/AnalogGroup|BinaryGroup|SettingGroup|ControlGroup|RefTableGroup/.test(toDel.clazzName)) {
          toDeleteId.push(`${toDel.id}${toDel.clazzName}`)
        }
      })
      if (toDeleteId.length === 0) {
        return
      }
      const bindDeleteArray = []
      const dataFor = (menuList) => {
        if (menuList && menuList.length > 0) {
          for (const menu of menuList) {
            if (toDeleteId.includes(menu.bindId)) {
              bindDeleteArray.push(menu)
            } else {
              dataFor(menu.menuList)
            }
          }
        }
      }
      dataFor(this.treeData)
      for (const menu of bindDeleteArray) {
        const parentNodeChildren = menu.parentNode.menuList
        const index = parentNodeChildren.indexOf(menu)
        parentNodeChildren.splice(index, 1)
        menu.parentNode.children.splice(index, 1)
      }
    }
  },
  mounted () {
    this.init()
    this.$vbus.$on('MODEL_UPDATE', this.bindGroupUpdate)
    this.$vbus.$on('MODEL_DELETE', this.bindGroupDelete)
  },
  destroyed () {
    this.$vbus.$off('MODEL_UPDATE', this.bindGroupUpdate)
    this.$vbus.$off('MODEL_DELETE', this.bindGroupDelete)
  }
}
</script>
<style lang="scss">
.lcdDragOver {
  background-color: #f5f5f5;
}

.lcdDragMenu {
  position: relative;
  width: 100%;
  height: 100%;
  background-color: rgb(242, 244, 245);

  .lcdPanel {
    height: calc(100% - 20px);
    margin: 10px 0 10px 10px;
    padding: 10px;
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 55%;
    overflow: auto;
    background-color: rgb(255, 255, 255);
    border-radius: 8px;

    .lcdPanelTree {
      font-size: 50px !important;
    }

    .el-tree-node__content {
      height: 40px !important;
    }
  }

  .lcdMenu {
    height: calc(100% - 20px);
    position: absolute;
    padding: 0 20px;
    margin: 10px;
    top: 0;
    bottom: 0;
    right: 0;
    left: 45%;
    background-color: rgb(255, 255, 255);
    border-radius: 8px;
    overflow: auto;

    .lcdMenuBtn {
      background-color: rgb(255, 255, 255);
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-start;
      overflow: auto;

      .card {
        margin-right: 20px;
        margin-bottom: 10px;
        cursor: move;

        .el-card__body {
          padding: 0;
        }

        .dragZone {
          min-width: 100px;
          padding: 5px 20px;
          text-align: center;

          img {
            height: 30px !important;
            width: 30px;
          }
        }
      }
    }
  }
}

.treeDiv {
  width: 100%;
  height: 40px !important;
  line-height: 40px;

  .treeName {
    font-size: 15px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 40px !important;
    line-height: 40px;

    .treeNodeBtnGroup {
      margin-right: 10px;
      margin-bottom: 3px;
      display: none;
    }
  }
}

.treeDiv:hover {
  .treeNodeBtnGroup {
    display: block;
  }
}
</style>
