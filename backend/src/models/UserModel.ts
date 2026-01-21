import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      minlength: 3,
      unique: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      unique: true
    },
    passwordHash: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

export const User = mongoose.model("User", UserSchema);
