<script setup>
import ThemeSwitch from "./ThemeSwitch.vue";

const vOnScroll = {
  mounted: (el) => {
    el.scrollListener = (event) => {
      const scrollTop = event.target.documentElement.scrollTop;
      el.classList.toggle("scrolled", scrollTop > 100);
    };
    window.addEventListener("scroll", el.scrollListener);
  },
  unmounted: (el) => {
    window.removeEventListener("scroll", el.scrollListener);
  },
};
</script>

<template>
  <header
    v-on-scroll
    class="w-full sticky top-0 z-30 transition-all duration-300"
  >
    <div class="p-4 flex">
      <a href="/">KitsuStats</a>
      <div id="them-switch" class="ml-auto">
        <theme-switch></theme-switch>
      </div>
    </div>
    <slot></slot>
  </header>
</template>

<style scoped>
.scrolled {
  @apply bg-background-300/30 dark:bg-background-800/40 backdrop-blur-sm shadow-sm;
}
</style>
