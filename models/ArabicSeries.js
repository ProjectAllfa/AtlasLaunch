const mongoose = require('mongoose');

const ArabicSeriesSchema = new mongoose.Schema({
    series_name: { type: String, required: true },
    id: { type: String, required: true, unique: true }, 
    type: { type: String, required: true },
    description: { type: String, required: true },
    poster: { type: String, required: true }
}, { collection: 'arabicseries' }); // ✅ Ensure it uses the correct collection name

const ArabicSeries = mongoose.model('ArabicSeries', ArabicSeriesSchema);
module.exports = ArabicSeries;
