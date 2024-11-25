import notification from '@/renderer/common/notification'
import { SymbolMakerService } from '@/service/SymbolMakerService'
// 新建符号库
export const createNewSymbolLIb = async (obj, archive) => {
  try {
    const symbolLib = await SymbolMakerService.createSymbolLib(obj, archive)
    notification.openSuccessNotification(`新建符号库 ${obj.name} 成功`).logger()
    return symbolLib
  } catch (e) {
    notification.openErrorNotification(`新建符号库 ${obj.name} 失败，${e}`).logger()
  }
}

export const updateSymbolLib = async (obj, archive) => {
  try {
    await SymbolMakerService.updateSymbolLib(obj, archive)
    notification.openSuccessNotification(`更新符号库 ${obj.name} 成功`).logger()
  } catch (e) {
    notification.openErrorNotification(`更新符号库 ${obj.name} 失败，${e}`).logger()
  }
}
