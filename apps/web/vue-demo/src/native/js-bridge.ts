import { isJsonStr } from "@/utils";
import JsBridge from "js-webview-bridge";
import type { CallOptions } from "js-webview-bridge";

const jsBridge = new JsBridge()
jsBridge.setupJsBridge(bridge => {
  bridge.init((message, responseCallback) => {
    console.log('JS got a message', message)
    responseCallback('JS init response')
  })
})
// 调用拦截 可在此设置全局参数
jsBridge.useCallInterceptor((config: CallOptions) => {
  return { message: config }
})
// 返回拦截 可在此设置统一返回
jsBridge.useCallbackInterceptor((res: string) => {
  if(isJsonStr(res)) {
    const json = JSON.parse(res) as { message: unknown }
    return json.message
  } else {
    throw new Error('返回数据格式错误')
  }
})
export { jsBridge }