import mongoose from 'mongoose';

async function main() {
  await mongoose.connect('mongodb://localhost:27017/library-management');
  console.log("Connected");

  const Seat = mongoose.connection.collection('seats');
  const Student = mongoose.connection.collection('librarymembers');

  const a10Seat = await Seat.findOne({ seatNumber: 'A10' });
  const a11Seat = await Seat.findOne({ seatNumber: 'A11' });

  const a10Student = await Student.findOne({ seatNumber: 'A10' });
  const a11Student = await Student.findOne({ seatNumber: 'A11' });

  console.log('Seat A10:', a10Seat);
  console.log('Student on A10:', a10Student);
  
  console.log('Seat A11:', a11Seat);
  console.log('Student on A11:', a11Student);

  process.exit(0);
}
main();
