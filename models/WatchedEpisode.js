const mongoose = require('mongoose');

const watchedEpisodeSchema = new mongoose.Schema({
  username: { type: String, required: true, index: true }, // Faster lookups
  seriesId: { type: String, required: true, index: true },
  seasonNumber: { type: Number, required: true },
  episodeNumber: { type: Number, required: true },
  watchedAt: { type: Date, default: Date.now }, // Timestamp when watched
});

const WatchedEpisode = mongoose.model('WatchedEpisode', watchedEpisodeSchema);
module.exports = WatchedEpisode;
