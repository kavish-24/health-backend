import mongoose from "mongoose";

export async function connectDB(uri) {
  if (!uri) {
    throw new Error("Missing MongoDB URI");
  }

  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  return mongoose.connect(uri);
}
