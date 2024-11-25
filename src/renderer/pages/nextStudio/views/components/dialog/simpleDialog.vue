<template>
  <el-dialog
    width="400px"
    class="simpleDialog"
    :title="title"
    :visible.sync="dialogVisible"
    append-to-body
    @closed="close"
    :close-on-click-modal=false
    @keyup.enter.native="confirm"
    @submit.native.prevent>
    <div class="simpleDialogAttrInput">
      <table>
        <template v-for="(editAttr, index) in editAttrs">
          <template v-if="editAttr['inputType'] === 'na'">
            <tr :key="`${index}_NA_TITLE`">
              <td class="title" colspan="2">
                {{ editAttr['title'] }}
              </td>
            </tr>
            <tr :key="`${index}_NA_CONTENT`">
              <td colspan="2">
                <editable-list ref="inputs" :list-items="dataForm[editAttr['attr']]"
                               :value-changed-callback="editableListValueChangedCallback(editAttr['attr'])"
                               :multi-column="false"/>
              </td>
            </tr>
          </template>
          <tr v-else :key="index">
            <td class="title">{{ editAttr['title'] }}</td>
            <td>
              <template v-if="editAttr['inputType'] === 'checkBox'">
                <el-checkbox ref="inputs" @input="forceUpdate" size="small" v-model="dataForm[editAttr['attr']]"
                             :readonly="editAttr['readonly']"/>
              </template>
              <template v-else-if="editAttr['inputType'] === 'select'">
                <el-select ref="inputs" @input="forceUpdate" size="small" v-model="dataForm[editAttr['attr']]"
                           :placeholder="R.replace('：', '', editAttr['title'])" clearable>
                  <el-option v-for="(item, itemIndex) in editAttr['list']" :key="itemIndex" :label="item['label']"
                             :value="item['value']"/>
                </el-select>
              </template>
              <template v-else-if="editAttr['inputType'] === 'radio'">
                <el-radio-group ref="inputs" @input="forceUpdate" v-model="dataForm[editAttr['attr']]">
                  <el-radio v-for="(item, itemIndex) in editAttr['list']" :key="itemIndex" :label="item['value']">
                    {{ item['label'] }}
                  </el-radio>
                </el-radio-group>
              </template>
              <template v-else>
                <el-input ref="inputs" @input="forceUpdate" size="small" v-model="dataForm[editAttr['attr']]"
                          :readonly="editAttr['readonly']" :placeholder="R.replace('：', '', editAttr['title'])"/>
              </template>
            </td>
          </tr>
        </template>
      </table>
    </div>
    <template v-slot:footer>
      <div>
        <el-button size="small" @click="dialogVisible = false" id="cancel">取消</el-button>
        <el-button size="small" type="primary" @click="confirm" id="confirm">确定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script>
import EditableList from './editableList/editableList.vue'

export default {
  name: 'simpleDialog',
  components: { EditableList },
  data () {
    return {
      title: '',
      dialogVisible: false,
      callback: () => {
        // todo
      },
      orgObj: {},
      editAttrs: [],
      dataForm: {}
    }
  },
  methods: {
    /**
     * 打开对话框
     * @param obj
     * @param title
     * @param editAttrs
     * @param callback
     */
    openDialog (obj, title, editAttrs, callback) {
      this.orgObj = obj
      this.title = title
      this.callback = callback
      this.editAttrs = editAttrs
      R.forEach((editAttr) => {
        const attr = editAttr.attr
        const orgValue = R.clone(this.orgObj[attr])

        if (R.equals('na', attr)) {
          const naStr = orgValue
          const naList = Array.from({ length: 10 }, () => ({
            name: '',
            value: ''
          }))
          const naStrList = naStr ? naStr.split(' ') : []

          naList.forEach((naItem, index) => {
            naItem.name = index
            naItem.value = naStrList[index] || ''
          })
          this.dataForm[attr] = naList
        } else {
          this.dataForm[attr] = orgValue
        }
      }, this.editAttrs)
      this.dialogVisible = true

      this.$nextTick(() => {
        const inputs = this.$refs.inputs

        if (inputs instanceof Array && inputs.length > 0) {
          const focusFunc = inputs[0].focus

          if (focusFunc instanceof Function) {
            focusFunc()
          }
        }
      })
    },
    confirm () {
      for (const editAttr of this.editAttrs) {
        const attr = editAttr.attr
        const value = this.dataForm[attr]

        if (editAttr.check instanceof Function && !editAttr.check(value)) {
          return false
        }
        if (R.equals('na', attr)) {
          this.orgObj[attr] = value.map(R.prop('value')).filter(x => x !== '').join(' ')
        } else {
          this.orgObj[attr] = value
        }
      }
      this.callback(this.orgObj)
      this.dialogVisible = false
    },
    close () {
      this.title = ''
      this.callback = () => {
        // TODO
      }
      this.orgObj = {}
      this.editAttrs = []
      this.dataForm = {}
    },
    forceUpdate () {
      this.$forceUpdate()
    },
    editableListValueChangedCallback (attr) {
      return (key, value) => {
        this.dataForm[attr][key].value = value
      }
    }
  },
  mounted () {
    this.$vbus.$on('OPEN_SIMPLE_DIALOG', this.openDialog)
  },
  destroyed () {
    this.$vbus.$off('OPEN_SIMPLE_DIALOG', this.openDialog)
  }
}
</script>

<style lang="scss">
.simpleDialog {
  .el-dialog {
    .el-dialog__body {
      padding: 20px;
    }

    .simpleDialogAttrInput {
      > table {
        border-collapse: separate;
        border-spacing: 0 18px;
        width: 100%;

        .editableList {
          width: 100%;
          margin: 0;
        }

        .title {
          text-align: left;
        }

        .el-select {
          width: 100%;
        }
      }
    }
  }
}
</style>
