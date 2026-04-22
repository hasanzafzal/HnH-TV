const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hnh-tv', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // Optimized connection pool configuration for a traditional long-running server
      maxPoolSize: 50, // Support concurrent requests with 20% headroom
      minPoolSize: 10, // Pre-warmed connections for instant availability
      maxIdleTimeMS: 30000, // Release idle connections after 30 seconds
      connectTimeoutMS: 10000, // Fail fast on connection issues
      socketTimeoutMS: 45000, // Prevent hanging queries
      serverSelectionTimeoutMS: 5000, // Quick failover for topology changes
    });
    console.log(`✓ MongoDB Connected: ${conn.connection.host}`);
    console.log(`✓ Database: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`⚠ MongoDB Connection Error: ${error.message}`);
    console.error(`⚠ Check your MONGODB_URI and ensure the MongoDB cluster is accessible.`);
    console.warn('\n⚠ Server will continue running without database connection for development.\n');
    // Don't exit - allow server to continue for frontend development
    return null;
  }
};

module.exports = connectDB;
