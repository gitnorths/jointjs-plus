<template>
  <vxe-modal v-model="visible"
             title="新建工程"
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
    <div class="mainWindow">
      <div style="height: calc(100% - 68px); padding: 20px">
        <el-form :model="dataForm" :rules="rules" label-position="right" label-width="100px" ref="form">
          <el-form-item label="工程名称" prop="name">
            <el-input v-model="dataForm.name" placeholder="请输入工程名称"/>
          </el-form-item>
          <el-form-item label="机箱|主板" prop="rack">
            <el-col :span="11">
              <el-form-item prop="date1">
                <el-select v-model="dataForm.rack" placeholder="请选择机箱类型" style="width: 100%"
                           @change="rackChangeHandler">
                  <el-option v-for="item in rackOptions"
                             :key="item.value"
                             :label="item.label"
                             :value="item.value"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12" :offset="1">
              <el-form-item prop="date2">
                <el-select v-model="dataForm.cpuType" placeholder="请选择CPU板型号" style="width:100%"
                           :disabled="!dataForm.rack" clearable>
                  <el-option v-for="item in cpuBoardTypes(dataForm.rack)"
                             :key="item.value"
                             :label="item.label"
                             :value="item.value"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-form-item>
          <el-form-item label="保存路径" prop="savePath">
            <el-input v-model="dataForm.savePath" readonly>
              <template v-slot:append>
                <el-button @click="selectProjectSaveDir" icon="el-icon-folder-opened"></el-button>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item label="功能块库示例" prop="demoVFB">
            <el-switch v-model="dataForm.demoVFB" active-text="生成" inactive-text="不生成"></el-switch>
          </el-form-item>
        </el-form>
      </div>
      <div style="width: 100%; display: flex; justify-content: center;margin-top: 10px">
        <el-button @click="cancel">取消</el-button>
        <el-button type="primary" @click="confirm">确认</el-button>
      </div>
    </div>
  </vxe-modal>
</template>

<script>
import { createNewDevice, loadRackTemplates } from '@/renderer/pages/nextStudio/action'
import { openWindowDialog, openWindowLoading } from '@/renderer/common/action'

export default {
  name: 'createProjectDialog',
  data () {
    return {
      visible: false,
      dataForm: {
        name: '', // 工程
        rack: '', // 机箱类型
        cpuType: '', // cpu板型号
        savePath: '',
        demoVFB: true
      },
      rules: {
        name: [
          { required: true, message: '工程名称不能为空', trigger: 'blur' }
        ],
        rack: [
          { required: true, message: '机箱类型不能为空', trigger: 'change' }
        ],
        savePath: [
          { required: true, message: '保存路径不能为空', trigger: 'change' }
        ]
      }
    }
  },
  computed: {
    rackLib () {
      return this.$store.getters.rackLib
    },
    rackOptions () {
      return this.rackLib
        ? this.rackLib.map(rackInfo => {
          return {
            label: rackInfo.type || rackInfo.name,
            value: rackInfo.type || rackInfo.name
          }
        })
        : [{ label: 'HZ6000机箱', value: 'HZ6000' }, { label: 'HZ4000机箱', value: 'HZ4000' }, {
          label: 'HZ1000机箱',
          value: 'HZ1000'
        }]
    },
    boardLib () {
      return this.$store.getters.boardLib
    },
    cpuBoardOptions () {
      if (this.rackLib) {
        const result = {}
        for (const rackInfo of this.rackLib) {
          const boardGroups = []
          rackInfo.slots.forEach(slot => {
            if (slot.boardGroup) {
              boardGroups.push(...slot.boardGroup)
            }
          })
          const uniqBoardGrps = R.uniq(boardGroups)
          const cpuBoards = []
          this.boardLib.forEach(boardGrp => {
            if (uniqBoardGrps.includes(boardGrp.name)) {
              boardGrp.boards.forEach(board => {
                if (/^CPU$/i.test(board.group)) {
                  cpuBoards.push(board)
                }
              })
            }
          })

          result[rackInfo.type || rackInfo.name] = cpuBoards
            .map(cpuBoard => ({
              label: cpuBoard.type || cpuBoard.name,
              value: cpuBoard.type || cpuBoard.name
            }))
        }
        return result
      } else {
        return {
          HZ6000: [
            { label: 'HZ6101', value: 'HZ6101' },
            { label: 'HZ6105', value: 'HZ6105' },
            { label: 'HZ6111', value: 'HZ6111' }
          ],
          HZ4000: [
            { label: 'HZ4101', value: 'HZ4101' }
          ],
          HZ1000: [
            { label: 'HZ1210', value: 'HZ1210' },
            { label: 'HZ1220', value: 'HZ1220' }
          ]
        }
      }
    }
  },
  methods: {
    open () {
      this.visible = true
      loadRackTemplates()
    },
    cpuBoardTypes (rackType) {
      return this.cpuBoardOptions[rackType]
    },
    rackChangeHandler (rackType) {
      if (this.cpuBoardOptions[rackType] && this.cpuBoardOptions[rackType].length > 0) {
        this.dataForm.cpuType = this.cpuBoardOptions[rackType][0].value
      } else {
        this.dataForm.cpuType = ''
      }
    },
    async selectProjectSaveDir () {
      const openDialogReturnValue = await openWindowDialog({
        title: '请选择工程保存位置',
        properties: ['openDirectory']
      })
      const filePaths = openDialogReturnValue.filePaths
      if (filePaths instanceof Array && filePaths.length > 0) {
        this.dataForm.savePath = filePaths[0]
      }
    },
    clear () {
      this.$refs.form.resetFields()
    },
    cancel () {
      this.$refs.modal.close()
    },
    beforeCloseHandler () {
      try {
        this.clear()
      } catch (e) {
        return new Error(e)
      }
    },
    confirm () {
      this.$refs.form.validate((valid) => {
        if (valid) {
          const loading = openWindowLoading('新建工程中...')
          setTimeout(() => {
            createNewDevice({ ...this.dataForm })
              .then(() => {
                this.$refs.modal.close()
              })
              .catch(err => {
                this.$notification.openErrorNotification(`新建工程失败 ${err}`).logger()
              })
              .finally(() => {
                loading.close()
              })
          }, 100)
        } else {
          return false
        }
      })
    }
  },
  mounted () {
    this.$vbus.$on('OPEN_CREATE_DEVICE_DIALOG', this.open)
  },
  beforeDestroy () {
    this.$vbus.$off('OPEN_CREATE_DEVICE_DIALOG', this.open)
  }
}
</script>

<style lang="scss">
.el-form-item__error {
  white-space: normal;
}
</style>
<style scoped>
.mainWindow {
  width: 100%;
  height: 100%;
}
</style>
