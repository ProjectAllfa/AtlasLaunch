const mongoose = require('mongoose');

const FavoriteSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true }, // One entry per user
    favorites: [{ 
        tmdbId: { type: Number, required: true }, 
        mediaType: { type: String, enum: ['movie', 'tv'], required: true } // ✅ Store type
    }]
}, { collection: 'favorites' });

module.exports = mongoose.model('Favorite', FavoriteSchema);
