import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URL as string);
  } catch (error) {
    process.exit(1); // Stop the server if DB fails
  }
};

export default connectDB;
