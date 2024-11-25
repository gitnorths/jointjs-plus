<template>
  <div id="basicInfoEditTableContainer">
    <el-form
      :model="basicInfo"
      label-position="left"
      label-width="100px"
      size="small">
      <el-form-item label="功能块名">
        <el-col :span="11">
          <el-input v-model="basicInfo.name" readonly/>
        </el-col>
        <el-col v-if="!isVB" :span="5" :offset="1">
          <el-switch v-model="basicInfo.status"
                     style="padding-bottom: 6px"
                     active-text="投入"
                     :active-value="enableStatus.ON"
                     inactive-text="退出"
                     :inactive-value="enableStatus.OFF"
                     @change="editDone('status')"
                     :disabled="!pageEnabled"/>
        </el-col>
      </el-form-item>
      <el-form-item label="短地址" v-if="debugMode && isVB">
        <el-col :span="11">
          <el-input v-model="na" readonly/>
        </el-col>
        <el-col :span="5" :offset="1">
          <el-button @click="addToWatch" type="primary" icon="fa fa-binoculars" plain :disabled="!na" round>加入监控
          </el-button>
        </el-col>
      </el-form-item>
      <el-form-item label="实例名">
        <el-col :span="11">
          <el-input v-model="basicInfo.instName" @change="editDone('instName')" clearable :disabled="basicInfo.static"
                    :readonly="debugMode"/>
        </el-col>
        <el-col :span="5" :offset="1">
          <el-switch v-if="!isVB" v-model="basicInfo.showInstName"
                     style="padding-bottom: 6px"
                     active-text="显示"
                     inactive-text="隐藏"
                     @change="editDone('showInstName')" :disabled="debugMode"/>
        </el-col>
      </el-form-item>
      <el-form-item label="描述">
        <el-col :span="11">
          <el-input v-if="!isVB" v-model="basicInfo.orgDesc" readonly/>
          <el-input v-else v-model="basicInfo.desc" clearable @change="editDone('desc')" :readonly="debugMode"/>
        </el-col>
      </el-form-item>
      <el-form-item label="自定任务等级" v-if="!isVB">
        <el-col :span="6">
          <el-select v-model="basicInfo.customLevel" @change="customLevelChanged(basicInfo)"
                     :disabled="debugMode || basicInfo.level !== 5 || isStatic" style="width: 100%" clearable>
            <el-option v-for="item in levelList" :key="item.value"
                       :label="item.label" :value="item.value"></el-option>
          </el-select>
        </el-col>
        <el-col :span="17" :offset="1">
          <span style="padding-right: 12px">当前任务等级</span>
          <el-tag :type="tagType(basicInfo)" effect="dark">
            {{ levelType(basicInfo) }}
          </el-tag>
        </el-col>
      </el-form-item>
      <el-form-item label="自定义类型" v-if="!isVB && !isStatic">
        <el-col :span="6">
          <el-select v-model="basicInfo.customTypeOption" placeholder="请选择一个模板"
                     @change="editDone('customTypeOption')" style="width: 100%" clearable :disabled="debugMode">
            <el-option v-for="item in customTypeOptList(basicInfo)" :key="item.value"
                       :label="item.label" :value="item.value">
              <el-popover
                placement="left-start"
                width="300"
                :open-delay="0"
                :close-delay="0"
                trigger="hover">
                <div class="customTypeDialogPopover">
                  <div v-for="key in Object.keys(item.customType)" :key="key" class="item">
                    <div style="width: 45%;display: inline-block">{{ key }}</div>
                    <div style="width: 55%;display: inline-block">{{ varType[item.customType[key]] }}
                    </div>
                  </div>
                </div>
                <template v-slot:reference>
                  <div style="display: inline-block;width: 100%">{{ item.label }}</div>
                </template>
              </el-popover>
            </el-option>
          </el-select>
        </el-col>
      </el-form-item>
      <el-form-item :label="tag.key" v-for="tag in argTags" :key="tag.key" v-show="!isVB && !isStatic">
        <el-col :span="6">
          <el-input v-model="tag.value" @change="editDone(tag.key)" clearable :readonly="debugMode"/>
        </el-col>
      </el-form-item>
      <el-form-item label="args" v-if="!isVB && !isStatic">
        <el-col :span="6">
          <el-input v-model="arg" @change="editDone('args')" clearable :readonly="debugMode"/>
        </el-col>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import { EnableStatusEnum, SymbolTypeEnum, TaskLevelEnum, VariableTypeEnum } from '@/model/enum'

