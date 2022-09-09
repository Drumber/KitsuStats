import { ref } from "vue";
import { API_URL } from "./constants";

/** @type {{key: String, index: String}} */
let algoliaUserKey = undefined;

async function fetchAlgoliaUserKey() {
  const url = API_URL + "/algolia-keys/user";
  const response = await fetch(url);
  const json = await response.json();
  algoliaUserKey = json.users;
  return algoliaUserKey;
}

function getStoredTheme() {
  return localStorage.getItem("theme");
}

function setStoredTheme(theme) {
  localStorage.setItem("theme", theme);
  isDarkMode.value = determineIsDarkMode();
}

function determineIsDarkMode() {
  if (getStoredTheme() === undefined) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  return getStoredTheme() === "dark";
}

const isDarkMode = ref(determineIsDarkMode());

export function useStore() {
  return {
    async getAlgoliaUserKey() {
      if (algoliaUserKey == undefined) {
        return await fetchAlgoliaUserKey();
      }
      return algoliaUserKey;
    },
    isDarkMode,
    setStoredTheme,
  };
}
