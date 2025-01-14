import * as path from 'path'
import * as R from 'ramda'
import { v4 as uuid } from 'uuid'
import * as fse from 'fs-extra'
import { ElementCompact, xml2js } from 'xml-js'
import {
  ConnectLine,
  ControlGroup,
  ControlGroupItem,
  CpuCoreInfo,
  Device,
  DeviceConfig,
  EventInfoGroup,
  EventInfoGroupItem,
  HardwareConfig,
  HMIConfig,
  LabelIn,
  LabelOut,
  LcdMenu,
  LcdMenuConfig,
  LcdMenuRefData,
  LEDConfigItem,
  MacroDefine,
  MainBoardConfig,
  MainBoardSlotConfig,
  ModelBoard,
  Page,
  PageAnnotation,
  PanelConfig,
  PGSnippet,
  ProgramBoard,
  ProgramConfig,
  ProgramSnippet,
  ProtoSymbolArchive,
  ProtoSymbolBlock,
  ProtoSymbolLib,
  RecordGroup,
  RecordGroupItem,
  ReportGroup,
  ReportGroupItem,
  SettingGroup,
  SettingGroupConfig,
  SettingGroupItem,
  SettingGroupItemMerge,
  SignalGroupConfig,
  StateGroup,
  StateGroupItem,
  SymbolBlockInst,
  SymbolBlockVarInnerInst,
  SymbolBlockVarInputInst,
  SymbolBlockVarOtherInst,
  SymbolBlockVarOutputInst,
  SymbolBlockVarParamInst,
  SymbolBlockVersion,
  WaveConfig,
  WaveFrequencyItem,
  WaveGroup,
  WaveGroupConfig,
  WaveGroupItem,
  WaveInst
} from '@/model/dto'
import {
  EnableStatusEnum,
  getDbCatEnumFromString,
  getSymbolTypeEnum,
  getVariableTypeEnum,
  LEDColorEnum,
  LEDTypeEnum,
  SignalClassifyEnum,
  SymbolTypeEnum,
  TaskLevelEnum,
  TripTypeEnum,
  WaveAttrEnum,
  WaveFrequencyTypeEnum,
  WaveLevelEnum,
  WavePriorityEnum,
  WaveTriggerTypeEnum,
  YesNoEnum
} from '@/model/enum'
import { SymbolLibLoader } from '@/service/symbolMaker/loader/SymbolLibLoader'
import { format10, formatSaddrPrefix, formatVersion, getExponents } from '@/util'
import { CUSTOM_PARAM_INST_NAME } from '@/util/consts'

export class DeviceLoader {
  device: Device
  symbolLibLoader: SymbolLibLoader
  symbolBlockVersionMap: Map<string, SymbolBlockVersion>
  modelBoardMap: Map<string, ModelBoard>
  boardInMap: Map<string, LabelIn>
  boardOutMap: Map<string, LabelOut>
  signalMap: Map<string, { id: string, sAddr: string, desc: string, customDesc: string, abbr: string }>

  constructor () {
    this.device = new Device()
    this.symbolLibLoader = new SymbolLibLoader()
    this.symbolBlockVersionMap = new Map()
    this.modelBoardMap = new Map()
    this.boardInMap = new Map()
    this.boardOutMap = new Map()
    this.signalMap = new Map()
  }

  public loadDevice (plsymPath: string, deviceName: string) {
    if (!fse.existsSync(plsymPath)) {
      return this.device
    }
    this.device.id = uuid()
    this.device.series = path.basename(path.dirname(path.dirname(plsymPath)))
    this.device.version = path.basename(path.dirname(plsymPath))
    this.device.hardware = new HardwareConfig(null, this.device)
    this.device.hardware.mainBoardConfig = new MainBoardConfig(null, this.device.hardware)
    this.device.hardware.panelConfig = new PanelConfig(null, this.device.hardware)
    this.device.program = new ProgramConfig(this.device)
    this.device.program.snippet = new ProgramSnippet(this.device.program)
    this.device.config = new DeviceConfig(this.device)
    this.device.config.hmiConfig = new HMIConfig(this.device.config)
    this.device.config.hmiConfig.lcdMenu = new LcdMenuConfig(this.device.config.hmiConfig)
    this.device.config.hmiConfig.waveConfig = new WaveGroupConfig(this.device.config.hmiConfig)
    this.device.config.signalGroup = new SignalGroupConfig(this.device.config)
    this.device.config.settingGroup = new SettingGroupConfig({ currentSection: 1, sectionNum: 32 }, this.device.config)

    // 先导入符号库，devdata里的符号实例信息不全
    this.loadSymbolArchive(plsymPath)
    this.loadDevData(path.join(path.dirname(plsymPath), 'devdata'))
    // 格式化数据，searchPath coreName等
    this.reformatData()

    // FIXME 最后修改为传入的名字，注意数据库有没有用旧的名字
    this.device.series = deviceName
    return this.device
  }

  private reformatData () {
    if (R.isNotEmpty(this.device.program.snippet.snippets)) {
      for (const snippet of this.device.program.snippet.snippets) {
        if (R.isNotEmpty(snippet.pages)) {
          for (const page of snippet.pages) {
            page.searchPath = `${this.device.program.snippet.id}/${snippet.name}/${page.name}`
            this.reformatPage(page)
          }
        }
      }
    }
    if (R.isNotEmpty(this.device.program.optBoards)) {
      for (const board of this.device.program.optBoards) {
        if (R.isNotEmpty(board.cpuCores)) {
          for (const core of board.cpuCores) {
            core.name = `P${core.cpuIndex}C${core.coreIndex}`
            if (R.isNotEmpty(core.processItems)) {
              for (const processItem of core.processItems) {
                if (R.isNotEmpty(processItem.pages)) {
                  for (const page of processItem.pages) {
                    page.searchPath = `B${format10(board.slot)}/${board.type}/${core.name}/${processItem.name}/${page.name}`
                    this.reformatPage(page)
                  }
                }
              }
            }
            if (R.isNotEmpty(core.pages)) {
              for (const page of core.pages) {
                page.searchPath = `B${format10(board.slot)}/${board.type}/${core.name}/${page.name}`
                this.reformatPage(page)
              }
            }
          }
        }
      }
    }
  }

  private reformatPage (page: Page) {
    if (R.isNotEmpty(page.symbolBlocks)) {
      for (const symbolBlock of page.symbolBlocks) {
        symbolBlock.searchPath = `${page.searchPath}/${symbolBlock.instName}`
        if (R.isNotEmpty(symbolBlock.inputs)) {
          symbolBlock.inputs.forEach(item => {
            item.searchPath = `${symbolBlock.searchPath}.${item.name}`
          })
        }
        if (R.isNotEmpty(symbolBlock.outputs)) {
          symbolBlock.outputs.forEach(item => {
            item.searchPath = `${symbolBlock.searchPath}.${item.name}`
          })
        }
        if (R.isNotEmpty(symbolBlock.params)) {
          symbolBlock.params.forEach(item => {
            item.searchPath = `${symbolBlock.searchPath}.${item.name}`
          })
        }
        if (R.isNotEmpty(symbolBlock.inners)) {
          symbolBlock.inners.forEach(item => {
            item.searchPath = `${symbolBlock.searchPath}.${item.name}`
          })
        }
        if (R.isNotEmpty(symbolBlock.others)) {
          symbolBlock.others.forEach(item => {
            item.searchPath = `${symbolBlock.searchPath}.${item.name}`
          })
        }
      }
    }
    if (R.isNotEmpty(page.inLabels)) {
      for (const inLabel of page.inLabels) {
        inLabel.searchPath = `${page.searchPath}/${inLabel.instName}` // FIXME
      }
    }
    if (R.isNotEmpty(page.outLabels)) {
      for (const outLabel of page.outLabels) {
        outLabel.searchPath = `${page.searchPath}/${outLabel.instName}` // FIXME
      }
    }
    if (R.isNotEmpty(page.pages)) {
      for (const subPage of page.pages) {
        subPage.searchPath = `${page.searchPath}/${subPage.name}`
        this.reformatPage(subPage)
      }
    }
  }

  private getVarMap (page: Page) {
    const labelInMap = new Map()
    const labelOutMap = new Map()
    const symbolVarInMap = new Map()
    const symbolVarOutMap = new Map()
    if (R.isNotEmpty(page.inLabels)) {
      for (const label of page.inLabels) {
        labelInMap.set(label.searchPath, label)
      }
    }
    if (R.isNotEmpty(page.outLabels)) {
      for (const label of page.outLabels) {
        labelOutMap.set(label.searchPath, label)
      }
    }
    if (R.isNotEmpty(page.symbolBlocks)) {
      for (const symbolBlock of page.symbolBlocks) {
        if (R.isNotEmpty(symbolBlock.inputs)) {
          for (const input of symbolBlock.inputs) {
            symbolVarInMap.set(input.searchPath, input)
          }
        }
        if (R.isNotEmpty(symbolBlock.outputs)) {
          for (const output of symbolBlock.outputs) {
            symbolVarOutMap.set(output.searchPath, output)
          }
        }
      }
    }
    return { labelInMap, labelOutMap, symbolVarInMap, symbolVarOutMap }
  }

