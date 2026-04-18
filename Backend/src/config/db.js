const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    console.error("❌ FATAL: MONGODB_URI is undefined in environment variables!");
    return; // Don't crash the server
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`❌ MongoDB Error: ${err.message}`);
    // Don't exit process, allow frontend to serve
  }
};

module.exports = connectDB;
