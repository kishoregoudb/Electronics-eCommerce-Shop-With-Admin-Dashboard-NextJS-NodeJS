import { formatSku } from "@/utils/formatSku";

describe("formatSku", () => {
  it("returns the first 8 hex chars of a uuid in upper case", () => {
    expect(formatSku("3f2a9c1e-7b4d-4e0a-9d11-0123456789ab")).toBe("3F2A9C1E");
  });

  it("returns null for missing or empty ids", () => {
    expect(formatSku(undefined)).toBeNull();
    expect(formatSku(null)).toBeNull();
    expect(formatSku("")).toBeNull();
  });
});
