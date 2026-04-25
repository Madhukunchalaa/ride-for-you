const express = require('express');
const router = express.Router();
const landingController = require('../controllers/landingController');
const { protect } = require('../middleware/authMiddleware');

// Public route for landing page
router.get('/plans', landingController.getPlans);

// Protected routes for admin
router.post('/plans', protect, landingController.createPlan);
router.put('/plans/:id', protect, landingController.updatePlan);
router.delete('/plans/:id', protect, landingController.deletePlan);

module.exports = router;
