import { Router } from "express";
import User from "../models/UserModel.js";
import Order from "../models/OrderModel.js";
import { verifyToken, authorizeRoles } from "../middleware/verifyToken.js";
import { upload } from "../config/multer.js";
import { uploadToCloudinary } from "../config/cloudinaryUpload.js";

const riderApp = Router();

// GET /riders-api/  → manager gets all riders (with live location)
riderApp.get("/", verifyToken, authorizeRoles("manager"), async (req, res) => {
  try {
    const riders = await User.find({ role: "rider" })
      .select("-password")
      .sort({ isAvailable: -1 }); // available riders first

    res.json(riders);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /riders-api/earnings  → rider gets their own earnings summary
riderApp.get(
  "/earnings",
  verifyToken,
  authorizeRoles("rider"),
  async (req, res) => {
    try {
      const rider = await User.findById(req.user._id).select(
        "name totalEarnings",
      );

      // Count orders delivered today
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const todayDeliveries = await Order.countDocuments({
        assignedRider: req.user._id,
        status: "Delivered",
        deliveredAt: { $gte: todayStart },
      });

      const totalDeliveries = await Order.countDocuments({
        assignedRider: req.user._id,
        status: "Delivered",
      });

      // Earnings broken down by last 7 days
      const last7Days = await Order.aggregate([
        {
          $match: {
            assignedRider: rider._id,
            status: "Delivered",
            deliveredAt: {
              $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$deliveredAt" },
            },
            dailyEarnings: { $sum: "$deliveryFee" },
            deliveries: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      res.json({
        name: rider.name,
        totalEarnings: rider.totalEarnings,
        totalDeliveries,
        todayDeliveries,
        last7Days,
      });
    } catch (err) {
      res.status(500).json({ message: "Server error", error: err.message });
    }
  },
);

// GET /riders-api/my-orders  → rider sees their assigned orders
riderApp.get(
  "/my-orders",
  verifyToken,
  authorizeRoles("rider"),
  async (req, res) => {
    try {
      const { status } = req.query;
      const filter = { assignedRider: req.user._id };
      if (status) filter.status = status;

      const orders = await Order.find(filter)
        .populate("storeId", "name address location")
        .sort({ createdAt: -1 });

      res.json(orders);
    } catch (err) {
      res.status(500).json({ message: "Server error", error: err.message });
    }
  },
);

// PUT /riders-api/profile-pic  → rider uploads profile picture (Cloudinary)
riderApp.put(
  "/profile-pic",
  verifyToken,
  authorizeRoles("rider"),
  upload.single("profilePic"),
  async (req, res) => {
    try {
      if (!req.file)
        return res.status(400).json({ message: "No image provided" });

      const result = await uploadToCloudinary(req.file.buffer);

      await User.findByIdAndUpdate(req.user._id, {
        profilePic: result.secure_url,
      });

      res.json({
        message: "Profile picture updated",
        profilePic: result.secure_url,
      });
    } catch (err) {
      res.status(500).json({ message: "Server error", error: err.message });
    }
  },
);

// PUT /riders-api/availability  → rider toggles availability
riderApp.put(
  "/availability",
  verifyToken,
  authorizeRoles("rider"),
  async (req, res) => {
    try {
      const { isAvailable } = req.body;
      const rider = await User.findByIdAndUpdate(
        req.user._id,
        { isAvailable },
        { new: true },
      ).select("-password");

      res.json({
        message: "Availability updated",
        isAvailable: rider.isAvailable,
      });
    } catch (err) {
      res.status(500).json({ message: "Server error", error: err.message });
    }
  },
);

export default riderApp;
