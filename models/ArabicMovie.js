const mongoose = require("mongoose");

const ArabicMovieSchema = new mongoose.Schema({
  title: String,
  id: String,
  type: String,
  description: String,
  poster: String,
});

const ArabicMovie = mongoose.model("ArabicMovie", ArabicMovieSchema);
module.exports = ArabicMovie;
