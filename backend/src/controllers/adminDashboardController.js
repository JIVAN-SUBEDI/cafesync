// // src/controllers/adminDashboardController.js
// const db = require("../config/database");
// const logger = require("../utils/logger");
// const { validationResult } = require("express-validator");

// // Helper for safe JSON parsing
// const safeJsonParse = (value, defaultValue = {}) => {
//   try {
//     return typeof value === 'string' ? JSON.parse(value) : (value || defaultValue);
//   } catch {
//     return defaultValue;
//   }
// };

// // Helper to format currency
// const formatCurrency = (value) => {
//   return parseFloat(value || 0).toFixed(2);
// };

// // ======================
// // DASHBOARD STATS
// // ======================
// exports.getDashboardStats = async (req, res) => {
//   const requestId = req.headers["x-request-id"] || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
//   const start = Date.now();

//   try {
//     // Ensure admin is authenticated
//     if (!req.admin) {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized"
//       });
//     }

//     const adminId = req.admin.id;
//     const timeRange = req.query.range || '30d'; // 7d, 30d, 90d, 1y

//     // Calculate date range
//     const endDate = new Date();
//     const startDate = new Date();
    
//     switch(timeRange) {
//       case '7d':
//         startDate.setDate(startDate.getDate() - 7);
//         break;
//       case '30d':
//         startDate.setDate(startDate.getDate() - 30);
//         break;
//       case '90d':
//         startDate.setDate(startDate.getDate() - 90);
//         break;
//       case '1y':
//         startDate.setFullYear(startDate.getFullYear() - 1);
//         break;
//       default:
//         startDate.setDate(startDate.getDate() - 30);
//     }

//     // Format dates for SQL
//     const startDateStr = startDate.toISOString();
//     const endDateStr = endDate.toISOString();

//     // ===== 1. HOTEL STATISTICS =====
//     const hotelStats = await db.query(`
//       SELECT 
//         COUNT(*) as total_hotels,
//         COUNT(CASE WHEN is_active = true THEN 1 END) as active_hotels,
//         COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_hotels,
//         COUNT(CASE WHEN created_at >= $1 THEN 1 END) as new_hotels,
//         COALESCE(AVG(CASE WHEN is_active = true THEN 1 ELSE 0 END), 0) * 100 as active_percentage
//       FROM hotels
//     `, [startDateStr]);

//     // ===== 2. SUBSCRIPTION STATISTICS =====
//     const subscriptionStats = await db.query(`
//       SELECT 
//         COUNT(*) as total_subscriptions,
//         COUNT(CASE WHEN status = 'active' THEN 1 END) as active_subscriptions,
//         COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired_subscriptions,
//         COUNT(CASE WHEN status = 'trial' THEN 1 END) as trial_subscriptions,
//         COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_subscriptions,
//         COALESCE(SUM(CASE WHEN status = 'active' THEN amount ELSE 0 END), 0) as monthly_recurring_revenue,
//         COALESCE(AVG(CASE WHEN status = 'active' THEN amount ELSE 0 END), 0) as average_subscription_value
//       FROM subscriptions
//       WHERE created_at <= $1
//     `, [endDateStr]);

//     // ===== 3. REVENUE STATISTICS =====
//     const revenueStats = await db.query(`
//       SELECT 
//         COALESCE(SUM(amount), 0) as total_revenue,
//         COALESCE(SUM(CASE WHEN created_at >= $1 THEN amount ELSE 0 END), 0) as revenue_in_period,
//         COUNT(DISTINCT hotel_id) as paying_hotels,
//         COALESCE(AVG(amount), 0) as average_transaction_value,
//         COALESCE(SUM(CASE 
//           WHEN created_at >= DATE_TRUNC('month', CURRENT_DATE) 
//           THEN amount ELSE 0 
//         END), 0) as revenue_this_month
//       FROM transactions
//       WHERE status = 'completed'
//     `, [startDateStr]);

//     // ===== 4. USER STATISTICS =====
//     const userStats = await db.query(`
//       SELECT 
//         COUNT(DISTINCT s.id) as total_staff,
//         COUNT(DISTINCT h.id) as total_hotels_with_staff,
//         COALESCE(AVG(staff_count.staff_count), 0) as avg_staff_per_hotel,
//         COUNT(DISTINCT CASE WHEN s.last_login >= $1 THEN s.id END) as active_staff_30d
//       FROM staff s
//       RIGHT JOIN hotels h ON h.id = s.hotel_id
//       LEFT JOIN (
//         SELECT hotel_id, COUNT(*) as staff_count
//         FROM staff
//         GROUP BY hotel_id
//       ) staff_count ON staff_count.hotel_id = h.id
//       WHERE h.is_active = true
//     `, [startDateStr]);

//     // ===== 5. PLAN DISTRIBUTION =====
//     const planDistribution = await db.query(`
//       SELECT 
//         p.name as plan_name,
//         COUNT(s.id) as subscriber_count,
//         COALESCE(SUM(s.amount), 0) as revenue
//       FROM subscription_plans p
//       LEFT JOIN subscriptions s ON s.plan_id = p.id AND s.status = 'active'
//       GROUP BY p.id, p.name
//       ORDER BY subscriber_count DESC
//     `);

//     // ===== 6. RECENT HOTELS =====
//     const recentHotels = await db.query(`
//       SELECT 
//         h.id,
//         h.name,
//         h.email,
//         h.phone,
//         h.is_active,
//         h.created_at,
//         h.address_city,
//         h.address_country,
//         COALESCE(s.subscription_status, 'no_subscription') as subscription_status,
//         COALESCE(sp.name, 'No Plan') as plan_name
//       FROM hotels h
//       LEFT JOIN LATERAL (
//         SELECT status as subscription_status
//         FROM subscriptions
//         WHERE hotel_id = h.id
//         ORDER BY created_at DESC
//         LIMIT 1
//       ) s ON true
//       LEFT JOIN subscriptions sub ON sub.hotel_id = h.id AND sub.status = 'active'
//       LEFT JOIN subscription_plans sp ON sp.id = sub.plan_id
//       ORDER BY h.created_at DESC
//       LIMIT 10
//     `);

//     // ===== 7. RECENT TRANSACTIONS =====
//     const recentTransactions = await db.query(`
//       SELECT 
//         t.id,
//         t.amount,
//         t.status,
//         t.payment_method,
//         t.created_at,
//         h.name as hotel_name,
//         h.id as hotel_id,
//         sp.name as plan_name
//       FROM transactions t
//       JOIN hotels h ON h.id = t.hotel_id
//       LEFT JOIN subscriptions s ON s.id = t.subscription_id
//       LEFT JOIN subscription_plans sp ON sp.id = s.plan_id
//       WHERE t.status = 'completed'
//       ORDER BY t.created_at DESC
//       LIMIT 10
//     `);

//     // ===== 8. REVENUE CHART DATA (Last 30 days) =====
//     const revenueChart = await db.query(`
//       WITH days AS (
//         SELECT generate_series(
//           date_trunc('day', $1::timestamp),
//           date_trunc('day', $2::timestamp),
//           '1 day'::interval
//         ) as day
//       )
//       SELECT 
//         TO_CHAR(days.day, 'YYYY-MM-DD') as date,
//         COALESCE(SUM(t.amount), 0) as revenue,
//         COUNT(DISTINCT t.id) as transaction_count,
//         COUNT(DISTINCT t.hotel_id) as unique_hotels
//       FROM days
//       LEFT JOIN transactions t ON 
//         DATE(t.created_at) = DATE(days.day) 
//         AND t.status = 'completed'
//       GROUP BY days.day
//       ORDER BY days.day ASC
//     `, [startDateStr, endDateStr]);

//     // ===== 9. HOTEL GROWTH CHART =====
//     const hotelGrowth = await db.query(`
//       WITH months AS (
//         SELECT generate_series(
//           date_trunc('month', $1::timestamp),
//           date_trunc('month', $2::timestamp),
//           '1 month'::interval
//         ) as month
//       )
//       SELECT 
//         TO_CHAR(months.month, 'YYYY-MM') as month,
//         COUNT(DISTINCT h.id) as total_hotels,
//         COUNT(DISTINCT CASE WHEN DATE_TRUNC('month', h.created_at) = months.month THEN h.id END) as new_hotels,
//         COUNT(DISTINCT CASE WHEN s.status = 'active' THEN h.id END) as active_subscriptions
//       FROM months
//       CROSS JOIN hotels h
//       LEFT JOIN subscriptions s ON s.hotel_id = h.id AND s.status = 'active'
//       WHERE h.created_at <= months.month + interval '1 month'
//       GROUP BY months.month
//       ORDER BY months.month ASC
//     `, [startDateStr, endDateStr]);

//     // ===== 10. TOP PERFORMING HOTELS =====
//     const topHotels = await db.query(`
//       SELECT 
//         h.id,
//         h.name,
//         h.email,
//         h.is_active,
//         COUNT(DISTINCT s.id) as staff_count,
//         COUNT(DISTINCT r.id) as room_count,
//         COALESCE(SUM(t.amount), 0) as total_revenue,
//         sp.name as plan_name
//       FROM hotels h
//       LEFT JOIN staff s ON s.hotel_id = h.id
//       LEFT JOIN rooms r ON r.hotel_id = h.id
//       LEFT JOIN transactions t ON t.hotel_id = h.id AND t.status = 'completed'
//       LEFT JOIN subscriptions sub ON sub.hotel_id = h.id AND sub.status = 'active'
//       LEFT JOIN subscription_plans sp ON sp.id = sub.plan_id
//       GROUP BY h.id, h.name, h.email, h.is_active, sp.name
//       ORDER BY total_revenue DESC
//       LIMIT 5
//     `);

//     // ===== 11. SYSTEM HEALTH =====
//     const systemHealth = await db.query(`
//       SELECT 
//         (SELECT COUNT(*) FROM hotels WHERE created_at > NOW() - INTERVAL '24 hours') as hotels_last_24h,
//         (SELECT COUNT(*) FROM transactions WHERE created_at > NOW() - INTERVAL '24 hours') as transactions_last_24h,
//         (SELECT COUNT(*) FROM failed_jobs WHERE created_at > NOW() - INTERVAL '24 hours') as failed_jobs_24h,
//         (SELECT COUNT(*) FROM activity_logs WHERE created_at > NOW() - INTERVAL '1 hour') as activity_last_hour
//     `);

//     // ===== 12. RECENT ACTIVITY =====
//     const recentActivity = await db.query(`
//       SELECT 
//         al.id,
//         al.action,
//         al.resource_type,
//         al.details,
//         al.ip_address,
//         al.created_at,
//         COALESCE(
//           (SELECT name FROM hotels WHERE id::text = al.resource_id AND al.resource_type = 'hotel'),
//           (SELECT full_name FROM staff WHERE id::text = al.resource_id AND al.resource_type = 'staff'),
//           (SELECT email FROM main_admins WHERE id::text = al.resource_id AND al.resource_type = 'admin'),
//           'System'
//         ) as resource_name
//       FROM activity_logs al
//       WHERE al.user_type = 'main_admin' OR al.resource_type IN ('hotel', 'subscription', 'transaction')
//       ORDER BY al.created_at DESC
//       LIMIT 20
//     `);

//     // Calculate key metrics
//     const totalHotels = parseInt(hotelStats.rows[0]?.total_hotels) || 0;
//     const activeHotels = parseInt(hotelStats.rows[0]?.active_hotels) || 0;
//     const totalRevenue = parseFloat(revenueStats.rows[0]?.total_revenue) || 0;
//     const mrr = parseFloat(subscriptionStats.rows[0]?.monthly_recurring_revenue) || 0;
//     const avgStaffPerHotel = parseFloat(userStats.rows[0]?.avg_staff_per_hotel) || 0;

//     // Calculate growth percentages
//     const previousPeriodRevenue = await db.query(`
//       SELECT COALESCE(SUM(amount), 0) as revenue
//       FROM transactions
//       WHERE status = 'completed'
//         AND created_at >= $1
//         AND created_at < $2
//     `, [
//       new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime())).toISOString(),
//       startDateStr
//     ]);

//     const revenueGrowth = previousPeriodRevenue.rows[0]?.revenue > 0 
//       ? ((totalRevenue - previousPeriodRevenue.rows[0].revenue) / previousPeriodRevenue.rows[0].revenue) * 100 
//       : 0;

