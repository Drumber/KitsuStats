<script setup>
defineProps(["value"]);
defineEmits(["update:value"]);
</script>

<template>
  <input
    :value="value"
    @input="$emit('update:value', $event.target.value)"
    type="text"
    class="bg-background-200 dark:bg-background-700"
  />
</template>
