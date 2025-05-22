const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const PDF = require('../models/PDF');
const User = require('../models/User');
const mongoose = require('mongoose');

// @route   GET /dashboard
// @desc    Get dashboard data
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    console.log('Fetching dashboard data for user:', req.user.id);

    // Convert string ID to ObjectId
    const userId = new mongoose.Types.ObjectId(req.user.id);

    // Get total statistics using aggregation
    const stats = await PDF.aggregate([
      {
        $match: {
          $or: [
            { owner: userId },
            { sharedWith: userId },
            { isPublic: true }
          ]
        }
      },
      {
        $group: {
          _id: null,
          totalPdfs: { $sum: 1 },
          totalViews: { 
            $sum: { 
              $cond: [
                { $isArray: "$views" },
                { $size: "$views" },
                0
              ]
            }
          },
          totalDownloads: { 
            $sum: { 
              $cond: [
                { $isArray: "$downloads" },
                { $size: "$downloads" },
                0
              ]
            }
          },
          totalComments: {
            $sum: {
              $add: [
                { $size: { $ifNull: ['$comments', []] } },
                {
                  $reduce: {
                    input: { $ifNull: ['$comments', []] },
                    initialValue: 0,
                    in: { $add: ['$$value', { $size: { $ifNull: ['$$this.replies', []] } }] }
                  }
                }
              ]
            }
          }
        }
      }
    ]);

    console.log('Stats aggregation result:', stats);

    // Get recent PDFs
    const recentPdfs = await PDF.find({
      $or: [
        { owner: userId },
        { sharedWith: userId },
        { isPublic: true }
      ]
    })
    .sort({ updatedAt: -1 })
    .limit(5)
    .populate('owner', 'name')
    .lean();

    console.log('Recent PDFs found:', recentPdfs.length);

    // Get recent activity
    const recentActivity = await PDF.aggregate([
      {
        $match: {
          $or: [
            { owner: userId },
            { sharedWith: userId },
            { isPublic: true }
          ]
        }
      },
      {
        $unwind: {
          path: '$comments',
          preserveNullAndEmptyArrays: false
        }
      },
      {
        $sort: { 'comments.createdAt': -1 }
      },
      {
        $limit: 10
      },
      {
        $lookup: {
          from: 'users',
          localField: 'comments.user',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          comment: '$comments',
          user: { $arrayElemAt: ['$userDetails', 0] }
        }
      }
    ]);

    console.log('Recent activity found:', recentActivity.length);

    // Format the response
    const response = {
      stats: stats[0] || {
        totalPdfs: 0,
        totalViews: 0,
        totalDownloads: 0,
        totalComments: 0
      },
      recentPdfs,
      recentActivity: recentActivity.map(activity => ({
        pdfId: activity._id,
        pdfName: activity.name,
        type: 'comment',
        content: activity.comment?.content,
        user: activity.user ? {
          id: activity.user._id,
          name: activity.user.name
        } : null,
        timestamp: activity.comment?.createdAt
      }))
    };

    console.log('Sending dashboard response:', {
      totalPdfs: response.stats.totalPdfs,
      totalViews: response.stats.totalViews,
      totalDownloads: response.stats.totalDownloads,
      totalComments: response.stats.totalComments,
      recentPdfsCount: response.recentPdfs.length,
      recentActivityCount: response.recentActivity.length
    });

    res.json(response);
  } catch (err) {
    console.error('Dashboard error details:', {
      message: err.message,
      stack: err.stack,
      name: err.name
    });
    res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

module.exports = router; 