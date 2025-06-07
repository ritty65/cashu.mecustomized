import { createApp } from "vue";
import App from "./App.vue";
import registerIcons from "./icons";
import createStore from "./stores";

const app = createApp(App);
registerIcons(app);
app.use(createStore());
app.mount("#q-app");
