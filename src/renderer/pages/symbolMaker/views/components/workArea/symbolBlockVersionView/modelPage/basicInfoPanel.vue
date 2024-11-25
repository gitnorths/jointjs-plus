<template>
  <div style="height: 100%;padding-right: 20px">
    <vxe-form
      title-align="right"
      title-width="80"
      :data="formData">
      <vxe-form-item title="名称" field="name" span="12"
                     :title-suffix="{content:'重命名功能块：请从左侧导航菜单的右键菜单中重命名'}">
        <template v-slot="{ data }">
          <vxe-input v-model="data.name" readonly/>
        </template>
      </vxe-form-item>
      <vxe-form-item title="版本" field="desc" span="12">
        <template v-slot="{ data }">
          <vxe-input v-model="data.version" @change="editDone" :disabled="editFlag"/>
        </template>
      </vxe-form-item>
      <vxe-form-item title="描述" field="desc" span="24">
        <template v-slot="{ data }">
          <vxe-input v-model="data.desc" @change="editDone" :disabled="editFlag"/>
        </template>
      </vxe-form-item>
      <vxe-form-item title="帮助" field="help" span="24">
        <template v-slot="{ data }">
          <vxe-textarea v-model="data.help" @change="editDone"
                        :autosize="{ minRows: 5, maxRows: 10 }"/>
        </template>
      </vxe-form-item>
    </vxe-form>
  </div>
</template>

<script>
import editMixins from './editMixins'
import { objDiff } from '@/renderer/common/util'
import { SymbolBlockConstants } from '@/renderer/pages/symbolMaker/views/components/workArea/workAreaConfig'

export default {
  name: 'basicInfoPanel',
  mixins: [editMixins],
  props: [],
  data () {
    return {
      tagProp: SymbolBlockConstants.basicInfo,
      argTags: [],
      formData: {
        name: '',
        desc: '',
        version: '',
        help: ''
      }
    }
  },
  computed: {},
  methods: {
    init () {
      this.formData.name = this.currentBlock.name
      this.formData.desc = this.currentBlock.desc
      this.formData.version = this.currentBlock.version
      this.formData.help = this.currentBlock.help
    },
    editDone () {
      const diff = objDiff({
        propertyFilter: (name) => /^(name|desc|help|version)$/.test(name)
      }).diff(this.currentBlock, this.formData)
      if (!diff) {
        this.$store.commit('updateSEDelta', {
          key: this.tagKey,
          propName: SymbolBlockConstants.basicInfo,
          value: null
        })
        return
      }
      this.$store.commit('updateSEDelta', {
        key: this.tagKey,
        propName: SymbolBlockConstants.basicInfo,
        value: { ...this.formData }
      })
    }
  },
  mounted () {
    this.init()
  }
}
</script>

<style scoped>

</style>
