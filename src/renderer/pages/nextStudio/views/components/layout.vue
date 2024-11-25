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
                    <welcome-view/>
                  </div>
                </split-area>
                <split-area :size="sidebarWidth" ref="sidebar" v-show="showRightSide">
                  <right-side-bar/>
                </split-area>
              </split>
            </div>
          </split-area>
        </split>
      </split-area>
      <split-area id="window_message_box_container" :size="messageBoxHeight" ref="message">
        <!--控制台-->
        <message-box/>
      </split-area>
    </split>
    <dialog-container/>
    <window-menu/>
  </div>
</template>

<script>
import * as R from 'ramda'
import ToolbarComp from './toolbar.vue'
import windowCatalog from './catalog/catalog.vue'
import windowWorkArea from './workArea/index.vue'
import RightSideBar from './rightSideBar/index.vue'
import MessageBox from './messageBox.vue'
import DialogContainer from './dialog/index.vue'
import WindowMenu from './menu.vue'
import WelcomeView from './welcomeView.vue'
import ScrollTag from './scrollTag/scrollTag.vue'
import { getTagKey } from '@/renderer/common/util'
import VueSplit from 'vue-split-panel'
import {
  ControlGroup,
  CustomGroup,
  EventInfoGroup,
  Page,
  RecordGroup,
  ReportGroup,
  SettingGroup,
  StateGroup,
  WaveGroup
} from '@/model/dto'
import { IED_TOOL_NAME } from '@/util/consts'

const { Split, SplitArea } = VueSplit

export default {
  name: 'StudioLayout',
  components: {
    ScrollTag,
    WelcomeView,
    WindowMenu,
    ToolbarComp,
    Split,
    SplitArea,
    windowCatalog,
    windowWorkArea,
    MessageBox,
    RightSideBar,
    DialogContainer
  },
  computed: {
    debugMode () {
      return this.$store.getters.debugMode
    },
    windowCatalogViewVisible () {
      return this.$store.getters.windowCatalogViewVisible
    },
    windowOutputViewVisible () {
      return this.$store.getters.windowOutputViewVisible
    },
    windowVariableViewVisible () {
      return this.$store.getters.windowVariableViewVisible
    },
    tagKeyArr () {
      return this.$store.getters.dataContainer.map(item => getTagKey(item))
    },
    activeKey () {
      return this.$store.getters.activeKey
    },
    activeDto () {
      return this.$store.getters.activeDto
    },
    showRightSide () {
      if (!this.windowVariableViewVisible) {
        // 视图开关
        return false
      }
      if (this.debugMode) {
        // 调试模式，禁用右边变量库
        return false
      }
      // FIXME LDevice
      return this.activeDto instanceof Page ||
        this.activeDto instanceof SettingGroup ||
        this.activeDto instanceof StateGroup ||
        this.activeDto instanceof ControlGroup ||
        this.activeDto instanceof RecordGroup ||
        this.activeDto instanceof ReportGroup ||
        this.activeDto instanceof EventInfoGroup ||
        this.activeDto instanceof CustomGroup ||
        this.activeDto instanceof WaveGroup
    }
  },
  watch: {
    windowCatalogViewVisible () {
      this.changeWindowCatalogViewVisible()
    },
    windowOutputViewVisible () {
      this.changeWindowOutputViewVisible()
    },
    showRightSide () {
      this.windowVariableViewVisibleHandler()
    }
  },
  data () {
    return {
      gutterSize: 8,
      catalogWidth: 18,
      catalogWidthBak: 18,
      messageBoxHeight: 20,
      messageBoxHeightBak: 20,
      sidebarWidth: 22,
      sidebarWidthBak: 22,
      i18n: this.$i18n
    }
  },
  methods: {
    clearGutterSize () {
      this.$nextTick(() => {
        if (!this.windowCatalogViewVisible) {
          this.$refs.catalog.$el.nextElementSibling.style.width = '0'
        }
        if (!this.windowOutputViewVisible) {
          this.$refs.message.$el.previousElementSibling.style.height = '0'
        }
        if (!this.showRightSide) {
          this.$refs.sidebar.$el.previousElementSibling.style.width = '0'
        }
      })
    },
    changeWindowCatalogViewVisible () {
      if (this.windowCatalogViewVisible) {
        this.catalogWidth = this.catalogWidthBak
      } else {
        this.catalogWidthBak = this.catalogWidth
        this.catalogWidth = 0
      }
      this.clearGutterSize()
    },
    changeWindowOutputViewVisible () {
      if (this.windowOutputViewVisible) {
        this.messageBoxHeight = this.messageBoxHeightBak
      } else {
        this.messageBoxHeightBak = this.messageBoxHeight
        this.messageBoxHeight = 0
      }
      this.clearGutterSize()
      this.$nextTick(() => {
        if (!this.windowOutputViewVisible) {
          this.$refs.rightTopContainer.$el.style.height = '100%'
        }
      })
    },
    /**
     * 变量库可视发生变化时的处理函数
     */
    windowVariableViewVisibleHandler () {
      if (this.showRightSide) {
        this.sidebarWidth = this.sidebarWidthBak
      } else {
        this.sidebarWidthBak = this.sidebarWidth
        this.sidebarWidth = 0
        this.clearGutterSize()
      }
    },
    onDragEnd () {
      window.dispatchEvent(new Event('resize'))
    }
  },
  mounted () {
    this.$logger.info(`[${IED_TOOL_NAME}] 程序启动`)

    this.changeWindowCatalogViewVisible()
    this.changeWindowOutputViewVisible()

    document.querySelector('.tagsViewWrapper').addEventListener('mousedown', (evt) => {
      if (R.equals(1, evt.button)) {
        evt.preventDefault()
      }
    })
    this.windowVariableViewVisibleHandler()
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
