<template>
  <div class="tagsViewContainer" v-show="tagKeyArr.length > 0">
    <scroll-pane class="tagsViewWrapper" ref="scrollPane">
      <draggable v-model="tagKeyArr" @end="dragEnd">
        <span v-for="(item, index) in tagKeyArr" class="tabTitle"
              :class="{'tabTitleActive': item.tagKey === activeKey}" :key="item.tagKey"
              @mouseup="clickHandler(index, $event)" ref="tag">
          <span v-if="tagChanged(item)" style="font-size: 12px; color: red">*</span>
          {{ getTagTitle(item) }}
          <el-button icon="el-icon-close" circle plain size="mini" type="info"
                     style="margin-left:3px; display: inline-block; padding: 0;border: none"
                     @click="close(index)">
          </el-button>
        </span>
      </draggable>
    </scroll-pane>
  </div>
</template>

<script>
import ScrollPane from './ScrollPane.vue'
import draggable from 'vuedraggable'
import { TagContext } from './tagContext'
import { getTagKey } from '@/renderer/common/util'

export default {
  name: 'scrollTag',
  components: { draggable, ScrollPane },
  data () {
    return {}
  },
  computed: {
    tagKeyArr: {
      get () {
        return this.$store.getters.dataContainer.map(item => ({ dto: item, tagKey: getTagKey(item) }))
      },
      set (value) {
        this.$store.commit('sortTagContainer', value)
      }
    },
    activeIndex () {
      return this.$store.getters.activeIndex
    },
    activeKey () {
      return this.$store.getters.activeKey
    }
  },
  watch: {
    activeIndex () {
      this.$nextTick(() => {
        this.$refs.scrollPane.moveToTarget(this.$refs.tag[this.activeIndex])
      })
    }
  },
  methods: {
    tagChanged (item) {
      return this.$store.getters.tagDeltaExist(item.tagKey)
    },
    getTagTitle (item) {
      // TODO 改为动态计算
      const dto = item.dto
      return dto.title
    },
    dragEnd () {
      this.$vbus.$emit('TAGS_DRAG_END')
    },
    clickHandler (index, evt) {
      this.$store.commit('setActiveTagIndex', index)
      switch (evt.button) {
        case 0: // 鼠标左键
          break
        case 1: // 鼠标中键
          break
        case 2: // 鼠标右键
          this.$menu.open(null, TagContext, this.$i18n)
          break
      }
    },
    close (index) {
      return this.$store.commit('closeTags', { curIndex: index, direction: '' })
    }
  }
}
</script>

<style lang="scss" scoped>
.tagsViewContainer {
  position: relative;
  border-bottom: 1px solid #efefef;
  user-select: none;

  .el-scrollbar__wrap {
    margin-bottom: -8px !important;
    margin-right: -8px !important;
  }

  .tagsViewWrapper {

    .tabTitle {
      cursor: pointer;
      display: inline-block;
      position: relative;
      height: 24px;
      line-height: 22px;
      border: 1px solid #d8dce5;
      color: #495060;
      background: #fff;
      padding: 0 8px;
      font-size: 12px;
      margin-left: 5px;
      margin-top: 4px;
      margin-bottom: 4px;
    }

    .tabTitleActive {
      background-color: #409eff;
      color: #fff;
      border-color: #409eff;

      //&::before {
      //  content: '';
      //  background: #fff;
      //  display: inline-block;
      //  width: 8px;
      //  height: 8px;
      //  border-radius: 50%;
      //  position: relative;
      //  margin-right: 2px;
      //}
    }
  }
}
</style>
