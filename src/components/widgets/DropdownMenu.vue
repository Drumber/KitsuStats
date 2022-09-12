<script setup>
import { computed, reactive } from "vue";

const props = defineProps({
  position: {
    type: String,
    default() {
      return "br";
    },
  },
  hover: {
    type: Boolean,
    default() {
      return false;
    },
  },
});

const state = reactive({
  isExpanded: false,
});

const positionClass = computed(() => {
  return `pos-${props.position}`;
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
  <div v-closeOnClickOutside v-closeOnEscape class="relative inline-block">
    <div
      @click="toggleMenu"
      @mouseover="state.isExpanded = hover ? true : state.isExpanded"
      @mouseleave="state.isExpanded = hover ? false : state.isExpanded"
    >
      <slot><!-- Trigger Source --></slot>
    </div>
    <div
      v-if="state.isExpanded"
      @click="toggleMenu"
      :class="[positionClass]"
      class="absolute w-max p-2 bg-background-100/30 dark:bg-background-600/40 backdrop-blur shadow-md z-50 rounded-md"
    >
      <slot name="menu"><!-- Menu Content --></slot>
    </div>
  </div>
</template>

<style scoped>
.pos-br {
  @apply mt-1 right-0;
  top: 100%;
}

.pos-tl {
  @apply mb-1 left-0;
  bottom: 100%;
}
</style>
