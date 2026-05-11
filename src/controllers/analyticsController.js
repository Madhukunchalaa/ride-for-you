const Rider = require('../models/Rider');
const Invoice = require('../models/Invoice');
const Expense = require('../models/Expense');
const SystemConfig = require('../models/SystemConfig');

// Helper to get global weekly rate
const getWeeklyRate = async () => {
  const config = await SystemConfig.findOne({ key: 'WEEKLY_RENTAL_AMOUNT' });
  return config ? Number(config.value) : 2000;
};

// @GET /api/analytics/dashboard
exports.getDashboardStats = async (req, res) => {
  try {
    // 1. Basic Counts
    const activeRiders = await Rider.countDocuments({ riderStatus: 'active' });
    
    // 2. Financial Calculations based on Timeframe
    const { timeframe = 'weekly' } = req.query;
    const startDate = new Date();
    
    if (timeframe === 'monthly') {
      startDate.setDate(startDate.getDate() - 30);
    } else if (timeframe === 'yearly') {
      startDate.setDate(startDate.getDate() - 365);
    } else {
      // Default to weekly (7 days)
      startDate.setDate(startDate.getDate() - 7);
    }
    startDate.setHours(0, 0, 0, 0);

    // Weekly Revenue = Collected from riders in last 7 days
    const revenueStats = await Invoice.aggregate([
      { 
        $match: { 
          riderId: { $ne: null },
          createdAt: { $gte: startDate }
        } 
      },
      { $group: { _id: null, total: { $sum: "$billAmount" } } }
    ]);
    const totalRevenue = revenueStats[0]?.total || 0;

    // Weekly Hala Expenses = Paid to Hala in last 7 days
    const expenseStats = await Invoice.aggregate([
      { 
        $match: { 
          riderId: { $eq: null },
          createdAt: { $gte: startDate }
        } 
      },
      { $group: { _id: null, total: { $sum: "$actualRent" } } }
    ]);
    const totalHalaExpenses = expenseStats[0]?.total || 0;
    const adminProfit = totalRevenue - totalHalaExpenses;

    // Pending Dues (This remains total outstanding as it's critical, but we can call it "Current Pending")
    const activeRidersList = await Rider.find({ riderStatus: 'active' });
    const globalWeeklyRate = await getWeeklyRate();
    const pendingDues = activeRidersList.reduce((acc, rider) => {
      const deployDate = rider.deployDate;
      const paidWeeks = rider.totalWeeks || 0;
      const rate = rider.rentalRate || globalWeeklyRate;

      if (!deployDate) {
        return acc + (rider.paymentStatus === 'unpaid' ? rate : 0);
      }

      const end = (rider.riderStatus === 'returned' && rider.returnDate) ? new Date(rider.returnDate) : new Date();
      const diffTime = Math.abs(end - new Date(deployDate));
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      const currentWeek = Math.max(1, Math.floor(diffDays / 7) + 1);
      const unpaidWeeks = Math.max(0, currentWeek - paidWeeks);

      return acc + (unpaidWeeks * rate);
    }, 0);

    // Total Security Deposits (Global total for all active riders)
    const sdStats = await Rider.aggregate([
      { $match: { riderStatus: 'active' } },
      { $group: { _id: null, total: { $sum: "$securityDeposit" } } }
    ]);
    const totalSD = sdStats[0]?.total || 0;

    // 3. 7-Day Trends
    // (sevenDaysAgo is already declared above)
    
    // Rider Growth Trend
    const riderTrend = await Rider.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
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
          createdAt: { $gte: startDate },
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

    // 4. Recent Activity (Unified: New Riders + Extensions)
    const recentRiders = await Rider.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name vehicleNumber createdAt');
    
    // Recent Payment Extensions (Invoices with riderId)
    const recentExtensions = await Invoice.find({ riderId: { $ne: null } })
      .sort({ createdAt: -1 })
      .limit(5);

    // Combine and sort by date
    const recentActivity = [
      ...recentRiders.map(r => ({ 
        type: 'ONBOARDING', 
        name: r.name, 
        vehicleNumber: r.vehicleNumber, 
        createdAt: r.createdAt 
      })),
      ...recentExtensions.map(i => ({ 
        type: 'EXTENSION', 
        name: i.riderName, 
        vehicleNumber: i.remarks?.match(/\w+-\d+-\w+-\d+|\w+-\d+/)?.[0] || 'Unit', 
        createdAt: i.createdAt 
      }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          adminProfit,
          activeRiders,
          totalRevenue,
          pendingDues,
          totalSD
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
    
    const globalWeeklyRate = await getWeeklyRate();
    
    let totalCollected = 0;
    let pendingDues = 0;
    let successfulCount = 0;
    let upcomingTotal = 0;

    activeRiders.forEach(rider => {
      const rate = rider.rentalRate || globalWeeklyRate;
      upcomingTotal += rate;
      
      const deployDate = rider.deployDate;
      const paidWeeks = rider.totalWeeks || 0;
      
      let unpaidWeeks = 0;
      if (!deployDate) {
        unpaidWeeks = rider.paymentStatus === 'unpaid' ? 1 : 0;
      } else {
        const end = (rider.riderStatus === 'returned' && rider.returnDate) ? new Date(rider.returnDate) : new Date();
        const diffTime = Math.abs(end - new Date(deployDate));
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const currentWeek = Math.max(1, Math.floor(diffDays / 7) + 1);
        unpaidWeeks = Math.max(0, currentWeek - paidWeeks);
      }

      totalCollected += (paidWeeks * rate);
      pendingDues += (unpaidWeeks * rate);
      if (unpaidWeeks === 0) {
        successfulCount++;
      }
    });

    const stats = {
      totalCollected,
      pendingDues,
      successfulCount,
      upcomingTotal,
      weeklyRate: globalWeeklyRate
    };

    res.status(200).json({
      success: true,
      data: { stats, riders: activeRiders }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/analytics/profit-loss
exports.getProfitLoss = async (req, res) => {
  try {
    const { month } = req.query; // e.g., "April 2026"
    if (!month) {
      return res.status(400).json({ success: false, message: 'Month is required' });
    }

    // 1. User Revenue (Total billAmount from Invoices with riderId)
    const revenueMatch = { billingMonth: month, riderId: { $ne: null } };
    const revenueStats = await Invoice.aggregate([
      { $match: revenueMatch },
      { $group: { _id: null, total: { $sum: "$billAmount" } } }
    ]);
    const userRevenue = revenueStats[0]?.total || 0;

    // 2. Hala Amount (Total actualRent from Invoices without riderId)
    const halaMatch = { billingMonth: month, riderId: null };
    const halaStats = await Invoice.aggregate([
      { $match: halaMatch },
      { $group: { _id: null, total: { $sum: "$actualRent" } } }
    ]);
    const halaAmount = halaStats[0]?.total || 0;

    // 3. Admin Spends (Total from Expense model for that month)
    const expenseStats = await Expense.aggregate([
      { $match: { month } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const adminSpends = expenseStats[0]?.total || 0;

    res.status(200).json({
      success: true,
      data: {
        userRevenue,
        halaAmount,
        adminSpends,
        netProfit: userRevenue - (halaAmount + adminSpends)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
