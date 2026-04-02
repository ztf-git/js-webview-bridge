import { Observable, Subject, BehaviorSubject } from 'rxjs'
import { filter, map, take } from 'rxjs'
import JSBridge from './core/js-bridge'
import type { RegisterOptions } from './core/js-bridge'

export interface RxJSBridgeEvent<T = unknown> {
  key: string // 事件名
  params: T // 参数
}

class RxJSBridge extends JSBridge {
  protected static instance: RxJSBridge
  protected _stateMap = new Map<string, BehaviorSubject<unknown>>()
  // 全局事件总线（Native -> Web）
  protected _event = new Subject<RxJSBridgeEvent>()
  protected _registered = new Set<string>()
  public constructor() {
    super()
  }
  // 单列模式获取
  static getInstance() {
    if (!RxJSBridge.instance) {
      RxJSBridge.instance = new RxJSBridge()
    }
    return RxJSBridge.instance
  }

  /* --------------------------------
   * Web 调用 Native
   * -------------------------------- */
  rxCall<T = unknown, R = unknown>(handlerName: string, params: T) {
    return new Observable<R>(subscriber => {
      this.callSync(
        { handlerName, data: params },
        res => {
          subscriber.next(res as R)
          subscriber.complete()
        },
        e => {
          subscriber.error(e)
        }
      )
      // this.call({ handlerName, data: params })
      //   .then(res => {
      //     subscriber.next(res as R)
      //     subscriber.complete()
      //   })
      //   .catch(e => {
      //     subscriber.error(e)
      //   })
    })
  }

  // 设置/更新指定方法的回调值
  setState<T = unknown>(handlerName: string, value: T) {
    if (!this._registered.has(handlerName)) {
      return
    }
    let subject = this._stateMap.get(handlerName)
    if (!subject) {
      subject = new BehaviorSubject<unknown>(value)
      this._stateMap.set(handlerName, subject)
    } else {
      // 已存在直接 next 更新
      subject.next(value)
    }
  }
  // 获取指定方法回调的最新值
  getState<T = unknown>(handlerName: string): T | undefined {
    const subject = this._stateMap.get(handlerName)
    return subject?.getValue() as T | undefined
  }
  // 删除回调值
  delState(handlerName: string) {
    const state = this._stateMap.get(handlerName)
    if (state) {
      state.complete()
      this._stateMap.delete(handlerName)
    }
  }
  // 清空所有回调值
  clearState() {
    this._stateMap.forEach(subject => subject.complete())
    this._stateMap.clear()
  }

  /* --------------------------------
   * Native 事件注册（推送进 RxJS）
   * -------------------------------- */
  rxRegister<T = unknown, R = unknown>(handlerName: string, defaultState?: unknown) {
    if (this._registered.has(handlerName)) {
      return this
    }
    this._registered.add(handlerName)
    if (defaultState !== undefined) {
      this.setState(handlerName, defaultState)
    }
    const registerOptions: RegisterOptions<T, R> = {
      handlerName,
      handler: (data: T, callback) => {
        this._event!.next({
          key: handlerName,
          params: data
        })
        const state$ = this._stateMap.get(handlerName)
        if (state$?.getValue()) {
          callback(state$?.getValue() as R)
        }
      }
    }
    this.register(registerOptions)
    // this.register(handlerName, (data: T, callback) => {
    //   this._event!.next({
    //     key: handlerName,
    //     params: data
    //   })
    //   const state$ = this._stateMap.get(handlerName)
    //   callback(state$?.getValue() || null)
    // })
    return this
  }

  /* --------------------------------
   * 监听 Native 调用 Web 事件
   * -------------------------------- */
  on<T = unknown>(handlerName: string) {
    return this._event!.pipe(
      filter(e => e.key === handlerName),
      map(e => ({
        params: e.params as T
      }))
    )
  }
  /* --------------------------------
   * 监听 Native 调用 Web 事件 只监听一次
   * -------------------------------- */
  once<T = unknown>(handlerName: string) {
    return this.on<T>(handlerName).pipe(take(1))
  }
}
export default RxJSBridge
