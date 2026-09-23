/**
 * Read-only audit: how far has each rider's weekly cycle drifted off their
 * deploy date, and how many weeks of rent went unbilled because of it?
 *
 * The rule the system is supposed to follow (see src/utils/scheduleHelper.js):
 * every due date sits exactly N whole weeks after deployDate. So for a healthy
 * rider, (returnDate - deployDate) divides evenly by 7.
 *
 * A non-zero remainder means the anniversary was reset at some point — which,
 * before the paymentController fix, happened every time a rider in the recovery
 * bucket paid through Razorpay or PhonePe.
 *
 * "weeks elapsed" vs totalWeeks shows the money side: each overdue period that
 * got absorbed by a reset is a week of rent that was never billed.
 *
 * Writes nothing. Safe to run against production.
 *
 *   node audit_schedule_drift.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Rider = require('./src/models/Rider');

const DAY_MS = 24 * 60 * 60 * 1000;

const fmt = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '—';

const pad = (s, n) => String(s).padEnd(n);
const money = (n) => '₹' + Number(n).toLocaleString('en-IN');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);

  const riders = await Rider.find({ riderStatus: 'active' }).sort({ deployDate: 1 });
  if (!riders.length) {
    console.log('No active riders found.');
    return;
  }

  const defaultRate = 2000;
  const drifted = [];
  let unbilledWeeks = 0;
  let unbilledValue = 0;

  console.log('');
  console.log(
    pad('Rider', 22) +
      pad('Vehicle', 12) +
      pad('Deployed', 14) +
      pad('Next due', 14) +
      pad('Drift', 8) +
      pad('Elapsed', 9) +
      pad('Billed', 8) +
      'Gap',
  );
  console.log('-'.repeat(100));

  for (const r of riders) {
    if (!r.deployDate || !r.returnDate) continue;

    const deploy = new Date(r.deployDate);
    const next = new Date(r.returnDate);

    // Whole days between deploy and next due; the remainder mod 7 is the drift.
    const daysOut = Math.round((next - deploy) / DAY_MS);
    const driftDays = ((daysOut % 7) + 7) % 7;

    // Weeks the rider has actually had the bike, vs weeks they were billed for.
    const weeksElapsed = Math.max(0, Math.floor((Date.now() - deploy.getTime()) / (7 * DAY_MS)));
    const billed = r.totalWeeks || 0;
    const gap = Math.max(0, weeksElapsed - billed);

    const rate = r.rentalRate || defaultRate;

    if (driftDays !== 0) drifted.push({ r, driftDays });
    if (gap > 0) {
      unbilledWeeks += gap;
      unbilledValue += gap * rate;
    }

    console.log(
      pad((r.name || '').slice(0, 20), 22) +
        pad(r.vehicleNumber || '—', 12) +
        pad(fmt(deploy), 14) +
        pad(fmt(next), 14) +
        pad(driftDays === 0 ? 'ok' : `+${driftDays}d !`, 8) +
        pad(weeksElapsed, 9) +
        pad(billed, 8) +
        (gap > 0 ? `${gap} wk (${money(gap * rate)})` : '—'),
    );
  }

  console.log('');
  console.log('='.repeat(100));
  console.log('SUMMARY');
  console.log('='.repeat(100));
  console.log(`Active riders checked:        ${riders.length}`);
  console.log(`Cycle drifted off deploy date: ${drifted.length}`);

  if (drifted.length) {
    console.log('');
    console.log('These riders no longer bill on their deploy-date anniversary:');
    for (const d of drifted) {
      console.log(
        `   ${pad(d.r.name, 22)} ${pad(d.r.vehicleNumber, 12)} shifted by ${d.driftDays} day(s)`,
      );
    }
  }

  console.log('');
  console.log(`Weeks used but never billed:  ${unbilledWeeks}`);
  console.log(`Approx. value of that gap:    ${money(unbilledValue)}`);
  console.log('');
  console.log('Note: "Gap" counts weeks the bike was out against weeks billed. Some of it is');
  console.log('legitimate (riders in recovery, bikes returned mid-week). Treat it as the');
  console.log('shortlist to check by hand, not a final figure.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
