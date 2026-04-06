# js-webview-bridge

🚀 一个轻量、可扩展、响应式的 WebView 通信桥（H5 ↔ Native）。

> 设计理念：将传统基于回调的 WebView 通信升级为 **基于事件流（RxJS）的响应式通信模型**，统一“调用 + 事件 + 状态”，让跨端通信像操作数据流一样简单、可组合、可扩展。

---

# ✨ 特性

* ✅ 统一 H5 ↔ Native 通信模型
* ✅ Promise + Observable 双模式调用
* ✅ RxJS 事件系统（Native → Web）
* ✅ 内置状态同步（BehaviorSubject）
* ✅ 请求/响应拦截器（middleware）
* ✅ 跨组件通信能力
* ✅ TypeScript 支持

---

# 📦 安装依赖

pnpm add js-webview-bridge

pnpm add rxjs（可选/使用rx扩展必选）

---

# 🚀 快速开始

---

### 运行

```bash
pnpm run dev

# android
cd apps/android-demo

# 修改 MainActivity 中 WebView 加载地址为你的本地地址
webView.loadUrl("http://xxx.xxx.xx.xxx:5173/");

# 获取设备列表
adb devices

# 安装并运行到指定设备
./gradlew assembleDebug installDebug -Pandroid.injected.device.serial=设备ID
# 运行应用
adb -s 设备ID shell am start -n com.ztf.android_demo/.activity.MainActivity
```

---

### 示例位置

* Web 示例：apps/web/vue-demo/src/views/rx_demo.vue
* Android 示例：apps/android-demo/app/src/main/java/com/ztf/android_demo/activity/MainActivity.java

---

## 初始化

```ts
import RxJsBridge from 'js-webview-bridge/rx'

const bridge = new RxJsBridge()

bridge.setupJsBridge(b => {
  b.init((message, callback) => {
    console.log('Native -> H5:', message)
    callback('H5 ready')
  })
})
```

---

# 🔧 拦截器（核心能力）

## 请求拦截

```ts
bridge.useCallInterceptor(config => ({
  ...config,
  data: {
    ...config.data,
    source: 'web',
    timestamp: Date.now()
  }
}))
```

## 响应拦截

```ts
bridge.useCallbackInterceptor(res => {
  try {
    return JSON.parse(res)
  } catch {
    return res
  }
})
```

---

# 📡 调用 Native

## Promise

```ts
bridge.call({ handlerName: 'getUser', data: { id: 1 } })
  .then(console.log)
```

## RxJS

```ts
bridge.rxCall('getUser', { id: 1 })
  .subscribe(console.log)
```

---

# 📥 Native → Web（事件流）

## 注册

```ts
bridge.rxRegister('USER_UPDATE')
```

## 监听

```ts
const sub = bridge.on('USER_UPDATE').subscribe(({ params }) => {
  console.log(params)
})
```

## 一次监听

```ts
bridge.once('USER_UPDATE').subscribe(console.log)
```

## 取消订阅

```ts
sub.unsubscribe()
```

---

# 🔄 状态管理（跨组件）

```ts
bridge.setState('USER', { name: 'Tom' })
const user = bridge.getState('USER')
```

---

# 📤 发送事件给 Native

```ts
bridge.call({
  handlerName: 'BRIDGE_EVENT',
  data: {
    id: '1',
    type: 'notice',
    data: { msg: 'hello' }
  }
})
```

---

# 🧠 设计理念（为什么用 RxJS）

传统 WebView Bridge 存在问题：

* ❌ 只能 callback / Promise
* ❌ 无法表达“持续事件”（如推送）
* ❌ 状态难同步
* ❌ 多组件通信困难

## 👉 引入 RxJS 的目的：

### 1. 统一“请求 + 事件 + 状态”模型

| 能力   | RxJS 对应              |
| ---- | -------------------- |
| 单次调用 | Promise / Observable |
| 事件推送 | Subject              |
| 状态共享 | BehaviorSubject      |

---

### 2. 天然支持流式数据

例如：

* 文件分片
* WebRTC 信令
* 音视频流

---

### 3. 响应式编程优势

