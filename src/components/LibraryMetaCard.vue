<script setup>
import { use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { PieChart } from "echarts/charts";
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
} from "echarts/components";
import VChart from "vue-echarts";
import { onBeforeUnmount, onMounted, reactive, ref, watchEffect } from "vue";
import resolveConfig from "tailwindcss/resolveConfig";
import tailwindConfig from "tailwind.config.js";

use([
  CanvasRenderer,
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
]);

const props = defineProps(["animeMetaData", "mangaMetaData"]);
const fullConfig = resolveConfig(tailwindConfig);
const chart = ref(null);

const state = reactive({
  isLoading: true,
});

const responsiveChart = {
  lg: {
    seriesAnime: {
      radius: "55%",
      center: ["35%", "55%"],
    },
    seriesManga: {
      radius: "55%",
      center: ["75%", "55%"],
    },
    titleAnime: {
      left: "35%",
      bottom: 0,
    },
    titleManga: {
      left: "75%",
      bottom: 0,
    },
  },
  md: {
    seriesAnime: {
      radius: "30%",
      center: ["60%", "26%"],
    },
    seriesManga: {
      radius: "30%",
      center: ["60%", "73%"],
    },
    titleAnime: {
      left: "60%",
      bottom: "48%",
    },
    titleManga: {
      left: "60%",
      bottom: 0,
    },
  },
  sm: {
    seriesAnime: {
      radius: "54px",
      center: ["50%", "26%"],
    },
    seriesManga: {
      radius: "54",
      center: ["50%", "66%"],
    },
    titleAnime: {
      left: "50%",
      bottom: "53%",
    },
    titleManga: {
      left: "50%",
      bottom: "12%",
    },
  },
};

const option = ref({
  backgroundColor: "rgba(0, 0, 0, 0)",
  title: [
    {
      subtext: "Anime",
      textAlign: "center",
      ...responsiveChart.lg.titleAnime,
    },
    {
      subtext: "Manga",
      textAlign: "center",
      ...responsiveChart.lg.titleManga,
    },
  ],
  tooltip: {
    trigger: "item",
    formatter: "{a} </br>{b}: {c} ({d}%)",
  },
  legend: {
    orient: "vertical",
    left: "left",
    bottom: "top",
    data: ["Current", "Completed", "Planned", "On Hold", "Dropped"],
  },
  series: [
    {
      name: "Anime",
      type: "pie",
      ...responsiveChart.lg.seriesAnime,
      data: undefined,
      stillShowZeroSum: false,
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: "rgba(0, 0, 0, 0.5)",
        },
      },
      label: {
        backgroundColor: "transparent",
        formatter: "{b} ({c})",
      },
    },
    {
      name: "Manga",
      type: "pie",
      ...responsiveChart.lg.seriesManga,
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: "rgba(0, 0, 0, 0.5)",
        },
      },
      label: {
        backgroundColor: "transparent",
        formatter: "{b} ({c})",
      },
    },
  ],
});

const createChartData = (statusCounts) => [
  {
    name: "Current",
    value: statusCounts.current,
  },
  {
    name: "Completed",
    value: statusCounts.completed,
  },
  {
    name: "Planned",
    value: statusCounts.planned,
  },
  {
    name: "Dropped",
    value: statusCounts.dropped,
  },
  {
    name: "On Hold",
    value: statusCounts.onHold,
  },
];

watchEffect(() => {
  if (!props.animeMetaData || !props.mangaMetaData) return;

  const animeStatusCounts = props.animeMetaData.statusCounts;
  const mangaStatusCounts = props.mangaMetaData.statusCounts;

  const animeChartData = createChartData(animeStatusCounts);
  const mangaChartData = createChartData(mangaStatusCounts);

  option.value.series[0].data = animeChartData;
  option.value.series[1].data = mangaChartData;
  state.isLoading = false;
});

const resizeObserver = new ResizeObserver(() => {
  const width = window.innerWidth;
  const breakPointLg = parseInt(fullConfig.theme.screens.lg);
  const breakPointMd = parseInt(fullConfig.theme.screens.md);
  const breakPointSm = parseInt(fullConfig.theme.screens.sm);

  let breakPointName = "lg";
  let legendOrientation = "vertical";

  if (width < breakPointLg && width >= breakPointMd) {
    breakPointName = "md";
    legendOrientation = "vertical";
  } else if (width < breakPointSm) {
    breakPointName = "sm";
    legendOrientation = "horizontal";
  }

  let seriesAnime = responsiveChart[breakPointName].seriesAnime;
  let seriesManga = responsiveChart[breakPointName].seriesManga;
  let titleAnime = responsiveChart[breakPointName].titleAnime;
  let titleManga = responsiveChart[breakPointName].titleManga;

  Object.assign(option.value.series[0], seriesAnime);
  Object.assign(option.value.series[1], seriesManga);
  Object.assign(option.value.title[0], titleAnime);
  Object.assign(option.value.title[1], titleManga);
  option.value.legend.orient = legendOrientation;
});

onMounted(() => {
  resizeObserver.observe(chart.value.getDom());
});
onBeforeUnmount(() => {
  resizeObserver.unobserve(chart.value.getDom());
});
</script>

<template>
  <div class="card flex flex-col">
    <h1 class="text-2xl mb-1 font-semibold">Library Status</h1>
    <v-chart
      class="grow"
      ref="chart"
      :option="option"
      :loading="state.isLoading"
      :autoresize="true"
    />
  </div>
</template>
