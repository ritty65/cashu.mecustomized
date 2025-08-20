import { describe, expect, it } from "vitest";
import { sanitizeRelayUrl } from "../../../src/js/relay";

describe("sanitizeRelayUrl", () => {
	it("accepts valid relay", () => {
		const { url, error } = sanitizeRelayUrl(" wss://example.com ", []);
		expect(error).toBeUndefined();
		expect(url).toBe("wss://example.com/");
	});

	it("detects duplicate relay", () => {
		const { error } = sanitizeRelayUrl("wss://example.com", [
			"wss://example.com/",
		]);
		expect(error).toBe("duplicate");
	});

	it("rejects invalid relay", () => {
		const { error } = sanitizeRelayUrl("http://bad.com", []);
		expect(error).toBe("invalid");
	});
});
