// Keeps customer personal data out of log output.
const SENSITIVE_ORDER_FIELDS = [
  "name",
  "lastname",
  "phone",
  "email",
  "adress",
  "apartment",
  "postalCode",
  "orderNotice",
];

const REDACTED = "[REDACTED]";

// Returns a shallow copy with sensitive fields masked. Never mutates the input.
function redactOrder(order) {
  if (order === null || typeof order !== "object" || Array.isArray(order)) {
    return order;
  }
  const copy = { ...order };
  for (const field of SENSITIVE_ORDER_FIELDS) {
    if (field in copy) copy[field] = REDACTED;
  }
  return copy;
}

// Event-level summary that is safe to log: id, status, total only.
function orderLogSummary(order) {
  if (!order) return {};
  return { id: order.id, status: order.status, total: order.total };
}

// Prisma error messages can echo query arguments (customer data), so only
// name and code are kept for them.
function safeError(error) {
  if (!error) return {};
  const isPrisma = typeof error.name === "string" && error.name.startsWith("PrismaClient");
  return isPrisma
    ? { name: error.name, code: error.code }
    : { name: error.name, code: error.code, message: error.message };
}

module.exports = { SENSITIVE_ORDER_FIELDS, redactOrder, orderLogSummary, safeError };
