import { defineStore } from "pinia";
import { useLocalStorage } from "@vueuse/core";
import router from "src/router";

export type WelcomeState = {
  showWelcome: boolean;
  currentSlide: number;
  seedAcknowledged: boolean;
  termsAccepted: boolean;
  pwaSlideEligible: boolean;
};

export const useWelcomeStore = defineStore("welcome", {
  state: (): WelcomeState => ({
    showWelcome: useLocalStorage<boolean>("cashu.welcome.showWelcome", true).value,
    currentSlide: useLocalStorage<number>("cashu.welcome.currentSlide", 0).value,
    seedAcknowledged: useLocalStorage<boolean>(
      "cashu.welcome.seedAcknowledged",
      false,
    ).value,
    termsAccepted: useLocalStorage<boolean>(
      "cashu.welcome.termsAccepted",
      false,
    ).value,
    pwaSlideEligible: false,
  }),
  getters: {
    totalSlides: (state) => (state.pwaSlideEligible ? 8 : 7),
    isLastSlide(): boolean {
      return this.currentSlide === this.totalSlides - 1;
    },
    canGoNext(state): boolean {
      if (state.currentSlide === 4) return state.seedAcknowledged;
      if (state.currentSlide === 5) return state.termsAccepted;
      return true;
    },
    canGoPrev: (state) => state.currentSlide > 0,
  },
  actions: {
    initializeWelcome() {
      this.pwaSlideEligible = !window.matchMedia("(display-mode: standalone)").matches;
      if (!this.showWelcome) {
        router.push("/wallet");
      }
    },
    resetWelcome() {
      this.showWelcome = true;
      this.currentSlide = 0;
      this.seedAcknowledged = false;
      this.termsAccepted = false;
      this.pwaSlideEligible = !window.matchMedia("(display-mode: standalone)").matches;
    },
    goToPrevSlide() {
      if (this.canGoPrev) {
        this.currentSlide -= 1;
      }
    },
    goToNextSlide() {
      if (!this.canGoNext) return;
      if (this.isLastSlide) {
        this.finishTutorial();
      } else {
        this.currentSlide += 1;
      }
    },
    skipTutorial() {
      this.finishTutorial();
    },
    finishTutorial(target = "/wallet") {
      this.showWelcome = false;
      return router.push(target);
    },
  },
});