export default {
  name: 'basicInfoEditTable',
  props: {
    pageGraph: {
      required: true
    }
  },
  computed: {
    debugMode () {
      return this.$store.getters.debugMode
    },
    basicInfo () {
      return this.$store.getters.vfbInst
    },
    isVB () {
      return this.basicInfo.type === SymbolTypeEnum.SYM_EXTEND // FIXME
    },
    isStatic () {
      return this.basicInfo.static
    },
    varType () {
      return VariableTypeEnum
    },
    enableStatus () {
      return EnableStatusEnum
    },
    pageEnabled () {
      return !this.debugMode && this.pageGraph && this.pageGraph.status === EnableStatusEnum.ON
    }
  },
  watch: {
    basicInfo () {
      this.init()
    }
  },
  data () {
    return {
      backUpData: {},
      levelList: [
        { value: TaskLevelEnum.Level1, label: 'Level1' },
        { value: TaskLevelEnum.Level2, label: 'Level2' },
        { value: TaskLevelEnum.Level3, label: 'Level3' },
        { value: TaskLevelEnum.Level4, label: 'Level4' },
        { value: TaskLevelEnum.LevelAny, label: 'LevelAny' }
      ],
      argTags: [],
      arg: '',
      na: ''
    }
  },
  methods: {
    calcLevel (obj) {
      if (obj.level !== TaskLevelEnum.LevelAny) {
        return obj.level
      } else if (obj.customLevel && obj.customLevel !== TaskLevelEnum.LevelAny) {
        return obj.customLevel
      }
      return this.pageGraph ? this.pageGraph.level : TaskLevelEnum.LevelAny
    },
    levelType (obj) {
      const trueLevel = this.calcLevel(obj)
      return TaskLevelEnum[trueLevel]
    },
    tagType (obj) {
      const trueLevel = this.calcLevel(obj)
      // todo
      switch (trueLevel) {
        case TaskLevelEnum.Level1:
          return 'danger'
        case TaskLevelEnum.Level2:
          return 'warning'
        case TaskLevelEnum.Level3:
          return 'primary'
        case TaskLevelEnum.Level4:
          return 'success'
        case TaskLevelEnum.LevelAny:
          return 'info'
      }
    },
    customTypeOptList (row) {
      if (row && row.customTypeOptList && R.isNotEmpty(row.customTypeOptList)) {
        return row.customTypeOptList.map(item => ({
          label: item.name,
          value: item.name,
          customType: item.customType
        }))
      }
      return []
    },
    init () {
      this.clear()
      this.backUpData = { ...this.basicInfo }
      if (this.basicInfo.args && this.basicInfo.args.trim()) {
        // 功能块参数根据空格拆解
        // 包含=的参数拆解为键值对形式，否则当作自定义参数
        this.basicInfo.args.trim().split(' ').forEach(arg => {
          if (/=/.test(arg)) {
            const argArr = arg.split('=')
            const key = argArr[0]
            // 值要做转义处理
            const value = argArr[1].replace(/\\x20/g, ' ').replace(/\\x3D/g, '=')
            this.argTags.push({ key, value })
          } else {
            this.arg = arg.replace(/\\x20/g, ' ').replace(/\\x3D/g, '=')
          }
        })
      }
      if (this.debugMode && this.isVB && this.basicInfo.instName) {
        if (/platform\/common\/common_io\/(LIN|LOUT)$/i.test(this.basicInfo.pathId)) {
          this.na = this.basicInfo.na
        } else if (/platform\/common\/common_io\/IN$/i.test(this.basicInfo.pathId)) {
          this.na = this.basicInfo.instName
        }
      }
    },
    addToWatch (row) {
      // FIXME 中文校验
      // if (/B(0[1-9]|[1-9][0-9])(\[([1-9]|[1-9][0-9])+:([1-9]|[1-9][0-9])+])?\.\w+\.\w+/.test(this.na)) {
      this.$store.commit('addToWatchedSignals', { na: this.na, annotation: row.desc || '' })
      // } else {
      //   this.$notification.openWarningNotification(`添加失败，${this.na} 不是有效的短地址`).logger();
      // }
    },
    clear () {
      this.argTags = []
      this.arg = ''
      this.na = ''
    },
    customLevelChanged (obj) {
      const trueLevel = obj.customLevel && obj.customLevel !== TaskLevelEnum.LevelAny
        ? obj.customLevel
        : this.pageGraph.level
      this.$vbus.$emit('VFB_CUSTOM_LEVEL_CHANGED', trueLevel)
      this.editDone('customLevel')
    },
    editDone (property) {
      // arg赋初始值，然后再计算真实值
      let argStr = ''
      if (this.argTags && R.isNotEmpty(this.argTags)) {
        const argTagArr = this.argTags.map(tag => {
          const value = tag.value.trim().replace(/ /g, '\\x20').replace(/=/g, '\\x3D')
          return `${tag.key}=${value}`
        })
        argStr = argTagArr.join(' ')
      }
      if (this.arg && this.arg.trim()) {
        const customArgStr = this.arg.trim().replace(/ /g, '\\x20').replace(/=/g, '\\x3D')
        if (argStr) {
          argStr += ` ${customArgStr}`
        } else {
          argStr = customArgStr
        }
      }
      this.basicInfo.args = argStr
      const diff = objDiff().diff(this.backUpData, this.basicInfo)
      if (!diff) {
        this.$store.commit('recordVfbDelta', { key: 'basicInfo', delta: null })
        return
      }
      if (/customType/.test(property)) {
        this.$vbus.$emit('VFB_CUSTOM_TYPE_CHANGED', this.basicInfo)
      }
      this.$store.commit('recordVfbDelta', {
        key: 'basicInfo',
        delta: [this.basicInfo]
      })
    }
  },
  beforeDestroy () {
    this.clear()
  },
  mounted () {
    this.init()
  }
}
</script>

<style scoped>
#basicInfoEditTableContainer {
  height: 100%;
  width: 100%;
  overflow: auto;
  padding: 10px 0 0 30px;
}
</style>
<style lang="scss">
.customTypeDialogPopover {
  .item {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    border-bottom: 1px solid lightgray;
  }
}
</style>
