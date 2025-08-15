const jwt = require("jsonwebtoken");
const { supabase } = require("../config/supabaseClient");

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

// Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authentication token required" });
    }
    
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Verify user exists in database
    const { data: user, error } = await supabase
      .from("users")
      .select("id, role")
      .eq("id", decoded.id)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: "Invalid authentication token" });
    }

    // Attach user to request
    req.user = {
      id: user.id,
      role: user.role
    };
    
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

// Authorization middleware (self or admin)
const authorizeSelfOrAdmin = (req, res, next) => {
  const isSelf = req.user.id === req.params.id;
  const isAdmin = req.user.role === "admin";
  
  if (!isSelf && !isAdmin) {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
};

// Generic owner/admin authorization
const authorizeOwnerOrAdmin = (getOwnerId) => {
  return async (req, res, next) => {
    try {
      const ownerId = await getOwnerId(req);
      const isOwner = req.user.id === ownerId;
      const isAdmin = req.user.role === "admin";
      
      if (!isOwner && !isAdmin) {
        return res.status(403).json({ error: "Forbidden" });
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
  authorizeOwnerOrAdmin
};