import { ui, dia, linkTools, highlighters } from '@joint/plus'
import * as R from 'ramda'
import VBus from '@/renderer/common/vbus'
import store from '@/renderer/pages/nextStudio/store'

export function selectionKeyBoard (paper, graph, commandManager) {
  const paperScroller = store.getters.currentPaper
  let selectedCells = []

  const selection = new ui.Selection({
    paper,
    useModelGeometry: true
  })

  selection.removeHandle('resize')
  selection.removeHandle('rotate')

  // 框选分组功能
  selection.collection.on('reset', () => {
    selectedCells.length = 0
    const elements = selection.collection.toArray()
    selectedCells = elements
  })

  paper.on('blank:pointerdown', (evt) => {
    selection.startSelecting(evt)
  })

  paper.on('element:pointerclick', (elementView, event) => {
    selectedCells.length = 0
    selection.collection.reset([elementView.model])
    // highlighters.mask.removeAll(paper)
    // highlighters.mask.add(elementView, 'body', 'highlighter-selected', {
    //   layer: dia.Paper.Layers.BACK,
    //   padding: 2,
    //   attrs: {
    //     stroke: '#0075f2',
    //     'stroke-width': 4,
    //     'stroke-linejoin': 'round'
    //   }
    // })
    selectedCells.push(elementView.model)
  })

  paper.on('element:pointerup', (elementView, evt) => {
    if (evt.ctrlKey || evt.metaKey) {
      selection.collection.add(elementView.model)
    }
  })

  paper.on('blank:pointerclick', () => {
    highlighters.mask.removeAll(paper)
    selectedCells.length = 0
  })

  paper.on('link:pointerclick', (cellView) => {
    paper.removeTools()
    dia.HighlighterView.removeAll(paper)
    const snapAnchor = function (coords, endView) {
      const bbox = endView.model.getBBox()
      // Find the closest point on the bbox border.
      const point = bbox.pointNearestToPoint(coords)
      const center = bbox.center()
      // Snap the point to the center of the bbox if it's close enough.
      const snapRadius = 10
      if (Math.abs(point.x - center.x) < snapRadius) {
        point.x = center.x
      }
      if (Math.abs(point.y - center.y) < snapRadius) {
        point.y = center.y
      }
      return point
    }
    const toolsView = new dia.ToolsView({
      tools: [
        new linkTools.TargetAnchor({
          snap: snapAnchor,
          resetAnchor: cellView.model.prop(['target', 'anchor'])
        }),
        new linkTools.SourceAnchor({
          snap: snapAnchor,
          resetAnchor: cellView.model.prop(['source', 'anchor'])
        })
      ]
    })
    toolsView.el.classList.add('jj-flow-tools')
    cellView.addTools(toolsView)
    // Add copy of the link <path> element behind the link.
    // The selection link frame should be behind all elements and links.
    const strokeHighlighter = StrokeHighlighter.add(
      cellView,
      'root',
      'selection',
      {
        layer: dia.Paper.Layers.BACK
      }
    )
    strokeHighlighter.el.classList.add('jj-flow-selection')
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

  keyboard.on('delete', () => {
    if (selectedCells?.length) {
      selectedCells.forEach(item => {
        item.remove()
      })
    }
  })

  keyboard.on({
    'up ctrl+up': (evt) => {
      // Prevent Default Scrolling
      evt.preventDefault()
      moveCells(0, -MOVE_STEP)
    },
    'down ctrl+down': (evt) => {
      evt.preventDefault()
      moveCells(0, MOVE_STEP)
    },
    'left ctrl+left': (evt) => {
      evt.preventDefault()
      moveCells(-MOVE_STEP, 0)
    },
    'right ctrl+right': (evt) => {
      evt.preventDefault()
      moveCells(MOVE_STEP, 0)
    }
  })

  keyboard.on({
    'ctrl+y': redo, // redo
    'ctrl+z': undo, // undo
    'ctrl+-': zoomOut, // zoom out
    'ctrl+=': zoomIn // zoom in
  })

  paper.on('cell:mouseleave', () => {
    MaskHighlighter.removeAll(paper, 'frame')
  })

  graph.on('change', () => (movedElementsHash = ''))

  function undo () {
    commandManager.undo()
  }

  function redo () {
    commandManager.redo()
  }

  function zoomIn (value) {
    const zoomValue = R.is(Object, value) ? 2 : value
    paperScroller.zoom(0.2, { max: zoomValue })
    if (VBus) {
      VBus.$emit('SYNC_GRAPH_SCALE')
    } else {
        console.error('VBus is undefined when trying to emit zoomInEvent')
    }
  }

  function zoomOut (value) {
    const zoomValue = R.is(Object, value) ? 0.2 : value
    paperScroller.zoom(-0.2, { min: zoomValue })
    if (VBus) {
      VBus.$emit('SYNC_GRAPH_SCALE')
    } else {
        console.error('VBus is undefined when trying to emit zoomOutEvent')
    }
  }

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
