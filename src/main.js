import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import registerIcons from "./icons";

const app = createApp(App);
const pinia = createPinia();

registerIcons(app);
app.use(pinia);
app.mount("#q-app");
