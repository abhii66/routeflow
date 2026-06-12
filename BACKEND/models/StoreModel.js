import { Schema, model } from "mongoose";

const storeSchema = new Schema(
  {
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ["pharmacy", "grocery", "other"],
      default: "other",
    },
    address: { type: String, required: true },
    location: {
      lat: { type: Number },
      lng: { type: Number },
    },
    logo: { type: String, default: "" },
    managerId: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

export default model("Store", storeSchema);
