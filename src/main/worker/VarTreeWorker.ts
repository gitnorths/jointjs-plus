import * as R from 'ramda'
import * as path from 'path'
import * as fse from 'fs-extra'
import Database from 'better-sqlite3-multiple-ciphers'
import { parentPort } from 'node:worker_threads'
import { CUSTOM_PARAM_INST_NAME, DEVICE_FILE_EXT_NAME } from '@/util/consts'
import { EnableStatusEnum, SymbolTypeEnum } from '@/model/enum'
import {
  VarTreeBoard,
  VarTreeConfig,
  VarTreeCore,
  VarTreeInput,
  VarTreeOutput,
  VarTreePage,
  VarTreeParam,
  VarTreeProcess,
  VarTreeSymbol
} from '@/model/dto'

function convertPageRow (parentPage: VarTreePage, pagePageMap: Map<string, any[]>, type: string, symbolGroup: Partial<Record<string, any[]>>, inputGroup: Partial<Record<string, any[]>>, outputGroup: Partial<Record<string, any[]>>, paramGroup: Partial<Record<string, any[]>>, customParamConstGroup: Partial<Record<string, any[]>>) {
  if (/custom/.test(type)) {
    const consts = customParamConstGroup[parentPage.id]
    if (consts && R.isNotEmpty(consts)) {
      for (const symbolBlockEntity of consts) {
        const outputs = outputGroup[symbolBlockEntity.id]
        if (outputs && R.isNotEmpty(outputs)) {
          outputs.forEach((row) => parentPage.customs.push(new VarTreeParam(row)))
        }
      }
    }
  } else {
    const symbols = symbolGroup[parentPage.id]
    if (symbols && R.isNotEmpty(symbols)) {
      for (const symbolBlockEntity of symbols) {
        const sb = new VarTreeSymbol(symbolBlockEntity)
        if (/symbol/.test(type)) {
          sb.noChildren = true
        } else if (/input/.test(type)) {
          const inputs = inputGroup[sb.id]
          if (inputs && R.isNotEmpty(inputs)) {
            sb.inputs = inputs.map((row) => new VarTreeInput(row))
          }
        } else if (/output/.test(type)) {
          const outputs = outputGroup[sb.id]
          if (outputs && R.isNotEmpty(outputs)) {
            sb.outputs = outputs.map((row) => new VarTreeOutput(row))
          }
        } else if (/param/.test(type)) {
          const params = paramGroup[sb.id]
          if (params && R.isNotEmpty(params)) {
            sb.params = params.map((row) => new VarTreeParam(row))
          }
        }
        parentPage.symbols.push(sb)
      }
    }
    parentPage.symbols = parentPage.symbols.sort((a, b) => a.orderInPage - b.orderInPage)
  }

  const subPages = pagePageMap.get(parentPage.id)
  if (subPages && R.isNotEmpty(subPages)) {
    for (const subPage of subPages) {
      const varTreePage = new VarTreePage(subPage)
      convertPageRow(varTreePage, pagePageMap, type, symbolGroup, inputGroup, outputGroup, paramGroup, customParamConstGroup)
      parentPage.pages.push(varTreePage)
    }
  }
  parentPage.pages = parentPage.pages.sort((a, b) => a.index - b.index)
}

