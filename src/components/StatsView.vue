<script setup>
import { computed } from "vue";
import { onMounted, reactive, provide } from "vue";
import { onBeforeRouteUpdate, useRoute, useRouter } from "vue-router";
import { API_URL, LIBRARY_ENTRIES_PAGE_LIMIT } from "../constants";
import { useStore } from "../store";
import { THEME_KEY } from "vue-echarts";
import AppHeader from "./widgets/AppHeader.vue";
import UserInfoCard from "./cards/UserInfoCard.vue";
import LibraryMetaCard from "./cards/LibraryMetaCard.vue";
import RatingsGivenCard from "./cards/RatingsGivenCard.vue";
import CategoryBreakdownCard from "./cards/CategoryBreakdownCard.vue";
import ProgressBar from "./widgets/ProgressBar.vue";
import LibraryProgressCard from "./cards/LibraryProgressCard.vue";
import moment from "moment";
import AnimeSubtypeCard from "./cards/AnimeSubtypeCard.vue";
import MediaYearsCard from "./cards/MediaYearsCard.vue";
import TimeSpentHistoryCard from "./cards/TimeSpentHistoryCard.vue";
import BestRatedCard from "./cards/BestRatedCard.vue";
import cache from "../cache";
import "../assets/echarts/custom-light";
import "../assets/echarts/custom-dark";
import TimelineCard from "./cards/TimelineCard.vue";

const props = defineProps({
  userId: {
    type: String,
    required: true,
  },
});

const route = useRoute();
const router = useRouter();

const store = useStore();

// automatically switch echart theme
const chartTheme = computed(() =>
  store.isDarkMode.value ? "custom-dark" : "custom-light"
);
provide(THEME_KEY, chartTheme);

const state = reactive({
  userModel: undefined,
  userStats: undefined,
  animeMetaData: undefined,
  mangaMetaData: undefined,
  animeLibraryData: undefined,
  mangaLibraryData: undefined,
  libraryEventsMetaData: undefined,
  libraryEvents: undefined,
  libraryEventsFirstYear: undefined,
  isLoading: true,
  isFetchingLibraryEntries: false,
  isFetchingLibraryEvents: false,
  displayingCachedData: false,
  dateOfCachedData: undefined,
});

const clearUserData = () => {
  state.userModel = undefined;
  state.userStats = undefined;
};

const clearLibraryData = () => {
  state.animeMetaData = undefined;
  state.mangaMetaData = undefined;
  state.animeLibraryData = undefined;
  state.mangaLibraryData = undefined;
  state.libraryEventsMetaData = undefined;
  state.libraryEvents = undefined;
  state.libraryEventsFirstYear = undefined;
};

const userAttr = computed(() => {
  const model = state.userModel;
  if (!model) return undefined;
  return model.attributes;
});

const libraryLoadingTotal = computed(() => {
  let count = 0;
  count += state.animeMetaData ? state.animeMetaData.count : 0;
  count += state.mangaMetaData ? state.mangaMetaData.count : 0;
  count += state.libraryEventsMetaData ? state.libraryEventsMetaData.count : 0;
  return count;
});

const libraryLoadingProgress = computed(() => {
  let count = 0;
  count += state.animeLibraryData ? state.animeLibraryData.data.length : 0;
  count += state.mangaLibraryData ? state.mangaLibraryData.data.length : 0;
  count += state.libraryEvents ? state.libraryEvents.length : 0;
  return count;
});

const showProgressBar = computed(() => {
  return state.isFetchingLibraryEntries || state.isFetchingLibraryEvents;
});

const getNotFoundRouteLocation = (route) => {
  return {
    name: "NotFound",
    params: { pathMatch: route.path.substring(1).split("/") },
    query: route.query,
    hash: route.hash,
    replace: true,
  };
};

