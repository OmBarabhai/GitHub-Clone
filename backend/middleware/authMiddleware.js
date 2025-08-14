// middleware/authMiddleware.js

const jwt = require("jsonwebtoken");
const { supabase, supabaseAdmin } = require("../config/supabaseClient");

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

// ✅ Middleware to authenticate JWT and attach user to req
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    // Attach user info to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role, // admin or user
    };

    // Optional: attach Supabase client for current user
    req.supabase = supabase;

    next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};

// ✅ Middleware to check if user is self or admin
const authorizeSelfOrAdmin = (req, res, next) => {
  const isSelf = req.user && req.user.id == req.params.id;
  const isAdmin = req.user && req.user.role === "admin";

  if (!isSelf && !isAdmin) {
    return res.status(403).json({ error: "Access denied" });
  }
  next();
};

// ✅ Middleware to check if user is owner or admin for any entity
const authorizeOwnerOrAdmin = (getOwnerId) => {
  return async (req, res, next) => {
    try {
      const ownerId = await getOwnerId(req);

      if (req.user.id !== ownerId && req.user.role !== "admin") {
        return res.status(403).json({ error: "Access denied" });
      }

      next();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
};

module.exports = {
  authenticate,
  authorizeSelfOrAdmin,
  authorizeOwnerOrAdmin,
};
