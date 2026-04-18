const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const { protect } = require('../middleware/authMiddleware');

// All invoice routes are protected
router.use(protect);

router.post('/', invoiceController.addInvoice);
router.get('/', invoiceController.getInvoices);
router.delete('/:id', invoiceController.deleteInvoice);

module.exports = router;
