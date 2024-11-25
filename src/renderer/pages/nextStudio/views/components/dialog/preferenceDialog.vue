<template>
  <el-dialog
    title="首选项"
    :visible.sync="dialogVisible"
    width="800px"
    append-to-body
    :close-on-click-modal=false
    @keyup.enter.native="confirm"
    @submit.native.prevent>
    <el-container style="height: 520px">
      <el-aside width="130px" style="border-right: 1px solid #D3DCE6;">
        <el-tree
          node-key="key"
          :data="treeData"
          @node-click="nodeClickHandler"
          highlight-current
          ref="tree">
        </el-tree>
      </el-aside>
      <el-container>
        <el-main>
          <el-form
            v-if="this.selectNode && this.selectNode.key === 'compilerPath'"
            size="small"
            :model="compilerPathForm"
            label-position="left"
            label-width="160px"
            ref="compilerPathForm">
            <el-form-item
              v-for="(key) in Object.keys(compilerPathForm)"
              :label="key"
              :prop="key"
              :key="key">
              <el-input v-model="compilerPathForm[key].path" :placeholder="compilerPathForm[key].suggest" readonly>
                <template v-slot:append>
                  <el-button @click="selectProjectSaveDir(key)" icon="el-icon-folder-opened"></el-button>
                </template>
              </el-input>
              <div style="float: right">
                <el-link type="primary" @click="openDownloadPage(compilerPathForm[key].href)">官网下载</el-link>
                <el-link type="info" @click="openDownloadPage(compilerPathForm[key].pan)" style="margin-left: 10px">
                  网盘下载
                </el-link>
              </div>
            </el-form-item>
          </el-form>
          <el-button v-if="this.selectNode && this.selectNode.key === 'rackTemplate'" type="primary"
                     @click="downloadTemplate">
            同步最新模板
          </el-button>
        </el-main>
        <el-footer>
          <div style="width: 100%; display: flex; justify-content: center;margin-top: 10px">
            <el-button @click="cancel">取消</el-button>
            <el-button type="primary" @click="confirm">确认</el-button>
          </div>
        </el-footer>
      </el-container>
    </el-container>
  </el-dialog>
</template>

<script>
import * as fse from 'fs-extra'
import * as os from 'os'
import * as path from 'path'
import { openUrl, openWindowDialog } from '@/renderer/common/action'

