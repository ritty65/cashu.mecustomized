import token from "../token";
import { describe, expect, it } from "vitest";

const VALID_V3_TOKEN =
  "cashuAeyJ0b2tlbiI6W3sicHJvb2ZzIjpbeyJpZCI6IkkyeU4raVJZZmt6VCIsImFtb3VudCI6MSwiQyI6IjAyZTRkYmJmMGZmNDI4YTU4ZDZjNjZjMTljNjI0YWRlY2MxNzg0YzdlNTU5ODZhNGVmNDQ4NDM5MzZhM2M4ZjM1OSIsInNlY3JldCI6ImZHWVpzSlVjME1mU1orVlhGandEZXNsNkJScW5wNmRSblZpUGQ2L00yQ0k9In1dLCJtaW50IjoiaHR0cHM6Ly84MzMzLnNwYWNlOjMzMzgifV19";

describe("token", () => {
  describe("decode", () => {
    it("should properly decode a V3 token", () => {
      const decoded = token.decode(VALID_V3_TOKEN);
      expect(decoded.proofs.length).toEqual(1);
      expect(decoded.mint).toEqual("https://8333.space:3338");
      expect(decoded.proofs.length).toEqual(1);
    });

  });

  it("should throw if the token is invalid", () => {
    expect(() => token.decode("invalid")).toThrow();
  });
});
