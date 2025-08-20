import { beforeEach, describe, expect, it } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { nextTick } from "vue";
import { useNWCStore } from "../../../src/stores/nwc";

beforeEach(() => {
	setActivePinia(createPinia());
	localStorage.clear();
});

describe("nwc allowance", () => {
	it("updates and persists allowance", async () => {
		const store = useNWCStore();
		store.connections = [
			{
				walletPublicKey: "a",
				connectionSecret: "",
				connectionPublicKey: "b",
				allowanceLeft: 10,
			} as any,
		];
		store.updateConnectionAllowance("b", 5);
		await nextTick();
		const stored = localStorage.getItem("cashu.nwc.connections");
		expect(stored).toBeTruthy();
		const saved = JSON.parse(stored as string);
		expect(saved[0].allowanceLeft).toBe(5);
	});
});
