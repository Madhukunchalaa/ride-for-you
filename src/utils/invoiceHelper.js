const Invoice = require('../models/Invoice');

/**
 * Automatically creates an invoice record for a successful payment
 */
const createInvoiceRecord = async (rider, amount, type = 'RENT', remarks = 'Weekly Rental Payment', extraData = {}) => {
  try {
    const today = new Date();
    const billingMonth = today.toLocaleString('default', { month: 'long', year: 'numeric' });
    const invoiceNum = `INV-${today.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newInvoice = await Invoice.create({
      billingMonth,
      riderId: rider._id,
      riderName: rider.name,
      invoiceType: type,
      invoiceNum,
      billAmount: amount,
      actualRent: amount,
      remarks,
      ...extraData
    });

    console.log(`📑 Invoice Created: ${invoiceNum} for ${rider.name}`);
    return newInvoice;
  } catch (err) {
    console.error('❌ Error creating invoice record:', err);
    throw err;
  }
};

module.exports = { createInvoiceRecord };