function getVarTreeConfig ({
  device, optBoardRows, coreGroup, processGroup, processPageMap, corePageMap, pagePageMap, symbolGroup, inputGroup,
  outputGroup, paramGroup, customParamConstGroup
}: any, type: string) {
  const varTreeConfig = new VarTreeConfig(device)
  varTreeConfig.name = device.series
  varTreeConfig.setTitle()

  if (optBoardRows && R.isNotEmpty(optBoardRows)) {
    for (const optBoard of optBoardRows) {
      const varTreeBoard = new VarTreeBoard(optBoard)
      const cpuCores = coreGroup[optBoard.id]
      if (cpuCores && R.isNotEmpty(cpuCores)) {
        for (const cpuCore of cpuCores) {
          const varTreeCore = new VarTreeCore(cpuCore)
          const processItems = processGroup[cpuCore.id]
          if (processItems && R.isNotEmpty(processItems)) {
            for (const processEntity of processItems) {
              const varTreeProcess = new VarTreeProcess(processEntity)
              const processPages = processPageMap.get(varTreeProcess.id)
              if (processPages && R.isNotEmpty(processPages)) {
                for (const pageEntity of processPages) {
                  const varTreePage = new VarTreePage(pageEntity)
                  convertPageRow(varTreePage, pagePageMap, type, symbolGroup, inputGroup, outputGroup, paramGroup, customParamConstGroup)
                  varTreeProcess.pages.push(varTreePage)
                }
              }
              // 根据index排序
              varTreeProcess.pages = varTreeProcess.pages.sort((a, b) => a.index - b.index)
              varTreeCore.processes.push(varTreeProcess)
            }
          }
          const corePages = corePageMap.get(varTreeCore.id)
          if (corePages && R.isNotEmpty(corePages)) {
            for (const corePage of corePages) {
              const varTreePage = new VarTreePage(corePage)
              convertPageRow(varTreePage, pagePageMap, type, symbolGroup, inputGroup, outputGroup, paramGroup, customParamConstGroup)
              varTreeCore.pages.push(varTreePage)
            }
          }
          // 根据index排序
          varTreeCore.processes = varTreeCore.processes.sort((a, b) => a.index - b.index)
          varTreeCore.pages = varTreeCore.pages.sort((a, b) => a.index - b.index)
          varTreeBoard.cores.push(varTreeCore)
        }
      }
      varTreeBoard.cores = varTreeBoard.cores.sort((a, b) => {
        if (a.cpuIndex === b.cpuIndex) {
          return a.coreIndex - b.coreIndex
        } else {
          return a.cpuIndex - b.cpuIndex
        }
      })
      varTreeConfig.boards.push(varTreeBoard)
    }
  }
  varTreeConfig.boards = varTreeConfig.boards.sort((a, b) => a.slot - b.slot)
  return varTreeConfig
}

