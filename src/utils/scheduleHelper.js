/**
 * Stable weekly schedule: next due is always 7 days after previous due,
 * regardless of when payment actually happened.
 */
function calculateNextReturnDate(currentReturnDate) {
  const base = currentReturnDate ? new Date(currentReturnDate) : new Date();
  base.setUTCHours(0, 0, 0, 0);
  base.setUTCDate(base.getUTCDate() + 7);
  return base;
}

module.exports = { calculateNextReturnDate };
