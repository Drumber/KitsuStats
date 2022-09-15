<script setup>
import { BarChart } from "echarts/charts";
import { GridComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { use } from "echarts/core";
import VChart from "vue-echarts";
import moment from "moment";
import { reactive, ref, watchEffect } from "vue";

const props = defineProps([
  "userModel",
  "userAttr",
  "animeMetaData",
  "mangaMetaData",
]);

use([CanvasRenderer, BarChart, GridComponent]);

const state = reactive({
  isLoading: true,
});

const option = ref({
  backgroundColor: "rgba(0, 0, 0, 0)",
  grid: {
    left: "1%",
    right: "5%",
    top: 10,
    bottom: "5%",
    containLabel: true,
  },
  xAxis: {
    show: false,
  },
  yAxis: {
    type: "category",
    inverse: true,
    data: ["Anime", "Manga"],
  },
  series: {
    name: "Media Kind",
    type: "bar",
    data: [],
    label: {
      show: true,
      position: "right",
      backgroundColor: "transparent",
    },
  },
});

watchEffect(() => {
  if (!props.animeMetaData || !props.mangaMetaData) return;

  const animeCount = props.animeMetaData.count;
  const mangaCount = props.mangaMetaData.count;

  option.value.series.data = [animeCount, mangaCount];
  state.isLoading = false;
});
</script>

<template>
  <div class="card h-full flex flex-col">
    <div class="flex items-start grow overflow-hidden">
      <!-- Profile Picture -->
      <img
        v-if="userAttr.avatar"
        :src="userAttr.avatar ? userAttr.avatar.medium : ''"
        class="rounded-full h-16 w-16 shrink-0 inline-block"
      />
      <div
        v-else
        class="h-16 w-16 shrink-0 rounded-full bg-white/10 inline-block"
      ></div>

      <div class="ml-4 w-full h-full overflow-hidden flex flex-col">
        <!-- Username and ID -->
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

        <!-- About User -->
        <div class="overflow-auto scrollbar-thin">
          <p class="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {{ userAttr.about }}
          </p>
        </div>
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

    <!-- Anime/Manga Chart -->
    <div class="w-full h-28 mt-1">
      <v-chart :option="option" :loading="state.isLoading" :autoresize="true" />
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
