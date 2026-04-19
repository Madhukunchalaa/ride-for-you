const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');

// Routes for /api/customers
router.post('/', customerController.addCustomer);
router.get('/', customerController.getCustomers);
router.patch('/:id', customerController.updateCustomer);

module.exports = router;