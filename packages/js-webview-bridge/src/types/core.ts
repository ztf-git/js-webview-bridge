export type RegisterOptions<T, R> = {
  handlerName: string
  handler: (data: T, responseCallback: (response: R) => void) => void
}
export type CallOptions = {
  handlerName: string
  data?: unknown
}
export type CallInterceptor = (config: CallOptions) => unknown

export type CallIbacknterceptor<R = unknown> = (res: R) => unknown
