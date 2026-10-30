import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/library-management';

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const usersCollection = mongoose.connection.collection('users');
  const studentsCollection = mongoose.connection.collection('librarymembers');

  // Find all users who are not system admins
  const systemAdminEmails = ['superadmin@library.com', 'admin@library.com', 'staff@library.com'];

  // Look for any student in librarymembers that matches user email
  const allUsers = await usersCollection.find({}).toArray();

  for (const user of allUsers) {
    if (systemAdminEmails.includes(user.email.toLowerCase())) {
      console.log(`Skipping system staff account: ${user.email}`);
      continue;
    }

    const studentDoc = await studentsCollection.findOne({ email: user.email.toLowerCase() });
    console.log(`Updating user ${user.email} -> setting role to 'student'`);

    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          role: 'student',
          studentId: studentDoc ? studentDoc._id : null,
        },
      }
    );
  }

  const updatedUsers = await usersCollection.find({}).toArray();
  console.log('ALL USERS AFTER FIX:');
  updatedUsers.forEach((u) => {
    console.log(` - ${u.name} (${u.email}): role=${u.role}, studentId=${u.studentId}`);
  });

  process.exit(0);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
