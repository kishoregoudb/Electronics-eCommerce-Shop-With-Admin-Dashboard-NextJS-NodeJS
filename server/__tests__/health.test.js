const request = require("supertest");
const app = require("../app");

describe("GET /health", () => {
  it("returns 200 without opening a listen port", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("OK");
  });
});
