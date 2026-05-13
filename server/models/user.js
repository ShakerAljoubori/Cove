const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar:   { type: String, default: '' },
  date:     { type: Date, default: Date.now },
  favorites: {
    seriesIds:     { type: [String], default: [] },
    videoEpisodes: { type: [{ seriesId: String, episodeId: Number, _id: false }], default: [] },
  }
});

module.exports = mongoose.model('User', UserSchema);