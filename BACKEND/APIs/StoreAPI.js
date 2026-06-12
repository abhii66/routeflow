import { Router } from "express";
import Store from "../models/StoreModel.js";
import User from "../models/UserModel.js";
import { verifyToken, authorizeRoles } from "../middleware/verifyToken.js";
import { upload } from "../config/multer.js";
import { uploadToCloudinary } from "../config/cloudinaryUpload.js";

const storeApp = Router();

// POST /store-api/  → manager creates a store and gets linked to it
storeApp.post("/", verifyToken, authorizeRoles("manager"), async (req, res) => {
  try {
    const { name, type, address, location } = req.body;

    // One manager = one store
    const existing = await Store.findOne({ managerId: req.user._id });
    if (existing)
      return res.status(400).json({ message: "You already have a store" });

    const store = await Store.create({
      name,
      type,
      address,
      location,
      managerId: req.user._id,
    });

    // Link store to manager
    await User.findByIdAndUpdate(req.user._id, { storeId: store._id });

    res.status(201).json({ message: "Store created", store });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /store-api/my  → manager gets their own store
storeApp.get(
  "/my",
  verifyToken,
  authorizeRoles("manager"),
  async (req, res) => {
    try {
      const store = await Store.findOne({ managerId: req.user._id });
      if (!store) return res.status(404).json({ message: "No store found" });
      res.json(store);
    } catch (err) {
      res.status(500).json({ message: "Server error", error: err.message });
    }
  },
);

// PUT /store-api/my  → manager updates their store details
storeApp.put(
  "/my",
  verifyToken,
  authorizeRoles("manager"),
  async (req, res) => {
    try {
      const { name, type, address, location } = req.body;

      const store = await Store.findOneAndUpdate(
        { managerId: req.user._id },
        { name, type, address, location },
        { new: true },
      );

      if (!store) return res.status(404).json({ message: "No store found" });
      res.json({ message: "Store updated", store });
    } catch (err) {
      res.status(500).json({ message: "Server error", error: err.message });
    }
  },
);

// PUT /store-api/my/logo  → manager uploads store logo
storeApp.put(
  "/my/logo",
  verifyToken,
  authorizeRoles("manager"),
  upload.single("logo"),
  async (req, res) => {
    try {
      if (!req.file)
        return res.status(400).json({ message: "No image provided" });

      const result = await uploadToCloudinary(req.file.buffer);

      const store = await Store.findOneAndUpdate(
        { managerId: req.user._id },
        { logo: result.secure_url },
        { new: true },
      );

      res.json({ message: "Logo updated", logo: store.logo });
    } catch (err) {
      res.status(500).json({ message: "Server error", error: err.message });
    }
  },
);

export default storeApp;
