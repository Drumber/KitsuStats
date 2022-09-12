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
import ProgressedHeatmapCard from "./cards/ProgressedHeatmapCard.vue";

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
  libraryFetchError: false,
  showProgressBar: false,
  isLoading: true,
});

const combinedLibraryEntries = computed(() => {
  const combined = [];
  if (state.animeLibraryData) {
    combined.push(...state.animeLibraryData.data);
  }
  if (state.mangaLibraryData) {
    combined.push(...state.mangaLibraryData.data);
  }
  return combined.length > 0 ? combined : undefined;
});

const userAttr = computed(() => {
  const model = state.userModel;
  if (!model) return undefined;
  return model.attributes;
});

const libraryCountTotal = computed(() => {
  let count = 0;
  if (state.animeMetaData) {
    count += state.animeMetaData.count;
  }
  if (state.mangaMetaData) {
    count += state.mangaMetaData.count;
  }
  return count;
});

const libraryFetchCount = computed(() => {
  let count = 0;
  if (state.animeLibraryData) {
    count += state.animeLibraryData.data.length;
  }
  if (state.mangaLibraryData) {
    count += state.mangaLibraryData.data.length;
  }
  return count;
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
  state.isLoading = true;

  const userId = to.params.userId;
  const isUserModelSet = await updateUserModel(userId);
  if (!isUserModelSet) {
    return getNotFoundRouteLocation(to);
  }
  state.libraryFetchError = !(await updateLibraryEntries(userId));
  state.isLoading = false;
  return true;
});

onMounted(async () => {
  const isUserModelSet = await updateUserModel(props.userId);
  if (!isUserModelSet) {
    router.push(getNotFoundRouteLocation(route));
    return;
  }
  state.libraryFetchError = !(await updateLibraryEntries(props.userId));
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

const updateLibraryEntries = async (userId) => {
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

    const animeCount = libraryDataAnime.meta.count;
    const mangaCount = libraryDataManga.meta.count;

    state.showProgressBar =
      animeCount > LIBRARY_ENTRIES_PAGE_LIMIT ||
      mangaCount > LIBRARY_ENTRIES_PAGE_LIMIT;

    // handle more than 500 Anime entries
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
        console.debug(`offset: ${pageOffset} size: ${pageSize}`);

        const response = await fetchLibraryEntries(
          userId,
          "anime",
          pageOffset,
          pageSize
        );
        state.animeLibraryData.data.push(...response.data);
        fetchCount += response.data.length;
      } while (fetchCount < animeCount);
    }

    // handle more than 500 Manga entries
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
        console.debug(`offset: ${pageOffset} size: ${pageSize}`);

        const response = await fetchLibraryEntries(
          userId,
          "manga",
          pageOffset,
          pageSize
        );
        state.mangaLibraryData.data.push(...response.data);
        fetchCount += response.data.length;
      } while (fetchCount < mangaCount);
    }

    return true;
  } catch (error) {
    console.error("Failed to fetch library entries.", error);
    return false;
  } finally {
    state.showProgressBar = false;
  }
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
    `&fields[libraryEntries]=ratingTwenty,progressedAt`;
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
      :value="libraryFetchCount"
      :max="libraryCountTotal"
      :class="{ '!opacity-100': state.showProgressBar }"
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

    <!-- Progressed Heatmap -->
    <ProgressedHeatmapCard
      :library-entries="combinedLibraryEntries"
      class="col-start-1 md:col-span-2 lg:col-span-3 h-80"
    ></ProgressedHeatmapCard>

    <p>Note: NSFW Content is ignored in all statistics.</p>
  </div>
</template>

<style scoped></style>
