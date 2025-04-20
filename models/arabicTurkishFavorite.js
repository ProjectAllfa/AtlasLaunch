const mongoose = require('mongoose');

// Define the schema for Arabic/Turkish favorites
const arabicTurkishFavoritesSchema = new mongoose.Schema({
  username: { type: String, required: true },  // To track which user this favorites list belongs to
  tmdbIds: [{ type: Number, required: true }],  // Array to store TMDB IDs
  favorites: [
    {
      tmdbId: { type: Number, required: true },  // TMDB ID for the series
      mediaType: { type: String, enum: ['tv'], required: true },  // mediaType is always 'tv' for Arabic/Turkish series
    }
  ]
});

// Create the model
const ArabicTurkishFavorite = mongoose.model('ArabicTurkishFavorite', arabicTurkishFavoritesSchema, 'arabic-turkish-favorites');

module.exports = ArabicTurkishFavorite;
