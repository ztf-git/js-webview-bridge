import { isJsonStr } from "@/utils";
import RxJsBridge from "js-webview-bridge/rx";
import type { CallOptions } from "js-webview-bridge";
import { TEST_H5 } from "./constants/h5-keys";
import { BRIDGE_EVENT } from "./constants/event-keys";
export interface BridgeEvent<T = unknown> {
  id: string              // 唯一ID（用于回调）
  type: string            // 事件类型（核心字段）
  data?: T              // 请求参数
  source?: 'web' | 'native'// 来源
  timestamp?: number       // 时间戳
}

const rxJsBridge = new RxJsBridge();
rxJsBridge.setupJsBridge(bridge => {
  console.log('init', bridge)
  bridge.init((message, responseCallback) => {
    console.log('JS got a message', message)
    responseCallback('JS init response')
  })
})
// 调用拦截 可在此设置全局参数
rxJsBridge.useCallInterceptor((config: CallOptions) => {
  if(config.handlerName === BRIDGE_EVENT) {
    const data = {
      ...config.data as BridgeEvent,
      source: 'web',
      timestamp: Date.now()
    }
    config.data = data
  }
  return config
})
// 返回拦截 可在此设置统一返回
rxJsBridge.useCallbackInterceptor((res: string) => {
  console.log('===useCallInterceptor==', res, typeof res)
  if(isJsonStr(res)) {
    const json = JSON.parse(res) as { message: unknown }
    return json.message
  } return res
})
// 统一注册方法 给android端调用
rxJsBridge.rxRegister(TEST_H5, null)
// 当作enevt事件使用
rxJsBridge.rxRegister(BRIDGE_EVENT, null)
// export const callEvent = (options: {id: string, type: string, data?: unknown}) => {
//   const data = {...options, source: 'web', timestamp: Date.now()}
//   rxJsBridge.call({
//     handlerName: BRIDGE_EVENT,
//     data
//   })
// }
export { rxJsBridge }