async function generateVarTree (dbPath: string) {
  // 检查路径是否存在
  if (!dbPath.endsWith(DEVICE_FILE_EXT_NAME)) {
    throw new Error(`打开装置失败！${dbPath}文件名错误，请选择*${DEVICE_FILE_EXT_NAME}文件`)
  }
  const realPath = path.resolve(dbPath)
  if (!fse.existsSync(realPath)) {
    throw new Error(`打开装置失败！${realPath}不存在`)
  }
  const db = new Database(realPath)
  try {
    const deviceRows = db.prepare('SELECT * FROM device').all()
    if (R.isEmpty(deviceRows)) {
      // 不存在实体
      throw new Error('打开装置失败！数据为空')
    } else if (deviceRows.length > 1) {
      throw new Error('打开装置失败！存在脏数据')
    }
    const device = deviceRows[0]

    const optBoardRows: any[] = db.prepare(`SELECT *
                                            FROM pg_optional_board
                                            ORDER BY slot`).all()
    const cpuCoreRows: any[] = db.prepare(`SELECT *
                                           FROM pg_cpu_core`).all()
    const processRows: any[] = db.prepare(`SELECT *
                                           FROM pg_process
                                           ORDER BY 'index'`).all()
    const pageRows: any[] = db.prepare(`SELECT *
                                        FROM pg_page
                                        WHERE snippetId IS NULL `).all()
    // 级联查询的性能问题
    const symbolRows: any[] = db.prepare(`SELECT *
                                          FROM pg_symbol_block_inst
                                          WHERE pageId IN (SELECT id FROM pg_page WHERE snippetId IS NULL)
                                            AND status != ${EnableStatusEnum.DIRTY}
                                          ORDER BY orderInPage`).all()
    const inputRows: any[] = db.prepare(`SELECT *
                                         FROM pg_var_input_inst
                                         WHERE symbolBlockId IN (SELECT id
                                                                 FROM pg_symbol_block_inst
                                                                 WHERE pageId IN (SELECT id FROM pg_page WHERE snippetId IS NULL)
                                                                   AND status != ${EnableStatusEnum.DIRTY})
                                         ORDER BY 'index'`).all()
    const outputRows: any[] = db.prepare(`SELECT *
                                          FROM pg_var_output_inst
                                          WHERE symbolBlockId IN (SELECT id
                                                                  FROM pg_symbol_block_inst
                                                                  WHERE pageId IN (SELECT id FROM pg_page WHERE snippetId IS NULL)
                                                                    AND status != ${EnableStatusEnum.DIRTY})
                                          ORDER BY 'index'`).all()
    const paramRows: any[] = db.prepare(`SELECT *
                                         FROM pg_var_param_inst
                                         WHERE symbolBlockId IN (SELECT id
                                                                 FROM pg_symbol_block_inst
                                                                 WHERE pageId IN (SELECT id FROM pg_page WHERE snippetId IS NULL)
                                                                   AND status != ${EnableStatusEnum.DIRTY})
                                         ORDER BY 'index'`).all()

    const corePageMap = new Map()
    const processPageMap = new Map()
    const pagePageMap = new Map()
    if (pageRows && R.isNotEmpty(pageRows)) {
      for (const page of pageRows) {
        if (page.coreId) {
          const arr = corePageMap.get(page.coreId) || []
          arr.push(page)
          corePageMap.set(page.coreId, arr)
        } else if (page.processItemId) {
          const arr = processPageMap.get(page.processItemId) || []
          arr.push(page)
          processPageMap.set(page.processItemId, arr)
        } else if (page.parentPageId) {
          const arr = pagePageMap.get(page.parentPageId) || []
          arr.push(page)
          pagePageMap.set(page.parentPageId, arr)
        }
      }
    }

    const coreGroup = R.groupBy<any>(R.prop('optBoardId'))(cpuCoreRows)
    const processGroup = R.groupBy<any>(R.prop('coreId'))(processRows)

    const inputGroup = R.groupBy<any>(R.prop('symbolBlockId'))(inputRows)
    const outputGroup = R.groupBy<any>(R.prop('symbolBlockId'))(outputRows)
    const paramGroup = R.groupBy<any>(R.prop('symbolBlockId'))(paramRows)

    const customParamConstRows: any[] = []
    const compoRows: any[] = []
    symbolRows.forEach(row => {
      if (row.type === SymbolTypeEnum.SYM_EXTEND) {
        if (/base\/extend\/CConstBlock/i.test(row.pathId)) {
          const outputs = outputGroup[row.id]
          if (outputs && R.isNotEmpty(outputs)) {
            let flag = false
            for (const output of outputs) {
              if (new RegExp(CUSTOM_PARAM_INST_NAME).test(output.sAddr)) {
                flag = true
                break
              }
            }
            if (flag) {
              customParamConstRows.push(row)
            }
          }
        }
      } else {
        compoRows.push(row)
      }
    })
    const symbolGroup = R.groupBy<any>(R.prop('pageId'))(compoRows)
    const customParamConstGroup = R.groupBy<any>(R.prop('pageId'))(customParamConstRows)

    const request = {
      device,
      optBoardRows,
      coreGroup,
      processGroup,
      processPageMap,
      corePageMap,
      pagePageMap,
      symbolGroup,
      inputGroup,
      outputGroup,
      paramGroup,
      customParamConstGroup
    }

    const symbolTree = getVarTreeConfig(request, 'symbol')
    const inputTree = getVarTreeConfig(request, 'input')
    const outputTree = getVarTreeConfig(request, 'output')
    const paramTree = getVarTreeConfig(request, 'param')
    const customTree = getVarTreeConfig(request, 'custom')
    return { symbol: symbolTree, input: inputTree, output: outputTree, param: paramTree, custom: customTree }
  } finally {
    db.close()
  }
}

// 执行查询并将结果发送给主进程
parentPort?.on('message', async (message) => {
  // FIXME
  console.log('Received message from main thread:', message)
  const result = await generateVarTree(message.dbPath)
  // 将结果发送回主线程
  parentPort?.postMessage(result)
})
