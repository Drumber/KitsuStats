<script setup>
import ThemeSwitch from "./ThemeSwitch.vue";
</script>

<template>
  <header class="w-full sticky top-0 z-30 backdrop-blur-sm">
    <div class="p-4 flex">
      <a href="/">KitsuStats</a>
      <div id="them-switch" class="ml-auto">
        <theme-switch></theme-switch>
      </div>
    </div>
    <slot></slot>
  </header>
</template>
