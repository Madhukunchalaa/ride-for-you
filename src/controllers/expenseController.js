const Expense = require('../models/Expense');

// @POST /api/expenses
exports.addExpense = async (req, res) => {
  try {
    const { month, amount, category, remarks } = req.body;

    if (!month || !amount || !remarks) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const expense = await Expense.create({
      month,
      amount,
      category,
      remarks
    });

    res.status(201).json({
      success: true,
      data: expense
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/expenses
exports.getExpenses = async (req, res) => {
  try {
    const { month } = req.query;
    const filter = month ? { month } : {};
    
    const expenses = await Expense.find(filter).sort({ date: -1 });
    
    res.status(200).json({
      success: true,
      data: expenses
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @DELETE /api/expenses/:id
exports.deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }
    res.status(200).json({ success: true, message: 'Expense removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
