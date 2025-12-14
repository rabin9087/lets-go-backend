import mongoose, { Document } from "mongoose";

export interface ISession extends Document {
  token: string;
  email_phone: string;
  createdAt: Date;
  updatedAt: Date;
}

const sessionSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      index: 1,
    },
    email_phone: {
      type: String,
      required: true,
      default: "",
      index: 1,
    },
  },
  { timestamps: true }
);
export default mongoose.model("session", sessionSchema); ///sessions
