import { Router } from "express";
import Order from "../models/OrderModel.js";
import User from "../models/UserModel.js";
import { verifyToken, authorizeRoles } from "../middleware/verifyToken.js";
import { io } from "../socket/io.js";

const orderApp = Router();

// GET /orders-api/  → manager gets all orders for their store
orderApp.get("/", verifyToken, authorizeRoles("manager"), async (req, res) => {
  try {
    const { status } = req.query;
    const manager = await User.findById(req.user._id);
    if (!manager.storeId) {
      return res
        .status(400)
        .json({ message: "Manager is not linked to a store" });
    }
    const filter = { storeId: manager.storeId };
    if (status) filter.status = status;

    const orders = await Order.find(filter)
      .populate("assignedRider", "name phone profilePic currentLocation")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// POST /orders-api/  → manager creates a new order
orderApp.post("/", verifyToken, authorizeRoles("manager"), async (req, res) => {
  try {
    const { customer, items, totalAmount, deliveryFee } = req.body;

    // Get storeId from logged in manager's profile
    const manager = await User.findById(req.user._id);
    if (!manager.storeId) {
      return res
        .status(400)
        .json({ message: "Manager is not linked to a store" });
    }

    const order = await Order.create({
      storeId: manager.storeId,
      customer,
      items,
      totalAmount,
      deliveryFee: deliveryFee || 30,
    });

    res.status(201).json({ message: "Order created", order });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /orders-api/:id  → get single order detail
orderApp.get("/:id", verifyToken, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("assignedRider", "name phone profilePic currentLocation")
      .populate("storeId", "name address");

    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// PUT /orders-api/:id/assign  → manager assigns a rider to an order
orderApp.put(
  "/:id/assign",
  verifyToken,
  authorizeRoles("manager"),
  async (req, res) => {
    try {
      const { riderId } = req.body;

      const rider = await User.findOne({ _id: riderId, role: "rider" });
      if (!rider) return res.status(404).json({ message: "Rider not found" });
      if (!rider.isAvailable)
        return res.status(400).json({ message: "Rider is not available" });

      const order = await Order.findByIdAndUpdate(
        req.params.id,
        {
          assignedRider: riderId,
          status: "Dispatched",
          dispatchedAt: new Date(),
        },
        { new: true },
      ).populate("assignedRider", "name phone");

      if (!order) return res.status(404).json({ message: "Order not found" });

      // Mark rider as busy
      await User.findByIdAndUpdate(riderId, { isAvailable: false });

      // Notify rider via Socket.IO
      io.emit(`rider:${riderId}:newOrder`, order);

      res.json({ message: "Rider assigned, order dispatched", order });
    } catch (err) {
      res.status(500).json({ message: "Server error", error: err.message });
    }
  },
);

// PUT /orders-api/:id/status  → rider marks order as Delivered
orderApp.put(
  "/:id/status",
  verifyToken,
  authorizeRoles("rider"),
  async (req, res) => {
    try {
      const { status } = req.body;
      if (!["Delivered", "Cancelled"].includes(status)) {
        return res
          .status(400)
          .json({ message: "Invalid status. Use Delivered or Cancelled" });
      }

      const order = await Order.findOne({
        _id: req.params.id,
        assignedRider: req.user._id,
      });
      if (!order)
        return res
          .status(404)
          .json({ message: "Order not found or not assigned to you" });

      order.status = status;
      if (status === "Delivered") {
        order.deliveredAt = new Date();

        // Credit delivery fee to rider earnings
        await User.findByIdAndUpdate(req.user._id, {
          $inc: { totalEarnings: order.deliveryFee },
          isAvailable: true,
        });
      } else {
        // Cancelled - free up the rider
        await User.findByIdAndUpdate(req.user._id, { isAvailable: true });
      }

      await order.save();

      // Notify manager via Socket.IO
      io.emit(`store:${order.storeId}:orderUpdate`, order);

      res.json({ message: `Order marked as ${status}`, order });
    } catch (err) {
      res.status(500).json({ message: "Server error", error: err.message });
    }
  },
);

export default orderApp;
