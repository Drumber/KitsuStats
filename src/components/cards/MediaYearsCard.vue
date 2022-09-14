<script setup>
import { LineChart } from "echarts/charts";
import {
  DataZoomComponent,
  GridComponent,
  LegendComponent,
  TooltipComponent,
} from "echarts/components";
import { use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import moment from "moment";
import { reactive, ref, watchEffect } from "vue";
import VChart from "vue-echarts";

use([
  CanvasRenderer,
  LineChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
]);

const props = defineProps(["animeLibraryData", "mangaLibraryData"]);

const state = reactive({
  isLoading: true,
});

const option = ref({
  backgroundColor: "rgba(0, 0, 0, 0)",
  tooltip: {
    trigger: "axis",
  },
  legend: {},
  dataZoom: [
    {
      type: "inside",
      start: 0,
      end: 100,
    },
    {
      start: 0,
      end: 100,
    },
  ],
  grid: {
    top: 40,
  },
  xAxis: {
    boundaryGap: false,
    splitArea: {
      show: true,
    },
    data: [],
  },
  yAxis: {
    type: "value",
  },
  series: [
    {
      name: "Anime",
      type: "line",
      smooth: false,
      data: undefined,
    },
    {
      name: "Manga",
      type: "line",
      smooth: false,
      data: undefined,
    },
  ],
});

const countYears = (mediaData) => {
  const yearsCount = {};

  for (const media of mediaData) {
    const startDate = media.attributes.startDate;
    if (!startDate) continue;
    const year = moment(startDate).year();

    const prevCount = yearsCount[year] || 0;
    yearsCount[year] = prevCount + 1;
  }

  return yearsCount;
};

const createChartData = (yearCounts, minYear, maxYear) => {
  const size = maxYear - minYear + 1;
  const countData = new Array(size).fill(0);
  for (let i = minYear; i <= maxYear; i++) {
    const index = i - minYear;
    countData[index] = yearCounts[i] || 0;
  }
  return countData;
};

watchEffect(() => {
  if (!props.animeLibraryData || !props.mangaLibraryData) return;

  const includedAnime = props.animeLibraryData.included || [];
  const includedManga = props.mangaLibraryData.included || [];

  const animeYearCounts = countYears(includedAnime);
  const mangaYearCounts = countYears(includedManga);

  const allYears = [
    ...new Set([
      ...Object.keys(animeYearCounts),
      ...Object.keys(mangaYearCounts),
    ]),
  ].map((y) => parseInt(y));

  if (allYears.length === 0) {
    state.isLoading = false;
    return;
  }

  const minYear = Math.min(...allYears);
  const maxYear = Math.max(...allYears);

  const xAxisYears = [...Array(maxYear - minYear + 1).keys()].map(
    (x) => x + minYear
  );
  option.value.xAxis.data = xAxisYears;

  option.value.series[0].data = createChartData(
    animeYearCounts,
    minYear,
    maxYear
  );
  option.value.series[1].data = createChartData(
    mangaYearCounts,
    minYear,
    maxYear
  );
  state.isLoading = false;
});
</script>

<template>
  <div class="card flex flex-col">
    <h1 class="text-2xl mb-1 font-semibold">Media Years</h1>
    <v-chart :option="option" :loading="state.isLoading" :autoresize="true" />
  </div>
</template>
