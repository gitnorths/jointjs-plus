<template>
  <vxe-modal v-model="dialogVisible"
             :title="title"
             :width="width"
             :height="height"
             esc-closable
             show-close
             destroy-on-close
             resize
             remember
             :before-hide-method="beforeCloseHandler"
             transfer
             class-name="batchEditDialog"
             ref="modal">
    <el-container style="height: 100%">
      <el-main style="height: 100%; padding: 0">
        <div v-show="!showEditForm" style="width: 100%">
          <el-row style="margin-bottom: 10px">
            <el-col :span="8">
              <vxe-checkbox label="desc" content="描述" v-model="propForm.desc"/>
            </el-col>
            <el-col :span="8">
              <vxe-checkbox label="type" content="变量类型" v-model="propForm.type"/>
            </el-col>
            <el-col :span="8">
              <vxe-checkbox label="isDummy" :content="dummyTitle" v-model="propForm.isDummy"/>
            </el-col>
          </el-row>
          <el-row style="margin-bottom: 10px" v-if="showIO">
            <el-col :span="8">
              <vxe-checkbox label="level" content="任务等级" v-model="propForm.level"/>
            </el-col>
            <el-col :span="8">
              <vxe-checkbox label="displayMode" content="端口显示模式" v-model="propForm.displayMode"/>
            </el-col>
          </el-row>
          <el-row style="margin-bottom: 10px" v-if="showParam">
            <el-col :span="8">
              <vxe-checkbox label="min" content="最小值" v-model="propForm.min"/>
            </el-col>
            <el-col :span="8">
              <vxe-checkbox label="max" content="最大值" v-model="propForm.max"/>
            </el-col>
            <el-col :span="8">
              <vxe-checkbox label="valueList" content="值列表" v-model="propForm.valueList"/>
            </el-col>
          </el-row>
          <el-row style="margin-bottom: 10px" v-if="showParam">
            <el-col :span="8">
              <vxe-checkbox label="optional" content="可选参数" v-model="propForm.optional"/>
            </el-col>
            <el-col :span="8">
              <vxe-checkbox label="value" content="默认值" v-model="propForm.value"/>
            </el-col>
            <el-col :span="8">
              <vxe-checkbox label="unit" content="单位" v-model="propForm.unit"/>
            </el-col>
          </el-row>
          <el-row style="margin-bottom: 10px" v-if="showParam">
            <el-col :span="8">
              <vxe-checkbox label="prm" content="原始值" v-model="propForm.prm"/>
            </el-col>
            <el-col :span="8">
              <vxe-checkbox label="norm" content="额定值" v-model="propForm.norm"/>
            </el-col>
            <!-- el-col :span="8">
              <vxe-checkbox label="paramDisplayMode" content="显示模式" v-model="propForm.paramDisplayMode"/>
            </el-col -->
          </el-row>

        </div>
        <vxe-form v-show="showEditForm" :data="formData" title-align="right" title-width="74" :title-colon=true>
          <vxe-form-item title="描述" field="desc" span="24" :visible="visible('desc')">
            <template v-slot="{ data }">
              <div class="replaceBar">
                <el-row>
                  查找替换
                </el-row>
                <el-row>
                  <div class="inputGrp">
                    <vxe-input v-model="data.desc.searchValue" size="mini" placeholder="查找的值"
                               suffix-icon="fa fa-search"
                               clearable/>
                    <div style="display: inline-block; width: 6%; text-align: center">
                      <i class="fa fa-long-arrow-right"></i>
                    </div>
                    <vxe-input v-model="data.desc.replaceValue" size="mini" placeholder="替换的值"
                               suffix-icon="fa fa-repeat"
                               clearable/>
                  </div>
                  <div class="buttonGrp">
                    <el-tooltip content="区分大小写" placement="bottom-start" :open-delay=1000>
                      <vxe-checkbox v-model="data.desc.matchCase">Aa</vxe-checkbox>
                    </el-tooltip>
                    <el-tooltip content="全词匹配" placement="bottom-start" :open-delay=1000>
                      <vxe-checkbox v-model="data.desc.matchWords">W</vxe-checkbox>
                    </el-tooltip>
                  </div>
                </el-row>
              </div>
              <div class="prefixSuffix">
                <el-row>
                  <el-col :span="8">前缀</el-col>
                  <el-col :span="4">自动编号</el-col>
                  <el-col :span="4" v-if="data.desc.prefix.seq.enable">初始值</el-col>
                  <el-col :span="4" v-if="data.desc.prefix.seq.enable">步进值</el-col>
                  <el-col :span="4" v-if="data.desc.prefix.seq.enable">位置</el-col>
                </el-row>
                <el-row>
                  <el-col :span="8">
                    <vxe-input size="mini" v-model="data.desc.prefix.value" clearable/>
                  </el-col>
                  <el-col :span="3">
                    <vxe-checkbox v-model="data.desc.prefix.seq.enable" style="margin-left: 10px"/>
                  </el-col>
                  <el-col :span="4" v-if="data.desc.prefix.seq.enable">
                    <vxe-input size="mini" type="integer" min="0" v-model="data.desc.prefix.seq.start"/>
                  </el-col>
                  <el-col :span="4" v-if="data.desc.prefix.seq.enable">
                    <vxe-input size="mini" type="integer" min="1" v-model="data.desc.prefix.seq.step"/>
                  </el-col>
                  <el-col :span="5" v-if="data.desc.prefix.seq.enable">
                    <vxe-switch v-model="data.desc.prefix.seq.position" open-label="前缀之前" close-label="前缀之后"/>
                  </el-col>
                </el-row>
              </div>
              <div class="prefixSuffix">
                <el-row>
                  <el-col :span="8">后缀</el-col>
                  <el-col :span="4">自动编号</el-col>
                  <el-col :span="4" v-if="data.desc.suffix.seq.enable">初始值</el-col>
                  <el-col :span="4" v-if="data.desc.suffix.seq.enable">步进值</el-col>
                  <el-col :span="4" v-if="data.desc.suffix.seq.enable">位置</el-col>
                </el-row>
                <el-row>
                  <el-col :span="8">
                    <vxe-input size="mini" v-model="data.desc.suffix.value" clearable/>
                  </el-col>
                  <el-col :span="3">
                    <vxe-checkbox v-model="data.desc.suffix.seq.enable" style="margin-left: 10px"/>
                  </el-col>
                  <el-col :span="4" v-if="data.desc.suffix.seq.enable">
                    <vxe-input size="mini" type="integer" min="0" v-model="data.desc.suffix.seq.start"/>
                  </el-col>
                  <el-col :span="4" v-if="data.desc.suffix.seq.enable">
                    <vxe-input size="mini" type="integer" min="1" v-model="data.desc.suffix.seq.step"/>
                  </el-col>
                  <el-col :span="5" v-if="data.desc.suffix.seq.enable">
                    <vxe-switch v-model="data.desc.suffix.seq.position" open-label="后缀之前" close-label="后缀之后"/>
                  </el-col>
                </el-row>
              </div>
            </template>
          </vxe-form-item>
          <vxe-form-item title="变量类型" field="type" span="24" :visible="visible('type')">
            <template v-slot="{ data }">
              <vxe-select v-model="data.type" transfer :options="typeOptions"/>
            </template>
          </vxe-form-item>
          <vxe-form-item :title="dummyTitle" field="isDummy" span="24" :visible="visible('isDummy')">
            <template v-slot="{ data }">
              <vxe-switch v-model="data.isDummy" open-label="是" close-label="否"/>
            </template>
          </vxe-form-item>
          <vxe-form-item title="任务等级" field="level" span="24" :visible="visible('level')">
            <template v-slot="{ data }">
              <vxe-select v-model="data.level" transfer :options="levelOptions"/>
            </template>
          </vxe-form-item>
          <vxe-form-item title="端口显示模式" field="displayMode" span="24" :visible="visible('displayMode')">
            <template v-slot="{ data }">
              <vxe-select v-model="data.displayMode" transfer :options="displayModeOptions"/>
            </template>
          </vxe-form-item>
          <!-- vxe-form-item title="显示模式" field="displayMode" span="24" :visible="visible('paramDisplayMode')">
            <template v-slot="{ data }">
              <vxe-select v-model="data.paramDisplayMode" transfer :options="paramDisplayModeOptions"/>
            </template>
          </vxe-form-item -->
          <vxe-form-item title="可选参数" field="optional" span="24" :visible="visible('optional')">
            <template v-slot="{ data }">
              <vxe-switch v-model="data.optional" open-label="是" close-label="否"/>
            </template>
          </vxe-form-item>
          <vxe-form-item title="默认值" field="value" span="24" :item-render="{name:'$input'}"
                         :visible="visible('value')"/>
          <vxe-form-item title="最小值" field="min" span="24" :item-render="{name:'$input'}" :visible="visible('min')"/>
          <vxe-form-item title="最大值" field="max" span="24" :item-render="{name:'$input'}" :visible="visible('max')"/>
          <vxe-form-item title="值列表" field="valueList" span="24" :item-render="{name:'$input'}"
                         :visible="visible('valueList')"/>
          <vxe-form-item title="原始值" field="prm" span="24" :item-render="{name:'$input'}"
                         :visible="visible('prm')"/>
          <vxe-form-item title="额定值" field="norm" span="24" :item-render="{name:'$input'}"
                         :visible="visible('norm')"/>
          <vxe-form-item title="单位" field="unit" span="24" :item-render="{name:'$input'}"
                         :visible="visible('unit')"/>
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
import { SymbolBlockConstants } from '@/renderer/pages/symbolMaker/views/components/workArea/workAreaConfig'
import { VariableTypeEnum } from '@/model/enum'

