const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Delete old user
    await User.deleteOne({ email: 'huzaifa@gmail.com' });
    
    // Create new admin
    const admin = await User.create({
      name: 'Admin',
      email: 'admin@hnh.tv',
      password: 'Admin@123',
      role: 'admin'
    });
    
    console.log('\n✅ ADMIN ACCOUNT CREATED SUCCESSFULLY\n');
    console.log('📧 Email: admin@hnh.tv');
    console.log('🔐 Password: Admin@123');
    console.log('👤 Role: admin\n');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createAdmin();
