# js-webview-bridge

一个轻量、可扩展、响应式的 WebView 通信桥（H5 ↔ Native）。

> 设计理念：将传统基于回调的 WebView 通信升级为 **基于事件流（RxJS）的响应式通信模型**，统一“调用 + 事件 + 动态回调数据”，让跨端通信像操作数据流一样简单、可组合、可扩展。

---

# 特性

* ✅ 统一 H5 ↔ Native 通信模型
* ✅ Promise + Observable 双模式调用
* ✅ RxJS 事件系统（Native → Web）
* ✅ 动态回调数据（BehaviorSubject）
* ✅ 请求/响应拦截器（middleware）
* ✅ 跨组件通信能力
* ✅ TypeScript 支持

---
#  快速开始

## 使用基础功能
###  安装依赖

```bash
pnpm add js-webview-bridge
```
### 创建jsBridge配置入口
@/native/js-bridge.ts
```ts
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
jsBridge.useCallInterceptor(config => ({
  ...config,
  data: {
    ...config.data,
    source: 'web',
    timestamp: Date.now()
  }
}))
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
```
### 页面中使用
```ts
<script setup lang="ts">
import { jsBridge } from "@/native/js-bridge";
const h5State = ref(1);
const message = ref("");
onMounted(() => {
  // 注册方法名为TEST_H5 js方法给安卓调用
  jsBridge.register({
    handlerName: 'TEST_H5',
    handler: (data, callback) => {
      console.log("H5 接收到的参数：", data);
      callback(h5State.value);
    },
  });
});
const setH5State = () => {
  if (h5State.value > 10) {
    h5State.value = 0; 
    return;
  }
  h5State.value = h5State.value + 1;
};
// 调用安卓并传参
const handleAndroid = () => {
  jsBridge.call<string>({
      handlerName: 'TEST_ANDROID',
      data: { name: "test" },
    }).then((res: string) => {
      message.value = res;
    }).catch((error) => {});
};
</script>
```
---
## 使用RxJsBridge扩展功能

### 安装依赖
```bash
pnpm add rxjs
```
### 创建jsBridge配置入口
@/native/rx-js-bridge.ts

```ts
import { isJsonStr } from "@/utils";
import RxJsBridge from "js-webview-bridge/rx";
import type { CallOptions } from "js-webview-bridge";
// 事件模型
export interface BridgeEvent<T = unknown> {
  id: string              // 唯一ID（用于回调）
  type: string            // 事件类型（核心字段）
  data?: T              // 请求参数
  source?: 'web' | 'native'// 来源
  timestamp?: number       // 时间戳
}
// 创建bridge实例
const rxJsBridge = new RxJsBridge();
// 初始化
rxJsBridge.setupJsBridge(bridge => {
  bridge.init((message, responseCallback) => {
    console.log('JS got a message', message)
    responseCallback('JS init response')
  })
})
// 设置全局参数拦截器
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
// 设置全局响应数据处理
rxJsBridge.useCallbackInterceptor((res: string) => {
  if(isJsonStr(res)) {
    const json = JSON.parse(res) as { message: unknown }
    return json.message
  } return res
})
// 注册方法 给android端调用
rxJsBridge.rxRegister('TEST_H5', null)
// 当作 event 事件使用
rxJsBridge.rxRegister('BRIDGE_EVENT', null)
export { rxJsBridge }
```
### 页面中使用
```ts
<script setup lang="ts">
import { rxJsBridge, type BridgeEvent } from "@/native/rx-js-bridge";
import { Subscription } from "rxjs";
const h5State = ref(1);
const message = ref("");
const sub_event = shallowRef<null | Subscription >(null)
const setH5State = () => {
  if (h5State.value > 10) {
    h5State.value = 0;
    rxJsBridge.setState('TEST_H5', 0);
    return;
  }
  h5State.value = h5State.value + 1;
  // 可跨组件更新值
  rxJsBridge.setState('TEST_H5', h5State.value);
};
const handleAndroid = () => {
    rxJsBridge
    .rxCall<{name: string},string>('TEST_ANDROID', {name: 'test'})
    .subscribe((res:string) => {
        message.value = res
    })
};
// 发送事件
const sendEvent = () => {
    const data: BridgeEvent = { id: 'test', type: 'notice' }
    // 给Android发送事件
    rxJsBridge.call({
      handlerName: 'BRIDGE_EVENT',
      data
    })
}
onMounted(() => {
  // 监听原生发送的事件
  sub_event.value = rxJsBridge.on('BRIDGE_EVENT').subscribe(({ params }) => {
    console.log("收到原生发送的事件，参数", params);
    sendEvent()
  });
  // 监听一次原生调用
  rxJsBridge.once('TEST_H5').subscribe(({ params }) => {
    console.log("Native 传入的参数：", params);
  });
});
onUnmounted(() => {
  sub_event.value?.unsubscribe();
});
</script>
```
# 拦截器
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
# 调用 Native

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

# Native → Web（事件流）

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
bridge.once('USER_UPDATE')
```

## 取消订阅

```ts
sub.unsubscribe()
```

---

# 动态回调数据（跨组件）
入口统一注册js时间名，可随时变更回调数据

```ts
// 设置js方法的回调数据
// 设置后原生下次调用TEST_H5方法时回调的值为setState更新的值
bridge.setState('TEST_H5', { name: 'Tom' })
// 获取当前js方法中的回调值，可用于检查回调参数是否正确
const callbackData = bridge.getState('TEST_H5')
```

---

# 发送事件给 Native

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

# 设计理念（为什么用 RxJS）

传统 WebView Bridge 存在问题：

* 只能 callback / Promise
* 无法表达“持续事件”（如推送）
* js方法注册后 回调参数不可变

## 引入 RxJS 的目的：

| 能力   | RxJS 对应              |
| ---- | -------------------- |
| 单次调用 | Promise / Observable |
| 事件推送 | Subject              |
| 可变的回调参数 | BehaviorSubject      |


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

## 示例位置

* Web 示例：apps/web/vue-demo/src/views/rx_demo.vue
* Android 示例：apps/android-demo/app/src/main/java/com/ztf/android_demo/activity/MainActivity.java

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
# 📦 源码地址

* GitHub: [https://github.com/ztf-git/js-webview-bridge](https://github.com/ztf-git/js-webview-bridge)
* Gitee: [https://gitee.com/ztf160/js-webview-bridge](https://gitee.com/ztf160/js-webview-bridge)

⭐ 支持一下

如果这个项目对你有帮助：  

👉 请点个 ⭐ Star  
👉 你的支持是我持续优化的动力 🚀  