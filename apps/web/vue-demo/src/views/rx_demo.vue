<template>
  <div class="p-20px">
    <h1>rx-demo</h1>
    <n-button type="primary" @click="sendEvent" class="mr-10">send Event</n-button>
    <n-button type="primary" @click="setH5State">setH5State</n-button>
    <n-result status="404" title="h5State" description="setH5State">
      <template #footer>
        <n-tag>{{ h5State }}</n-tag>
      </template>
    </n-result>
    <n-button type="primary" @click="handleAndroid">handleAndroid</n-button>
    <n-result status="404" title="调用结果" description="handleAndroid">
      <template #footer>
        <n-tag>{{ message }}</n-tag>
      </template>
    </n-result>
  </div>
</template>
<script setup lang="ts">
import { TEST_H5 } from "@/native/constants/h5-keys";
import { BRIDGE_EVENT } from "@/native/constants/event-keys";
import { TEST_ANDROID } from "@/native/constants/native-keys";
import { rxJsBridge, type BridgeEvent } from "@/native/rx-js-bridge";
import { Subscription } from "rxjs";
const h5State = ref(1);
const message = ref("");
const sub_event = shallowRef<null | Subscription >(null)
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
    console.log('====handleAndroid')
    rxJsBridge.rxCall<{name: string},string>(TEST_ANDROID, {name: 'test'}).subscribe((res:string) => {
        console.log('====res', res)
        message.value = res
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
  sub_event.value = rxJsBridge.on(BRIDGE_EVENT).subscribe(({ params }) => {
    console.log("收到原生发送的事件，参数", params);
    sendEvent()
  });
  rxJsBridge.once(TEST_H5).subscribe(({ params }) => {
    console.log("Native 传入的参数：", params);
  });
});
onUnmounted(() => {
  sub_event.value?.unsubscribe();
});
</script>
