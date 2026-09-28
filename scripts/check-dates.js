const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  
  // Get all unique dates with counts
  const records = await db.collection('attendances').find({}, { 
    projection: { date: 1, status: 1, checkIn: 1, student: 1 }
  }).sort({ date: -1 }).toArray();
  
  const byDate = {};
  records.forEach(r => {
    const d = new Date(r.date).toISOString().split('T')[0];
    if (!byDate[d]) byDate[d] = { total: 0, success: 0, failed: 0 };
    byDate[d].total++;
    if (r.status === 'failed') byDate[d].failed++;
    else byDate[d].success++;
  });
  
  console.log('--- Records by Date ---');
  Object.entries(byDate).forEach(([date, counts]) => {
    console.log(`  ${date}: ${counts.total} total (${counts.success} success, ${counts.failed} failed)`);
  });
  
  await mongoose.disconnect();
}).catch(err => { console.error(err); process.exit(1); });
