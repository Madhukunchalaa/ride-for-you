const express = require('express');
const router = express.Router();
const riderController = require('../controllers/riderController');
const { protect } = require('../middleware/authMiddleware');

// All rider routes are protected (Admin only)
router.use(protect);

router.post('/', riderController.addRider);
router.get('/', riderController.getRiders);
router.get('/:id/details', riderController.getRiderDetails);
router.post('/:id/send-reminder', riderController.sendReminder);
router.post('/:id/complaints', riderController.addComplaint);
router.patch('/:id/status', riderController.updateStatus);
router.delete('/:id', riderController.deleteRider);

module.exports = router;
