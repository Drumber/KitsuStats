<script setup>
import { ref, watchEffect } from "vue";
import {
  DataZoomComponent,
  GridComponent,
  TooltipComponent,
} from "echarts/components";
import { use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import VChart from "vue-echarts";
import { CustomChart } from "echarts/charts";
import { graphic, format } from "echarts/core";
import moment from "moment";

use([
  CanvasRenderer,
  CustomChart,
  GridComponent,
  TooltipComponent,
  DataZoomComponent,
]);

const props = defineProps(["animeLibraryData", "mangaLibraryData"]);

const chart = ref(null);

const getColorForStatus = (status) => {
  const vchart = chart.value;
  if (!vchart || !vchart.getOption()) return "#4992ff";
  const colors = vchart.getOption().color;
  switch (status) {
    case "current":
      return colors[0];
    case "completed":
      return colors[1];
    case "planned":
      return colors[2];
    case "on_hold":
      return colors[3];
    case "dropped":
      return colors[4];
    default:
      return colors[0];
  }
};

const getStatusText = (status) => {
  switch (status) {
    case "current":
      return "Current";
    case "completed":
      return "Completed";
    case "planned":
      return "Planned";
    case "on_hold":
      return "On Hold";
    case "dropped":
      return "Dropped";
  }
};

const createTooltip = (params, entryAttr, mediaAttr) => {
  const posterUrl = mediaAttr.posterImage.tiny;
  const startDate = moment(params.value[0]).format("LL");
  const endDate = moment(params.value[1]).format("LL");
  return `
    <div style="display: flex;">
      <img src="${posterUrl}" height="110" style="height: 100px; margin-right: 10px;" />
      <div style="word-wrap: break-word; white-space: normal; max-width: 250px;">
        <h1 style="font-weight: bolder; margin-bottom: 5px;">
          ${params.name}
          <span>${mediaAttr.showType ? `(${mediaAttr.showType})` : ""}</span>
        </h1>
        <p>Status: ${getStatusText(entryAttr.status)}</p>
        <p>${startDate} - ${endDate}</p>
      </div>
    </div>
  `;
};

const transformData = (libraryData, kind) => {
  const data = [];
  for (const entry of libraryData.data) {
    const relationshipId = entry.relationships[kind].data.id;

    // find included media
    const includedMedia = libraryData.included.find(
      (x) => x.id === relationshipId
    );

    const attr = entry.attributes;
    const startDate = attr.startedAt || attr.progressedAt;
    let finishDate = attr.finishedAt;
    if (!finishDate && attr.status === "current") {
      finishDate = attr.progressedAt;
    } else if (!finishDate) {
      finishDate = startDate;
    }

    const startMillis = moment.utc(startDate).startOf("day").valueOf();
    let finishMillis = moment.utc(finishDate).endOf("day").valueOf();
    if (finishMillis < startMillis) {
      finishMillis = moment.utc(startDate).endOf("day").valueOf();
    }

    const title = includedMedia.attributes.canonicalTitle;

    data.push({
      name: title,
      value: [
        startMillis,
        finishMillis,
        0, // count of elements in the same timespan
        -1, // y-index of this element
        title,
      ],
      itemStyle: {
        normal: {
          color: getColorForStatus(attr.status),
        },
      },
      tooltip: {
        formatter: (params) => {
          return createTooltip(params, attr, includedMedia.attributes);
        },
      },
    });
  }

  return data;
};

const getEntriesBetween = (data, start, end) => {
  return data.filter((e) => {
    return (
      (start <= e.value[0] && end >= e.value[0]) ||
      (start <= e.value[1] && end >= e.value[1]) ||
      (start >= e.value[0] && end <= e.value[1])
    );
  });
};

let maxDatasetCount = 0;

const sortData = (data) => {
  data.sort((a, b) => b.value[1] - b.value[0] - (a.value[1] - a.value[0]));

  for (const entry of data) {
    const entriesBetween = getEntriesBetween(
      data,
      entry.value[0],
      entry.value[1]
    );
    const count = entriesBetween.length;
    entry.value[2] = count;

    let highestIndex = -1;
    for (const entryBetween of entriesBetween) {
      if (entryBetween.value[3] > highestIndex) {
        highestIndex = entryBetween.value[3];
      }
    }

    if (highestIndex === -1) {
      highestIndex = 0;
    } else {
      highestIndex++;
    }
    entry.value[3] = highestIndex;

    maxDatasetCount = Math.max(maxDatasetCount, count);
  }
};

const renderItem = (params, api) => {
  const index = api.value(3);
  const categoryIndex = 0;
  const start = api.coord([api.value(0), categoryIndex]);
  const end = api.coord([api.value(1), categoryIndex]);
  const height = api.size([0, 1])[1];
  const width = end[0] - start[0];

  const x = start[0];
  const y = start[1] - maxDatasetCount * height + height * index;

  const title = api.value(4);
  const titleWidth = format.getTextRect(title).width;
  const text =
    width > titleWidth + 10 && x + width >= 180 && height >= 14 ? title : "";

  const rectShape = graphic.clipRectByRect(
    {
      x: x,
      y: y,
      width: width,
      height: height,
    },
    {
      x: params.coordSys.x,
      y: params.coordSys.y,
      width: params.coordSys.width,
      height: params.coordSys.height,
    }
  );
  return {
    type: "group",
    children: [
      {
        type: "rect",
        ignore: !rectShape,
        shape: rectShape,
        style: api.style(),
      },
      {
        type: "rect",
        ignore: !rectShape,
        shape: rectShape,
        style: api.style({
          fill: "transparent",
          stroke: "transparent",
          text: text,
          textFill: "#fff",
        }),
      },
    ],
  };
};

const option = ref({
  backgroundColor: "rgba(0, 0, 0, 0)",
  tooltip: {},
  dataZoom: [
    {
      type: "slider",
      filterMode: "weakFilter",
      showDataShadow: false,
      start: 90,
      end: 100,
      minValueSpan: 3600 * 24 * 1000 * 7,
    },
    {
      type: "inside",
      filterMode: "weakFilter",
      zoomOnMouseWheel: "ctrl",
      moveOnMouseMove: true,
      moveOnMouseWheel: "shift",
    },
    {
      type: "slider",
      yAxisIndex: 0,
      zoomLock: false,
      width: 10,
      right: 10,
      start: 95,
      end: 100,
      handleSize: 10,
      showDetail: false,
      minValueSpan: 4,
      maxValueSpan: 20,
    },
    {
      type: "inside",
      id: "insideY",
      yAxisIndex: 0,
      start: 95,
      end: 100,
      zoomOnMouseWheel: "ctrl",
      moveOnMouseMove: true,
      moveOnMouseWheel: true,
    },
  ],
  xAxis: {
    type: "time",
    boundaryGap: false,
  },
  yAxis: {
    show: false,
    min: 0,
    max: 1,
  },
  useUTC: true,
  series: [
    {
      type: "custom",
      renderItem: renderItem,
      itemStyle: {
        opacity: 0.8,
      },
      encode: {
        x: [0, 1],
        y: -1,
      },
      data: undefined,
    },
  ],
});

watchEffect(() => {
  if (!props.animeLibraryData || !props.mangaLibraryData) return;
  maxDatasetCount = 0;

  const animeData = transformData(props.animeLibraryData, "anime");
  const mangaData = transformData(props.mangaLibraryData, "manga");

  const combinedData = [...animeData, ...mangaData];
  sortData(combinedData);
  option.value.yAxis.max = maxDatasetCount;
  console.log("combined data", combinedData);
  option.value.series[0].data = combinedData;
});
</script>

<template>
  <div class="card flex flex-col">
    <h1 class="text-2xl mb-1 font-semibold">Library Timeline</h1>
    <v-chart :option="option" :autoresize="true" ref="chart" />
  </div>
</template>
