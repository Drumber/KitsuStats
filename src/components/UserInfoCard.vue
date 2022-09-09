<script setup>
import moment from "moment";

defineProps(["userModel", "userAttr"]);
</script>

<template>
  <div class="flex items-start card">
    <img
      v-if="userAttr.avatar"
      :src="userAttr.avatar ? userAttr.avatar.medium : ''"
      class="rounded-full h-16 w-16 shrink-0 inline-block"
    />
    <div
      v-else
      class="h-16 w-16 shrink-0 rounded-full bg-white/10 inline-block"
    ></div>
    <div class="ml-4 w-full">
      <h1 class="text-2xl mb-1">
        <a
          :href="'https://kitsu.io/users/' + userModel.id"
          class="text-primary-500 dark:text-primary-400 font-semibold"
          target="_blank"
        >
          {{ userAttr.name }}
        </a>
        <span class="text-xs ml-1 text-gray-700/80 dark:text-gray-400/80">
          #{{ userModel.id }}
        </span>
      </h1>
      <p class="text-gray-700 dark:text-gray-300">{{ userAttr.about }}</p>
      <table class="table-auto w-full">
        <tr>
          <td>Join Date:</td>
          <td>{{ moment(userAttr.createdAt).format("LL") }}</td>
        </tr>
        <tr v-if="userAttr.location">
          <td>Location:</td>
          <td>{{ userAttr.location }}</td>
        </tr>
      </table>
    </div>
  </div>
</template>

<style scoped>
td {
  color: theme("textColor.gray.700");
}

.dark td {
  color: theme("textColor.gray.300");
}
</style>
