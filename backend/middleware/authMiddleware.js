

const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Please log in first."
    });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({
      message: "Server authentication is not configured."
    });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.userId) {
      return res.status(401).json({
        message: "Invalid token."
      });
    }

    const user = await User.findById(decoded.userId).select("_id name email role");

    if (!user) {
      return res.status(401).json({
        message: "User account not found."
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" ||
        error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Invalid or expired token."
      });
    }

    console.error("Authentication error:", error.message);
    return res.status(500).json({
      message: "Authentication failed."
    });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      message: "Admin access required."
    });
  }

  next();
}

module.exports = {
  authenticateToken,
  requireAdmin
};
