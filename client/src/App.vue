<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup lang="ts">
</script>

<style>
/* 全局样式重置 */
html,
body {
  margin: 0 !important;
  padding: 0 !important;
  width: 100% !important;
  height: 100% !important;
  overflow: hidden !important;
  position: relative !important;
  overscroll-behavior: none !important;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  overscroll-behavior: none !important;
}

#app {
  width: 100% !important;
  height: 100% !important;
  overflow: hidden !important;
  position: relative !important;
  overscroll-behavior: none !important;
}

/* 消除所有可能的滚动 */
html, body, #app {
  scrollbar-width: none !important; /* Firefox */
  -ms-overflow-style: none !important; /* IE/Edge */
}

html::-webkit-scrollbar,
body::-webkit-scrollbar,
#app::-webkit-scrollbar {
  display: none !important; /* Chrome/Safari */
  width: 0 !important;
  height: 0 !important;
}

/* 防止任何元素导致页面滚动 */
* {
  overscroll-behavior: none !important;
}

/* Element Plus 弹窗相关样式 - 防止弹窗导致页面滚动 */
.el-overlay {
  overflow: hidden !important;
}

.el-dialog__wrapper {
  overflow: hidden !important;
}

/* 确保所有弹窗不会影响主布局 */
body > .el-overlay {
  position: fixed !important;
}

/* 防止任何固定/绝对定位元素影响布局 */
body > *:not(#app) {
  position: fixed !important;
}
</style>
