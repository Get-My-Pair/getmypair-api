/**
 * Cobbler Home Dashboard – GET /api/cobbler/home/dashboard
 * Returns profile summary, earnings (from payments), job counts (from jobs).
 * If no cobbler profile exists, returns 200 with stub data and profileComplete: false.
 */
const CobblerProfile = require('../models/cobblerProfile.model');
const Job = require('../models/job.model');
const Payment = require('../models/payment.model');
const { success, error: errorResponse } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * GET /api/cobbler/home/dashboard
 * 1. Validate JWT (done by auth + role middleware)
 * 2. actorType == COBBER (done by role middleware)
 * 3. Fetch profile from cobbler_profiles (if none, return stub)
 * 4. Calculate earnings from payments
 * 5. Count jobs from jobs collection
 * 6. Return dashboard summary
 */
const getDashboard = async (req, res) => {
    try {
        const userId = req.user._id;
        const profile = await CobblerProfile.findOne({ userId }).select(
            'name profileImage verificationStatus isOnline'
        );

        if (!profile) {
            const dashboard = {
                profileComplete: false,
                profile: {
                    name: req.user.name || 'Cobbler',
                    profileImage: null,
                    verificationStatus: 'pending',
                    isOnline: true,
                },
                earnings: { today: 0, weekly: 0, total: 0 },
                jobs: { newRequests: 0, active: 0, completed: 0 },
            };
            return success(res, 'Complete your profile to get started', dashboard);
        }

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const startOfWeek = new Date(startOfToday);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

        const [earningsResult, newRequests, activeJobs, completedJobs] = await Promise.all([
            Payment.aggregate([
                { $match: { cobblerId: userId, paymentStatus: 'completed' } },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$amount' },
                        today: {
                            $sum: {
                                $cond: [{ $gte: ['$createdAt', startOfToday] }, '$amount', 0],
                            },
                        },
                        weekly: {
                            $sum: {
                                $cond: [{ $gte: ['$createdAt', startOfWeek] }, '$amount', 0],
                            },
                        },
                    },
                },
            ]),
            Job.countDocuments({ cobblerId: userId, status: 'new' }),
            Job.countDocuments({ cobblerId: userId, status: 'accepted' }),
            Job.countDocuments({ cobblerId: userId, status: 'completed' }),
        ]);

        const earnings = earningsResult[0] || { today: 0, weekly: 0, total: 0 };

        const dashboard = {
            profileComplete: true,
            profile: {
                name: profile.name || 'Cobbler',
                profileImage: profile.profileImage || null,
                verificationStatus: profile.verificationStatus || 'pending',
                isOnline: profile.isOnline !== false,
            },
            earnings: {
                today: earnings.today || 0,
                weekly: earnings.weekly || 0,
                total: earnings.total || 0,
            },
            jobs: {
                newRequests: newRequests || 0,
                active: activeJobs || 0,
                completed: completedJobs || 0,
            },
        };

        return success(res, 'Dashboard retrieved successfully', dashboard);
    } catch (err) {
        logger.error(`Cobbler dashboard error: ${err.message}`);
        return errorResponse(res, err.message, 500);
    }
};

module.exports = { getDashboard };
