const Invoice = require('../models/Invoice');

// @POST /api/invoices
exports.addInvoice = async (req, res) => {
  try {
    const { billingMonth, invoiceType, invoiceNum, billAmount, actualRent, securityDeposit, remarks } = req.body;

    if (!billingMonth || !invoiceType || !invoiceNum) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const invoice = await Invoice.create({
      billingMonth,
      invoiceType,
      invoiceNum,
      billAmount,
      actualRent,
      securityDeposit,
      remarks
    });

    res.status(201).json({
      success: true,
      data: invoice
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/invoices
exports.getInvoices = async (req, res) => {
  try {
    const { month } = req.query;
    const filter = month ? { billingMonth: month } : {};
    
    const invoices = await Invoice.find(filter).sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: invoices.length,
      data: invoices
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @DELETE /api/invoices/:id
exports.deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }
    res.status(200).json({ success: true, message: 'Invoice removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
