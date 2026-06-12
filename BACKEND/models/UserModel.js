import { Schema, model } from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["manager", "rider"], required: true },

    // Rider-specific fields
    phone: { type: String },
    profilePic: { type: String, default: "" },
    isAvailable: { type: Boolean, default: true },
    currentLocation: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    totalEarnings: { type: Number, default: 0 },

    // Manager-specific: which store they manage
    storeId: { type: Schema.Types.ObjectId, ref: "Store", default: null },
  },
  { timestamps: true },
);

export default model("User", userSchema);