//     // Prepare response
//     const dashboardData = {
//       success: true,
//       data: {
//         // Summary Cards
//         summary: {
//           totalHotels,
//           activeHotels,
//           inactiveHotels: parseInt(hotelStats.rows[0]?.inactive_hotels) || 0,
//           newHotels: parseInt(hotelStats.rows[0]?.new_hotels) || 0,
//           activePercentage: parseFloat(hotelStats.rows[0]?.active_percentage) || 0,
          
//           totalRevenue: formatCurrency(totalRevenue),
//           revenueInPeriod: formatCurrency(revenueStats.rows[0]?.revenue_in_period || 0),
//           revenueThisMonth: formatCurrency(revenueStats.rows[0]?.revenue_this_month || 0),
//           revenueGrowth: parseFloat(revenueGrowth.toFixed(2)),
          
//           mrr: formatCurrency(mrr),
//           averageSubscriptionValue: formatCurrency(subscriptionStats.rows[0]?.average_subscription_value || 0),
//           payingHotels: parseInt(revenueStats.rows[0]?.paying_hotels) || 0,
          
//           totalStaff: parseInt(userStats.rows[0]?.total_staff) || 0,
//           avgStaffPerHotel: parseFloat(avgStaffPerHotel.toFixed(1)),
//           activeStaff30d: parseInt(userStats.rows[0]?.active_staff_30d) || 0,
//         },

//         // Subscription Stats
//         subscriptions: {
//           total: parseInt(subscriptionStats.rows[0]?.total_subscriptions) || 0,
//           active: parseInt(subscriptionStats.rows[0]?.active_subscriptions) || 0,
//           expired: parseInt(subscriptionStats.rows[0]?.expired_subscriptions) || 0,
//           trial: parseInt(subscriptionStats.rows[0]?.trial_subscriptions) || 0,
//           cancelled: parseInt(subscriptionStats.rows[0]?.cancelled_subscriptions) || 0,
//           planDistribution: planDistribution.rows.map(row => ({
//             name: row.plan_name,
//             count: parseInt(row.subscriber_count) || 0,
//             revenue: formatCurrency(row.revenue || 0)
//           }))
//         },

//         // Charts Data
//         charts: {
//           revenue: revenueChart.rows.map(row => ({
//             date: row.date,
//             revenue: formatCurrency(row.revenue),
//             transactions: parseInt(row.transaction_count) || 0,
//             uniqueHotels: parseInt(row.unique_hotels) || 0
//           })),
//           hotelGrowth: hotelGrowth.rows.map(row => ({
//             month: row.month,
//             totalHotels: parseInt(row.total_hotels) || 0,
//             newHotels: parseInt(row.new_hotels) || 0,
//             activeSubscriptions: parseInt(row.active_subscriptions) || 0
//           }))
//         },

//         // Tables
//         recentHotels: recentHotels.rows.map(row => ({
//           id: row.id,
//           name: row.name,
//           email: row.email,
//           phone: row.phone,
//           isActive: row.is_active,
//           city: row.address_city,
//           country: row.address_country,
//           subscriptionStatus: row.subscription_status,
//           planName: row.plan_name,
//           createdAt: row.created_at
//         })),

//         recentTransactions: recentTransactions.rows.map(row => ({
//           id: row.id,
//           amount: formatCurrency(row.amount),
//           status: row.status,
//           paymentMethod: row.payment_method,
//           hotelName: row.hotel_name,
//           hotelId: row.hotel_id,
//           planName: row.plan_name,
//           createdAt: row.created_at
//         })),

//         topHotels: topHotels.rows.map(row => ({
//           id: row.id,
//           name: row.name,
//           email: row.email,
//           isActive: row.is_active,
//           staffCount: parseInt(row.staff_count) || 0,
//           roomCount: parseInt(row.room_count) || 0,
//           totalRevenue: formatCurrency(row.total_revenue),
//           planName: row.plan_name
//         })),

//         // System Health
//         systemHealth: {
//           hotelsLast24h: parseInt(systemHealth.rows[0]?.hotels_last_24h) || 0,
//           transactionsLast24h: parseInt(systemHealth.rows[0]?.transactions_last_24h) || 0,
//           failedJobs24h: parseInt(systemHealth.rows[0]?.failed_jobs_24h) || 0,
//           activityLastHour: parseInt(systemHealth.rows[0]?.activity_last_hour) || 0
//         },

//         // Recent Activity
//         recentActivity: recentActivity.rows.map(row => ({
//           id: row.id,
//           action: row.action,
//           resourceType: row.resource_type,
//           resourceName: row.resource_name,
//           details: safeJsonParse(row.details),
//           ipAddress: row.ip_address,
//           createdAt: row.created_at
//         })),

//         // Metadata
//         metadata: {
//           timeRange,
//           startDate: startDateStr,
//           endDate: endDateStr,
//           generatedAt: new Date().toISOString(),
//           adminId
//         }
//       }
//     };

//     // Log the dashboard access
//     logger.info("ADMIN_DASHBOARD_ACCESS", {
//       requestId,
//       adminId,
//       timeRange,
//       responseTime: Date.now() - start
//     });

//     return res.json(dashboardData);

//   } catch (error) {
//     logger.error("ADMIN_DASHBOARD_ERROR", {
//       requestId,
//       error: error.message,
//       stack: error.stack,
//       responseTime: Date.now() - start
//     });

//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch dashboard data",
//       error: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// };

// // ======================
// // EXPORT DASHBOARD DATA (CSV)
// // ======================
// exports.exportDashboardData = async (req, res) => {
//   try {
//     if (!req.admin) {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized"
//       });
//     }

//     const { type = 'hotels' } = req.query; // hotels, transactions, subscriptions

//     let data;
//     let filename;
//     let headers;

//     switch(type) {
//       case 'hotels':
//         const hotels = await db.query(`
//           SELECT 
//             h.id, h.name, h.email, h.phone, h.is_active,
//             h.address_line1, h.address_city, h.address_country,
//             h.created_at,
//             COALESCE(sp.name, 'No Plan') as plan_name,
//             s.status as subscription_status
//           FROM hotels h
//           LEFT JOIN subscriptions s ON s.hotel_id = h.id AND s.status = 'active'
//           LEFT JOIN subscription_plans sp ON sp.id = s.plan_id
//           ORDER BY h.created_at DESC
//         `);
//         data = hotels.rows;
//         filename = `hotels_export_${new Date().toISOString().split('T')[0]}.csv`;
//         headers = ['ID', 'Name', 'Email', 'Phone', 'Active', 'Address', 'City', 'Country', 'Created', 'Plan', 'Subscription Status'];
//         break;

//       case 'transactions':
//         const transactions = await db.query(`
//           SELECT 
//             t.id, t.amount, t.status, t.payment_method,
//             t.created_at, h.name as hotel_name,
//             sp.name as plan_name
//           FROM transactions t
//           JOIN hotels h ON h.id = t.hotel_id
//           LEFT JOIN subscriptions s ON s.id = t.subscription_id
//           LEFT JOIN subscription_plans sp ON sp.id = s.plan_id
//           WHERE t.status = 'completed'
//           ORDER BY t.created_at DESC
//         `);
//         data = transactions.rows;
//         filename = `transactions_export_${new Date().toISOString().split('T')[0]}.csv`;
//         headers = ['ID', 'Hotel', 'Amount', 'Status', 'Payment Method', 'Plan', 'Date'];
//         break;

//       default:
//         return res.status(400).json({
//           success: false,
//           message: "Invalid export type"
//         });
//     }

//     // Convert to CSV
//     const csvRows = [];
//     csvRows.push(headers.join(','));
    
//     for (const row of data) {
//       const values = headers.map(header => {
//         const key = header.toLowerCase().replace(/ /g, '_');
//         const value = row[key] || '';
//         return `"${String(value).replace(/"/g, '""')}"`;
//       });
//       csvRows.push(values.join(','));
//     }

//     res.setHeader('Content-Type', 'text/csv');
//     res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
//     res.send(csvRows.join('\n'));

//   } catch (error) {
//     logger.error("ADMIN_EXPORT_ERROR", { error: error.message });
//     return res.status(500).json({
//       success: false,
//       message: "Failed to export data"
//     });
//   }
// };




// // src/controllers/adminDashboardController.js
// const db = require("../config/database");
// const logger = require("../utils/logger");

// // Helper for safe JSON parsing
// const safeJsonParse = (value, defaultValue = {}) => {
//   try {
//     return typeof value === 'string' ? JSON.parse(value) : (value || defaultValue);
//   } catch {
//     return defaultValue;
//   }
// };

// // Helper to format currency
// const formatCurrency = (value) => {
//   return parseFloat(value || 0).toFixed(2);
// };

// // ======================
// // DASHBOARD STATS
// // ======================
// exports.getDashboardStats = async (req, res) => {
//   const requestId = req.headers["x-request-id"] || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
//   const start = Date.now();

//   try {
//     // Ensure admin is authenticated
//     if (!req.admin) {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized"
//       });
//     }

//     const adminId = req.admin.id;
//     const timeRange = req.query.range || '30d'; // 7d, 30d, 90d, 1y

//     // Calculate date range
//     const endDate = new Date();
//     const startDate = new Date();
    
//     switch(timeRange) {
//       case '7d':
//         startDate.setDate(startDate.getDate() - 7);
//         break;
//       case '30d':
//         startDate.setDate(startDate.getDate() - 30);
//         break;
//       case '90d':
//         startDate.setDate(startDate.getDate() - 90);
//         break;
//       case '1y':
//         startDate.setFullYear(startDate.getFullYear() - 1);
//         break;
//       default:
//         startDate.setDate(startDate.getDate() - 30);
//     }

//     const startDateStr = startDate.toISOString();
//     const endDateStr = endDate.toISOString();

//     // ===== 1. HOTEL STATISTICS =====
//     const hotelStats = await db.query(`
//       SELECT 
//         COUNT(*) as total_hotels,
//         COUNT(CASE WHEN is_active = true THEN 1 END) as active_hotels,
//         COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_hotels,
//         COUNT(CASE WHEN created_at >= $1 THEN 1 END) as new_hotels,
//         COALESCE(ROUND(COUNT(CASE WHEN is_active = true THEN 1 END)::DECIMAL / NULLIF(COUNT(*), 0) * 100, 2), 0) as active_percentage
//       FROM hotels
//     `, [startDateStr]);

//     // ===== 2. SUBSCRIPTION STATISTICS (using subscription_plans and hotels) =====
//     const subscriptionStats = await db.query(`
//       SELECT 
//         COUNT(CASE WHEN subscription_status = 'trial' THEN 1 END) as trial_subscriptions,
//         COUNT(CASE WHEN subscription_status = 'active' THEN 1 END) as active_subscriptions,
//         COUNT(CASE WHEN subscription_status = 'suspended' THEN 1 END) as suspended_subscriptions,
//         COUNT(CASE WHEN subscription_status = 'cancelled' THEN 1 END) as cancelled_subscriptions,
//         COUNT(*) as total_subscriptions,
//         COALESCE(AVG(sp.price_per_year), 0) as average_subscription_value
//       FROM hotels h
//       LEFT JOIN subscription_plans sp ON sp.id = h.subscription_plan_id
//     `);

//     // ===== 3. REVENUE STATISTICS from orders =====
//     const revenueStats = await db.query(`
//       SELECT 
//         COALESCE(SUM(total_amount), 0) as total_revenue,
//         COALESCE(SUM(CASE WHEN created_at >= $1 THEN total_amount ELSE 0 END), 0) as revenue_in_period,
//         COUNT(DISTINCT hotel_id) as paying_hotels,
//         COALESCE(AVG(total_amount), 0) as average_order_value,
//         COALESCE(SUM(CASE 
//           WHEN created_at >= DATE_TRUNC('month', CURRENT_DATE) 
//           THEN total_amount ELSE 0 
//         END), 0) as revenue_this_month
//       FROM orders
//       WHERE status = 'completed'
//     `, [startDateStr]);

//     // ===== 4. STAFF STATISTICS =====
//     const staffStats = await db.query(`
//       SELECT 
//         COUNT(*) as total_staff,
//         COUNT(CASE WHEN is_active = true THEN 1 END) as active_staff,
//         COUNT(CASE WHEN last_login >= $1 THEN 1 END) as active_staff_30d,
//         COUNT(DISTINCT hotel_id) as hotels_with_staff
//       FROM staff
//     `, [startDateStr]);