  private fillSymbolBlockInst (Ref_symbol_path: string, symbolBlock: SymbolBlockInst) {
    const symbolBlockVersion = this.symbolBlockVersionMap.get(Ref_symbol_path)
    if (!symbolBlockVersion) {
      throw new Error('导入失败，找不到对应的符号块原型：' + Ref_symbol_path)
    }
    // 补齐信息
    symbolBlock.name = symbolBlockVersion.name
    symbolBlock.desc = symbolBlockVersion.desc
    symbolBlock.orgDesc = symbolBlockVersion.desc
    symbolBlock.pathId = symbolBlockVersion.pathId

    const symbolBlockVarMap = new Map()
    // 输入输出等。。。实例化
    if (R.isNotEmpty(symbolBlockVersion.inputs)) {
      symbolBlockVersion.inputs.forEach((proto) => {
        const inst = new SymbolBlockVarInputInst(proto)
        inst.id = uuid()
        if (symbolBlock.sAddr) {
          inst.sAddr = `${symbolBlock.sAddr}.${inst.regName || inst.name}`
        }
        inst.symbolBlockId = symbolBlock.id
        symbolBlock.inputs.push(inst)
        symbolBlockVarMap.set(`${Ref_symbol_path}/${symbolBlockVersion.name.toLowerCase()}.${inst.name}`, inst)
      })
    }
    if (R.isNotEmpty(symbolBlockVersion.outputs)) {
      symbolBlockVersion.outputs.forEach((proto) => {
        const inst = new SymbolBlockVarOutputInst(proto)
        inst.id = uuid()
        if (symbolBlock.sAddr) {
          inst.sAddr = `${symbolBlock.sAddr}.${inst.regName || inst.name}`
        }
        inst.symbolBlockId = symbolBlock.id
        symbolBlock.outputs.push(inst)
        symbolBlockVarMap.set(`${Ref_symbol_path}/${symbolBlockVersion.name.toLowerCase()}.${inst.name}`, inst)
      })
    }
    if (R.isNotEmpty(symbolBlockVersion.params)) {
      symbolBlockVersion.params.forEach((proto) => {
        const inst = new SymbolBlockVarParamInst(proto)
        inst.id = uuid()
        if (symbolBlock.sAddr) {
          inst.sAddr = `${symbolBlock.sAddr}.${inst.regName || inst.name}`
        }
        inst.symbolBlockId = symbolBlock.id
        symbolBlock.params.push(inst)
        symbolBlockVarMap.set(`${Ref_symbol_path}/${symbolBlockVersion.name.toLowerCase()}.${inst.name}`, inst)
      })
    }
    if (R.isNotEmpty(symbolBlockVersion.inners)) {
      symbolBlockVersion.inners.forEach((proto) => {
        const inst = new SymbolBlockVarInnerInst(proto)
        inst.id = uuid()
        if (symbolBlock.sAddr) {
          inst.sAddr = `${symbolBlock.sAddr}.${inst.regName || inst.name}`
        }
        inst.symbolBlockId = symbolBlock.id
        symbolBlock.inners.push(inst)
        symbolBlockVarMap.set(`${Ref_symbol_path}/${symbolBlockVersion.name.toLowerCase()}.${inst.name}`, inst)
      })
    }
    if (R.isNotEmpty(symbolBlockVersion.others)) {
      symbolBlockVersion.others.forEach((proto) => {
        const inst = new SymbolBlockVarOtherInst(proto)
        inst.id = uuid()
        if (symbolBlock.sAddr) {
          inst.sAddr = `${symbolBlock.sAddr}.${inst.regName || inst.name}`
        }
        inst.symbolBlockId = symbolBlock.id
        symbolBlock.others.push(inst)
        symbolBlockVarMap.set(`${Ref_symbol_path}/${symbolBlockVersion.name.toLowerCase()}.${inst.name}`, inst)
      })
    }
    return symbolBlockVarMap
  }

  private loadSymbolArchive (plsymPath: string) {
    const snippetEles = new Map()
    // TODO 将源文件拷贝到新工程的指定目录
    const content = fse.readFileSync(plsymPath, { encoding: 'utf-8' })
    const contentEle = xml2js(content, { alwaysChildren: true })
    const symPKGEle = contentEle.elements[0]
    if (R.isNotEmpty(symPKGEle.elements)) {
      for (const ele of symPKGEle.elements) {
        const archive = new ProtoSymbolArchive({
          name: ele.name,
          pathId: ele.name.toLowerCase()
        })
        this.device.symbolArchives.push(archive)

        if (R.isNotEmpty(ele.elements)) {
          for (const libEle of ele.elements) {
            const { type } = libEle.attributes
            const libPathId = `${archive.pathId}/${libEle.name}`.toLowerCase()
            if (/SYM_COMPONENT_GP$/.test(type)) {
              snippetEles.set(libPathId, libEle)
            }
            if (!/SYM_(EXTEND|CONST|OP|COMM|GRAPH|LCD|VARGROUP)$/.test(type)) {
              const lib = new ProtoSymbolLib({
                name: libEle.name,
                pathId: libPathId
              })
              this.loadProtoSymbolBlock(libEle, plsymPath, lib)
              archive.children.push(lib)
            }
          }
        }
        archive.children.forEach((lib, index) => (lib.index = index))
      }
    }
    if (R.isNotEmpty(snippetEles)) {
      for (const [libPathId, libEle] of snippetEles) {
        // 组合符号导入到snippets
        // 解析.gsym和.gdat
        const snippet = new PGSnippet({
          id: uuid(),
          name: libEle.name
        }, this.device.program.snippet)
        this.device.program.snippet.snippets.push(snippet)
        this.loadSnippetPage(libEle, plsymPath, libPathId, snippet)
      }
      this.device.program.snippet.snippets.forEach((snippet, index) => (snippet.index = index))
    }
  }

  private loadProtoSymbolBlock (libEle: ElementCompact, plsymPath: string, lib: ProtoSymbolLib) {
    if (R.isNotEmpty(libEle.elements)) {
      for (const symbolEle of libEle.elements) {
        const { sym_path } = symbolEle.attributes
        const symPath = path.join(path.dirname(plsymPath), sym_path)
        if (!fse.existsSync(symPath)) {
          throw new Error('加载符号原型失败，图形文件不存在：' + symPath)
        }
        const dataPath = symPath.replace(/\.sym$/, '.data')
        if (!fse.existsSync(dataPath)) {
          throw new Error('加载符号原型失败，模型文件不存在：' + dataPath)
        }
        const version = path.basename(path.dirname(symPath))
        const name = path.basename(path.dirname(path.dirname(symPath)))

        const { type } = libEle.attributes
        const symbolType = getSymbolTypeEnum(type)
        const symbolBlockProto = new ProtoSymbolBlock({
          name,
          version: formatVersion(version),
          type: symbolType,
          pathId: `${lib.pathId}/${name}/${formatVersion(version)}`.toLowerCase()
        })
        const symbolBlockVersion = new SymbolBlockVersion(symbolBlockProto)
        this.symbolLibLoader.loadSymbolModel(dataPath, symbolBlockVersion)
        this.symbolLibLoader.loadSymbolGraph(symPath, symbolBlockVersion)

        symbolBlockProto.model = symbolBlockVersion.modelFile
        symbolBlockProto.graphic = symbolBlockVersion.graphicFile
        lib.children.push(symbolBlockProto)

        // 用map记录
        // Ref_symbol_path="/mathop/Add2/1.0
        this.symbolBlockVersionMap.set(`/${lib.name}/${symbolBlockProto.name}/${version}`, symbolBlockVersion)
      }
      lib.children.forEach((symbol, index) => (symbol.index = index))
    }
  }

  private loadSnippetPage (libEle: ElementCompact, plsymPath: string, libPathId: string, snippet: PGSnippet) {
    if (R.isNotEmpty(libEle.elements)) {
      for (const symbolEle of libEle.elements) {
        const { name, version, sym_path } = symbolEle.attributes
        const dataPath = path.join(path.dirname(plsymPath), sym_path).replace(/\.sym$/, '.gdat')
        if (!fse.existsSync(dataPath)) {
          throw new Error('加载组合符号，数据文件不存在：' + dataPath)
        }
        const symPath = dataPath.replace(/\.gdat$/, '.gsym')
        if (!fse.existsSync(symPath)) {
          throw new Error('加载组合符号，图形文件不存在：' + symPath)
        }

        const page = new Page({
          id: uuid(),
          isFolder: YesNoEnum.NO,
          isSnippet: YesNoEnum.YES,
          searchPath: `/${libEle.name}/${name}/${version}`,
          name,
          status: EnableStatusEnum.ON,
          pageSymbolPathId: `${libPathId}/${name}/${formatVersion(version)}`.toLowerCase() // 组合符号pathId
        }, snippet)
        snippet.pages.push(page)

        this.loadSnippetPageData(dataPath, page)

        this.loadSnippetPageSym(symPath, page)

        snippet.pages.forEach((page, index) => (page.index = index))
      }
    }
  }

