export interface Bridge {
  init: (handler: (message: unknown, responseCallback: (response: unknown) => void) => void) => void

  callHandler: <T = unknown, R = unknown>(
    handlerName: string,
    data?: T,
    responseCallback?: (response: R) => void
  ) => void

  registerHandler: <T = unknown, R = unknown>(
    handlerName: string,
    handler: (data: T, responseCallback: (response: R) => void) => void
  ) => void
}

export type RegisterOptions<T, R> = {
  handlerName: string
  handler: (data: T, responseCallback: (response: R) => void) => void
}
export type CallOptions = {
  handlerName: string
  data?: unknown
}
export type CallInterceptor = (config: CallOptions) => unknown

export type CallbackInterceptor<R = unknown> = (res: R) => unknown
