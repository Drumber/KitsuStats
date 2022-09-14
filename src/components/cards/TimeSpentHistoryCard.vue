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

moment.updateLocale("en", {
  relativeTime: {
    s: "",
    m: "1 minute",
    h: "1 hour",
    d: "1 day",
    M: "1 month",
    y: "1 year",
  },
});

const formatDuration = (val) => {
  return moment.duration(val, "minutes").humanize();
};

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
    left: 70,
  },
  xAxis: {
    type: "time",
    boundaryGap: false,
    splitArea: {
      show: true,
    },
  },
  yAxis: [
    {
      type: "value",
      alignTicks: true,
      axisLabel: {
        formatter: function (val) {
          return formatDuration(val);
        },
      },
    },
    {
      type: "value",
      alignTicks: true,
    },
  ],
  useUTC: true,
  series: [
    {
      name: "Anime",
      type: "line",
      symbol: "none",
      yAxisIndex: 0,
      tooltip: {
        valueFormatter: function (val) {
          return formatDuration(val);
        },
      },
      data: undefined,
    },
    {
      name: "Manga",
      type: "line",
      symbol: "none",
      yAxisIndex: 1,
      tooltip: {
        valueFormatter: function (val) {
          return val + " chapters";
        },
      },
      data: undefined,
    },
  ],
});

const getAmountAtDays = (libraryEntries, includedMedia) => {
  // transform library data
  const amountAtDays = {};
  for (const entry of libraryEntries) {
    const progress = entry.attributes.progress;
    if (!progress) continue;

    const timeStamp =
      entry.attributes.finishedAt || entry.attributes.progressedAt;
    if (!timeStamp) continue;

    const dayTime = moment.utc(timeStamp).startOf("day").valueOf();

    const relationshipAnime = entry.relationships.anime;
    const relationshipManga = entry.relationships.manga;

    let amount = 0;
    if (relationshipAnime) {
      const animeId = relationshipAnime.data.id;
      const anime = includedMedia.find((m) => m.id === animeId);
      if (anime) {
        amount = progress * anime.attributes.episodeLength;
      }
    }
    if (relationshipManga) {
      // the manga progress corresponds to the read chapter count
      amount = progress;
    }

    const prevAmount = amountAtDays[dayTime] || 0;
    amountAtDays[dayTime] = prevAmount + amount;
  }

  return amountAtDays;
};

const createChartData = (amountAtDay, minTime, maxTime) => {
  const data = [];
  const oneDay = 1000 * 60 * 60 * 24;

  const numDays = (maxTime - minTime) / 1000 / 60 / 60 / 24;

  let totalAmount = 0;
  for (let i = 0; i <= numDays; i++) {
    const day = minTime + i * oneDay;
    totalAmount += amountAtDay[day] || 0;
    data.push([day, totalAmount]);
  }

  return data;
};

watchEffect(() => {
  if (!props.animeLibraryData || !props.mangaLibraryData) return;

  const includedAnime = props.animeLibraryData.included || [];
  const includedManga = props.mangaLibraryData.included || [];

  const animeAmountAtDays = getAmountAtDays(
    props.animeLibraryData.data,
    includedAnime
  );
  const mangaAmountAtDays = getAmountAtDays(
    props.mangaLibraryData.data,
    includedManga
  );

  const animeTimeValues = Object.keys(animeAmountAtDays);
  const mangaTimeValues = Object.keys(mangaAmountAtDays);

  const minTime = Math.min(...animeTimeValues, ...mangaTimeValues);
  const maxTime = Math.max(...animeTimeValues, ...mangaTimeValues);

  const animeData = createChartData(animeAmountAtDays, minTime, maxTime);
  const mangaData = createChartData(mangaAmountAtDays, minTime, maxTime);

  option.value.series[0].data = animeData;
  option.value.series[1].data = mangaData;

  state.isLoading = false;
});
</script>

<template>
  <div class="card flex flex-col">
    <h1 class="text-2xl mb-1 font-semibold">Watch & Read History</h1>
    <p>History of the total time spent watching Anime and reading Manga chapters.</p>
    <v-chart :option="option" :loading="state.isLoading" :autoresize="true" />
  </div>
</template>