onBeforeRouteUpdate(async (to, from) => {
  if (to.params.userId === from.params.userId) return;

  // clear old state data
  clearUserData();
  clearLibraryData();

  state.isLoading = true;

  const userId = to.params.userId;
  const isUserModelSet = await updateUserModel(userId);
  if (!isUserModelSet) {
    return getNotFoundRouteLocation(to);
  }
  await updateLibraryData(userId);
  state.isLoading = false;
  return true;
});

onMounted(async () => {
  const isUserModelSet = await updateUserModel(props.userId);
  if (!isUserModelSet) {
    router.push(getNotFoundRouteLocation(route));
    return;
  }
  await updateLibraryData(props.userId);
  state.isLoading = false;
});

const storeDataInCache = async (userId, dataObj) => {
  try {
    const key = await cache.set(userId, dataObj);
    console.log("Stored data in cache.", key);
  } catch (error) {
    console.log("Failed to store data in cache:", error);
  }
};

const setStateFromDataObj = (dataObj) => {
  state.animeMetaData = dataObj.animeMetaData;
  state.mangaMetaData = dataObj.mangaMetaData;
  state.animeLibraryData = dataObj.animeLibraryData;
  state.mangaLibraryData = dataObj.mangaLibraryData;
  state.libraryEventsMetaData = dataObj.libraryEventsMetaData;
  state.libraryEvents = dataObj.libraryEvents;
  state.libraryEventsFirstYear = dataObj.libraryEventsFirstYear;

  state.dateOfCachedData = dataObj.date;
  state.displayingCachedData = true;
};

let refreshDataLock = false;

// user triggered data update
const refreshData = async () => {
  if (refreshDataLock === true) return;
  refreshDataLock = true;
  const userId = props.userId;
  clearLibraryData();
  try {
    await updateLibraryData(userId, true);
  } finally {
    refreshDataLock = false;
  }
};

const updateUserModel = async (userId) => {
  try {
    const response = await fetchUserModel(userId);
    console.log("Fetched user model", response);
    state.userModel = response.data;
    state.userStats = response.included.filter((x) => x.type === "stats");
    document.title = `KitsuStats | ${state.userModel.attributes.name}`;
    return true;
  } catch (error) {
    console.error("Failed to fetch user model.", error);
    return false;
  }
};

const updateLibraryData = async (userId, forceUpdate) => {
  let cachedData = undefined;
  try {
    cachedData = await cache.get(userId);
  } catch (error) {
    console.log("Cache is unavailable.", error);
  }

  if (cachedData && !forceUpdate) {
    const cacheDateDiff = moment().diff(cachedData.date, "hours");
    if (cacheDateDiff < 12) {
      setStateFromDataObj(cachedData);
      console.debug("Cache is not older than 12 hours. Do not update data...");
      return;
    }
    clearLibraryData();
    console.debug("Cache is older than 12 hours. Updating data...");
  }

  if (cachedData) {
    try {
      await cache.del(userId);
    } catch (error) {
      console.log("Failed to delete cached data.", error);
    }
  }

  const cacheDataObj = {
    date: +new Date(),
  };

  if ((await updateLibraryEntries(userId, cacheDataObj)) === true) {
    const currentYear = new Date().getFullYear();
    if (
      (await updateLibraryEvents(userId, currentYear, cacheDataObj)) === true
    ) {
      state.displayingCachedData = false;
      storeDataInCache(userId, cacheDataObj);
    }
  }
};

const provideLibraryEventsForYear = async (year) => {
  const userId = props.userId;
  if (!userId) return;

  let cacheDataObj = undefined;
  try {
    cacheDataObj = await cache.get(userId);
  } catch (error) {
    console.log("Failed to get cached data.", error);
  }

  if (
    (await updateLibraryEvents(userId, year, cacheDataObj || {})) === true &&
    cacheDataObj
  ) {
    storeDataInCache(userId, cacheDataObj);
  }
};

