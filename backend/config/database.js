const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = async () => {
  try {
    const connUrl = process.env.MONGODB_URI || "mongodb+srv://huzaifakhawarm_db_user:cP31aO6g1SZAvnSY@cluster0.3s68luw.mongodb.net/?appName=Cluster0";
    await mongoose.connect(connUrl);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
