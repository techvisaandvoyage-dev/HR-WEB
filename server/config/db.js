const mongoose = require('mongoose');

let isConnecting = false;

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    global.__lastMongoError = 'MONGO_URI environment variable is not defined in process.env';
    console.warn('⚠️ Warning: MONGO_URI environment variable is not defined.');
    return;
  }
  if (mongoose.connection.readyState === 1 || isConnecting) {
    return;
  }
  try {
    isConnecting = true;
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    global.__lastMongoError = null;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    global.__lastMongoError = err.message;
    console.error(`MongoDB connection error: ${err.message}`);
    // Auto-retry connection every 5s if initial attempt fails
    setTimeout(connectDB, 5000);
  } finally {
    isConnecting = false;
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected! Attempting reconnect in 5s...');
  setTimeout(connectDB, 5000);
});

mongoose.connection.on('error', (err) => {
  global.__lastMongoError = err.message;
  console.error('⚠️ MongoDB connection error event:', err.message);
});

module.exports = connectDB;
