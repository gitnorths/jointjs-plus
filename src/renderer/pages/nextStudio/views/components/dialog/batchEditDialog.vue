<template>
  <vxe-modal v-model="dialogVisible"
             :title="title"
             width="450"
             height="300"
             esc-closable
             show-close
             destroy-on-close
             resize
             remember
             :before-hide-method="beforeCloseHandler"
             transfer
             ref="modal">
    <el-container style="height: 100%">
      <el-main style="height: 100%; padding: 0">
        <vxe-form v-show="!showEditForm" :data="propForm" title-width="80" title-align="right" :title-colon=true>
          <vxe-form-item title="描述" field="desc" span="8" :item-render="{name: '$checkbox'}" :visible="showDesc"/>
          <vxe-form-item title="液晶" field="lcd" span="8" :item-render="{name: '$checkbox'}" :visible="showLcdRecCom"/>
          <vxe-form-item title="录波" field="record" span="8" :item-render="{name: '$checkbox'}"
                         :visible="showLcdRecCom"/>
          <vxe-form-item title="通信" field="comm" span="8" :item-render="{name: '$checkbox'}"
                         :visible="showLcdRecCom"/>
          <vxe-form-item title="事件" field="event" span="8" :item-render="{name: '$checkbox'}" :visible="showEvent"/>
          <vxe-form-item title="触发方式" field="trigType" span="8" :item-render="{name: '$checkbox'}"
                         :visible="showTrigType"/>
          <vxe-form-item title="属性值" field="attribute" span="8" :item-render="{name: '$checkbox'}"
                         :visible="showAttr"/>
          <vxe-form-item title="显示格式" field="syntax" span="8" :item-render="{name: '$checkbox'}"
                         :visible="showSyntax"/>
        </vxe-form>
        <vxe-form v-show="showEditForm" :data="formData" title-width="80" title-align="right"
                  :title-colon=true>
          <vxe-form-item title="描述" field="desc" span="24" :item-render="{}" :visible="visible('desc')">
            <template v-slot="{ data }">
              <div class="replaceBar">
                <vxe-input v-model="data.desc.searchValue" placeholder="查找的值" suffix-icon="fa fa-search" clearable>
                </vxe-input>
                <div style="display: inline-block; width: 10%; text-align: center">
                  <i class="fa fa-long-arrow-right"></i>
                </div>
                <vxe-input v-model="data.desc.replaceValue" placeholder="替换的值" suffix-icon="fa fa-repeat" clearable>
                </vxe-input>
                <el-tooltip content="区分大小写" placement="bottom-start" :open-delay=1000>
                  <vxe-checkbox v-model="data.desc.matchCase">Aa</vxe-checkbox>
                </el-tooltip>
                <el-tooltip style="margin-left:13px" content="全词匹配" placement="bottom-start" :open-delay=1000>
                  <vxe-checkbox v-model="data.desc.matchWords">W</vxe-checkbox>
                </el-tooltip>
              </div>
            </template>
          </vxe-form-item>
          <vxe-form-item title="液晶" field="lcd" span="12" :item-render="{}" :visible="visible('lcd')">
            <template v-slot="{ data }">
              <vxe-select v-model="data.lcd" transfer ref="vxSelect">
                <vxe-option :value=1 label="是"/>
                <vxe-option :value=0 label="否"/>
              </vxe-select>
            </template>
          </vxe-form-item>
          <vxe-form-item title="录波" field="record" span="12" :item-render="{}" :visible="visible('record')">
            <template v-slot="{ data }">
              <vxe-select v-model="data.record" transfer ref="vxSelect">
                <vxe-option :value=1 label="是"/>
                <vxe-option :value=0 label="否"/>
              </vxe-select>
            </template>
          </vxe-form-item>
          <vxe-form-item title="通信" field="comm" span="12" :item-render="{}" :visible="visible('comm')">
            <template v-slot="{ data }">
              <vxe-select v-model="data.comm" transfer ref="vxSelect">
                <vxe-option :value=1 label="是"/>
                <vxe-option :value=0 label="否"/>
              </vxe-select>
            </template>
          </vxe-form-item>
          <vxe-form-item title="事件" field="event" span="12" :item-render="{}" :visible="visible('event')">
            <template v-slot="{ data }">
              <vxe-select v-model="data.event" transfer ref="vxSelect">
                <vxe-option :value=-1 label=""/>
                <vxe-option :value=0 label="动作报告"/>
                <vxe-option :value=1 label="自检报告"/>
                <vxe-option :value=2 label="变位报告"/>
                <vxe-option :value=3 label="运行报告"/>
              </vxe-select>
            </template>
          </vxe-form-item>
          <vxe-form-item title="触发方式" field="trigType" span="12" :item-render="{}" :visible="visible('trigType')">
            <template v-slot="{ data }">
              <vxe-select v-model="data.trigType" transfer ref="vxSelect">
                <vxe-option :value=-1 label="---"/>
                <vxe-option :value=1 label="高电平触发"/>
                <vxe-option :value=2 label="低电平触发"/>
                <vxe-option :value=3 label="上升沿触发"/>
                <vxe-option :value=4 label="下降沿触发"/>
                <vxe-option :value=5 label="双边沿触发"/>
              </vxe-select>
            </template>
          </vxe-form-item>
          <vxe-form-item title="属性值" field="attribute" span="12" :item-render="{}" :visible="visible('attribute')">
            <template v-slot="{ data }">
              <vxe-pulldown destroy-on-close ref="attrPullDown" @hide-panel="attrEditDone" transfer>
                <template>
                  <vxe-input class="attributePullDown" v-model="data.attribute" @click="attrEditFocused"
                             readonly></vxe-input>
                </template>
                <template v-slot:dropdown>
                  <vxe-list
                    class="pullDownList"
                    height="100%"
                    :data="attrGroup" auto-resize>
                    <template v-slot="{items}">
                      <div v-for="(item, index) in items" :key="index">
                        <vxe-checkbox v-model="attrGroup[index].checked" :content="item.label"></vxe-checkbox>
                      </div>
                    </template>
                  </vxe-list>
                </template>
              </vxe-pulldown>
            </template>
          </vxe-form-item>
          <vxe-form-item title="显示格式" field="syntax" span="12" :item-render="{}" :visible="visible('syntax')">
            <template v-slot="{ data }">
              <el-autocomplete
                class="inline-input"
                v-model="data.syntax"
                :fetch-suggestions="querySearch"
                placeholder="请输入内容"
              ></el-autocomplete>
            </template>
          </vxe-form-item>
        </vxe-form>
      </el-main>
      <el-footer style="background-color: white">
        <div style="width: 100%; display: flex; justify-content: center;margin-top: 10px">
          <el-button size="small" @click="cancel">取消</el-button>
          <el-button size="small" v-show="!showEditForm" type="primary" @click="next" :disabled="!propsChecked">下一步
          </el-button>
          <el-button size="small" v-show="showEditForm" type="primary" @click="previous">上一步</el-button>
          <el-button size="small" v-show="showEditForm" type="primary" @click="save">确定</el-button>
        </div>
      </el-footer>
    </el-container>
  </vxe-modal>
