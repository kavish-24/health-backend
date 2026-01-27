import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

const JWT_SECRET = process.env.JWT_SECRET || "healthlens-secret";

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Missing authorization token" });
    }

    const token = header.replace("Bearer ", "").trim();
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.sub).select("-password");
    if (!user) {
      return res.status(401).json({ message: "Invalid token" });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("Auth middleware", err);
    res.status(401).json({ message: "Invalid or expired token" });
  }
}
