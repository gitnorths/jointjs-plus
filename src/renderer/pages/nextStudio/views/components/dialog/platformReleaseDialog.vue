<template>
  <vxe-modal v-model="visible"
             id="vfbPkg"
             title="平台Release管理"
             width="600"
             height="400"
             esc-closable
             show-close
             show-zoom
             destroy-on-close
             resize
             remember
             :before-hide-method="beforeCloseHandler"
             transfer
             ref="modal">
    <div style="height: 100%;width: 100%">
      <vxe-toolbar>
        <template v-slot:buttons>
          当前版本 ：{{ device.platformVersion || '未设置' }}
        </template>
        <template v-slot:tools>
          <vxe-button icon="fa fa-file-archive-o" status="primary" @click="importDialog">本地Release</vxe-button>
        </template>
      </vxe-toolbar>
      <div style="height: calc(100% - 110px)">
        <vxe-table
          :data="tableData"
          height="auto"
          stripe
          border
          auto-resize
          size="small"
          :loading="loading"
          align="center"
          show-overflow
          keep-source
          :column-config="{resizable: true}"
          :row-config="{isHover: true, useKey: true}"
          :radio-config="{ highlight: true, strict: false }"
          @radio-change="radioChangeEvent"
          ref="vxTable">
          <vxe-column type="seq" title="#" width="40"></vxe-column>
          <vxe-column field="version" title="版本" width="160"></vxe-column>
          <vxe-column field="desc" title="描述" width="160"></vxe-column>
          <vxe-column field="date" title="发布日期" width="160"></vxe-column>
          <vxe-column type="radio" width="50"></vxe-column>
        </vxe-table>
      </div>
      <div style="width: 100%; display: flex; justify-content: center;margin-top: 10px">
        <el-button @click="close">取消</el-button>
        <el-button type="primary" @click="sync" :disabled="!newVersion">同步</el-button>
      </div>
    </div>
  </vxe-modal>
</template>

<script>
import { openWindowDialog, openWindowLoading } from '@/renderer/common/action'
import * as path from 'path'
import * as fse from 'fs-extra'
import { updateModel } from '@/renderer/pages/nextStudio/action'
import Seven from 'node-7z'
import { Device } from '@/model/dto'

export default {
  name: 'platformReleaseDialog',
  data () {
    return {
      visible: false,
      loading: false,
      newVersion: '',
      releaseList: [],
      tableData: []
    }
  },
  computed: {
    device () {
      return this.$store.getters.device
    }
  },
  methods: {
    open () {
      this.visible = true
      this.getPlatformReleaseList()
    },
    getPlatformReleaseList () {
      this.loading = true
      this.$api['platformReleaseApi/getPlatformReleaseList']()
        .then(resp => {
          if (resp) {
            this.releaseList = resp.data.data || []
            this.init()
          }
        })
        .catch(e => {
          this.$notification.openErrorNotification(`获取在线release异常 ${e}`).logger()
        })
        .finally(() => (this.loading = false))
    },
    init () {
      this.tableData = this.releaseList.map(ver => {
        return {
          version: ver.version,
          desc: ver.desc,
          date: ver.date,
          bspVersion: ver.bspVersion,
          kernelVersion: ver.kernelVersion
        }
      })
    },
    updatePlatformVersion (newVersion) {
      const ver = newVersion || this.newVersion
      const dto = new Device({ name: this.device.name, platformVersion: ver })
      return updateModel(dto)
    },
    importDialog () {
      openWindowDialog({
        title: '选择release包',
        properties: ['openFile'],
        filters: [{ name: '', extensions: ['zip', '7z'] }]
      })
        .then((openDialogReturnValue) => {
          if (openDialogReturnValue && openDialogReturnValue.filePaths && openDialogReturnValue.filePaths.length > 0) {
            const filePath = openDialogReturnValue.filePaths[0]
            const basename = path.basename(filePath)
            const newVersion = basename.replace(/\.(zip|7z)/, '')
            if (!/R\d+\.\d+\.\d+\.\d+/.test(newVersion)) {
              this.$notification.openErrorNotification('release文件名版本异常').logger()
              return
            }

            const windowLoading = openWindowLoading('解压中...')

            const releaseDir = path.join(this.$store.getters.deviceDbPath, '../release')
            const extractPath = path.join(this.$store.getters.deviceDbPath, '../releaseTemp')
            fse.ensureDirSync(extractPath)

            // myStream is a Readable stream
            const SevenzaExe = path.join(process.cwd(), 'tools/7za.exe')
            const myStream = Seven.extractFull(filePath, extractPath, { $progress: true, $bin: SevenzaExe })

            myStream.on('end', () => {
              // 更新device的platformVersion
              this.updatePlatformVersion(newVersion)
                .then(() => {
                  this.$notification.openSuccessNotification(`平台库${newVersion}同步成功`).logger()
                  // 删除原release目录
                  fse.removeSync(releaseDir)
                  fse.moveSync(extractPath, releaseDir)
                  this.close()
                })
                .catch(e => {
                  this.$notification.openErrorNotification('平台版本号写入异常' + e).logger()
                })
              if (windowLoading) {
                windowLoading.close()
              }
            })

            myStream.on('error', (err) => {
              if (windowLoading) {
                windowLoading.close()
              }
              this.$notification.openErrorNotification('release解压失败' + err).logger()
            })
          }
        })
    },
    radioChangeEvent ({ newValue }) {
      this.newVersion = newValue ? newValue.version : ''
    },
    clear () {
      this.newVersion = ''
      this.releaseList = []
      this.tableData = []
    },
    async beforeCloseHandler () {
      this.clear()
    },
    close () {
      this.$refs.modal.close()
    },
    sync () {
      // 更新deviceVersion
      const selectVersion = this.$refs.vxTable.getRadioRecord()
      this.$refs.downloadDialog.openDialog(selectVersion)
    }
  },
  mounted () {
    this.$vbus.$on('OPEN_PLATFORM_RELEASE_DIALOG', this.open)
  },
  beforeDestroy () {
    this.$vbus.$off('OPEN_PLATFORM_RELEASE_DIALOG', this.open)
  }
}
</script>

<style scoped>

</style>
