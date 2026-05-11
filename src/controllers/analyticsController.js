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
    const { timeframe = 'weekly', date, startDate: queryStart, endDate: queryEnd } = req.query;

    let isSpecificDate = false;
    let isRangeQuery = false;
    let startDate = new Date();
    let endDate = new Date();

    if (queryStart && queryEnd) {
      isSpecificDate = true;
      isRangeQuery = true;
      startDate = new Date(queryStart);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(queryEnd);
      endDate.setHours(23, 59, 59, 999);
    } else if (date) {
      isSpecificDate = true;
      startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
    } else {
      if (timeframe === 'monthly') {
        startDate.setDate(startDate.getDate() - 30);
      } else if (timeframe === 'yearly') {
        startDate.setDate(startDate.getDate() - 365);
      } else {
        // Default to weekly (7 days)
        startDate.setDate(startDate.getDate() - 7);
      }
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    }

    // 1. Basic Counts
    let activeRiders;
    if (isSpecificDate) {
      activeRiders = await Rider.countDocuments({
        deployDate: { $lte: endDate },
        $or: [
          { riderStatus: { $ne: 'returned' } },
          { returnDate: { $gt: startDate } }
        ]
      });
    } else {
      activeRiders = await Rider.countDocuments({ riderStatus: 'active' });
    }
    
    // 2. Financial Calculations based on Timeframe or Specific Date
    const revenueMatch = isSpecificDate
      ? { riderId: { $ne: null }, createdAt: { $gte: startDate, $lte: endDate } }
      : { riderId: { $ne: null }, createdAt: { $gte: startDate } };

    const revenueStats = await Invoice.aggregate([
      { $match: revenueMatch },
      { $group: { _id: null, total: { $sum: "$billAmount" } } }
    ]);
    const totalRevenue = revenueStats[0]?.total || 0;

    const expenseMatch = isSpecificDate
      ? { riderId: { $eq: null }, createdAt: { $gte: startDate, $lte: endDate } }
      : { riderId: { $eq: null }, createdAt: { $gte: startDate } };

    const expenseStats = await Invoice.aggregate([
      { $match: expenseMatch },
      { $group: { _id: null, total: { $sum: "$actualRent" } } }
    ]);
    const totalHalaExpenses = expenseStats[0]?.total || 0;
    const adminProfit = totalRevenue - totalHalaExpenses;

    // Pending Dues (Outstanding calculation as of the end date)
    const activeRidersList = isSpecificDate
      ? await Rider.find({
          deployDate: { $lte: endDate },
          $or: [
            { riderStatus: { $ne: 'returned' } },
            { returnDate: { $gt: startDate } }
          ]
        })
      : await Rider.find({ riderStatus: 'active' });

    const globalWeeklyRate = await getWeeklyRate();
    const referenceEnd = isSpecificDate ? endDate : new Date();

    const pendingDues = activeRidersList.reduce((acc, rider) => {
      const deployDate = rider.deployDate;
      const calculatedWeeks = (deployDate && rider.returnDate)
        ? Math.max(0, Math.round((new Date(rider.returnDate) - new Date(deployDate)) / (1000 * 60 * 60 * 24 * 7)))
        : 0;
      const paidWeeks = typeof rider.totalWeeks === 'number' ? Math.max(rider.totalWeeks, calculatedWeeks) : calculatedWeeks;
      const rate = rider.rentalRate || globalWeeklyRate;

      if (!deployDate) {
        return acc + (rider.paymentStatus === 'unpaid' ? rate : 0);
      }

      const end = (rider.riderStatus === 'returned' && rider.returnDate && new Date(rider.returnDate) < referenceEnd) 
        ? new Date(rider.returnDate) 
        : referenceEnd;
      
      if (new Date(deployDate) > referenceEnd) return acc;

      const diffTime = Math.abs(end - new Date(deployDate));
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      const currentWeek = Math.max(1, Math.floor(diffDays / 7) + 1);
      const unpaidWeeks = Math.max(0, currentWeek - paidWeeks);

      return acc + (unpaidWeeks * rate);
    }, 0);

    // Total Security Deposits
    const sdMatch = isSpecificDate
      ? { 
          deployDate: { $lte: endDate },
          $or: [
            { riderStatus: { $ne: 'returned' } },
            { returnDate: { $gt: startDate } }
          ]
        }
      : { riderStatus: 'active' };

    const sdStats = await Rider.aggregate([
      { $match: sdMatch },
      { $group: { _id: null, total: { $sum: "$securityDeposit" } } }
    ]);
    const totalSD = sdStats[0]?.total || 0;

    // 3. Trends (Let's show 7-day preceding trend for context, or matching startDate)
    const trendStartDate = new Date(startDate);
    if (isSpecificDate && !isRangeQuery) {
      trendStartDate.setDate(trendStartDate.getDate() - 6);
      trendStartDate.setHours(0, 0, 0, 0);
    }

    const trendEnd = endDate;

    // Rider Growth Trend
    const riderTrend = await Rider.aggregate([
      { $match: { createdAt: { $gte: trendStartDate, $lte: trendEnd } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // Revenue Trend
    const revenueTrend = await Invoice.aggregate([
      { 
        $match: { 
          createdAt: { $gte: trendStartDate, $lte: trendEnd },
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

    // 4. Recent Activity
    const recentRiders = await Rider.find({ createdAt: { $lte: endDate } })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name vehicleNumber createdAt');
    
    const recentExtensions = await Invoice.find({ 
      riderId: { $ne: null },
      createdAt: { $lte: endDate }
    })
      .sort({ createdAt: -1 })
      .limit(5);

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
    const { range = 'monthly', startDate, endDate } = req.query; // 'weekly', 'monthly', 'daily'
    
    let matchStage = {};
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) {
        const s = new Date(startDate);
        s.setHours(0, 0, 0, 0);
        matchStage.createdAt.$gte = s;
      }
      if (endDate) {
        const e = new Date(endDate);
        e.setHours(23, 59, 59, 999);
        matchStage.createdAt.$lte = e;
      }
    }

    let format = "%Y-%m"; // Default monthly
    if (range === 'weekly') {
      format = "%Y-W%V"; // Weekly format
    } else if (range === 'daily') {
      format = "%Y-%m-%d"; // Daily format
    }

    const pipeline = [];
    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    pipeline.push(
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
      { $sort: { "period": -1 } }
    );

    if (!startDate && !endDate) {
      pipeline.push({ $limit: 12 }); // Last 12 periods if no date filter is active
    }

    const reports = await Invoice.aggregate(pipeline);

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
    const { date, startDate: queryStart, endDate: queryEnd } = req.query;

    let isSpecificDate = false;
    let startDate = new Date();
    let endDate = new Date();

    if (queryStart && queryEnd) {
      isSpecificDate = true;
      startDate = new Date(queryStart);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(queryEnd);
      endDate.setHours(23, 59, 59, 999);
    } else if (date) {
      isSpecificDate = true;
      startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
    }

    let activeRiders;
    if (isSpecificDate) {
      activeRiders = await Rider.find({
        deployDate: { $lte: endDate },
        $or: [
          { riderStatus: { $ne: 'returned' } },
          { returnDate: { $gt: startDate } }
        ]
      }).sort({ returnDate: 1 });
    } else {
      activeRiders = await Rider.find({ riderStatus: 'active' }).sort({ returnDate: 1 });
    }
    
    const globalWeeklyRate = await getWeeklyRate();
    const referenceEnd = isSpecificDate ? endDate : new Date();
    
    let totalCollected = 0;
    let pendingDues = 0;
    let successfulCount = 0;
    let upcomingTotal = 0;

    activeRiders.forEach(rider => {
      const rate = rider.rentalRate || globalWeeklyRate;
      upcomingTotal += rate;
      
      const deployDate = rider.deployDate;
      const calculatedWeeks = (deployDate && rider.returnDate)
        ? Math.max(0, Math.round((new Date(rider.returnDate) - new Date(deployDate)) / (1000 * 60 * 60 * 24 * 7)))
        : 0;
      const paidWeeks = typeof rider.totalWeeks === 'number' ? Math.max(rider.totalWeeks, calculatedWeeks) : calculatedWeeks;
      
      let unpaidWeeks = 0;
      let isOverdue = false;
      if (!deployDate) {
        unpaidWeeks = rider.paymentStatus === 'unpaid' ? 1 : 0;
        isOverdue = rider.paymentStatus === 'unpaid';
      } else {
        const end = (rider.riderStatus === 'returned' && rider.returnDate && new Date(rider.returnDate) < referenceEnd) 
          ? new Date(rider.returnDate) 
          : referenceEnd;
        
        if (new Date(deployDate) > referenceEnd) return; // Skip if deployed after our filter date

        const diffTime = Math.abs(end - new Date(deployDate));
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const currentWeek = Math.max(1, Math.floor(diffDays / 7) + 1);
        unpaidWeeks = Math.max(0, currentWeek - paidWeeks);
        isOverdue = unpaidWeeks > 0 && referenceEnd > new Date(rider.returnDate);
      }

      totalCollected += (paidWeeks * rate);
      pendingDues += (unpaidWeeks * rate);
      if (!isOverdue) {
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
