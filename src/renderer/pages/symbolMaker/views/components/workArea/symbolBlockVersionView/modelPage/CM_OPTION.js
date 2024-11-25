const MODE = {
  C: 'text/x-csrc',
  'C++': 'text/x-c++src',
  JAVASCRIPT: 'text/javascript',
  TYPESCRIPT: 'text/typescript',
  JSON: 'application/json',
  XML: 'application/xml'
}
const LINE_SEPARATOR = {
  CRLFs: 'CRLFs',
  CRs: 'CRs',
  LFs: 'LFs'
}
const DIRECTION = {
  LTR: 'ltr',
  RTL: 'rtl'
}
const THEME = {
  DARK: {
    NIGHT_3024: '3024-night',
    ABCDEF: 'abcdef',
    AMBIANCE: 'ambiance',
    BASE16_DARK: 'base16-dark',
    BESPIN: 'bespin',
    BLACKBOARD: 'blackboard',
    COBALT: 'cobalt',
    COLORFORTH: 'colorforth',
    DARCULA: 'darcula',
    DRACULA: 'dracula',
    DUOTONE_DARK: 'duotone-dark',
    ERLANG_DARK: 'erlang-dark',
    GRUVBOX_DARK: 'gruvbox-dark',
    HOPSCOTCH: 'hopscotch',
    ICECODER: 'icecoder',
    ISOTOPE: 'isotope',
    LESSER_DARK: 'lesser-dark',
    LIQUIBYTE: 'liquibyte',
    LUCARIO: 'lucario',
    MATERIAL: 'material',
    MBO: 'mbo',
    MIDNIGHT: 'midnight',
    MONOKAI: 'monokai',
    NIGHT: 'night',
    OCEANIC_NEXT: 'oceanic-next',
    PANDA_SYNTAX: 'panda-syntax',
    PARAISO_DARK: 'paraiso-dark',
    PASTEL_ON_DARK: 'pastel-on-dark',
    REILSCASTS: 'railscasts',
    RUBYBLUE: 'rubyblue',
    SETI: 'seti',
    SHADOW_FOX: 'shadowfox',
    THE_MATRIX: 'the-matrix',
    TOMORROW_NIGHT_BRIGHT: 'tomorrow-night-bright',
    TOMORROW_NIGHT_EIGHTIES: 'tomorrow-night-eighties',
    TWILIGHT: 'twilight',
    VIBRANT_INK: 'vibrant-ink',
    XQ_DARK: 'xq-dark',
    ZENBURN: 'zenburn'
  },
  LIGHT: {
    DAY_3024: '3024-day',
    AMBIANCE_MOB: 'ambiance-mobile',
    BASE16_LIGHT: 'base16-light',
    DUOTONE_LIGHT: 'duotone-light',
    ECLIPSE: 'eclipse',
    ELEGANT: 'elegant',
    IDEA: 'idea',
    MDN_LIKE: 'mdn-like',
    NEAT: 'neat',
    NEO: 'neo',
    PARAISO_LIGHT: 'paraiso-light',
    SOLARIZED: 'solarized',
    SSMS: 'ssms',
    TTCN: 'ttcn',
    XQ_LIGHT: 'xq-light',
    YETI: 'yeti'
  }
}
const KEYMAP = {
  DEFAULT: 'default',
  SUBLIME: 'sublime',
  EMACS: 'emacs',
  VIM: 'vim'
}
const GUTTERS = {
  CM_LINE_NUMBERS: 'CodeMirror-linenumbers',
  CM_FOLD_GUTTER: 'CodeMirror-foldgutter'
}

const configuration = [MODE, LINE_SEPARATOR, DIRECTION, THEME, KEYMAP, GUTTERS]

Object.freeze(configuration)

/*
*  Can be used to specify extra key bindings for the editor, alongside the ones defined by keyMap.
*  Should be either null, or a valid key map value.
*
*/
const customKeys = {
  'Alt-Enter': 'autocomplete'
}

/*
* code mirror options
*
*/
const CM_OPTION = {
  autoRefresh: true, // 解决codemirror刷新问题
  mode: MODE.C,
  theme: THEME.LIGHT.IDEA,
  lineSeparator: null,
  indentUnit: 2,
  smartIndent: true,
  tabSize: 4,
  indentWithTabs: false,
  direction: null,
  keyMap: KEYMAP.DEFAULT,
  extraKeys: { ...customKeys },
  // Whether CodeMirror should scroll or wrap for long lines. Defaults to false (scroll).
  lineWrapping: false,
  // Whether to show line numbers to the left of the editor.
  lineNumbers: true,
  gutters: [GUTTERS.CM_LINE_NUMBERS, GUTTERS.CM_FOLD_GUTTER],
  /*
  * This disables editing of the editor content by the user.
  * If the special value "nocursor" is given (instead of simply true), focusing of the editor is also disallowed.
  */
  readOnly: true,

  /*
  * addon settings
  */
  styleActiveLine: false,
  styleSelectedText: false,
  line: true,
  foldGutter: true,

  highlightSelectionMatches: {
    showToken: /\w/,
    annotateScrollbar: true
  },
  // hint.js options
  hintOptions: {
    // 当匹配只有一项的时候是否自动补全
    completeSingle: false
  },
  autoCloseBrackets: true,
  matchBrackets: true,
  showCursorWhenSelecting: true
}

export { MODE, THEME }
export default CM_OPTION
