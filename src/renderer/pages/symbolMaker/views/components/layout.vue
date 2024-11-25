<template>
  <div id="window_container" ref="container">
    <toolbar-comp/>
    <split :gutterSize="gutterSize" direction="vertical" style="height: calc(100% - 36px)">
      <split-area :size="100 - messageBoxHeight" ref="rightTopContainer">
        <split :gutterSize="gutterSize" @onDragEnd="onDragEnd">
          <!--导航目录-->
          <split-area :size="catalogWidth" ref="catalog">
            <window-catalog/>
          </split-area>
          <!--工作台-->
          <split-area :size="100 - catalogWidth">
            <div class="workAreaContainer" ref="workAreaContainer">
              <split :gutterSize="gutterSize">
                <split-area :size="100 - sidebarWidth">
                  <scroll-tag/>
                  <div v-if="tagKeyArr.length > 0" style="height: calc(100% - 34px);">
                    <template v-for="tagKey in tagKeyArr">
                      <windowWorkArea v-show="tagKey === activeKey" :key="tagKey" :tag-key="tagKey"/>
                    </template>
                  </div>
                  <div v-else class="noTagsContainer">
                    <se-welcome-component/>
                  </div>
                </split-area>
              </split>
            </div>
          </split-area>
        </split>
      </split-area>
      <split-area id="window_message_box_container" :size="messageBoxHeight" ref="message">
        <message-box/>
      </split-area>
    </split>
    <dialog-container/>
    <se-menu/>
  </div>
</template>
<script>
import * as R from 'ramda'
import ToolbarComp from '@/renderer/pages/symbolMaker/views/components/toolbar.vue'
import windowCatalog from '@/renderer/pages/symbolMaker/views/components/catalog/catalog.vue'
import windowWorkArea from '@/renderer/pages/symbolMaker/views/components/workArea/index.vue'
import MessageBox from '@/renderer/pages/symbolMaker/views/components/messageBox.vue'
import DialogContainer from '@/renderer/pages/symbolMaker/views/components/dialog/dialogContainer.vue'
import SeMenu from '@/renderer/pages/symbolMaker/views/components/menu.vue'
import SeWelcomeComponent from '@/renderer/pages/symbolMaker/views/components/welcomeView.vue'
import ScrollTag from '@/renderer/pages/symbolMaker/views/components/scrollTag/scrollTag.vue'
import { getWorkTagKey } from '@/renderer/common/util'
import VueSplit from 'vue-split-panel'
import { SYMBOL_MAKER_NAME } from '@/util/consts'

const { Split, SplitArea } = VueSplit

export default {
  name: 'SymbolMakerLayout',
  components: {
    ScrollTag,
    SeWelcomeComponent,
    SeMenu,
    ToolbarComp,
    Split,
    SplitArea,
    windowCatalog,
    windowWorkArea,
    MessageBox,
    DialogContainer
  },
  computed: {
    symbolCatalogViewVisible () {
      return this.$store.getters.symbolCatalogViewVisible
    },
    symbolOutputViewVisible () {
      return this.$store.getters.symbolOutputViewVisible
    },
    tagKeyArr () {
      return this.$store.getters.workTagsContainer.map(item => getWorkTagKey(item))
    },
    activeKey () {
      return this.$store.getters.workTagsActiveKey
    }
  },
  watch: {
    symbolCatalogViewVisible () {
      this.changeWindowCatalogViewVisible()
    },
    symbolOutputViewVisible () {
      this.changeWindowOutputViewVisible()
    }
  },
  data () {
    return {
      gutterSize: 8,
      catalogWidth: 14,
      catalogWidthBak: 14,
      messageBoxHeight: 20,
      messageBoxHeightBak: 20,
      sidebarWidth: 0,
      sidebarWidthBak: 40,
      i18n: this.$i18n
    }
  },
  methods: {
    clearGutterSize () {
      this.$nextTick(() => {
        if (!this.symbolCatalogViewVisible) {
          this.$refs.catalog.$el.nextElementSibling.style.width = '0'
        }
        if (!this.symbolOutputViewVisible) {
          this.$refs.message.$el.previousElementSibling.style.height = '0'
        }
      })
    },
    changeWindowCatalogViewVisible () {
      if (this.symbolCatalogViewVisible) {
        this.catalogWidth = this.catalogWidthBak
      } else {
        this.catalogWidthBak = this.catalogWidth
        this.catalogWidth = 0
      }
      this.clearGutterSize()
    },
    changeWindowOutputViewVisible () {
      if (this.symbolOutputViewVisible) {
        this.messageBoxHeight = this.messageBoxHeightBak
      } else {
        this.messageBoxHeightBak = this.messageBoxHeight
        this.messageBoxHeight = 0
      }
      this.clearGutterSize()
      this.$nextTick(() => {
        if (!this.symbolOutputViewVisible) {
          this.$refs.rightTopContainer.$el.style.height = '100%'
        }
      })
    },
    onDragEnd () {
      window.dispatchEvent(new Event('resize'))
    }
  },
  mounted () {
    this.$logger.info(`[${SYMBOL_MAKER_NAME}] 符号编辑器启动`)

    this.changeWindowCatalogViewVisible()
    this.changeWindowOutputViewVisible()

    document.querySelector('.tagsViewWrapper').addEventListener('mousedown', (evt) => {
      if (R.equals(1, evt.button)) {
        evt.preventDefault()
      }
    })
  }
}
</script>

<style lang="scss" scoped>
#window_container {
  height: 100%;
  width: 100%;

  #window_message_box_container {
    overflow: hidden;
  }
}

.workAreaContainer {
  z-index: 1;
  position: relative;
  height: 100%;

  .noTagsContainer {
    width: 100%;
    height: 100%;
    background: #ffffff;
  }

}
</style>
