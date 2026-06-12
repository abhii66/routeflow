import jwt from "jsonwebtoken";
import { config } from "dotenv";
config();
const { verify } = jwt;

export const verifyToken = (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).json({ message: "Please Login." });
  }
  try {
    const decodeToken = verify(token, process.env.SECRET_KEY);
    req.user = decodeToken;
    next();
  } catch (err) {
    res.status(401).json({ message: "Session Expired, Please Re-login." });
  }
};

// Role-based access: authorizeRoles('manager') or authorizeRoles('manager', 'rider')
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: `Access denied for role: ${req.user.role}` });
    }
    next();
  };
};
