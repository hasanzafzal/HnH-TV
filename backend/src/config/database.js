const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect( "mongodb+srv://huzaifakhawarm_db_user:cP31aO6g1SZAvnSY@cluster0.3s68luw.mongodb.net/?appName=Cluster0" );
    console.log('MongoDB Connected Successfully');
  } catch (error) {
    console.error('MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
