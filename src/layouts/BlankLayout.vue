<template>
  <q-layout
    view="lHh Lpr lFf"
    :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-white text-dark'"
  >
    <MainHeader />
    <AppNavDrawer />
    <q-page-container class="text-body1">
      <div class="max-w-7xl mx-auto">
        <router-view />
      </div>
    </q-page-container>
  </q-layout>
</template>

<script>
import { defineComponent } from "vue";
import MainHeader from "components/MainHeader.vue";
import AppNavDrawer from "components/AppNavDrawer.vue";
import { useUiStore } from "src/stores/ui";

export default defineComponent({
  name: "BlankLayout",
  mixins: [windowMixin],
  components: {
    MainHeader,
    AppNavDrawer,
  },
  setup() {
    const ui = useUiStore();
    return { ui };
  },
});
</script>
