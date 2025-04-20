const mongoose = require("mongoose");

const TurkishSeriesSchema = new mongoose.Schema({
  series_name: { type: String, required: true },
  id: { type: String, required: true, unique: true },
  description: { type: String },
  type: { type: String },
  poster: { type: String }
});

module.exports = mongoose.model("TurkishSeries", TurkishSeriesSchema);
