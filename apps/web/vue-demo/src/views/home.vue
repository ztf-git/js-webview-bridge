<template>
  <div class="p-20px">
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
import { TEST_ANDROID } from "@/native/constants/native-keys";
import { jsBridge } from "@/native/js-bridge";
const h5State = ref(1);
const message = ref("");
onMounted(() => {
  jsBridge.register({
    handlerName: TEST_H5,
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
const handleAndroid = () => {
  console.log("====handleAndroid");
  // jsBridge.callSync(TEST_ANDROID, {name: 'test'}, (res:unknown) => {
  //     console.log('====res', res)
  //     message.value = res as string
  // }, error => {
  //   console.log('==handleAndroid==error', error)
  // })
  jsBridge
    .call({
      handlerName: TEST_ANDROID,
      data: { name: "test" },
    }).then((res: unknown) => {
      console.log("====res", res);
      message.value = res as string;
    })
    .catch((error) => {
      console.log("==handleAndroid==error", error.message);
    });
};
</script>
