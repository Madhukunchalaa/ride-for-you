const express = require('express');
const router = express.Router();
const riderController = require('../controllers/riderController');
const { protect } = require('../middleware/authMiddleware');

// All rider routes are protected (Admin only)
router.use(protect);

router.post('/', riderController.addRider);
router.get('/', riderController.getRiders);
router.post('/:id/send-reminder', riderController.sendReminder);

module.exports = router;
