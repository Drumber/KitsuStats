<script setup>
import { computed } from "vue";
import { onMounted, reactive, toRaw } from "vue";
import { onBeforeRouteUpdate, useRoute, useRouter } from "vue-router";
import { API_URL, LIBRARY_ENTRIES_PAGE_LIMIT } from "../constants";
import AppHeader from "./widgets/AppHeader.vue";
import UserInfoCard from "./UserInfoCard.vue";
import LibraryMetaCard from "./LibraryMetaCard.vue";

const props = defineProps({
  userId: {
    type: String,
    required: true,
  },
});

const route = useRoute();
const router = useRouter();

const state = reactive({
  userModel: undefined,
  libraryData: undefined,
  libraryEntries: [],
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
  state.libraryFetchError = await updateLibraryEntries(userId);
  return true;
});

onMounted(async () => {
  const isUserModelSet = await updateUserModel(props.userId);
  if (!isUserModelSet) {
    router.push(getNotFoundRouteLocation(route));
    return;
  }
  state.libraryFetchError = await updateLibraryEntries(props.userId);
});

const updateUserModel = async (userId) => {
  try {
    state.userModel = await fetchUserModel(userId);
    console.log("Fetched user model", toRaw(state.userModel));
    document.title = `KitsuStats | ${state.userModel.attributes.name}`;
    return true;
  } catch (error) {
    console.error("Failed to fetch user model.", error);
    return false;
  }
};

const updateLibraryEntries = async (userId) => {
  try {
    const response = await fetchLibraryEntries(userId);
    console.log("Fetched library entries", response);
    state.libraryData = response;
    state.libraryEntries = response.data;
    return true;
  } catch (error) {
    console.error("Failed to fetch library entries.", error);
    return false;
  }
};

const fetchUserModel = async (userId) => {
  const url = API_URL + `/users/${userId}`;
  const response = await fetch(url);
  const json = await response.json();
  if (!response.ok) {
    throw Error(JSON.stringify(json));
  }
  return json.data;
};

const fetchLibraryEntries = async (userId) => {
  const url =
    API_URL +
    `/users/${userId}/library-entries?page[limit]=${LIBRARY_ENTRIES_PAGE_LIMIT}&include=anime,manga&fields[anime]=titles&fields[manga]=titles`;
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

    <LibraryMetaCard
      :library-data="state.libraryData"
      class="lg:col-span-2 h-[32rem] sm:h-96 lg:h-80"
    ></LibraryMetaCard>

    <!-- Library Statistics -->
    <div class="col-start-1 md:col-span-2 lg:col-span-3 card">
      <h1
        class="text-2xl mb-1 text-primary-500 dark:text-primary-400 font-semibold"
      >
        Timeline
      </h1>
    </div>

    <p>Note: NSFW Content is ignored in all statistics.</p>
  </div>
</template>

<style scoped></style>
