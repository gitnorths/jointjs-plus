<template>
  <div class="graphEditorViewContainer" :id="tagKey">
    <div class="graphEditorContainer paper-container" tabIndex="0" ref="graphEditorContainer" @keydown="keyDownHandler">
    </div>
    <symbol-dialog :graph="graph" :page-graph="pageGraphDto" ref="dialog"/>
  </div>
</template>

<script>
import * as R from 'ramda'
import * as _ from 'lodash'
import { v4 as uuid } from 'uuid'
import { LabelIn, LabelOut, PageAnnotation } from '@/model/dto'
import { objDiff } from '@/renderer/common/util'
import { getObjContext, instanceVFB } from '@/renderer/pages/nextStudio/action'
import SymbolDialog from './symbolDialog/symbolDialog.vue'
import { dia, shapes, ui, highlighters } from '@joint/plus'
import { getVariableTypeString } from '@/model/enum'
import { Benchmark } from '@/util/consts'
import { selectionKeyBoard } from './utils/index'

export default {
  name: 'graphEditor',
  components: { SymbolDialog },
  props: {
    tagKey: { type: String, required: true }
  },
  data () {
    return {
      loadingService: null,
      orgPageGraph: null,
      recordSet: { insertRecords: [], updateRecords: [], removeRecords: [] },
      graph: null,
      paper: null,
      snaplines: null,
      paperScroller: null,
      commandManager: null
    }
  },
  computed: {
    deviceDbName () {
      return this.$store.getters.deviceDbName
    },
    pageGraphDto () {
      return this.$store.getters.selectDto(this.tagKey)
    },
    activeStatus () {
      return R.equals(this.tagKey, this.$store.getters.activeKey)
    },
    focusedVfbId () {
      return this.$store.getters.focusedVfbId // FIXME 统一修改为searchPath来查找定位
    },
    symbolProtoMap () {
      return this.$store.getters.symbolProtoMap // 符号原型，用于构造新的业务对象
    },
    symbolNameSpace () {
      return this.$store.getters.symbolNameSpace
    },
    nameSpace () {
      return { ...shapes, ...this.$store.getters.symbolNameSpace }
    }
  },
  watch: {
    activeStatus (val) {
      if (val) {
        this.$store.commit('setCurrentPaper', this.paperScroller)
      }
    },
    focusedVfbId (val) {
      if (val) {
        this.focus(val)
      }
    },
    symbolNameSpace () {
      // TODO
      console.log(this.graph, this.paper)
    }
  },
  methods: {
    loading (fn) {
      this.loadingService = this.$loading({
        target: `#${this.tagKey}`,
        fullscreen: false,
        text: '加载中...',
        spinner: 'el-icon-loading',
        background: 'rgba(0, 0, 0, 0.3)'
      })
      return setTimeout(fn, 120)
    },
    addVfbToGraph (block) {
      const typeArr = block.pathId.split('/')
      const ctr = R.path(typeArr, this.nameSpace)
      const symbolBlock = new ctr()
      symbolBlock.set('data', block)
      symbolBlock.set('id', block.id)
      symbolBlock.position(block.x, block.y)
      let textContent = block.instName || block.name
      if (/^base\/extend\/CConstBlock/i.test(block.pathId)) {
        const output = block.outputs[0]
        const typeStr = getVariableTypeString(output.type)
        textContent = output.abbr
          ? `${output.abbr} ${typeStr} ${output.value}`
          : `${typeStr} ${output.value}`
      } else {
        // FIXME 重算坐标有性能问题
        symbolBlock.attr('label/x', Benchmark.fontSize / 2)
      }
      symbolBlock.attr('label/text', textContent)
      symbolBlock.addTo(this.graph)
    },
    addLabelToGraph (block) {
      const typeArr = block.pathId.split('/')
      const ctr = R.path(typeArr, this.nameSpace)
      const symbolBlock = new ctr()
      symbolBlock.set('data', block)
      symbolBlock.set('id', block.id)
      symbolBlock.position(block.x, block.y)
      symbolBlock.attr('label/text', block.name || block.desc || block.abbr || block.instName)
      symbolBlock.addTo(this.graph)
    },
    addAnnotationToGraph (annotation) {
      // TODO
    },
    addLineToGraph (line) {
      const link = new shapes.standard.Link({
        source: { id: line.headNodeId, port: line.headName },
        target: { id: line.tailNodeId, port: line.tailName }
      })
      if (line.routerPoints && R.isNotEmpty(line.routerPoints)) {
        link.vertices(line.routerPoints.map(routePoint => ({
          x: routePoint.x, y: routePoint.y
        })))
      }
      // link.attr('line/stroke', '#fe854f')
      link.set('data', line)
      link.addTo(this.graph)
      // TODO 样式
    },
    addCellToGraph ({ symbolBlocks, connectLines, annotations, inLabels, outLabels }) {
      if (symbolBlocks && symbolBlocks.length > 0) {
        for (const block of symbolBlocks) {
          this.addVfbToGraph(block)
        }
      }
      if (inLabels && inLabels.length > 0) {
        for (const label of inLabels) {
          this.addLabelToGraph(label)
        }
      }
      if (outLabels && outLabels.length > 0) {
        for (const label of outLabels) {
          this.addLabelToGraph(label)
        }
      }
      if (connectLines && connectLines.length > 0) {
        for (const line of connectLines) {
          this.addLineToGraph(line)
        }
      }
      if (annotations && annotations.length > 0) {
        for (const annotation of annotations) {
          this.addAnnotationToGraph(annotation)
        }
      }
    },
    initPageGraphDto () {
      this.loading(() => {
        getObjContext(this.pageGraphDto, this.deviceDbName).then((page) => {
          if (page) {
            this.orgPageGraph = {}
            this.orgPageGraph.annotations = _.cloneDeep(page.annotations)
            this.orgPageGraph.connectLines = _.cloneDeep(page.connectLines)
            this.orgPageGraph.symbolBlocks = _.cloneDeep(page.symbolBlocks)
            this.orgPageGraph.inLabels = _.cloneDeep(page.inLabels)
            this.orgPageGraph.outLabels = _.cloneDeep(page.outLabels)

            // 清理
            this.graph.clear() // 先清理原来的图形和连线
            // this.commandManager.reset()
            this.recordSet = { insertRecords: [], updateRecords: [], removeRecords: [] }
            this.recordDelta()

            this.addCellToGraph(page)

            this.paperScroller.centerContent() // 居中显示
            this.focus(this.focusedVfbId) // 高亮选中的符号
          }
        }).catch((e) => {
          this.$notification.openErrorNotification(`页面刷新失败${e}，请稍后再试。`).logger()
        }).finally(() => {
          this.loadingService.close()
          this.loadingService = null
        })
      })
    },
    judgeChanged () {
      this.recordSet = { insertRecords: [], updateRecords: [], removeRecords: [] }
      const oldValue = this.orgPageGraph
      const newValue = { symbolBlocks: [], connectLines: [], annotations: [] }
      // FIXME
      const allCells = this.graph.getElements()
      for (const cell of allCells) {
        if (cell && cell.data) {
          // FIXME
          if (/VisualFuncBlock/.test(cell.data.clazzName)) {
            newValue.symbolBlocks.push(cell.data)
          } else if (/ConnectingLine/.test(cell.data.clazzName)) {
            newValue.connectLines.push(cell.data)
          } else if (/Annotation/.test(cell.data.clazzName)) {
            newValue.annotations.push(cell.data)
          }
        }
      }
      const delta = objDiff().diff(oldValue, newValue)
      if (delta) {
        // 功能块对比
        if (delta.symbolBlocks && delta.symbolBlocks._t === 'a') {
          if (oldValue.symbolBlocks && oldValue.symbolBlocks.length > 0) {
            for (let i = 0; i < oldValue.symbolBlocks.length; i++) {
              const delDelta = delta.symbolBlocks[`_${i}`]
              // 删除功能块
              if (delDelta && delDelta instanceof Array && delDelta[2] === 0) {
                this.recordSet.removeRecords.push(oldValue.symbolBlocks[i])
              }
            }
          }
          if (newValue.symbolBlocks && newValue.symbolBlocks.length > 0) {
            for (let i = 0; i < newValue.symbolBlocks.length; i++) {
              const changeDelta = delta.symbolBlocks[`${i}`]
              if (changeDelta) {
                const dto = newValue.symbolBlocks[i]
                if (changeDelta instanceof Array) {
                  this.recordSet.insertRecords.push(dto)
                } else {
                  if (changeDelta.x || changeDelta.y ||
                    changeDelta.instName || changeDelta.status ||
                    changeDelta.showInstName || changeDelta.desc ||
                    changeDelta.customLevel || changeDelta.customTypeOption ||
                    changeDelta.args) {
                    this.recordSet.updateRecords.push(dto)
                  }
                  if (changeDelta.inputs) {
                    const newInputs = dto.inputs
                    for (let j = 0; j < newInputs.length; j++) {
                      if (changeDelta.inputs[j]) {
                        this.recordSet.updateRecords.push(newInputs[j])
                      }
                    }
                  }
                  if (changeDelta.outputs) {
                    const newOutputs = dto.outputs
                    for (let j = 0; j < newOutputs.length; j++) {
                      if (changeDelta.outputs[j]) {
                        this.recordSet.updateRecords.push(newOutputs[j])
                      }
                    }
                  }
                  if (changeDelta.params) {
                    for (let j = 0; j < dto.params.length; j++) {
                      const paramChangeDelta = changeDelta.params[j]
                      if (paramChangeDelta) {
                        const newParam = dto.params[j]
                        if (paramChangeDelta.listArrSetValues) {
                          const newListArr = newParam.listArrSetValues // FIXME
                          for (let k = 0; k < newListArr.length; k++) {
                            if (paramChangeDelta.listArrSetValues[k]) {
                              this.recordSet.updateRecords.push(newListArr[k])
                            }
                          }
                        }
                        if (paramChangeDelta.alias || paramChangeDelta.desc || paramChangeDelta.value) {
                          this.recordSet.updateRecords.push(newParam)
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
        // 连线对比
        if (delta.connectLines && delta.connectLines._t === 'a') {
          if (oldValue.connectLines && oldValue.connectLines.length > 0) {
            for (let i = 0; i < oldValue.connectLines.length; i++) {
              const delDelta = delta.connectLines[`_${i}`]
              // 删除功能块
              if (delDelta && delDelta instanceof Array && delDelta[2] === 0) {
                this.recordSet.removeRecords.push(oldValue.connectLines[i])
              }
            }
          }
          if (newValue.connectLines && newValue.connectLines.length > 0) {
            for (let i = 0; i < newValue.connectLines.length; i++) {
              const changeDelta = delta.connectLines[`${i}`]
              if (changeDelta) {
                const dto = newValue.connectLines[i]
                if (changeDelta instanceof Array) {
                  this.recordSet.insertRecords.push(dto)
                } else {
                  this.recordSet.updateRecords.push(dto)
                }
              }
            }
          }
        }
        // 注解对比
        if (delta.annotations && delta.annotations._t === 'a') {
          if (oldValue.annotations && oldValue.annotations.length > 0) {
            for (let i = 0; i < oldValue.annotations.length; i++) {
              const delDelta = delta.annotations[`_${i}`]
              // 删除功能块
              if (delDelta && delDelta instanceof Array && delDelta[2] === 0) {
                this.recordSet.removeRecords.push(oldValue.annotations[i])
              }
            }
          }
          if (newValue.annotations && newValue.annotations.length > 0) {
            for (let i = 0; i < newValue.annotations.length; i++) {
              const changeDelta = delta.annotations[`${i}`]
              if (changeDelta) {
                const dto = newValue.annotations[i]
                if (changeDelta instanceof Array) {
                  this.recordSet.insertRecords.push(dto)
                } else {
                  this.recordSet.updateRecords.push(dto)
                }
              }
            }
          }
        }
      }
      this.recordDelta()
    },
    recordDelta () {
      this.$store.commit('updateDelta', { key: this.tagKey, delta: this.recordSet })
    },
    getExistInstNameList () {
      const result = []
      // FIXME
      const allCells = R.values(this.graph.model.cells) || []
      for (const cell of allCells) {
        if (cell && cell.value && cell.value.instName) {
          result.push(cell.value.instName)
        }
      }
      return result
    },
    /**
     * 实例化一个symbol valueAddHandler ()
     */
    async instanceSymbol (symbol, x, y) {
      if (R.isNil(symbol)) {
        return
      }
      try {
        const newSymbol = {}
        Object.assign(newSymbol, symbol)
        newSymbol.x = x
        newSymbol.y = y
        const vfb = await instanceVFB(newSymbol, {
          id: this.pageGraphDto.id,
          existInstNameList: this.getExistInstNameList()
        })
        this.$logger.info(`新增符号 ${vfb.instName || vfb.name}`)
        this.addVfbToGraph(vfb)
      } catch (e) {
        this.$notification.openErrorNotification(`新增功能块失败${e}`).logger()
      }
    },
    instanceBaseSymbol (inputArgs) {
      if (!inputArgs) {
        return
      }
      const { x, y, pathId } = inputArgs
      if (/Label(IN|OUT)/i.test(pathId)) {
        try {
          const label = /LabelIn/i.test(pathId)
            ? new LabelIn({ id: uuid(), x, y, pageId: this.pageGraphDto.id })
            : new LabelOut({ id: uuid(), x, y, pageId: this.pageGraphDto.id })
          this.$logger.info('新增标签')
          // 添加到页面
          this.addLabelToGraph(label)
        } catch (e) {
          this.$notification.openErrorNotification(`新增注解失败${e}`).logger()
        }
      } else {
        const symbol = this.symbolProtoMap[pathId]
        this.instanceSymbol(symbol, x, y)
      }
    },
    instanceAnnotation (inputArgs) {
      if (!inputArgs) {
        return
      }
      const { x, y, width, height, color } = inputArgs
      try {
        const annotation = new PageAnnotation({ x, y, width, height, color, value: '' })
        annotation.id = uuid()
        annotation.pageGraphId = this.pageGraphDto.id
        this.$logger.info('新增注解')
        // 添加到页面
        this.addAnnotationToGraph(annotation)
      } catch (e) {
        this.$notification.openErrorNotification(`新增注解失败${e}`).logger()
      }
    },
    // esc键取消操作
    cancelAction () {
      // todo
    },
    delCells () {
      // todo
    },
    copyCell2Str () {
      // TODO
    },
    cutCell2Str () {
      this.copyCell2Str()
      // FIXME ，如果取消，则不删除。应该改为粘贴成功之后才删除
      this.delCells()
    },
    showPastePreview () {
      // TODO
    },
    pasteStr2Graph (x, y) {
      // todo
    },
    undo () {
      if (!this.activeStatus) {
        return
      }
      const actionRecord = this.commandManager.undo()
      if (actionRecord && !actionRecord.isMxUndoManaged) {
        this.judgeChanged()
      }
    },
    redo () {
      if (!this.activeStatus) {
        return
      }
      const actionRecord = this.commandManager.redo()
      if (actionRecord && !actionRecord.isMxUndoManaged) {
        this.judgeChanged()
      }
    },
    resetScale () {
      this.paperScroller.zoomToFit({
        minScale: 1,
        maxScale: 1
      })
    },
    keyDownHandler (evt) {
      const ctrlKey = R.propOr(false, 'ctrlKey', evt)
      const shiftKey = R.propOr(false, 'shiftKey', evt)
      const altKey = R.propOr(false, 'altKey', evt)
      const codeEqual = (code) => R.equals(code, R.propOr('', 'code', evt))

      if (codeEqual('KeyC') && ctrlKey) {
        this.copyCell2Str()
      }
      if (codeEqual('KeyX') && ctrlKey) {
        this.cutCell2Str()
      }
      if (codeEqual('KeyV') && ctrlKey) {
        this.showPastePreview()
        this.$notification.openInfoNotification('请选择粘贴位置')
      }
      if (codeEqual('KeyZ') && ctrlKey) {
        this.undo()
      }
      if (codeEqual('KeyY') && ctrlKey) {
        this.redo()
      }
      if (codeEqual('Delete')) {
        this.delCells()
      }
      if (codeEqual('Escape')) {
        this.cancelAction()
      }
    },
    fitToScreen () {
      this.paperScroller.zoomToFit({
        minScale: 0.2,
        maxScale: 2
      })
      this.$vbus.$emit('SYNC_GRAPH_SCALE')
    },
    refreshDesc (ignoreTagKeys) {
      if (ignoreTagKeys && R.includes(this.tagKey, ignoreTagKeys)) {
        return
      }
      this.loading(() => {
        if (!this.pageGraphDto) {
          // 页面被板卡界面关闭
          return
        }
        getObjContext(this.pageGraphDto, this.deviceDbName)
          .then((page) => {
            if (!page) {
              return
            }
            this.orgPageGraph = {}
            this.orgPageGraph.symbolBlocks = _.cloneDeep(page.symbolBlocks)
            this.orgPageGraph.connectLines = _.cloneDeep(page.connectLines)
            this.orgPageGraph.annotations = _.cloneDeep(page.annotations)
            this.orgPageGraph.inLabels = _.cloneDeep(page.inLabels)
            this.orgPageGraph.outLabels = _.cloneDeep(page.outLabels)

            page.symbolBlocks.forEach((vfb) => {
              // FIXME
              const vfbCell = this.graph.model.getCell(vfb.id)
              const relateCellVfb = vfbCell ? vfbCell.value : ''
              if (relateCellVfb) {
                relateCellVfb.desc = vfb.desc
                relateCellVfb.status = vfb.status
                if (R.isNotEmpty(vfb.inputs)) {
                  vfb.inputs.forEach((input) => {
                    const relateCellInput = R.find(R.propEq(input.id, 'id'))(relateCellVfb.inputs)
                    relateCellInput.alias = input.alias
                  })
                }
                if (R.isNotEmpty(vfb.outputs)) {
                  vfb.outputs.forEach((output) => {
                    const relateCellOutput = R.find(R.propEq(output.id, 'id'))(relateCellVfb.outputs)
                    relateCellOutput.alias = output.alias
                    relateCellOutput.desc = output.desc
                  })
                }
                if (R.isNotEmpty(vfb.params)) {
                  vfb.params.forEach((param) => {
                    const relateCellParam = R.find(R.propEq(param.id, 'id'))(relateCellVfb.params)
                    relateCellParam.alias = param.alias
                    relateCellParam.desc = param.desc
                    relateCellParam.value = param.value
                  })
                }
              }
            })
          })
          .finally(() => {
            this.loadingService.close()
            this.loadingService = null
          })
      })
    },
    reset (ignoreTagKeys) {
      if (ignoreTagKeys && !R.includes(this.tagKey, ignoreTagKeys)) {
        return
      }
      const deltaExist = this.$store.getters.tagDeltaExist(this.tagKey)
      if (deltaExist) {
        const msg = '所有未保存的修改内容会丢失，是否继续？'
        this.$confirm(msg, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
          center: true
        })
          .then(() => this.initPageGraphDto())
      } else {
        this.initPageGraphDto()
      }
    },
    focus (vfbId) {
      // TODO
    },
    linkTools () {
      const verticesTool = new linkTools.Vertices()
      const segmentsTool = new linkTools.Segments()
      const sourceArrowheadTool = new linkTools.SourceArrowhead()
      const targetArrowheadTool = new linkTools.TargetArrowhead()
      const sourceAnchorTool = new linkTools.SourceAnchor()
      const targetAnchorTool = new linkTools.TargetAnchor()
      const boundaryTool = new linkTools.Boundary()
      const removeButton = new linkTools.Remove({
          distance: 20
      })

      const toolsView = this.toolsView = new dia.ToolsView({
        tools: [
          verticesTool, segmentsTool,
          sourceArrowheadTool, targetArrowheadTool,
          sourceAnchorTool, targetAnchorTool,
          boundaryTool, removeButton
        ]
      })

      this.paper.on('link:mouseenter', function (linkView) {
        linkView.addTools(toolsView)
      })

      this.paper.on('link:mouseleave', function (linkView) {
        linkView.removeTools()
      })
    },
    orthogonalRouter (vertices, opt, linkView) {
        const sourceBBox = linkView.sourceBBox
        const targetBBox = linkView.targetBBox
        const sourcePoint = linkView.sourceAnchor
        const targetPoint = linkView.targetAnchor
        const { x: tx0, y: ty0 } = targetBBox
        const { x: sx0, y: sy0 } = sourceBBox
        const sourceOutsidePoint = sourcePoint.clone()
        const spacing = -50
        const sourceSide = sourceBBox.sideNearestToPoint(sourcePoint)
        switch (sourceSide) {
          case 'left':
            sourceOutsidePoint.x = sx0 - spacing
            break
          case 'right':
            sourceOutsidePoint.x = sx0 + sourceBBox.width + spacing
            break
          case 'top':
            sourceOutsidePoint.y = sy0 - spacing
            break
          case 'bottom':
            sourceOutsidePoint.y = sy0 + sourceBBox.height + spacing
            break
        }
        const targetOutsidePoint = targetPoint.clone()
        const targetSide = targetBBox.sideNearestToPoint(targetPoint)
        switch (targetSide) {
          case 'left':
            targetOutsidePoint.x = targetBBox.x - spacing
            break
          case 'right':
            targetOutsidePoint.x = targetBBox.x + targetBBox.width + spacing
            break
          case 'top':
            targetOutsidePoint.y = targetBBox.y - spacing
            break
          case 'bottom':
            targetOutsidePoint.y = targetBBox.y + targetBBox.height + spacing
            break
        }

        const { x: sox, y: soy } = sourceOutsidePoint
        const { x: tox, y: toy } = targetOutsidePoint
        const tx1 = tx0 + targetBBox.width
        const ty1 = ty0 + targetBBox.height
        const tcx = (tx0 + tx1) / 2
        const tcy = (ty0 + ty1) / 2
        const sx1 = sx0 + sourceBBox.width
        const sy1 = sy0 + sourceBBox.height

        if (sourceSide === 'left' && targetSide === 'right') {
          if (sox < tox) {
            let y = (soy + toy) / 2
            if (sox < tx0) {
              if (y > tcy && y < ty1 + spacing) {
                y = ty0 - spacing
              } else if (y <= tcy && y > ty0 - spacing) {
                y = ty1 + spacing
              }
            }
            return [
              { x: sox, y: soy },
              { x: sox, y },
              { x: tox, y },
              { x: tox, y: toy }
            ]
          } else {
            const x = (sox + tox) / 2
            return [
              { x, y: soy },
              { x, y: toy }
            ]
          }
        } else if (sourceSide === 'right' && targetSide === 'left') {
          // Right to left
          if (sox > tox) {
            let y = (soy + toy) / 2
            if (sox > tx1) {
              if (y > tcy && y < ty1 + spacing) {
                y = ty0 - spacing
              } else if (y <= tcy && y > ty0 - spacing) {
                y = ty1 + spacing
              }
            }
            return [
              { x: sox, y: soy },
              { x: sox, y },
              { x: tox, y },
              { x: tox, y: toy }
            ]
          } else {
            const x = (sox + tox) / 2
            return [
              { x, y: soy },
              { x, y: toy }
            ]
          }
        } else if (sourceSide === 'top' && targetSide === 'bottom') {
          // analogical to let to right
          if (soy < toy) {
            let x = (sox + tox) / 2
            if (soy < ty0) {
              if (x > tcx && x < tx1 + spacing) {
                x = tx0 - spacing
              } else if (x <= tcx && x > tx0 - spacing) {
                x = tx1 + spacing
              }
            }
            return [
              { x: sox, y: soy },
              { x, y: soy },
              { x, y: toy },
              { x: tox, y: toy }
            ]
          }
          const y = (soy + toy) / 2
          return [
            { x: sox, y },
            { x: tox, y }
          ]
        } else if (sourceSide === 'bottom' && targetSide === 'top') {
          // analogical to right to left
          if (soy >= toy) {
            let x = (sox + tox) / 2
            if (soy > ty1) {
              if (x > tcx && x < tx1 + spacing) {
                x = tx0 - spacing
              } else if (x <= tcx && x > tx0 - spacing) {
                x = tx1 + spacing
              }
            }
            return [
              { x: sox, y: soy },
              { x, y: soy },
              { x, y: toy },
              { x: tox, y: toy }
            ]
          }
          const y = (soy + toy) / 2
          return [
            { x: sox, y },
            { x: tox, y }
          ]
        } else if (sourceSide === 'top' && targetSide === 'top') {
          const y = Math.min(soy, toy)
          return [
            { x: sox, y },
            { x: tox, y }
          ]
        } else if (sourceSide === 'bottom' && targetSide === 'bottom') {
          const y = Math.max(soy, toy)
          return [
            { x: sox, y },
            { x: tox, y }
          ]
        } else if (sourceSide === 'left' && targetSide === 'left') {
          const x = Math.min(sox, tox)
          return [
            { x, y: soy },
            { x, y: toy }
          ]
        } else if (sourceSide === 'right' && targetSide === 'right') {
          const x = Math.max(sox, tox)
          return [
            { x, y: soy },
            { x, y: toy }
          ]
        } else if (sourceSide === 'top' && targetSide === 'right') {
          if (soy > toy) {
            if (sox < tox) {
              let y = (sy0 + toy) / 2
              if (y > tcy && y < ty1 + spacing && sox < tx0 - spacing) {
                y = ty0 - spacing
              }
              return [
                { x: sox, y },
                { x: tox, y },
                { x: tox, y: toy }
              ]
            }
            return [{ x: sox, y: toy }]
          }
          const x = (sx0 + tox) / 2
          if (x > sx0 - spacing && soy < ty1) {
            const y = Math.min(sy0, ty0) - spacing
            const x = Math.max(sx1, tx1) + spacing
            return [
              { x: sox, y },
              { x, y },
              { x, y: toy }
            ]
          }
          return [
            { x: sox, y: soy },
            { x, y: soy },
            { x, y: toy }
          ]
        } else if (sourceSide === 'top' && targetSide === 'left') {
          if (soy > toy) {
            if (sox > tox) {
              let y = (sy0 + toy) / 2
              if (y > tcy && y < ty1 + spacing && sox > tx1 + spacing) {
                y = ty0 - spacing
              }
              return [
                { x: sox, y },
                { x: tox, y },
                { x: tox, y: toy }
              ]
            }
            return [{ x: sox, y: toy }]
          }
          const x = (sx1 + tox) / 2
          if (x < sx1 + spacing && soy < ty1) {
            const y = Math.min(sy0, ty0) - spacing
            const x = Math.min(sx0, tx0) - spacing
            return [
              { x: sox, y },
              { x, y },
              { x, y: toy }
            ]
          }
          return [
            { x: sox, y: soy },
            { x, y: soy },
            { x, y: toy }
          ]
        } else if (sourceSide === 'bottom' && targetSide === 'right') {
          if (soy < toy) {
            if (sox < tox) {
              let y = (sy1 + ty0) / 2
              if (y < tcy && y > ty0 - spacing && sox < tx0 - spacing) {
                y = ty1 + spacing
              }
              return [
                { x: sox, y },
                { x: tox, y },
                { x: tox, y: toy }
              ]
            }
            return [
              { x: sox, y: soy },
              { x: sox, y: toy },
              { x: tox, y: toy }
            ]
          }
          const x = (sx0 + tox) / 2
          if (x > sx0 - spacing && sy1 > toy) {
            const y = Math.max(sy1, ty1) + spacing
            const x = Math.max(sx1, tx1) + spacing
            return [
              { x: sox, y },
              { x, y },
              { x, y: toy }
            ]
          }
          return [
            { x: sox, y: soy },
            { x, y: soy },
            { x, y: toy },
            { x: tox, y: toy }
          ]
        } else if (sourceSide === 'bottom' && targetSide === 'left') {
          if (soy < toy) {
            if (sox > tox) {
              let y = (sy1 + ty0) / 2
              if (y < tcy && y > ty0 - spacing && sox > tx1 + spacing) {
                y = ty1 + spacing
              }
              return [
                { x: sox, y },
                { x: tox, y },
                { x: tox, y: toy }
              ]
            }
            return [
              { x: sox, y: soy },
              { x: sox, y: toy },
              { x: tox, y: toy }
            ]
          }
          const x = (sx1 + tox) / 2
          if (x < sx1 + spacing && sy1 > toy) {
            const y = Math.max(sy1, ty1) + spacing
            const x = Math.min(sx0, tx0) - spacing
            return [
              { x: sox, y },
              { x, y },
              { x, y: toy }
            ]
          }
          return [
            { x: sox, y: soy },
            { x, y: soy },
            { x, y: toy },
            { x: tox, y: toy }
          ]
        } else if (sourceSide === 'left' && targetSide === 'bottom') {
          if (sox > tox) {
            if (soy < toy) {
              let x = (sx0 + tx1) / 2
              if (x > tcx && x < tx1 + spacing && soy < ty0 - spacing) {
                x = Math.max(sx1, tx1) + spacing
              }
              return [
                { x, y: soy },
                { x, y: toy },
                { x: tox, y: toy }
              ]
            }
            return [{ x: tox, y: soy }]
          }
          const y = (sy0 + ty1) / 2
          if (y > sy0 - spacing) {
            const x = Math.min(sx0, tx0) - spacing
            const y = Math.max(sy1, ty1) + spacing
            return [
              { x, y: soy },
              { x, y },
              { x: tox, y }
            ]
          }
          return [
            { x: sox, y: soy },
            { x: sox, y: y },
            { x: tox, y },
            { x: tox, y: toy }
          ]
        } else if (sourceSide === 'left' && targetSide === 'top') {
          // Analogy to the left - bottom case.
          if (sox > tox) {
            if (soy > toy) {
              let x = (sx0 + tx1) / 2
              if (x > tcx && x < tx1 + spacing && soy > ty1 + spacing) {
                x = Math.max(sx1, tx1) + spacing
              }
              return [
                { x, y: soy },
                { x, y: toy },
                { x: tox, y: toy }
              ]
            }
            return [{ x: tox, y: soy }]
          }
          const y = (sy1 + ty0) / 2
          if (y < sy1 + spacing) {
            const x = Math.min(sx0, tx0) - spacing
            const y = Math.min(sy0, ty0) - spacing
            return [
              { x, y: soy },
              { x, y },
              { x: tox, y }
            ]
          }
          return [
            { x: sox, y: soy },
            { x: sox, y: y },
            { x: tox, y },
            { x: tox, y: toy }
          ]
        } else if (sourceSide === 'right' && targetSide === 'top') {
          // Analogy to the right - bottom case.
          if (sox < tox) {
            if (soy > toy) {
              let x = (sx1 + tx0) / 2
              if (x < tcx && x > tx0 - spacing && soy > ty1 + spacing) {
                x = Math.max(sx1, tx1) + spacing
              }
              return [
                { x, y: soy },
                { x, y: toy },
                { x: tox, y: toy }
              ]
            }
            return [{ x: tox, y: soy }]
          }
          const y = (sy1 + ty0) / 2
          if (y < sy1 + spacing) {
            const x = Math.max(sx1, tx1) + spacing
            const y = Math.min(sy0, ty0) - spacing
            return [
              { x, y: soy },
              { x, y },
              { x: tox, y }
            ]
          }
          return [
            { x: sox, y: soy },
            { x: sox, y: y },
            { x: tox, y },
            { x: tox, y: toy }
          ]
        } else if (sourceSide === 'right' && targetSide === 'bottom') {
          // Analogy to the right - top case.
          if (sox < tox) {
            if (soy < toy) {
              let x = (sx1 + tx0) / 2
              if (x < tcx && x > tx0 - spacing && soy < ty0 - spacing) {
                x = Math.min(sx0, tx0) - spacing
              }
              return [
                { x, y: soy },
                { x, y: toy },
                { x: tox, y: toy }
              ]
            }
            return [
              { x: sox, y: soy },
              { x: tox, y: soy },
              { x: tox, y: toy }
            ]
          }
          const y = (sy0 + ty1) / 2
          if (y > sy0 - spacing) {
            const x = Math.max(sx1, tx1) + spacing
            const y = Math.max(sy1, ty1) + spacing
            return [
              { x, y: soy },
              { x, y },
              { x: tox, y }
            ]
          }
          return [
            { x: sox, y: soy },
            { x: sox, y: y },
            { x: tox, y },
            { x: tox, y: toy }
          ]
        }
    },
    zoomIn (val) {
      this.paperScroller.zoom(0.2, { max: val })
    },
    zoomOut (val) {
      this.paperScroller.zoom(-0.2, { min: val })
    }
  },
  mounted () {
    // 初始化jonit
    this.graph = new dia.Graph({}, { cellNamespace: this.nameSpace })

    this.commandManager = new dia.CommandManager({ graph: this.graph })

    this.paper = new dia.Paper({
      model: this.graph,
      width: 800, // FIXME 应该是纸张尺寸，具体调试看下
      height: 600,
      background: { color: '#FAFAFA' },
      cellViewNamespace: this.nameSpace,
      gridSize: 10,
      drawGrid: true,
      async: false,
      defaultLink: new shapes.standard.Link(), // TODO 自定义连线样式
      interactive: { linkMove: true },
      defaultConnectionPoint: {
        name: 'boundary',
        args: {
          offset: 0,
          extrapolate: true
        }
      },
      defaultRouter: { name: 'rightAngle', args: { margin: 28 } },
      defaultConnector: {
        name: 'straight',
        args: { cornerType: 'line', cornerPreserveAspectRatio: true }
      },
      // defaultRouter: { name: 'rightAngle', args: { margin: 20 } },
      // defaultConnector: {
      //   name: 'straight',
      //   args: { cornerType: 'line', cornerPreserveAspectRatio: false }
      // },
      // TODO 其它配置
      highlighting: {
        connecting: {
          name: 'mask',
          options: {
            attrs: {
              stroke: '#80aaff',
              'stroke-width': 4,
              'stroke-linecap': 'butt',
              'stroke-linejoin': 'miter'
            }
          }
        }
      }
    })

    this.snaplines = new ui.Snaplines({ paper: this.paper })

    this.paperScroller = new ui.PaperScroller({
      paper: this.paper,
      autoResizePaper: true,
      scrollWhileDragging: true,
      cursor: 'grab'
    })

    this.$refs.graphEditorContainer.appendChild(this.paperScroller.render().el)

    this.paper.on('paper:pan', (evt, tx, ty) => {
      evt.preventDefault()
      this.paperScroller.el.scrollLeft += tx
      this.paperScroller.el.scrollTop += ty
    })

    this.paper.on('paper:pinch', (evt, ox, oy, scale) => {
      // the default is already prevented
      const zoom = this.paperScroller.zoom()
      this.paperScroller.zoom(zoom * scale, { min: 0.2, max: 5, ox, oy, absolute: true })
    })

    this.paper.on('blank:pointerdown', () => {
      this.removeAllTools()
    })

    this.paper.on('link:pointerdblclick', (linkView) => {
      this.removeAllTools()
      this.showLinkTools(linkView)
    })

    this.paper.on('cell:pointerdblclick', (cell, evt, x, y) => {
      if (cell.model.attributes.type === 'standard.Link') {
        return
      }
      this.$refs.blockEditModal.show(cell.model.attributes.data)
      this.$nextTick(() => {
        this.$refs.blockEditModal.$el.focus()
      })
    })

    this.paperScroller.on('scroll', () => {
      this.$vbus.$emit('SYNC_GRAPH_SCALE')
    })

    this.initPageGraphDto()

    this.$store.commit('setGraph', this.graph)
    this.$store.commit('setCommandManager', this.commandManager)
    this.$store.commit('setPaper', this.paper)
    this.$store.commit('setSnaplines', this.snaplines)
    this.$store.commit('setCurrentPaper', this.paperScroller)

    selectionKeyBoard()

    this.$vbus.$on('REFRESH_WORK_AREA', this.refreshDesc)
    this.$vbus.$on('RELOAD_WORK_AREA', this.reset)
    this.$vbus.$on('SAVE_SUCCEEDED', this.refreshDesc)
    this.$vbus.$on('FOCUS', this.focus)
    this.$vbus.$on('UNDO', this.undo)
    this.$vbus.$on('REDO', this.redo)
    this.$vbus.$on('RESET_SCALE', this.resetScale)
    this.$vbus.$on('ZOOM_IN', this.zoomIn)
    this.$vbus.$on('ZOOM_OUT', this.zoomOut)
    this.$vbus.$on('FIT_TO_SCREEN', this.fitToScreen)
  },
  destroyed () {
    this.$vbus.$off('REFRESH_WORK_AREA', this.refreshDesc)
    this.$vbus.$off('RELOAD_WORK_AREA', this.reset)
    this.$vbus.$off('SAVE_SUCCEEDED', this.refreshDesc)
    this.$vbus.$off('FOCUS', this.focus)
    this.$vbus.$off('UNDO', this.undo)
    this.$vbus.$off('REDO', this.redo)
    this.$vbus.$off('RESET_SCALE', this.resetScale)
    this.$vbus.$off('ZOOM_IN', this.zoomIn)
    this.$vbus.$off('ZOOM_OUT', this.zoomOut)
    this.$vbus.$off('FIT_TO_SCREEN', this.fitToScreen)
  }
}
</script>
<style lang="scss" scoped>
.graphEditorViewContainer {
  position: relative;
  height: 100%;
  background-color: #f5f5f5;
}
</style>
<style lang="scss">
.graphEditorContainer {
  position: relative;
  height: 100%;
  width: 100%;
  overflow: hidden;
}
</style>
