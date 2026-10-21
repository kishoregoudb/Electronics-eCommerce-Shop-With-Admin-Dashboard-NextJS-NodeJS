const { AppError } = require("./errorHandler");

// Single source of truth for valid roles. middleware.ts treats "admin" as the
// privileged value. Matching is case-sensitive on purpose: "Admin" would be
// stored but never grant admin access, so it is rejected instead.
const ALLOWED_ROLES = Object.freeze(["user", "admin"]);
const DEFAULT_ROLE = "user";

// Throws AppError(400) unless role is one of ALLOWED_ROLES.
function assertValidRole(role) {
  if (typeof role !== "string" || !ALLOWED_ROLES.includes(role)) {
    throw new AppError(
      `Invalid role. Allowed roles: ${ALLOWED_ROLES.join(", ")}`,
      400
    );
  }
  return role;
}

module.exports = { ALLOWED_ROLES, DEFAULT_ROLE, assertValidRole };
