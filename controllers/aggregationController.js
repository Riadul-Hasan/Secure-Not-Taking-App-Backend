const mongoose = require('mongoose');
const User = require('../models/User');
const { paginate, buildMeta } = require('../utils/pagination');

const MAX_MEMBERS = 5;

exports.groupByInterests = async (req, res, next) => {
  try {
    const { page, limit, skip } = paginate(req.query);
    const [result] = await User.aggregate([
      {
        $unwind: {
          path: '$interests',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: '$interests',
          count: { $sum: 1 },
          members: {
            $push: {
              _id: '$_id',
              name: '$name',
              email: '$email',
              role: '$role',
            },
          },
        },
      },
      {
        $project: {
          interest: {
            $cond: [{ $eq: [{ $ifNull: ['$_id', ''] }, ''] }, 'No interests', '$_id'],
          },
          count: '$count',
          memberCount: '$count',
          members: { $slice: ['$members', MAX_MEMBERS] },
        },
      },
      { $sort: { count: -1, interest: 1 } },
      {
        $facet: {
          data: [{ $skip: skip }, { $limit: limit }],
          summary: [
            {
              $group: {
                _id: null,
                totalUsers: { $sum: '$count' },
                usersWithoutInterests: {
                  $sum: {
                    $cond: [{ $eq: ['$interest', 'No interests'] }, '$count', 0],
                  },
                },
                groupCount: { $sum: 1 },
              },
            },
          ],
        },
      },
    ]);

    const grouped = result?.data || [];
    const summary = result?.summary?.[0] || {
      totalUsers: 0,
      usersWithoutInterests: 0,
      groupCount: 0,
    };

    res.json({
      success: true,
      data: grouped,
      summary: {
        totalUsers: summary.totalUsers,
        usersWithoutInterests: summary.usersWithoutInterests,
      },
      ...buildMeta(summary.groupCount, page, limit),
    });
  } catch (error) {
    next(error);
  }
};

exports.userPosts = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { page, limit, skip } = paginate(req.query);

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({ success: false, message: 'Invalid user id' });
      return;
    }

    const result = await User.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(userId) } },
      {
        $lookup: {
          from: 'posts',
          let: { userId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$user', '$$userId'] } } },
            {
              $facet: {
                data: [
                  { $sort: { createdAt: -1 } },
                  { $skip: skip },
                  { $limit: limit },
                ],
                metadata: [{ $count: 'total' }],
              },
            },
          ],
          as: 'postPage',
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          role: 1,
          interests: 1,
          createdAt: 1,
          postPage: { $arrayElemAt: ['$postPage', 0] },
        },
      },
    ]);

    if (!result.length) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const [user] = result;
    const posts = user.postPage?.data || [];
    const total = user.postPage?.metadata?.[0]?.total || 0;

    res.json({
      success: true,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          interests: user.interests,
          createdAt: user.createdAt,
        },
        posts,
      },
      ...buildMeta(total, page, limit),
    });
  } catch (error) {
    next(error);
  }
};