//     // ===== 5. PLAN DISTRIBUTION =====
//     const planDistribution = await db.query(`
//       SELECT 
//         COALESCE(sp.plan_name, 'No Plan') as plan_name,
//         COUNT(h.id) as hotel_count,
//         COALESCE(SUM(sp.price_per_year), 0) as monthly_revenue
//       FROM hotels h
//       LEFT JOIN subscription_plans sp ON sp.id = h.subscription_plan_id
//       GROUP BY sp.id, sp.plan_name
//       ORDER BY hotel_count DESC
//     `);

//     // ===== 6. RECENT HOTELS =====
//     const recentHotels = await db.query(`
//       SELECT 
//         h.id,
//         h.hotel_name as name,
//         h.admin_email as email,
//         h.hotel_phone as phone,
//         h.is_active,
//         h.created_at,
//         h.city,
//         h.country,
//         h.subscription_status,
//         COALESCE(sp.plan_name, 'No Plan') as plan_name
//       FROM hotels h
//       LEFT JOIN subscription_plans sp ON sp.id = h.subscription_plan_id
//       ORDER BY h.created_at DESC
//       LIMIT 10
//     `);

//     // ===== 7. RECENT ORDERS =====
//     const recentOrders = await db.query(`
//       SELECT 
//         o.id,
//         o.total_amount as amount,
//         o.status,
//         o.payment_method,
//         o.created_at,
//         o.order_number,
//         h.hotel_name,
//         h.id as hotel_id,
//         s.full_name as waiter_name
//       FROM orders o
//       JOIN hotels h ON h.id = o.hotel_id
//       LEFT JOIN staff s ON s.id = o.waiter_id
//       ORDER BY o.created_at DESC
//       LIMIT 10
//     `);

//     // ===== 8. REVENUE CHART DATA (Last 30 days) =====
//     const revenueChart = await db.query(`
//       WITH days AS (
//         SELECT generate_series(
//           date_trunc('day', $1::timestamp),
//           date_trunc('day', $2::timestamp),
//           '1 day'::interval
//         ) as day
//       )
//       SELECT 
//         TO_CHAR(days.day, 'YYYY-MM-DD') as date,
//         COALESCE(SUM(o.total_amount), 0) as revenue,
//         COUNT(DISTINCT o.id) as order_count,
//         COUNT(DISTINCT o.hotel_id) as unique_hotels
//       FROM days
//       LEFT JOIN orders o ON 
//         DATE(o.created_at) = DATE(days.day) 
//         AND o.status = 'completed'
//       GROUP BY days.day
//       ORDER BY days.day ASC
//     `, [startDateStr, endDateStr]);

//     // ===== 9. HOTEL GROWTH CHART =====
//     const hotelGrowth = await db.query(`
//       WITH months AS (
//         SELECT generate_series(
//           date_trunc('month', $1::timestamp),
//           date_trunc('month', $2::timestamp),
//           '1 month'::interval
//         ) as month
//       )
//       SELECT 
//         TO_CHAR(months.month, 'YYYY-MM') as month,
//         COUNT(DISTINCT h.id) as total_hotels,
//         COUNT(DISTINCT CASE WHEN DATE_TRUNC('month', h.created_at) = months.month THEN h.id END) as new_hotels,
//         COUNT(DISTINCT CASE WHEN h.subscription_status = 'active' THEN h.id END) as active_subscriptions
//       FROM months
//       CROSS JOIN hotels h
//       WHERE h.created_at <= months.month + interval '1 month'
//       GROUP BY months.month
//       ORDER BY months.month ASC
//     `, [startDateStr, endDateStr]);

//     // ===== 10. TOP PERFORMING HOTELS =====
//     const topHotels = await db.query(`
//       SELECT 
//         h.id,
//         h.hotel_name as name,
//         h.admin_email as email,
//         h.is_active,
//         COUNT(DISTINCT s.id) as staff_count,
//         COUNT(DISTINCT t.id) as table_count,
//         COALESCE(SUM(o.total_amount), 0) as total_revenue,
//         COALESCE(sp.plan_name, 'No Plan') as plan_name
//       FROM hotels h
//       LEFT JOIN staff s ON s.hotel_id = h.id
//       LEFT JOIN hotel_tables t ON t.hotel_id = h.id
//       LEFT JOIN orders o ON o.hotel_id = h.id AND o.status = 'completed'
//       LEFT JOIN subscription_plans sp ON sp.id = h.subscription_plan_id
//       GROUP BY h.id, h.hotel_name, h.admin_email, h.is_active, sp.plan_name
//       ORDER BY total_revenue DESC
//       LIMIT 5
//     `);

//     // ===== 11. SYSTEM HEALTH =====
//     const systemHealth = await db.query(`
//       SELECT 
//         (SELECT COUNT(*) FROM hotels WHERE created_at > NOW() - INTERVAL '24 hours') as hotels_last_24h,
//         (SELECT COUNT(*) FROM staff WHERE created_at > NOW() - INTERVAL '24 hours') as staff_last_24h,
//         (SELECT COUNT(*) FROM orders WHERE created_at > NOW() - INTERVAL '24 hours') as orders_last_24h,
//         (SELECT COUNT(*) FROM activity_logs WHERE created_at > NOW() - INTERVAL '1 hour') as activity_last_hour
//     `);

//     // ===== 12. RECENT ACTIVITY =====
//     const recentActivity = await db.query(`
//       SELECT 
//         al.id,
//         al.action,
//         al.resource_type,
//         al.resource_id,
//         al.details,
//         al.ip_address,
//         al.user_agent,
//         al.created_at,
//         al.user_type,
//         al.user_id,
//         CASE 
//           WHEN al.resource_type = 'hotel' THEN (SELECT hotel_name FROM hotels WHERE id = al.resource_id::UUID)
//           WHEN al.resource_type = 'staff' THEN (SELECT full_name FROM staff WHERE id = al.resource_id::UUID)
//           ELSE NULL
//         END as resource_name
//       FROM activity_logs al
//       WHERE al.user_type = 'main_admin' OR al.resource_type IN ('hotel', 'subscription', 'order')
//       ORDER BY al.created_at DESC
//       LIMIT 20
//     `);

//     // ===== 13. MENU STATISTICS =====
//     const menuStats = await db.query(`
//       SELECT 
//         COUNT(DISTINCT mi.id) as total_menu_items,
//         COUNT(DISTINCT mc.id) as total_categories,
//         COUNT(DISTINCT CASE WHEN mi.is_available = true THEN mi.id END) as available_items
//       FROM menu_items mi
//       LEFT JOIN menu_categories mc ON mc.id = mi.category_id
//     `);

//     // ===== 14. TABLE STATISTICS =====
//     const tableStats = await db.query(`
//       SELECT 
//         COUNT(*) as total_tables,
//         COUNT(CASE WHEN status = 'available' THEN 1 END) as available_tables,
//         COUNT(CASE WHEN status = 'occupied' THEN 1 END) as occupied_tables,
//         COUNT(CASE WHEN status = 'reserved' THEN 1 END) as reserved_tables
//       FROM hotel_tables
//     `);

//     // ===== 15. INVENTORY STATISTICS (if inventory tables exist) =====
//     let inventoryStats = { rows: [{
//       total_items: 0,
//       low_stock_items: 0,
//       out_of_stock_items: 0,
//       total_value: 0
//     }] };

//     try {
//       inventoryStats = await db.query(`
//         SELECT 
//           COUNT(*) as total_items,
//           COUNT(CASE WHEN status = 'low_stock' THEN 1 END) as low_stock_items,
//           COUNT(CASE WHEN status = 'out_of_stock' THEN 1 END) as out_of_stock_items,
//           COALESCE(SUM(total_value), 0) as total_value
//         FROM inventory
//         WHERE is_active = true
//       `);
//     } catch (inventoryErr) {
//       logger.warn("Inventory tables might not exist", { error: inventoryErr.message });
//     }

//     // Calculate key metrics
//     const totalHotels = parseInt(hotelStats.rows[0]?.total_hotels) || 0;
//     const activeHotels = parseInt(hotelStats.rows[0]?.active_hotels) || 0;
//     const totalRevenue = parseFloat(revenueStats.rows[0]?.total_revenue) || 0;
//     const revenueInPeriod = parseFloat(revenueStats.rows[0]?.revenue_in_period) || 0;
//     const totalStaff = parseInt(staffStats.rows[0]?.total_staff) || 0;
//     const activeStaff = parseInt(staffStats.rows[0]?.active_staff) || 0;
//     const avgStaffPerHotel = totalHotels > 0 ? (totalStaff / totalHotels).toFixed(1) : 0;

//     // Calculate MRR (Monthly Recurring Revenue)
//     const mrr = planDistribution.rows.reduce((sum, plan) => {
//       return sum + (parseFloat(plan.monthly_revenue) || 0);
//     }, 0);

//     // Calculate growth percentages
//     const previousPeriodRevenue = await db.query(`
//       SELECT COALESCE(SUM(total_amount), 0) as revenue
//       FROM orders
//       WHERE status = 'completed'
//         AND created_at >= $1
//         AND created_at < $2
//     `, [
//       new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime())).toISOString(),
//       startDateStr
//     ]);

//     const revenueGrowth = previousPeriodRevenue.rows[0]?.revenue > 0 
//       ? ((revenueInPeriod - previousPeriodRevenue.rows[0].revenue) / previousPeriodRevenue.rows[0].revenue) * 100 
//       : 0;

//     // Prepare response
//     const dashboardData = {
//       success: true,
//       data: {
//         // Summary Cards
//         summary: {
//           totalHotels,
//           activeHotels,
//           inactiveHotels: parseInt(hotelStats.rows[0]?.inactive_hotels) || 0,
//           newHotels: parseInt(hotelStats.rows[0]?.new_hotels) || 0,
//           activePercentage: parseFloat(hotelStats.rows[0]?.active_percentage) || 0,
          
//           totalRevenue: formatCurrency(totalRevenue),
//           revenueInPeriod: formatCurrency(revenueInPeriod),
//           revenueThisMonth: formatCurrency(revenueStats.rows[0]?.revenue_this_month || 0),
//           revenueGrowth: parseFloat(revenueGrowth.toFixed(2)),
          
//           mrr: formatCurrency(mrr),
//           averageOrderValue: formatCurrency(revenueStats.rows[0]?.average_order_value || 0),
//           payingHotels: parseInt(revenueStats.rows[0]?.paying_hotels) || 0,
          
//           totalStaff,
//           activeStaff,
//           avgStaffPerHotel: parseFloat(avgStaffPerHotel),
//           activeStaff30d: parseInt(staffStats.rows[0]?.active_staff_30d) || 0,
          
//           totalMenuItems: parseInt(menuStats.rows[0]?.total_menu_items) || 0,
//           totalTables: parseInt(tableStats.rows[0]?.total_tables) || 0,
//         },

//         // Subscription Stats
//         subscriptions: {
//           total: parseInt(subscriptionStats.rows[0]?.total_subscriptions) || 0,
//           active: parseInt(subscriptionStats.rows[0]?.active_subscriptions) || 0,
//           trial: parseInt(subscriptionStats.rows[0]?.trial_subscriptions) || 0,
//           suspended: parseInt(subscriptionStats.rows[0]?.suspended_subscriptions) || 0,
//           cancelled: parseInt(subscriptionStats.rows[0]?.cancelled_subscriptions) || 0,
//           averageValue: formatCurrency(subscriptionStats.rows[0]?.average_subscription_value || 0),
//           planDistribution: planDistribution.rows.map(row => ({
//             name: row.plan_name,
//             count: parseInt(row.hotel_count) || 0,
//             revenue: formatCurrency(row.monthly_revenue || 0)
//           }))
//         },

//         // Charts Data
//         charts: {
//           revenue: revenueChart.rows.map(row => ({
//             date: row.date,
//             revenue: formatCurrency(row.revenue),
//             transactions: parseInt(row.order_count) || 0,
//             uniqueHotels: parseInt(row.unique_hotels) || 0
//           })),
//           hotelGrowth: hotelGrowth.rows.map(row => ({
//             month: row.month,
//             totalHotels: parseInt(row.total_hotels) || 0,
//             newHotels: parseInt(row.new_hotels) || 0,
//             activeSubscriptions: parseInt(row.active_subscriptions) || 0
//           }))
//         },

//         // Tables
//         recentHotels: recentHotels.rows.map(row => ({
//           id: row.id,
//           name: row.name,
//           email: row.email,
//           phone: row.phone,
//           isActive: row.is_active,
//           city: row.city,
//           country: row.country,
//           subscriptionStatus: row.subscription_status,
//           planName: row.plan_name,
//           createdAt: row.created_at
//         })),

