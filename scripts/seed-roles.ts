import connectDB from '@/lib/mongodb';
import Role from '@/lib/models/Role';

async function seedRoles() {
  try {
    await connectDB();

    console.log('Starting to seed roles...');

    // Check if roles already exist
    const existingRoles = await Role.countDocuments();
    if (existingRoles > 0) {
      console.log('Roles already exist. Skipping seed.');
      return;
    }

    const roles = [
      {
        name: 'Super Admin',
        description: 'Full system access with all permissions',
        isSystem: true,
        permissions: [
          'manage_organizations',
          'manage_users',
          'manage_roles',
          'view_reports',
          'manage_settings',
          'manage_billing'
        ],
      },
      {
        name: 'Admin',
        description: 'Organization level administrator',
        isSystem: true,
        permissions: [
          'manage_students',
          'manage_seats',
          'manage_transactions',
          'manage_expenses',
          'manage_attendance',
          'view_reports',
          'manage_settings'
        ],
      },
      {
        name: 'Staff',
        description: 'Daily operations staff',
        isSystem: true,
        permissions: [
          'manage_students',
          'manage_attendance',
          'view_seats',
          'create_transactions'
        ],
      },
    ];

    await Role.insertMany(roles);
    console.log('✅ Roles seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding roles:', error);
    process.exit(1);
  }
}

seedRoles()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });