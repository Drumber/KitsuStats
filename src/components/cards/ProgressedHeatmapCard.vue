<script setup>
import { computed } from "vue";
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

const props = defineProps(["libraryEvents", "libraryEventsFirstYear"]);
const emit = defineEmits(["update:progressHeatmapYear"]);

const currentYear = new Date().getFullYear();

const state = reactive({
  isLoading: true,
  selectedYear: currentYear,
});

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

const option = ref({
  backgroundColor: "rgba(0, 0, 0, 0)",
  tooltip: {
    //position: "top",
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

watchEffect(() => {
  if (!props.libraryEvents) return;

  const year = state.selectedYear;
  const heatmapData = createHeatmapData(props.libraryEvents, year);

  option.value.visualMap.max = heatmapData.maxCount;
  option.value.calendar.range = year.toString();
  option.value.series.data = heatmapData.data;
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
</style>
