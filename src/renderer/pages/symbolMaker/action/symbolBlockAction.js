import notification from '@/renderer/common/notification'
import { SymbolMakerService } from '@/service/SymbolMakerService'

// 新建功能块
export const createNewBlock = async (newBlock, symbolLib) => {
  try {
    const symbolBlock = await SymbolMakerService.createSymbolBlock(newBlock, symbolLib)
    notification.openSuccessNotification(`新建功能块 ${newBlock.name} 成功`).logger()
    return symbolBlock
  } catch (e) {
    notification.openErrorNotification(`新建功能块 ${newBlock.name} 失败，${e}`).logger()
  }
}

export const updateSymbolBlock = async (obj, symbolLib) => {
  try {
    await SymbolMakerService.updateSymbolBlock(obj, symbolLib)
    notification.openSuccessNotification(`更新功能块 ${obj.name} 成功`).logger()
  } catch (e) {
    notification.openErrorNotification(`更新功能块 ${obj.name} 失败，${e}`).logger()
  }
}
