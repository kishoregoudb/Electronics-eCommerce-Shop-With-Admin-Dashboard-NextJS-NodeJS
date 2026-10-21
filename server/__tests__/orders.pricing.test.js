jest.mock("@prisma/client", () => {
  const prisma = {
    customer_order: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    product: { findMany: jest.fn() },
    user: { findUnique: jest.fn() },
    customer_order_product: { create: jest.fn() },
  };
  return { PrismaClient: jest.fn(() => prisma), __prisma: prisma };
});
jest.mock("../utills/notificationHelpers", () => ({
  createOrderUpdateNotification: jest.fn().mockResolvedValue(undefined),
}));

const { __prisma: prisma } = require("@prisma/client");
const { createCustomerOrder } = require("../controllers/customer_orders");

const customer = {
  name: "Ada",
  lastname: "Lovelace",
  phone: "5550001111",
  email: "ada@example.com",
  company: "Analytical",
  adress: "1 Engine Street",
  apartment: "2",
  postalCode: "10001",
  city: "London",
  country: "United Kingdom",
  orderNotice: "",
  status: "pending",
};

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function callCreate(extra) {
  const res = mockRes();
  return createCustomerOrder({ body: { ...customer, ...extra }, reqId: "m1" }, res).then(() => res);
}

describe("createCustomerOrder pricing", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.customer_order.findFirst.mockResolvedValue(null);
    prisma.user.findUnique.mockResolvedValue(null);
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    console.log.mockRestore();
    console.error.mockRestore();
  });

  it("stores the database price times quantity and ignores a forged total", async () => {
    prisma.product.findMany.mockResolvedValue([
      { id: "p1", price: 40, inStock: 1 },
      { id: "p2", price: 15, inStock: 1 },
    ]);
    prisma.customer_order.create.mockResolvedValue({ id: "o1", total: 70 });

    const res = await callCreate({
      total: 1,
      items: [
        { productId: "p1", quantity: 1 },
        { productId: "p2", quantity: 2 },
      ],
    });

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id: "o1", total: 70 }));
    expect(prisma.customer_order.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        total: 70,
        products: {
          create: [
            { productId: "p1", quantity: 1 },
            { productId: "p2", quantity: 2 },
          ],
        },
      }),
    }));
  });

  it("creates no order when a product id is unknown", async () => {
    prisma.product.findMany.mockResolvedValue([]);
    const res = await callCreate({ items: [{ productId: "missing", quantity: 1 }] });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(prisma.customer_order.create).not.toHaveBeenCalled();
  });

  it("creates no order when a product is out of stock", async () => {
    prisma.product.findMany.mockResolvedValue([{ id: "p1", price: 40, inStock: 0 }]);
    const res = await callCreate({ items: [{ productId: "p1", quantity: 1 }] });
    expect(res.status).toHaveBeenCalledWith(409);
    expect(prisma.customer_order.create).not.toHaveBeenCalled();
  });

  it("creates no order when the nested write fails", async () => {
    prisma.product.findMany.mockResolvedValue([{ id: "p1", price: 40, inStock: 1 }]);
    prisma.customer_order.create.mockRejectedValue(new Error("line failed"));
    const res = await callCreate({ items: [{ productId: "p1", quantity: 1 }] });
    expect(res.status).toHaveBeenCalledWith(500);
    expect(prisma.customer_order_product.create).not.toHaveBeenCalled();
  });

  it("rejects a quantity above 10 and a non-integer quantity", async () => {
    const tooMany = await callCreate({ items: [{ productId: "p1", quantity: 11 }] });
    const fraction = await callCreate({ items: [{ productId: "p1", quantity: 1.5 }] });
    expect(tooMany.status).toHaveBeenCalledWith(400);
    expect(fraction.status).toHaveBeenCalledWith(400);
    expect(prisma.customer_order.create).not.toHaveBeenCalled();
  });

  it("rejects a duplicate order with the same email and computed total", async () => {
    prisma.product.findMany.mockResolvedValue([{ id: "p1", price: 40, inStock: 1 }]);
    prisma.customer_order.findFirst.mockResolvedValue({ id: "old" });
    const res = await callCreate({ items: [{ productId: "p1", quantity: 1 }] });
    expect(res.status).toHaveBeenCalledWith(409);
    expect(prisma.customer_order.create).not.toHaveBeenCalled();
  });
});
