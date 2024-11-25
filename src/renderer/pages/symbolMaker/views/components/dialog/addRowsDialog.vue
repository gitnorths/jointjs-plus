<template>
  <vxe-modal v-model="dialogVisible"
             title="添加记录"
             width="400"
             height="350"
             esc-closable
             show-close
             destroy-on-close
             resize
             remember
             :before-hide-method="beforeCloseHandler"
             transfer
             class-name=""
             ref="modal">
    <el-container style="height: 100%">
      <el-main style="height: 100%; padding: 0">
        <vxe-form :data="formData" title-align="right" title-width="74" :title-colon=true ref="propertyForm">
          <vxe-form-item title="变量名" span="24" field="name">
            <template v-slot="{ data }">
              <vxe-input v-model="data.name" placeholder="请输入变量名" clearable/>
            </template>
          </vxe-form-item>
          <vxe-form-item title="添加多条" span="24" field="multiRows">
            <template v-slot="{ data }">
              <vxe-switch v-model="data.multiRows"/>
            </template>
          </vxe-form-item>
          <vxe-form-item v-if="formData.multiRows" title="数量" span="24" field="number">
            <template v-slot="{ data }">
              <vxe-input type="integer" min="1" v-model="data.number"/>
            </template>
          </vxe-form-item>
          <vxe-form-item v-if="formData.multiRows" title="自动编号" span="24">
            <template v-slot="{ data }">
              <el-row>
                <el-col :span="12">初始值</el-col>
                <el-col :span="12">步进值</el-col>
              </el-row>
              <el-row>
                <el-col :span="12">
                  <vxe-input size="mini" type="integer" min="0" v-model="data.start"/>
                </el-col>
                <el-col :span="12">
                  <vxe-input size="mini" type="integer" min="1" v-model="data.step"/>
                </el-col>
              </el-row>
            </template>
          </vxe-form-item>
        </vxe-form>
      </el-main>
      <el-footer style="background-color: white">
        <div style="width: 100%; display: flex; justify-content: center;margin-top: 10px">
          <el-button size="small" @click="cancel">取消</el-button>
          <el-button size="small" type="primary" @click="confirm">确定</el-button>
        </div>
      </el-footer>
    </el-container>
  </vxe-modal>
</template>

<script>
import * as R from 'ramda'
export default {
  name: 'addRowsDialog',
  data () {
    return {
      formData: {
        name: '',
        multiRows: false,
        number: 2,
        start: 1,
        step: 1
      }
    }
  },
  computed: {
    payload () {
      return this.$store.getters.addRowsPayload
    },
    dialogVisible: {
      get () {
        return this.$store.getters.addRowsVisible
      },
      set (val) {
        if (!val) {
          this.$store.commit('closeAddRowsDialog')
        }
      }
    }
  },
  methods: {
    cancel () {
      this.dialogVisible = false
    },
    confirm () {
      const newNames = []
      if (this.formData.multiRows) {
        const number = Number(this.formData.number)
        const start = Number(this.formData.start)
        const step = Number(this.formData.step)
        for (let i = 0; i < number; i++) {
          const str = this.formData.name + (start + step * i)
          newNames.push(str)
        }
      } else {
        newNames.push(this.formData.name)
      }
      // todo check exist
      const conflict = R.intersection(newNames, this.payload.existNames)
      if (conflict && conflict.length > 0) {
        this.$notification.openErrorNotification(`新建失败！${conflict.join(',')} 和已有的记录冲突`)
        return
      }
      this.$vbus.$emit('INSERT_MANY_SE_ROWS',
        {
          tagKey: this.payload.tagKey,
          propName: this.payload.propName,
          newNames
        })
      this.dialogVisible = false
    },
    beforeCloseHandler () {
      this.formData = {
        name: '',
        multiRows: false,
        number: 2,
        start: 1,
        step: 1
      }
    }
  }
}
</script>

<style scoped>

</style>
