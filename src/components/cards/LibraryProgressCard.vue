<script setup>
import { computed } from "vue";
import { HeatmapChart, LineChart } from "echarts/charts";
import {
  CalendarComponent,
  TooltipComponent,
  VisualMapComponent,
} from "echarts/components";
import { use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import moment from "moment";
import { reactive, ref, watchEffect } from "vue";
import VChart from "vue-echarts";
import DropdownMenu from "../widgets/DropdownMenu.vue";

use([
  CanvasRenderer,
  HeatmapChart,
  LineChart,
  VisualMapComponent,
  CalendarComponent,
  TooltipComponent,
]);

const props = defineProps(["libraryEvents", "libraryEventsFirstYear"]);
const emit = defineEmits(["update:progressHeatmapYear"]);

const currentYear = new Date().getFullYear();

const state = reactive({
  isLoading: true,
  selectedYear: currentYear,
  chartMode: "calendar",
});

const chart = ref(null);

const setChartMode = (mode) => {
  chart.value.clear();
  state.chartMode = mode;
};

const availableYears = computed(() => {
  const years = [currentYear];
  const firstYear = props.libraryEventsFirstYear;
  if (firstYear && firstYear < currentYear) {
    for (let year = currentYear - 1; year >= firstYear; year--) {
      years.push(year);
    }
  }
  return years;
});

const selectYear = (year) => {
  state.selectedYear = year;
  emit("update:progressHeatmapYear", year);
};

const optionCalendar = ref({
  backgroundColor: "rgba(0, 0, 0, 0)",
  tooltip: {
    formatter: function (x) {
      const format = moment(x.data[0]).format("LL");
      return `<b>${x.data[1]} progressed</b><br/>on ${format}`;
    },
  },
  visualMap: {
    show: true,
    min: 0,
    max: 1,
    orient: "horizontal",
    right: "right",
    bottom: "bottom",
  },
  calendar: {
    left: 45,
    right: 0,
    range: state.selectedYear.toString(),
    cellSize: ["auto", 20],
    yearLabel: {
      show: false,
    },
    itemStyle: {
      borderWidth: 0.5,
    },
  },
  series: {
    type: "heatmap",
    coordinateSystem: "calendar",
    data: undefined,
  },
});

const optionLine = ref({
  backgroundColor: "rgba(0, 0, 0, 0)",
  tooltip: {
    trigger: "axis",
    formatter: "<b>{c} progressed</b> in {b}",
  },
  xAxis: {
    type: "category",
    boundaryGap: false,
    data: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "June",
      "July",
      "Aug",
      "Sept",
      "Oct",
      "Nov",
      "Dec",
    ],
  },
  yAxis: {
    type: "value",
  },
  series: {
    type: "line",
    smooth: false,
    data: undefined,
  },
});

const option = computed(() => {
  if (state.chartMode === "calendar") {
    return optionCalendar.value;
  }
  if (state.chartMode === "line") {
    return optionLine.value;
  }
  return {};
});

const createHeatmapData = (libraryEvents, year) => {
  const progressedAtDayCounts = {};

  let maxCount = 1;

  for (const event of libraryEvents) {
    const createdAt = event.attributes.createdAt;
    if (!createdAt) {
      continue;
    }
    const date = moment(createdAt);

    if (date.year() !== year) {
      continue;
    }

    const formattedDate = date.format("yyyy-MM-DD");
    const prevCount = progressedAtDayCounts[formattedDate] || 0;
    const newCount = prevCount + 1;
    progressedAtDayCounts[formattedDate] = newCount;
    maxCount = Math.max(maxCount, newCount);
  }

  const data = [];
  for (const [date, count] of Object.entries(progressedAtDayCounts)) {
    data.push([date, count]);
  }
  return { data, maxCount };
};

const createLineData = (libraryEvents, year) => {
  const progressedAtMonths = new Array(12);

  for (const event of libraryEvents) {
    const createdAt = event.attributes.createdAt;
    if (!createdAt) {
      continue;
    }

    const date = moment(createdAt);
    if (date.year() !== year) {
      continue;
    }

    const month = date.month();
    const prevValue = progressedAtMonths[month] || 0;
    progressedAtMonths[month] = prevValue + 1;
  }

  // fill '0' between valid data points to get a continuous line
  const firstDataIndex = progressedAtMonths.findIndex((x) => x !== undefined);
  const lastDataIndex = progressedAtMonths.findLastIndex(
    (x) => x !== undefined
  );
  for (let i = firstDataIndex; i < lastDataIndex; i++) {
    if (progressedAtMonths[i] === undefined) {
      progressedAtMonths[i] = 0;
    }
  }

  return progressedAtMonths;
};

watchEffect(() => {
  if (!props.libraryEvents) return;

  const chartMode = state.chartMode;
  const year = state.selectedYear;

  if (chartMode === "calendar") {
    const heatmapData = createHeatmapData(props.libraryEvents, year);

    optionCalendar.value.visualMap.max = heatmapData.maxCount;
    optionCalendar.value.calendar.range = year.toString();
    optionCalendar.value.series.data = heatmapData.data;
  } else if (chartMode === "line") {
    const lineData = createLineData(props.libraryEvents, year);
    optionLine.value.series.data = lineData;
  }
  state.isLoading = false;
});
</script>

