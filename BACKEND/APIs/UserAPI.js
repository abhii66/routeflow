import { Router } from "express";
import { hash, compare } from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/UserModel.js";
import { verifyToken } from "../middleware/verifyToken.js";
const { sign } = jwt;

const userApp = Router();

// POST /auth-api/register
userApp.post("/register", async (req, res) => {
  try {
    const { name, email, password, role, phone, storeId } = req.body;

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ message: "Email already registered." });

    const hashedPassword = await hash(password, 12);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
      phone: phone || "",
      storeId: storeId || null,
    });

    await newUser.save();
    res.status(201).json({ message: "Registration successful." });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// POST /auth-api/login
userApp.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid email." });

    const passwordMatch = await compare(password, user.password);
    if (!passwordMatch)
      return res.status(400).json({ message: "Incorrect password." });

    const signedJwt = sign(
      { _id: user._id, email: user.email, role: user.role, name: user.name },
      process.env.SECRET_KEY,
      { expiresIn: "7d" },
    );

    res.cookie("token", signedJwt, {
      httpOnly: true,
      sameSite: "none",
      secure: true,
    });

    let userObj = user.toObject();
    delete userObj.password;
    res.status(200).json({ message: "Login Success", payload: userObj });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /auth-api/logout
userApp.get("/logout", async (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "none",
    secure: true,
  });
  res.status(200).json({ message: "Logout Success." });
});

// GET /auth-api/check-auth  → page refresh
userApp.get("/check-auth", verifyToken, async (req, res) => {
  const user = await User.findById(req.user._id)
    .select("-password")
    .populate("storeId", "name type");
  res.status(200).json({ message: "Authenticated", payload: user });
});

export default userApp;
