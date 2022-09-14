import { createApp, nextTick } from "vue";
import { createRouter, createWebHashHistory } from "vue-router";
import App from "./App.vue";
import ECharts from "vue-echarts";
import UserInput from "./components/UserInput.vue";
import StatsView from "./components/StatsView.vue";
import NotFound from "./components/NotFound.vue";
import { useStore } from "./store";

import "./assets/main.css";

// toggle dark mode
const store = useStore();
document.documentElement.classList.toggle("dark", store.isDarkMode.value);

const routes = [
  { path: "/", name: "Home", component: UserInput },
  {
    path: "/user/:userId",
    name: "User Statistics",
    component: StatsView,
    props: true,
  },
  { path: "/:pathMatch(.*)*", name: "NotFound", component: NotFound },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

router.afterEach((to) => {
  nextTick(() => {
    document.title = `KitsuStats | ${to.name}`;
  });
});

const app = createApp(App);
app.use(router);
app.component("v-chart", ECharts);
app.mount("#app");
