const Rider = require('../models/Rider');
const Invoice = require('../models/Invoice');

// @GET /api/analytics/dashboard
exports.getDashboardStats = async (req, res) => {
  try {
    // 1. Basic Counts
    const activeRiders = await Rider.countDocuments({ riderStatus: 'active' });
    
    // 2. Financial Calculations (Revenue vs Hala)
    // Revenue = Total collected from riders (Invoices with riderId)
    const revenueStats = await Invoice.aggregate([
      { $match: { riderId: { $ne: null } } },
      { $group: { _id: null, total: { $sum: "$billAmount" } } }
    ]);
    const totalRevenue = revenueStats[0]?.total || 0;

    // Hala Expenses = Total paid to Hala (Invoices without riderId)
    const expenseStats = await Invoice.aggregate([
      { $match: { riderId: { $eq: null } } },
      { $group: { _id: null, total: { $sum: "$actualRent" } } }
    ]);
    const totalHalaExpenses = expenseStats[0]?.total || 0;
    const adminProfit = totalRevenue - totalHalaExpenses;

    // Pending Dues (based on unpaid active riders)
    const totalUnpaidRiders = await Rider.countDocuments({ 
      paymentStatus: 'unpaid', 
      riderStatus: 'active' 
    });
    const weeklyRate = 2000;
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

    // Revenue Trend (from Rider Invoices)
    const revenueTrend = await Invoice.aggregate([
      { 
        $match: { 
          createdAt: { $gte: sevenDaysAgo },
          riderId: { $ne: null }
        } 
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          amount: { $sum: "$billAmount" }
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
          adminProfit,
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

// @GET /api/analytics/reports
exports.getFinancialReports = async (req, res) => {
  try {
    const { range = 'monthly' } = req.query; // 'weekly' or 'monthly'
    
    let format = "%Y-%m"; // Default monthly
    if (range === 'weekly') {
      format = "%Y-W%V"; // Weekly format
    }

    const reports = await Invoice.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: format, date: "$createdAt" } },
          earnings: { 
            $sum: { $cond: [{ $ne: ["$riderId", null] }, "$billAmount", 0] } 
          },
          halaPayments: { 
            $sum: { $cond: [{ $eq: ["$riderId", null] }, "$actualRent", 0] } 
          }
        }
      },
      {
        $project: {
          period: "$_id",
          earnings: 1,
          halaPayments: 1,
          profit: { $subtract: ["$earnings", "$halaPayments"] }
        }
      },
      { $sort: { "period": -1 } },
      { $limit: 12 } // Last 12 periods
    ]);

    res.status(200).json({
      success: true,
      data: reports
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/analytics/billing
exports.getBillingStats = async (req, res) => {
  try {
    const { month } = req.query;
    const match = month ? { billingMonth: month, riderId: null } : { riderId: null };

    const distribution = await Invoice.aggregate([
      { $match: match },
      {
        $group: { _id: "$invoiceType", value: { $sum: "$actualRent" } }
      }
    ]);

    res.status(200).json({ success: true, data: distribution });
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
      data: { stats, riders: activeRiders }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
