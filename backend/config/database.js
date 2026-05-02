const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const dns = require('dns');

// Override DNS to use Google's public DNS (fixes ISP DNS blocks on MongoDB Atlas SRV records)
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

// Load .env from the project root directory
dotenv.config({ path: path.join(__dirname, '../..', '.env') });

const connectDB = async () => {
  try {
    const connUrl = process.env.MONGODB_URI || "mongodb+srv://huzaifakhawarm_db_user:gWkKu2HGacihaJMo@cluster0.3s68luw.mongodb.net/?appName=Cluster0";
    console.log('Connecting to MongoDB...');
    await mongoose.connect(connUrl);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
