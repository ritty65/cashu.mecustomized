import { defineStore } from "pinia";
import { useLocalStorage } from "@vueuse/core";
import router from "src/router";

export type WelcomeState = {
  showWelcome: boolean;
  currentSlide: number;
  seedAcknowledged: boolean;
  termsAccepted: boolean;
  pwaSlideEligible: boolean;
  slides: string[];
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
    slides: [],
  }),
  getters: {
    totalSlides: (state) => state.slides.length,
    isLastSlide: (state) => state.currentSlide === state.slides.length - 1,
    canGoNext: (state) => {
      const key = state.slides[state.currentSlide];
      if (key === "backup") return state.seedAcknowledged;
      if (key === "terms") return state.termsAccepted;
      return true;
    },
  },
  actions: {
    initializeWelcome() {
      const displayModeStandalone = window.matchMedia(
        "(display-mode: standalone)",
      ).matches;
      // @ts-ignore
      const navigatorStandalone = window.navigator.standalone;
      this.pwaSlideEligible = !(displayModeStandalone || navigatorStandalone);
      if (!this.showWelcome) {
        router.push("/wallet");
      }
    },
    setSlides(slides: string[]) {
      this.slides = slides;
    },
    goToPrevSlide() {
      if (this.currentSlide > 0) {
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
    finishTutorial() {
      this.showWelcome = false;
      router.push("/wallet");
    },
    resetWelcome() {
      this.showWelcome = true;
      this.currentSlide = 0;
      this.seedAcknowledged = false;
      this.termsAccepted = false;
    },
  },
});
