jest.mock("../utills/db", () => ({
  user: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
}));
jest.mock("bcryptjs", () => ({ hash: jest.fn().mockResolvedValue("hashed") }));

const prisma = require("../utills/db");
const { createUser, updateUser } = require("../controllers/users");

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

async function run(handler, req) {
  const res = mockRes();
  await handler(req, res, jest.fn());
  // asyncHandler does not return its promise; flush microtasks
  await new Promise((r) => setImmediate(r));
  return res;
}

const base = { email: "a@example.com", password: "longenough" };

describe("createUser role validation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation();
    prisma.user.create.mockImplementation(async ({ data }) => ({ id: "u1", ...data }));
  });
  afterEach(() => console.error.mockRestore());

  it.each(["user", "admin"])("accepts role %s", async (role) => {
    const res = await run(createUser, { body: { ...base, role } });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(prisma.user.create.mock.calls[0][0].data.role).toBe(role);
  });

  it("defaults to user when role is missing", async () => {
    const res = await run(createUser, { body: base });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(prisma.user.create.mock.calls[0][0].data.role).toBe("user");
  });

  it.each(["superadmin", "Admin", "ADMIN", "", 1, {}, ["admin"]])(
    "rejects invalid role %p with 400 and no write",
    async (role) => {
      const res = await run(createUser, { body: { ...base, role } });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(JSON.stringify(res.json.mock.calls[0][0])).toMatch(/role/i);
      expect(prisma.user.create).not.toHaveBeenCalled();
    }
  );

  it("keeps existing validation: short password and bad email", async () => {
    let res = await run(createUser, { body: { email: "a@example.com", password: "short" } });
    expect(res.status).toHaveBeenCalledWith(400);
    res = await run(createUser, { body: { email: "nope", password: "longenough" } });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });
});

describe("updateUser role validation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation();
    prisma.user.findUnique.mockResolvedValue({ id: "u1", role: "user" });
    prisma.user.update.mockImplementation(async ({ data }) => ({ id: "u1", ...data }));
  });
  afterEach(() => console.error.mockRestore());

  it("applies a valid role", async () => {
    const res = await run(updateUser, { params: { id: "u1" }, body: { role: "admin" } });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(prisma.user.update.mock.calls[0][0].data.role).toBe("admin");
  });

  it("leaves role unchanged when missing", async () => {
    const res = await run(updateUser, { params: { id: "u1" }, body: { email: "b@example.com" } });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(prisma.user.update.mock.calls[0][0].data).not.toHaveProperty("role");
  });

  it.each(["superadmin", "Admin", ""])("rejects invalid role %p with 400 and no write", async (role) => {
    const res = await run(updateUser, { params: { id: "u1" }, body: { role } });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});
