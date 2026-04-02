# js-webview-bridge简介

基于 **RxJS** 对传统 `js-bridge` 进行封装的 Web 侧通信库，  
将 Native → Web 的调用建模为 **事件流 + 状态快照**，  
用于解决多模块监听、回调耦合和状态同步问题。

基于以下原生插件实现的H5侧通信插件：
- Android：https://github.com/uknownothingsnow/JsBridge
- iOS：https://github.com/marcuswestin/WebViewJavascriptBridge

## 源码地址
- github https://github.com/ztf-git/js-webview-bridge
- gitee https://gitee.com/ztf160/js-webview-bridge

## 使用
安装依赖<br/>
pnpm add js-webview-bridge<br/>
pnpm add rxjs(可选使用带rxjs能力时需要)

### 不使用 RxJS（仅使用原始 js-bridge）

```ts
import { isJsonStr } from "@/utils";
import JsBridge from "js-webview-bridge";
import type { CallOptions } from "js-webview-bridge";

const jsBridge = new JsBridge()
jsBridge.setupJsBridge(bridge => {
  console.log('init', bridge)
  bridge.init((message, responseCallback) => {
    console.log('JS got a message', message)
    responseCallback('JS init response')
  })
})
// 调用拦截 可在此设置全局参数
jsBridge.useCallInterceptor((config: CallOptions) => {
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
jsBridge.useCallbackInterceptor((res: string) => {
  if(isJsonStr(res)) {
    const json = JSON.parse(res) as { message: unknown }
    return json.message
  } else {
    throw new Error('返回数据格式错误')
  }
})
// js注册方法供native调用
jsBridge.register({
  handlerName: "handlerName",
  handler: (data, callback) => {
    console.log("H5 接收到的参数：", data);
    const ret = { message: 'hello world'}
    callback(ret);
  },
}): void
// js调用native 同步调用
 jsBridge.callSync({
      handlerName: 'handlerName',
      data: { message: 'hello' }
    }, res => {
      console.log(res)
    }, (e) => {
     console.log(e.message)
  }): void
 // js调用native 异步调用
 jsBridge.call({
      handlerName: 'handlerName',
      data: { name: 'test' }
    })
    .then((res:unknown) => {
      console.log('====res', res)
      message.value = res as string
    })
    .catch(error => {
      console.log('==handleAndroid==error', error.message)
    })
// 静态方 法获取当前平台
JsBridge.getPlatform(): 'android' | 'ios' | 'unknown'
 export { jsBridge }
```

### 使用 RxJsBridge

```ts
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
const rxJsBridge = RxJsBridge();
rxJsBridge.setupJsBridge(bridge => {
  console.log('init', bridge)
  bridge.init((message, responseCallback) => {
    console.log('JS got a message', message)
    responseCallback('JS init response')
  })
})
// 调用拦截 可在此设置全局参数
rxJsBridge.useCallInterceptor((config: string) => {
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
// 注册方法 给android端调用
// 统一注册方法 给android端调用
rxJsBridge.rxRegister(TEST_H5, null)
// 当作enevt事件使用
rxJsBridge.rxRegister(BRIDGE_EVENT, null)
export { rxJsBridge }
```
### vue组件中使用
```ts
import { TEST_H5 } from "@/native/constants/h5-keys";
import { BRIDGE_EVENT } from "@/native/constants/event-keys";
import { TEST_ANDROID } from "@/native/constants/native-keys";
import { rxJsBridge, type BridgeEvent } from "@/native/rx-js-bridge";
import { Subscription } from "rxjs";
const h5State = ref(1);
const message = ref("");
const sub_enevt = shallowRef<null | Subscription >(null)
const setH5State = () => {
  if (h5State.value > 10) {
    h5State.value = 0;
    rxJsBridge.setState(TEST_H5, 0);
    return;
  }
  h5State.value = h5State.value + 1;
  // 可跨组件更新值
  rxJsBridge.setState(TEST_H5, h5State.value);
};
const handleAndroid = () => {
    rxJsBridge.rxCall(TEST_ANDROID, {name: 'test'}).subscribe((res:unknown) => {
        message.value = res as string
    })
};
// 发送事件
const sendEvent = () => {
    const data: BridgeEvent = { id: 'test', type: 'notice' }
    // 给Android发送事件
    rxJsBridge.call({
      handlerName: BRIDGE_EVENT,
      data
    })
}
onMounted(() => {
  // 当作enevt事件使用
  sub_enevt.value = rxJsBridge.on(BRIDGE_EVENT).subscribe(({ params }) => {
    console.log("收到原生发送的事件，参数", params);
    sendEvent()
  });
  rxJsBridge.once(TEST_H5).subscribe(({ params }) => {
    console.log("Native 传入的参数：", params);
  });
});
onUnmounted(() => {
  sub_enevt.value?.unsubscribe();
});
```
#### 详细示例请阅 apps/web/vue-demo/src/views/rx_demo.vue
#### android示例请阅 apps/android-demo/app/src/main/java/com/ztf/android_demo/activity/MainActivity.java
#### js注册方法供native调用
```ts
/**
 * 注意：
 * rxRegister 注册的是「状态型 handler」
 * webview 调用该 handler 时，回调返回的是当前通过 setState 设置的状态值，
 * 而不是等待 JS 侧逻辑执行完成后的结果。
 *
 * 因此建议：
 * - 在项目入口统一 rxRegister
 * - 在各业务模块中通过 on / once 监听事件
 */

// 注册方法供 webview 调用（建议在项目入口统一注册）
rxJsBridge.rxRegister('handlerName', { name: null }): RxJSBridge

// 设置 / 更新该 handler 的状态值（webview 调用时会同步返回此值）跨组件更新
rxJsBridge.setState('handlerName', { name: 'hello' }): void

// 获取该 handler 当前的状态值
rxJsBridge.getState('handlerName'): unknown | undefined

// 删除该 handler 的状态（删除后 webview 调用回调为 null）
rxJsBridge.delState('handlerName'): void

// 清空所有 handler 的状态（所有回调均返回 null）
rxJsBridge.clearState(): void

```
## 导出说明
```ts
import JsBridge from "js-webview-bridge";
import RxJsBridge from "js-webview-bridge/rx";
```
- **`JSBridge` / `RxJSBridge`** 
  未初始化的类，用于 **自定义扩展或继承**。  
  可通过其静态方法 `getInstance()` 获取单例实例；  

## 设计理念

传统 js-bridge 通常采用「请求 - 回调」模型，在复杂业务场景中容易出现：

- 多模块同时监听同一 webview 调用
- 回调耦合、状态难以复用
- 调用顺序和生命周期难以管理

`js-webview-bridge"` 将 webview → Web 的调用建模为：

- **事件流（Observable）**：用于分发调用事件
- **状态快照（BehaviorSubject）**：用于同步当前状态

从而实现：

- 统一注册，分散监听
- 状态与事件解耦
- 自动取消订阅，避免内存泄漏

### 运行

```bash
pnpm run dev
// android
cd apps/android-demo
// 修改MainActivitywebview加载地址为你的地址
 webView.loadUrl("http://xxx.xxx.xx.xxx:5173/");
// 获取设备列表
adb devices
// 安装并运行安卓到指定设备
./gradlew assembleDebug installDebug -Pandroid.injected.device.serial=设备ID && \
adb -s 设备ID shell am start -n com.ztf.android_demo/.activity.MainActivity

```

### 构建

```bash
pnpm run build --filter=js-webview-bridge
```