export default {
  name: 'batchEditDialog',
  data () {
    return {
      width: 450,
      height: 300,
      showEditForm: false,
      editProps: [],
      propForm: {
        desc: false,
        optional: false,
        isDummy: false,
        level: false,
        displayMode: false,
        paramDisplayMode: false,
        type: false,
        min: false,
        max: false,
        valueList: false,
        value: false,
        prm: false,
        norm: false,
        unit: false
      },
      formData: {
        desc: {
          searchValue: '',
          replaceValue: '',
          matchWords: false,
          matchCase: false,
          prefix: {
            seq: {
              enable: false,
              start: 1,
              step: 1,
              position: false
            },
            value: ''
          },
          suffix: {
            seq: {
              enable: false,
              start: 1,
              step: 1,
              position: false
            },
            value: ''
          }
        },
        optional: true,
        isDummy: false,
        level: null,
        displayMode: 0,
        paramDisplayMode: 0,
        type: null,
        min: '',
        max: '',
        valueList: '',
        value: '',
        prm: '',
        norm: '',
        unit: ''
      },
      levelOptions: [
        {
          label: 'Level1',
          value: 1
        }
      ],
      displayModeOptions: [
        {
          label: '连接点+变量名',
          value: 0
        },
        {
          label: '仅连接点',
          value: 1
        },
        {
          label: '不显示',
          value: 2
        }
      ],
      paramDisplayModeOptions: [
        {
          label: '显示',
          value: 0
        },
        {
          label: '不显示',
          value: 2
        }
      ]
    }
  },
  computed: {
    dialogVisible: {
      get () {
        return this.$store.getters.batchEditVisible
      },
      set (value) {
        if (!value) {
          this.$store.commit('closeBatchEditDialog')
        }
      }
    },
    batchEditPayload () {
      return this.$store.getters.batchEditPayload
    },
    title () {
      return this.showEditForm ? '批量编辑' : '选择要编辑的属性'
    },
    dummyTitle () {
      if (this.batchEditPayload && this.batchEditPayload.propName) {
        if (this.batchEditPayload.propName === SymbolBlockConstants.inputs) {
          return '虚拟输入'
        }
        if (this.batchEditPayload.propName === SymbolBlockConstants.outputs) {
          return '虚拟输出'
        }
        if (this.batchEditPayload.propName === SymbolBlockConstants.params) {
          return '虚拟参数'
        }
      }
      return ''
    },
    typeOptions () {
      return [
        { label: VariableTypeEnum[VariableTypeEnum.ANY], value: VariableTypeEnum.ANY },
        { label: VariableTypeEnum[VariableTypeEnum.BOOL], value: VariableTypeEnum.BOOL },
        { label: VariableTypeEnum[VariableTypeEnum.INT8], value: VariableTypeEnum.INT8 },
        { label: VariableTypeEnum[VariableTypeEnum.UINT8], value: VariableTypeEnum.UINT8 },
        { label: VariableTypeEnum[VariableTypeEnum.INT16], value: VariableTypeEnum.INT16 },
        { label: VariableTypeEnum[VariableTypeEnum.UINT16], value: VariableTypeEnum.UINT16 },
        { label: VariableTypeEnum[VariableTypeEnum.INT32], value: VariableTypeEnum.INT32 },
        { label: VariableTypeEnum[VariableTypeEnum.UINT32], value: VariableTypeEnum.UINT32 },
        { label: VariableTypeEnum[VariableTypeEnum.INT64], value: VariableTypeEnum.INT64 },
        { label: VariableTypeEnum[VariableTypeEnum.UINT64], value: VariableTypeEnum.UINT64 },
        { label: VariableTypeEnum[VariableTypeEnum.FLOAT32], value: VariableTypeEnum.FLOAT32 },
        { label: VariableTypeEnum[VariableTypeEnum.FLOAT64], value: VariableTypeEnum.FLOAT64 },
        { label: VariableTypeEnum[VariableTypeEnum.SOE_BOOL], value: VariableTypeEnum.SOE_BOOL },
        { label: VariableTypeEnum[VariableTypeEnum.SOE_DBPOS], value: VariableTypeEnum.SOE_DBPOS },
        { label: VariableTypeEnum[VariableTypeEnum.SOE_FLOAT], value: VariableTypeEnum.SOE_FLOAT },
        { label: VariableTypeEnum[VariableTypeEnum.CPLXF32], value: VariableTypeEnum.CPLXF32 },
        { label: VariableTypeEnum[VariableTypeEnum.STRING], value: VariableTypeEnum.STRING },
        { label: VariableTypeEnum[VariableTypeEnum.STRUCT], value: VariableTypeEnum.STRUCT },
        { label: VariableTypeEnum[VariableTypeEnum.POINTER], value: VariableTypeEnum.POINTER }
      ]
    },
    showIO () {
      return this.batchEditPayload && (this.batchEditPayload.propName === SymbolBlockConstants.inputs ||
        this.batchEditPayload.propName === SymbolBlockConstants.outputs)
    },
    showParam () {
      return this.batchEditPayload && (this.batchEditPayload.propName === SymbolBlockConstants.params)
    },
    propsChecked () {
      return this.propForm.desc || this.propForm.optional || this.propForm.isDummy || this.propForm.level ||
        this.propForm.displayMode || this.propForm.type || this.propForm.min || this.propForm.max ||
        this.propForm.valueList || this.propForm.value || this.propForm.prm || this.propForm.norm ||
        this.propForm.unit // || this.propForm.paramDisplayMode;
    }
  },
  methods: {
    visible (key) {
      return this.propForm[key]
    },
    beforeCloseHandler () {
      this.showEditForm = false
      this.width = 450
      this.height = 300
      this.propForm = {
        desc: false,
        optional: false,
        isDummy: false,
        level: false,
        displayMode: false,
        type: false,
        min: false,
        max: false,
        valueList: false,
        value: false,
        prm: false,
        norm: false,
        unit: false
      }
      this.formData = {
        desc: {
          searchValue: '',
          replaceValue: '',
          matchWords: false,
          matchCase: false,
          prefix: {
            seq: {
              enable: false,
              start: 1,
              step: 1,
              position: false
            },
            value: ''
          },
          suffix: {
            seq: {
              enable: false,
              start: 1,
              step: 1,
              position: false
            },
            value: ''
          }
        },
        optional: true,
        isDummy: false,
        level: null,
        displayMode: 0,
        paramDisplayMode: 0,
        type: null,
        min: '',
        max: '',
        valueList: '',
        value: '',
        prm: '',
        norm: '',
        unit: ''
      }
    },
    save () {
      const props = Object.keys(this.propForm).filter((key) => this.propForm[key])
      this.$vbus.$emit('BATCH_EDIT_SE_DATA', {
        tagKey: this.batchEditPayload.tagKey,
        propName: this.batchEditPayload.propName,
        data: this.formData,
        props
      })
      this.dialogVisible = false
    },
    cancel () {
      this.dialogVisible = false
    },
    next () {
      this.showEditForm = true
      this.width = 600
      this.height = 500
    },
    previous () {
      this.showEditForm = false
      this.width = 450
      this.height = 300
    }
  }
}
</script>

<style lang="scss">
.batchEditDialog {
  .vxe-input {
    width: 50% !important;
  }

  .replaceBar {
    width: 100%;

    .inputGrp {
      display: inline-block;
      width: calc(100% - 90px);

      .vxe-input {
        width: 45% !important;
      }
    }

    .buttonGrp {
      display: inline-block;
      width: 90px;
      height: 28px;
      line-height: 28px;
    }
  }

  .prefixSuffix {
    .vxe-switch {
      padding: 2px;
    }

    .vxe-input {
      width: 100% !important;
    }
  }
}
</style>
