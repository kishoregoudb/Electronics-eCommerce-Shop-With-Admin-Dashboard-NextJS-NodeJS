import config from "@/lib/config";

describe("lib/config", () => {
  it("exposes the configured API base URL", () => {
    expect(config.apiBaseUrl).toBe(
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001"
    );
  });
});
