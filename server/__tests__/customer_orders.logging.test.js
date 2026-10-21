jest.mock("@prisma/client", () => {
  const prisma = {
    customer_order: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: { findUnique: jest.fn() },
  };
  return { PrismaClient: jest.fn(() => prisma), __prisma: prisma };
});
jest.mock("../utills/notificationHelpers", () => ({
  createOrderUpdateNotification: jest.fn().mockResolvedValue(undefined),
}));

const { __prisma: prisma } = require("@prisma/client");
const { createCustomerOrder, updateCustomerOrder } = require("../controllers/customer_orders");

const body = {
  name: "Zebulon",
  lastname: "Quimby",
  phone: "5559871234",
  email: "zebulon.quimby@example.com",
  company: "Acme Corp",
  adress: "742 Evergreen Terrace",
  apartment: "Suite 9",
  postalCode: "90210",
  city: "Springfield",
  country: "United States",
  orderNotice: "gate code 4471",
  status: "pending",
  total: 150,
  userId: "u1",
};
const SENSITIVE = [
  "Zebulon", "Quimby", "5559871234", "zebulon.quimby@example.com",
  "742 Evergreen Terrace", "Suite 9", "90210", "gate code 4471",
];

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function logged(spies) {
  return spies.flatMap((s) => s.mock.calls).map((args) =>
    args.map((a) => (typeof a === "string" ? a : JSON.stringify(a))).join(" ")
  ).join("\n");
}

describe("order controller logging", () => {
  let spies;
  beforeEach(() => {
    jest.clearAllMocks();
    spies = [jest.spyOn(console, "log").mockImplementation(), jest.spyOn(console, "error").mockImplementation()];
  });
  afterEach(() => spies.forEach((s) => s.mockRestore()));

  it("createCustomerOrder logs no sensitive values and keeps the response", async () => {
    prisma.customer_order.findFirst.mockResolvedValue(null);
    prisma.customer_order.create.mockResolvedValue({ id: "o1", ...body, dateTime: new Date() });
    prisma.user.findUnique.mockResolvedValue({ id: "u1", email: body.email });
    const res = mockRes();

    await createCustomerOrder({ body, reqId: "req123" }, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      id: "o1", message: "Order created successfully", orderNumber: "o1",
    });
    const out = logged(spies);
    for (const v of SENSITIVE) expect(out).not.toContain(v);
    expect(out).toContain("o1");
    expect(out).toContain("req123");
  });

  it("updateCustomerOrder logs no sensitive values", async () => {
    prisma.customer_order.findUnique.mockResolvedValue({ id: "o1", status: "pending" });
    prisma.customer_order.update.mockResolvedValue({ id: "o1", status: "shipped", total: 150 });
    prisma.user.findUnique.mockResolvedValue({ id: "u1", email: body.email });
    const res = mockRes();

    await updateCustomerOrder({ params: { id: "o1" }, body: { ...body, status: "shipped" }, reqId: "r2" }, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const out = logged(spies);
    for (const v of SENSITIVE) expect(out).not.toContain(v);
  });
});