const updateLibraryEntries = async (userId, cacheDataObj) => {
  state.isFetchingLibraryEntries = true;
  let success = true;
  try {
    // fetch max 500 Anime entries
    const libraryDataAnime = await fetchLibraryEntries(userId, "anime");
    console.log("Fetched anime library data", libraryDataAnime);
    state.animeMetaData = libraryDataAnime.meta;
    state.animeLibraryData = libraryDataAnime;
    // Important: Create deep copys to be independent from the state object
    cacheDataObj.animeMetaData = JSON.parse(
      JSON.stringify(libraryDataAnime.meta)
    );
    cacheDataObj.animeLibraryData = JSON.parse(
      JSON.stringify(libraryDataAnime)
    );

    // fetch max 500 Manga entries
    const libraryDataManga = await fetchLibraryEntries(userId, "manga");
    console.log("Fetched manga library data", libraryDataManga);
    state.mangaMetaData = libraryDataManga.meta;
    state.mangaLibraryData = libraryDataManga;
    cacheDataObj.mangaMetaData = JSON.parse(
      JSON.stringify(libraryDataManga.meta)
    );
    cacheDataObj.mangaLibraryData = JSON.parse(
      JSON.stringify(libraryDataManga)
    );

    // handle more than 500 Anime entries
    const animeCount = libraryDataAnime.meta.count;
    if (animeCount > LIBRARY_ENTRIES_PAGE_LIMIT) {
      console.log(
        `Library contains more than 500 anime entries (${animeCount}). Fetching all entries...`
      );

      let fetchCount = libraryDataAnime.data.length;
      do {
        const pageSize = Math.min(
          LIBRARY_ENTRIES_PAGE_LIMIT,
          animeCount - fetchCount
        );
        const pageOffset = fetchCount;
        console.debug(`[Anime] offset: ${pageOffset} size: ${pageSize}`);

        const response = await fetchLibraryEntries(
          userId,
          "anime",
          pageOffset,
          pageSize
        );
        state.animeLibraryData.data.push(...response.data);
        state.animeLibraryData.included.push(...response.included);
        cacheDataObj.animeLibraryData.data.push(...response.data);
        cacheDataObj.animeLibraryData.included.push(...response.included);
        fetchCount += response.data.length;
      } while (fetchCount < animeCount);
    }

    // handle more than 500 Manga entries
    const mangaCount = libraryDataManga.meta.count;
    if (mangaCount > LIBRARY_ENTRIES_PAGE_LIMIT) {
      console.log(
        `Library contains more than 500 manga entries (${mangaCount}). Fetching all entries...`
      );

      let fetchCount = libraryDataManga.data.length;
      do {
        const pageSize = Math.min(
          LIBRARY_ENTRIES_PAGE_LIMIT,
          mangaCount - fetchCount
        );
        const pageOffset = fetchCount;
        console.debug(`[Manga] offset: ${pageOffset} size: ${pageSize}`);

        const response = await fetchLibraryEntries(
          userId,
          "manga",
          pageOffset,
          pageSize
        );
        state.mangaLibraryData.data.push(...response.data);
        state.mangaLibraryData.included.push(...response.included);
        cacheDataObj.mangaLibraryData.data.push(...response.data);
        cacheDataObj.mangaLibraryData.included.push(...response.included);
        fetchCount += response.data.length;
      } while (fetchCount < mangaCount);
    }
  } catch (error) {
    console.error("Failed to fetch library entries.", error);
    success = false;
  } finally {
    state.isFetchingLibraryEntries = false;
  }
  return success;
};

