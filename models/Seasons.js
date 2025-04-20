const mongoose = require("mongoose");

const EpisodeSchema = new mongoose.Schema({
  title: String,
  url: String,
  info: {
    poster: String,
    story: String,
  },
});

const SeasonSchema = new mongoose.Schema({
  season_number: Number,
  real_season_number: Number,
  episodes: [EpisodeSchema],
});

const SeriesSeasonsSchema = new mongoose.Schema({
  series_name: String,
  id: String, // Matches Arabic/Turkish series ID
  type: String,
  description: String,
  seasons: [SeasonSchema],
});

const SeriesSeasons = mongoose.model("SeriesSeasons", SeriesSeasonsSchema);
module.exports = SeriesSeasons;
