<script setup>
import { HeatmapChart } from "echarts/charts";
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
  VisualMapComponent,
  CalendarComponent,
  TooltipComponent,
]);

const props = defineProps(["libraryEntries"]);

const state = reactive({
  isLoading: true,
  selectedYear: new Date().getFullYear(),
  allYears: [],
});

const selectYear = (year) => {
  state.selectedYear = year;
};

const option = ref({
  backgroundColor: "rgba(0, 0, 0, 0)",
  tooltip: {
    position: "top",
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

const createHeatmapData = (libraryEntries, year) => {
  const progressedAtDayCounts = {};

  const allYears = new Set();
  let maxCount = 1;

  for (const entry of libraryEntries) {
    const progressedAt = entry.attributes.progressedAt;
    if (!progressedAt) {
      continue;
    }
    const date = moment(progressedAt);

    allYears.add(date.year());
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
  return { data, maxCount, allYears };
};

watchEffect(() => {
  if (!props.libraryEntries) return;

  const year = state.selectedYear;
  const heatmapData = createHeatmapData(props.libraryEntries, year);

  option.value.visualMap.max = heatmapData.maxCount;
  option.value.calendar.range = year.toString();
  option.value.series.data = heatmapData.data;
  state.allYears = [...heatmapData.allYears].sort().reverse();
  state.isLoading = false;
});
</script>

<template>
  <div class="card flex flex-col overflow-hidden">
    <h1 class="text-2xl mb-1 font-semibold">Progressed Heatmap</h1>
    <div class="overflow-x-auto lg:overflow-x-hidden overflow-y-hidden h-full">
      <div class="min-w-[48rem] h-full">
        <v-chart
          :option="option"
          :autoresize="true"
          :loading="state.isLoading"
        />

        <div class="absolute bottom-7 left-10 flex items-center">
          <DropdownMenu
            :position="'tl'"
            :hover="true"
            class="mr-2 fill-gray-700 dark:fill-gray-300"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 48 48"
              height="20"
              width="20"
            >
              <path
                d="M22.65 34h3V22h-3ZM24 18.3q.7 0 1.175-.45.475-.45.475-1.15t-.475-1.2Q24.7 15 24 15q-.7 0-1.175.5-.475.5-.475 1.2t.475 1.15q.475.45 1.175.45ZM24 44q-4.1 0-7.75-1.575-3.65-1.575-6.375-4.3-2.725-2.725-4.3-6.375Q4 28.1 4 23.95q0-4.1 1.575-7.75 1.575-3.65 4.3-6.35 2.725-2.7 6.375-4.275Q19.9 4 24.05 4q4.1 0 7.75 1.575 3.65 1.575 6.35 4.275 2.7 2.7 4.275 6.35Q44 19.85 44 24q0 4.1-1.575 7.75-1.575 3.65-4.275 6.375t-6.35 4.3Q28.15 44 24 44Zm.05-3q7.05 0 12-4.975T41 23.95q0-7.05-4.95-12T24 7q-7.05 0-12.025 4.95Q7 16.9 7 24q0 7.05 4.975 12.025Q16.95 41 24.05 41ZM24 24Z"
              />
            </svg>
            <template v-slot:menu>
              <p class="break-words w-52 sm:w-auto">
                The statistics include only the last day a library entry was
                progressed.
              </p>
            </template>
          </DropdownMenu>

          <DropdownMenu :position="'tl'">
            <button
              class="px-3 py-0.5 bg-background-100/30 dark:bg-background-500/30 rounded-md"
            >
              {{ state.selectedYear }}
            </button>
            <template v-slot:menu>
              <h1 class="font-semibold mb-1">Select Year</h1>
              <ul class="overflow-y-auto max-h-40">
                <li v-for="year in state.allYears" :key="year">
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
  </div>
</template>

<style scoped>
.selected {
  @apply font-semibold;
}
</style>
