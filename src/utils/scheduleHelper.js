/**
 * Stable weekly schedule: next due is always 7 days after previous due,
 * regardless of when payment actually happened.
 */
function calculateNextReturnDate(currentReturnDate) {
  const base = currentReturnDate ? new Date(currentReturnDate) : new Date();
  base.setHours(0, 0, 0, 0);
  base.setDate(base.getDate() + 7);
  return base;
}

module.exports = { calculateNextReturnDate };
