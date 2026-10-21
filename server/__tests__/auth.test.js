process.env.NEXTAUTH_SECRET = "phase0-test-secret";

jest.mock("@prisma/client", () => {
  const prisma = {
    customer_order: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      findUnique: jest.fn().mockResolvedValue(null),
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
    },
    user: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue({ id: "user-1", email: "user@example.com", role: "user" }),
      create: jest.fn(),
    },
    category: {
      findMany: jest.fn().mockResolvedValue([{ id: "c1", name: "Audio" }]),
      create: jest.fn().mockResolvedValue({ id: "c2", name: "Phones" }),
    },
    product: { findMany: jest.fn().mockResolvedValue([]), findUnique: jest.fn(), findFirst: jest.fn() },
    notification: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    },
    wishlist: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => prisma), __mock: prisma };
});

jest.mock("../utills/db", () => require("@prisma/client").__mock);

const request = require("supertest");
const { encode } = require("next-auth/jwt");
const app = require("../app");

async function cookieFor(role, id, email, secret = process.env.NEXTAUTH_SECRET, maxAge = 15 * 60) {
  const token = await encode({
    token: { id, role, email, sub: id },
    secret,
    maxAge,
  });
  return `next-auth.session-token=${token}`;
}

describe("API authentication", () => {
  const user = () => cookieFor("user", "user-1", "user@example.com");
  const admin = () => cookieFor("admin", "admin-1", "admin@example.com");

  it("rejects an anonymous caller on a protected route and allows an admin", async () => {
    const anonymous = await request(app).get("/api/orders");
    const asUser = await request(app).get("/api/orders").set("Cookie", await user());
    const asAdmin = await request(app).get("/api/orders").set("Cookie", await admin());

    expect(anonymous.status).toBe(401);
    expect(asUser.status).toBe(403);
    expect(asAdmin.status).toBe(200);
  });

  it("keeps catalogue reads public and catalogue writes admin-only", async () => {
    const read = await request(app).get("/api/categories");
    const write = await request(app).post("/api/categories").send({ name: "Phones" });
    const asUser = await request(app).post("/api/categories").set("Cookie", await user()).send({ name: "Phones" });
    const asAdmin = await request(app).post("/api/categories").set("Cookie", await admin()).send({ name: "Phones" });

    expect(read.status).toBe(200);
    expect(write.status).toBe(401);
    expect(asUser.status).toBe(403);
    expect(asAdmin.status).toBe(201);
  });

  it("rejects expired, tampered and wrongly signed tokens", async () => {
    const expired = await cookieFor("admin", "admin-1", "admin@example.com", process.env.NEXTAUTH_SECRET, -120);
    const valid = await cookieFor("admin", "admin-1", "admin@example.com");
    const wrong = await cookieFor("admin", "admin-1", "admin@example.com", "other-secret");

    expect((await request(app).get("/api/orders").set("Cookie", expired)).status).toBe(401);
    expect((await request(app).get("/api/orders").set("Cookie", `${valid}x`)).status).toBe(401);
    expect((await request(app).get("/api/orders").set("Cookie", wrong)).status).toBe(401);
  });

  it("does not grant admin from a role in the body", async () => {
    const response = await request(app).post("/api/users").send({
      email: "new@example.com",
      password: "password123",
      role: "admin",
    });
    expect(response.status).toBe(401);
  });

  it("allows a user to read their own record and not someone else's", async () => {
    const own = await request(app).get("/api/users/user-1").set("Cookie", await user());
    const other = await request(app).get("/api/users/user-2").set("Cookie", await user());
    expect(own.status).toBe(200);
    expect(other.status).toBe(403);
  });

  it("allows the owner of an order and blocks another user", async () => {
    const { __mock } = require("@prisma/client");
    __mock.customer_order.findUnique.mockResolvedValue({ id: "o1", email: "user@example.com" });
    const owner = await request(app).get("/api/orders/o1").set("Cookie", await user());
    const stranger = await request(app).get("/api/orders/o1").set("Cookie", await cookieFor("user", "user-2", "other@example.com"));
    expect(owner.status).toBe(200);
    expect(stranger.status).toBe(403);
  });

  it("requires auth for notifications and allows only that user", async () => {
    const anonymous = await request(app).get("/api/notifications/user-1");
    const own = await request(app).get("/api/notifications/user-1").set("Cookie", await user());
    const other = await request(app).get("/api/notifications/user-2").set("Cookie", await user());
    expect(anonymous.status).toBe(401);
    expect(own.status).toBe(200);
    expect(other.status).toBe(403);
  });
});