</template>

<script>
import { YesNoEnum } from '@/model/enum'

export default {
  name: 'batchEditDialog',
  data () {
    return {
      tagKey: '',
      dialogVisible: false,
      showEditForm: false,
      propForm: {
        desc: false,
        lcd: false,
        record: false,
        comm: false,
        event: false,
        trigType: false,
        attribute: false,
        syntax: false
      },
      formData: {
        desc: { searchValue: '', replaceValue: '', matchWords: false, matchCase: false },
        lcd: YesNoEnum.YES,
        record: YesNoEnum.YES,
        comm: YesNoEnum.YES,
        trigType: null,
        attribute: '15',
        syntax: ''
      },
      attrGroup: [
        { label: 'dbb', checked: true },
        { label: 'mmi', checked: true },
        { label: 'reserved1', checked: true },
        { label: 'reserved2', checked: true },
        { label: 'unit', checked: false },
        { label: 'reserved3', checked: false },
        { label: 'reserved4', checked: false },
        { label: 'reboot', checked: false }
      ],
      syntaxSuggestions: [
        { value: '%s' },
        { value: '%d' },
        { value: '%f' },
        { value: '%u' }
      ]
    }
  },
  computed: {
    title () {
      return this.showEditForm ? '批量编辑' : '选择要编辑的属性'
    },
    showTrigType () {
      return !!this.tagKey && /RecordSetTriggerGroup/.test(this.tagKey)
    },
    showEvent () {
      return !!this.tagKey && /BinaryGroup/.test(this.tagKey)
    },
    showDesc () {
      return true
    },
    showLcdRecCom () {
      return !!this.tagKey && /(Binary|Analog)Group/.test(this.tagKey)
    },
    showAttr () {
      return !!this.tagKey && !/ControlGroup|RecordSetFaultGroup/.test(this.tagKey)
    },
    showSyntax () {
      return !!this.tagKey
    },
    propsChecked () {
      return this.propForm.desc || this.propForm.comm || this.propForm.lcd || this.propForm.attribute ||
        this.propForm.record || this.propForm.event || this.propForm.syntax || this.propForm.trigType
    }
  },
  methods: {
    visible (key) {
      return this.propForm[key]
    },
    openDialog (tagKey) {
      this.tagKey = tagKey
      this.dialogVisible = true
    },
    attrEditFocused () {
      if (this.$refs.attrPullDown) {
        if (this.$refs.attrPullDown.isPanelVisible()) {
          this.attrEditDone()
        }
        this.$refs.attrPullDown.togglePanel()
      }
    },
    attrEditDone () {
      let attr = 0
      for (let i = 0; i < 8; i++) {
        if (this.attrGroup[i].checked) {
          attr += 2 ** i
        }
      }
      this.formData.attribute = attr ? attr.toString() : ''
    },
    querySearch (queryString, cb) {
      const results = queryString ? this.syntaxSuggestions.filter(this.createFilter(queryString)) : this.syntaxSuggestions
      // 调用 callback 返回建议列表的数据
      cb(results)
    },
    createFilter (queryString) {
      return (opt) => opt.value.toLowerCase().indexOf(queryString.toLowerCase()) === 0
    },
    beforeCloseHandler () {
      this.showEditForm = false
      this.formData = {
        desc: { searchValue: '', replaceValue: '', matchWords: false, matchCase: false },
        lcd: YesNoEnum.YES,
        record: YesNoEnum.YES,
        comm: YesNoEnum.YES,
        trigType: null,
        attribute: '15',
        syntax: ''
      }
      this.propForm = {
        desc: false,
        lcd: false,
        record: false,
        comm: false,
        event: false,
        trigType: false,
        attribute: false,
        syntax: false
      }
      this.attrGroup = [
        { label: 'dbb', checked: true },
        { label: 'mmi', checked: true },
        { label: 'reserved1', checked: true },
        { label: 'reserved2', checked: true },
        { label: 'unit', checked: false },
        { label: 'reserved3', checked: false },
        { label: 'reserved4', checked: false },
        { label: 'reboot', checked: false }
      ]
    },
    save () {
      const props = Object.keys(this.propForm).filter((key) => this.propForm[key])
      this.$vbus.$emit('BATCH_EDIT_TABLE_DATA', { tagKey: this.tagKey, data: this.formData, props })
      this.dialogVisible = false
    },
    cancel () {
      this.dialogVisible = false
    },
    next () {
      this.showEditForm = true
    },
    previous () {
      this.showEditForm = false
    }
  },
  mounted () {
    this.$vbus.$on('OPEN_BATCH_EDIT_DIALOG', this.openDialog)
  },
  destroyed () {
    this.$vbus.$off('OPEN_BATCH_EDIT_DIALOG', this.openDialog)
  }
}
</script>

<style lang="scss">
.attributePullDown input {
  cursor: pointer;
}

.pullDownList {
  border: 1px solid rgb(228, 231, 237);
  border-radius: 5px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, .1);
  padding: 5px 10px
}

.replaceBar {
  width: 100%;

  .vxe-input {
    width: 45% !important;
  }
}
</style>
