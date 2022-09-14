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
const chartTheme = computed(() => (store.isDarkMode.value ? "dark" : "light"));
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
});

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
  state.userModel = undefined;
  state.userStats = undefined;
  state.animeMetaData = undefined;
  state.mangaMetaData = undefined;
  state.animeLibraryData = undefined;
  state.mangaLibraryData = undefined;
  state.libraryEventsMetaData = undefined;
  state.libraryEvents = undefined;
  state.libraryEventsFirstYear = undefined;

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

const updateLibraryData = async (userId) => {
  await updateLibraryEntries(userId);
  const currentYear = new Date().getFullYear();
  await updateLibraryEvents(userId, currentYear);
};

const updateLibraryEntries = async (userId) => {
  state.isFetchingLibraryEntries = true;
  try {
    // fetch max 500 Anime entries
    const libraryDataAnime = await fetchLibraryEntries(userId, "anime");
    console.log("Fetched anime library data", libraryDataAnime);
    state.animeMetaData = libraryDataAnime.meta;
    state.animeLibraryData = libraryDataAnime;

    // fetch max 500 Manga entries
    const libraryDataManga = await fetchLibraryEntries(userId, "manga");
    console.log("Fetched manga library data", libraryDataManga);
    state.mangaMetaData = libraryDataManga.meta;
    state.mangaLibraryData = libraryDataManga;

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
        fetchCount += response.data.length;
      } while (fetchCount < mangaCount);
    }
  } catch (error) {
    console.error("Failed to fetch library entries.", error);
  } finally {
    state.isFetchingLibraryEntries = false;
  }
};

const updateLibraryEvents = async (userId, year) => {
  state.isFetchingLibraryEvents = true;
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
      }

      totalCount = response.meta.count;

      if (!state.libraryEvents) {
        state.libraryEvents = response.data;
      } else {
        state.libraryEvents.push(...response.data);
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
          state.libraryEventsFirstYear = moment(createdAt).year();
        }
      } else {
        // try to fetch first library event
        const lastPage = state.libraryEventsMetaData.count - 1;
        const response = await fetchLibraryEvents(userId, lastPage, 1);
        const createdAt =
          response.data[response.data.length - 1].attributes.createdAt;
        state.libraryEventsFirstYear = moment(createdAt).year();
      }
    }
  } catch (error) {
    console.error("Failed to fetch library events.", error);
  } finally {
    state.isFetchingLibraryEvents = false;
  }
};

const provideLibraryEventsForYear = async (year) => {
  const userId = props.userId;
  if (!userId) return;
  await updateLibraryEvents(userId, year);
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
    `&fields[libraryEntries]=ratingTwenty` +
    `&fields[${kind}]=canonicalTitle,startDate` +
    (kind === "anime" ? `,showType` : "") +
    `&include=${kind}`;
  const response = await fetch(url, { cache: "force-cache" });
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
  const response = await fetch(url, { cache: "force-cache" });
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
  </div>
</template>
