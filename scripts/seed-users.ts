import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import Role from '@/lib/models/Role';
import bcrypt from 'bcryptjs';

async function seedUsers() {
  try {
    await connectDB();

    console.log('Starting to seed users...');

    // Check if users already exist
    const existingUsers = await User.countDocuments();
    if (existingUsers > 0) {
      console.log('Users already exist. Skipping seed.');
      return;
    }

    // Get roles
    const superAdminRole = await Role.findOne({ name: 'Super Admin' });
    const adminRole = await Role.findOne({ name: 'Admin' });
    const staffRole = await Role.findOne({ name: 'Staff' });

    if (!superAdminRole || !adminRole || !staffRole) {
      console.log('Please seed roles first by running: npm run seed:roles');
      return;
    }

    // Hash passwords
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const users = [
      {
        name: 'Super Admin',
        email: 'superadmin@library.com',
        password: hashedPassword,
        role: 'admin',
        phone: '+91 9876543210',
        permissions: superAdminRole.permissions,
        isActive: true,
      },
      {
        name: 'Admin User',
        email: 'admin@library.com',
        password: hashedPassword,
        role: 'admin',
        phone: '+91 9876543211',
        permissions: adminRole.permissions,
        isActive: true,
      },
      {
        name: 'Staff User',
        email: 'staff@library.com',
        password: hashedPassword,
        role: 'staff',
        phone: '+91 9876543212',
        permissions: staffRole.permissions,
        isActive: true,
      },
    ];

    await User.insertMany(users);

    console.log('✅ Users seeded successfully!');
    console.log(`Created ${users.length} users:`);
    users.forEach(user => {
      console.log(`  - ${user.name} (${user.email}): ${user.role}`);
    });
    console.log('\nDefault password for all users: admin123');

  } catch (error) {
    console.error('❌ Error seeding users:', error);
    process.exit(1);
  }
}

// Run the seed function
seedUsers()
  .then(() => {
    console.log('Seed completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });