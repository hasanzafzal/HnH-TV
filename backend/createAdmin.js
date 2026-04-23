const mongoose = require('mongoose');
const User = require('./src/models/User');

async function createAdmin() {
  try {
    await mongoose.connect('mongodb+srv://huzaifakhawarm_db_user:cP31aO6g1SZAvnSY@cluster0.3s68luw.mongodb.net/?appName=Cluster0');
    
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
