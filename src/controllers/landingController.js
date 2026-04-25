const LandingPlan = require('../models/LandingPlan');

// @GET /api/landing/plans
exports.getPlans = async (req, res) => {
  try {
    const plans = await LandingPlan.find().sort({ order: 1 });
    res.status(200).json({ success: true, data: plans });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/landing/plans
exports.createPlan = async (req, res) => {
  try {
    const plan = await LandingPlan.create(req.body);
    res.status(201).json({ success: true, data: plan });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @PUT /api/landing/plans/:id
exports.updatePlan = async (req, res) => {
  try {
    const plan = await LandingPlan.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
    res.status(200).json({ success: true, data: plan });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @DELETE /api/landing/plans/:id
exports.deletePlan = async (req, res) => {
  try {
    const plan = await LandingPlan.findByIdAndDelete(req.params.id);
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
    res.status(200).json({ success: true, message: 'Plan removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