//         recentOrders: recentOrders.rows.map(row => ({
//           id: row.id,
//           orderNumber: row.order_number,
//           amount: formatCurrency(row.amount),
//           status: row.status,
//           paymentMethod: row.payment_method,
//           hotelName: row.hotel_name,
//           hotelId: row.hotel_id,
//           waiterName: row.waiter_name,
//           createdAt: row.created_at
//         })),

//         topHotels: topHotels.rows.map(row => ({
//           id: row.id,
//           name: row.name,
//           email: row.email,
//           isActive: row.is_active,
//           staffCount: parseInt(row.staff_count) || 0,
//           tableCount: parseInt(row.table_count) || 0,
//           totalRevenue: formatCurrency(row.total_revenue),
//           planName: row.plan_name
//         })),

//         // System Health
//         systemHealth: {
//           hotelsLast24h: parseInt(systemHealth.rows[0]?.hotels_last_24h) || 0,
//           staffLast24h: parseInt(systemHealth.rows[0]?.staff_last_24h) || 0,
//           ordersLast24h: parseInt(systemHealth.rows[0]?.orders_last_24h) || 0,
//           activityLastHour: parseInt(systemHealth.rows[0]?.activity_last_hour) || 0
//         },

//         // Recent Activity
//         recentActivity: recentActivity.rows.map(row => ({
//           id: row.id,
//           action: row.action,
//           resourceType: row.resource_type,
//           resourceName: row.resource_name,
//           details: safeJsonParse(row.details),
//           ipAddress: row.ip_address,
//           userAgent: row.user_agent,
//           createdAt: row.created_at,
//           userType: row.user_type
//         })),

//         // Inventory Stats (if available)
//         inventory: {
//           totalItems: parseInt(inventoryStats.rows[0]?.total_items) || 0,
//           lowStockItems: parseInt(inventoryStats.rows[0]?.low_stock_items) || 0,
//           outOfStockItems: parseInt(inventoryStats.rows[0]?.out_of_stock_items) || 0,
//           totalValue: formatCurrency(inventoryStats.rows[0]?.total_value || 0)
//         },

//         // Menu Stats
//         menu: {
//           totalItems: parseInt(menuStats.rows[0]?.total_menu_items) || 0,
//           totalCategories: parseInt(menuStats.rows[0]?.total_categories) || 0,
//           availableItems: parseInt(menuStats.rows[0]?.available_items) || 0
//         },

//         // Table Stats
//         tables: {
//           total: parseInt(tableStats.rows[0]?.total_tables) || 0,
//           available: parseInt(tableStats.rows[0]?.available_tables) || 0,
//           occupied: parseInt(tableStats.rows[0]?.occupied_tables) || 0,
//           reserved: parseInt(tableStats.rows[0]?.reserved_tables) || 0
//         },

//         // Metadata
//         metadata: {
//           timeRange,
//           startDate: startDateStr,
//           endDate: endDateStr,
//           generatedAt: new Date().toISOString(),
//           adminId
//         }
//       }
//     };

//     // Log the dashboard access
//     logger.info("ADMIN_DASHBOARD_SUCCESS", {
//       requestId,
//       adminId,
//       timeRange,
//       responseTime: Date.now() - start
//     });

//     return res.json(dashboardData);

//   } catch (error) {
//     logger.error("ADMIN_DASHBOARD_ERROR", {
//       requestId,
//       error: error.message,
//       stack: error.stack,
//       responseTime: Date.now() - start
//     });

//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch dashboard data",
//       error: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// };

// // ======================
// // EXPORT DASHBOARD DATA (CSV)
// // ======================
// exports.exportDashboardData = async (req, res) => {
//   try {
//     if (!req.admin) {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized"
//       });
//     }

//     const { type = 'hotels' } = req.query; // hotels, orders, staff

//     let data;
//     let filename;
//     let headers;

//     switch(type) {
//       case 'hotels':
//         const hotels = await db.query(`
//           SELECT 
//             h.id, h.hotel_name, h.admin_email, h.hotel_phone, h.is_active,
//             h.city, h.country, h.subscription_status,
//             COALESCE(sp.plan_name, 'No Plan') as plan_name,
//             h.created_at,
//             (SELECT COUNT(*) FROM staff s WHERE s.hotel_id = h.id) as staff_count,
//             (SELECT COUNT(*) FROM orders o WHERE o.hotel_id = h.id) as order_count
//           FROM hotels h
//           LEFT JOIN subscription_plans sp ON sp.id = h.subscription_plan_id
//           ORDER BY h.created_at DESC
//         `);
//         data = hotels.rows;
//         filename = `hotels_export_${new Date().toISOString().split('T')[0]}.csv`;
//         headers = ['ID', 'Hotel Name', 'Admin Email', 'Phone', 'Active', 'City', 'Country', 'Subscription', 'Plan', 'Created', 'Staff Count', 'Order Count'];
//         break;

//       case 'orders':
//         const orders = await db.query(`
//           SELECT 
//             o.id, o.order_number, h.hotel_name, o.total_amount, 
//             o.status, o.payment_status, o.payment_method,
//             o.created_at, s.full_name as waiter_name
//           FROM orders o
//           JOIN hotels h ON h.id = o.hotel_id
//           LEFT JOIN staff s ON s.id = o.waiter_id
//           WHERE o.status = 'completed'
//           ORDER BY o.created_at DESC
//         `);
//         data = orders.rows;
//         filename = `orders_export_${new Date().toISOString().split('T')[0]}.csv`;
//         headers = ['ID', 'Order Number', 'Hotel', 'Amount', 'Status', 'Payment Status', 'Payment Method', 'Date', 'Waiter'];
//         break;

//       case 'staff':
//         const staff = await db.query(`
//           SELECT 
//             s.id, s.staff_code, s.full_name, s.email, s.phone_number,
//             s.role, s.is_active, h.hotel_name, s.last_login, s.created_at
//           FROM staff s
//           JOIN hotels h ON h.id = s.hotel_id
//           ORDER BY s.created_at DESC
//         `);
//         data = staff.rows;
//         filename = `staff_export_${new Date().toISOString().split('T')[0]}.csv`;
//         headers = ['ID', 'Staff Code', 'Name', 'Email', 'Phone', 'Role', 'Active', 'Hotel', 'Last Login', 'Created'];
//         break;

//       default:
//         return res.status(400).json({
//           success: false,
//           message: "Invalid export type"
//         });
//     }

//     // Convert to CSV
//     const csvRows = [];
//     csvRows.push(headers.join(','));
    
//     for (const row of data) {
//       const values = headers.map(header => {
//         const key = header.toLowerCase().replace(/ /g, '_').replace(/[^a-z0-9_]/g, '');
//         const value = row[key] || row[header.toLowerCase()] || '';
//         return `"${String(value).replace(/"/g, '""')}"`;
//       });
//       csvRows.push(values.join(','));
//     }

//     res.setHeader('Content-Type', 'text/csv');
//     res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
//     res.send(csvRows.join('\n'));

//   } catch (error) {
//     logger.error("ADMIN_EXPORT_ERROR", { error: error.message });
//     return res.status(500).json({
//       success: false,
//       message: "Failed to export data"
//     });
//   }
// };
























// exports.getAllSubscriptions = async (req, res) => {
//   const requestId = req.headers["x-request-id"] || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  
//   try {
//     console.log('reached get all subscriptions')
//     if (!req.admin) {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized"
//       });
//     }

//     const { page = 1, limit = 10, search = '', status = 'all' } = req.query;
//     const offset = (page - 1) * limit;

//     let query = `
//       SELECT 
//         sp.*,
//         COUNT(h.id) as hotels_using
//       FROM subscription_plans sp
//       LEFT JOIN hotels h ON h.subscription_plan_id = sp.id
//       WHERE 1=1
//     `;
    
//     const queryParams = [];
//     let paramIndex = 1;

//     if (search) {
//       query += ` AND (sp.plan_name ILIKE $${paramIndex} OR sp.plan_code ILIKE $${paramIndex})`;
//       queryParams.push(`%${search}%`);
//       paramIndex++;
//     }

//     if (status !== 'all') {
//       query += ` AND sp.is_active = $${paramIndex}`;
//       queryParams.push(status === 'active');
//       paramIndex++;
//     }

//     query += ` GROUP BY sp.id ORDER BY sp.display_order, sp.created_at DESC`;

//     // Get total count
//     const countResult = await db.query(
//       `SELECT COUNT(*) FROM subscription_plans sp WHERE 1=1 ${
//         search ? `AND (sp.plan_name ILIKE $1 OR sp.plan_code ILIKE $1)` : ''
//       }`,
//       search ? [`%${search}%`] : []
//     );
    
//     const total = parseInt(countResult.rows[0]?.count) || 0;

//     // Get paginated results
//     query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
//     queryParams.push(limit, offset);
    
//     const result = await db.query(query, queryParams);

//     logger.info("SUBSCRIPTIONS_FETCHED", {
//       requestId,
//       adminId: req.admin.id,
//       count: result.rows.length
//     });

//     return res.json({
//       success: true,
//       data: result.rows,
//       pagination: {
//         page: parseInt(page),
//         limit: parseInt(limit),
//         total,
//         pages: Math.ceil(total / limit)
//       }
//     });

//   } catch (error) {
//     logger.error("SUBSCRIPTIONS_FETCH_ERROR", {
//       requestId,
//       error: error.message,
//       stack: error.stack
//     });
//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch subscriptions"
//     });
//   }
// };

// // GET single subscription plan by ID
// exports.getSubscriptionById = async (req, res) => {
//   const requestId = req.headers["x-request-id"] || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  
//   try {
//     if (!req.admin) {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized"
//       });
//     }

//     const { id } = req.params;
//     console.log('this is the id:- ', id)

//     const result = await db.query(`
//       SELECT 
//         sp.*,
//         COUNT(h.id) as hotels_using,
//         json_agg(
//           json_build_object(
//             'id', h.id,
//             'hotel_name', h.hotel_name,
//             'subscription_status', h.subscription_status,
//             'created_at', h.created_at
//           ) ORDER BY h.created_at DESC
//         ) FILTER (WHERE h.id IS NOT NULL) as hotels
//       FROM subscription_plans sp
//       LEFT JOIN hotels h ON h.subscription_plan_id = sp.id
//       WHERE sp.id = $1
//       GROUP BY sp.id
//     `, [id]);

//     if (result.rows.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: "Subscription plan not found"
//       });
//     }
//     console.log('this is the resuly:- ', result.rows[0])

//     logger.info("SUBSCRIPTION_FETCHED", {
//       requestId,
//       adminId: req.admin.id,
//       planId: id
//     });

//     return res.json({
//       success: true,
//       data: result.rows[0]
//     });

//   } catch (error) {
//     logger.error("SUBSCRIPTION_FETCH_ERROR", {
//       requestId,
//       error: error.message,
//       stack: error.stack
//     });
//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch subscription"
//     });
//   }
// };

// // CREATE new subscription plan
// exports.createSubscription = async (req, res) => {
//   const requestId = req.headers["x-request-id"] || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  
//   try {
//     if (!req.admin) {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized"
//       });
//     }

//     const {
//       plan_name,
//       plan_code,
//       description,
//       price_per_year,
//       max_staff,
//       max_tables,
//       max_menu_items,
//       features,
//       display_order,
//       is_active
//     } = req.body;

//     // Validate required fields
//     if (!plan_name || !plan_code || !price_per_year) {
//       return res.status(400).json({
//         success: false,
//         message: "Missing required fields"
//       });
//     }

//     // Check if plan code already exists
//     const existing = await db.query(
//       "SELECT id FROM subscription_plans WHERE plan_code = $1",
//       [plan_code]
//     );

//     if (existing.rows.length > 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Plan code already exists"
//       });
//     }

//     const id = uuidv4();
//     const featuresJson = features || {};

//     const result = await db.query(`
//       INSERT INTO subscription_plans (
//         id, plan_name, plan_code, description, price_per_year,
//         max_staff, max_tables, max_menu_items, features,
//         display_order, is_active, created_at
//       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
//       RETURNING *
//     `, [
//       id, plan_name, plan_code, description, price_per_year,
//       max_staff || 0, max_tables || 0, max_menu_items || 0,
//       featuresJson, display_order || 0, is_active !== false
//     ]);

//     // Log activity
//     await db.query(`
//       INSERT INTO activity_logs (id, user_id, user_type, action, resource_type, resource_id, details, created_at)
//       VALUES (uuid_generate_v4(), $1, 'main_admin', 'CREATE_SUBSCRIPTION', 'subscription_plan', $2, $3, NOW())
//     `, [req.admin.id, id, JSON.stringify({ plan_name, plan_code, price_per_year })]);

