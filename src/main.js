import { createApp } from "vue";
import App from "./App.vue";
import registerIcons from "./icons";
import "./css/tailwind.css";

const app = createApp(App);
registerIcons(app);
