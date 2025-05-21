const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const PDF = require('../models/PDF');
const User = require('../models/User');

// Get analytics data
router.get('/', auth, async (req, res) => {
  console.log('Analytics route hit:', {
    userId: req.user.id,
    path: req.path,
    method: req.method
  });

  try {
    const userId = req.user.id;

    // Get views and downloads for the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    console.log('Fetching analytics data:', {
      userId,
      sevenDaysAgo
    });

    // Views by day
    const viewsByDay = await PDF.aggregate([
      {
        $match: {
          owner: userId,
          'views.timestamp': { $gte: sevenDaysAgo }
        }
      },
      {
        $unwind: '$views'
      },
      {
        $match: {
          'views.timestamp': { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$views.timestamp' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Downloads by day
    const downloadsByDay = await PDF.aggregate([
      {
        $match: {
          owner: userId,
          'downloads.timestamp': { $gte: sevenDaysAgo }
        }
      },
      {
        $unwind: '$downloads'
      },
      {
        $match: {
          'downloads.timestamp': { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$downloads.timestamp' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Get top 5 PDFs by views
    const topPdfs = await PDF.find({ owner: userId })
      .sort({ 'views.length': -1 })
      .limit(5)
      .select('name views downloads');

    // Get recent user activity
    const userActivity = await PDF.aggregate([
      {
        $match: { owner: userId }
      },
      {
        $project: {
          views: {
            $map: {
              input: '$views',
              as: 'view',
              in: {
                type: 'view',
                description: `Viewed ${'$name'}`,
                timestamp: '$$view.timestamp'
              }
            }
          },
          downloads: {
            $map: {
              input: '$downloads',
              as: 'download',
              in: {
                type: 'download',
                description: `Downloaded ${'$name'}`,
                timestamp: '$$download.timestamp'
              }
            }
          },
          comments: {
            $map: {
              input: '$comments',
              as: 'comment',
              in: {
                type: 'comment',
                description: `Commented on ${'$name'}`,
                timestamp: '$$comment.createdAt'
              }
            }
          }
        }
      },
      {
        $project: {
          activities: {
            $concatArrays: ['$views', '$downloads', '$comments']
          }
        }
      },
      {
        $unwind: '$activities'
      },
      {
        $sort: { 'activities.timestamp': -1 }
      },
      {
        $limit: 10
      },
      {
        $replaceRoot: { newRoot: '$activities' }
      }
    ]);

    res.json({
      viewsByDay: viewsByDay.map(item => ({
        date: item._id,
        count: item.count
      })),
      downloadsByDay: downloadsByDay.map(item => ({
        date: item._id,
        count: item.count
      })),
      topPdfs: topPdfs.map(pdf => ({
        _id: pdf._id,
        name: pdf.name,
        views: pdf.views.length,
        downloads: pdf.downloads.length
      })),
      userActivity: userActivity.map(activity => ({
        ...activity,
        timestamp: activity.timestamp instanceof Date ? 
          activity.timestamp.toISOString() : 
          new Date(activity.timestamp).toISOString()
      }))
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ message: 'Error fetching analytics data' });
  }
});

module.exports = router; 