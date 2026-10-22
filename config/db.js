const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error(
      '✗ MONGO_URI is not set. Copy backend/.env.example to backend/.env and fill it in.'
    );
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`✓ MongoDB connected → ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error('✗ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;