<template>
  <div class="card flex flex-col overflow-hidden">
    <div class="mb-1 flex flex-wrap">
      <h1 class="text-2xl font-semibold">Library Progressed</h1>
      <div class="ml-auto fill-black dark:fill-white">
        <button
          class="border p-0.5 px-1 rounded-l-md transition-all"
          :class="{ 'selected-btn': state.chartMode === 'calendar' }"
          @click="setChartMode('calendar')"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 48 48"
            height="24"
            width="24"
          >
            <path
              d="M9 44q-1.2 0-2.1-.9Q6 42.2 6 41V10q0-1.2.9-2.1Q7.8 7 9 7h3.25V4h3.25v3h17V4h3.25v3H39q1.2 0 2.1.9.9.9.9 2.1v31q0 1.2-.9 2.1-.9.9-2.1.9Zm0-3h30V19.5H9V41Zm0-24.5h30V10H9Zm0 0V10v6.5ZM24 28q-.85 0-1.425-.575Q22 26.85 22 26q0-.85.575-1.425Q23.15 24 24 24q.85 0 1.425.575Q26 25.15 26 26q0 .85-.575 1.425Q24.85 28 24 28Zm-8 0q-.85 0-1.425-.575Q14 26.85 14 26q0-.85.575-1.425Q15.15 24 16 24q.85 0 1.425.575Q18 25.15 18 26q0 .85-.575 1.425Q16.85 28 16 28Zm16 0q-.85 0-1.425-.575Q30 26.85 30 26q0-.85.575-1.425Q31.15 24 32 24q.85 0 1.425.575Q34 25.15 34 26q0 .85-.575 1.425Q32.85 28 32 28Zm-8 8q-.85 0-1.425-.575Q22 34.85 22 34q0-.85.575-1.425Q23.15 32 24 32q.85 0 1.425.575Q26 33.15 26 34q0 .85-.575 1.425Q24.85 36 24 36Zm-8 0q-.85 0-1.425-.575Q14 34.85 14 34q0-.85.575-1.425Q15.15 32 16 32q.85 0 1.425.575Q18 33.15 18 34q0 .85-.575 1.425Q16.85 36 16 36Zm16 0q-.85 0-1.425-.575Q30 34.85 30 34q0-.85.575-1.425Q31.15 32 32 32q.85 0 1.425.575Q34 33.15 34 34q0 .85-.575 1.425Q32.85 36 32 36Z"
            />
          </svg>
        </button>
        <button
          class="border border-l-0 p-0.5 px-1 rounded-r-md transition-all"
          :class="{ 'selected-btn': state.chartMode === 'line' }"
          @click="setChartMode('line')"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 48 48"
            height="24"
            width="24"
          >
            <path
              d="M5.5 36q-1.45 0-2.475-1.025Q2 33.95 2 32.5q0-1.45 1.025-2.475Q4.05 29 5.5 29q.25 0 .5.025t.65.125l10-10q-.1-.4-.125-.65-.025-.25-.025-.5 0-1.45 1.025-2.475Q18.55 14.5 20 14.5q1.45 0 2.475 1.025Q23.5 16.55 23.5 18q0 .1-.15 1.15l5.5 5.5q.4-.1.65-.125.25-.025.5-.025t.5.025q.25.025.65.125l8-8q-.1-.4-.125-.65-.025-.25-.025-.5 0-1.45 1.025-2.475Q41.05 12 42.5 12q1.45 0 2.475 1.025Q46 14.05 46 15.5q0 1.45-1.025 2.475Q43.95 19 42.5 19q-.25 0-.5-.025t-.65-.125l-8 8q.1.4.125.65.025.25.025.5 0 1.45-1.025 2.475Q31.45 31.5 30 31.5q-1.45 0-2.475-1.025Q26.5 29.45 26.5 28q0-.25.025-.5t.125-.65l-5.5-5.5q-.4.1-.65.125-.25.025-.5.025-.1 0-1.15-.15l-10 10q.1.4.125.65.025.25.025.5 0 1.45-1.025 2.475Q6.95 36 5.5 36Z"
            />
          </svg>
        </button>
      </div>
    </div>

    <div class="overflow-x-auto lg:overflow-x-hidden overflow-y-hidden h-full">
      <div
        class="h-full"
        :class="{ 'min-w-[48rem]': state.chartMode === 'calendar' }"
      >
        <v-chart
          ref="chart"
          :option="option"
          :autoresize="true"
          :loading="state.isLoading"
        />
        <DropdownMenu :position="'tl'" class="absolute bottom-7 left-10">
          <button
            class="px-3 py-0.5 bg-background-100/30 dark:bg-background-500/30 rounded-md"
          >
            {{ state.selectedYear }}
          </button>
          <template v-slot:menu>
            <h1 class="font-semibold mb-1">Select Year</h1>
            <ul class="overflow-y-auto max-h-40">
              <li v-for="year in availableYears" :key="year">
                <button
                  @click="selectYear(year)"
                  :class="{ selected: state.selectedYear == year }"
                >
                  {{ year }}
                </button>
              </li>
            </ul>
          </template>
        </DropdownMenu>
      </div>
    </div>
  </div>
</template>

<style scoped>
.selected {
  @apply font-semibold;
}
.selected-btn {
  @apply bg-background-100 fill-black;
}
</style>
