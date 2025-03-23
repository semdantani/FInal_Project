import mongoose from "mongoose";

async function connect() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is not defined in the environment variables");
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log("connected to MongoDB");
  } catch (error) {
    console.log("not connected to MongoDB", error);
  }
}

export default connect;
