const { redactOrder, SENSITIVE_ORDER_FIELDS, orderLogSummary, safeError } = require("../utills/logSafe");

const order = {
  id: "o1",
  name: "Jane",
  lastname: "Doe",
  phone: "5551234567",
  email: "jane@example.com",
  adress: "1 Main St",
  apartment: "4B",
  postalCode: "12345",
  orderNotice: "leave at door",
  city: "Austin",
  status: "pending",
  total: 100,
};

describe("redactOrder", () => {
  it("masks every sensitive field", () => {
    const out = redactOrder(order);
    for (const f of SENSITIVE_ORDER_FIELDS) expect(out[f]).toBe("[REDACTED]");
  });

  it("keeps non-sensitive fields", () => {
    const out = redactOrder(order);
    expect(out).toMatchObject({ id: "o1", city: "Austin", status: "pending", total: 100 });
  });

  it("does not mutate its input", () => {
    const copy = JSON.parse(JSON.stringify(order));
    redactOrder(order);
    expect(order).toEqual(copy);
  });

  it("handles null, undefined and non-objects", () => {
    expect(redactOrder(null)).toBeNull();
    expect(redactOrder(undefined)).toBeUndefined();
    expect(redactOrder("x")).toBe("x");
  });

  it("does not add fields that are absent", () => {
    expect(redactOrder({ id: 1 })).toEqual({ id: 1 });
  });
});

describe("orderLogSummary / safeError", () => {
  it("summary has id, status, total only", () => {
    expect(orderLogSummary(order)).toEqual({ id: "o1", status: "pending", total: 100 });
  });

  it("safeError drops Prisma messages", () => {
    const e = new Error("args: email jane@example.com");
    e.name = "PrismaClientValidationError";
    expect(safeError(e)).toEqual({ name: "PrismaClientValidationError", code: undefined });
  });
});