const updateLibraryEvents = async (userId, year, cacheDataObj) => {
  state.isFetchingLibraryEvents = true;
  let success = true;
  try {
    let fetchedCount = state.libraryEvents ? state.libraryEvents.length : 0;
    let totalCount = state.libraryEventsMetaData
      ? state.libraryEventsMetaData.count
      : Number.MAX_VALUE;

    if (
      state.libraryEventsMetaData &&
      fetchedCount >= state.libraryEventsMetaData.count
    ) {
      console.log("All library events are already fetched.");
      return;
    }

    const yearBoundary = year - 1;

    if (fetchedCount > 0) {
      const firstCreatedAt =
        state.libraryEvents[fetchedCount - 1].attributes.createdAt;
      const firstFetchedYear = moment(firstCreatedAt).year();
      if (firstFetchedYear < yearBoundary) {
        console.debug(
          `Library events for year ${year} should be already fetched. No need to fetch again...`
        );
        return;
      }
    }

    console.log(
      `Starting fetching library events until year ${yearBoundary}...`
    );

    do {
      const pageSize = Math.min(20, totalCount - fetchedCount);
      const pageOffset = fetchedCount;
      //console.debug(`[LibraryEvents] offset: ${pageOffset} size: ${pageSize}`);

      const response = await fetchLibraryEvents(userId, pageOffset, pageSize);

      if (!state.libraryEventsMetaData) {
        state.libraryEventsMetaData = response.meta;
        cacheDataObj.libraryEventsMetaData = JSON.parse(
          JSON.stringify(response.meta)
        );
      }

      totalCount = response.meta.count;

      if (!state.libraryEvents) {
        state.libraryEvents = [...response.data];
      } else {
        state.libraryEvents.push(...response.data);
      }
      if (!cacheDataObj.libraryEvents) {
        cacheDataObj.libraryEvents = [...response.data];
      } else {
        cacheDataObj.libraryEvents.push(...response.data);
      }
      fetchedCount += response.data.length;

      if (totalCount < 1) {
        console.debug("User has no library events.");
        break;
      }

      const lastCreatedAt =
        response.data[response.data.length - 1].attributes.createdAt;
      const lastYear = moment(lastCreatedAt).year();
      if (lastYear <= yearBoundary) {
        console.debug(
          `Reached year boundary. Last fetched year: ${lastYear} Boundary: ${yearBoundary}`
        );
        break;
      }
    } while (fetchedCount < totalCount);

    if (!state.libraryEventsFirstYear && state.libraryEventsMetaData) {
      // set the year of the first library event
      if (state.libraryEventsMetaData.count < 20 && state.libraryEvents) {
        const length = state.libraryEvents.length;
        if (length > 0) {
          const createdAt =
            state.libraryEvents[length - 1].attributes.createdAt;

          const firstYear = moment(createdAt).year();
          state.libraryEventsFirstYear = firstYear;
          cacheDataObj.libraryEventsFirstYear = firstYear;
        }
      } else {
        // try to fetch first library event
        const lastPage = state.libraryEventsMetaData.count - 1;
        const response = await fetchLibraryEvents(userId, lastPage, 1);
        const createdAt =
          response.data[response.data.length - 1].attributes.createdAt;

        const firstYear = moment(createdAt).year();
        state.libraryEventsFirstYear = firstYear;
        cacheDataObj.libraryEventsFirstYear = firstYear;
      }
    }
  } catch (error) {
    console.error("Failed to fetch library events.", error);
    success = false;
  } finally {
    state.isFetchingLibraryEvents = false;
  }
  return success;
};

const fetchUserModel = async (userId) => {
  const url = API_URL + `/users/${userId}?include=stats`;
  const response = await fetch(url);
  const json = await response.json();
  if (!response.ok) {
    throw Error(JSON.stringify(json));
  }
  return json;
};

const fetchLibraryEntries = async (
  userId,
  kind,
  pageOffset = 0,
  pageLimit = LIBRARY_ENTRIES_PAGE_LIMIT
) => {
  const url =
    API_URL +
    `/library-entries?filter[user_id]=${userId}` +
    `&filter[kind]=${kind}` +
    `&page[offset]=${pageOffset}&page[limit]=${pageLimit}` +
    `&fields[libraryEntries]=status,ratingTwenty,progress,startedAt,finishedAt,progressedAt,${kind}` +
    `&fields[${kind}]=canonicalTitle,startDate,posterImage` +
    (kind === "anime" ? `,showType,episodeLength` : "") +
    `&include=${kind}`;
  const response = await fetch(url);
  const json = await response.json();
  if (!response.ok) {
    throw Error(JSON.stringify(json));
  }
  return json;
};

