<script setup>
import { reactive, ref, watchEffect } from "vue";
import { use } from "echarts/core";
import VChart from "vue-echarts";
import { CanvasRenderer } from "echarts/renderers";
import { LegendComponent } from "echarts/components";
import { RadarChart } from "echarts/charts";
import DropdownMenu from "./widgets/DropdownMenu.vue";

use([CanvasRenderer, RadarChart, LegendComponent]);

const props = defineProps(["animeLibraryData", "mangaLibraryData"]);

const state = reactive({
  isLoading: true,
  ratingSystem: "regular",
});

const setRatingSystem = (ratingSystem) => {
  state.ratingSystem = ratingSystem;
};

const option = ref({
  backgroundColor: "rgba(0, 0, 0, 0)",
  legend: {
    bottom: 0,
    data: ["Anime", "Manga"],
  },
  radar: {
    indicator: undefined,
    splitNumber: 4,
    splitArea: {
      show: true,
    },
    radius: 100,
  },
  series: [
    {
      name: "Ratings Given",
      type: "radar",
      data: undefined,
      symbol: "none",
      areaStyle: {
        opacity: 0.5,
      },
    },
  ],
});

const createChartData = (libraryEntries, size, stepSize, mapFunc) => {
  const libraryRatings = libraryEntries
    .filter((e) => e.attributes.ratingTwenty != null)
    .map((e) => mapFunc(e.attributes.ratingTwenty));
  const ratingCounts = [];
  for (let i = 1.0; i <= size; i += stepSize) {
    const count = libraryRatings.filter((e) => e === i).length;
    ratingCounts.push(count);
  }
  return ratingCounts;
};

const createIndicators = (maxValue, size, stepSize) => {
  const indicators = [];
  for (let i = 1.0; i <= size; i += stepSize) {
    indicators.push({ name: `${i}`, max: maxValue });
  }
  return indicators;
};

watchEffect(() => {
  if (!props.animeLibraryData || !props.mangaLibraryData) return;

  const animeEntries = props.animeLibraryData.data;
  const mangaEntries = props.mangaLibraryData.data;

  // TODO: auto detect rating system based on values
  const ratingSystem = state.ratingSystem;
  // default: advanced rating (20)
  let size = 10;
  let stepSize = 0.5;
  let mapFunc = (x) => x / 2.0;
  if (ratingSystem === "regular") {
    // regular rating (10)
    size = 5;
    stepSize = 0.5;
    mapFunc = (x) => Math.round(x / 2.0) / 2.0;
  } else if (ratingSystem === "simple") {
    // simple rating (5)
    size = 4;
    stepSize = 1;
    mapFunc = (x) => Math.round(x / 5.0);
  }

  const animeChartData = createChartData(animeEntries, size, stepSize, mapFunc);
  const mangaChartData = createChartData(mangaEntries, size, stepSize, mapFunc);

  const maxRatingAnime = Math.max(...animeChartData);
  const maxRatingManga = Math.max(...mangaChartData);

  const maxValue = 1.0;
  const indicators = createIndicators(maxValue, size, stepSize);
  option.value.radar.indicator = indicators;

  option.value.series[0].data = [
    {
      name: "Anime",
      value: animeChartData.map((x) => x / maxRatingAnime),
    },
    {
      name: "Manga",
      value: mangaChartData.map((x) => x / maxRatingManga),
    },
  ];
  state.isLoading = false;
});
</script>

<template>
  <div class="card flex flex-col z-[1]">
    <div class="flex">
      <h1 class="text-2xl mb-1 font-semibold">Ratings Given</h1>
      <DropdownMenu class="ml-auto self-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 48 48"
          height="24"
          width="24"
          class="cursor-pointer fill-black dark:fill-white"
        >
          <path
            d="M24 40q-1 0-1.7-.7t-.7-1.7q0-1 .7-1.7t1.7-.7q1 0 1.7.7t.7 1.7q0 1-.7 1.7T24 40Zm0-13.6q-1 0-1.7-.7t-.7-1.7q0-1 .7-1.7t1.7-.7q1 0 1.7.7t.7 1.7q0 1-.7 1.7t-1.7.7Zm0-13.6q-1 0-1.7-.7t-.7-1.7q0-1 .7-1.7T24 8q1 0 1.7.7t.7 1.7q0 1-.7 1.7t-1.7.7Z"
          />
        </svg>
        <template v-slot:menu>
          <h1 class="font-semibold mb-1">Rating System</h1>
          <p :class="{ selected: state.ratingSystem === 'simple' }">
            <button @click="setRatingSystem('simple')">Simple</button>
          </p>
          <p :class="{ selected: state.ratingSystem === 'regular' }">
            <button @click="setRatingSystem('regular')">Regular</button>
          </p>
          <p :class="{ selected: state.ratingSystem === 'advanced' }">
            <button @click="setRatingSystem('advanced')">Advanced</button>
          </p>
        </template>
      </DropdownMenu>
    </div>
    <v-chart
      class="grow"
      ref="chart"
      :option="option"
      :loading="state.isLoading"
      :autoresize="true"
    />
  </div>
</template>

<style scoped>
.selected {
  @apply font-semibold;
}
</style>
