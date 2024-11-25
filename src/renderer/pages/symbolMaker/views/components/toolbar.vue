<template>
  <div class="toolbarContainer">
    <div class="commonToolbar">
      <el-tooltip content="新建" placement="bottom" :open-delay=500>
        <el-button class="m_tool_btn" icon="el-icon-folder-add" @click="newSymbolArchive"></el-button>
      </el-tooltip>
      <el-tooltip content="打开" placement="bottom" :open-delay=500>
        <el-button class="m_tool_btn" icon="el-icon-folder-opened" @click="openSymbolArchive"></el-button>
      </el-tooltip>
      <el-tooltip content="保存" placement="bottom" :open-delay=500>
        <el-button :disabled="!pkgExist" class="m_tool_btn" icon="fa fa-save" @click="saveAll"></el-button>
      </el-tooltip>
      <el-divider direction="vertical"/>
      <el-tooltip content="打开一体化工具(Next Studio)" placement="bottom" :open-delay=500>
        <el-button class="m_tool_btn" @click="openNextStudio">
          <img src="logo/nextStudio.png" style="height: 20px" alt="打开一体化工具"></el-button>
      </el-tooltip>
    </div>
  </div>
</template>

<script>
import {
  newSymbolArchiveAction,
  openNextStudioAction,
  openSymbolArchiveAction,
  saveAllAction
} from '@/renderer/pages/symbolMaker/action'
import * as R from 'ramda'
import { SymbolBlockVersion } from '@/model/dto'

export default {
  name: 'toolbarComp',
  computed: {
    pkgExist () {
      // FIXME
      const openedPkgList = this.$store.getters.archiveList
      return openedPkgList && R.isNotEmpty(openedPkgList)
    },
    activeDto () {
      return this.$store.getters.workTagsActiveDTO
    },
    showGraphToolBar () {
      return this.activeDto !== undefined && this.activeDto instanceof SymbolBlockVersion
    }
  },
  watch: {},
  methods: {
    newSymbolArchive () {
      newSymbolArchiveAction()
    },
    openSymbolArchive () {
      openSymbolArchiveAction()
    },
    saveAll () {
      saveAllAction()
    },
    openNextStudio () {
      openNextStudioAction()
    }
  }
}
</script>

<style lang="scss">
.toolbarContainer {
  height: 36px;
  border-bottom: 1px solid lightgray;
  position: relative;
  z-index: 2;

  .el-divider {
    top: -2px;
  }

  .commonToolbar {
    padding-left: 10px;
    height: 36px;
    line-height: 36px;
    display: inline-block;
  }

  .editToolBar {
    height: 36px;
    line-height: 36px;
    display: inline-block;

    .edit_btn {
      padding: 3px;
      border: 0;
      height: 24px;
      font-size: 17px;
      margin-left: 5px;
    }

    .edit_btn:hover {
      background: #409eff;
      opacity: 0.5;
      color: white;
    }

    .el-input {
      margin: 0 5px;
      width: 50px;

      input {
        height: 23px;
        line-height: 23px;
        padding: 0 6px;
      }
    }
  }

  .m_tool_btn {
    padding: 3px;
    border: 0;
    height: 24px;
    font-size: 18px;

    img {
      position: relative;
      top: -2px;
      height: 16px;
      width: auto;
    }
  }

  .m_tool_btn:hover {
    background: #409eff;
    opacity: 0.5;
    color: white;
  }
}
</style>
