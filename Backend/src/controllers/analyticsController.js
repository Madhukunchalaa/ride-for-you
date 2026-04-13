const Rider = require('../models/Rider');
const Invoice = require('../models/Invoice');

// @GET /api/analytics/dashboard
exports.getDashboardStats = async (req, res) => {
  try {
    // 1. Basic Counts
    const totalRiders = await Rider.countDocuments();
    const activeRiders = await Rider.countDocuments({ riderStatus: 'active' });
    
    // 2. Revenue (Sum of actualRent from all invoices)
    const revenueAgg = await Invoice.aggregate([
      { $group: { _id: null, total: { $sum: "$actualRent" } } }
    ]);
    const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].total : 0;

    // 3. 7-Day Rider Registration Trend
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const riderTrend = await Rider.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // 4. Recent Activity (Last 5 riders)
    const recentActivity = await Rider.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name vehicleNumber createdAt');

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalRiders,
          activeRiders,
          totalRevenue,
          pendingDues: 0 // Placeholder
        },
        riderTrend,
        recentActivity
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/analytics/billing
exports.getBillingStats = async (req, res) => {
  try {
    const { month } = req.query;
    const match = month ? { billingMonth: month } : {};

    const distribution = await Invoice.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$invoiceType",
          value: { $sum: "$actualRent" }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: distribution
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
