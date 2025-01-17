import {
  SymbolArchive,
  SymbolBlock,
  SymbolBlockVarInner,
  SymbolBlockVarInput,
  SymbolBlockVarOther,
  SymbolBlockVarOutput,
  SymbolBlockVarParam,
  SymbolBlockVersion,
  SymbolLib
} from '@/model/dto'
import fse from 'fs-extra'
import { ElementCompact, xml2js } from 'xml-js'
import { getSymbolTypeEnum, getVariableTypeEnum, SymbolTypeEnum, TaskLevelEnum } from '@/model/enum'
import path from 'path'
import * as R from 'ramda'
import _ from 'lodash'
import { formatVersion } from '@/util'
import { generateJointSymbolGraph } from '@/util/jointjsShapeGenerator'

export class SymbolLibLoader {
  public loadSymbolArchive (request: { name: string, organization: string, llsymPath: string }) {
    const repo = new SymbolArchive(request)
    repo.pathId = repo.name.toLowerCase()

    if (!fse.existsSync(request.llsymPath)) {
      return repo
    }

    const llsmContent = fse.readFileSync(request.llsymPath, { encoding: 'utf-8' })
    const llsmEle = xml2js(llsmContent, { alwaysChildren: true })
    if (R.isEmpty(llsmEle.elements)) {
      return repo
    }

    const symLibListEle = llsmEle.elements[0]
    if (R.isNotEmpty(symLibListEle.elements)) {
      for (const symLibEle of symLibListEle.elements) {
        const { type, name, path: libPathRelStr } = symLibEle.attributes

        const libType = getSymbolTypeEnum(type)
        if (libType === SymbolTypeEnum.SYM_EXTEND || libType === SymbolTypeEnum.SYM_CONST || libType === SymbolTypeEnum.SYM_OP) {
          // 操作符 常量 扩展符号都变成工具内置
        } else if (libType === SymbolTypeEnum.SYM_COMM || libType === SymbolTypeEnum.SYM_GRAPH || libType === SymbolTypeEnum.SYM_LCD || libType === SymbolTypeEnum.SYM_VARGROUP) {
          // TODO 模板符号待处理
        } else if (libType === SymbolTypeEnum.SYM_COMPONENT_GP) {
          // TODO 组合符号提示用户导入一体化工具
        } else if (libType === SymbolTypeEnum.SYM_COMPONENT || libType === SymbolTypeEnum.SYM_BUS || libType === SymbolTypeEnum.SYM_LOGIC) {
          // 原件、总线(IO)、逻辑符号正常导入
          const lib = new SymbolLib()
          lib.name = symLibEle.name
          lib.pathId = `${repo.pathId}/${lib.name}`.toLowerCase()

          this.loadSymbolLib(path.join(path.dirname(request.llsymPath), libPathRelStr), libType, lib)
          repo.children.push(lib)
        } else {
          throw new Error(`符号库 ${name} 类型为空: ${type} `)
        }
      }
      repo.children.forEach((lib, index) => (lib.index = index))
    }
    return repo
  }

  private loadSymbolLib (libPath: string, libType: SymbolTypeEnum, lib: SymbolLib) {
    if (!fse.existsSync(libPath)) {
      throw new Error('加载符号库失败，路径不存在：' + libPath)
    } else if (!fse.statSync(libPath).isDirectory()) {
      throw new Error('加载符号库失败，路径不是文件夹：' + libPath)
    }
    const symbolBlockDirs = fse.readdirSync(libPath)
    for (let index = 0; index < symbolBlockDirs.length; index++) {
      const sbDir = symbolBlockDirs[index]

      const symbolBlock = new SymbolBlock()
      symbolBlock.name = sbDir
      symbolBlock.type = libType // FIXME 默认都是元件符号
      symbolBlock.pathId = `${lib.pathId}/${symbolBlock.name}`.toLowerCase()
      symbolBlock.index = index

      this.loadSymbolVersions(path.join(libPath, sbDir), symbolBlock)

      lib.children.push(symbolBlock)
    }
  }

  private loadSymbolVersions (symbolPath: string, sb: SymbolBlock) {
    if (!fse.existsSync(symbolPath)) {
      throw new Error('加载符号失败，路径不存在：' + symbolPath)
    } else if (!fse.statSync(symbolPath).isDirectory()) {
      throw new Error('加载符号失败，路径不是文件夹：' + symbolPath)
    }
    const symbolVerDirs = fse.readdirSync(symbolPath)
    for (let index = 0; index < symbolVerDirs.length; index++) {
      const verDir = symbolVerDirs[index]

      const symbolVersion = new SymbolBlockVersion()
      symbolVersion.name = sb.name
      symbolVersion.version = formatVersion(verDir) // 将1.0改为 VmPnRk的格式
      symbolVersion.pathId = `${sb.pathId}/${symbolVersion.version}`.toLowerCase()
      symbolVersion.index = index

      this.loadSymbolVersionDetail(path.join(symbolPath, verDir), symbolVersion)

      // TODO 比较verDir大小
      sb.latest = symbolVersion.version
      sb.allVersions.push(symbolVersion.version)
      sb.children.push(symbolVersion)
    }
  }

