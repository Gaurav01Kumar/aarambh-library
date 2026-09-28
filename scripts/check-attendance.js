// Quick script to check attendance records in MongoDB
const mongoose = require('mongoose');
require('dotenv').config();

async function check() {
  const uri = process.env.MONGODB_URI;
  console.log('Connecting to:', uri);
  
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db;
  
  // List all collections
  const collections = await db.listCollections().toArray();
  console.log('\n--- Collections ---');
  collections.forEach(c => console.log(`  ${c.name}`));
  
  // Check attendances collection
  const attendanceCount = await db.collection('attendances').countDocuments();
  console.log(`\n--- Attendance Records: ${attendanceCount} ---`);
  
  if (attendanceCount > 0) {
    const recent = await db.collection('attendances').find().sort({ createdAt: -1 }).limit(5).toArray();
    console.log('\nRecent 5 records:');
    recent.forEach(r => {
      console.log(`  ID: ${r._id}, Student: ${r.student}, Date: ${r.date}, CheckIn: ${r.checkIn}, Status: ${r.status}`);
    });
  } else {
    console.log('No attendance records found. The old broken pre-save hook prevented records from being saved.');
    console.log('After restarting the dev server, try marking attendance again — it should work now.');
  }

  // Also check students
  const studentCount = await db.collection('librarymembers').countDocuments();
  console.log(`\n--- Students (LibraryMembers): ${studentCount} ---`);
  
  if (studentCount > 0) {
    const students = await db.collection('librarymembers').find({ isActive: true }).limit(5).toArray();
    console.log('Active students:');
    students.forEach(s => {
      console.log(`  ${s.name} | Seat: ${s.seatNumber} | Device: ${s.registeredDeviceId || 'none'}`);
    });
  }

  await mongoose.disconnect();
  console.log('\nDone.');
}

check().catch(err => { console.error(err); process.exit(1); });
