const { decode } = require("next-auth/jwt");

const COOKIE_NAMES = [
  "__Secure-next-auth.session-token",
  "next-auth.session-token",
];

function readCookie(req, name) {
  const header = req.headers.cookie;
  if (!header) return null;
  const parts = header.split(";");
  for (const part of parts) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    if (trimmed.slice(0, eq) === name) {
      return decodeURIComponent(trimmed.slice(eq + 1));
    }
  }
  return null;
}

function readSessionToken(req) {
  for (const name of COOKIE_NAMES) {
    const value = readCookie(req, name);
    if (value) return value;
  }
  return null;
}

// Attach req.user from the verified NextAuth JWT. Never reads role from the body.
async function authenticate(req, res, next) {
  req.user = null;
  try {
    const token = readSessionToken(req);
    const secret = process.env.NEXTAUTH_SECRET;
    if (!token || !secret) return next();

    const payload = await decode({ token, secret });
    if (!payload || !payload.id || !payload.role) return next();

    const now = Math.floor(Date.now() / 1000);
    if (typeof payload.exp === "number" && payload.exp < now - 15) return next();

    req.user = {
      id: String(payload.id),
      role: payload.role,
      email: payload.email ? String(payload.email) : undefined,
    };
  } catch (error) {
    req.user = null;
  }
  return next();
}

function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  return next();
}

function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }
  return next();
}

function requireSelfOrAdmin(paramName) {
  return function selfOrAdmin(req, res, next) {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    if (req.user.role === "admin" || req.params[paramName] === req.user.id) {
      return next();
    }
    return res.status(403).json({ error: "Forbidden" });
  };
}

function requireSelfEmailOrAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  const email = req.params.email ? decodeURIComponent(req.params.email) : "";
  if (req.user.role === "admin" || (req.user.email && req.user.email.toLowerCase() === email.toLowerCase())) {
    return next();
  }
  return res.status(403).json({ error: "Forbidden" });
}

module.exports = {
  authenticate,
  requireAuth,
  requireAdmin,
  requireSelfOrAdmin,
  requireSelfEmailOrAdmin,
  readSessionToken,
};
