process.env.NEXTAUTH_SECRET = "phase0-test-secret";

jest.mock("@prisma/client", () => {
  const prisma = {
    product: { findUnique: jest.fn() },
    wishlist: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    customer_order: { findMany: jest.fn(), count: jest.fn(), findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn() },
    user: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn() },
    category: { findMany: jest.fn().mockResolvedValue([]) },
    notification: { findMany: jest.fn(), count: jest.fn() },
  };
  return { PrismaClient: jest.fn(() => prisma), __mock: prisma };
});
jest.mock("../utills/db", () => require("@prisma/client").__mock);

const request = require("supertest");
const { encode } = require("next-auth/jwt");
const app = require("../app");

async function cookieFor(id) {
  const token = await encode({
    token: { id, role: "user", email: `${id}@example.com`, sub: id },
    secret: process.env.NEXTAUTH_SECRET,
    maxAge: 15 * 60,
  });
  return `next-auth.session-token=${token}`;
}

describe("wishlist API", () => {
  beforeEach(() => {
    const { __mock } = require("@prisma/client");
    __mock.wishlist.findMany.mockClear();
    __mock.wishlist.findFirst.mockReset().mockResolvedValue(null);
    __mock.wishlist.create.mockReset();
    __mock.product.findUnique.mockReset();
  });

  it("returns 401 for an anonymous caller", async () => {
    const response = await request(app).get("/api/wishlist");
    expect(response.status).toBe(401);
  });

  it("lists only the signed-in user's items", async () => {
    const { __mock } = require("@prisma/client");
    __mock.wishlist.findMany.mockResolvedValue([]);
    const response = await request(app).get("/api/wishlist").set("Cookie", await cookieFor("user-1"));
    expect(response.status).toBe(200);
    expect(__mock.wishlist.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: "user-1" },
    }));
  });

  it("does not let one user read another user's list through the query", async () => {
    const { __mock } = require("@prisma/client");
    await request(app).get("/api/wishlist").set("Cookie", await cookieFor("user-2"));
    expect(__mock.wishlist.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: "user-2" },
    }));
  });

  it("adds a product once and rejects an unknown product", async () => {
    const { __mock } = require("@prisma/client");
    __mock.product.findUnique.mockResolvedValueOnce(null);
    const missing = await request(app).post("/api/wishlist").set("Cookie", await cookieFor("user-1")).send({ productId: "nope" });
    expect(missing.status).toBe(404);

    __mock.product.findUnique.mockResolvedValue({ id: "p1" });
    __mock.wishlist.create.mockResolvedValue({ id: "w1", userId: "user-1", productId: "p1" });
    const created = await request(app).post("/api/wishlist").set("Cookie", await cookieFor("user-1")).send({ productId: "p1" });
    expect(created.status).toBe(201);

    __mock.wishlist.findFirst.mockResolvedValue({ id: "w1", userId: "user-1", productId: "p1" });
    const again = await request(app).post("/api/wishlist").set("Cookie", await cookieFor("user-1")).send({ productId: "p1" });
    expect(again.status).toBe(200);
    expect(__mock.wishlist.create).toHaveBeenCalledTimes(1);
  });

  it("removes only the signed-in user's row", async () => {
    const { __mock } = require("@prisma/client");
    const response = await request(app).delete("/api/wishlist/p1").set("Cookie", await cookieFor("user-1"));
    expect(response.status).toBe(204);
    expect(__mock.wishlist.deleteMany).toHaveBeenCalledWith({
      where: { userId: "user-1", productId: "p1" },
    });
  });
});
