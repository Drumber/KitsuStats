<script setup>
import { reactive } from "vue";

const state = reactive({
  isExpanded: false,
});

const toggleMenu = () => {
  state.isExpanded = !state.isExpanded;
};

const vCloseOnClickOutside = {
  mounted: (el) => {
    el.clickEventListener = (event) => {
      if (
        state.isExpanded === true &&
        !(el == event.target || el.contains(event.target))
      ) {
        state.isExpanded = false;
      }
    };
    document.body.addEventListener("click", el.clickEventListener);
  },
  unmounted: (el) => {
    document.body.removeEventListener("click", el.clickEventListener);
  },
};

const vCloseOnEscape = {
  mounted: (el) => {
    el.keyEventListener = (event) => {
      if (state.isExpanded === true && event.key === "Escape") {
        state.isExpanded = false;
      }
    };
    document.body.addEventListener("keydown", el.keyEventListener);
  },
  unmounted: (el) => {
    document.body.removeEventListener("keydown", el.keyEventListener);
  },
};
</script>

<template>
  <div v-closeOnClickOutside v-closeOnEscape>
    <div @click="toggleMenu">
      <slot><!-- Trigger Source --></slot>
    </div>
    <div
      v-if="state.isExpanded"
      @click="toggleMenu"
      class="absolute mt-1 p-2 right-4 bg-background-100/30 dark:bg-background-600/40 backdrop-blur shadow-md z-50 rounded-md"
    >
      <slot name="menu"><!-- Menu Content --></slot>
    </div>
  </div>
</template>
