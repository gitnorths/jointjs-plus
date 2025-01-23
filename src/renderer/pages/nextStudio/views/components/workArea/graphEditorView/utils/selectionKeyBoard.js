import { ui, dia, highlighters } from '@joint/plus'
import store from '@/renderer/pages/nextStudio/store'

export function selectionKeyBoard () {
  const paperScroller = store.getters.currentPaper
  const commandManager = store.getters.commandManager
  const stencil = store.getters.currentStencil
  const graph = store.getters.graph
  const paper = store.getters.paper

  const clipboard = new ui.Clipboard()
  const selection = new ui.Selection({
    paper: paperScroller,
    useModelGeometry: true,
    translateConnectedLinks: ui.Selection.ConnectedLinksTranslation.SUBGRAPH
  })

  selection.removeHandle('resize')
  selection.removeHandle('rotate')

  paper.on('blank:pointerclick', () => {
    highlighters.mask.removeAll(paper)
  })

  const { mask: MaskHighlighter, stroke: StrokeHighlighter } = highlighters

  paper.on('cell:mouseenter', (cellView, evt) => {
    let selector, padding
    if (cellView.model.isLink()) {
      if (StrokeHighlighter.get(cellView, 'selection')) return
      selector = { label: 0, selector: 'labelBody' }
      padding = 2
    } else {
      selector = 'body'
      padding = 4
    }

    const frame = MaskHighlighter.add(cellView, selector, 'frame', {
      padding,
      layer: dia.Paper.Layers.FRONT,
      attrs: {
        'stroke-width': 1.5,
        'stroke-linejoin': 'round'
      }
    })
    frame.el.classList.add('jj-frame')
  })

  paper.on('cell:mouseleave', () => {
    MaskHighlighter.removeAll(paper, 'frame')
  })

  const keyboard = new ui.Keyboard()

  const MOVE_STEP = 20
  let movedElementsHash = ''

  keyboard.on({

    'ctrl+c': () => {
      clipboard.copyElements(selection.collection, graph)
    },

    'ctrl+v': () => {
      const pastedCells = clipboard.pasteCells(graph)
      const elements = pastedCells.filter((cell) => cell.isElement())
      selection.collection.reset(elements)
    },

    'ctrl+x shift+delete': () => {
      clipboard.cutElements(selection.collection, graph)
    },

    'delete backspace': (evt) => {
      evt.preventDefault()
      graph.removeCells(selection.collection.toArray())
    },

    'ctrl+z': () => {
      commandManager.undo()
      selection.collection.reset([])
    },

    'ctrl+y': () => {
      commandManager.redo()
      selection.collection.reset([])
    },

    'ctrl+a': (evt) => {
      evt.preventDefault()
      selection.collection.reset(graph.getElements())
    },

    'ctrl+plus': (evt) => {
        evt.preventDefault()
        paperScroller.zoom(0.2, { max: 5, grid: 0.2 })
    },

    'ctrl+minus': (evt) => {
        evt.preventDefault()
        paperScroller.zoom(-0.2, { min: 0.2, grid: 0.2 })
    },

    'keydown:shift': (evt) => {
      paperScroller.setCursor('crosshair')
    },

    'keyup:shift': () => {
      paperScroller.setCursor('grab')
    },

    'ctrl+up': (evt) => {
      // Prevent Default Scrolling
      evt.preventDefault()
      moveCells(0, -MOVE_STEP)
    },

    'ctrl+down': (evt) => {
      evt.preventDefault()
      moveCells(0, MOVE_STEP)
    },

    'ctrl+left': (evt) => {
      evt.preventDefault()
      moveCells(-MOVE_STEP, 0)
    },

    'ctrl+right': (evt) => {
      evt.preventDefault()
      moveCells(MOVE_STEP, 0)
    }
  })

  paper.on('blank:pointerdown', (evt, x, y) => {
    // 当用户按住 Shift 键并抓住纸张的空白区域时，启动选择。
    // 否则，启动纸盘。
    if (keyboard.isActive('shift', evt)) {
        selection.startSelecting(evt)
    } else {
        selection.collection.reset([])
        paperScroller.startPanning(evt, x, y)
        paper.removeTools()
    }
  })

  paper.on('cell:pointerdown element:magnet:pointerdown', (cellView, evt) => {
    // 当用户按住 Shift 键并抓住一个单元格时开始选择。
    if (!keyboard.isActive('shift', evt)) return
    cellView.preventDefaultInteraction(evt)
    selection.startSelecting(evt)
  })

  paper.on('element:pointerdown', (elementView, evt) => {
    const element = elementView.model
    // 按下 CTRL/Meta 键时挑选元素。
    if (!keyboard.isActive('ctrl meta', evt)) return
    // 如果单击元素时按下 CTRL/Meta 键，则选择一个元素。
    if (selection.collection.find(cell => cell.isLink())) {
        // 不允许在选择中混合链接和元素
        selection.collection.reset([element])
    } else {
        if (selection.collection.includes(element)) {
            selection.collection.remove(element)
        } else {
            selection.collection.add(element)
        }
    }
  })

  paper.on('cell:pointerup', (cellView, evt) => {
    const cell = cellView.model
    // 当用户点击时选择一个单元格
    // 除非该单元格已经是选择的一部分。
    if (keyboard.isActive('ctrl meta', evt)) return
    if (selection.collection.includes(cell)) return
    selection.collection.reset([cell])
  })

  stencil.on('element:drop', (elementView) => {
    // 选择掉入纸张的元素
    selection.collection.reset([elementView.model])
  })

  paper.on('cell:mouseleave', () => {
    MaskHighlighter.removeAll(paper, 'frame')
  })

  graph.on('change', () => (movedElementsHash = ''))

  function moveCells (dx, dy) {
    const cells = selection.collection.toArray()
    const elements = cells.filter((cell) => cell.isElement())
    const hash = elements
      .map((el) => el.id)
      .sort()
      .join(' ')
    const movedPreviously = hash === movedElementsHash

    graph.startBatch('shift-selection')
    elements.forEach((el) =>
      el.translate(dx, dy, { skipHistory: movedPreviously })
    )
    graph.stopBatch('shift-selection')
    movedElementsHash = hash
  }
}
