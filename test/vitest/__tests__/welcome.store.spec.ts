import { beforeEach, describe, expect, it } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useWelcomeStore } from "../../../src/stores/welcome";

describe("welcome store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("setSlides initializes slides and index", () => {
    const store = useWelcomeStore();
    store.setSlides(["a", "b", "c"]);
    expect(store.totalSlides).toBe(3);
    expect(store.currentSlide).toBe(0);
  });

  it("gates backup slide until acknowledged", () => {
    const store = useWelcomeStore();
    store.setSlides(["backup"]);
    expect(store.canGoNext).toBe(false);
    store.seedAcknowledged = true;
    expect(store.canGoNext).toBe(true);
  });

  it("gates terms slide until accepted", () => {
    const store = useWelcomeStore();
    store.setSlides(["terms"]);
    expect(store.canGoNext).toBe(false);
    store.termsAccepted = true;
    expect(store.canGoNext).toBe(true);
  });
});

