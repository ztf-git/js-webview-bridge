<script setup lang="ts">
import { RouterView } from "vue-router";
import { NConfigProvider, NDialogProvider, NMessageProvider } from "naive-ui";
const theme = {
  common: {
    primaryColor: "#818cf8",
    primaryColorHover: "#8b5cf6",
  },
};
</script>

<template>
  <n-config-provider class="h-full" :theme-overrides="theme">
    <n-dialog-provider>
      <n-message-provider>
        <RouterView />
      </n-message-provider>
    </n-dialog-provider>
  </n-config-provider>
</template>
