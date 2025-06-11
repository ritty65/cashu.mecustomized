import { createApp } from "vue";
import App from "./App.vue";
import registerIcons from "./icons";

import { Quasar } from "quasar";
import router from "./router";
import pinia from "./stores";
import { i18n } from "./boot/i18n";

const app = createApp(App);
registerIcons(app);

app.use(Quasar);
app.use(router);
app.use(pinia);
app.use(i18n);
app.mount("#q-app");