//     logger.info("SUBSCRIPTION_CREATED", {
//       requestId,
//       adminId: req.admin.id,
//       planId: id
//     });

//     return res.status(201).json({
//       success: true,
//       message: "Subscription plan created successfully",
//       data: result.rows[0]
//     });

//   } catch (error) {
//     logger.error("SUBSCRIPTION_CREATE_ERROR", {
//       requestId,
//       error: error.message,
//       stack: error.stack
//     });
//     return res.status(500).json({
//       success: false,
//       message: "Failed to create subscription"
//     });
//   }
// };

// // UPDATE subscription plan
// exports.updateSubscription = async (req, res) => {
//   const requestId = req.headers["x-request-id"] || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  
//   try {
//     if (!req.admin) {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized"
//       });
//     }

//     const { id } = req.params;
//     const {
//       plan_name,
//       plan_code,
//       description,
//       price_per_year,
//       max_staff,
//       max_tables,
//       max_menu_items,
//       features,
//       display_order,
//       is_active
//     } = req.body;

//     // Check if plan exists
//     const existing = await db.query(
//       "SELECT * FROM subscription_plans WHERE id = $1",
//       [id]
//     );

//     if (existing.rows.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: "Subscription plan not found"
//       });
//     }

//     // Check if plan code already exists (if changing)
//     if (plan_code && plan_code !== existing.rows[0].plan_code) {
//       const codeExists = await db.query(
//         "SELECT id FROM subscription_plans WHERE plan_code = $1 AND id != $2",
//         [plan_code, id]
//       );

//       if (codeExists.rows.length > 0) {
//         return res.status(400).json({
//           success: false,
//           message: "Plan code already exists"
//         });
//       }
//     }

//     const result = await db.query(`
//       UPDATE subscription_plans SET
//         plan_name = COALESCE($1, plan_name),
//         plan_code = COALESCE($2, plan_code),
//         description = COALESCE($3, description),
//         price_per_year = COALESCE($4, price_per_year),
//         max_staff = COALESCE($5, max_staff),
//         max_tables = COALESCE($6, max_tables),
//         max_menu_items = COALESCE($7, max_menu_items),
//         features = COALESCE($8, features),
//         display_order = COALESCE($9, display_order),
//         is_active = COALESCE($10, is_active)
//       WHERE id = $11
//       RETURNING *
//     `, [
//       plan_name, plan_code, description, price_per_year,
//       max_staff, max_tables, max_menu_items,
//       features ? JSON.stringify(features) : null,
//       display_order, is_active, id
//     ]);

//     // Log activity
//     await db.query(`
//       INSERT INTO activity_logs (id, user_id, user_type, action, resource_type, resource_id, details, created_at)
//       VALUES (uuid_generate_v4(), $1, 'main_admin', 'UPDATE_SUBSCRIPTION', 'subscription_plan', $2, $3, NOW())
//     `, [req.admin.id, id, JSON.stringify({ 
//       old: existing.rows[0],
//       new: result.rows[0] 
//     })]);

//     logger.info("SUBSCRIPTION_UPDATED", {
//       requestId,
//       adminId: req.admin.id,
//       planId: id
//     });

//     return res.json({
//       success: true,
//       message: "Subscription plan updated successfully",
//       data: result.rows[0]
//     });

//   } catch (error) {
//     logger.error("SUBSCRIPTION_UPDATE_ERROR", {
//       requestId,
//       error: error.message,
//       stack: error.stack
//     });
//     return res.status(500).json({
//       success: false,
//       message: "Failed to update subscription"
//     });
//   }
// };

// // DELETE subscription plan
// exports.deleteSubscription = async (req, res) => {
//   const requestId = req.headers["x-request-id"] || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  
//   try {
//     if (!req.admin) {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized"
//       });
//     }

//     const { id } = req.params;

//     // Check if plan exists and has hotels using it
//     const planInfo = await db.query(`
//       SELECT 
//         sp.*,
//         COUNT(h.id) as hotels_using
//       FROM subscription_plans sp
//       LEFT JOIN hotels h ON h.subscription_plan_id = sp.id
//       WHERE sp.id = $1
//       GROUP BY sp.id
//     `, [id]);

//     if (planInfo.rows.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: "Subscription plan not found"
//       });
//     }

//     const hotelsUsing = parseInt(planInfo.rows[0].hotels_using) || 0;

//     if (hotelsUsing > 0) {
//       return res.status(400).json({
//         success: false,
//         message: `Cannot delete plan. ${hotelsUsing} hotel(s) are currently using this plan.`
//       });
//     }

//     // Delete the plan
//     await db.query("DELETE FROM subscription_plans WHERE id = $1", [id]);

//     // Log activity
//     await db.query(`
//       INSERT INTO activity_logs (id, user_id, user_type, action, resource_type, resource_id, details, created_at)
//       VALUES (uuid_generate_v4(), $1, 'main_admin', 'DELETE_SUBSCRIPTION', 'subscription_plan', $2, $3, NOW())
//     `, [req.admin.id, id, JSON.stringify(planInfo.rows[0])]);

//     logger.info("SUBSCRIPTION_DELETED", {
//       requestId,
//       adminId: req.admin.id,
//       planId: id
//     });

//     return res.json({
//       success: true,
//       message: "Subscription plan deleted successfully"
//     });

//   } catch (error) {
//     logger.error("SUBSCRIPTION_DELETE_ERROR", {
//       requestId,
//       error: error.message,
//       stack: error.stack
//     });
//     return res.status(500).json({
//       success: false,
//       message: "Failed to delete subscription"
//     });
//   }
// };

// // TOGGLE subscription plan status
// exports.toggleSubscriptionStatus = async (req, res) => {
//   const requestId = req.headers["x-request-id"] || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  
//   try {
//     if (!req.admin) {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized"
//       });
//     }

//     const { id } = req.params;

//     const result = await db.query(`
//       UPDATE subscription_plans
//       SET is_active = NOT is_active
//       WHERE id = $1
//       RETURNING id, plan_name, is_active
//     `, [id]);

//     if (result.rows.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: "Subscription plan not found"
//       });
//     }

//     // Log activity
//     await db.query(`
//       INSERT INTO activity_logs (id, user_id, user_type, action, resource_type, resource_id, details, created_at)
//       VALUES (uuid_generate_v4(), $1, 'main_admin', 'TOGGLE_SUBSCRIPTION_STATUS', 'subscription_plan', $2, $3, NOW())
//     `, [req.admin.id, id, JSON.stringify(result.rows[0])]);

//     logger.info("SUBSCRIPTION_STATUS_TOGGLED", {
//       requestId,
//       adminId: req.admin.id,
//       planId: id,
//       newStatus: result.rows[0].is_active
//     });

//     return res.json({
//       success: true,
//       message: `Subscription plan ${result.rows[0].is_active ? 'activated' : 'deactivated'} successfully`,
//       data: result.rows[0]
//     });

//   } catch (error) {
//     logger.error("SUBSCRIPTION_STATUS_TOGGLE_ERROR", {
//       requestId,
//       error: error.message,
//       stack: error.stack
//     });
//     return res.status(500).json({
//       success: false,
//       message: "Failed to toggle subscription status"
//     });
//   }
// };








// src/controllers/adminDashboardController.js
const db = require("../config/database");
const logger = require("../utils/logger");
const { v4: uuidv4 } = require('uuid');

// Cache for frequently accessed data
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Helper for safe JSON parsing
const safeJsonParse = (value, defaultValue = {}) => {
  try {
    return typeof value === 'string' ? JSON.parse(value) : (value || defaultValue);
  } catch {
    return defaultValue;
  }
};

// Helper to format currency
const formatCurrency = (value) => {
  return parseFloat(value || 0).toFixed(2);
};

// Helper to get or set cache
const getCachedData = (key, ttl = CACHE_TTL) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data;
  }
  return null;
};

const setCachedData = (key, data) => {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
};

const clearCache = (pattern) => {
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
};

