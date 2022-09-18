<script setup>
import { BarChart } from "echarts/charts";
import {
  GridComponent,
  LegendComponent,
  TooltipComponent,
} from "echarts/components";
import { use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { reactive, ref, watchEffect } from "vue";
import VChart from "vue-echarts";

use([
  CanvasRenderer,
  BarChart,
  LegendComponent,
  TooltipComponent,
  GridComponent,
]);

const props = defineProps(["userStats"]);

const state = reactive({
  isLoading: true,
});

const option = ref({
  backgroundColor: "rgba(0, 0, 0, 0)",
  tooltip: {},
  legend: {
    bottom: 0,
    selectedMode: "single",
  },
  grid: {
    left: "1%",
    right: "5%",
    top: 5,
    bottom: "5%",
    containLabel: true,
  },
  xAxis: {},
  yAxis: {
    type: "category",
    inverse: true,
    data: [],
  },
  series: [
    {
      name: "Anime",
      type: "bar",
      realtimeSort: true,
      roundCap: true,
      data: [],
      label: {
        show: true,
        position: "right",
        backgroundColor: "transparent",
      },
    },
    {
      name: "Manga",
      type: "bar",
      realtimeSort: true,
      data: [],
      label: {
        show: true,
        position: "right",
        backgroundColor: "transparent",
      },
    },
  ],
});

const findStatsData = (stats, kind) => {
  return stats
    .filter((s) => s.attributes.kind === kind)
    .map((s) => s.attributes.statsData);
};

watchEffect(() => {
  if (!props.userStats) return;
  const stats = props.userStats;

  const animeCategoryBreakdown = findStatsData(stats, "anime-category-breakdown")[0]
  const animeCategories = animeCategoryBreakdown ? animeCategoryBreakdown.categories : [];

  const mangaCategoryBreakdown = findStatsData(stats, "manga-category-breakdown")[0]
  const mangaCategories = mangaCategoryBreakdown ? mangaCategoryBreakdown.categories : [];

  const categoryKeys = new Set([
    ...Object.keys(animeCategories),
    ...Object.keys(mangaCategories),
  ]);

  const dataAnime = [];
  const dataManga = [];

  for (const categoryKey of categoryKeys) {
    const valueAnime = animeCategories[categoryKey];
    const valueManga = mangaCategories[categoryKey];

    if (!valueAnime && !valueManga) {
      categoryKeys.delete(categoryKey);
      continue;
    }

    dataAnime.push(valueAnime ? valueAnime : null);
    dataManga.push(valueManga ? valueManga : null);
  }

  option.value.yAxis.data = [...categoryKeys];
  option.value.series[0].data = dataAnime;
  option.value.series[1].data = dataManga;

  state.isLoading = false;
});
</script>

<template>
  <div class="card flex flex-col">
    <h1 class="text-2xl mb-1 font-semibold">Categories</h1>
    <v-chart :option="option" :loading="state.isLoading" :autoresize="true" />
  </div>
</template>
