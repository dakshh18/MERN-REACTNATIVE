import mongoose from "mongoose";
import { ENV } from "../config/env.js";

const run = async () => {
  try {
    await mongoose.connect(ENV.DB_URL);
    console.log("Connected to MongoDB");
    const result = await mongoose.connection.db.collection("carts").drop().catch((err) => {
      if (err.codeName === "NamespaceNotFound") {
        return { dropped: false, reason: "collection did not exist" };
      }
      throw err;
    });
    console.log("Result:", result);
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error("Reset failed:", err);
    process.exit(1);
  }
};

run();
