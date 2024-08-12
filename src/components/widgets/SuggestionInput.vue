<script setup>
import { reactive, ref, watch } from "vue";
import { fixMediaUrl } from "../../kitsu-url-fix";

const props = defineProps(["suggestions", "selectedItem", "placeholder"]);
const emit = defineEmits(["update:selectedItem", "update:userInput", "submit"]);

const state = reactive({
  userInput: "",
});

const suggestionList = ref(null);

const onInputChange = (text) => {
  state.userInput = text;
  emit("update:userInput", text);
};

const onSuggestionClicked = (item) => {
  state.userInput = item.name;
  emit("update:selectedItem", item);
  submit();
};

const scrollSelectedItemIntoView = () => {
  const selectedElement = suggestionList.value.querySelector(".selected");
  if (!selectedElement) return;
  selectedElement.scrollIntoView({ block: "center", behavior: "smooth" });
};

watch(
  () => props.selectedItem,
  () => {
    scrollSelectedItemIntoView();
  },
  { flush: "post" }
);

const getSelectedItemIndex = () => {
  return props.suggestions.findIndex((el) => el.id === props.selectedItem.id);
};

const onKeyUp = () => {
  let newIndex = getSelectedItemIndex() - 1;
  if (newIndex < 0) {
    newIndex = props.suggestions.length - 1;
  }
  const newSelectedItem = props.suggestions[newIndex];
  if (!newSelectedItem) return;
  emit("update:selectedItem", newSelectedItem);
};

const onKeyDown = () => {
  let newIndex = getSelectedItemIndex() + 1;
  if (newIndex >= props.suggestions.length) {
    newIndex = 0;
  }
  const newSelectedItem = props.suggestions[newIndex];
  if (!newSelectedItem) return;
  emit("update:selectedItem", newSelectedItem);
};

const submit = () => {
  emit("submit");
};
</script>

<template>
  <div>
    <input
      :value="state.userInput"
      :placeholder="placeholder"
      @input="onInputChange($event.target.value)"
      @keydown.enter.prevent="submit"
      @keydown.up.prevent="onKeyUp"
      @keydown.down.prevent="onKeyDown"
      type="text"
      class="w-full mb-2 p-1 border-none rounded focus:outline-none focus:ring-1 focus:ring-blue-500/30 bg-background-200 dark:bg-background-700"
      autofocus
    />

    <ul ref="suggestionList" class="max-h-[300px] overflow-auto scroll">
      <li
        v-for="item in suggestions"
        :key="item.id"
        @click="onSuggestionClicked(item)"
        :class="{ selected: selectedItem.id === item.id }"
        class="p-1 rounded flex flex-nowrap items-center cursor-pointer hover:bg-primary-300/20 dark:hover:bg-primary-300/10"
      >
        <img
          v-if="item.avatar"
          :src="item.avatar ? fixMediaUrl(item.avatar.tiny) : ''"
          class="rounded-full h-8 w-8 inline-block"
        />
        <div v-else class="h-8 w-8 rounded-full bg-white/10 inline-block"></div>
        <span class="ml-2"
          >{{ item.name
          }}<span class="text-xs ml-2 text-gray-700/70 dark:text-gray-400/70"
            >#{{ item.id }}</span
          ></span
        >
      </li>
    </ul>
  </div>
</template>

<style scoped>
.selected {
  background-color: theme("backgroundColor.primary.400 / 60%") !important;
}

.dark .selected {
  background-color: theme("backgroundColor.primary.500 / 30%") !important;
}
</style>
