<script setup>
import { onMounted, reactive } from "vue";
import { useRouter } from "vue-router";
import { useStore } from "../store";
import { ALGOLIA_APP_ID, API_URL } from "../constants";
import AppHeader from "./widgets/AppHeader.vue";
import SuggestionInput from "./widgets/SuggestionInput.vue";

const router = useRouter();
const store = useStore();

let searchIndex = undefined;
let awaitingSearch = undefined;

onMounted(async () => {
  const algoliasearch = await import("algoliasearch");
  const alogliaUserKey = await store.getAlgoliaUserKey();
  const client = algoliasearch.default(ALGOLIA_APP_ID, alogliaUserKey.key);
  searchIndex = client.initIndex(alogliaUserKey.index);
  console.log("Init search index");
  if (awaitingSearch) {
    searchUsers(awaitingSearch);
  }
});

const state = reactive({
  searchResults: [],
  selectedUser: undefined,
});

let searchTimeout = undefined;

const searchUsers = (query) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    if (searchIndex === undefined) {
      awaitingSearch = query;
      return;
    }
    awaitingSearch = undefined;
    searchIndex.search(query, { hitsPerPage: 10 }).then(({ hits }) => {
      state.searchResults = hits;
      state.selectedUser = hits[0] ? hits[0] : undefined;
    });
  }, 200);
};

const previewUserForId = (userId) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(async () => {
    const response = await fetch(API_URL + `/users/${userId}`);
    if (!response.ok) {
      state.searchResults = [];
      state.selectedUser = undefined;
      return;
    }
    const json = await response.json();

    const attr = json.data.attributes;
    const user = { id: json.data.id };
    Object.assign(user, attr);
    console.log("Fetched user from ID", user);

    state.searchResults = [user];
    state.selectedUser = user;
  }, 400);
};

const onSelectedUserChange = (user) => {
  state.selectedUser = user;
};

const onInputChange = (text) => {
  if (!text || !text.trim()) {
    state.searchResults = [];
    state.selectedUser = undefined;
    clearTimeout(searchTimeout);
    return;
  }
  // check if text contains only numbers (=> user ID)
  if (/^\d+$/.test(text.trim()) === true) {
    previewUserForId(text.trim());
  } else {
    searchUsers(text.trim());
  }
};

const onSubmit = () => {
  const user = state.selectedUser;
  if (!user || !user.id) return;
  router.push(`/user/${user.id}`);
};
</script>

<template>
  <AppHeader></AppHeader>
  <div class="grow p-2 flex flex-col justify-center h-full self-center w-full">
    <div
      class="container mx-auto p-4 m-2 max-w-md shadow-md backdrop-blur bg-background-200/30 dark:bg-background-800/30 rounded-md"
    >
      <h1 class="text-primary-600 mb-3 text-lg">Show Stats for User</h1>

      <SuggestionInput
        :suggestions="state.searchResults"
        :selected-item="state.selectedUser"
        :placeholder="'Enter Username or ID'"
        @update:user-input="onInputChange"
        @update:selected-item="onSelectedUserChange"
        @submit="onSubmit"
      />
    </div>
  </div>
</template>

<style scoped>
.selected {
  color: theme("textColor.primary.500");
  font-weight: bold;
}
</style>
