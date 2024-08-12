<script setup>
import { computed } from "vue";
import { reactive } from "vue";
import { BASE_URL } from "../../constants";

const props = defineProps(["animeLibraryData", "mangaLibraryData"]);

const state = reactive({
  mediaType: "anime",
});

const createDataArray = (libraryData) => {
  const libraryEntries = libraryData.data;
  const included = libraryData.included;

  const data = [];
  for (const entry of libraryEntries) {
    const ratingTwenty = entry.attributes.ratingTwenty;
    if (!ratingTwenty) continue;
    const progressedAt = entry.attributes.progressedAt;
    const finishedAt = entry.attributes.finishedAt;

    const dateString = finishedAt || progressedAt;
    const date = dateString ? +new Date(dateString) : 0;

    const media = getMediaForEntry(entry, included);
    if (!media) continue;
    const mediaTitle = media.attributes.canonicalTitle;
    const mediaUrl = `${BASE_URL}/${media.type}/${media.id}`;

    data.push({
      id: entry.id,
      title: mediaTitle,
      url: mediaUrl,
      rating: ratingTwenty,
      date: date,
    });
  }

  data.sort((a, b) => {
    return b.rating - a.rating || b.date - a.date;
  });
  return data;
};

const getMediaForEntry = (entry, included) => {
  let mediaId = undefined;
  if (entry.relationships.anime) {
    mediaId = entry.relationships.anime.data.id;
  } else if (entry.relationships.manga) {
    mediaId = entry.relationships.manga.data.id;
  }
  if (!mediaId) return;

  return included.find((x) => x.id === mediaId);
};

const data = computed(() => {
  if (state.mediaType === "anime" && props.animeLibraryData) {
    return createDataArray(props.animeLibraryData);
  } else if (state.mediaType === "manga" && props.mangaLibraryData) {
    return createDataArray(props.mangaLibraryData);
  } else {
    return [];
  }
});
</script>

<template>
  <div class="card flex flex-col">
    <h1 class="text-2xl mb-1 font-semibold">
      Best Rated
      <span class="float-right font-normal text-lg text-center">
        <button
          @click="state.mediaType = 'anime'"
          :class="{ inactive: state.mediaType !== 'anime' }"
          class="mr-2 transition-all"
        >
          Anime
        </button>
        <button
          @click="state.mediaType = 'manga'"
          :class="{ inactive: state.mediaType !== 'manga' }"
          class="transition-all"
        >
          Manga
        </button>
      </span>
    </h1>

    <ol class="h-full overflow-auto scrollbar-thin">
      <li v-for="entry in data" :key="entry.id">
        <div
          class="flex flex-nowrap flex-row items-center p-1 border-b border-gray-700/30 dark:border-gray-600"
        >
          <p class="flex-shrink mr-2">
            <a :href="entry.url">{{ entry.title }}</a>
          </p>
          <p class="ml-auto mr-1 text-primary-600 dark:text-primary-300">
            {{ entry.rating / 4.0
            }}<span class="text-gray-500 dark:text-gray-400">/5</span>
          </p>
        </div>
      </li>
    </ol>
  </div>
</template>

<style scoped>
.inactive {
  @apply text-black/30 dark:text-white/30;
}
</style>
