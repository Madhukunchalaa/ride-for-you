require('dotenv').config();
const mongoose = require('mongoose');
const Rider = require('./src/models/Rider');

const NAMES = [
  'Deepak Bharadwaj', 'Harish odithela', 'Jay kishor kumar',
  'Kaviti durga prasad', 'Mudavath Prasad'
];

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  for (const name of NAMES) {
    const r = await Rider.findOne({ name: { $regex: new RegExp(name, 'i') } });
    if (!r) { console.log(`❌ Not found: ${name}`); continue; }
    const today = new Date(); today.setHours(0,0,0,0);
    const ret = new Date(r.returnDate); ret.setHours(0,0,0,0);
    const daysOverdue = Math.floor((today - ret) / (1000*60*60*24));
    console.log(`${r.name} | status=${r.paymentStatus} | totalWeeks=${r.totalWeeks} | returnDate=${ret.toDateString()} | daysOverdue=${daysOverdue}`);
  }
  await mongoose.disconnect();
}
check().catch(console.error);
