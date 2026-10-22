const mongoose = require('mongoose');

let connectionPromise;

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error('MONGO_URI is not set. Configure it in the deployment environment.');
  }

  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (connectionPromise) return connectionPromise;

  connectionPromise = mongoose
    .connect(uri, {
      serverSelectionTimeoutMS: 10000,
    })
    .then((conn) => {
      console.log(`✓ MongoDB connected → ${conn.connection.host}/${conn.connection.name}`);
      return conn;
    })
    .catch((error) => {
      connectionPromise = null;
      console.error('✗ MongoDB connection error:', error.message);
      throw error;
    });

  return connectionPromise;
};

module.exports = connectDB;