  public loadSymbolVersionDetail (versionPath: string, version: SymbolBlockVersion) {
    if (!fse.existsSync(versionPath)) {
      throw new Error('加载符号版本失败，路径不存在：' + versionPath)
    } else if (!fse.statSync(versionPath).isDirectory()) {
      throw new Error('加载符号版本失败，路径不是文件夹：' + versionPath)
    }
    const fileDirs = fse.readdirSync(versionPath)
    for (const fileDir of fileDirs) {
      const filePath = path.join(versionPath, fileDir)
      if (fse.statSync(filePath).isFile()) {
        if (fileDir.endsWith('.h')) {
          if (path.basename(fileDir, '.h') === version.name) {
            // 只保存原始头文件，可变类型由后面导出的时候再生成
            version.headFile = fse.readFileSync(filePath)
          }
        } else if (fileDir.endsWith('.c')) {
          if (path.basename(fileDir, '.c') === version.name) {
            // 只保存原始头文件，可变类型由后面导出的时候再生成
            version.srcFile = fse.readFileSync(filePath)
          }
        } else if (fileDir.endsWith('.a')) {
          if (path.basename(fileDir, '.a') === version.name) {
            // 只保存原始头文件，可变类型由后面导出的时候再生成
            version.libFile = fse.readFileSync(filePath)
          }
        } else if (fileDir.endsWith('.data')) {
          this.loadSymbolModel(filePath, version)
        } else if (fileDir.endsWith('.sym')) {
          this.loadSymbolGraph(filePath, version)
        }
      }
    }
  }

  public loadSymbolModel (dataPath: string, version: SymbolBlockVersion) {
    if (!fse.existsSync(dataPath)) {
      throw new Error('加载符号模型失败，路径不存在：' + dataPath)
    } else if (!fse.statSync(dataPath).isFile()) {
      throw new Error('加载符号模型失败，路径不是文件：' + dataPath)
    }
    const modelContent = fse.readFileSync(dataPath, { encoding: 'utf-8' })
    const dataEle = xml2js(modelContent, { alwaysChildren: true })
    if (R.isNotEmpty(dataEle.elements)) {
      const symDataEle = dataEle.elements[0] // <SYM_DATA>
      if (R.isNotEmpty(symDataEle.elements)) {
        const symLibEle = symDataEle.elements[0] // <symbol_library>
        if (R.isNotEmpty(symLibEle.elements)) {
          const symEle = symLibEle.elements[0] // <symbol>
          if (R.isNotEmpty(symEle.elements)) {
            const versionEle = symEle.elements[0] // <symbol_version>
            if (R.isNotEmpty(versionEle.elements)) {
              const varsEle = versionEle.elements[0]// <symbol_vars>
              if (R.isNotEmpty(varsEle.elements)) {
                for (const symVarEle of varsEle.elements) {
                  const { sym_var_type } = symVarEle.attributes
                  if (/SYMBOL_INPUT_VAR/.test(sym_var_type)) {
                    // 输入
                    const input = new SymbolBlockVarInput()
                    this.loadSymbolIOPAttr(symVarEle, input, version)
                    version.inputs.push(input)
                  } else if (/SYMBOL_OUTPUT_VAR/.test(sym_var_type)) {
                    // 输出
                    const output = new SymbolBlockVarOutput()
                    this.loadSymbolIOPAttr(symVarEle, output, version)
                    version.outputs.push(output)
                  } else if (/SYMBOL_CONST_VAR/.test(sym_var_type)) {
                    // 定值参数
                    const param = new SymbolBlockVarParam()
                    this.loadSymbolIOPAttr(symVarEle, param, version)
                    version.params.push(param)
                  } else if (/SYMBOL_INNER_VAR/.test(sym_var_type)) {
                    // 内部参数
                    const inner = new SymbolBlockVarInner()
                    this.loadSymbolIOPAttr(symVarEle, inner, version)
                    version.inners.push(inner)
                  } else if (/SYMBOL_OTHER_VAR/.test(sym_var_type)) {
                    // 其他
                    const other = new SymbolBlockVarOther()
                    this.loadSymbolIOPAttr(symVarEle, other, version)
                    version.others.push(other)
                  }
                }
              }
            }
          }
        }
      }
    }

    const jsonObj = _.cloneDeep(version)
    // 转json屏蔽部分内容
    jsonObj.modelFile = undefined
    jsonObj.graphicFile = undefined
    jsonObj.headFile = undefined
    jsonObj.srcFile = undefined
    jsonObj.libFile = undefined
    jsonObj.parent = undefined
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    delete jsonObj.children

    version.modelFile = JSON.stringify(jsonObj, null, 0)
  }