// ======================
// DASHBOARD STATS (Optimized with parallel queries and caching)
// ======================
exports.getDashboardStats = async (req, res) => {
  const requestId = req.headers["x-request-id"] || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const start = Date.now();

  try {
    // Ensure admin is authenticated
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const adminId = req.admin.id;
    const timeRange = req.query.range || '30d';
    
    // Check cache
    const cacheKey = `dashboard_stats_${timeRange}_${adminId}`;
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      logger.info("ADMIN_DASHBOARD_CACHE_HIT", {
        requestId,
        adminId,
        timeRange,
        responseTime: Date.now() - start
      });
      return res.json(cachedData);
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch(timeRange) {
      case '7d': startDate.setDate(startDate.getDate() - 7); break;
      case '30d': startDate.setDate(startDate.getDate() - 30); break;
      case '90d': startDate.setDate(startDate.getDate() - 90); break;
      case '1y': startDate.setFullYear(startDate.getFullYear() - 1); break;
      default: startDate.setDate(startDate.getDate() - 30);
    }

    const startDateStr = startDate.toISOString();
    const endDateStr = endDate.toISOString();

    // Run all queries in parallel for better performance
    const [
      hotelStats,
      subscriptionStats,
      revenueStats,
      staffStats,
      planDistribution,
      recentHotels,
      recentOrders,
      revenueChart,
      hotelGrowth,
      topHotels,
      systemHealth,
      recentActivity,
      menuStats,
      tableStats,
      previousPeriodRevenue
    ] = await Promise.all([
      // 1. HOTEL STATISTICS
      db.query(`
        SELECT 
          COUNT(*) as total_hotels,
          COUNT(CASE WHEN is_active = true THEN 1 END) as active_hotels,
          COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_hotels,
          COUNT(CASE WHEN created_at >= $1 THEN 1 END) as new_hotels,
          COALESCE(ROUND(COUNT(CASE WHEN is_active = true THEN 1 END)::DECIMAL / NULLIF(COUNT(*), 0) * 100, 2), 0) as active_percentage
        FROM hotels
      `, [startDateStr]),

      // 2. SUBSCRIPTION STATISTICS
      db.query(`
        SELECT 
          COUNT(CASE WHEN subscription_status = 'trial' THEN 1 END) as trial_subscriptions,
          COUNT(CASE WHEN subscription_status = 'active' THEN 1 END) as active_subscriptions,
          COUNT(CASE WHEN subscription_status = 'suspended' THEN 1 END) as suspended_subscriptions,
          COUNT(CASE WHEN subscription_status = 'cancelled' THEN 1 END) as cancelled_subscriptions,
          COUNT(*) as total_subscriptions,
          COALESCE(AVG(sp.price_per_year), 0) as average_subscription_value
        FROM hotels h
        LEFT JOIN subscription_plans sp ON sp.id = h.subscription_plan_id
      `),

      // 3. REVENUE STATISTICS
      db.query(`
        SELECT 
          COALESCE(SUM(total_amount), 0) as total_revenue,
          COALESCE(SUM(CASE WHEN created_at >= $1 THEN total_amount ELSE 0 END), 0) as revenue_in_period,
          COUNT(DISTINCT hotel_id) as paying_hotels,
          COALESCE(AVG(total_amount), 0) as average_order_value,
          COALESCE(SUM(CASE 
            WHEN created_at >= DATE_TRUNC('month', CURRENT_DATE) 
            THEN total_amount ELSE 0 
          END), 0) as revenue_this_month
        FROM orders
        WHERE status = 'completed'
      `, [startDateStr]),

      // 4. STAFF STATISTICS
      db.query(`
        SELECT 
          COUNT(*) as total_staff,
          COUNT(CASE WHEN is_active = true THEN 1 END) as active_staff,
          COUNT(CASE WHEN last_login >= $1 THEN 1 END) as active_staff_30d,
          COUNT(DISTINCT hotel_id) as hotels_with_staff
        FROM staff
      `, [startDateStr]),

      // 5. PLAN DISTRIBUTION
      db.query(`
        SELECT 
          COALESCE(sp.plan_name, 'No Plan') as plan_name,
          COUNT(h.id) as hotel_count,
          COALESCE(SUM(sp.price_per_year), 0) as monthly_revenue
        FROM hotels h
        LEFT JOIN subscription_plans sp ON sp.id = h.subscription_plan_id
        GROUP BY sp.id, sp.plan_name
        ORDER BY hotel_count DESC
      `),

      // 6. RECENT HOTELS
      db.query(`
        SELECT 
          h.id,
          h.hotel_name as name,
          h.admin_email as email,
          h.hotel_phone as phone,
          h.is_active,
          h.created_at,
          h.city,
          h.country,
          h.subscription_status,
          COALESCE(sp.plan_name, 'No Plan') as plan_name
        FROM hotels h
        LEFT JOIN subscription_plans sp ON sp.id = h.subscription_plan_id
        ORDER BY h.created_at DESC
        LIMIT 10
      `),

      // 7. RECENT ORDERS
      db.query(`
        SELECT 
          o.id,
          o.total_amount as amount,
          o.status,
          o.payment_method,
          o.created_at,
          o.order_number,
          h.hotel_name,
          h.id as hotel_id,
          s.full_name as waiter_name
        FROM orders o
        JOIN hotels h ON h.id = o.hotel_id
        LEFT JOIN staff s ON s.id = o.waiter_id
        ORDER BY o.created_at DESC
        LIMIT 10
      `),

      // 8. REVENUE CHART DATA
      db.query(`
        WITH days AS (
          SELECT generate_series(
            date_trunc('day', $1::timestamp),
            date_trunc('day', $2::timestamp),
            '1 day'::interval
          ) as day
        )
        SELECT 
          TO_CHAR(days.day, 'YYYY-MM-DD') as date,
          COALESCE(SUM(o.total_amount), 0) as revenue,
          COUNT(DISTINCT o.id) as order_count,
          COUNT(DISTINCT o.hotel_id) as unique_hotels
        FROM days
        LEFT JOIN orders o ON 
          DATE(o.created_at) = DATE(days.day) 
          AND o.status = 'completed'
        GROUP BY days.day
        ORDER BY days.day ASC
      `, [startDateStr, endDateStr]),

      // 9. HOTEL GROWTH CHART
      db.query(`
        WITH months AS (
          SELECT generate_series(
            date_trunc('month', $1::timestamp),
            date_trunc('month', $2::timestamp),
            '1 month'::interval
          ) as month
        )
        SELECT 
          TO_CHAR(months.month, 'YYYY-MM') as month,
          COUNT(DISTINCT h.id) as total_hotels,
          COUNT(DISTINCT CASE WHEN DATE_TRUNC('month', h.created_at) = months.month THEN h.id END) as new_hotels,
          COUNT(DISTINCT CASE WHEN h.subscription_status = 'active' THEN h.id END) as active_subscriptions
        FROM months
        CROSS JOIN hotels h
        WHERE h.created_at <= months.month + interval '1 month'
        GROUP BY months.month
        ORDER BY months.month ASC
      `, [startDateStr, endDateStr]),

      // 10. TOP PERFORMING HOTELS
      db.query(`
        SELECT 
          h.id,
          h.hotel_name as name,
          h.admin_email as email,
          h.is_active,
          COUNT(DISTINCT s.id) as staff_count,
          COUNT(DISTINCT t.id) as table_count,
          COALESCE(SUM(o.total_amount), 0) as total_revenue,
          COALESCE(sp.plan_name, 'No Plan') as plan_name
        FROM hotels h
        LEFT JOIN staff s ON s.hotel_id = h.id
        LEFT JOIN hotel_tables t ON t.hotel_id = h.id
        LEFT JOIN orders o ON o.hotel_id = h.id AND o.status = 'completed'
        LEFT JOIN subscription_plans sp ON sp.id = h.subscription_plan_id
        GROUP BY h.id, h.hotel_name, h.admin_email, h.is_active, sp.plan_name
        ORDER BY total_revenue DESC
        LIMIT 5
      `),

      // 11. SYSTEM HEALTH
      db.query(`
        SELECT 
          (SELECT COUNT(*) FROM hotels WHERE created_at > NOW() - INTERVAL '24 hours') as hotels_last_24h,
          (SELECT COUNT(*) FROM staff WHERE created_at > NOW() - INTERVAL '24 hours') as staff_last_24h,
          (SELECT COUNT(*) FROM orders WHERE created_at > NOW() - INTERVAL '24 hours') as orders_last_24h,
          (SELECT COUNT(*) FROM activity_logs WHERE created_at > NOW() - INTERVAL '1 hour') as activity_last_hour
      `),

      // 12. RECENT ACTIVITY
      db.query(`
        SELECT 
          al.id,
          al.action,
          al.resource_type,
          al.resource_id,
          al.details,
          al.ip_address,
          al.user_agent,
          al.created_at,
          al.user_type,
          al.user_id,
          CASE 
            WHEN al.resource_type = 'hotel' THEN (SELECT hotel_name FROM hotels WHERE id = al.resource_id::UUID)
            WHEN al.resource_type = 'staff' THEN (SELECT full_name FROM staff WHERE id = al.resource_id::UUID)
            ELSE NULL
          END as resource_name
        FROM activity_logs al
        WHERE al.user_type = 'main_admin' OR al.resource_type IN ('hotel', 'subscription', 'order')
        ORDER BY al.created_at DESC
        LIMIT 20
      `),

      // 13. MENU STATISTICS
      db.query(`
        SELECT 
          COUNT(DISTINCT mi.id) as total_menu_items,
          COUNT(DISTINCT mc.id) as total_categories,
          COUNT(DISTINCT CASE WHEN mi.is_available = true THEN mi.id END) as available_items
        FROM menu_items mi
        LEFT JOIN menu_categories mc ON mc.id = mi.category_id
      `),

      // 14. TABLE STATISTICS
      db.query(`
        SELECT 
          COUNT(*) as total_tables,
          COUNT(CASE WHEN status = 'available' THEN 1 END) as available_tables,
          COUNT(CASE WHEN status = 'occupied' THEN 1 END) as occupied_tables,
          COUNT(CASE WHEN status = 'reserved' THEN 1 END) as reserved_tables
        FROM hotel_tables
      `),

      // 15. PREVIOUS PERIOD REVENUE (for growth calculation)
      db.query(`
        SELECT COALESCE(SUM(total_amount), 0) as revenue
        FROM orders
        WHERE status = 'completed'
          AND created_at >= $1
          AND created_at < $2
      `, [
        new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime())).toISOString(),
        startDateStr
      ])
    ]);

    // 16. INVENTORY STATISTICS (separate try-catch)
    let inventoryStats = { rows: [{
      total_items: 0,
      low_stock_items: 0,
      out_of_stock_items: 0,
      total_value: 0
    }] };

    try {
      const inventoryResult = await db.query(`
        SELECT 
          COUNT(*) as total_items,
          COUNT(CASE WHEN status = 'low_stock' THEN 1 END) as low_stock_items,
          COUNT(CASE WHEN status = 'out_of_stock' THEN 1 END) as out_of_stock_items,
          COALESCE(SUM(total_value), 0) as total_value
        FROM inventory
        WHERE is_active = true
      `);
      inventoryStats = inventoryResult;
    } catch (inventoryErr) {
      logger.warn("Inventory tables might not exist", { error: inventoryErr.message });
    }

    // Calculate key metrics
    const totalHotels = parseInt(hotelStats.rows[0]?.total_hotels) || 0;
    const activeHotels = parseInt(hotelStats.rows[0]?.active_hotels) || 0;
    const totalRevenue = parseFloat(revenueStats.rows[0]?.total_revenue) || 0;
    const revenueInPeriod = parseFloat(revenueStats.rows[0]?.revenue_in_period) || 0;
    const totalStaff = parseInt(staffStats.rows[0]?.total_staff) || 0;
    const activeStaff = parseInt(staffStats.rows[0]?.active_staff) || 0;
    const avgStaffPerHotel = totalHotels > 0 ? (totalStaff / totalHotels).toFixed(1) : 0;

    // Calculate MRR
    const mrr = planDistribution.rows.reduce((sum, plan) => {
      return sum + (parseFloat(plan.monthly_revenue) || 0);
    }, 0);

    // Calculate revenue growth
    const revenueGrowth = previousPeriodRevenue.rows[0]?.revenue > 0 
      ? ((revenueInPeriod - previousPeriodRevenue.rows[0].revenue) / previousPeriodRevenue.rows[0].revenue) * 100 
      : 0;

    // Prepare response
    const dashboardData = {
      success: true,
      data: {
        summary: {
          totalHotels,
          activeHotels,
          inactiveHotels: parseInt(hotelStats.rows[0]?.inactive_hotels) || 0,
          newHotels: parseInt(hotelStats.rows[0]?.new_hotels) || 0,
          activePercentage: parseFloat(hotelStats.rows[0]?.active_percentage) || 0,
          
          totalRevenue: formatCurrency(totalRevenue),
          revenueInPeriod: formatCurrency(revenueInPeriod),
          revenueThisMonth: formatCurrency(revenueStats.rows[0]?.revenue_this_month || 0),
          revenueGrowth: parseFloat(revenueGrowth.toFixed(2)),
          
          mrr: formatCurrency(mrr),
          averageOrderValue: formatCurrency(revenueStats.rows[0]?.average_order_value || 0),
          payingHotels: parseInt(revenueStats.rows[0]?.paying_hotels) || 0,
          
          totalStaff,
          activeStaff,
          avgStaffPerHotel: parseFloat(avgStaffPerHotel),
          activeStaff30d: parseInt(staffStats.rows[0]?.active_staff_30d) || 0,
          
          totalMenuItems: parseInt(menuStats.rows[0]?.total_menu_items) || 0,
          totalTables: parseInt(tableStats.rows[0]?.total_tables) || 0,
        },

        subscriptions: {
          total: parseInt(subscriptionStats.rows[0]?.total_subscriptions) || 0,
          active: parseInt(subscriptionStats.rows[0]?.active_subscriptions) || 0,
          trial: parseInt(subscriptionStats.rows[0]?.trial_subscriptions) || 0,
          suspended: parseInt(subscriptionStats.rows[0]?.suspended_subscriptions) || 0,
          cancelled: parseInt(subscriptionStats.rows[0]?.cancelled_subscriptions) || 0,
          averageValue: formatCurrency(subscriptionStats.rows[0]?.average_subscription_value || 0),
          planDistribution: planDistribution.rows.map(row => ({
            name: row.plan_name,
            count: parseInt(row.hotel_count) || 0,
            revenue: formatCurrency(row.monthly_revenue || 0)
          }))
        },

        charts: {
          revenue: revenueChart.rows.map(row => ({
            date: row.date,
            revenue: formatCurrency(row.revenue),
            transactions: parseInt(row.order_count) || 0,
            uniqueHotels: parseInt(row.unique_hotels) || 0
          })),
          hotelGrowth: hotelGrowth.rows.map(row => ({
            month: row.month,
            totalHotels: parseInt(row.total_hotels) || 0,
            newHotels: parseInt(row.new_hotels) || 0,
            activeSubscriptions: parseInt(row.active_subscriptions) || 0
          }))
        },

        recentHotels: recentHotels.rows.map(row => ({
          id: row.id,
          name: row.name,
          email: row.email,
          phone: row.phone,
          isActive: row.is_active,
          city: row.city,
          country: row.country,
          subscriptionStatus: row.subscription_status,
          planName: row.plan_name,
          createdAt: row.created_at
        })),

        recentOrders: recentOrders.rows.map(row => ({
          id: row.id,
          orderNumber: row.order_number,
          amount: formatCurrency(row.amount),
          status: row.status,
          paymentMethod: row.payment_method,
          hotelName: row.hotel_name,
          hotelId: row.hotel_id,
          waiterName: row.waiter_name,
          createdAt: row.created_at
        })),

        topHotels: topHotels.rows.map(row => ({
          id: row.id,
          name: row.name,
          email: row.email,
          isActive: row.is_active,
          staffCount: parseInt(row.staff_count) || 0,
          tableCount: parseInt(row.table_count) || 0,
          totalRevenue: formatCurrency(row.total_revenue),
          planName: row.plan_name
        })),

        systemHealth: {
          hotelsLast24h: parseInt(systemHealth.rows[0]?.hotels_last_24h) || 0,
          staffLast24h: parseInt(systemHealth.rows[0]?.staff_last_24h) || 0,
          ordersLast24h: parseInt(systemHealth.rows[0]?.orders_last_24h) || 0,
          activityLastHour: parseInt(systemHealth.rows[0]?.activity_last_hour) || 0
        },

        recentActivity: recentActivity.rows.map(row => ({
          id: row.id,
          action: row.action,
          resourceType: row.resource_type,
          resourceName: row.resource_name,
          details: safeJsonParse(row.details),
          ipAddress: row.ip_address,
          userAgent: row.user_agent,
          createdAt: row.created_at,
          userType: row.user_type
        })),

        inventory: {
          totalItems: parseInt(inventoryStats.rows[0]?.total_items) || 0,
          lowStockItems: parseInt(inventoryStats.rows[0]?.low_stock_items) || 0,
          outOfStockItems: parseInt(inventoryStats.rows[0]?.out_of_stock_items) || 0,
          totalValue: formatCurrency(inventoryStats.rows[0]?.total_value || 0)
        },

        menu: {
          totalItems: parseInt(menuStats.rows[0]?.total_menu_items) || 0,
          totalCategories: parseInt(menuStats.rows[0]?.total_categories) || 0,
          availableItems: parseInt(menuStats.rows[0]?.available_items) || 0
        },

        tables: {
          total: parseInt(tableStats.rows[0]?.total_tables) || 0,
          available: parseInt(tableStats.rows[0]?.available_tables) || 0,
          occupied: parseInt(tableStats.rows[0]?.occupied_tables) || 0,
          reserved: parseInt(tableStats.rows[0]?.reserved_tables) || 0
        },

        metadata: {
          timeRange,
          startDate: startDateStr,
          endDate: endDateStr,
          generatedAt: new Date().toISOString(),
          adminId,
          cached: false
        }
      }
    };

    // Cache the result
    setCachedData(cacheKey, dashboardData);

    logger.info("ADMIN_DASHBOARD_SUCCESS", {
      requestId,
      adminId,
      timeRange,
      responseTime: Date.now() - start
    });

    return res.json(dashboardData);

  } catch (error) {
    logger.error("ADMIN_DASHBOARD_ERROR", {
      requestId,
      error: error.message,
      stack: error.stack,
      responseTime: Date.now() - start
    });

    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard data",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ======================
// OPTIMIZED SUBSCRIPTION CRUD OPERATIONS
// ======================

// GET all subscriptions with pagination
exports.getAllSubscriptions = async (req, res) => {
  const requestId = req.headers["x-request-id"] || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  
  try {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const { page = 1, limit = 10, search = '', status = 'all' } = req.query;
    const offset = (page - 1) * limit;

    // Check cache for list queries
    const cacheKey = `subscriptions_list_${page}_${limit}_${search}_${status}`;
    const cachedData = getCachedData(cacheKey, 30000); // 30 seconds cache for lists
    if (cachedData) {
      return res.json(cachedData);
    }

    // Optimized query with proper indexing
    let query = `
      SELECT 
        sp.id,
        sp.plan_name,
        sp.plan_code,
        sp.description,
        sp.price_per_year,
        sp.max_staff,
        sp.max_tables,
        sp.max_menu_items,
        sp.features,
        sp.display_order,
        sp.is_active,
        sp.created_at,
        COUNT(h.id) as hotels_using
      FROM subscription_plans sp
      LEFT JOIN hotels h ON h.subscription_plan_id = sp.id
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramIndex = 1;

    if (search) {
      query += ` AND (sp.plan_name ILIKE $${paramIndex} OR sp.plan_code ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    if (status !== 'all') {
      query += ` AND sp.is_active = $${paramIndex}`;
      queryParams.push(status === 'active');
      paramIndex++;
    }

    query += ` GROUP BY sp.id ORDER BY sp.display_order, sp.created_at DESC`;

    // Get total count in a separate optimized query
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM subscription_plans sp 
      WHERE 1=1
      ${search ? `AND (sp.plan_name ILIKE $1 OR sp.plan_code ILIKE $1)` : ''}
      ${status !== 'all' ? `AND sp.is_active = $${search ? 2 : 1}` : ''}
    `;
    
    const countParams = [];
    if (search) countParams.push(`%${search}%`);
    if (status !== 'all') countParams.push(status === 'active');
    
    const [countResult, result] = await Promise.all([
      db.query(countQuery, countParams),
      db.query(query + ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`, [...queryParams, limit, offset])
    ]);
    
    const total = parseInt(countResult.rows[0]?.total) || 0;

    const response = {
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };

    // Cache the response
    setCachedData(cacheKey, response);

    logger.info("SUBSCRIPTIONS_FETCHED", {
      requestId,
      adminId: req.admin.id,
      count: result.rows.length
    });

    return res.json(response);

  } catch (error) {
    logger.error("SUBSCRIPTIONS_FETCH_ERROR", {
      requestId,
      error: error.message,
      stack: error.stack
    });
    return res.status(500).json({
      success: false,
      message: "Failed to fetch subscriptions"
    });
  }
};

