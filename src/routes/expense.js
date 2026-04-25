const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', expenseController.addExpense);
router.get('/', expenseController.getExpenses);
router.delete('/:id', expenseController.deleteExpense);

module.exports = router;