export default {
  name: 'preferenceDialog',
  data () {
    return {
      dialogVisible: false,
      treeData: [],
      selectNode: null,
      toolConfig: null,
      compilerPathForm: {
        C6000_CGTOOLS: { path: '', suggest: '', href: '', pan: '' },
        SourceryCodeBechLite: { path: '', suggest: '', href: '', pan: '' },
        Xilinx_win: { path: '', suggest: '', href: '', pan: '' },
        'arm-none-eabi-gcc': { path: '', suggest: '', href: '', pan: '' },
        'aarch64-linux-gnu-gcc': { path: '', suggest: '', href: '', pan: '' }
      }
    }
  },
  computed: {
    USER_HOME () {
      return os.homedir()
    },
    configPath () {
      return path.join(this.USER_HOME, 'hz_ied_studio_config.json')
    }
  },
  methods: {
    clear () {
      this.treeData = []
      this.selectNode = null
      this.toolConfig = null
      this.compilerPathForm = {
        C6000_CGTOOLS: {
          path: '',
          suggest: 'buildTools/C6000_CGTOOLS_7.4.8',
          href: 'https://software-dl.ti.com/codegen/non-esd/downloads/download_archive.htm',
          pan: 'https://pan.baidu.com/s/1nhImo0E75X-5nCrPBvcrNg?pwd=2ug2'
        },
        SourceryCodeBechLite: {
          path: '',
          suggest: 'buildTools/SourceryCodeBenchLite',
          href: 'https://www.plm.automation.siemens.com/global/en/products/embedded-software/sourcery-codebench-lite-downloads.html',
          pan: 'https://pan.baidu.com/s/1ipNVgtPIE2Ww_HRGYIZmFw?pwd=8czb'
        },
        Xilinx_win: {
          path: '',
          suggest: 'buildTools/Xilinx_2015.2_win/SDK/2015.2/gnu/arm/nt',
          href: 'https://www.xilinx.com/support/download/index.html/content/xilinx/en/downloadNav/vivado-design-tools/archive.html',
          pan: 'https://pan.baidu.com/s/1gIgzdIWGhIV9KCn6IpOkOw?pwd=p4fx'
        },
        'arm-none-eabi-gcc': {
          path: '',
          suggest: 'buildTools/gcc-arm-none-eabi-7-2018-q2',
          href: 'https://developer.arm.com/tools-and-software/open-source-software/developer-tools/gnu-toolchain/gnu-rm/downloads/7-2018-q2-update',
          pan: 'https://pan.baidu.com/s/1v77D6bzVzQmh9EJ5LKbsow?pwd=u5em'
        },
        'aarch64-linux-gnu-gcc': {
          path: '',
          suggest: 'buildTools/gcc-linaro-7.3.1-2018.05-i686-mingw32_aarch64-linux-gnu',
          href: 'https://releases.linaro.org/components/toolchain/binaries/7.3-2018.05/aarch64-linux-gnu/',
          pan: 'https://pan.baidu.com/s/1o8B2YzBnR-zWB-Xn00cABg?pwd=rv55'
        }
      }
    },
    openDialog (key) {
      this.clear()
      this.treeData = [
        { label: '编译器路径', key: 'compilerPath' },
        { label: '机箱|板卡模板', key: 'rackTemplate' }
      ]
      if (fse.existsSync(this.configPath)) {
        this.toolConfig = fse.readJSONSync(this.configPath, { encoding: 'utf8' })
        this.compilerPathForm.C6000_CGTOOLS.path = this.toolConfig.compilerPath.C6000_CGTOOLS
        this.compilerPathForm.SourceryCodeBechLite.path = this.toolConfig.compilerPath.SourceryCodeBechLite
        this.compilerPathForm.Xilinx_win.path = this.toolConfig.compilerPath.Xilinx_win
        this.compilerPathForm['arm-none-eabi-gcc'].path = this.toolConfig.compilerPath['arm-none-eabi-gcc']
        this.compilerPathForm['aarch64-linux-gnu-gcc'].path = this.toolConfig.compilerPath['aarch64-linux-gnu-gcc']
      }

      this.selectNode = this.treeData[0]
      if (key) {
        this.selectNode = R.find(R.propEq(key, 'key'))(this.treeData)
      }

      this.dialogVisible = true
      this.$nextTick(() => {
        this.$refs.tree.setCurrentKey(this.selectNode.key)
      })
    },
    openDownloadPage (address) {
      openUrl(address)
    },
    nodeClickHandler (data) {
      this.selectNode = data
    },
    async selectProjectSaveDir (propName) {
      const openDialogReturnValue = await openWindowDialog({
        title: '请选择工程保存位置',
        properties: ['openDirectory']
      })
      const filePaths = openDialogReturnValue.filePaths
      if (filePaths instanceof Array && filePaths.length > 0) {
        const pathStr = filePaths[0].replaceAll(path.sep, '/')
        this.compilerPathForm[propName].path = pathStr
      }
    },
    async downloadTemplate () {
      try {
        const resp = await this.$api['pkgApi/getRackTemplate']()
        if (resp && resp.data && resp.data.data) {
          const { racks, boardGroups } = resp.data.data
          if (racks && racks.length > 0) {
            for (const rack of racks) {
              const sortVersionList = R.sort(R.ascend(R.prop('version')), rack.versionList)
              const newEstVersion = sortVersionList[0]
              const rackJson = {
                type: rack.type,
                desc: rack.desc,
                slots: newEstVersion.slots
              }
              fse.writeJSONSync(path.join(process.cwd(), `templates/rack/${rack.type}.json`), rackJson, { spaces: 2 })
            }
          }
          if (boardGroups && boardGroups.length > 0) {
            for (const bg of boardGroups) {
              if (bg.boards && bg.boards.length > 0) {
                const bgPath = path.join(process.cwd(), `templates/board/${bg.name}`)
                fse.ensureDirSync(bgPath)
                for (const board of bg.boards) {
                  fse.writeJSONSync(path.join(process.cwd(), `templates/board/${bg.name}/${board.type}.json`), board, { spaces: 2 })
                }
              }
            }
          }
          this.$notification.openSuccessNotification('机箱|板卡模板更新成功。').logger()
        } else {
          this.$notification.openInfoNotification('请先在服务器上添加机箱|板卡模板。').logger()
        }
      } catch (e) {
        this.$notification.openErrorNotification(`获取在线机箱|板卡信息异常 ${e}`).logger()
      }
    },
    cancel () {
      this.dialogVisible = false
    },
    confirm () {
      const content = this.toolConfig ? _.cloneDeep(this.toolConfig) : { compilerPath: null }
      content.compilerPath = {}
      Object.keys(this.compilerPathForm).forEach(key => {
        content.compilerPath[key] = this.compilerPathForm[key].path
      })
      fse.writeJSONSync(this.configPath, content, { spaces: 2, encoding: 'utf8' })
      this.dialogVisible = false
    }
  },
  mounted () {
    this.$vbus.$on('OPEN_PREFERENCE_DIALOG', this.openDialog)
  },
  destroyed () {
    this.$vbus.$off('OPEN_PREFERENCE_DIALOG', this.openDialog)
  }
}
</script>

<style scoped>

</style>
