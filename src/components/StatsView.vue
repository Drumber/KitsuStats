<script setup>
import { computed } from "vue";
import { onMounted, reactive, provide } from "vue";
import { onBeforeRouteUpdate, useRoute, useRouter } from "vue-router";
import { API_URL, LIBRARY_ENTRIES_PAGE_LIMIT } from "../constants";
import { useStore } from "../store";
import { THEME_KEY } from "vue-echarts";
import AppHeader from "./widgets/AppHeader.vue";
import UserInfoCard from "./UserInfoCard.vue";
import LibraryMetaCard from "./LibraryMetaCard.vue";
import RatingsGivenCard from "./RatingsGivenCard.vue";
import CategoryBreakdownCard from "./CategoryBreakdownCard.vue";

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
});

const userAttr = computed(() => {
  const model = state.userModel;
  if (!model) return undefined;
  return model.attributes;
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

  const userId = to.params.userId;
  console.log("route update", userId);
  const isUserModelSet = await updateUserModel(userId);
  if (!isUserModelSet) {
    return getNotFoundRouteLocation(to);
  }
  state.libraryFetchError = !(await updateLibraryEntries(userId));
  return true;
});

onMounted(async () => {
  const isUserModelSet = await updateUserModel(props.userId);
  if (!isUserModelSet) {
    router.push(getNotFoundRouteLocation(route));
    return;
  }
  state.libraryFetchError = !(await updateLibraryEntries(props.userId));
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
    const libraryDataAnime = await fetchLibraryEntries(userId, "anime");
    console.log("Fetched anime library data", libraryDataAnime);
    state.animeMetaData = libraryDataAnime.meta;
    state.animeLibraryData = libraryDataAnime;
    const animeCount = libraryDataAnime.meta.count;
    if (animeCount > LIBRARY_ENTRIES_PAGE_LIMIT) {
      // TODO: handle more than 500 library entries
    }

    const libraryDataManga = await fetchLibraryEntries(userId, "manga");
    console.log("Fetched manga library data", libraryDataManga);
    state.mangaMetaData = libraryDataManga.meta;
    state.mangaLibraryData = libraryDataManga;
    const mangaCount = libraryDataManga.meta.count;
    if (mangaCount > LIBRARY_ENTRIES_PAGE_LIMIT) {
      // TODO: handle more than 500 library entries
    }

    return true;
  } catch (error) {
    console.error("Failed to fetch library entries.", error);
    return false;
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
    `&fields[libraryEntries]=ratingTwenty`;
  const response = await fetch(url);
  const json = await response.json();
  if (!response.ok) {
    throw Error(JSON.stringify(json));
  }
  return json;
};
</script>

<template>
  <AppHeader></AppHeader>
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
      class="min-h-[24rem]"
    ></RatingsGivenCard>

    <!-- Category Breakdown -->
    <CategoryBreakdownCard
      :user-stats="state.userStats"
      class="lg:col-span-2 h-[38rem]"
    ></CategoryBreakdownCard>

    <!-- Library Statistics -->
    <div class="col-start-1 md:col-span-2 lg:col-span-3 card">
      <h1 class="text-2xl mb-1 font-semibold">Timeline</h1>
    </div>

    <p>Note: NSFW Content is ignored in all statistics.</p>
  </div>
</template>

<style scoped></style>