const fetchLibraryEvents = async (
  userId,
  pageOffset = 0,
  pageLimit = 20,
  kind = "progressed"
) => {
  const url =
    API_URL +
    `/library-events?filter[user_id]=${userId}` +
    `&filter[kind]=${kind}` +
    `&page[offset]=${pageOffset}&page[limit]=${pageLimit}` +
    `&fields[libraryEvents]=createdAt` +
    `&sort=-createdAt`;
  const response = await fetch(url);
  const json = await response.json();
  if (!response.ok) {
    throw Error(JSON.stringify(json));
  }
  return json;
};
</script>

<template>
  <AppHeader>
    <ProgressBar
      :value="libraryLoadingProgress"
      :max="libraryLoadingTotal"
      :class="{ '!opacity-100': showProgressBar }"
      class="absolute bottom-0 z-20 opacity-0 transition-all duration-500 delay-100"
    ></ProgressBar>
  </AppHeader>
  <div
    v-if="state.userModel !== undefined"
    class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full max-w-6xl p-2"
  >
    <!-- Cache Information -->
    <div
      v-if="state.displayingCachedData"
      class="card col-span-full text-gray-600 dark:text-gray-400"
    >
      Updated data {{ moment(state.dateOfCachedData).fromNow() }}
      <button
        @click="refreshData"
        class="float-right px-2 py-0.5 bg-background-300/40 dark:bg-background-500/30 rounded-md"
      >
        Refresh data
      </button>
    </div>

    <!-- User Info Card -->
    <UserInfoCard
      :user-model="state.userModel"
      :user-attr="userAttr"
      :anime-meta-data="state.animeMetaData"
      :manga-meta-data="state.mangaMetaData"
      class="h-[32rem] sm:h-96"
    ></UserInfoCard>

    <!-- Library Status -->
    <LibraryMetaCard
      :anime-meta-data="state.animeMetaData"
      :manga-meta-data="state.mangaMetaData"
      class="lg:col-span-2 h-[32rem] sm:h-96 lg:min-h-80"
    ></LibraryMetaCard>

    <!-- Ratings Given -->
    <RatingsGivenCard
      :anime-library-data="state.animeLibraryData"
      :manga-library-data="state.mangaLibraryData"
      :is-loading="state.isLoading"
      class="min-h-[24rem]"
    ></RatingsGivenCard>

    <!-- Category Breakdown -->
    <CategoryBreakdownCard
      :user-stats="state.userStats"
      class="lg:col-span-2 h-[38rem]"
    ></CategoryBreakdownCard>

    <!-- Library Progress -->
    <LibraryProgressCard
      :library-events="state.libraryEvents"
      :library-events-first-year="state.libraryEventsFirstYear"
      @update:progress-heatmap-year="provideLibraryEventsForYear"
      class="col-start-1 md:col-span-2 lg:col-span-3 h-80"
    ></LibraryProgressCard>

    <!-- Anime Subtypes -->
    <AnimeSubtypeCard
      :anime-library-data="state.animeLibraryData"
      class="col-span-1 h-96"
    ></AnimeSubtypeCard>

    <!-- Media Years -->
    <MediaYearsCard
      :anime-library-data="state.animeLibraryData"
      :manga-library-data="state.mangaLibraryData"
      class="lg:col-span-2 h-96"
    ></MediaYearsCard>

    <!-- Time Spent History -->
    <TimeSpentHistoryCard
      :anime-library-data="state.animeLibraryData"
      :manga-library-data="state.mangaLibraryData"
      class="lg:col-span-2 h-96"
    ></TimeSpentHistoryCard>

    <!-- Best Rated Media -->
    <BestRatedCard
      :anime-library-data="state.animeLibraryData"
      :manga-library-data="state.mangaLibraryData"
      class="h-96"
    ></BestRatedCard>

    <!-- Library Timeline -->
    <TimelineCard
      :anime-library-data="state.animeLibraryData"
      :manga-library-data="state.mangaLibraryData"
      class="h-96 col-span-full"
    ></TimelineCard>
  </div>
</template>
