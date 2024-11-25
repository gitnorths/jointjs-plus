import { Loading } from 'element-ui'

export const openWindowLoading = (loadingText) => {
  return Loading.service({
    lock: true,
    text: `${loadingText || '加载中...'}`,
    spinner: 'el-icon-loading',
    background: 'rgba(0, 0, 0, 0.8)'
  })
}

export * from './electronApi'
