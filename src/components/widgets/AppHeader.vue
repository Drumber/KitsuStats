<script setup>
import ThemeSwitch from "./ThemeSwitch.vue";
</script>

<template>
  <header class="w-full p-4 flex sticky top-0 z-30 backdrop-blur-sm">
    <a href="/">KitsuStats</a>
    <div id="them-switch" class="ml-auto">
      <theme-switch></theme-switch>
    </div>
  </header>
</template>