  private loadSymbolIOPAttr (symVarEle: ElementCompact, iop: SymbolBlockVarInput | SymbolBlockVarOutput | SymbolBlockVarParam | SymbolBlockVarInner | SymbolBlockVarOther, version: SymbolBlockVersion) {
    let prefixEnable = false
    for (const attrEle of symVarEle.elements) {
      const { name, value } = attrEle.attributes
      if (name === 'permis' || name === 'readonly') {
        // SKIP
      } else if (name === 'prefix_en') {
        // 变量名添加前缀
        prefixEnable = /1/.test(value)
      } else if (name === 'name') {
        iop.name = value.replace(/\[0*([0-9]+)]/, '[$1]')
      } else if (name === 'type') {
        iop.type = getVariableTypeEnum(value)
        if (R.isNotEmpty(attrEle.elements)) {
          // 可变类型
          for (const optTypeEle of attrEle.elements) {
            const optTypeObj = optTypeEle.attributes
            const optType = getVariableTypeEnum(optTypeObj.name)
            iop.optTypeList.push(optType)
          }
        }
      } else if (name === 'default') {
        iop.default = value
      }

      if (iop instanceof SymbolBlockVarInput || iop instanceof SymbolBlockVarOutput) {
        if (name === 'is_show_graph') {
          iop.isShowGraph = value
        }
      }

      if (iop instanceof SymbolBlockVarInput || iop instanceof SymbolBlockVarOutput || iop instanceof SymbolBlockVarParam) {
        if (name === 'abbr') {
          iop.abbr = value
        } else if (name === 'coeff') {
          iop.coeff = value
        } else if (name === 'desc') {
          iop.regName = value
        } else if (name === 'format') {
          iop.format = value
        } else if (name === 'level') {
          iop.level = Number(value) as TaskLevelEnum
        } else if (name === 'p_max') {
          iop.pMax = value
        } else if (name === 'p_min') {
          iop.pMin = value
        } else if (name === 'p_norm') {
          iop.pNorm = value
        } else if (name === 'reg_type') {
          iop.regType = value
        } else if (name === 's_max') {
          iop.sMax = value
        } else if (name === 's_min') {
          iop.sMin = value
        } else if (name === 's_norm') {
          iop.sNorm = value
        } else if (name === 'show_attr') {
          iop.showAttr = value
        } else if (name === 'unit') {
          iop.unit = value
        }
      }

      if (!(iop instanceof SymbolBlockVarOther)) {
        if (name === 'value') {
          iop.value = value
        }
      }
    }
    if (prefixEnable) {
      // 取消name的前缀
      iop.name = iop.name.replace(/^.*\./, '')
    }
    const { index } = symVarEle.attributes
    iop.index = index
    iop.pathId = `${version.pathId}/${iop.name}`.toLowerCase()
  }

  public loadSymbolGraph (symPath: string, version: SymbolBlockVersion) {
    if (!fse.existsSync(symPath)) {
      throw new Error('加载符号模型失败，路径不存在：' + symPath)
    } else if (!fse.statSync(symPath).isFile()) {
      throw new Error('加载符号模型失败，路径不是文件：' + symPath)
    }
    const modelContent = fse.readFileSync(symPath, { encoding: 'utf-8' })
    const dataEle = xml2js(modelContent, { alwaysChildren: true })

    if (R.isNotEmpty(dataEle.elements)) {
      const symbolEle = dataEle.elements[0]
      if (R.isNotEmpty(symbolEle.elements)) {
        for (const ele of symbolEle.elements) {
          if (ele.name === 'COMMENT_EN' || ele.name === 'COMMENT_ZH') {
            if (ele.cdata) {
              // COMMENT是help
              version.help = ele.cdata
            }
          } else if (ele.name === 'GRAPH') {
            // loadSymbolGraphStencil(ele, version) // mxgraph format loader
            // loadSymbolGraphJoint(ele, version) // jointjs format loader
          }
        }
      }
    }
    // 改为重新生成图形
    version.graphicFile = generateJointSymbolGraph(version)
  }
}
