const Rider = require('../models/Rider');
const Invoice = require('../models/Invoice');

// @GET /api/analytics/dashboard
exports.getDashboardStats = async (req, res) => {
  try {
    // 1. Basic Counts
    const totalRiders = await Rider.countDocuments();
    const activeRiders = await Rider.countDocuments({ riderStatus: 'active' });
    
    // 2. Payment Stats
    const totalPaidRiders = await Rider.countDocuments({ paymentStatus: 'paid' });
    const totalUnpaidRiders = await Rider.countDocuments({ paymentStatus: 'unpaid' });
    
    const weeklyRate = 2000;
    const totalRevenue = totalPaidRiders * weeklyRate;
    const pendingDues = totalUnpaidRiders * weeklyRate;

    // 3. 7-Day Trends
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    // Rider Growth Trend
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

    // Revenue Trend (from Invoices)
    const revenueTrend = await Invoice.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          amount: { $sum: "$actualRent" }
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
          pendingDues
        },
        riderTrend,
        revenueTrend,
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

// @GET /api/analytics/payments
exports.getPaymentAnalytics = async (req, res) => {
  try {
    const activeRiders = await Rider.find({ riderStatus: 'active' }).sort({ returnDate: 1 });
    
    const totalPaid = activeRiders.filter(r => r.paymentStatus === 'paid').length;
    const totalUnpaid = activeRiders.filter(r => r.paymentStatus === 'unpaid').length;
    
    const weeklyRate = 2000;
    const stats = {
      totalCollected: totalPaid * weeklyRate,
      pendingDues: totalUnpaid * weeklyRate,
      successfulCount: totalPaid,
      upcomingTotal: activeRiders.length * weeklyRate
    };

    res.status(200).json({
      success: true,
      data: {
        stats,
        riders: activeRiders
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