  private loadSnippetPageData (dataPath: string, page: Page) {
    const content = fse.readFileSync(dataPath, { encoding: 'utf-8' })
    const contentEle = xml2js(content, { alwaysChildren: true })
    const dataEle = contentEle.elements[0]

    let symbolsElement
    let linesElement
    for (const ele of dataEle.elements) {
      if (/^symbol_group_child_list$/.test(ele.name)) {
        symbolsElement = ele
      } else if (/^symbol_group_var_ex_list$/.test(ele.name)) {
        // FIXME
        // varExElement = ele
      } else if (/^symbol_group_var_link_list$/.test(ele.name)) {
        linesElement = ele
      }
    }

    if (symbolsElement && R.isNotEmpty(symbolsElement.elements)) {
      for (const symbolEle of symbolsElement.elements) {
        const { name, symbol_version } = symbolEle.attributes

        if (/extend\/C(RegInput)Block/.test(symbol_version)) {
          // 注册输入标签
          const [, type] = symbol_version.match(/extend\/C(RegInput)Block/)
          const inputLabel = new LabelIn({
            id: uuid(),
            type,
            scope: 'public',
            instName: name
          })
          if (R.isNotEmpty(symbolEle.elements)) {
            const childVarListEle = symbolEle.elements[0]
            for (const varEle of childVarListEle.elements) {
              inputLabel.searchPath = `${page.searchPath}/${name}/${varEle.attributes.name}`
              for (const varAttrEle of varEle.elements) {
                const { name, value } = varAttrEle.attributes
                if (/^abbr$/.test(name)) {
                  inputLabel.abbr = value
                } else if (/^default$/.test(name)) {
                  inputLabel.default = value
                } else if (/^desc$/.test(name)) {
                  inputLabel.desc = value
                } else if (name === 'name') {
                  inputLabel.name = value
                } else if (name === 'type') {
                  inputLabel.varType = getVariableTypeEnum(value)
                } else if (name === 'value') {
                  inputLabel.value = value
                }
              }
            }
          }
          page.inLabels.push(inputLabel)
        } else if (/extend\/C(RegOutput|RegDebugOutput)Block/.test(symbol_version)) {
          // 注册输出标签
          const [, type] = symbol_version.match(/extend\/C(RegOutput|RegDebugOutput)Block/)
          const outputLabel = new LabelOut({
            id: uuid(),
            type,
            scope: 'public',
            instName: name
          })
          if (R.isNotEmpty(symbolEle.elements)) {
            const childVarListEle = symbolEle.elements[0]
            for (const varEle of childVarListEle.elements) {
              outputLabel.searchPath = `${page.searchPath}/${name}/${varEle.attributes.name}`
              for (const varAttrEle of varEle.elements) {
                const { name, value } = varAttrEle.attributes
                if (/^abbr$/.test(name)) {
                  outputLabel.abbr = value
                } else if (/^default$/.test(name)) {
                  outputLabel.default = value
                } else if (/^desc$/.test(name)) {
                  outputLabel.desc = value
                } else if (name === 'name') {
                  outputLabel.name = value
                } else if (name === 'type') {
                  outputLabel.varType = getVariableTypeEnum(value)
                } else if (name === 'value') {
                  outputLabel.value = value
                }
              }
            }
          }
          page.outLabels.push(outputLabel)
        } else if (/extend\/C(RegParam)Block/.test(symbol_version)) {
          // FIXME 考虑改为带值的输入标签
          // 注册参数，当作具名常量
          const symbolBlock = new SymbolBlockInst({
            id: uuid(),
            name: 'CConstBlock',
            instName: name,
            status: EnableStatusEnum.ON,
            type: SymbolTypeEnum.SYM_EXTEND,
            pathId: 'base/extend/CConstBlock/V1R0P0'.toLowerCase(), // FIXME
            searchPath: `${page.searchPath}/${name}`
          })
          const childVarListEle = symbolEle.elements[0]
          for (const varEle of childVarListEle.elements) {
            const output = new SymbolBlockVarOutputInst({
              id: uuid(),
              index: 0,
              name: 'COut1',
              pathId: `${symbolBlock.pathId}/COut1`.toLowerCase(),
              searchPath: `${symbolBlock.searchPath}/${varEle.attributes.name}`,
              symbolBlockId: symbolBlock.id
            })
            for (const varAttrEle of varEle.elements) {
              const { name, value } = varAttrEle.attributes
              if (/^abbr$/.test(name)) {
                output.abbr = value
              } else if (/^default$/.test(name)) {
                output.default = value
              } else if (/^desc$/.test(name)) {
                output.customDesc = value
              } else if (name === 'name') {
                if (value) {
                  output.regName = value
                }
              } else if (name === 'type') {
                output.type = getVariableTypeEnum(value)
              } else if (name === 'value') {
                output.value = value
              }
            }
            symbolBlock.outputs.push(output)
          }
          page.symbolBlocks.push(symbolBlock)
        } else if (/extend\/C(RegInner)Block/.test(symbol_version)) {
          // TODO 暂时没有用到
        } else if (/extend\/CConstBlock/.test(symbol_version)) {
          // 自定义定值和常量
          // 匿名常量
          const symbolBlock = new SymbolBlockInst({
            id: uuid(),
            name: 'CConstBlock',
            instName: name,
            status: EnableStatusEnum.ON,
            type: SymbolTypeEnum.SYM_EXTEND,
            pathId: `base${formatVersion(symbol_version)}`.toLowerCase(), // FIXME
            searchPath: `${page.searchPath}/${name}`
          })
          const childVarListEle = symbolEle.elements[0]
          for (const varEle of childVarListEle.elements) {
            const { name } = varEle.attributes
            // cconstblock_1_205.COut1
            // const varName = name.replace(`${symbolBlock.instName}.`, '')
            const output = new SymbolBlockVarOutputInst({
              id: uuid(),
              index: 0,
              name: 'COut1',
              searchPath: `${symbolBlock.searchPath}/${name}`,
              pathId: `${symbolBlock.pathId}/COut1`.toLowerCase(),
              symbolBlockId: symbolBlock.id
            })
            for (const varAttrEle of varEle.elements) {
              const { name, value } = varAttrEle.attributes
              if (name === 'name') {
                output.customDesc = value // FIXME 该名称为 不详
              } else if (name === 'type') {
                output.type = getVariableTypeEnum(value)
              } else if (name === 'value') {
                output.value = value
              } else if (name === 'format') {
                output.format = value
              }
            }
            symbolBlock.outputs.push(output)
          }
          page.symbolBlocks.push(symbolBlock)
        } else if (/(extend\/CBrokenCircleBlock)/.test(symbol_version)) {
          const symbolBlock = new SymbolBlockInst({
            id: uuid(),
            name: 'CBrokenCircleBlock',
            instName: name,
            status: EnableStatusEnum.ON,
            type: SymbolTypeEnum.SYM_EXTEND, // FIXME
            pathId: `base${formatVersion(symbol_version)}`.toLowerCase(),
            searchPath: `${page.searchPath}/${name}`
          })
          if (R.isNotEmpty(symbolEle.elements)) {
            const childVarListEle = symbolEle.elements[0]
            for (const varEle of childVarListEle.elements) {
              const { symbol_var, name } = varEle.attributes
              const varName = name.replace(`${symbolBlock.instName}.`, '')
              let io
              if (/CIn/i.test(symbol_var)) {
                io = new SymbolBlockVarInputInst({
                  id: uuid(),
                  name: varName || 'cIn1',
                  index: 0,
                  searchPath: `${symbolBlock.searchPath}/${name}`,
                  pathId: `${symbolBlock.pathId}/${varName}`.toLowerCase(),
                  symbolBlockId: symbolBlock.id
                })
                symbolBlock.inputs.push(io)
              } else {
                io = new SymbolBlockVarOutputInst({
                  id: uuid(),
                  name: varName || 'cOut1',
                  index: 0,
                  searchPath: `${symbolBlock.searchPath}/${name}`,
                  pathId: `${symbolBlock.pathId}/${varName}`.toLowerCase(),
                  symbolBlockId: symbolBlock.id
                })
                symbolBlock.outputs.push(io)
              }
            }
          }
          page.symbolBlocks.push(symbolBlock)
        } else if (/(OP\/cast)/.test(symbol_version)) {
          const symbolBlock = new SymbolBlockInst({
            id: uuid(),
            name: 'Cast',
            instName: name,
            status: EnableStatusEnum.ON,
            type: SymbolTypeEnum.SYM_EXTEND, // FIXME
            pathId: `base${formatVersion(symbol_version)}`.toLowerCase(),
            searchPath: `${page.searchPath}/${name}`
          })
          if (R.isNotEmpty(symbolEle.elements)) {
            const childVarListEle = symbolEle.elements[0]
            for (const varEle of childVarListEle.elements) {
              const { symbol_var, name } = varEle.attributes
              const varName = name.replace(`${symbolBlock.instName}.`, '')
              let io
              if (/CIn/i.test(symbol_var)) {
                io = new SymbolBlockVarInputInst({
                  id: uuid(),
                  name: varName,
                  index: 0,
                  searchPath: `${symbolBlock.searchPath}/${name}`,
                  pathId: `${symbolBlock.pathId}/${varName}`.toLowerCase(),
                  symbolBlockId: symbolBlock.id
                })
                symbolBlock.inputs.push(io)
              } else {
                io = new SymbolBlockVarOutputInst({
                  id: uuid(),
                  name: varName,
                  index: 0,
                  searchPath: `${symbolBlock.searchPath}/${name}`,
                  pathId: `${symbolBlock.pathId}/${varName}`.toLowerCase(),
                  symbolBlockId: symbolBlock.id
                })
                symbolBlock.outputs.push(io)
              }
            }
          }
          page.symbolBlocks.push(symbolBlock)
        } else {
          const symbolBlock = new SymbolBlockInst({
            id: uuid(),
            instName: name,
            status: EnableStatusEnum.ON,
            type: SymbolTypeEnum.SYM_COMPONENT,
            searchPath: `${page.searchPath}/${name}`
          })
          page.symbolBlocks.push(symbolBlock)
          const symbolBlockVarMap = this.fillSymbolBlockInst(symbol_version, symbolBlock)

          if (R.isNotEmpty(symbolEle.elements)) {
            const childVarListEle = symbolEle.elements[0]
            if (R.isNotEmpty(childVarListEle.elements)) {
              for (const varEle of childVarListEle.elements) {
                const { symbol_var, name } = varEle.attributes
                const varObj = symbolBlockVarMap.get(symbol_var.replace(/\[0*([0-9]+)]/, '[$1]'))
                if (varObj) {
                  varObj.searchPath = `${symbolBlock.searchPath}/${name.replace(/\[0*([0-9]+)]/, '[$1]')}`
                  if (R.isNotEmpty(varEle.elements)) {
                    for (const attrEle of varEle.elements) {
                      const { name, value } = attrEle.attributes
                      if (/^type$/.test(name)) {
                        // 记录可变类型使用的真实类型
                        varObj.type = getVariableTypeEnum(value)
                      } else if (/^format$/.test(name)) {
                        // 记录可变类型使用的真实类型
                        varObj.format = value
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    // 拉线
    const { labelInMap, labelOutMap, symbolVarInMap, symbolVarOutMap } = this.getVarMap(page)
    if (linesElement && R.isNotEmpty(linesElement.elements)) {
      for (const linkEle of linesElement.elements) {
        const { symbol_group_child_var_in, symbol_group_child_var_out } = linkEle.attributes
        let head: LabelIn | SymbolBlockVarOutputInst | undefined
        let tail: LabelOut | SymbolBlockVarInputInst | undefined
        if (/C(RegInput)Block/i.test(symbol_group_child_var_in)) {
          head = labelInMap.get(symbol_group_child_var_in)
        } else {
          head = symbolVarOutMap.get(symbol_group_child_var_in.replace(/\[0*([0-9]+)]/, '[$1]'))
        }

        if (/C(RegOutput|RegDebugOutput)Block/i.test(symbol_group_child_var_out)) {
          tail = labelOutMap.get(symbol_group_child_var_out)
        } else {
          // FIXME 强转符号的输入输出没有类型
          tail = symbolVarInMap.get(symbol_group_child_var_out.replace(/\[0*([0-9]+)]/, '[$1]'))
        }
        if (head && tail) {
          const line = new ConnectLine({
            id: uuid(),
            headName: head instanceof LabelIn ? 'LabelIn' : head.name,
            headType: head instanceof LabelIn ? head.varType : head.customType || head.type, // FIXME 可变类型
            headNodeId: head instanceof LabelIn ? head.id : head.symbolBlockId,
            headSignalId: head.id,
            tailName: tail instanceof LabelOut ? 'LabelOut' : tail.name,
            tailType: tail instanceof LabelOut ? tail.varType : tail.customType || tail.type, // FIXME 可变类型
            tailNodeId: tail instanceof LabelOut ? tail.id : tail.symbolBlockId,
            tailSignalId: tail.id
          })
          page.connectLines.push(line)
        } else {
          throw new Error('line empty')
        }
      }
    }
  }

  private loadSnippetPageSym (symPath: string, page: Page) {
    const content = fse.readFileSync(symPath, { encoding: 'utf-8' })
    const contentEle = xml2js(content, { alwaysChildren: true })
    const pageEle = contentEle.elements[0]
    if (R.isNotEmpty(pageEle.elements)) {
      const instMap = new Map()
      if (R.isNotEmpty(page.symbolBlocks)) {
        for (const symbolBlock of page.symbolBlocks) {
          instMap.set(symbolBlock.searchPath, symbolBlock)
        }
      }
      if (R.isNotEmpty(page.inLabels)) {
        for (const item of page.inLabels) {
          instMap.set(`${page.searchPath}/${item.instName}`, item)
        }
      }
      if (R.isNotEmpty(page.outLabels)) {
        for (const item of page.outLabels) {
          instMap.set(`${page.searchPath}/${item.instName}`, item)
        }
      }

      for (const symbolEle of pageEle.elements) {
        const { class_name, InstDbPath, x, y } = symbolEle.attributes
        if (/SymbolUnit/.test(class_name) && InstDbPath) {
          const item = instMap.get(InstDbPath)
          if (item) {
            item.x = Number(x)
            item.y = Number(y)
          }
        }
        // TODO 导入routerPoint信息
      }
    }
  }

  private getAbility (ability: string) {
    const positions = getExponents(Number(ability))
    if (R.isNotEmpty(positions)) {
      return positions[0]
    }
  }

  private loadDevData (devDataPath: string) {
    if (!fse.existsSync(devDataPath)) {
      return
    }

    const dirList = fse.readdirSync(devDataPath)
    for (const dir of dirList) {
      if (/\.devmeta$/i.test(dir)) {
        // 加载机箱板卡型号等模板信息
        const content = fse.readFileSync(path.join(devDataPath, dir), { encoding: 'utf-8' })
        const contentEle = xml2js(content, { alwaysChildren: true })
        if (R.isNotEmpty(contentEle.elements)) {
          const metaDataEle = contentEle.elements[0]
          if (R.isNotEmpty(metaDataEle.elements)) {
            for (const ele of metaDataEle.elements) {
              if (/^MOT_number_segs$/.test(ele.name)) {
                // TODO MOT
              } else if (/^rack_types$/.test(ele.name)) {
                // nonecrate wholecrate 1/2crate 1/3crate
              } else if (/^mainboard_types$/.test(ele.name)) {
                // TODO 模板 插槽 主DSP 主CPU等信息
              } else if (/^board_types$/.test(ele.name)) {
                if (R.isNotEmpty(ele.elements)) {
                  for (const boardTypeEle of ele.elements) {
                    // <board_type SN="Cc" ability="16" alias="SY5118A" core_num="2" name="SY5118A" port_num="4"/>
                    const { SN, ability, alias, core_num, name } = boardTypeEle.attributes
                    const modelBoard = new ModelBoard({
                      name,
                      sn: SN,
                      desc: alias,
                      cpuCoreNums: Number(core_num),
                      ability: this.getAbility(ability)
                    })
                    this.modelBoardMap.set(modelBoard.name, modelBoard)
                  }
                }
                // 模板入库 存在重名的情况
                this.device.modelBoards = Array.from(this.modelBoardMap.values())
              } else if (/^board_classifys$/.test(ele.name)) {
                // 用途不详
              }
            }
          }
        }
      } else if (/\.devdata$/i.test(dir)) {
        // 加载装置配置
        const content = fse.readFileSync(path.join(devDataPath, dir), { encoding: 'utf-8' })
        const contentEle = xml2js(content, { alwaysChildren: true })
        if (R.isNotEmpty(contentEle.elements)) {
          const devDataEle = contentEle.elements[0]
          if (R.isNotEmpty(devDataEle.elements)) {
            const devTypeEle = devDataEle.elements[0]
            if (R.isNotEmpty(devTypeEle.elements)) {
              const devVersionEle = devTypeEle.elements[0]
              if (R.isNotEmpty(devVersionEle.elements)) {
                let devMainBoardsEle
                let boardsEle
                let confHeaderEle
                let motEle
                let sceneEle
                let lcdMenuVersionEle
                let iec61850VersionEle
                let varGroupVersionEle
                const waveGroupEles = []
                let ledEle

                for (const ele of devVersionEle.elements) {
                  if (/^dev_mainboards$/.test(ele.name)) {
                    devMainBoardsEle = ele
                  } else if (/^dev_boards$/.test(ele.name)) {
                    boardsEle = ele
                  } else if (/^device_conf_headers$/.test(ele.name)) {
                    confHeaderEle = ele
                  } else if (/^device_MOT_items$/.test(ele.name)) {
                    motEle = ele
                  } else if (/^device_scene_confs$/.test(ele.name)) {
                    sceneEle = ele
                  } else if (/^device_funciton_confs$/.test(ele.name)) {
                    // 废弃 funcEle = ele
                  } else if (/^device_reftable_types$/.test(ele.name)) {
                    // 废弃 refTableTypesEle = ele
                  } else if (/^device_reftables$/.test(ele.name)) {
                    // 废弃 refTablesEle = ele
                  } else if (/^dev_const_group_items$/.test(ele.name)) {
                    // 废弃 constGroupItemsEle = ele
                  } else if (/^dev_const_group_lists$/.test(ele.name)) {
                    // 废弃 constGroupListsEle = ele
                  } else if (/^device_lcd_menu_version$/.test(ele.name)) {
                    lcdMenuVersionEle = ele
                  } else if (/^device_iec61850_version$/.test(ele.name)) {
                    iec61850VersionEle = ele
                  } else if (/^device_vargroup_version$/.test(ele.name)) {
                    varGroupVersionEle = ele
                  } else if (/^device_wavegroup_inst$/.test(ele.name)) {
                    waveGroupEles.push(ele)
                  } else if (/^device_protocol_conf$/.test(ele.name)) {
                    const { name } = ele.attributes
                    if (/LED/.test(name)) {
                      ledEle = ele
                    }
                    // TODO
                    // LCD_MAINSCREEN DNP30S MODBUS主站
                  }
                }
                // 母板配置
                this.loadMainBoard(devMainBoardsEle)
                // 程序配置
                this.loadBoardProgram(boardsEle)
                // 全局配置
                this.loadHeader(confHeaderEle)
                // MOT
                this.loadMOT(motEle)
                // 场景配置
                this.loadScene(sceneEle)
                // 液晶菜单
                this.loadLCDMenu(lcdMenuVersionEle)
                // 61850
                this.loadIEC61850(iec61850VersionEle)
                // 信号分组
                this.loadSignalGroup(varGroupVersionEle)
                // 录波
                this.loadWave(waveGroupEles)
                // LED配置
                this.loadLED(ledEle)
              }
            }
          }
        }
      }
    }
  }

  loadMainBoard (devMainBoardsEle: ElementCompact) {
    if (devMainBoardsEle && R.isNotEmpty(devMainBoardsEle.elements)) {
      const mainBoardEle = devMainBoardsEle.elements[0]
      this.device.hardware.mainBoardConfig.type = mainBoardEle.attributes.name
      const slotCfgs = mainBoardEle.elements.map(
        (slotEle: ElementCompact) => {
          const { index } = slotEle.attributes
          return new MainBoardSlotConfig({
            id: uuid(), slot: Number(index), optional: 0
          })
        }
      )
      this.device.hardware.mainBoardConfig.slots = R.sortBy(R.prop('slot'))(slotCfgs)
    }
  }

  private loadBoardProgram (boardsEle: ElementCompact) {
    if (boardsEle && R.isNotEmpty(boardsEle.elements)) {
      for (const devBoardEle of boardsEle.elements) {
        // 板卡
        const { whole_slot_index, name, enable } = devBoardEle.attributes
        const modelBoard = this.modelBoardMap.get(name)

        const programBoard = new ProgramBoard({
          id: uuid(),
          slot: Number(whole_slot_index),
          type: name,
          ability: modelBoard?.ability,
          desc: ''
        }, this.device.program)
        // 补齐硬件配置当前板卡信息
        const slotConfig = R.find<MainBoardSlotConfig>(R.propEq(programBoard.slot, 'slot'))(this.device.hardware.mainBoardConfig.slots)
        if (slotConfig) {
          if (/1/.test(enable)) {
            slotConfig.type = name
          }
          slotConfig.optTypeList.push(name)
          if (modelBoard) {
            slotConfig.ability = modelBoard.ability
            slotConfig.sn = modelBoard.sn
            slotConfig.desc = modelBoard.desc
            slotConfig.slotAbilityList.push(modelBoard.ability)
          }
        }
        // CPU核
        if (R.isNotEmpty(devBoardEle.elements)) {
          for (const cpuEle of devBoardEle.elements) {
            let cpuIndex = 0
            let coreIndex = 0

            const { name, replace_name, alias, index } = cpuEle.attributes
            const coreIndexSrc = /P\dC\d/.test(name)
              ? name
              : /P\dC\d/.test(replace_name)
                ? replace_name
                : /P\dC\d/.test(alias)
                  ? alias
                  : ''
            if (coreIndexSrc) {
              [, cpuIndex, coreIndex] = coreIndexSrc.match(/P(\d)C(\d)/)
            } else {
              coreIndex = index
            }
            const coreInfo = new CpuCoreInfo({
              id: uuid(),
              name,
              cpuIndex: Number(cpuIndex),
              coreIndex: Number(coreIndex)
            }, programBoard)

            this.loadPage(cpuEle, coreInfo, programBoard)
            programBoard.cpuCores.push(coreInfo)
          }
        }
        this.device.program.optBoards.push(programBoard)
      }
    }
  }

  private getDescFromTRDesc (trDesc: string) {
    return decodeURIComponent(trDesc)
  }

  private loadPage (cpuEle: ElementCompact, coreInfo: CpuCoreInfo, board: ProgramBoard) {
    const saddrPrefix = formatSaddrPrefix({
      slot: board.slot, cpuIndex: coreInfo.cpuIndex, coreIndex: coreInfo.coreIndex
    })

    if (R.isNotEmpty(cpuEle.elements)) {
      const pageElements = []
      const groupElements = [] // 页面组信息
      const pageMatrixElements = []

      for (const ele of cpuEle.elements) {
        if (/^page$/i.test(ele.name)) {
          pageElements.push(ele)
        } else if (/^page_group_record_list$/.test(ele.name)) {
          if (R.isNotEmpty(ele.elements)) {
            for (const pageGroupEle of ele.elements) {
              groupElements.push(pageGroupEle)
            }
          }
        } else if (/^page_matrix$/i.test(ele.name)) {
          pageMatrixElements.push(ele)
        } else if (/^page_symbol_order$/.test(ele.name)) {
          // 所有符号排序
        }
      }

      // 页面组使用
      const pageMap = new Map<string, Page>()
      // 编程页
      for (const pageEle of pageElements) {
        const { name, NO, default_run_level } = pageEle.attributes
        const page = new Page({
          id: uuid(),
          name,
          isFolder: YesNoEnum.NO,
          searchPath: `/${this.device.series}/${this.device.version}/${board.type}/${coreInfo.name}/${name}`,
          index: Number(NO),
          status: EnableStatusEnum.ON,
          level: Number(default_run_level) as TaskLevelEnum
        }, coreInfo)
        pageMap.set(page.searchPath, page)

        if (R.isNotEmpty(pageEle.elements)) {
          const symbolElements = []
          const lineElements = []
          for (const ele of pageEle.elements) {
            if (/^page_symbol$/.test(ele.name)) {
              symbolElements.push(ele)
            } else if (/^page_symbol_var_link$/.test(ele.name)) {
              lineElements.push(ele)
            }
          }
          this.loadSymbolBlock(symbolElements, page, saddrPrefix)

          this.loadConnectLine(lineElements, page)
        }
      }

      // 页面组排序
      // 所有页面根据NO先排序，用于后面组的排序
      const sortedPages = Array.from(pageMap.values()).sort((a, b) => {
        if (a.level === b.level) {
          return a.index - b.index
        } else {
          return a.level > b.level ? 1 : -1
        }
      })

      const pageGroupMap = new Map<string, Page>()
      // 页面组
      for (const groupEle of groupElements) {
        const { Refpage, name } = groupEle.attributes

        let pageGroup = pageGroupMap.get(name)
        if (!pageGroup) {
          pageGroup = new Page({
            id: uuid(),
            name,
            isFolder: YesNoEnum.YES,
            status: EnableStatusEnum.ON,
            searchPath: `/${this.device.series}/${this.device.version}/${board.type}/${coreInfo.name}/${name}`
          })
          pageGroupMap.set(name, pageGroup)
        }
        const page = pageMap.get(Refpage)
        if (page) {
          page.parent = pageGroup
          pageGroup.level = page.level
          pageGroup.pages.push(page)
        }
      }

      // 页面组添加到核下
      const existInCore: Page[] = []
      for (const page of sortedPages) {
        const parent = page.parent
        if (parent instanceof Page) {
          if (!existInCore.includes(parent)) {
            coreInfo.pages.push(parent)
            existInCore.push(parent)
          }
        } else if (parent instanceof CpuCoreInfo) {
          coreInfo.pages.push(page)
        }
      }

      // 矩阵页
      for (const matrixEle of pageMatrixElements) {
        const { name } = matrixEle.attributes
        const page = new Page({
          id: uuid(),
          name,
          isFolder: YesNoEnum.NO,
          searchPath: `/${this.device.series}/${this.device.version}/${board.type}/${coreInfo.name}/${name}`,
          status: EnableStatusEnum.ON,
          level: TaskLevelEnum.LevelAny // 默认运行等级
        }, coreInfo)
        coreInfo.pages.push(page)
        if (R.isNotEmpty(matrixEle.elements)) {
          for (const matrixSymEle of matrixEle.elements) {
            const { RefSymPath, name } = matrixSymEle.attributes
            const symbolBlock = new SymbolBlockInst({
              id: uuid(),
              name,
              instName: name,
              status: EnableStatusEnum.ON,
              type: SymbolTypeEnum.SYM_BUS,
              sAddr: `${saddrPrefix}.${name}`, // FIXME 非智能板卡短地址使用mdsp的地址
              searchPath: `${page.searchPath}/${name}`,
              x: 300,
              y: 100
            })
            page.symbolBlocks.push(symbolBlock)
            const symbolBlockVarMap = this.fillSymbolBlockInst(RefSymPath, symbolBlock)

            if (R.isNotEmpty(matrixSymEle.elements)) {
              for (const matrixSymVarEle of matrixSymEle.elements) {
                const { RefSymVarPath, name } = matrixSymVarEle.attributes
                const varObj = symbolBlockVarMap.get(RefSymVarPath.replace(/\[0*([0-9]+)]/, '[$1]'))
                varObj.searchPath = `${symbolBlock.searchPath}/${name.replace(/\[0*([0-9]+)]/, '[$1]')}`
                this.signalMap.set(varObj.searchPath, varObj)

                if (R.isNotEmpty(matrixSymVarEle.elements)) {
                  for (const matrixSymVarLinkEle of matrixSymVarEle.elements) {
                    const { RefSymVarPath } = matrixSymVarLinkEle.attributes
                    if (/cboardinputblock/i.test(RefSymVarPath)) {
                      // 新增输出标签和拉线
                      const inputLabel = this.boardInMap.get(RefSymVarPath)
                      const labelOut = new LabelOut(inputLabel)
                      labelOut.id = uuid()
                      labelOut.type = 'BoardOutput'
                      labelOut.searchPath = ''
                      page.outLabels.push(labelOut)

                      const line = new ConnectLine({
                        id: uuid(),
                        headName: varObj.name,
                        headType: varObj.customType || varObj.type, // FIXME 可变类型
                        headNodeId: varObj.symbolBlockId,
                        headSignalId: varObj.id,
                        tailName: 'LabelOut',
                        tailType: labelOut.varType,
                        tailNodeId: labelOut.id,
                        tailSignalId: labelOut.id
                      })
                      page.connectLines.push(line)
                    } else if (/cboardoutputblock/i.test(RefSymVarPath)) {
                      // 新增输入标签和拉线
                      const outputLabel = this.boardOutMap.get(RefSymVarPath)
                      const labelIn = new LabelIn(outputLabel)
                      labelIn.id = uuid()
                      labelIn.type = 'BoardInput'
                      labelIn.searchPath = ''
                      page.inLabels.push(labelIn)

                      const line = new ConnectLine({
                        id: uuid(),
                        headName: 'LabelIn',
                        headType: labelIn.varType,
                        headNodeId: labelIn.id,
                        headSignalId: labelIn.id,
                        tailName: varObj.name,
                        tailType: varObj.customType || varObj.type, // FIXME 可变类型
                        tailNodeId: varObj.symbolBlockId,
                        tailSignalId: varObj.id
                      })
                      page.connectLines.push(line)
                    }
                  }
                }
              }
            }
          }
        }
      }

      // 排序后刷新index
      coreInfo.pages.forEach((page, index) => {
        page.index = index
        if (R.isNotEmpty(page.pages)) {
          page.pages.forEach((p, pIndex) => (p.index = pIndex))
        }
      })
    }
  }

  private loadSymbolBlock (symbolElements: ElementCompact[], page: Page, saddrPrefix: string) {
    if (R.isEmpty(symbolElements)) {
      return
    }

    for (const pageSymbolEle of symbolElements) {
      const { name, Ref_symbol_path, abbr, x, y } = pageSymbolEle.attributes

      if (/extend\/CTextComment/.test(Ref_symbol_path)) {
        // 自定义定值和常量
        const annotation = new PageAnnotation({
          id: uuid(),
          x: Number(x),
          y: Number(y),
          width: 100, // FIXME
          height: 100
        })

        if (R.isNotEmpty(pageSymbolEle.elements)) {
          for (const varEle of pageSymbolEle.elements) {
            // <page_symbol_var Ref_component_var_ex="" Ref_symbol_var_path="/extend/CTextComment/1.0/comment"
            // name="ctextcomment_1_2.comment" tr_desc="" xxoid="14:1687:2">
            for (const varAttrEle of varEle.elements) {
              const { name, value } = varAttrEle.attributes
              if (name === 'value') {
                annotation.value = value
              }
            }
          }
        }
        page.annotations.push(annotation)
      } else if (/extend\/C(PageInput|BoardInput)Block/.test(Ref_symbol_path)) {
        // 输入标签
        const [, type] = Ref_symbol_path.match(/extend\/C(PageInput|BoardInput)Block/)
        const inputLabel = new LabelIn({
          id: uuid(),
          type,
          scope: 'public',
          instName: name,
          abbr,
          x: Number(x),
          y: Number(y)
        })
        if (R.isNotEmpty(pageSymbolEle.elements)) {
          for (const varEle of pageSymbolEle.elements) {
            // <page_symbol_var Ref_component_var_ex="" Ref_symbol_var_path="/extend/CPageInputBlock/1.0/cOut1"
            // name="cpageinputblock_1_539.cOut1" tr_desc="DWC" xxoid="14:1680:2">
            // FIXME cOut1应该不需要了
            // TODO tr_desc
            inputLabel.searchPath = `${page.searchPath}/${name}/${varEle.attributes.name}`
            for (const varAttrEle of varEle.elements) {
              const { name, value } = varAttrEle.attributes
              if (name === 'name') {
                inputLabel.name = value
              } else if (name === 'desc') {
                inputLabel.desc = value
              } else if (name === 'type') {
                inputLabel.varType = getVariableTypeEnum(value)
              }
            }
          }
        }
        page.inLabels.push(inputLabel)
        if (type === 'BoardInput') {
          this.boardInMap.set(inputLabel.searchPath, inputLabel)
        }
      } else if (/extend\/C(PageOutput|BoardOutput)Block/.test(Ref_symbol_path)) {
        // 输出标签
        const [, type] = Ref_symbol_path.match(/extend\/C(PageOutput|BoardOutput)Block/)
        const outputLabel = new LabelOut({
          id: uuid(),
          type,
          scope: 'public',
          instName: name,
          abbr,
          x: Number(x),
          y: Number(y)
        })
        if (R.isNotEmpty(pageSymbolEle.elements)) {
          for (const varEle of pageSymbolEle.elements) {
            // <page_symbol_var Ref_component_var_ex="" Ref_symbol_var_path="/extend/CPageOutputBlock/1.0/cIn1"
            // name="cpageoutputblock_1_327.cIn1" tr_desc="DWC" xxoid="14:1681:2">
            // FIXME cIn1应该不需要了
            // TDDO tr_desc
            outputLabel.searchPath = `${page.searchPath}/${name}/${varEle.attributes.name}`
            for (const varAttrEle of varEle.elements) {
              const { name, value } = varAttrEle.attributes
              if (name === 'name') {
                outputLabel.name = value
              } else if (name === 'desc') {
                outputLabel.desc = value
              } else if (name === 'type') {
                outputLabel.varType = getVariableTypeEnum(value)
              }
            }
          }
        }
        page.outLabels.push(outputLabel)
        if (type === 'BoardOutput') {
          this.boardOutMap.set(outputLabel.searchPath, outputLabel)
        }
      } else if (/extend\/CConstBlock/.test(Ref_symbol_path)) {
        // FIXME 区分自定义定值和常量
        const symbolBlock = new SymbolBlockInst({
          id: uuid(),
          name: 'CConstBlock',
          instName: name,
          status: EnableStatusEnum.ON,
          type: SymbolTypeEnum.SYM_EXTEND,
          pathId: `base${formatVersion(Ref_symbol_path)}`.toLowerCase(), // FIXME
          searchPath: `${page.searchPath}/${name}`,
          abbr,
          x: Number(x),
          y: Number(y)
        })

        for (const varEle of pageSymbolEle.elements) {
          // <page_symbol_var Ref_component_var_ex="" Ref_symbol_var_path="/extend/CConstBlock/1.0/COut1"
          // name="cconstblock_1_205.COut1" tr_desc="DWC" xxoid="14:1667:2">
          const { name, tr_desc } = varEle.attributes
          // cconstblock_1_205.COut1
          // const varName = name.replace(`${symbolBlock.instName}.`, '')
          const output = new SymbolBlockVarOutputInst({
            id: uuid(),
            index: 0,
            name: 'COut1',
            customDesc: this.getDescFromTRDesc(tr_desc),
            pathId: `${symbolBlock.pathId}/COut1`.toLowerCase(),
            searchPath: `${symbolBlock.searchPath}/${name}`,
            symbolBlockId: symbolBlock.id
          })
          this.signalMap.set(output.searchPath, output)
          for (const varAttrEle of varEle.elements) {
            const { name, value } = varAttrEle.attributes
            if (name === 'abbr') {
              output.abbr = value
            } else if (name === 'default') {
              output.default = value
            } else if (name === 'name') {
              if (value) {
                output.regName = value
              }
            } else if (name === 'type') {
              output.type = getVariableTypeEnum(value)
            } else if (name === 'value') {
              output.value = value
            } else if (name === 'unit') {
              // 有值说明为具名常量，用作自定义定值
              // 修改常量实例名为customDefineParam
              output.unit = value
            }
          }
          if (output.unit) {
            // unit有值说明是自定义定值符号
            symbolBlock.desc = CUSTOM_PARAM_INST_NAME
            output.sAddr = `${saddrPrefix}.${CUSTOM_PARAM_INST_NAME}.${output.regName}` // 自定义参数使用 BXX._customParmDefine.value的作为短地址
          }
          symbolBlock.outputs.push(output)
        }
        page.symbolBlocks.push(symbolBlock)
      } else if (/(extend\/CBrokenCircleBlock)/.test(Ref_symbol_path)) {
        const symbolBlock = new SymbolBlockInst({
          id: uuid(),
          name: 'CBrokenCircleBlock',
          instName: name,
          status: EnableStatusEnum.ON,
          pathId: `base${formatVersion(Ref_symbol_path)}`.toLowerCase(),
          type: SymbolTypeEnum.SYM_EXTEND,
          abbr,
          searchPath: `${page.searchPath}/${name}`,
          x: Number(x),
          y: Number(y)
        })
        if (R.isNotEmpty(pageSymbolEle.elements)) {
          for (const varEle of pageSymbolEle.elements) {
            const { Ref_symbol_var_path, name, tr_desc } = varEle.attributes
            const varName = name.replace(`${symbolBlock.instName}.`, '')
            let io
            if (/CIn/i.test(Ref_symbol_var_path)) {
              io = new SymbolBlockVarInputInst({
                id: uuid(),
                name: varName || 'cIn1',
                index: 0,
                regName: varName || 'cIn1',
                customDesc: this.getDescFromTRDesc(tr_desc),
                searchPath: `${symbolBlock.searchPath}/${name}`,
                pathId: `${symbolBlock.pathId}/${varName}`.toLowerCase(),
                symbolBlockId: symbolBlock.id
              })
              this.signalMap.set(io.searchPath, io)
              symbolBlock.inputs.push(io)
            } else {
              io = new SymbolBlockVarOutputInst({
                id: uuid(),
                name: varName || 'cOut1',
                index: 0,
                regName: varName || 'cOut1',
                customDesc: this.getDescFromTRDesc(tr_desc),
                searchPath: `${symbolBlock.searchPath}/${name}`,
                pathId: `${symbolBlock.pathId}/${varName}`.toLowerCase(),
                symbolBlockId: symbolBlock.id
              })

              this.signalMap.set(io.searchPath, io)
              symbolBlock.outputs.push(io)
            }
          }
        }
        page.symbolBlocks.push(symbolBlock)
      } else if (/(OP\/cast)/.test(Ref_symbol_path)) {
        const symbolBlock = new SymbolBlockInst({
          id: uuid(),
          name: 'Cast',
          instName: name,
          status: EnableStatusEnum.ON,
          pathId: `base${formatVersion(Ref_symbol_path)}`.toLowerCase(),
          type: SymbolTypeEnum.SYM_EXTEND,
          abbr,
          searchPath: `${page.searchPath}/${name}`,
          x: Number(x),
          y: Number(y)
        })
        if (R.isNotEmpty(pageSymbolEle.elements)) {
          for (const varEle of pageSymbolEle.elements) {
            const { Ref_symbol_var_path, name, tr_desc } = varEle.attributes
            const varName = name.replace(`${symbolBlock.instName}.`, '')
            let io
            if (/CIn/i.test(Ref_symbol_var_path)) {
              io = new SymbolBlockVarInputInst({
                id: uuid(),
                name: varName,
                index: 0,
                regName: varName,
                customDesc: this.getDescFromTRDesc(tr_desc),
                searchPath: `${symbolBlock.searchPath}/${name}`,
                pathId: `${symbolBlock.pathId}/${varName}`.toLowerCase(),
                symbolBlockId: symbolBlock.id
              })
              this.signalMap.set(io.searchPath, io)
              symbolBlock.inputs.push(io)
            } else {
              io = new SymbolBlockVarOutputInst({
                id: uuid(),
                name: varName,
                index: 0,
                regName: varName,
                customDesc: this.getDescFromTRDesc(tr_desc),
                searchPath: `${symbolBlock.searchPath}/${name}`,
                pathId: `${symbolBlock.pathId}/${varName}`.toLowerCase(),
                symbolBlockId: symbolBlock.id
              })

              this.signalMap.set(io.searchPath, io)
              symbolBlock.outputs.push(io)
            }
          }
        }
        page.symbolBlocks.push(symbolBlock)
      } else {
        const symbolBlock = new SymbolBlockInst({
          id: uuid(),
          instName: name,
          status: EnableStatusEnum.ON,
          type: SymbolTypeEnum.SYM_COMPONENT,
          abbr,
          sAddr: `${saddrPrefix}.${name}`,
          searchPath: `${page.searchPath}/${name}`,
          x: Number(x),
          y: Number(y)
        })
        const symbolBlockVarMap = this.fillSymbolBlockInst(Ref_symbol_path, symbolBlock)

        if (R.isNotEmpty(pageSymbolEle.elements)) {
          for (const varEle of pageSymbolEle.elements) {
            const { Ref_symbol_var_path, name, tr_desc } = varEle.attributes

            // 根据 Ref_symbol_var_path确定变量类型
            const varObj = symbolBlockVarMap.get(Ref_symbol_var_path.replace(/\[0*([0-9]+)]/, '[$1]'))
            if (!varObj) {
              throw new Error('信号不存在' + Ref_symbol_var_path.replace(/\[0*([0-9]+)]/, '[$1]'))
            }
            varObj.customDesc = this.getDescFromTRDesc(tr_desc)
            varObj.searchPath = `${symbolBlock.searchPath}/${name.replace(/\[0*([0-9]+)]/, '[$1]')}`
            this.signalMap.set(varObj.searchPath, varObj)
            for (const varAttrEle of varEle.elements) {
              const { name, value } = varAttrEle.attributes
              if (/^type$/.test(name)) {
                // 记录可变类型使用的真实类型
                varObj.type = getVariableTypeEnum(value)
              }
            }
          }
        }
        page.symbolBlocks.push(symbolBlock)
      }
    }
  }

  private loadConnectLine (linesElements: ElementCompact[], page: Page) {
    if (R.isEmpty(linesElements)) {
      return
    }
    const { labelInMap, labelOutMap, symbolVarInMap, symbolVarOutMap } = this.getVarMap(page)
    // line依赖symbol的结果
    for (const pageSymbolVarLinkEle of linesElements) {
      const { Refpage_symbol_var_in, Refpage_symbol_var_out } = pageSymbolVarLinkEle.attributes
      let head: LabelIn | SymbolBlockVarOutputInst | undefined
      let tail: LabelOut | SymbolBlockVarInputInst | undefined
      if (/C(PageInput|BoardInput)Block/i.test(Refpage_symbol_var_in)) {
        head = labelInMap.get(Refpage_symbol_var_in)
      } else {
        head = symbolVarOutMap.get(Refpage_symbol_var_in.replace(/\[0*([0-9]+)]/, '[$1]'))
      }

      if (/C(PageOutput|BoardOutput)Block/i.test(Refpage_symbol_var_out)) {
        tail = labelOutMap.get(Refpage_symbol_var_out)
      } else {
        tail = symbolVarInMap.get(Refpage_symbol_var_out.replace(/\[0*([0-9]+)]/, '[$1]'))
      }
      if (head && tail) {
        const line = new ConnectLine({
          id: uuid(),
          headName: head instanceof LabelIn ? 'LabelIn' : head.name,
          headType: head instanceof LabelIn ? head.varType : head.customType || head.type, // FIXME 可变类型
          headNodeId: head instanceof LabelIn ? head.id : head.symbolBlockId,
          headSignalId: head.id,
          tailName: tail instanceof LabelOut ? 'LabelOut' : tail.name,
          tailType: tail instanceof LabelOut ? tail.varType : tail.customType || tail.type, // FIXME 可变类型
          tailNodeId: tail instanceof LabelOut ? tail.id : tail.symbolBlockId,
          tailSignalId: tail.id
        })
        page.connectLines.push(line)
      } else {
        throw new Error('page line empty')
      }
    }
  }

  private loadHeader (confHeaderEle: ElementCompact) {
    if (confHeaderEle && R.isNotEmpty(confHeaderEle.elements)) {
      for (const headerEle of confHeaderEle.elements) {
        const { alias, group, name, value, zone } = headerEle.attributes
        if (/EXTEND_(ip|port|group_num|process_list)/.test(alias) ||
          /TASK_level[1234]/.test(alias) ||
          /TASK_hbus[12]_cycle/.test(alias) ||
          /TYPE_(devtype|name|prj_name)/.test(alias) ||
          /VER_(headerdevver|subq|date|time|area_ver_no|crc)/.test(alias)) {
          const macro = new MacroDefine({
            id: uuid(),
            name,
            value,
            desc: alias,
            group,
            zone
          })
          this.device.config.macroDefines.push(macro)
        } else {
          // 逻辑符号最大数
        }
      }
    }
  }

  private loadMOT (motEle: ElementCompact) {
    if (motEle && R.isNotEmpty(motEle.elements)) {
      // todo MOT
    }
  }

  private loadScene (sceneEle: ElementCompact) {
    if (sceneEle && R.isNotEmpty(sceneEle.elements)) {
      // todo 场景配置
    }
  }

  private loadLCDMenu (lcdMenuVersionEle: ElementCompact) {
    if (lcdMenuVersionEle && R.isNotEmpty(lcdMenuVersionEle.elements)) {
      const lcdMap = new Map<string, LcdMenu[]>()
      const lcdMenus = []
      for (const menuEle of lcdMenuVersionEle.elements) {
        const { abbr, func, id, name, parent_oid } = menuEle.attributes
        const oid = `/${this.device.series}/${this.device.version}/${lcdMenuVersionEle.attributes.name}/${id}`
        const lcdMenu = new LcdMenu({
          id: uuid(),
          name,
          abbr,
          func,
          isFolder: func ? YesNoEnum.NO : YesNoEnum.YES,
          parentMenuId: parent_oid
        })
        lcdMenus.push(lcdMenu)
        const arr = lcdMap.get(oid)
        if (arr) {
          arr.push(lcdMenu)
          lcdMap.set(oid, arr)
        } else {
          lcdMap.set(oid, [lcdMenu])
        }

        if (R.isNotEmpty(menuEle.elements)) {
          for (const refDataEle of menuEle.elements) {
            const { Refpage_symbol_var } = refDataEle.attributes
            if (!Refpage_symbol_var) {
              // throw new Error('empty lcd refdata var path')
              continue
            }
            const signal = this.signalMap.get(Refpage_symbol_var)
            if (!signal) {
              throw new Error('导入失败，关联信号不存在' + Refpage_symbol_var)
            }

            const refData = new LcdMenuRefData({
              id: uuid(), name: signal.sAddr, desc: signal.customDesc || signal.desc, abbr: signal.abbr
            })
            lcdMenu.refDatas.push(refData)
          }
        }
      }
      for (const menu of lcdMenus) {
        if (menu.parentMenuId) {
          const parentMenus = lcdMap.get(menu.parentMenuId)
          if (!parentMenus || R.isEmpty(parentMenus)) {
            throw new Error(`menu ${menu.parentMenuId} not exist`)
          } else if (parentMenus.length === 1) {
            const parent = parentMenus[0]
            menu.parentMenuId = parent.id
            parent.menus.push(menu)
          } else {
            for (const parent of parentMenus) {
              if (!parent.isFolder) {
                continue
              }
              menu.parentMenuId = parent.id
              parent.menus.push(menu)
            }
          }
        } else {
          this.device.config.hmiConfig.lcdMenu.menus.push(menu)
        }
      }
      this.fillMenuIndex(this.device.config.hmiConfig.lcdMenu.menus)
    }
  }

  private fillMenuIndex (menus: LcdMenu[]) {
    if (R.isNotEmpty(menus)) {
      menus.forEach((menu, index) => {
        menu.index = index
        if (R.isNotEmpty(menu.refDatas)) {
          menu.refDatas.forEach((refData, refIndex) => (refData.index = refIndex))
        }
        this.fillMenuIndex(menu.menus)
      })
    }
  }

  private loadIEC61850 (iec61850VersionEle: ElementCompact) {
    if (iec61850VersionEle && R.isNotEmpty(iec61850VersionEle.elements)) {
      // TODO
    }
  }

  private loadSignalGroup (varGroupVersionEle: ElementCompact) {
    if (varGroupVersionEle && R.isNotEmpty(varGroupVersionEle.elements)) {
      for (const tableEle of varGroupVersionEle.elements) {
        const { Refrefrence_table_classify, classifyFunc, name, alias, is_org } = tableEle.attributes
        if (/GROUP/.test(classifyFunc)) {
          // 信号分组
          if (/STATE_TABLE/.test(Refrefrence_table_classify)) {
            const group = new StateGroup({
              id: uuid(),
              name,
              desc: alias,
              reserved: /1/.test(is_org) ? YesNoEnum.YES : YesNoEnum.NO,
              isFolder: YesNoEnum.YES
            })
            if (R.isNotEmpty(tableEle.elements)) {
              for (const groupEle of tableEle.elements) {
                const { name, alias, is_org } = groupEle.attributes
                const subGroup = new StateGroup({
                  id: uuid(),
                  name,
                  desc: alias,
                  reserved: /1/.test(is_org) ? YesNoEnum.YES : YesNoEnum.NO,
                  isFolder: YesNoEnum.NO
                })
                group.childGroups.push(subGroup)
                if (R.isNotEmpty(groupEle.elements)) {
                  for (const itemEle of groupEle.elements) {
                    const { index, Refpage_symbol_var } = itemEle.attributes
                    const signal = this.signalMap.get(Refpage_symbol_var)
                    if (!signal) {
                      throw new Error('导入失败，关联信号不存在' + Refpage_symbol_var)
                    }

                    const item = new StateGroupItem({
                      id: uuid(),
                      index,
                      name: signal.sAddr,
                      abbr: signal.abbr,
                      desc: signal.customDesc || signal.desc
                    })

                    if (R.isNotEmpty(itemEle.elements)) {
                      for (const attrEle of itemEle.elements) {
                        const { name, value } = attrEle.attributes
                        if (/class/.test(name)) {
                          item.classify = Number(value) as SignalClassifyEnum// SignalClassifyEnum
                        } else if (/desc/.test(name)) {
                          item.desc = item.desc || value
                        } else if (/norm/.test(name)) {
                          item.norm = value
                        } else if (/db_cat/.test(name)) {
                          item.db_cat = getDbCatEnumFromString(value)
                        } else if (/db_cat/.test(name)) {
                          // 废弃
                        } else if (/deaddb/.test(name)) {
                          // 废弃
                        }
                      }
                    }
                    subGroup.items.push(item)
                  }
                }
              }
            }
            this.device.config.signalGroup.stateGroup = group
          } else if (/CTRL_TABLE/.test(Refrefrence_table_classify)) {
            const group = new ControlGroup({
              id: uuid(),
              name,
              desc: alias,
              reserved: /1/.test(is_org) ? YesNoEnum.YES : YesNoEnum.NO,
              isFolder: YesNoEnum.YES
            })
            if (R.isNotEmpty(tableEle.elements)) {
              for (const groupEle of tableEle.elements) {
                const { name, alias, is_org } = groupEle.attributes
                const subGroup = new ControlGroup({
                  id: uuid(),
                  name,
                  desc: alias,
                  reserved: /1/.test(is_org) ? YesNoEnum.YES : YesNoEnum.NO,
                  isFolder: YesNoEnum.NO
                })
                group.childGroups.push(subGroup)
                if (R.isNotEmpty(groupEle.elements)) {
                  for (const itemEle of groupEle.elements) {
                    const { index, Refpage_symbol_var } = itemEle.attributes
                    const signal = this.signalMap.get(Refpage_symbol_var)
                    if (!signal) {
                      throw new Error('导入失败，关联信号不存在' + Refpage_symbol_var)
                    }
                    // 改为使用符号块的短地址
                    const sAddr = signal.sAddr.substring(0, signal.sAddr.lastIndexOf('.'))
                    const item = new ControlGroupItem({
                      id: uuid(),
                      index,
                      name: sAddr,
                      abbr: signal.abbr,
                      desc: signal.customDesc || signal.desc
                    })
                    if (R.isNotEmpty(itemEle.elements)) {
                      for (const attrEle of itemEle.elements) {
                        const { name, value } = attrEle.attributes
                        if (/desc/.test(name)) {
                          item.desc = item.desc || value
                        }
                      }
                    }
                    subGroup.items.push(item)
                  }
                }
              }
            }
            this.device.config.signalGroup.controlGroup = group
          } else if (/RECORD_TABLE/.test(Refrefrence_table_classify)) {
            const group = new RecordGroup({
              id: uuid(),
              name,
              desc: alias,
              reserved: /1/.test(is_org) ? YesNoEnum.YES : YesNoEnum.NO,
              isFolder: YesNoEnum.YES
            })
            if (R.isNotEmpty(tableEle.elements)) {
              for (const groupEle of tableEle.elements) {
                const { name, alias, is_org } = groupEle.attributes
                const subGroup = new RecordGroup({
                  id: uuid(),
                  name,
                  desc: alias,
                  reserved: /1/.test(is_org) ? YesNoEnum.YES : YesNoEnum.NO,
                  isFolder: YesNoEnum.NO
                })
                group.childGroups.push(subGroup)
                if (R.isNotEmpty(groupEle.elements)) {
                  for (const itemEle of groupEle.elements) {
                    const { index, Refpage_symbol_var } = itemEle.attributes
                    const signal = this.signalMap.get(Refpage_symbol_var)
                    if (!signal) {
                      throw new Error('导入失败，关联信号不存在' + Refpage_symbol_var)
                    }
                    const item = new RecordGroupItem({
                      id: uuid(),
                      index,
                      name: signal.sAddr,
                      abbr: signal.abbr,
                      desc: signal.customDesc || signal.desc
                    })
                    if (R.isNotEmpty(itemEle.elements)) {
                      for (const attrEle of itemEle.elements) {
                        const { name, value } = attrEle.attributes
                        if (/desc/.test(name)) {
                          item.desc = item.desc || value
                        }
                      }
                    }
                    subGroup.items.push(item)
                  }
                }
              }
            }
            this.device.config.signalGroup.recordGroup = group
          } else if (/REPORT_TABLE/.test(Refrefrence_table_classify)) {
            const group = new ReportGroup({
              id: uuid(),
              name,
              desc: alias,
              reserved: /1/.test(is_org) ? YesNoEnum.YES : YesNoEnum.NO,
              isFolder: YesNoEnum.YES
            })
            if (R.isNotEmpty(tableEle.elements)) {
              for (const groupEle of tableEle.elements) {
                const { name, alias, is_org } = groupEle.attributes
                const subGroup = new ReportGroup({
                  id: uuid(),
                  name,
                  desc: alias,
                  reserved: /1/.test(is_org) ? YesNoEnum.YES : YesNoEnum.NO,
                  isFolder: YesNoEnum.NO
                })
                group.childGroups.push(subGroup)
                if (R.isNotEmpty(groupEle.elements)) {
                  for (const itemEle of groupEle.elements) {
                    if (/device_config_attr/.test(itemEle.name)) {
                      const { name, value } = itemEle.attributes
                      if (/max_record_num/.test(name)) {
                        subGroup.maxRecordNum = Number(value)
                      }
                    } else if (/device_vargroup_item/.test(itemEle.name)) {
                      const { index, Refpage_symbol_var } = itemEle.attributes
                      const signal = this.signalMap.get(Refpage_symbol_var)
                      if (!signal) {
                        throw new Error('导入失败，关联信号不存在' + Refpage_symbol_var)
                      }
                      const item = new ReportGroupItem({
                        id: uuid(),
                        index,
                        name: signal.sAddr,
                        abbr: signal.abbr,
                        desc: signal.customDesc || signal.desc
                      })
                      if (R.isNotEmpty(itemEle.elements)) {
                        for (const attrEle of itemEle.elements) {
                          const { name, value } = attrEle.attributes
                          if (/class/.test(name)) {
                            item.classify = Number(value) as SignalClassifyEnum // SignalClassifyEnum
                          } else if (/desc/.test(name)) {
                            item.desc = item.desc || value
                          } else if (/type/.test(name)) {
                            item.tripType = Number(value) as TripTypeEnum
                          }
                        }
                      }
                      subGroup.items.push(item)
                    }
                  }
                }
              }
            }
            this.device.config.signalGroup.reportGroup = group
          } else if (/EVENT_INFO_TABLE/.test(Refrefrence_table_classify)) {
            const group = new EventInfoGroup({
              id: uuid(),
              name,
              desc: alias,
              reserved: /1/.test(is_org) ? YesNoEnum.YES : YesNoEnum.NO,
              isFolder: YesNoEnum.YES
            })
            if (R.isNotEmpty(tableEle.elements)) {
              for (const groupEle of tableEle.elements) {
                const { name, alias, is_org } = groupEle.attributes
                const subGroup = new EventInfoGroup({
                  id: uuid(),
                  name,
                  desc: alias,
                  reserved: /1/.test(is_org) ? YesNoEnum.YES : YesNoEnum.NO,
                  isFolder: YesNoEnum.NO
                })
                group.childGroups.push(subGroup)
                if (R.isNotEmpty(groupEle.elements)) {
                  for (const itemEle of groupEle.elements) {
                    if (/device_vargroup_item/.test(itemEle.name)) {
                      const { index, Refpage_symbol_var } = itemEle.attributes
                      const signal = this.signalMap.get(Refpage_symbol_var)
                      if (!signal) {
                        throw new Error('导入失败，关联信号不存在' + Refpage_symbol_var)
                      }
                      const item = new EventInfoGroupItem({
                        id: uuid(),
                        index,
                        name: signal.sAddr,
                        abbr: signal.abbr,
                        desc: signal.customDesc || signal.desc
                      })
                      if (R.isNotEmpty(itemEle.elements)) {
                        for (const attrEle of itemEle.elements) {
                          const { name, value } = attrEle.attributes
                          if (/desc/.test(name)) {
                            item.desc = item.desc || value
                          }
                        }
                      }
                      subGroup.items.push(item)
                    }
                  }
                }
              }
            }
            this.device.config.signalGroup.eventGroup = group
          }
        } else if (/SETTING/.test(classifyFunc)) {
          // 定值分组
          if (/dev_constgroup_table/.test(tableEle.name)) {
            const group = new SettingGroup({
              id: uuid(),
              name,
              desc: alias,
              reserved: /1/.test(is_org) ? YesNoEnum.YES : YesNoEnum.NO,
              isFolder: YesNoEnum.YES
            })
            if (R.isNotEmpty(tableEle.elements)) {
              for (const groupEle of tableEle.elements) {
                const { name, alias, is_org } = groupEle.attributes
                const subGroup = new SettingGroup({
                  id: uuid(),
                  name,
                  desc: alias,
                  reserved: /1/.test(is_org) ? YesNoEnum.YES : YesNoEnum.NO,
                  isFolder: YesNoEnum.NO
                })
                group.childGroups.push(subGroup)
                if (R.isNotEmpty(groupEle.elements)) {
                  for (const itemEle of groupEle.elements) {
                    if (/device_config_attr/.test(itemEle.name)) {
                      const { name, value } = itemEle.attributes
                      if (/lcd_modify/.test(name)) {
                        subGroup.lcdModify = /1/.test(value) ? 1 : 0
                      } else if (/multi_set/.test(name)) {
                        subGroup.multiSet = /1/.test(value) ? 1 : 0
                      } else if (/reboot/.test(name)) {
                        subGroup.reboot = /1/.test(value) ? 1 : 0
                      } else if (/remote_modify/.test(name)) {
                        subGroup.remoteModify = /1/.test(value) ? 1 : 0
                      }
                    } else if (/dev_constgroup_merge/.test(itemEle.name)) {
                      const { alias, index, name } = itemEle.attributes
                      const item = new SettingGroupItem({
                        id: uuid(),
                        name,
                        desc: alias,
                        status: EnableStatusEnum.ON,
                        index: Number(index)
                      })
                      if (R.isNotEmpty(itemEle.elements)) {
                        const settingArr = []
                        for (const attrEle of itemEle.elements) {
                          if (/device_constgroup_merge_varlist/.test(attrEle.name)) {
                            settingArr.push(attrEle)
                          } else if (/device_config_attr/.test(attrEle.name)) {
                            const { name, value } = attrEle.attributes
                            if (/abbr/.test(name)) {
                              item.desc = value || item.desc // 定值项的abbr填给描述
                            } else if (/format/.test(name)) {
                              item.format = value
                            } else if (/isboot/.test(name)) {
                              item.isBoot = value
                            } else if (/matrix/.test(name)) {
                              item.matrix = value
                            } else if (/p_max/.test(name)) {
                              item.pMax = value
                            } else if (/p_min/.test(name)) {
                              item.pMin = value
                            } else if (/p_norm/.test(name)) {
                              item.pNorm = value
                            } else if (/s_max/.test(name)) {
                              item.sMax = value
                            } else if (/s_min/.test(name)) {
                              item.sMin = value
                            } else if (/s_norm/.test(name)) {
                              item.sNorm = value
                            } else if (/value/.test(name)) {
                              item.globalSetValue = value
                            }
                          }
                        }
                        if (settingArr.length > 0) {
                          const { Refpage_symbol_var } = settingArr[0].attributes
                          const signal = this.signalMap.get(Refpage_symbol_var)
                          if (!signal) {
                            throw new Error('导入失败，关联信号不存在' + Refpage_symbol_var)
                          }
                          if (!signal.sAddr) {
                            throw new Error('导入失败，关联信号短地址不存在' + Refpage_symbol_var)
                          }
                          item.name = signal.sAddr
                          item.abbr = signal.abbr
                          item.desc = item.desc || signal.customDesc || signal.desc
                          if (settingArr.length > 1) {
                            for (let i = 1; i < settingArr.length; i++) {
                              const { Refpage_symbol_var } = settingArr[i].attributes
                              const signal = this.signalMap.get(Refpage_symbol_var)
                              if (!signal) {
                                throw new Error('导入失败，关联信号不存在' + Refpage_symbol_var)
                              }
                              const mergeItem = new SettingGroupItemMerge({
                                id: uuid(),
                                index: i - 1,
                                name: signal.sAddr,
                                abbr: signal.abbr,
                                desc: signal.customDesc || signal.desc,
                                status: EnableStatusEnum.ON
                              })
                              item.merges.push(mergeItem)
                            }
                          }
                        }
                      }
                      subGroup.items.push(item)
                    }
                  }
                }
              }
            }
            this.device.config.settingGroup.settingGroups.push(group)
          }
        }
      }
    }
  }

  private loadWave (waveGroupEles: ElementCompact[]) {
    if (R.isNotEmpty(waveGroupEles)) {
      for (const waveGroupEle of waveGroupEles) {
        const { inst, name } = waveGroupEle.attributes
        const waveInst = new WaveInst({
          id: uuid(),
          inst,
          name
        })
        this.device.config.hmiConfig.waveConfig.insts.push(waveInst)
        if (R.isNotEmpty(waveGroupEle.elements)) {
          const waveConfig = new WaveConfig({
            id: uuid()
          })
          waveInst.waveConfig = waveConfig
          const configEleArr = []
          const freqEleArr = []
          const waveTableArr = []
          for (const ele of waveGroupEle.elements) {
            if (/device_config_attr/.test(ele.name)) {
              configEleArr.push(ele)
            } else if (/device_wavegroup_freq/.test(ele.name)) {
              freqEleArr.push(ele)
            } else if (/dev_wavegroup_table/.test(ele.name)) {
              waveTableArr.push(ele)
            }
          }
          for (const configEle of configEleArr) {
            const { name, value } = configEle.attributes
            if (/max_item_num/.test(name)) {
              waveConfig.maxItemNum = Number(value)
            } else if (/max_record_num/.test(name)) {
              waveConfig.maxRecordNum = Number(value)
            } else if (/min_item_num/.test(name)) {
              waveConfig.minItemNum = Number(value)
            }
          }
          for (const freqEle of freqEleArr) {
            const { index } = freqEle.attributes
            const freq = new WaveFrequencyItem({
              id: uuid(),
              index: Number(index)
            })
            waveConfig.frequencies.push(freq)
            if (R.isNotEmpty(freqEle.elements)) {
              for (const attrEle of freqEle.elements) {
                const { name, value } = attrEle.attributes
                if (/desc/.test(name)) {
                  freq.desc = freq.desc || value
                } else if (/num/.test(name)) {
                  freq.num = Number(value)
                } else if (/type/.test(name)) {
                  freq.type = Number(value) as WaveFrequencyTypeEnum
                } else if (/value/.test(name)) {
                  freq.value = Number(value)
                }
              }
            }
          }
          for (const waveTableEle of waveTableArr) {
            const { alias, name } = waveTableEle.attributes
            let desc = alias
            if (/STATE_TABLE/.test(alias)) {
              desc = '开关量通道'
            } else if (/ANALOG_TABLE/.test(alias)) {
              desc = '模拟量通道'
            } else if (/TRIG_TABLE/.test(alias)) {
              desc = '录波触发信号'
            } else if (/REPORT_TABLE/.test(alias)) {
              desc = '整组报告'
            }
            const waveGroup = new WaveGroup({ id: uuid(), name, desc })
            waveInst.waveGroups.push(waveGroup)
            if (R.isNotEmpty(waveTableEle.elements)) {
              for (const itemEle of waveTableEle.elements) {
                const { Refpage_symbol_var } = itemEle.attributes
                if (!Refpage_symbol_var) {
                  continue
                }
                const signal = this.signalMap.get(Refpage_symbol_var)
                if (!signal) {
                  throw new Error('导入失败，关联信号不存在' + Refpage_symbol_var)
                }
                const item = new WaveGroupItem({
                  id: uuid(),
                  name: signal.sAddr,
                  abbr: signal.abbr,
                  desc: signal.customDesc || signal.desc
                })
                waveGroup.items.push(item)
                if (R.isNotEmpty(itemEle.elements)) {
                  for (const attrEle of itemEle.elements) {
                    const { name, value } = attrEle.attributes
                    if (/amp/.test(name)) {
                      item.amp = value
                    } else if (/attr/.test(name)) {
                      item.attr = Number(value) as WaveAttrEnum
                    } else if (/desc/.test(name)) {
                      item.desc = item.desc || value
                    } else if (/level/.test(name)) {
                      item.level = Number(value) as WaveLevelEnum
                    } else if (/front_num/.test(name)) {
                      item.frontNum = Number(value)
                    } else if (/mode/.test(name)) {
                      item.mode = Number(value) as WaveTriggerTypeEnum
                    } else if (/priority/.test(name)) {
                      item.priority = Number(value) as WavePriorityEnum
                    }
                  }
                }
              }
              if (R.isNotEmpty(waveGroup.items)) {
                waveGroup.items.forEach((item, index) => (item.index = index))
              }
            }
          }
          waveInst.waveGroups.forEach((group, index) => (group.index = index))
        }
      }
    }
  }

  private loadLED (ledEle: ElementCompact) {
    if (ledEle && R.isNotEmpty(ledEle.elements)) {
      const tableEle = ledEle.elements[0]
      if (R.isNotEmpty(tableEle.elements)) {
        for (const itemEle of tableEle.elements) {
          const { Refpage_symbol_var, index } = itemEle.attributes
          const signal = this.signalMap.get(Refpage_symbol_var)
          if (!signal) {
            throw new Error('导入失败，关联信号不存在' + Refpage_symbol_var)
          }
          const item = new LEDConfigItem({
            id: uuid(),
            index: Number(index),
            name: signal.sAddr,
            abbr: signal.abbr,
            desc: signal.customDesc || signal.desc
          })
          if (R.isNotEmpty(itemEle.elements)) {
            for (const attrEle of itemEle.elements) {
              const { name, value } = attrEle.attributes
              if (/bay_no/.test(name)) {
                item.bayNo = Number(value)
              } else if (/board_no/.test(name)) {
                item.boardNo = Number(value)
              } else if (/color/.test(name)) {
                item.color = Number(value) as LEDColorEnum
              } else if (/enable/.test(name)) {
                item.enable = Number(value) as YesNoEnum
              } else if (/flicker/.test(name)) {
                item.flicker = Number(value) as YesNoEnum
              } else if (/index/.test(name)) {
                item.index = Number(value)
              } else if (/keep/.test(name)) {
                item.keep = Number(value) as YesNoEnum
              } else if (/type/.test(name)) {
                item.type = Number(value) as LEDTypeEnum
              }
            }
          }
          this.device.hardware.panelConfig.lecConfig.push(item)
        }
      }
    }
  }
}