// GET single subscription plan by ID
exports.getSubscriptionById = async (req, res) => {
  const requestId = req.headers["x-request-id"] || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  
  try {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const { id } = req.params;

    // Check cache
    const cacheKey = `subscription_${id}`;
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    // Optimized single query with proper indexing
    const result = await db.query(`
      SELECT 
        sp.*,
        COUNT(h.id) as hotels_using,
        (
          SELECT json_agg(
            json_build_object(
              'id', h2.id,
              'hotel_name', h2.hotel_name,
              'subscription_status', h2.subscription_status,
              'created_at', h2.created_at,
              'admin_email', h2.admin_email
            ) ORDER BY h2.created_at DESC
          )
          FROM hotels h2
          WHERE h2.subscription_plan_id = sp.id
          LIMIT 10
        ) as hotels
      FROM subscription_plans sp
      LEFT JOIN hotels h ON h.subscription_plan_id = sp.id
      WHERE sp.id = $1
      GROUP BY sp.id
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Subscription plan not found"
      });
    }

    const response = {
      success: true,
      data: result.rows[0]
    };

    // Cache the response
    setCachedData(cacheKey, response);

    logger.info("SUBSCRIPTION_FETCHED", {
      requestId,
      adminId: req.admin.id,
      planId: id
    });

    return res.json(response);

  } catch (error) {
    logger.error("SUBSCRIPTION_FETCH_ERROR", {
      requestId,
      error: error.message,
      stack: error.stack
    });
    return res.status(500).json({
      success: false,
      message: "Failed to fetch subscription"
    });
  }
};

// CREATE new subscription plan
exports.createSubscription = async (req, res) => {
  const requestId = req.headers["x-request-id"] || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  
  try {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const {
      plan_name,
      plan_code,
      description,
      price_per_year,
      max_staff,
      max_tables,
      max_menu_items,
      features,
      display_order,
      is_active
    } = req.body;

    // Validate required fields
    if (!plan_name || !plan_code || !price_per_year) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    // Check if plan code already exists
    const existing = await db.query(
      "SELECT id FROM subscription_plans WHERE plan_code = $1",
      [plan_code]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Plan code already exists"
      });
    }

    const id = uuidv4();
    const featuresJson = features || {};

    const result = await db.query(`
      INSERT INTO subscription_plans (
        id, plan_name, plan_code, description, price_per_year,
        max_staff, max_tables, max_menu_items, features,
        display_order, is_active, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      RETURNING *
    `, [
      id, plan_name, plan_code, description, price_per_year,
      max_staff || 0, max_tables || 0, max_menu_items || 0,
      featuresJson, display_order || 0, is_active !== false
    ]);

    // Log activity
    await db.query(`
      INSERT INTO activity_logs (id, user_id, user_type, action, resource_type, resource_id, details, created_at)
      VALUES (uuid_generate_v4(), $1, 'main_admin', 'CREATE_SUBSCRIPTION', 'subscription_plan', $2, $3, NOW())
    `, [req.admin.id, id, JSON.stringify({ plan_name, plan_code, price_per_year })]);

    // Clear relevant cache
    clearCache('subscriptions_list');

    logger.info("SUBSCRIPTION_CREATED", {
      requestId,
      adminId: req.admin.id,
      planId: id
    });

    return res.status(201).json({
      success: true,
      message: "Subscription plan created successfully",
      data: result.rows[0]
    });

  } catch (error) {
    logger.error("SUBSCRIPTION_CREATE_ERROR", {
      requestId,
      error: error.message,
      stack: error.stack
    });
    return res.status(500).json({
      success: false,
      message: "Failed to create subscription"
    });
  }
};

// UPDATE subscription plan
exports.updateSubscription = async (req, res) => {
  const requestId = req.headers["x-request-id"] || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  
  try {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const { id } = req.params;
    const updates = req.body;

    // Check if plan exists
    const existing = await db.query(
      "SELECT * FROM subscription_plans WHERE id = $1",
      [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Subscription plan not found"
      });
    }

    // Check if plan code already exists (if changing)
    if (updates.plan_code && updates.plan_code !== existing.rows[0].plan_code) {
      const codeExists = await db.query(
        "SELECT id FROM subscription_plans WHERE plan_code = $1 AND id != $2",
        [updates.plan_code, id]
      );

      if (codeExists.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Plan code already exists"
        });
      }
    }

    // Build dynamic update query
    const setClauses = [];
    const values = [];
    let paramIndex = 1;

    const updateFields = {
      plan_name: updates.plan_name,
      plan_code: updates.plan_code,
      description: updates.description,
      price_per_year: updates.price_per_year,
      max_staff: updates.max_staff,
      max_tables: updates.max_tables,
      max_menu_items: updates.max_menu_items,
      features: updates.features ? JSON.stringify(updates.features) : null,
      display_order: updates.display_order,
      is_active: updates.is_active
    };

    Object.entries(updateFields).forEach(([key, value]) => {
      if (value !== undefined) {
        setClauses.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (setClauses.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields to update"
      });
    }

    values.push(id);
    const query = `
      UPDATE subscription_plans 
      SET ${setClauses.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await db.query(query, values);

    // Log activity
    await db.query(`
      INSERT INTO activity_logs (id, user_id, user_type, action, resource_type, resource_id, details, created_at)
      VALUES (uuid_generate_v4(), $1, 'main_admin', 'UPDATE_SUBSCRIPTION', 'subscription_plan', $2, $3, NOW())
    `, [req.admin.id, id, JSON.stringify({ 
      old: existing.rows[0],
      new: result.rows[0] 
    })]);

    // Clear relevant cache
    clearCache(`subscription_${id}`);
    clearCache('subscriptions_list');

    logger.info("SUBSCRIPTION_UPDATED", {
      requestId,
      adminId: req.admin.id,
      planId: id
    });

    return res.json({
      success: true,
      message: "Subscription plan updated successfully",
      data: result.rows[0]
    });

  } catch (error) {
    logger.error("SUBSCRIPTION_UPDATE_ERROR", {
      requestId,
      error: error.message,
      stack: error.stack
    });
    return res.status(500).json({
      success: false,
      message: "Failed to update subscription"
    });
  }
};

// DELETE subscription plan
exports.deleteSubscription = async (req, res) => {
  const requestId = req.headers["x-request-id"] || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  
  try {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const { id } = req.params;

    // Check if plan exists and has hotels using it
    const planInfo = await db.query(`
      SELECT 
        sp.*,
        COUNT(h.id) as hotels_using
      FROM subscription_plans sp
      LEFT JOIN hotels h ON h.subscription_plan_id = sp.id
      WHERE sp.id = $1
      GROUP BY sp.id
    `, [id]);

    if (planInfo.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Subscription plan not found"
      });
    }

    const hotelsUsing = parseInt(planInfo.rows[0].hotels_using) || 0;

    if (hotelsUsing > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete plan. ${hotelsUsing} hotel(s) are currently using this plan.`
      });
    }

    // Delete the plan
    await db.query("DELETE FROM subscription_plans WHERE id = $1", [id]);

    // Log activity
    await db.query(`
      INSERT INTO activity_logs (id, user_id, user_type, action, resource_type, resource_id, details, created_at)
      VALUES (uuid_generate_v4(), $1, 'main_admin', 'DELETE_SUBSCRIPTION', 'subscription_plan', $2, $3, NOW())
    `, [req.admin.id, id, JSON.stringify(planInfo.rows[0])]);

    // Clear relevant cache
    clearCache(`subscription_${id}`);
    clearCache('subscriptions_list');

    logger.info("SUBSCRIPTION_DELETED", {
      requestId,
      adminId: req.admin.id,
      planId: id
    });

    return res.json({
      success: true,
      message: "Subscription plan deleted successfully"
    });

  } catch (error) {
    logger.error("SUBSCRIPTION_DELETE_ERROR", {
      requestId,
      error: error.message,
      stack: error.stack
    });
    return res.status(500).json({
      success: false,
      message: "Failed to delete subscription"
    });
  }
};

// TOGGLE subscription plan status
exports.toggleSubscriptionStatus = async (req, res) => {
  const requestId = req.headers["x-request-id"] || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  
  try {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const { id } = req.params;

    const result = await db.query(`
      UPDATE subscription_plans
      SET is_active = NOT is_active
      WHERE id = $1
      RETURNING id, plan_name, is_active
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Subscription plan not found"
      });
    }

    // Log activity
    await db.query(`
      INSERT INTO activity_logs (id, user_id, user_type, action, resource_type, resource_id, details, created_at)
      VALUES (uuid_generate_v4(), $1, 'main_admin', 'TOGGLE_SUBSCRIPTION_STATUS', 'subscription_plan', $2, $3, NOW())
    `, [req.admin.id, id, JSON.stringify(result.rows[0])]);

    // Clear relevant cache
    clearCache(`subscription_${id}`);
    clearCache('subscriptions_list');

    logger.info("SUBSCRIPTION_STATUS_TOGGLED", {
      requestId,
      adminId: req.admin.id,
      planId: id,
      newStatus: result.rows[0].is_active
    });

    return res.json({
      success: true,
      message: `Subscription plan ${result.rows[0].is_active ? 'activated' : 'deactivated'} successfully`,
      data: result.rows[0]
    });

  } catch (error) {
    logger.error("SUBSCRIPTION_STATUS_TOGGLE_ERROR", {
      requestId,
      error: error.message,
      stack: error.stack
    });
    return res.status(500).json({
      success: false,
      message: "Failed to toggle subscription status"
    });
  }
};

