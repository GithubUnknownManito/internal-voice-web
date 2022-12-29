import { createApp } from "vue";
import App from "./App.vue";
import ElementPlus from 'element-plus'
import request, {upload} from '@/utils/request.js'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import 'element-plus/dist/index.css'
import '@/assets/global.css'


const app = createApp(App);
app.use(ElementPlus);

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}
app.provide("$request", request)
app.provide("$upload", upload)
app.mount("#app");
