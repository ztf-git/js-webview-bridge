import type { Bridge, RegisterOptions, CallOptions, CallInterceptor, CallbackInterceptor } from '../types/core'
type SetupBridgeCallback = (bridge: Bridge) => void
declare global {
  interface Window {
    WebViewJavascriptBridge?: Bridge
    WVJBCallbacks?: SetupBridgeCallback[]
  }
}

class JSBridge {
  protected _callInterceptor?: CallInterceptor
  protected _callbackInterceptor?: CallbackInterceptor
  public constructor() {}
  // 获取平台
  static getPlatform(): 'android' | 'ios' | 'unknown' {
    const ua = navigator.userAgent || navigator.vendor
    if (/android/i.test(ua)) {
      return 'android'
    }
    if (/iPad|iPhone|iPod/.test(ua)) {
      return 'ios'
    }
    return 'unknown'
  }
  // 同步写法提前放入任务队列WebViewJavascriptBridgeReady完成之后会自动清空任务队列
  setupJsBridge(callback: SetupBridgeCallback) {
    if (window.WebViewJavascriptBridge) {
      return callback(window.WebViewJavascriptBridge)
    }
    if (window.WVJBCallbacks) {
      return window.WVJBCallbacks.push(callback)
    }
    if (JSBridge.getPlatform() == 'ios') {
      window.WVJBCallbacks = [callback]
      const WVJBIframe = document.createElement('iframe')
      WVJBIframe.style.display = 'none'
      WVJBIframe.src = 'https://__bridge_loaded__'
      document.documentElement.appendChild(WVJBIframe)
      setTimeout(function () {
        document.documentElement.removeChild(WVJBIframe)
      }, 0)
    }
  }
  // 只有安卓支持异步获取WebViewJavascriptBridge实例
  whenReady(): Promise<Bridge> {
    return new Promise(resolve => {
      if (window.WebViewJavascriptBridge) {
        //do your work here
        resolve(window.WebViewJavascriptBridge)
      } else {
        document.addEventListener(
          'WebViewJavascriptBridgeReady',
          function () {
            //do your work here
            resolve(window.WebViewJavascriptBridge!)
          },
          false
        )
      }
    })
  }
  // call调用参数拦截器
  useCallInterceptor(interceptor: CallInterceptor) {
    this._callInterceptor = interceptor as CallInterceptor
    return this
  }
  // call的回调拦截器
  useCallbackInterceptor<R = unknown>(interceptor: CallbackInterceptor<R>) {
    this._callbackInterceptor = interceptor as CallbackInterceptor<unknown>
    return this
  }
  /** JS 调用 Native */
  callSync<R = unknown>(
    options: CallOptions,
    callback?: (response: R) => void,
    errorCallback?: (error: unknown) => void
  ) {
    this.setupJsBridge(bridge => {
      if (this._callInterceptor) {
        options = this._callInterceptor(options) as CallOptions
      }
      bridge.callHandler(options.handlerName, options.data, (res: unknown) => {
        try {
          let result: unknown = res
          if (this._callbackInterceptor) {
            result = this._callbackInterceptor(res)
          }
          callback?.(result as R)
        } catch (error) {
          console.error('error', error)
          errorCallback?.(error)
        }
      })
    })
  }
  /** 异步调用 JS 调用 Native */
  call<R = unknown>(options: CallOptions): Promise<R> {
    return new Promise<R>((resolve, reject) => {
      this.setupJsBridge(bridge => {
        if (this._callInterceptor) {
          options = this._callInterceptor(options) as CallOptions
        }
        bridge.callHandler(options.handlerName, options?.data, (res: unknown) => {
          try {
            if (this._callbackInterceptor) {
              res = this._callbackInterceptor(res)
            }
            resolve(res as R)
          } catch (error) {
            reject(error)
          }
        })
      })
    })
  }
  /** Native 调用 JS */
  register<T = unknown, R = unknown>(options: RegisterOptions<T, R>) {
    this.setupJsBridge(bridge => {
      bridge.registerHandler(options.handlerName, options.handler)
    })
  }
}
export default JSBridge

export * from '../types/core'