// Clear cache endpoint (for admin use)
exports.clearCache = async (req, res) => {
  try {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const { pattern } = req.query;
    if (pattern) {
      clearCache(pattern);
    } else {
      cache.clear();
    }

    return res.json({
      success: true,
      message: "Cache cleared successfully"
    });

  } catch (error) {
    logger.error("CACHE_CLEAR_ERROR", { error: error.message });
    return res.status(500).json({
      success: false,
      message: "Failed to clear cache"
    });
  }
};

// ======================
// EXPORT DASHBOARD DATA (CSV)
// ======================
exports.exportDashboardData = async (req, res) => {
  try {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const { type = 'hotels' } = req.query;

    let data;
    let filename;
    let headers;

    switch(type) {
      case 'hotels':
        const hotels = await db.query(`
          SELECT 
            h.id, h.hotel_name, h.admin_email, h.hotel_phone, h.is_active,
            h.city, h.country, h.subscription_status,
            COALESCE(sp.plan_name, 'No Plan') as plan_name,
            TO_CHAR(h.created_at, 'YYYY-MM-DD') as created_at,
            (SELECT COUNT(*) FROM staff s WHERE s.hotel_id = h.id) as staff_count,
            (SELECT COUNT(*) FROM orders o WHERE o.hotel_id = h.id) as order_count
          FROM hotels h
          LEFT JOIN subscription_plans sp ON sp.id = h.subscription_plan_id
          ORDER BY h.created_at DESC
        `);
        data = hotels.rows;
        filename = `hotels_export_${new Date().toISOString().split('T')[0]}.csv`;
        headers = ['ID', 'Hotel Name', 'Admin Email', 'Phone', 'Active', 'City', 'Country', 'Subscription', 'Plan', 'Created', 'Staff Count', 'Order Count'];
        break;

      case 'orders':
        const orders = await db.query(`
          SELECT 
            o.id, o.order_number, h.hotel_name, o.total_amount, 
            o.status, o.payment_status, o.payment_method,
            TO_CHAR(o.created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at,
            s.full_name as waiter_name
          FROM orders o
          JOIN hotels h ON h.id = o.hotel_id
          LEFT JOIN staff s ON s.id = o.waiter_id
          WHERE o.status = 'completed'
          ORDER BY o.created_at DESC
        `);
        data = orders.rows;
        filename = `orders_export_${new Date().toISOString().split('T')[0]}.csv`;
        headers = ['ID', 'Order Number', 'Hotel', 'Amount', 'Status', 'Payment Status', 'Payment Method', 'Date', 'Waiter'];
        break;

      case 'staff':
        const staff = await db.query(`
          SELECT 
            s.id, s.staff_code, s.full_name, s.email, s.phone_number,
            s.role, s.is_active, h.hotel_name,
            TO_CHAR(s.last_login, 'YYYY-MM-DD HH24:MI:SS') as last_login,
            TO_CHAR(s.created_at, 'YYYY-MM-DD') as created_at
          FROM staff s
          JOIN hotels h ON h.id = s.hotel_id
          ORDER BY s.created_at DESC
        `);
        data = staff.rows;
        filename = `staff_export_${new Date().toISOString().split('T')[0]}.csv`;
        headers = ['ID', 'Staff Code', 'Name', 'Email', 'Phone', 'Role', 'Active', 'Hotel', 'Last Login', 'Created'];
        break;

      default:
        return res.status(400).json({
          success: false,
          message: "Invalid export type"
        });
    }

    // Convert to CSV efficiently
    const csvRows = [];
    csvRows.push(headers.join(','));
    
    for (const row of data) {
      const values = headers.map(header => {
        const key = header.toLowerCase().replace(/ /g, '_').replace(/[^a-z0-9_]/g, '');
        const value = row[key] || row[header.toLowerCase()] || '';
        return `"${String(value).replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvRows.join('\n'));

  } catch (error) {
    logger.error("ADMIN_EXPORT_ERROR", { error: error.message });
    return res.status(500).json({
      success: false,
      message: "Failed to export data"
    });
  }
};



// GET ALL HOTELS FOR ADMIN DASHBOARD
exports.getAllHotelsForAdminDashboard = async (req, res) => {
  const requestId =
    req.headers["x-request-id"] ||
    `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  try {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const {
      page = 1,
      limit = 10,
      search = "",
      status = "all",
      subscription_status = "all",
      plan_id = "",
      sort_by = "created_at",
      sort_order = "desc",
    } = req.query;

    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
    const parsedLimit = Math.max(parseInt(limit, 10) || 10, 1);
    const offset = (parsedPage - 1) * parsedLimit;

    const allowedSortFields = {
      created_at: "h.created_at",
      hotel_name: "h.hotel_name",
      city: "h.city",
      country: "h.country",
      subscription_status: "h.subscription_status",
      is_active: "h.is_active",
      total_revenue: "total_revenue",
      total_orders: "total_orders",
      staff_count: "staff_count",
    };

    const finalSortBy = allowedSortFields[sort_by] || "h.created_at";
    const finalSortOrder = String(sort_order).toLowerCase() === "asc" ? "ASC" : "DESC";

    let whereClause = `WHERE 1=1`;
    const queryParams = [];
    let paramIndex = 1;

    if (search) {
      whereClause += `
        AND (
          h.hotel_name ILIKE $${paramIndex}
          OR h.hotel_slug ILIKE $${paramIndex}
          OR h.admin_email ILIKE $${paramIndex}
          OR h.admin_name ILIKE $${paramIndex}
          OR h.hotel_phone ILIKE $${paramIndex}
          OR h.city ILIKE $${paramIndex}
          OR h.country ILIKE $${paramIndex}
        )
      `;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    if (status !== "all") {
      whereClause += ` AND h.is_active = $${paramIndex}`;
      queryParams.push(status === "active");
      paramIndex++;
    }

    if (subscription_status !== "all") {
      whereClause += ` AND h.subscription_status = $${paramIndex}`;
      queryParams.push(subscription_status);
      paramIndex++;
    }

    if (plan_id) {
      whereClause += ` AND h.subscription_plan_id = $${paramIndex}`;
      queryParams.push(plan_id);
      paramIndex++;
    }

    // Total count query
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM hotels h
      ${whereClause}
    `;

    const countResult = await db.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0]?.total || 0, 10);

    // Main hotels query
    const hotelsQuery = `
      SELECT
        h.id,
        h.hotel_name,
        h.hotel_slug,
        h.admin_name,
        h.admin_email,
        h.admin_phone,
        h.hotel_phone,
        h.hotel_address,
        h.city,
        h.country,
        h.timezone,
        h.currency,
        h.tax_rate,
        h.service_charge,
        h.subscription_status,
        h.subscription_start_date,
        h.subscription_end_date,
        h.trial_ends_at,
        h.max_staff_allowed,
        h.max_tables_allowed,
        h.max_menu_items_allowed,
        h.is_active,
        h.is_verified,
        h.last_login,
        h.created_at,
        h.updated_at,

        COALESCE(sp.id, NULL) AS subscription_plan_id,
        COALESCE(sp.plan_name, 'No Plan') AS plan_name,
        COALESCE(sp.plan_code, 'NO_PLAN') AS plan_code,
        COALESCE(sp.price_per_year, 0) AS price_per_year,

        COALESCE(st.staff_count, 0) AS staff_count,
        COALESCE(tb.table_count, 0) AS table_count,
        COALESCE(mi.menu_count, 0) AS menu_count,
        COALESCE(ord.total_orders, 0) AS total_orders,
        COALESCE(ord.total_revenue, 0) AS total_revenue,
        ord.last_order_date

      FROM hotels h
      LEFT JOIN subscription_plans sp
        ON sp.id = h.subscription_plan_id

      LEFT JOIN (
        SELECT hotel_id, COUNT(*) AS staff_count
        FROM staff
        GROUP BY hotel_id
      ) st ON st.hotel_id = h.id

      LEFT JOIN (
        SELECT hotel_id, COUNT(*) AS table_count
        FROM hotel_tables
        GROUP BY hotel_id
      ) tb ON tb.hotel_id = h.id

      LEFT JOIN (
        SELECT hotel_id, COUNT(*) AS menu_count
        FROM menu_items
        GROUP BY hotel_id
      ) mi ON mi.hotel_id = h.id

      LEFT JOIN (
        SELECT
          hotel_id,
          COUNT(*) FILTER (WHERE status = 'completed') AS total_orders,
          COALESCE(SUM(total_amount) FILTER (WHERE status = 'completed'), 0) AS total_revenue,
          MAX(created_at) FILTER (WHERE status = 'completed') AS last_order_date
        FROM orders
        GROUP BY hotel_id
      ) ord ON ord.hotel_id = h.id

      ${whereClause}
      ORDER BY ${finalSortBy} ${finalSortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const hotelsResult = await db.query(hotelsQuery, [
      ...queryParams,
      parsedLimit,
      offset,
    ]);

    logger.info("ADMIN_HOTELS_FETCHED", {
      requestId,
      adminId: req.admin.id,
      page: parsedPage,
      limit: parsedLimit,
      total,
      count: hotelsResult.rows.length,
    });

    return res.json({
      success: true,
      data: hotelsResult.rows.map((row) => ({
        id: row.id,
        hotelName: row.hotel_name,
        hotelSlug: row.hotel_slug,

        admin: {
          name: row.admin_name,
          email: row.admin_email,
          phone: row.admin_phone,
        },

        contact: {
          hotelPhone: row.hotel_phone,
          address: row.hotel_address,
          city: row.city,
          country: row.country,
          timezone: row.timezone,
          currency: row.currency,
        },

        subscription: {
          planId: row.subscription_plan_id,
          planName: row.plan_name,
          planCode: row.plan_code,
          pricePerYear: parseFloat(row.price_per_year || 0),
          status: row.subscription_status,
          startDate: row.subscription_start_date,
          endDate: row.subscription_end_date,
          trialEndsAt: row.trial_ends_at,
        },

        limits: {
          maxStaffAllowed: parseInt(row.max_staff_allowed || 0, 10),
          maxTablesAllowed: parseInt(row.max_tables_allowed || 0, 10),
          maxMenuItemsAllowed: parseInt(row.max_menu_items_allowed || 0, 10),
        },

        usage: {
          staffCount: parseInt(row.staff_count || 0, 10),
          tableCount: parseInt(row.table_count || 0, 10),
          menuCount: parseInt(row.menu_count || 0, 10),
          totalOrders: parseInt(row.total_orders || 0, 10),
          totalRevenue: parseFloat(row.total_revenue || 0),
          lastOrderDate: row.last_order_date,
        },

        status: {
          isActive: row.is_active,
          isVerified: row.is_verified,
        },

        activity: {
          lastLogin: row.last_login,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        },
      })),
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        pages: Math.ceil(total / parsedLimit),
      },
      filters: {
        search,
        status,
        subscription_status,
        plan_id,
        sort_by,
        sort_order: finalSortOrder.toLowerCase(),
      },
    });
  } catch (error) {
    logger.error("ADMIN_HOTELS_FETCH_ERROR", {
      requestId,
      error: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      success: false,
      message: "Failed to fetch hotels",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};