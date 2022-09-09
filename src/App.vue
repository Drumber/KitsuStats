<script setup></script>

<template>
  <div
    class="w-full h-full grow flex flex-col items-stretch bg-fixed bg-center bg-cover bg-gradient-to-b from-sky-300 to-blue-500 dark:from-slate-800 dark:to-slate-900"
  >
    <main
      class="w-full h-full grow flex flex-col items-center justify-self-center"
    >
      <router-view></router-view>
    </main>
  </div>
</template>

<style scoped></style>
