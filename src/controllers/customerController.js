const Customer = require('../models/customer');

// @POST /api/customers
// @desc Add a new customer
exports.addCustomer = async (req, res) => {
    try {
        console.log('📝 Adding new customer:', req.body);
        const customer = await Customer.create(req.body);
        res.status(201).json({
            success: true,
            data: customer
        });
    } catch (err) {
        console.error('❌ Error adding customer:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
};

// @GET /api/customers
// @desc Get all customers
exports.getCustomers = async (req, res) => {
    try {
        console.log('🔍 Fetching all customers');
        const customers = await Customer.find().sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            count: customers.length,
            data: customers
        });
    } catch (err) {
        console.error('❌ Error fetching customers:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
};