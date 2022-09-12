<script setup>
defineProps(["value", "max"]);
</script>

<template>
  <div class="w-full h-1">
    <div
      class="h-full bg-primary-500 transition-all ease-out duration-500"
      :class="{ 'rounded-r': value < max }"
      :style="{ width: (value / max) * 100 + '%' }"
    ></div>
  </div>
</template>