* 自动订阅/取消
* 操作符（filter / map / take）
* 易组合

---

👉 本库核心思想：

> 将 WebView 通信从“函数调用”升级为“事件流系统”

---

# 🏗️ 架构设计

```
Transport Layer（传输层）
  - WebViewJavascriptBridge
  - Android JsBridge

        ↓

Protocol Layer（协议层）
  - handlerName
  - BridgeEvent（id/type/data）

        ↓

Runtime Layer（运行时）
  - RxJS
  - Event Bus（Subject）
  - State（BehaviorSubject）
```

---

# 🔄 事件流模型

```
Native → Bridge → RxJS Subject → Web 订阅者
```

详细流程：

1. Native 调用 handler
2. bridge.registerHandler 捕获
3. 推送到 RxJS Subject
4. Web 通过 on() 订阅
5. 触发 UI / 逻辑更新

---

# 🔌 原生桥接实现

本库使用以下原生插件实现：

* Android: [https://github.com/uknownothingsnow/JsBridge](https://github.com/uknownothingsnow/JsBridge)
* iOS: [https://github.com/marcuswestin/WebViewJavascriptBridge](https://github.com/marcuswestin/WebViewJavascriptBridge)

---

# 📁 Vue 示例

```ts
const message = ref('')

const callNative = () => {
  bridge.rxCall('TEST_ANDROID', { name: 'test' })
    .subscribe(res => {
      message.value = res
    })
}
```

```ts
onMounted(() => {
  const sub = bridge.on('BRIDGE_EVENT')
    .subscribe(({ params }) => {
      console.log('Native:', params)
    })

  onUnmounted(() => sub.unsubscribe())
})
```

---

# 📚 API

## Core

| 方法 | 入参 | 返回 | 说明 |
|------|------|------|------|
| setupJsBridge | (callback: (bridge: Bridge) => void) | void | 初始化桥接实例 |
| call | (options: CallOptions) | Promise<R> | Promise 方式调用 Native |
| callSync | (options: CallOptions, callback?: (R) => void, errorCallback?: (unknown) => void) | void | 回调方式调用 Native |
| register | (options: RegisterOptions<T, R>) | void | Native 调用 JS |

---

## RxJS

| 方法 | 入参 | 返回 | 说明 |
|------|------|------|------|
| rxCall | (handlerName: string, params: T) | Observable<R> | Observable 调用 Native |
| rxRegister | (handlerName: string, defaultState?: unknown) | this | 注册 Native 推送事件 |
| on | (handlerName: string) | Observable<{ params: T }> | 监听 Native 事件 |
| once | (handlerName: string) | Observable<{ params: T }> | 只监听一次 Native 事件 |

---

## State

| 方法 | 入参 | 返回 | 说明 |
|------|------|------|------|
| setState | (handlerName: string, value: T) | void | 设置状态 |
| getState | (handlerName: string) | T \| undefined | 获取状态 |
| delState | (handlerName: string) | void | 删除指定状态 |
| clearState | () | void | 清空所有状态 |

---

## 类型说明（Types）

```ts
type CallOptions = {
  handlerName: string
  data?: unknown
}

type RegisterOptions<T, R> = {
  handlerName: string
  handler: (data: T, responseCallback: (response: R) => void) => void
}

type CallInterceptor = (config: CallOptions) => CallOptions | unknown

type CallbackInterceptor<R = unknown> = (res: R) => R | unknown
```
---

# 🧩 扩展能力

本库支持通过继承 JSBridge 实现自定义扩展能力。  
你可以基于 JSBridge 创建自己的桥接实例，从而扩展：  
* 自定义通信协议
* 增强拦截器逻辑
* 增加鉴权 / 日志 / 埋点
* 封装业务级 API

---
# 📦 源码地址

* GitHub: [https://github.com/ztf-git/js-webview-bridge](https://github.com/ztf-git/js-webview-bridge)
* Gitee: [https://gitee.com/ztf160/js-webview-bridge](https://gitee.com/ztf160/js-webview-bridge)

⭐ 支持一下

如果这个项目对你有帮助：  

👉 请点个 ⭐ Star  
👉 你的支持是我持续优化的动力 🚀  