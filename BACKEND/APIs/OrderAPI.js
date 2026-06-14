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
      const { riderIds } = req.body;

      if (!Array.isArray(riderIds) || riderIds.length === 0) {
        return res.status(400).json({ message: "Select at least one rider" });
      }

      const riders = await User.find({
        _id: { $in: riderIds },
        role: "rider",
        isAvailable: true,
      });
      if (riders.length === 0) {
        return res.status(400).json({ message: "No available riders found" });
      }

      const order = await Order.findByIdAndUpdate(
        req.params.id,
        {
          status: "AwaitingAcceptance",
          candidateRiders: riders.map((r) => r._id),
          assignedRider: null,
        },
        { new: true },
      );

      if (!order) return res.status(404).json({ message: "Order not found" });

      riders.forEach((rider) => {
        io.to(`rider:${rider._id}`).emit("orderOffer", order);
      });

      io.to(`store:${order.storeId}`).emit("orderUpdate", order);

      res.json({
        message: `Order offered to ${riders.length} rider(s)`,
        order,
      });
    } catch (err) {
      res.status(500).json({ message: "Server error", error: err.message });
    }
  },
);

// PUT /orders-api/:id/accept  → rider accepts the order
orderApp.put(
  "/:id/accept",
  verifyToken,
  authorizeRoles("rider"),
  async (req, res) => {
    try {
      const order = await Order.findOne({
        _id: req.params.id,
        status: "AwaitingAcceptance",
        candidateRiders: req.user._id,
      });

      if (!order) {
        return res
          .status(404)
          .json({ message: "Order not available or already taken" });
      }

      const otherRiders = order.candidateRiders.filter(
        (r) => r.toString() !== req.user._id.toString(),
      );

      order.status = "Dispatched";
      order.assignedRider = req.user._id;
      order.candidateRiders = [];
      order.dispatchedAt = new Date();
      await order.save();

      await User.findByIdAndUpdate(req.user._id, { isAvailable: false });

      otherRiders.forEach((riderId) => {
        io.to(`rider:${riderId}`).emit("orderTaken", { orderId: order._id });
      });

      io.to(`store:${order.storeId}`).emit("orderUpdate", order);

      res.json({ message: "Order accepted", order });
    } catch (err) {
      res.status(500).json({ message: "Server error", error: err.message });
    }
  },
);

// PUT /orders-api/:id/decline  → rider declines the order
orderApp.put(
  "/:id/decline",
  verifyToken,
  authorizeRoles("rider"),
  async (req, res) => {
    try {
      const order = await Order.findOne({
        _id: req.params.id,
        status: "AwaitingAcceptance",
        candidateRiders: req.user._id,
      });

      if (!order) {
        return res
          .status(404)
          .json({ message: "Order not found or already taken" });
      }

      order.candidateRiders = order.candidateRiders.filter(
        (r) => r.toString() !== req.user._id.toString(),
      );

      if (order.candidateRiders.length === 0) {
        order.status = "Pending";
        io.to(`store:${order.storeId}`).emit("orderUpdate", order);
      }

      await order.save();

      res.json({ message: "Order declined", order });
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

        const RIDER_INCENTIVE_RATE = 0.05;
        const riderEarning =
          order.deliveryFee +
          Math.round(order.totalAmount * RIDER_INCENTIVE_RATE);
        order.riderEarning = riderEarning;

        await User.findByIdAndUpdate(req.user._id, {
          $inc: { totalEarnings: riderEarning },
          isAvailable: true,
        });
      } else {
        // Cancelled - free up the rider
        await User.findByIdAndUpdate(req.user._id, { isAvailable: true });
      }

      await order.save();

      // Notify manager via Socket.IO
      io.to(`store:${order.storeId}`).emit("orderUpdate", order);

      res.json({ message: `Order marked as ${status}`, order });
    } catch (err) {
      res.status(500).json({ message: "Server error", error: err.message });
    }
  },
);
// PUT /orders-api/:id/cancel  → cancelling an order
orderApp.put(
  "/:id/cancel",
  verifyToken,
  authorizeRoles("manager"),
  async (req, res) => {
    try {
      const order = await Order.findById(req.params.id);
      if (!order) return res.status(404).json({ message: "Order not found" });

      if (order.status === "Delivered") {
        return res
          .status(400)
          .json({ message: "Cannot cancel a delivered order" });
      }
      if (order.status === "Cancelled") {
        return res.status(400).json({ message: "Order is already cancelled" });
      }

      const wasDispatched = order.status === "Dispatched";
      const wasAwaiting = order.status === "AwaitingAcceptance";
      const riderId = order.assignedRider;
      const candidates = order.candidateRiders || [];
      order.status = "Cancelled";
      order.candidateRiders = [];
      await order.save();
      if (wasDispatched && riderId) {
        await User.findByIdAndUpdate(riderId, { isAvailable: true });
        io.to(`rider:${riderId}`).emit("orderCancelled", order);
      }
      if (wasAwaiting && candidates.length > 0) {
        candidates.forEach((cId) => {
          io.to(`rider:${cId}`).emit("orderCancelled", order);
        });
      }

      res.json({ message: "Order cancelled", order });
    } catch (err) {
      res.status(500).json({ message: "Server error", error: err.message });
    }
  },
);

export default orderApp;
