describe("apiClient base URL", () => {
  const original = process.env.NEXT_PUBLIC_API_BASE_URL;

  afterEach(() => {
    if (original === undefined) delete process.env.NEXT_PUBLIC_API_BASE_URL;
    else process.env.NEXT_PUBLIC_API_BASE_URL = original;
    jest.resetModules();
  });

  it("sends bulk-upload calls to NEXT_PUBLIC_API_BASE_URL when set", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.test";
    jest.resetModules();
    const fetchMock = jest.fn().mockResolvedValue({ ok: true });
    global.fetch = fetchMock as unknown as typeof fetch;

    const { apiClient } = await import("@/lib/api");
    await apiClient.get("/api/bulk-upload");
    await apiClient.delete("/api/bulk-upload/1?deleteProducts=false");

    expect(fetchMock.mock.calls[0][0]).toBe("https://api.example.test/api/bulk-upload");
    expect(fetchMock.mock.calls[1][0]).toBe(
      "https://api.example.test/api/bulk-upload/1?deleteProducts=false"
    );
  });

  it("falls back to http://localhost:3001 when unset", async () => {
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
    jest.resetModules();
    const config = (await import("@/lib/config")).default;
    expect(config.apiBaseUrl).toBe("http://localhost:3001");
  });
});
