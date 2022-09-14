<script setup>
import { BarChart } from "echarts/charts";
import { GridComponent, TooltipComponent } from "echarts/components";
import { use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { reactive, ref, watchEffect } from "vue";
import VChart from "vue-echarts";

use([CanvasRenderer, BarChart, TooltipComponent, GridComponent]);

const props = defineProps(["animeLibraryData"]);

const state = reactive({
  isLoading: true,
});

const option = ref({
  backgroundColor: "rgba(0, 0, 0, 0)",
  tooltip: {
    formatter: "{b}: {c}",
  },
  grid: {
    left: "1%",
    right: "5%",
    top: 10,
    bottom: "5%",
    containLabel: true,
  },
  xAxis: {},
  yAxis: {
    type: "category",
    inverse: true,
    data: [],
  },
  series: {
    name: "Anime",
    type: "bar",
    realtimeSort: true,
    data: [],
    label: {
      show: true,
      position: "right",
      backgroundColor: "transparent",
    },
  },
});

watchEffect(() => {
  if (!props.animeLibraryData) return;

  const includedAnime = props.animeLibraryData.included || [];

  const showTypeCounts = {};

  for (const anime of includedAnime) {
    const showType = anime.attributes.showType;

    const prevCount = showTypeCounts[showType] || 0;
    showTypeCounts[showType] = prevCount + 1;
  }

  const showTypes = Object.keys(showTypeCounts).map(
    (s) => s.charAt(0).toUpperCase() + s.slice(1)
  );
  const showTypesCountValues = Object.values(showTypeCounts);

  option.value.yAxis.data = showTypes;
  option.value.series.data = showTypesCountValues;
  state.isLoading = false;
});
</script>

<template>
  <div class="card flex flex-col">
    <h1 class="text-2xl mb-1 font-semibold">Anime Subtypes</h1>
    <v-chart :option="option" :loading="state.isLoading" :autoresize="true" />
  </div>
</template>
