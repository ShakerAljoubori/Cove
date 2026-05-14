const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const MomentReaction = require('../models/MomentReaction');

const auth = (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) return res.status(401).json({ msg: 'No token' });
  try { req.user = jwt.verify(token, process.env.JWT_SECRET); next(); }
  catch { res.status(401).json({ msg: 'Token is not valid' }); }
};

const ALLOWED_EMOJIS = ['🔥', '😭', '❤️', '💀', '⚡'];

// GET aggregated reactions for an episode
// Returns: [{ bucket, count, topEmoji }]
router.get('/:seriesId/:episodeId', async (req, res) => {
  try {
    const { seriesId, episodeId } = req.params;

    const results = await MomentReaction.aggregate([
      { $match: { seriesId, episodeId: Number(episodeId) } },
      // Group by bucket + emoji to get per-emoji counts
      { $group: { _id: { bucket: '$bucket', emoji: '$emoji' }, count: { $sum: 1 } } },
      // Roll up to per-bucket totals, keep emoji breakdown
      { $group: {
          _id: '$_id.bucket',
          count: { $sum: '$count' },
          emojis: { $push: { emoji: '$_id.emoji', count: '$count' } },
        }
      },
      // Pick the most-used emoji in each bucket as topEmoji
      { $project: {
          _id: 0,
          bucket: '$_id',
          count: 1,
          topEmoji: {
            $getField: {
              field: 'emoji',
              input: { $first: { $sortArray: { input: '$emojis', sortBy: { count: -1 } } } },
            },
          },
        }
      },
      { $sort: { bucket: 1 } },
    ]);

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST — react at a timestamp (toggle: reacting again removes the reaction)
router.post('/', auth, async (req, res) => {
  try {
    const { seriesId, episodeId, timestamp, emoji } = req.body;

    if (!ALLOWED_EMOJIS.includes(emoji))
      return res.status(400).json({ msg: 'Invalid emoji' });

    const bucket = Math.floor(Number(timestamp) / 5);

    const existing = await MomentReaction.findOne({
      seriesId,
      episodeId: Number(episodeId),
      userId: req.user.id,
      bucket,
      emoji,
    });

    if (existing) {
      await existing.deleteOne();
      return res.json({ added: false });
    }

    await MomentReaction.create({
      seriesId,
      episodeId: Number(episodeId),
      userId: req.user.id,
      bucket,
      emoji,
    });

    res.status(201).json({ added: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
