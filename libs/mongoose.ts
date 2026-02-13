import mongoose from "mongoose";
import User from "@/models/User";

const connectMongo = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error(
      "Add the MONGODB_URI environment variable inside .env.local to use mongoose"
    );
  }

  // If already connected, reuse the connection
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  return mongoose
    .connect(process.env.MONGODB_URI)
    .catch((e) => console.error("Mongoose Client Error: " + e.message));
};

export default connectMongo;
