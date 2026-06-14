import { Schema, model } from "mongoose";

const orderSchema = new Schema(
  {
    storeId: { type: Schema.Types.ObjectId, ref: "Store", required: true },

    customer: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
      location: {
        lat: { type: Number },
        lng: { type: Number },
      },
    },

    items: [
      {
        name: { type: String, required: true },
        qty: { type: Number, required: true },
        price: { type: Number, required: true },
      },
    ],

    totalAmount: { type: Number, required: true },
    deliveryFee: { type: Number, default: 30 }, // ₹30 default delivery fee

    status: {
      type: String,
      enum: ['Pending', 'AwaitingAcceptance', 'Dispatched', 'Delivered', 'Cancelled'],
      default: "Pending",
    },

    assignedRider: { type: Schema.Types.ObjectId, ref: "User", default: null },
    candidateRiders: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    riderEarning: { type: Number, default: null },
    dispatchedAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export default model("Order", orderSchema);
