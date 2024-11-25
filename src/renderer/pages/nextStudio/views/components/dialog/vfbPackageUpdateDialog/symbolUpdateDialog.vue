<template>
  <vxe-modal v-model="visible"
             :title="title"
             class="symbolUpdateDialog"
             width="800"
             height="600"
             min-width="600"
             min-height="380"
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
      <step0-file-select v-if="this.currentStep === 0" @next="next"/>
      <step1-package-compare v-if="this.currentStep === 1" @previous="previous" @next="next" ref="pkgCompare"/>
      <step2-bind-preview v-if="this.currentStep === 2" @previous="previous" @next="next"/>
      <step3-update-preview v-if="this.currentStep === 3" @previous="previous" @confirm="confirm"/>
    </div>
  </vxe-modal>
</template>

<script>
import Step0FileSelect from './step0FileSelect.vue'
import Step1PackageCompare from './step1PackageCompare.vue'
import Step2BindPreview from './step2BindPreview.vue'
import Step3UpdatePreview from './step3UpdatePreview.vue'

export default {
  name: 'symbolUpdateDialog',
  components: { Step3UpdatePreview, Step2BindPreview, Step1PackageCompare, Step0FileSelect },
  data () {
    return {
      visible: false,
      currentStep: 0
    }
  },
  computed: {
    title () {
      switch (this.currentStep) {
        case 0:
          return '功能块包管理：选择文件'
        case 1:
          return '功能块包管理：对比绑定'
        case 2:
          return '功能块包管理：映射预览'
        case 3:
          return '功能块包管理：升级预览'
        default:
          return '功能块包管理'
      }
    },
    pkgComparedResult () {
      return this.$store.getters.pkgComparedResult
    }
  },
  methods: {
    open () {
      this.visible = true
      this.$store.commit('clearBindRecords')
      this.$store.commit('setPkgCompareResult', null)
    },
    async beforeCloseHandler () {
      if (!this.pkgComparedResult) {
        return
      }
      try {
        await this.$confirm('所有未应用的修改都将丢失，是否放弃升级?', '警告', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
          center: true
        })
        this.clear()
      } catch (e) {
        return new Error(e)
      }
    },
    clear () {
      this.$store.commit('setPkgCompareResult', null)
      this.currentStep = 0
    },
    next () {
      this.currentStep++
    },
    previous () {
      this.currentStep--
    },
    confirm () {
      this.clear()
      this.$refs.modal.close()
    }
  },
  mounted () {
    this.$vbus.$on('OPEN_PACKAGE_UPDATE_DIALOG', this.open)

    this.resizeObserver = new ResizeObserver(() => {
      if (this.$refs.pkgCompare) {
        this.$refs.pkgCompare.repaint()()
      }
    })
    this.resizeObserver.observe(document.querySelector('.vxe-modal--box'))
  },
  beforeDestroy () {
    this.$vbus.$off('OPEN_PACKAGE_UPDATE_DIALOG', this.open)
    this.resizeObserver.disconnect()
    this.resizeObserver = null
  }
}
</script>

<style scoped>
.mainWindow {
  width: 100%;
  height: 100%;
}
</style>
<style lang="scss">
.symbolUpdateDialog {
  .vxe-modal--box .vxe-modal--body .vxe-modal--content {
    padding: 0;
    overflow: hidden;
  }
}
</style>
