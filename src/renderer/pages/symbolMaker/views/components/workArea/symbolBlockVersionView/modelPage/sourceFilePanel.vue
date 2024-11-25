<template>
  <div class='m_code_edit_container'>
    <codemirror :value="codeText" :options="cmOption" ref="codemirror"></codemirror>
  </div>
</template>

<script>
import CM_OPTION from './CM_OPTION'
import 'codemirror/lib/codemirror.css'
// language mode
import 'codemirror/mode/clike/clike'
// theme CSS
// 主题CSS需要修改为动态引入
// import 'codemirror/theme/cobalt.css';
import 'codemirror/theme/idea.css'
// import 'codemirror/theme/3024-day.css';
// import 'codemirror/theme/3024-night.css';
// import 'codemirror/theme/abcdef.css';
// import 'codemirror/theme/ambiance.css';
// import 'codemirror/theme/ambiance-mobile.css';
// import 'codemirror/theme/base16-dark.css';
// import 'codemirror/theme/base16-light.css';
// import 'codemirror/theme/bespin.css';
// import 'codemirror/theme/blackboard.css';
// import 'codemirror/theme/colorforth.css';
// import 'codemirror/theme/darcula.css';
// import 'codemirror/theme/dracula.css';
// import 'codemirror/theme/duotone-dark.css';
// import 'codemirror/theme/duotone-light.css';
// import 'codemirror/theme/eclipse.css';
// import 'codemirror/theme/elegant.css';
// import 'codemirror/theme/erlang-dark.css';
// import 'codemirror/theme/gruvbox-dark.css';
// import 'codemirror/theme/hopscotch.css';
// import 'codemirror/theme/icecoder.css';
// import 'codemirror/theme/idea.css';
// import 'codemirror/theme/isotope.css';
// import 'codemirror/theme/lesser-dark.css';
// import 'codemirror/theme/liquibyte.css';
// import 'codemirror/theme/lucario.css';
// import 'codemirror/theme/material.css';
// import 'codemirror/theme/mbo.css';
// import 'codemirror/theme/mdn-like.css';
// import 'codemirror/theme/midnight.css';
// import 'codemirror/theme/monokai.css';
// import 'codemirror/theme/neat.css';
// import 'codemirror/theme/neo.css';
// import 'codemirror/theme/night.css';
// import 'codemirror/theme/oceanic-next.css';
// import 'codemirror/theme/panda-syntax.css';
// import 'codemirror/theme/paraiso-dark.css';
// import 'codemirror/theme/paraiso-light.css';
// import 'codemirror/theme/pastel-on-dark.css';
// import 'codemirror/theme/railscasts.css';
// import 'codemirror/theme/rubyblue.css';
// import 'codemirror/theme/seti.css';
// import 'codemirror/theme/shadowfox.css';
// import 'codemirror/theme/solarized.css';
// import 'codemirror/theme/ssms.css';
// import 'codemirror/theme/the-matrix.css';
// import 'codemirror/theme/tomorrow-night-bright.css';
// import 'codemirror/theme/tomorrow-night-eighties.css';
// import 'codemirror/theme/ttcn.css';
// import 'codemirror/theme/twilight.css';
// import 'codemirror/theme/vibrant-ink.css';
// import 'codemirror/theme/xq-dark.css';
// import 'codemirror/theme/xq-light.css';
// import 'codemirror/theme/yeti.css';
// import 'codemirror/theme/zenburn.css';
/* addons */
// dialog
import 'codemirror/addon/dialog/dialog'
import 'codemirror/addon/dialog/dialog.css'
// search
import 'codemirror/addon/search/searchcursor'
import 'codemirror/addon/search/search'
import 'codemirror/addon/search/jump-to-line'
import 'codemirror/addon/search/matchesonscrollbar'
import 'codemirror/addon/search/match-highlighter'
// edit
import 'codemirror/addon/edit/matchbrackets'
import 'codemirror/addon/edit/closebrackets'

// comment
import 'codemirror/addon/comment/comment'
// hint
import 'codemirror/addon/hint/show-hint'
import 'codemirror/addon/hint/show-hint.css'
import 'codemirror/addon/hint/anyword-hint'
// lint
import 'codemirror/addon/lint/lint'
import 'codemirror/addon/lint/lint.css'
// highlightSelectionMatches
import 'codemirror/addon/scroll/annotatescrollbar'
// active-line
import 'codemirror/addon/selection/active-line'
import 'codemirror/addon/selection/mark-selection'
// foldGutter
import 'codemirror/addon/fold/foldcode'
import 'codemirror/addon/fold/foldgutter'
import 'codemirror/addon/fold/foldgutter.css'
import 'codemirror/addon/fold/brace-fold'
import 'codemirror/addon/fold/comment-fold'
import 'codemirror/addon/fold/indent-fold'
// display
import 'codemirror/addon/display/autorefresh'
import { codemirror } from 'vue-codemirror'

export default {
  name: 'sourceFilePanel',
  components: {
    codemirror
  },
  props: ['tagKey', 'propName'],
  data () {
    return {
      codeText: ''
    }
  },
  computed: {
    cmOption () {
      return Object.assign({}, CM_OPTION)
    },
    currentBlock () {
      return this.$store.getters.workTagsSelectDto(this.tagKey)
    }
  },
  created () {
    const content = this.currentBlock[this.propName]
    if (content instanceof Uint8Array) {
      this.codeText = content.toString()
    } else {
      this.codeText = content
    }
  }
}
</script>

<style scoped>
.m_code_edit_container {
  height: 100%;
  width: 100%;
  padding: 0;
  margin: 0;
  overflow: auto;
  text-align: left;
}
</style>
<style>
.vue-codemirror, .CodeMirror {
  height: 100%;
}
</style>
