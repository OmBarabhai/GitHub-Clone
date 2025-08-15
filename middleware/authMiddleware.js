// middleware/auth.js
const jwt = require('jsonwebtoken');

// Verify JWT token
exports.authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.sendStatus(401);
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Authorize self or admin
exports.authorizeSelfOrAdmin = (req, res, next) => {
  const isSelf = req.user && req.user.id == req.params.id;
  const isAdmin = req.user && req.user.role === 'admin';
  
  if (!isSelf && !isAdmin) {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
};