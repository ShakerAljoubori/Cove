const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  seriesId:  { type: String, required: true },
  episodeId: { type: Number, required: true },
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bucket:    { type: Number, required: true }, // Math.floor(seconds / 5) — 5-second windows
  emoji:     { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

// One reaction per user per emoji per 5-second bucket
schema.index(
  { seriesId: 1, episodeId: 1, userId: 1, bucket: 1, emoji: 1 },
  { unique: true }
);
schema.index({ seriesId: 1, episodeId: 1 });

module.exports = mongoose.model('MomentReaction', schema);
