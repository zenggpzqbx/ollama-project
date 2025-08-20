import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import axios from "axios";
import * as echarts from "echarts";
import { createPinia } from "pinia";
import * as Vue from "vue";
const app = createApp(App);
const pinia = createPinia();
window.visibleGlobal = {
  app: app,
  ElementPlus: ElementPlus,
  axios,
  echarts: echarts,
  pinia: pinia,
  Vue,
};
app.use(ElementPlus);
app.use(pinia);
app.mount("#app");
