const express = require('express');
const bcrypt = require('bcryptjs');
const path = require('path');
const axios = require('axios');
const app = express();
const port = 3000;
const fs = require('fs');
const Fuse = require('fuse.js'); // For fuzzy search
const NodeCache = require("node-cache");
const jwt = require('jsonwebtoken'); // JWT for session management
const User = require('./models/User');
const Favorite = require('./models/Favorite'); // Import the new model
const cookieParser = require('cookie-parser');
const cors = require('cors');
const Notification = require('./models/Notification'); // Ensure this path is correct
const ArabicSeries = require('./models/ArabicSeries');
const ArabicMovie = require("./models/ArabicMovie");
const TurkishSeries = require("./models/TurkishSeries");
const SeriesSeasons = require("./models/Seasons");
const WatchedEpisode = require('./models/WatchedEpisode'); // Import the new model 
const ArabicTurkishFavorite = require('./models/arabicTurkishFavorite'); // Adjust the path according to your file structure
const Agent = require('./models/agent'); // Import the agent model
const Deposit = require('./models/deposits'); // Import the Deposit model
const { generateBEP20Wallet } = require("./utils/walletUtils");
const { encryptPrivateKey } = require('./utils/encryptUtils'); // Import the encrypt function
const { decryptPrivateKey } = require("./utils/decryptUtils"); // Import decryption function
require('dotenv').config();


// Set up cache with a 1-hour TTL (Time To Live)
const myCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });

const router = express.Router();  // <-- Define router


const TMDB_API_URL = 'https://api.themoviedb.org/3';  // Make sure the base URL is defined

// Replace with your actual TMDb bearer token
const TMDB_BEARER_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI3MmJhMTBjNDI5OTE0MTU3MzgwOGQyNzEwNGVkMThmYSIsInN1YiI6IjY0ZjVhNTUwMTIxOTdlMDBmZWE5MzdmMSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.84b7vWpVEilAbly4RpS01E9tyirHdhSXjcpfmTczI3Q';

// Replace with your actual TMDb API key
const TMDB_API_KEY = '7739f988085771ce86875f09588b1e86'; // Your API key here

// Replace with your actual YouTube Data API key
const YOUTUBE_API_KEY = 'AIzaSyBx-Ezb7kUPmPQZmtiCkmXckocQWKG_4vk';


const mongoose = require('mongoose');

app.use(express.json()); // Middleware to parse JSON

app.use(cookieParser()); // Allows reading cookies


// Your MongoDB connection string (replace with your actual details)
const mongoURI = 'mongodb+srv://abcnewzpr:wQ9R1V5yTcjHgOme@cluster0.hvnod.mongodb.net/movie_stream?retryWrites=true&w=majority';

const SECRET_KEY = "f9a8d0e5a3f24c4bb1eaf418d48c26f4f4e1f9cd09a5dfe8a5b7bc5d89c6a3a4";  



// Connect to MongoDB
// ✅ Connect once and keep the connection open
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));

// Allow frontend to send credentials (cookies)
app.use(cors({
  origin: "https://cimaway.com",  // Replace with your production frontend URL
  credentials: true
}));

// REQUIRE ADMIN to check
const requireAdmin = async (req, res, next) => {
  const sessionToken = req.cookies.sessionToken;
  if (!sessionToken) {
      console.log("❌ No session token found. Redirecting to login.");
      return res.redirect('/login');
  }

  try {
      const decoded = jwt.verify(sessionToken, SECRET_KEY);
      const user = await User.findOne({ username: decoded.username });

      console.log("🔍 User found:", user); // ✅ Debug log

      if (!user) {
          console.log("❌ User not found in database. Redirecting.");
          return res.redirect('/login');
      }

      if (user.deviceSession !== sessionToken) {
          console.log("❌ Session mismatch. Redirecting.");
          return res.redirect('/login');
      }

      console.log("🔎 Checking isAdmin type:", typeof user.isAdmin, "Value:", user.isAdmin);

      if (!user.isAdmin) {
          console.log("❌ User is not an admin. Redirecting to home.");
          return res.redirect('/');
      }

      console.log("✅ Admin access granted.");
      req.user = user;
      next();
  } catch (error) {
      console.log("❌ Error verifying admin session:", error.message);
      return res.redirect('/login');
  }
};




// Middleware to check authentication
const requireAuth = async (req, res, next) => {
  const sessionToken = req.cookies.sessionToken;
  if (!sessionToken) {
      return res.status(401).json({ message: "Unauthorized. Please log in." });
  }

  try {
      // Verify session token
      const decoded = jwt.verify(sessionToken, SECRET_KEY);

      // Find user in database
      const user = await User.findOne({ username: decoded.username });

      if (!user || user.deviceSession !== sessionToken) {
          return res.status(401).json({ message: "Session expired. Please log in again." });
      }

      console.log(`🔍 Checking user status: ${user.username}, Active: ${user.active}, Expiry: ${user.subscriptionExpiry}`);

      // ✅ Instead of redirecting, send a JSON response
      if (!user.active || user.subscriptionExpiry < new Date()) {
          console.log(`🚨 ${user.username} is inactive or expired! Sending redirect response.`);
          return res.status(403).json({ message: "Subscription expired. Redirecting...", redirect: "/subscription-ended" });
      }

      req.user = user; // Store user data for later use
      next();
  } catch (error) {
      return res.status(401).json({ message: "Invalid session. Please log in again." });
  }
};





// Check Sessions
app.get('/api/check-session', requireAuth, async (req, res) => {
  try {
      const sessionToken = req.cookies.sessionToken;
      if (!sessionToken) {
          console.log("❌ No session token found.");
          return res.status(401).json({ message: "No active session" });
      }

      const decoded = jwt.verify(sessionToken, SECRET_KEY);
      const user = await User.findOne({ username: decoded.username });

      if (!user || user.deviceSession !== sessionToken) {
          console.log("❌ Session invalid or expired.");
          return res.status(401).json({ message: "Session expired" });
      }

      console.log("✅ Valid session detected for:", user.username);
      return res.json({ message: "Session active", user: user.username });
  } catch (error) {
      console.log("❌ Error verifying session:", error.message);
      return res.status(401).json({ message: "Invalid session" });
  }
});


// Serve admin Panel
app.get('/admin', requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'admin.html')); // Serve admin panel
});



// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Route to serve the main HTML file
app.get('/', async (req, res) => {
  if (!req.cookies.sessionToken) {
      return res.redirect('/login'); // Redirect to login if no session
  }

  try {
      const decoded = jwt.verify(req.cookies.sessionToken, SECRET_KEY);
      const user = await User.findOne({ username: decoded.username });

      if (!user || user.deviceSession !== req.cookies.sessionToken) {
          return res.redirect('/login'); // Redirect if session is invalid
      }

      res.sendFile(path.join(__dirname, 'views', 'index.html')); // Serve main page
  } catch (error) {
      return res.redirect('/login'); // Redirect on error
  }
});


// Serve login page
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

const turkishSeriesFilePath = path.join(__dirname, 'public', 'data', 'turkish_series.json');
// ✅ Define correct paths to the files inside public/data/
const movieFilePath = path.join(__dirname, 'public', 'data', 'mov_tmdb.txt');
const seriesFilePath = path.join(__dirname, 'public', 'data', 'tv_tmdb.txt');

// ✅ Define correct path for eps_tmdb.txt
const episodeFilePath = path.join(__dirname, 'public', 'data', 'eps_tmdb.txt');

// Store available TMDb IDs in memory
let availableMovieIds = new Set();
let availableSeriesIds = new Set();

// Store available Episode IDs in memory
let availableEpisodeIds = new Set();

// ✅ Load movie IDs using the correct path
fs.readFile(movieFilePath, 'utf8', (err, data) => {
    if (!err) {
        availableMovieIds = new Set(data.split('\n').map(id => id.trim()).filter(id => id));
        console.log(`✅ Loaded ${availableMovieIds.size} available movies.`);
    } else {
        console.error('❌ Error loading movie TMDb IDs:', err);
    }
});

// ✅ Load series IDs using the correct path
fs.readFile(seriesFilePath, 'utf8', (err, data) => {
    if (!err) {
        availableSeriesIds = new Set(data.split('\n').map(id => id.trim()).filter(id => id));
        console.log(`✅ Loaded ${availableSeriesIds.size} available series.`);
    } else {
        console.error('❌ Error loading series TMDb IDs:', err);
    }
});


// ✅ Load episode IDs using the correct path
fs.readFile(episodeFilePath, 'utf8', (err, data) => {
  if (!err) {
      availableEpisodeIds = new Set(data.split('\n').map(id => id.trim()).filter(id => id));
      console.log(`✅ Loaded ${availableEpisodeIds.size} available episodes.`);
  } else {
      console.error('❌ Error loading episode TMDb IDs:', err);
  }
});





////////////////////


// ✅ API Endpoint to Fetch Available Episode IDs
app.get('/api/episodes/available', (req, res) => {
  res.json({ availableEpisodes: Array.from(availableEpisodeIds) });
});


//////////////////////////////////////////////////////////////////// Route to serve Arabic Series from MongoDB ///////////////////////////////////////////////////////////////

// ✅ Get All Arabic Series
app.get('/api/arabic-series', async (req, res) => {
  try {
      const series = await ArabicSeries.find(); // Fetch all series from MongoDB
      res.json(series);
  } catch (error) {
      console.error("Error fetching Arabic series:", error);
      res.status(500).json({ message: "Server error" });
  }
});


// ✅ Get Limited Random Arabic Series (For Homepage - Adjustable count)
app.get('/api/arabic-series/random', async (req, res) => {
  let { limit = 10 } = req.query;
  limit = parseInt(limit);
  const cacheKey = `arabic-series-random-${limit}`;

  // ✅ Check cache
  const cachedData = myCache.get(cacheKey);
  if (cachedData) {
    console.log("Returning random Arabic series (homepage) from cache.");
    return res.json(cachedData);
  }

  try {
    const series = await ArabicSeries.aggregate([{ $sample: { size: limit } }]);

    // ✅ Set cache for 6 hours
    myCache.set(cacheKey, series, 43200);

    res.json(series);
  } catch (error) {
    console.error("Error fetching random Arabic series:", error);
    res.status(500).json({ message: "Server error" });
  }
});



// ✅ Get Limited Random Arabic Series (For View More - Adjustable count)
app.get('/api/arabic-series/view-more', async (req, res) => {
  let { limit = 100 } = req.query;
  limit = parseInt(limit);
  const cacheKey = `arabic-series-view-more-${limit}`;

  // ✅ Check cache
  const cachedData = myCache.get(cacheKey);
  if (cachedData) {
    console.log("Returning random Arabic series (view more) from cache.");
    return res.json(cachedData);
  }

  try {
    const series = await ArabicSeries.aggregate([{ $sample: { size: limit } }]);

    // ✅ Set cache for 6 hours
    myCache.set(cacheKey, series, 43200);

    res.json(series);
  } catch (error) {
    console.error("Error fetching random Arabic series:", error);
    res.status(500).json({ message: "Server error" });
  }
});




// ✅ Search Arabic Series (Returns Only Matching Series)
app.get('/api/arabic-series/search', async (req, res) => {
  try {
      const { query } = req.query;
      if (!query) return res.status(400).json({ message: "Query parameter is required." });

      // ✅ Search for series where the name includes the query (case-insensitive)
      const searchResults = await ArabicSeries.find({
          series_name: { $regex: query, $options: 'i' } // Case-insensitive search
      });

      res.json(searchResults);
  } catch (error) {
      console.error("Error searching Arabic series:", error);
      res.status(500).json({ message: "Server error" });
  }
});

//////////////////////////////////////////////////////////////////// Route to serve Arabic Movies from MongoDB ///////////////////////////////////////////////////////////////

// Route to get full Arabic Movies List
app.get("/api/arabic-movies", async (req, res) => {
  try {
    const movies = await ArabicMovie.find(); // Fetch all movies from MongoDB
    res.json(movies);
  } catch (error) {
    console.error("Error fetching Arabic movies:", error);
    res.status(500).json({ message: "Server error" });
  }
});


// ✅ Get Limited Random Arabic Movies (For Homepage - Adjustable count)
app.get("/api/arabic-movies/random", async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const cacheKey = `arabic-movies-random-${limit}`;

  // ✅ Check cache
  const cachedData = myCache.get(cacheKey);
  if (cachedData) {
    console.log("Returning random Arabic movies (homepage) from cache.");
    return res.json(cachedData);
  }

  try {
    const movies = await ArabicMovie.aggregate([{ $sample: { size: limit } }]);

    // ✅ Cache result for 6 hours
    myCache.set(cacheKey, movies, 43200);

    res.json(movies);
  } catch (error) {
    console.error("Error fetching random Arabic movies:", error);
    res.status(500).json({ message: "Server error" });
  }
});


// ✅ Get Limited Random Arabic Movies (For View More - Adjustable count)
app.get("/api/arabic-movies/view-more", async (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  const cacheKey = `arabic-movies-view-more-${limit}`;

  // ✅ Check cache
  const cachedData = myCache.get(cacheKey);
  if (cachedData) {
    console.log("Returning random Arabic movies (view more) from cache.");
    return res.json(cachedData);
  }

  try {
    const movies = await ArabicMovie.aggregate([{ $sample: { size: limit } }]);

    // ✅ Cache result for 6 hours
    myCache.set(cacheKey, movies, 43200);

    res.json(movies);
  } catch (error) {
    console.error("Error fetching random Arabic movies:", error);
    res.status(500).json({ message: "Server error" });
  }
});


// ✅ Search Arabic Movies (Returns Only Matching Movies)
app.get('/api/arabic-movies/search', async (req, res) => {
  try {
      const { query } = req.query;
      if (!query) return res.status(400).json({ message: "Query parameter is required." });

      // ✅ Search for movies where movie_name includes the query (case-insensitive)
      const searchResults = await ArabicMovie.find({
          movie_name: { $regex: query, $options: 'i' } // ✅ Match based on movie_name
      });

      res.json(searchResults);
  } catch (error) {
      console.error("Error searching Arabic movies:", error);
      res.status(500).json({ message: "Server error" });
  }
});

// ✅ Get a Single Arabic Movie by ID
app.get('/api/arabic-movies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const movie = await ArabicMovie.findOne({ "info.id": id }); // Search by TMDB ID

    if (!movie) {
      return res.status(404).json({ message: "Movie not found" });
    }

    res.json(movie);
  } catch (error) {
    console.error("Error fetching Arabic movie by ID:", error);
    res.status(500).json({ message: "Server error" });
  }
});




//////////////////////////////////////////////////////////////////// Route to serve Turkish Series from MongoDB ///////////////////////////////////////////////////////////////

// ✅ Get All Turkish Series
app.get("/api/turkish-series", async (req, res) => {
  try {
    const series = await TurkishSeries.find();
    res.json(series);
  } catch (error) {
    console.error("Error fetching Turkish series:", error);
    res.status(500).json({ message: "Server error" });
  }
});


// ✅ Get Limited Random Turkish Series (For Homepage - Adjustable count)
app.get("/api/turkish-series/random", async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const cacheKey = `turkish-series-random-${limit}`;

  // ✅ Check cache
  const cachedData = myCache.get(cacheKey);
  if (cachedData) {
    console.log("Returning random Turkish series (homepage) from cache.");
    return res.json(cachedData);
  }

  try {
    const series = await TurkishSeries.aggregate([{ $sample: { size: limit } }]);

    // ✅ Set cache for 6 hours
    myCache.set(cacheKey, series, 43200);

    res.json(series);
  } catch (error) {
    console.error("Error fetching random Turkish series:", error);
    res.status(500).json({ message: "Server error" });
  }
});



// ✅ Get Limited Random Turkish Series (For View More - Adjustable count)
app.get("/api/turkish-series/view-more", async (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  const cacheKey = `turkish-series-view-more-${limit}`;

  // ✅ Check cache
  const cachedData = myCache.get(cacheKey);
  if (cachedData) {
    console.log("Returning random Turkish series (view more) from cache.");
    return res.json(cachedData);
  }

  try {
    const series = await TurkishSeries.aggregate([{ $sample: { size: limit } }]);

    // ✅ Set cache for 6 hours
    myCache.set(cacheKey, series, 43200);

    res.json(series);
  } catch (error) {
    console.error("Error fetching random Turkish series:", error);
    res.status(500).json({ message: "Server error" });
  }
});



// ✅ Search Turkish Series (Returns Only Matching Series)
app.get("/api/turkish-series/search", async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.status(400).json({ message: "Query parameter is required." });

    const searchResults = await TurkishSeries.find({
      series_name: { $regex: query, $options: "i" } // Case-insensitive search
    });

    res.json(searchResults);
  } catch (error) {
    console.error("Error searching Turkish series:", error);
    res.status(500).json({ message: "Server error" });
  }
});


////////////////////////////////////////////////////////// Route to serve Seasons and Episodes from Mongo ///////////////////////////////////////////////////////////////////////////////

// ✅ Get Seasons & Episodes by Series ID
app.get("/api/seasons", async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ message: "Series ID is required." });

    const seriesSeasons = await SeriesSeasons.findOne({ id });

    if (!seriesSeasons) {
      return res.status(404).json({ message: "No seasons found for this series." });
    }

    res.json(seriesSeasons);
  } catch (error) {
    console.error("Error fetching seasons:", error);
    res.status(500).json({ message: "Server error" });
  }
});



//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////// Routes for Watched Episodes Mongo Data //////////////////////////////////////////////////////////////////////////////////

// ✅ Mark Episode as Watched (Using Separate Model)
app.post('/api/user/watched', requireAuth, async (req, res) => {
  try {
    const { seriesId, seasonNumber, episodeNumber } = req.body;
    const username = req.user.username;

    // ✅ Check if episode already exists
    const existingEpisode = await WatchedEpisode.findOne({ username, seriesId, seasonNumber, episodeNumber });

    if (!existingEpisode) {
      await WatchedEpisode.create({ username, seriesId, seasonNumber, episodeNumber });
    } else {
      existingEpisode.watchedAt = new Date();
      await existingEpisode.save();
    }

    res.json({ message: "Episode marked as watched" });
  } catch (error) {
    console.error("Error updating watched episodes:", error);
    res.status(500).json({ message: "Server error" });
  }
});


// ✅ Get Watched Episodes for a Specific Series
app.get('/api/user/watched/:seriesId', requireAuth, async (req, res) => {
  try {
    const username = req.user.username;
    const { seriesId } = req.params;

    const watchedEpisodes = await WatchedEpisode.find({ username, seriesId });

    res.json(watchedEpisodes);
  } catch (error) {
    console.error("Error fetching watched episodes:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Get Last Watched Episode for a User
app.get('/api/user/last-watched/:seriesId', requireAuth, async (req, res) => {
  try {
      const { seriesId } = req.params;
      const username = req.user.username; // Ensure user auth is handled
      
      // ✅ Find the most recent watched episode for the user & series
      const lastWatched = await WatchedEpisode.findOne({ username, seriesId })
          .sort({ watchedAt: -1 }) // ✅ Get the latest episode
          .select('seasonNumber episodeNumber');

      if (!lastWatched) {
          return res.json({ message: "No watched episodes found" });
      }

      res.json(lastWatched);
  } catch (error) {
      console.error("Error fetching last watched episode:", error);
      res.status(500).json({ message: "Server error" });
  }
});


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



// Route to search TMDb API
app.get('/api/search', async (req, res) => {
  const query = req.query.query;
  if (!query) {
    return res.status(400).json({ message: 'Query parameter is required' });
  }

  try {
    // Fetch movies
    const moviesResponse = await axios.get('https://api.themoviedb.org/3/search/movie', {
      headers: {
        Authorization: `Bearer ${TMDB_BEARER_TOKEN}`
      },
      params: {
        query: query,
        include_adult: false // Exclude adult content
      }
    });

    // Fetch TV shows
    const tvResponse = await axios.get('https://api.themoviedb.org/3/search/tv', {
      headers: {
        Authorization: `Bearer ${TMDB_BEARER_TOKEN}`
      },
      params: {
        query: query,
        include_adult: false // Exclude adult content
      }
    });

    // Combine results
    const combinedResults = {
      movies: moviesResponse.data.results,
      tvShows: tvResponse.data.results
    };

    res.json(combinedResults);
  } catch (error) {
    console.error('Error searching TMDb:', error.response ? error.response.data : error.message);
    res.status(500).json({ message: 'Error searching TMDb', error: error.message });
  }
});



//////////////////////////// Route for fetching age rating ///////////////
app.get('/api/certification/:itemId/:type', async (req, res) => {
  const { itemId, type } = req.params;

  // ✅ Use the correct API endpoint for movies & TV series
  const url = type === 'movie' 
    ? `https://api.themoviedb.org/3/movie/${itemId}/release_dates`
    : `https://api.themoviedb.org/3/tv/${itemId}/content_ratings`; // ✅ Correct endpoint for TV

  try {
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${TMDB_BEARER_TOKEN}` }
    });

    console.log('TMDB Certification API Response:', response.data); // ✅ Debugging log

    let certification = "N/A"; // Default

    if (type === 'movie') {
      // ✅ Extract movie certification from release_dates
      if (response.data.results) {
        const usCertification = response.data.results.find(entry => entry.iso_3166_1 === "US");
        if (usCertification && usCertification.release_dates.length > 0) {
          certification = usCertification.release_dates[0].certification || "N/A";
        }
      }
    } else if (type === 'tv') {
      // ✅ Extract TV certification from content_ratings
      if (response.data.results) {
        const usRating = response.data.results.find(entry => entry.iso_3166_1 === "US");
        if (usRating) {
          certification = usRating.rating || "N/A";
        }
      }
    }

    res.json({ certification });
  } catch (error) {
    console.error('Error fetching certification:', error.message);

    if (error.response && error.response.status === 404) {
      return res.status(404).json({ error: 'The resource you requested could not be found.' });
    }

    res.status(500).json({ error: 'Internal Server Error' });
  }
});


/////////////////////////////

//// Endpoint for trending now ////
app.get('/api/trending-now', async (req, res) => {
  // ✅ Check if data is cached
  const cachedData = myCache.get("trending-now");
  if (cachedData) {
    console.log("Returning trending now data from cache.");
    return res.json(cachedData);
  }

  try {
      // Fetch trending now data
      const trendingResponse = await axios.get('https://api.themoviedb.org/3/trending/all/week', {
          headers: {
              Authorization: `Bearer ${TMDB_BEARER_TOKEN}`
          }
      });

      let allTrendingItems = trendingResponse.data.results || [];  // Fallback to an empty array if no results

      console.log(`Total fetched trending items: ${allTrendingItems.length}`);

      // Filter based on available IDs (movies and tv shows)
      const filteredTrendingItems = allTrendingItems.filter(item => {
          let exists = false;
          if (item.media_type === 'movie') {
              exists = availableMovieIds.has(String(item.id)); // Check movie ID
          } else if (item.media_type === 'tv') {
              exists = availableSeriesIds.has(String(item.id)); // Check TV ID
          }

          if (!exists) {
              console.log(`Filtered out ${item.media_type} ID: ${item.id} (${item.title || item.name})`);
          }
          return exists;
      });

      console.log(`Final filtered trending items count: ${filteredTrendingItems.length}`);

      // ✅ Cache the data for 6 hours
      myCache.set("trending-now", { results: filteredTrendingItems }, 43200);  // Cache for 6 hours (43200 seconds)

      // Respond with the filtered data
      res.json({ results: filteredTrendingItems });
  } catch (error) {
      console.error('Error fetching trending now:', error.message);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});




app.get('/api/netflix-movies', async (req, res) => {

  // ✅ Check if data is cached
  const cachedData = myCache.get("netflix-movies");
  if (cachedData) {
    console.log("Returning Netflix movies from cache.");
    return res.json(cachedData);
  }

  try {
    console.log('Filtering Netflix movies...'); // Debugging step
    

    // Fetch Netflix Movies (Page 1)
    const netflixPage1 = await axios.get('https://api.themoviedb.org/3/discover/movie', {
      headers: { Authorization: `Bearer ${TMDB_BEARER_TOKEN}` },
      params: { 
        with_networks: 213,  // Netflix network ID
        page: 1
      }
    });

    // Fetch Netflix Movies (Page 2)
    const netflixPage2 = await axios.get('https://api.themoviedb.org/3/discover/movie', {
      headers: { Authorization: `Bearer ${TMDB_BEARER_TOKEN}` },
      params: { 
        with_networks: 213, 
        page: 2
      }
    });

    // Combine both pages
    let allNetflixMovies = [...netflixPage1.data.results, ...netflixPage2.data.results];

    console.log(`Total fetched movies: ${allNetflixMovies.length}`);

    // Filter out unwanted genres (optional, you can modify as needed)
    allNetflixMovies = allNetflixMovies.filter(movie => {
      return !movie.genre_ids.includes(16) &&  // Exclude Animation
             !movie.genre_ids.includes(99) &&  // Exclude Documentary
             !movie.genre_ids.includes(10764); // Exclude Reality
    });

    console.log(`After genre filtering: ${allNetflixMovies.length}`);

    // ✅ Filter to show only available movies from mov_tmdb.txt
    const filteredNetflixMovies = allNetflixMovies.filter(movie => {
      const exists = availableMovieIds.has(String(movie.id));
      if (!exists) {
        console.log(`Filtered out movie ID: ${movie.id} (${movie.title})`);
      }
      return exists;
    });

    console.log(`Final filtered movies count: ${filteredNetflixMovies.length}`);

    
    // ✅ Cache the data for 6 hours
    myCache.set("netflix-movies", filteredNetflixMovies, 43200);

    res.json(filteredNetflixMovies);
  } catch (error) {
    console.error('Error fetching Netflix movies:', error.response ? error.response.data : error.message);
    res.status(500).json({ message: 'Error fetching Netflix movies', error: error.message });
  }
});





app.get('/api/netflix-series', async (req, res) => {


  // ✅ Check if Netflix section data is in cache
  const cachedNetflixSeries = myCache.get("netflix-section");
  if (cachedNetflixSeries) {
    console.log("Returning Netflix series from cache.");
    return res.json(cachedNetflixSeries);
  }

  try {
    console.log('Filtering Netflix series...'); // Debugging step
    
    // Fetch Netflix Series (Page 1)
    const netflixPage1 = await axios.get('https://api.themoviedb.org/3/discover/tv', {
      headers: { Authorization: `Bearer ${TMDB_BEARER_TOKEN}` },
      params: { 
        with_networks: 213,  // Netflix network ID
        page: 1
      }
    });

    // Fetch Netflix Series (Page 2)
    const netflixPage2 = await axios.get('https://api.themoviedb.org/3/discover/tv', {
      headers: { Authorization: `Bearer ${TMDB_BEARER_TOKEN}` },
      params: { 
        with_networks: 213, 
        page: 2
      }
    });

    // Combine both pages
    let allNetflixSeries = [...netflixPage1.data.results, ...netflixPage2.data.results];

    console.log(`Total fetched series: ${allNetflixSeries.length}`);

    // Filter out unwanted genres
    allNetflixSeries = allNetflixSeries.filter(series => {
      return !series.genre_ids.includes(16) &&  // Exclude Animation
             !series.genre_ids.includes(10764) &&  // Exclude Reality
             !series.genre_ids.includes(10766) &&  // Exclude Soap
             !series.genre_ids.includes(10762) &&  // Exclude Kids
             !series.genre_ids.includes(10767);  // Exclude Talk
    });

    console.log(`After genre filtering: ${allNetflixSeries.length}`);

    // ✅ Filter to show only available series from tv_tmdb.txt
    const filteredNetflixSeries = allNetflixSeries.filter(series => {
      const exists = availableSeriesIds.has(String(series.id));
      if (!exists) {
        console.log(`Filtered out series ID: ${series.id} (${series.name})`);
      }
      return exists;
    });

    console.log(`Final filtered series count: ${filteredNetflixSeries.length}`);


    // ✅ Cache the data for 6 hours
    myCache.set("netflix-section", filteredNetflixSeries, 43200);

    res.json(filteredNetflixSeries);
  } catch (error) {
    console.error('Error fetching Netflix series:', error.response ? error.response.data : error.message);
    res.status(500).json({ message: 'Error fetching Netflix series', error: error.message });
  }
});

// APPLE TV SECTION ROUTE
app.get('/api/apple-tv', async (req, res) => {

  // ✅ Check if data is cached
  const cachedData = myCache.get("apple-tv");
  if (cachedData) {
    console.log("Returning Apple TV+ series from cache.");
    return res.json(cachedData);
  }

  try {
    console.log('Filtering Apple TV series...'); // Debugging step

    // Fetch Apple TV Series (Only Page 1)
    const appleTVPage1 = await axios.get('https://api.themoviedb.org/3/discover/tv', {
      headers: { Authorization: `Bearer ${TMDB_BEARER_TOKEN}` },
      params: { 
        with_networks: 2552,  // Apple TV+ network ID
        page: 1
      }
    });

    let allAppleTVSeries = appleTVPage1.data.results; // Only use Page 1 results

    console.log(`Total fetched series: ${allAppleTVSeries.length}`);

    // Filter out unwanted genres
    allAppleTVSeries = allAppleTVSeries.filter(series => {
      return !series.genre_ids.includes(16) &&  // Exclude Animation
             !series.genre_ids.includes(10764) &&  // Exclude Reality
             !series.genre_ids.includes(10766) &&  // Exclude Soap
             !series.genre_ids.includes(10762) &&  // Exclude Kids
             !series.genre_ids.includes(10767);  // Exclude Talk
    });

    console.log(`After genre filtering: ${allAppleTVSeries.length}`);

    // ✅ Filter to show only available series from tv_tmdb.txt
    const filteredAppleTVSeries = allAppleTVSeries.filter(series => {
      const exists = availableSeriesIds.has(String(series.id));
      if (!exists) {
        console.log(`Filtered out series ID: ${series.id} (${series.name})`);
      }
      return exists;
    });

    console.log(`Final filtered series count: ${filteredAppleTVSeries.length}`);

        // ✅ Cache the data for 6 hours
        myCache.set("apple-tv", filteredAppleTVSeries, 43200);


    res.json(filteredAppleTVSeries);
  } catch (error) {
    console.error('Error fetching Apple TV series:', error.response ? error.response.data : error.message);
    res.status(500).json({ message: 'Error fetching Apple TV series', error: error.message });
  }
});

// Route to get Apple TV+ Series (Fetch 100 Series)
app.get('/api/apple-tv-load-more', async (req, res) => {

  // ✅ Check if data is cached
  const cachedData = myCache.get("apple-tv-load-more");
  if (cachedData) {
    console.log("Returning Apple TV+ load more series from cache.");
    return res.json(cachedData);
  }

  try {
    const totalResultsNeeded = 120; // We need 100 series (10 rows * 10 items)
    let allAppleTVSeries = [];
    const seenSeriesIds = new Set(); // ✅ Track unique series IDs

    // Fetch from multiple pages
    for (let page = 1; page <= 6; page++) {
      const response = await axios.get('https://api.themoviedb.org/3/discover/tv', {
        headers: { Authorization: `Bearer ${TMDB_BEARER_TOKEN}` },
        params: {
          with_networks: 2552,  // Apple TV+ network ID
          sort_by: 'popularity.desc',
          with_original_language: 'en',
          page: page
        }
      });

      console.log(`Page ${page}: Fetched ${response.data.results.length} series`);

      response.data.results.forEach(series => {
        if (!seenSeriesIds.has(series.id)) { // ✅ Check for duplicates
          seenSeriesIds.add(series.id); // ✅ Mark as added
          allAppleTVSeries.push(series);
        }
      });

      // Stop if we reach the required number of series
      if (allAppleTVSeries.length >= totalResultsNeeded) break;
    }

    console.log(`Fetched ${allAppleTVSeries.length} unique Apple TV+ series before filtering`);

    // ✅ Step 1: Filter out old Apple TV+ series by year
    allAppleTVSeries = allAppleTVSeries.filter(series => (
      series.first_air_date && 
      new Date(series.first_air_date) >= new Date('2000-01-01') 
    ));

    // ✅ Step 2: Filter out unwanted genres
    allAppleTVSeries = allAppleTVSeries.filter(series => {
      return !series.genre_ids.includes(16) &&  // Exclude Animation
             !series.genre_ids.includes(10766) &&  // Exclude Soap
             !series.genre_ids.includes(10767) &&   // Exclude Talk
             !series.genre_ids.includes(99) &&   // Exclude Documentary
             !series.genre_ids.includes(10762);  // Exclude Kids
    });

    console.log(`After genre filtering: ${allAppleTVSeries.length}`);

    // ✅ Step 3: Filter to show only available series from tv_tmdb.txt
    const filteredAppleTVSeries = allAppleTVSeries.filter(series => {
      const exists = availableSeriesIds.has(String(series.id));
      if (!exists) {
        console.log(`Filtered out series ID: ${series.id} (${series.name})`);
      }
      return exists;
    });

    console.log(`Final filtered Apple TV+ series count: ${filteredAppleTVSeries.length}`);

     // ✅ Ensure exactly 120 series
     const finalResults = filteredAppleTVSeries.slice(0, totalResultsNeeded);

     // ✅ Cache the data for 6 hours
     myCache.set("apple-tv-load-more", finalResults, 43200);
 
     res.json(finalResults);
   } catch (error) {
     console.error('Error fetching Apple TV+ Load More series:', error.message);
     res.status(500).json({ message: 'Error fetching Apple TV+ Load More series', error: error.message });
   }
 });


// AMAZON PRIME VIDEO SECTION ROUTE
app.get('/api/amazon-prime', async (req, res) => {

  // ✅ Check if data is cached
  const cachedData = myCache.get("amazon-prime-home");
  if (cachedData) {
    console.log("Returning Amazon Prime Video Load More series from cache.");
    return res.json(cachedData);
  }

  try {
    console.log('Filtering Amazon Prime series...'); // Debugging step

    // Fetch Amazon Prime Series (Only Page 1)
    const primePage1 = await axios.get('https://api.themoviedb.org/3/discover/tv', {
      headers: { Authorization: `Bearer ${TMDB_BEARER_TOKEN}` },
      params: { 
        with_networks: 1024,  // Amazon Prime Video network ID
        page: 1
      }
    });

    let allPrimeSeries = primePage1.data.results; // Only use Page 1 results

    console.log(`Total fetched series: ${allPrimeSeries.length}`);

    // Filter out unwanted genres
    allPrimeSeries = allPrimeSeries.filter(series => {
      return !series.genre_ids.includes(16) &&  // Exclude Animation
             !series.genre_ids.includes(10766) &&  // Exclude Soap
             !series.genre_ids.includes(10762);  // Exclude Kids
    });

    console.log(`After genre filtering: ${allPrimeSeries.length}`);

    // ✅ Filter to show only available series from tv_tmdb.txt
    const filteredPrimeSeries = allPrimeSeries.filter(series => {
      const exists = availableSeriesIds.has(String(series.id));
      if (!exists) {
        console.log(`Filtered out series ID: ${series.id} (${series.name})`);
      }
      return exists;
    });

    console.log(`Final filtered series count: ${filteredPrimeSeries.length}`);

       // ✅ Cache the data for 6 hours
       myCache.set("amazon-prime-home", filteredPrimeSeries, 43200);

    res.json(filteredPrimeSeries);
  } catch (error) {
    console.error('Error fetching Amazon Prime series:', error.response ? error.response.data : error.message);
    res.status(500).json({ message: 'Error fetching Amazon Prime series', error: error.message });
  }
});

// Route to get Amazon Prime Series (Fetch 60 Series)
app.get('/api/amazon-prime-load-more', async (req, res) => {

  // ✅ Check if data is cached
  const cachedData = myCache.get("amazon-prime-load-more");
  if (cachedData) {
    console.log("Returning Amazon Prime Video Load More series from cache.");
    return res.json(cachedData);
  }

  try {
    const totalResultsNeeded = 120; // We need 60 series (6 rows * 10 items)
    let allAmazonPrimeSeries = [];
    const seenSeriesIds = new Set(); // ✅ Track unique series IDs

    // Fetch from multiple pages
    for (let page = 1; page <= 6; page++) {
      const response = await axios.get('https://api.themoviedb.org/3/discover/tv', {
        headers: { Authorization: `Bearer ${TMDB_BEARER_TOKEN}` },
        params: {
          with_networks: 1024,  // Amazon Prime Video network ID
          sort_by: 'popularity.desc',
          with_original_language: 'en',
          page: page
        }
      });

      console.log(`Page ${page}: Fetched ${response.data.results.length} series`);

      response.data.results.forEach(series => {
        if (!seenSeriesIds.has(series.id)) { // ✅ Check if series is already added
          seenSeriesIds.add(series.id); // ✅ Add to set to avoid duplicates
          allAmazonPrimeSeries.push(series);
        }
      });

      // Stop if we reach the required number of series
      if (allAmazonPrimeSeries.length >= totalResultsNeeded) break;
    }

    console.log(`Fetched ${allAmazonPrimeSeries.length} unique Amazon Prime series before filtering`);

    // ✅ Step 1: Filter out old Amazon Prime series by year
    allAmazonPrimeSeries = allAmazonPrimeSeries.filter(series => (
      series.first_air_date && 
      new Date(series.first_air_date) >= new Date('2000-01-01') 
    ));

    // ✅ Step 2: Filter out unwanted genres
    allAmazonPrimeSeries = allAmazonPrimeSeries.filter(series => {
      return !series.genre_ids.includes(16) &&  // Exclude Animation
             !series.genre_ids.includes(10766) &&  // Exclude Soap
             !series.genre_ids.includes(10764) &&  // Exclude Reality
             !series.genre_ids.includes(99) &&  // Exclude Doc
             !series.genre_ids.includes(10762);  // Exclude Kids
    });

    console.log(`After genre filtering: ${allAmazonPrimeSeries.length}`);

    // ✅ Step 3: Filter to show only available series from tv_tmdb.txt
    const filteredPrimeSeries = allAmazonPrimeSeries.filter(series => {
      const exists = availableSeriesIds.has(String(series.id));
      if (!exists) {
        console.log(`Filtered out series ID: ${series.id} (${series.name})`);
      }
      return exists;
    });

    console.log(`Final filtered Amazon Prime series count: ${filteredPrimeSeries.length}`);

      // ✅ Ensure exactly 120 series
      const finalResults = filteredPrimeSeries.slice(0, totalResultsNeeded);

      // ✅ Cache the data for 6 hours
      myCache.set("amazon-prime-load-more", finalResults, 43200);
  
      res.json(finalResults);
    } catch (error) {
      console.error('Error fetching Amazon Prime Video Load More series:', error.message);
      res.status(500).json({ message: 'Error fetching Amazon Prime Video Load More series', error: error.message });
    }
  });

// DISNEY+ SECTION ROUTE
app.get('/api/disney-plus', async (req, res) => {

  // ✅ Check if data is already cached
  const cachedDisneyPlus = myCache.get("disney-plus");
  if (cachedDisneyPlus) {
    console.log("Returning Disney+ series from cache.");
    return res.json(cachedDisneyPlus);
  }

  try {
    console.log('Filtering Disney+ series...'); // Debugging step

    // Fetch Disney+ Series (Page 1)
    const disneyPlusPage1 = await axios.get('https://api.themoviedb.org/3/discover/tv', {
      headers: { Authorization: `Bearer ${TMDB_BEARER_TOKEN}` },
      params: { 
        with_networks: 2739,  // Disney+ network ID
        page: 1
      }
    });

    // Fetch Disney+ Series (Page 2)
    const disneyPlusPage2 = await axios.get('https://api.themoviedb.org/3/discover/tv', {
      headers: { Authorization: `Bearer ${TMDB_BEARER_TOKEN}` },
      params: { 
        with_networks: 2739,  // Disney+ network ID
        page: 2
      }
    });

    // Combine both pages
    let allDisneyPlusSeries = [...disneyPlusPage1.data.results, ...disneyPlusPage2.data.results];

    console.log(`Total fetched series: ${allDisneyPlusSeries.length}`);

    // Filter out unwanted genres
    allDisneyPlusSeries = allDisneyPlusSeries.filter(series => {
      return !series.genre_ids.includes(16) &&  // Exclude Animation
             !series.genre_ids.includes(10764) &&  // Exclude Reality
             !series.genre_ids.includes(10766) &&  // Exclude Soap
             !series.genre_ids.includes(10762) &&  // Exclude Kids
             !series.genre_ids.includes(99) &&  // Exclude Docs
             !series.genre_ids.includes(10767);  // Exclude Talk
    });

    console.log(`After genre filtering: ${allDisneyPlusSeries.length}`);

    // ✅ Filter to show only available series from tv_tmdb.txt
    const filteredDisneyPlusSeries = allDisneyPlusSeries.filter(series => {
      const exists = availableSeriesIds.has(String(series.id));
      if (!exists) {
        console.log(`Filtered out series ID: ${series.id} (${series.name})`);
      }
      return exists;
    });

    console.log(`Final filtered series count: ${filteredDisneyPlusSeries.length}`);

    

    // ✅ Cache the data for 6 hours
    myCache.set("disney-plus", filteredDisneyPlusSeries, 43200);

    res.json(filteredDisneyPlusSeries);
  } catch (error) {
    console.error('Error fetching Disney+ series:', error.message);
    res.status(500).json({ message: 'Error fetching Disney+ series', error: error.message });
  }
});

// Route to get Disney+ Series (Fetch 70 Series)
app.get('/api/disney-plus-load-more', async (req, res) => {


  // ✅ Check if data is already cached
  const cachedData = myCache.get("disney-plus-load-more");
  if (cachedData) {
    console.log("Returning Disney+ Load More series from cache.");
    return res.json(cachedData);
  }


  try {
    const totalResultsNeeded = 160; // We need 70 series (7 rows * 10 items)
    let allDisneyPlusSeries = [];
    const seenSeriesIds = new Set(); // ✅ Track unique series IDs

    // Fetch from multiple pages
    for (let page = 1; page <= 6; page++) {
      const response = await axios.get('https://api.themoviedb.org/3/discover/tv', {
        headers: { Authorization: `Bearer ${TMDB_BEARER_TOKEN}` },
        params: {
          with_networks: 2739,  // Disney+ network ID
          sort_by: 'popularity.desc',
          with_original_language: 'en',
          page: page
        }
      });

      console.log(`Page ${page}: Fetched ${response.data.results.length} series`);

      response.data.results.forEach(series => {
        if (!seenSeriesIds.has(series.id)) { // ✅ Check if series is already added
          seenSeriesIds.add(series.id); // ✅ Add to set to avoid duplicates
          allDisneyPlusSeries.push(series);
        }
      });

      // Stop if we reach the required number of series
      if (allDisneyPlusSeries.length >= totalResultsNeeded) break;
    }

    console.log(`Fetched ${allDisneyPlusSeries.length} unique Disney+ series before filtering`);

    // ✅ Step 1: Filter out old Disney+ series by year
    allDisneyPlusSeries = allDisneyPlusSeries.filter(series => (
      series.first_air_date && 
      new Date(series.first_air_date) >= new Date('2000-01-01') 
    ));

    // ✅ Step 2: Filter out unwanted genres
    allDisneyPlusSeries = allDisneyPlusSeries.filter(series => {
      return !series.genre_ids.includes(16) &&  // Exclude Animation
             !series.genre_ids.includes(10766) &&  // Exclude Soap
             !series.genre_ids.includes(10764) &&  // Exclude Reality
             !series.genre_ids.includes(99) &&  // Exclude Doc
             !series.genre_ids.includes(10767) &&  // Exclude Talk
             !series.genre_ids.includes(10762);  // Exclude Kids
    });

    console.log(`After genre filtering: ${allDisneyPlusSeries.length}`);

    // ✅ Step 3: Filter to show only available series from tv_tmdb.txt
    const filteredDisneyPlusSeries = allDisneyPlusSeries.filter(series => {
      const exists = availableSeriesIds.has(String(series.id));
      if (!exists) {
        console.log(`Filtered out series ID: ${series.id} (${series.name})`);
      }
      return exists;
    });

    console.log(`Final filtered Disney+ series count: ${filteredDisneyPlusSeries.length}`);

    // ✅ Ensure exactly 160 series
    const finalResults = filteredDisneyPlusSeries.slice(0, totalResultsNeeded);

    // ✅ Cache the data for 6 hours
    myCache.set("disney-plus-load-more", finalResults, 43200);

    res.json(finalResults);
  } catch (error) {
    console.error('Error fetching Disney+ Load More series:', error.message);
    res.status(500).json({ message: 'Error fetching Disney+ Load More series', error: error.message });
  }
});


// DOCUMENTARY SECTION ROUTE
app.get('/api/documentary', async (req, res) => {

  // ✅ Check if data is cached
  const cachedData = myCache.get("documentary-section");
  if (cachedData) {
    console.log("Returning Documentary Section from cache.");
    return res.json(cachedData);
  }

  try {
    console.log('Filtering Documentary series from Netflix and Apple TV...'); // Debugging step

    // Fetch Netflix Series (Page 1)
    const netflixPage1 = await axios.get('https://api.themoviedb.org/3/discover/tv', {
      headers: { Authorization: `Bearer ${TMDB_BEARER_TOKEN}` },
      params: { 
        with_networks: 213,  // Netflix network ID
        page: 1,
        with_genres: 99  // Genre ID for Documentary
      }
    });

    // Fetch Apple TV Series (Page 1)
    const appleTVPage1 = await axios.get('https://api.themoviedb.org/3/discover/tv', {
      headers: { Authorization: `Bearer ${TMDB_BEARER_TOKEN}` },
      params: { 
        with_networks: 2552,  // Apple TV+ network ID
        page: 1,
        with_genres: 99  // Genre ID for Documentary
      }
    });

    // Combine both Netflix and Apple TV Series
    let allDocumentaries = [
      ...netflixPage1.data.results, 
      ...appleTVPage1.data.results
    ];

    console.log(`Total fetched documentaries: ${allDocumentaries.length}`);

    // Filter out unwanted genres (exclude other genres that are not documentary)
    allDocumentaries = allDocumentaries.filter(series => {
      return series.genre_ids.includes(99);  // Ensure it's a Documentary
    });

    console.log(`After genre filtering: ${allDocumentaries.length}`);

    // ✅ Filter to show only available series from tv_tmdb.txt
    const filteredDocumentaries = allDocumentaries.filter(series => {
      const exists = availableSeriesIds.has(String(series.id));
      if (!exists) {
        console.log(`Filtered out series ID: ${series.id} (${series.name})`);
      }
      return exists;
    });

    console.log(`Final filtered documentary count: ${filteredDocumentaries.length}`);

    
    // ✅ Cache the data for 6 hours
    myCache.set("documentary-section", filteredDocumentaries, 43200);

    res.json(filteredDocumentaries);
  } catch (error) {
    console.error('Error fetching Documentary series:', error.response ? error.response.data : error.message);
    res.status(500).json({ message: 'Error fetching Documentary series', error: error.message });
  }
});

// Route to get Documentary Series (Fetch from Netflix and Apple TV)
app.get('/api/documentary-load-more', async (req, res) => {

  // ✅ Check if data is cached
  const cachedData = myCache.get("documentary-load-more");
  if (cachedData) {
    console.log("Returning Documentary Load More series from cache.");
    return res.json(cachedData);
  }

  try {
    const totalResultsNeeded = 120; // We need 60 series (6 rows * 10 items)
    let allDocumentarySeries = [];
    

    // Fetch Netflix Series (Documentary genre)
    for (let page = 1; page <= 2; page++) {  // Adjust the pages as needed
      const netflixResponse = await axios.get('https://api.themoviedb.org/3/discover/tv', {
        headers: { Authorization: `Bearer ${TMDB_BEARER_TOKEN}` },
        params: {
          with_networks: 213,  // Netflix network ID
          with_genres: 99,  // Genre ID for Documentary
          page: page
        }
      });

      console.log(`Netflix - Page ${page}: Fetched ${netflixResponse.data.results.length} documentaries`);
      allDocumentarySeries = allDocumentarySeries.concat(netflixResponse.data.results);

      // Stop if we reach the required results
      if (allDocumentarySeries.length >= totalResultsNeeded) break;
    }

    // Fetch Apple TV Series (Documentary genre)
    for (let page = 1; page <= 2; page++) {  // Adjust the pages as needed
      const appleTVResponse = await axios.get('https://api.themoviedb.org/3/discover/tv', {
        headers: { Authorization: `Bearer ${TMDB_BEARER_TOKEN}` },
        params: {
          with_networks: 2552,  // Apple TV+ network ID
          with_genres: 99,  // Genre ID for Documentary
          page: page
        }
      });

      console.log(`Apple TV - Page ${page}: Fetched ${appleTVResponse.data.results.length} documentaries`);
      allDocumentarySeries = allDocumentarySeries.concat(appleTVResponse.data.results);

      // Stop if we reach the required results
      if (allDocumentarySeries.length >= totalResultsNeeded) break;
    }

    // Ensure exactly 60 documentaries
    allDocumentarySeries = allDocumentarySeries.slice(0, totalResultsNeeded);
    console.log(`Fetched a total of ${allDocumentarySeries.length} documentaries`);

    // Filter out unwanted genres (exclude other genres that are not documentary)
    allDocumentarySeries = allDocumentarySeries.filter(series => {
      return series.genre_ids.includes(99);  // Ensure it's a Documentary
    });

    console.log(`After genre filtering: ${allDocumentarySeries.length}`);

    // ✅ Filter to show only available series from tv_tmdb.txt
    const filteredDocumentarySeries = allDocumentarySeries.filter(series => {
      const exists = availableSeriesIds.has(String(series.id));
      if (!exists) {
        console.log(`Filtered out series ID: ${series.id} (${series.name})`);
      }
      return exists;
    });

    console.log(`Final filtered documentary count: ${filteredDocumentarySeries.length}`);

   
    // ✅ Ensure exactly 120 documentaries
    const finalResults = filteredDocumentarySeries.slice(0, totalResultsNeeded);

    // ✅ Shuffle the results for variety
    const shuffledResults = finalResults.sort(() => Math.random() - 0.5);

    // ✅ Cache the data for 6 hours
    myCache.set("documentary-load-more", shuffledResults, 43200);

    res.json(shuffledResults);
  } catch (error) {
    console.error('Error fetching Documentary Load More series:', error.message);
    res.status(500).json({ message: 'Error fetching Documentary Load More series', error: error.message });
  }
});



// Route to get Netflix Series (Fetch 100 Series)
app.get('/api/netflix-series-load-more', async (req, res) => {

  // ✅ Check if data is already cached
  const cachedNetflixLoadMore = myCache.get("netflix-load-more");
  if (cachedNetflixLoadMore) {
    console.log("Returning Netflix Load More series from cache.");
    return res.json(cachedNetflixLoadMore);
  }

  try {
    const totalResultsNeeded = 160; // We need 60 series (6 rows * 10 items)
    let allNetflixSeries = [];
    const seenSeriesIds = new Set(); // ✅ Track unique series IDs

    // Fetch from 6 pages (each page returns ~20 series)
    for (let page = 1; page <= 7; page++) {
      const netflixResponse = await axios.get('https://api.themoviedb.org/3/discover/tv', {
        headers: { Authorization: `Bearer ${TMDB_BEARER_TOKEN}` },
        params: {
          with_networks: 213,  // Netflix network ID
          sort_by: 'popularity.desc',
          with_original_language: 'en',
          page: page
        }
      });

      console.log(`Page ${page}: Fetched ${netflixResponse.data.results.length} series`);

      netflixResponse.data.results.forEach(series => {
        if (!seenSeriesIds.has(series.id)) { // ✅ Check if series is already added
          seenSeriesIds.add(series.id); // ✅ Add to set to avoid duplicates
          allNetflixSeries.push(series);
        }
      });

      // Stop if we reach 60 series
      if (allNetflixSeries.length >= totalResultsNeeded) break;
    }

    // Ensure exactly 60 series
    allNetflixSeries = allNetflixSeries.slice(0, totalResultsNeeded);
    console.log(`Fetched a total of ${allNetflixSeries.length} Netflix series`);

      // ✅ Step 1: Filter out old Netflix series by year
      allNetflixSeries = allNetflixSeries.filter(series => (
      series.first_air_date && 
      new Date(series.first_air_date) >= new Date('2000-01-01') 
      ));


    // Filter out unwanted genres
    allNetflixSeries = allNetflixSeries.filter(series => {
      return !series.genre_ids.includes(16) &&  // Exclude Animation
             !series.genre_ids.includes(10766) &&  // Exclude Soap
             !series.genre_ids.includes(10767) &&  // Exclude Soap
             !series.genre_ids.includes(10762);  // Exclude Kids
    });

    console.log(`After genre filtering: ${allNetflixSeries.length}`);

    // ✅ Filter to show only available series from tv_tmdb.txt
    const filteredNetflixSeries = allNetflixSeries.filter(series => {
      const exists = availableSeriesIds.has(String(series.id));
      if (!exists) {
        console.log(`Filtered out series ID: ${series.id} (${series.name})`);
      }
      return exists;
    });

    console.log(`Final filtered Netflix series count: ${filteredNetflixSeries.length}`);

    // ✅ Ensure exactly 160 series
    const finalResults = filteredNetflixSeries.slice(0, totalResultsNeeded);

    // ✅ Cache the data for 6 hours
    myCache.set("netflix-load-more", finalResults, 43200);

    res.json(finalResults);
  } catch (error) {
    console.error('Error fetching Netflix series:', error.message);
    res.status(500).json({ message: 'Error fetching Netflix series', error: error.message });
  }
});



// HBO SECTION ROUTE
app.get('/api/hbo', async (req, res) => {


  // ✅ Check if HBO section data is in cache
  const cachedHBOSeries = myCache.get("hbo-section");
  if (cachedHBOSeries) {
    console.log("Returning HBO section data from cache.");
    return res.json(cachedHBOSeries);
  }

  try {
    console.log('Filtering HBO series...'); // Debugging step

    // Fetch HBO Series (Only Page 1)
    const hboPage1 = await axios.get('https://api.themoviedb.org/3/discover/tv', {
      headers: { Authorization: `Bearer ${TMDB_BEARER_TOKEN}` },
      params: { 
        with_networks: 49,  // HBO network ID
        page: 1
      }
    });

    let allHBOSeries = hboPage1.data.results; // Only use Page 1 results

    console.log(`Total fetched series: ${allHBOSeries.length}`);

    
    // ✅ Step 1: Filter out old HBO series by year (before 2000)
    allHBOSeries = allHBOSeries.filter(series => (
      series.first_air_date &&
      new Date(series.first_air_date) >= new Date('2000-01-01')
    ));


    // Filter out unwanted genres
    allHBOSeries = allHBOSeries.filter(series => {
      return !series.genre_ids.includes(16) &&  // Exclude Animation
             !series.genre_ids.includes(10764) &&  // Exclude Reality
             !series.genre_ids.includes(10766) &&  // Exclude Soap
             !series.genre_ids.includes(10762) &&  // Exclude Kids
             !series.genre_ids.includes(10767);  // Exclude Talk
    });

    console.log(`After genre filtering: ${allHBOSeries.length}`);

    // ✅ Filter to show only available series from tv_tmdb.txt
    const filteredHBOSeries = allHBOSeries.filter(series => {
      const exists = availableSeriesIds.has(String(series.id));
      if (!exists) {
        console.log(`Filtered out series ID: ${series.id} (${series.name})`);
      }
      return exists;
    });

    console.log(`Final filtered series count: ${filteredHBOSeries.length}`);

   
    // ✅ Ensure we return exactly 80 series
    const finalResults = filteredHBOSeries.slice(0, 80);

    // ✅ Cache the data for 6 hours
    myCache.set("hbo-section", finalResults, 43200);

    res.json(finalResults);
  } catch (error) {
    console.error('Error fetching HBO series:', error.response ? error.response.data : error.message);
    res.status(500).json({ message: 'Error fetching HBO series', error: error.message });
  }
});

// Route to get HBO Series (Fetch 80 Series)
app.get('/api/hbo-load-more', async (req, res) => {

    // ✅ Check if HBO Load More data is in cache
    const cachedHBOLoadMore = myCache.get("hbo-load-more");
    if (cachedHBOLoadMore) {
      console.log("Returning HBO Load More data from cache.");
      return res.json(cachedHBOLoadMore);
    }

  try {
    const totalResultsNeeded = 120; // We need 80 series
    let allHBOSeries = [];
    const seenSeriesIds = new Set(); // ✅ Track unique series IDs

    // Fetch from multiple pages
    for (let page = 1; page <= 6; page++) {
      const response = await axios.get('https://api.themoviedb.org/3/discover/tv', {
        headers: { Authorization: `Bearer ${TMDB_BEARER_TOKEN}` },
        params: {
          with_networks: 49,  // HBO network ID
          sort_by: 'popularity.desc',
          with_original_language: 'en',
          page: page
        }
      });

      console.log(`Page ${page}: Fetched ${response.data.results.length} series`);

      response.data.results.forEach(series => {
        if (!seenSeriesIds.has(series.id)) { // ✅ Check for duplicates
          seenSeriesIds.add(series.id); // ✅ Mark as added
          allHBOSeries.push(series);
        }
      });

      // Stop if we reach the required number of series
      if (allHBOSeries.length >= totalResultsNeeded) break;
    }

    console.log(`Fetched ${allHBOSeries.length} unique HBO series before filtering`);

    // ✅ Step 1: Filter out old HBO series by year (before 2000)
    allHBOSeries = allHBOSeries.filter(series => (
      series.first_air_date &&
      new Date(series.first_air_date) >= new Date('2000-01-01')
    ));

    // ✅ Step 2: Filter out unwanted genres
    allHBOSeries = allHBOSeries.filter(series => {
      return !series.genre_ids.includes(16) &&  // Exclude Animation
             !series.genre_ids.includes(10766) &&  // Exclude Soap
             !series.genre_ids.includes(10767) &&  // Exclude Talk Shows
             !series.genre_ids.includes(10764) &&  // Exclude Reality
             !series.genre_ids.includes(99) &&  // Exclude Doc
             !series.genre_ids.includes(10762);  // Exclude Kids
    });

    console.log(`After genre filtering: ${allHBOSeries.length}`);

    // ✅ Step 3: Filter to show only available series from tv_tmdb.txt
    const filteredHBOSeries = allHBOSeries.filter(series => {
      const exists = availableSeriesIds.has(String(series.id));
      if (!exists) {
        console.log(`Filtered out series ID: ${series.id} (${series.name})`);
      }
      return exists;
    });

    console.log(`Final filtered HBO series count: ${filteredHBOSeries.length}`);

     // ✅ Ensure we return exactly 80 series
     const finalResults = filteredHBOSeries.slice(0, totalResultsNeeded);

     // ✅ Cache the data for 6 hours
     myCache.set("hbo-load-more", finalResults, 43200);
 
     res.json(finalResults);
   } catch (error) {
     console.error('Error fetching HBO series:', error.message);
     res.status(500).json({ message: 'Error fetching HBO series', error: error.message });
   }
 });

//////////////////////////// Route for Movies Page /////////////////////////////////////////////////////

const genres = {
  action: 28,
  comedy: 35,
  horror: 27,
  war: 10752,
  sciFi: 878,
  crime: 80
};

// ✅ Fetch all genres in one request while filtering by movies_tmdb.txt
app.get('/api/movies', async (req, res) => {
  
  // ✅ Check if data is in cache
  const cachedMovies = myCache.get("movies-data");
  if (cachedMovies) {
    console.log("Returning movies data from cache.");
    return res.json(cachedMovies);
  }

  try { 
    let allMovies = {}; // Store movies per genre
    let usedMovieIds = new Set(); // ✅ Prevent duplicates across genres

    // Loop through each genre and fetch movies
    for (const [genreKey, genreId] of Object.entries(genres)) {
      let genreMovies = [];

      for (let page = 1; page <= 2; page++) { // Fetch 2 pages per genre
        const response = await axios.get('https://api.themoviedb.org/3/discover/movie', {
          headers: { Authorization: `Bearer ${TMDB_BEARER_TOKEN}` },
          params: {
            with_genres: genreId,
            sort_by: 'popularity.desc',
            with_original_language: 'en',
            page: page
          }
        });

        genreMovies = genreMovies.concat(response.data.results);
      }

      console.log(`Fetched ${genreMovies.length} ${genreKey} movies`);

      // ✅ Step 1: Filter out old movies and exclude Animation (16)
      genreMovies = genreMovies.filter(movie => (
        movie.release_date &&
        new Date(movie.release_date) >= new Date('2000-01-01') &&
        !movie.genre_ids.includes(99), // Exclude Animation
        !movie.genre_ids.includes(16) // Exclude Animation
      ));

      console.log(`After filtering by date & genre: ${genreMovies.length} ${genreKey} movies`);

      // ✅ Step 2: Filter by `movies_tmdb.txt`
      genreMovies = genreMovies.filter(movie => {
        if (!availableMovieIds.has(String(movie.id))) {
          console.log(`Filtered out ${genreKey} Movie ID: ${movie.id} (${movie.title})`);
          return false;
        }
        return true;
      });

      console.log(`After filtering by movies_tmdb.txt: ${genreMovies.length} ${genreKey} movies`);

      // ✅ Step 3: Remove duplicates across genres
      genreMovies = genreMovies.filter(movie => {
        if (usedMovieIds.has(movie.id)) return false; // Skip duplicates
        usedMovieIds.add(movie.id);
        return true;
      });

      console.log(`Final count after removing duplicates: ${genreMovies.length} ${genreKey} movies`);

      allMovies[genreKey] = genreMovies;
    }

        // ✅ Cache the data for faster access (Expire in 6 hours)
        myCache.set("movies-data", allMovies, 43200);

    res.json(allMovies); // ✅ Send all genres in one response
  } catch (error) {
    console.error("Error fetching movies:", error.message);
    res.status(500).json({ message: "Error fetching movies", error: error.message });
  }
});



///////////////////////////// Route for View More inside Movies Page ////////////////////////////////


// Route to get Action Movies (Load More) with Filtering
app.get('/api/action-movies-load-more', async (req, res) => {

  // ✅ Check if data is in cache
  const cachedActionMovies = myCache.get("action-movies-load-more");
  if (cachedActionMovies) {
    console.log("Returning Action Movies Load More data from cache.");
    return res.json(cachedActionMovies);
  }

  try {
    const totalResultsNeeded = 100; // We need 60 movies (6 rows * 10 items)
    let allAction = [];
    const seenMovieIds = new Set(); // ✅ Track unique movie IDs

    // Fetch from multiple pages to gather enough movies
    for (let page = 1; page <= 5; page++) {
      const response = await axios.get('https://api.themoviedb.org/3/discover/movie', {
        headers: { Authorization: `Bearer ${TMDB_BEARER_TOKEN}` },
        params: {
          with_genres: 28,  // Action genre
          sort_by: 'popularity.desc',
          with_original_language: 'en',
          page: page
        }
      });

      response.data.results.forEach(movie => {
        if (!seenMovieIds.has(movie.id)) { // ✅ Check if movie is already added
          seenMovieIds.add(movie.id); // ✅ Add to set to avoid duplicates
          allAction.push(movie);
        }
      });

      // Stop if we reach the required number of movies
      if (allAction.length >= totalResultsNeeded) break;
    }

    console.log(`Fetched ${allAction.length} unique action movies before filtering`);

    // Filter out movies released before 2000 and exclude Animation (16)
    allAction = allAction.filter(movie => {
      return (
        movie.release_date &&
        new Date(movie.release_date) >= new Date('2000-01-01') &&
        !movie.genre_ids.includes(16) // Exclude Animation genre
      );
    });

    console.log(`After filtering by date & genre: ${allAction.length}`);

    // ✅ Filter action movies based on `movies_tmdb.txt`
    const filteredAction = allAction.filter(movie => {
      const exists = availableMovieIds.has(String(movie.id)); // Check in movies_tmdb.txt
      if (!exists) {
        console.log(`Filtered out Action Movie ID: ${movie.id} (${movie.title})`);
      }
      return exists;
    });

    console.log(`Final filtered action movies count: ${filteredAction.length}`);

     // ✅ Ensure we return exactly 60 movies
     const finalResults = filteredAction.slice(0, totalResultsNeeded);

     // ✅ Cache the data for faster access (Expire in 6 hours)
     myCache.set("action-movies-load-more", finalResults, 43200);
 
     res.json(finalResults);
   } catch (error) {
     console.error('Error fetching action movies:', error.message);
     res.status(500).json({ message: 'Error fetching action movies', error: error.message });
   }
 });

// Route to get Comedy Movies (Load More) with Filtering
app.get('/api/comedy-movies-load-more', async (req, res) => {

  // ✅ Check if data is in cache
  const cachedComedyMovies = myCache.get("comedy-movies-load-more");
  if (cachedComedyMovies) {
    console.log("Returning Comedy Movies Load More data from cache.");
    return res.json(cachedComedyMovies);
  }

  try {
    const totalResultsNeeded = 120; // We need 60 movies (6 rows * 10 items)
    let allComedy = [];
    const seenMovieIds = new Set(); // ✅ Track unique movie IDs

    // Fetch from multiple pages to gather enough movies
    for (let page = 1; page <= 6; page++) {
      const response = await axios.get('https://api.themoviedb.org/3/discover/movie', {
        headers: { Authorization: `Bearer ${TMDB_BEARER_TOKEN}` },
        params: {
          with_genres: 35,  // Comedy genre
          sort_by: 'popularity.desc',
          with_original_language: 'en',
          page: page
        }
      });

      response.data.results.forEach(movie => {
        if (!seenMovieIds.has(movie.id)) { // ✅ Check if movie is already added
          seenMovieIds.add(movie.id); // ✅ Add to set to avoid duplicates
          allComedy.push(movie);
        }
      });
      
      // Stop if we reach the required number of movies
      if (allComedy.length >= totalResultsNeeded) break;
    }

    console.log(`Fetched ${allComedy.length} comedy movies before filtering`);

    // Filter out movies released before 2000 and exclude Animation (16)
    allComedy = allComedy.filter(movie => {
      return (
        movie.release_date &&
        new Date(movie.release_date) >= new Date('2000-01-01') &&
        !movie.genre_ids.includes(16) // Exclude Animation genre
      );
    });

    console.log(`After filtering by date & genre: ${allComedy.length}`);

    // ✅ Filter comedy movies based on `movies_tmdb.txt`
    const filteredComedy = allComedy.filter(movie => {
      const exists = availableMovieIds.has(String(movie.id)); // Check in movies_tmdb.txt
      if (!exists) {
        console.log(`Filtered out Comedy Movie ID: ${movie.id} (${movie.title})`);
      }
      return exists;
    });

    console.log(`Final filtered comedy movies count: ${filteredComedy.length}`);

       // ✅ Ensure we return exactly 60 movies
    const finalResults = filteredComedy.slice(0, totalResultsNeeded);

    // ✅ Cache the data for faster access (Expire in 6 hours)
    myCache.set("comedy-movies-load-more", finalResults, 43200);

    res.json(finalResults);
  } catch (error) {
    console.error('Error fetching comedy movies:', error.message);
    res.status(500).json({ message: 'Error fetching comedy movies', error: error.message });
  }
});

// Route to get War Movies (Load More) with Filtering
app.get('/api/war-movies-load-more', async (req, res) => {


  // ✅ Check if data is in cache
  const cachedWarMovies = myCache.get("war-movies-load-more");
  if (cachedWarMovies) {
    console.log("Returning War Movies Load More data from cache.");
    return res.json(cachedWarMovies);
  }


  try {
    const totalResultsNeeded = 100; // We need 60 movies (6 rows * 10 items)
    let allWarMovies = [];
    const seenMovieIds = new Set(); // ✅ Track unique movie IDs

    // Fetch from multiple pages to gather enough movies
    for (let page = 1; page <= 5; page++) {
      const response = await axios.get('https://api.themoviedb.org/3/discover/movie', {
        headers: { Authorization: `Bearer ${TMDB_BEARER_TOKEN}` },
        params: {
          with_genres: 10752,  // War genre
          sort_by: 'popularity.desc',
          with_original_language: 'en',
          page: page
        }
      });

      response.data.results.forEach(movie => {
        if (!seenMovieIds.has(movie.id)) { // ✅ Check if movie is already added
          seenMovieIds.add(movie.id); // ✅ Add to set to avoid duplicates
          allWarMovies.push(movie);
        }
      });
      
      // Stop if we reach the required number of movies
      if (allWarMovies.length >= totalResultsNeeded) break;
    }

    console.log(`Fetched ${allWarMovies.length} war movies before filtering`);

    // Filter out movies released before 2000 and exclude Animation (16)
    allWarMovies = allWarMovies.filter(movie => {
      return (
        movie.release_date &&
        new Date(movie.release_date) >= new Date('2000-01-01') &&
        !movie.genre_ids.includes(16) // Exclude Animation genre
      );
    });

    console.log(`After filtering by date & genre: ${allWarMovies.length}`);

    // ✅ Filter war movies based on `movies_tmdb.txt`
    const filteredWarMovies = allWarMovies.filter(movie => {
      const exists = availableMovieIds.has(String(movie.id)); // Check in movies_tmdb.txt
      if (!exists) {
        console.log(`Filtered out War Movie ID: ${movie.id} (${movie.title})`);
      }
      return exists;
    });

    console.log(`Final filtered war movies count: ${filteredWarMovies.length}`);

      // ✅ Ensure we return exactly 60 movies
    const finalResults = filteredWarMovies.slice(0, totalResultsNeeded);

    // ✅ Cache the data for faster access (Expire in 6 hours)
    myCache.set("war-movies-load-more", finalResults, 43200);

    res.json(finalResults);
  } catch (error) {
    console.error('Error fetching war movies:', error.message);
    res.status(500).json({ message: 'Error fetching war movies', error: error.message });
  }
});

// Route to get Sci-Fi Movies (Load More) with Filtering
app.get('/api/scifi-movies-load-more', async (req, res) => {

  // ✅ Check if data is in cache
  const cachedSciFiMovies = myCache.get("scifi-movies-load-more");
  if (cachedSciFiMovies) {
    console.log("Returning Sci-Fi Movies Load More data from cache.");
    return res.json(cachedSciFiMovies);
  }

  try {
    const totalResultsNeeded = 100; // We need 60 movies (6 rows * 10 items)
    let allSciFiMovies = [];
    const seenMovieIds = new Set(); // ✅ Track unique movie IDs

    // Fetch from multiple pages to gather enough movies
    for (let page = 1; page <= 5; page++) {
      const response = await axios.get('https://api.themoviedb.org/3/discover/movie', {
        headers: { Authorization: `Bearer ${TMDB_BEARER_TOKEN}` },
        params: {
          with_genres: 878,  // Sci-Fi genre
          sort_by: 'popularity.desc',
          with_original_language: 'en',
          page: page
        }
      });

      response.data.results.forEach(movie => {
        if (!seenMovieIds.has(movie.id)) { // ✅ Check if movie is already added
          seenMovieIds.add(movie.id); // ✅ Add to set to avoid duplicates
          allSciFiMovies.push(movie);
        }
      });
      
      // Stop if we reach the required number of movies
      if (allSciFiMovies.length >= totalResultsNeeded) break;
    }

    console.log(`Fetched ${allSciFiMovies.length} sci-fi movies before filtering`);

    // Filter out movies released before 2000 and exclude Animation (16)
    allSciFiMovies = allSciFiMovies.filter(movie => {
      return (
        movie.release_date &&
        new Date(movie.release_date) >= new Date('2000-01-01') &&
        !movie.genre_ids.includes(16) // Exclude Animation genre
      );
    });

    console.log(`After filtering by date & genre: ${allSciFiMovies.length}`);

    // ✅ Filter sci-fi movies based on `movies_tmdb.txt`
    const filteredSciFiMovies = allSciFiMovies.filter(movie => {
      const exists = availableMovieIds.has(String(movie.id)); // Check in movies_tmdb.txt
      if (!exists) {
        console.log(`Filtered out Sci-Fi Movie ID: ${movie.id} (${movie.title})`);
      }
      return exists;
    });

    console.log(`Final filtered sci-fi movies count: ${filteredSciFiMovies.length}`);

      // ✅ Ensure we return exactly 60 movies
    const finalResults = filteredSciFiMovies.slice(0, totalResultsNeeded);

    // ✅ Cache the data for faster access (Expire in 6 hours)
    myCache.set("scifi-movies-load-more", finalResults, 43200);

    res.json(finalResults);
  } catch (error) {
    console.error('Error fetching sci-fi movies:', error.message);
    res.status(500).json({ message: 'Error fetching sci-fi movies', error: error.message });
  }
});

// Route to get Crime Movies (Load More) with Filtering
app.get('/api/crime-movies-load-more', async (req, res) => {

  // ✅ Check if data is in cache
  const cachedCrimeMovies = myCache.get("crime-movies-load-more");
  if (cachedCrimeMovies) {
    console.log("Returning Crime Movies Load More data from cache.");
    return res.json(cachedCrimeMovies);
  }


  try {
    const totalResultsNeeded = 100; // We need 60 movies (6 rows * 10 items)
    let allCrimeMovies = [];
    const seenMovieIds = new Set(); // ✅ Track unique movie IDs

    // Fetch from multiple pages to gather enough movies
    for (let page = 1; page <= 5; page++) {
      const response = await axios.get('https://api.themoviedb.org/3/discover/movie', {
        headers: { Authorization: `Bearer ${TMDB_BEARER_TOKEN}` },
        params: {
          with_genres: 80,  // Crime genre
          sort_by: 'popularity.desc',
          with_original_language: 'en',
          page: page
        }
      });

      response.data.results.forEach(movie => {
        if (!seenMovieIds.has(movie.id)) { // ✅ Check if movie is already added
          seenMovieIds.add(movie.id); // ✅ Add to set to avoid duplicates
          allCrimeMovies.push(movie);
        }
      });
      
      // Stop if we reach the required number of movies
      if (allCrimeMovies.length >= totalResultsNeeded) break;
    }

    console.log(`Fetched ${allCrimeMovies.length} crime movies before filtering`);

    // Filter out movies released before 2000 and exclude Animation (16)
    allCrimeMovies = allCrimeMovies.filter(movie => {
      return (
        movie.release_date &&
        new Date(movie.release_date) >= new Date('2000-01-01') &&
        !movie.genre_ids.includes(16) // Exclude Animation genre
      );
    });

    console.log(`After filtering by date & genre: ${allCrimeMovies.length}`);

    // ✅ Filter crime movies based on `movies_tmdb.txt`
    const filteredCrimeMovies = allCrimeMovies.filter(movie => {
      const exists = availableMovieIds.has(String(movie.id)); // Check in movies_tmdb.txt
      if (!exists) {
        console.log(`Filtered out Crime Movie ID: ${movie.id} (${movie.title})`);
      }
      return exists;
    });

    console.log(`Final filtered crime movies count: ${filteredCrimeMovies.length}`);
    // ✅ Ensure we return exactly 60 movies
    const finalResults = filteredCrimeMovies.slice(0, totalResultsNeeded);

    // ✅ Cache the data for 6 hours
    myCache.set("crime-movies-load-more", finalResults, 43200);

    res.json(finalResults);
  } catch (error) {
    console.error('Error fetching crime movies:', error.message);
    res.status(500).json({ message: 'Error fetching crime movies', error: error.message });
  }
});


// Route to get Horror Movies (Load More) with Filtering
app.get('/api/horror-movies-load-more', async (req, res) => {


  // ✅ Check if data is in cache
  const cachedHorrorMovies = myCache.get("horror-movies-load-more");
  if (cachedHorrorMovies) {
    console.log("Returning Horror Movies Load More data from cache.");
    return res.json(cachedHorrorMovies);
  }

  try {
    const totalResultsNeeded = 100; // We need 60 movies (6 rows * 10 items)
    let allHorror = [];
    const seenMovieIds = new Set(); // ✅ Track unique movie IDs

    // Fetch from 3 pages (each page returns ~20 movies)
    for (let page = 1; page <= 5; page++) {
      const response = await axios.get('https://api.themoviedb.org/3/discover/movie', {
        headers: { Authorization: `Bearer ${TMDB_BEARER_TOKEN}` },
        params: {
          with_genres: 27,  // Horror genre
          sort_by: 'popularity.desc',
          with_original_language: 'en',
          page: page
        }
      });

      response.data.results.forEach(movie => {
        if (!seenMovieIds.has(movie.id)) { // ✅ Check if movie is already added
          seenMovieIds.add(movie.id); // ✅ Add to set to avoid duplicates
          allHorror.push(movie);
        }
      });
      
      // Stop if we reach 60 movies
      if (allHorror.length >= totalResultsNeeded) break;
    }

    console.log(`Fetched ${allHorror.length} horror movies before filtering`);

    // Filter out movies released before 2000 and exclude Animation (16)
    allHorror = allHorror.filter(movie => {
      return (
        movie.release_date &&
        new Date(movie.release_date) >= new Date('2000-01-01') &&
        !movie.genre_ids.includes(16) // Exclude Animation genre
      );
    });

    console.log(`After filtering by date & genre: ${allHorror.length}`);

    // ✅ Filter horror movies based on `movies_tmdb.txt`
    const filteredHorror = allHorror.filter(movie => {
      const exists = availableMovieIds.has(String(movie.id)); // Check in movies_tmdb.txt
      if (!exists) {
        console.log(`Filtered out Horror Movie ID: ${movie.id} (${movie.title})`);
      }
      return exists;
    });

    console.log(`Final filtered horror movies count: ${filteredHorror.length}`);

  
    // ✅ Ensure we return exactly 60 movies
    const finalResults = filteredHorror.slice(0, totalResultsNeeded);

    // ✅ Cache the data for 6 hours
    myCache.set("horror-movies-load-more", finalResults, 43200);

    res.json(finalResults);
  } catch (error) {
    console.error('Error fetching horror movies:', error.message);
    res.status(500).json({ message: 'Error fetching horror movies', error: error.message });
  }
});



//////////////////////////// Route for TV Shows Page /////////////////////////////////////////////////////

const tvGenres = {
  actionAdventure: 10759,
  comedy: 35,
  crime: 80,
  drama: 18,
  mystery: 9648,
  reality: 10764
};

// ✅ Fetch all TV shows while filtering by tv_tmdb.txt
app.get('/api/tvshows', async (req, res) => {

  // ✅ Check if data is in cache
  const cachedTVShows = myCache.get("tvshows-data");
  if (cachedTVShows) {
    console.log("Returning TV shows data from cache.");
    return res.json(cachedTVShows);
  }

  try {
    let allTVShows = {}; // Store TV shows per genre
    let usedTVIds = new Set(); // ✅ Prevent duplicates across genres

    for (const [genreKey, genreId] of Object.entries(tvGenres)) {
      let genreTVShows = [];

      for (let page = 1; page <= 2; page++) { // Fetch 3 pages per genre
        let params = {
          with_genres: genreId,
          sort_by: 'popularity.desc',
          with_original_language: 'en',
          page: page
        };

        // ✅ Apply Netflix filter when making the API call
        if (["reality", "comedy", "drama", "crime", "mystery"].includes(genreKey)) {
          params.with_networks = "213"; // Netflix network ID
        }

        const response = await axios.get('https://api.themoviedb.org/3/discover/tv', {
          headers: { Authorization: `Bearer ${TMDB_BEARER_TOKEN}` },
          params: params
        });

        genreTVShows = genreTVShows.concat(response.data.results);
      }

      console.log(`Fetched ${genreTVShows.length} ${genreKey} TV shows (Netflix only)`);

      // ✅ Step 1: Filter out unwanted genres
      genreTVShows = genreTVShows.filter(show => (
        !show.genre_ids.includes(16) &&  // Exclude Animation
        !show.genre_ids.includes(10762) &&  // Exclude Kids
        !show.genre_ids.includes(10766) &&  // Exclude Soap
        !show.genre_ids.includes(10767)    // Exclude Talk Shows
      ));

      console.log(`After filtering unwanted genres: ${genreTVShows.length} ${genreKey} TV shows`);

      // ✅ Step 2: Filter out old shows (before 2000)
      genreTVShows = genreTVShows.filter(show => (
        show.first_air_date &&
        new Date(show.first_air_date) >= new Date('2000-01-01')
      ));

      console.log(`After filtering by date: ${genreTVShows.length} ${genreKey} TV shows`);

      // ✅ Step 3: Filter using `tv_tmdb.txt`
      genreTVShows = genreTVShows.filter(show => {
        const exists = availableSeriesIds.has(String(show.id));
        if (!exists) {
          console.log(`Filtered out TV Show ID: ${show.id} (${show.name})`);
        }
        return exists;
      });

      console.log(`After filtering by tv_tmdb.txt: ${genreTVShows.length} ${genreKey} TV shows`);

      // ✅ Step 4: Remove duplicates across genres
      genreTVShows = genreTVShows.filter(show => {
        if (usedTVIds.has(show.id)) return false; // Skip duplicates
        usedTVIds.add(show.id);
        return true;
      });

      console.log(`Final count after removing duplicates: ${genreTVShows.length} ${genreKey} TV shows`);

      allTVShows[genreKey] = genreTVShows;
    }

        // ✅ Cache the data for faster access (Expire in 6 hours)
        myCache.set("tvshows-data", allTVShows, 43200);

    res.json(allTVShows); // ✅ Send all genres in one response
  } catch (error) {
    console.error("Error fetching TV shows:", error.message);
    res.status(500).json({ message: "Error fetching TV shows", error: error.message });
  }
});


///////////////////////////////////////////////////// Load More Routes for View More inside TV Shows Page ////////////////////////////////////////////////


// Route to get Action & Adventure TV Shows (Load More) with Filtering
app.get('/api/action-tv-load-more', async (req, res) => {

   // ✅ Check if data is in cache
   const cachedActionTV = myCache.get("action-tv-load-more");
   if (cachedActionTV) {
     console.log("Returning Action TV Load More data from cache.");
     return res.json(cachedActionTV);
   }

  try {
    const totalResultsNeeded = 120; // Need at least 60 shows (6 rows * 10 items)
    let allActionAdventureShows = [];
    
    // List of networks to fetch separately
    const networks = ["213","1024"]; // Netflix, Amazon Prime
    
    // Fetch multiple pages for each network
    for (let network of networks) {
      for (let page = 1; page <= 4; page++) {
        const response = await axios.get('https://api.themoviedb.org/3/discover/tv', {
          headers: { Authorization: `Bearer ${TMDB_BEARER_TOKEN}` },
          params: {
            with_genres: 10759,  // Action & Adventure genre
            with_networks: network,  // Fetch one network at a time
            sort_by: 'popularity.desc',
            with_original_language: 'en',
            page: page
          }
        });

        allActionAdventureShows = allActionAdventureShows.concat(response.data.results);
        
        // Stop if we have enough shows
        if (allActionAdventureShows.length >= totalResultsNeeded) break;
      }
    }

    console.log(`Fetched ${allActionAdventureShows.length} action & adventure TV shows before filtering`);

    // Remove duplicates (based on TMDB ID)
    const uniqueShows = {};
    allActionAdventureShows.forEach(show => {
      uniqueShows[show.id] = show;
    });
    allActionAdventureShows = Object.values(uniqueShows);

    console.log(`After removing duplicates: ${allActionAdventureShows.length}`);

    // Filter out unwanted genres
    allActionAdventureShows = allActionAdventureShows.filter(series => {
      return !series.genre_ids.includes(16) &&  // Exclude Animation
             !series.genre_ids.includes(10766) &&  // Exclude Soap
             !series.genre_ids.includes(10762);  // Exclude Kids
    });

    // ✅ Filter shows based on `tvshows_tmdb.txt`
    const filteredActionAdventureShows = allActionAdventureShows.filter(show => {
      const exists = availableSeriesIds.has(String(show.id)); // Check in tvshows_tmdb.txt
      if (!exists) {
        console.log(`Filtered out Action & Adventure TV Show ID: ${show.id} (${show.name})`);
      }
      return exists;
    });

    console.log(`Final filtered action & adventure TV shows count: ${filteredActionAdventureShows.length}`);

  
    // ✅ Ensure we return exactly 60 shows
    const finalResults = filteredActionAdventureShows.slice(0, totalResultsNeeded);

    // ✅ Cache the data for faster access (Expire in 6 hours)
    myCache.set("action-tv-load-more", finalResults, 43200);

    res.json(finalResults);
  } catch (error) {
    console.error('Error fetching action & adventure TV shows:', error.message);
    res.status(500).json({ message: 'Error fetching action & adventure TV shows', error: error.message });
  }
});


// Route to get Comedy TV Shows (Load More) with Filtering
app.get('/api/comedy-tv-load-more', async (req, res) => {

  // ✅ Check if data is in cache
  const cachedComedyTV = myCache.get("comedy-tv-load-more");
  if (cachedComedyTV) {
    console.log("Returning Comedy TV Load More data from cache.");
    return res.json(cachedComedyTV);
  }

  try {
    const totalResultsNeeded = 80; // Need at least 60 shows (6 rows * 10 items)
    let allComedyShows = [];
    
    // List of networks to fetch separately
    const networks = ["213", "2552", "1024"]; // Example: Netflix, Apple, Amazon Prime
    
    // Fetch multiple pages for each network
    for (let network of networks) {
      for (let page = 1; page <= 4; page++) {
        const response = await axios.get('https://api.themoviedb.org/3/discover/tv', {
          headers: { Authorization: `Bearer ${TMDB_BEARER_TOKEN}` },
          params: {
            with_genres: 35,  // Comedy genre
            with_networks: network,  // Fetch one network at a time
            sort_by: 'popularity.desc',
            with_original_language: 'en',
            page: page
          }
        });

        allComedyShows = allComedyShows.concat(response.data.results);

        // Stop if we have enough shows
        if (allComedyShows.length >= totalResultsNeeded) break;
      }
    }

    console.log(`Fetched ${allComedyShows.length} comedy TV shows before filtering`);

    // Remove duplicates (based on TMDB ID)
    const uniqueShows = {};
    allComedyShows.forEach(show => {
      uniqueShows[show.id] = show;
    });
    allComedyShows = Object.values(uniqueShows);

    console.log(`After removing duplicates: ${allComedyShows.length}`);

    // ✅ Filter out unwanted genres (Animation, Soap, Kids)
    allComedyShows = allComedyShows.filter(show => {
      return !show.genre_ids.includes(16) &&  // Exclude Animation
             !show.genre_ids.includes(10766) &&  // Exclude Soap
             !show.genre_ids.includes(10767) &&  // Exclude Talk
             !show.genre_ids.includes(10762);  // Exclude Kids
    });

    console.log(`After filtering unwanted genres: ${allComedyShows.length}`);

    // ✅ Filter shows based on `tvshows_tmdb.txt`
    const filteredComedyShows = allComedyShows.filter(show => {
      const exists = availableSeriesIds.has(String(show.id)); // Check in tvshows_tmdb.txt
      if (!exists) {
        console.log(`Filtered out Comedy TV Show ID: ${show.id} (${show.name})`);
      }
      return exists;
    });

    console.log(`Final filtered comedy TV shows count: ${filteredComedyShows.length}`);

    // ✅ Ensure we return exactly 60 shows
    const finalResults = filteredComedyShows.slice(0, totalResultsNeeded);

    // ✅ Cache the data for faster access (Expire in 6 hours)
    myCache.set("comedy-tv-load-more", finalResults, 43200);

    res.json(finalResults);
  } catch (error) {
    console.error('Error fetching comedy TV shows:', error.message);
    res.status(500).json({ message: 'Error fetching comedy TV shows', error: error.message });
  }
});

// Route to get Drama TV Shows (Load More) with Filtering
app.get('/api/drama-tv-load-more', async (req, res) => {

  // ✅ Check if data is in cache
  const cachedDramaTV = myCache.get("drama-tv-load-more");
  if (cachedDramaTV) {
    console.log("Returning Drama TV Load More data from cache.");
    return res.json(cachedDramaTV);
  }

  try {
    const totalResultsNeeded = 80; // Need at least 60 shows (6 rows * 10 items)
    let allDramaShows = [];

    // List of networks to fetch separately
    const networks = ["213", "2552", "1024"]; // Example: Netflix, Apple, Amazon Prime

    // Fetch multiple pages for each network
    for (let network of networks) {
      for (let page = 1; page <= 3; page++) {
        const response = await axios.get('https://api.themoviedb.org/3/discover/tv', {
          headers: { Authorization: `Bearer ${TMDB_BEARER_TOKEN}` },
          params: {
            with_genres: 18,  // Drama genre
            with_networks: network,  // Fetch one network at a time
            sort_by: 'popularity.desc',
            with_original_language: 'en',
            page: page
          }
        });

        allDramaShows = allDramaShows.concat(response.data.results);

        // Stop if we have enough shows
        if (allDramaShows.length >= totalResultsNeeded) break;
      }
    }

    console.log(`Fetched ${allDramaShows.length} drama TV shows before filtering`);

    // Remove duplicates (based on TMDB ID)
    const uniqueShows = {};
    allDramaShows.forEach(show => {
      uniqueShows[show.id] = show;
    });
    allDramaShows = Object.values(uniqueShows);

    console.log(`After removing duplicates: ${allDramaShows.length}`);

    // ✅ Filter out unwanted genres (Animation, Soap, Kids, Talk)
    allDramaShows = allDramaShows.filter(show => {
      return !show.genre_ids.includes(16) &&  // Exclude Animation
             !show.genre_ids.includes(10766) &&  // Exclude Soap
             !show.genre_ids.includes(10767) &&  // Exclude Talk
             !show.genre_ids.includes(10762);  // Exclude Kids
    });

    console.log(`After filtering unwanted genres: ${allDramaShows.length}`);

    // ✅ Filter shows based on `tvshows_tmdb.txt`
    const filteredDramaShows = allDramaShows.filter(show => {
      const exists = availableSeriesIds.has(String(show.id)); // Check in tvshows_tmdb.txt
      if (!exists) {
        console.log(`Filtered out Drama TV Show ID: ${show.id} (${show.name})`);
      }
      return exists;
    });

    console.log(`Final filtered drama TV shows count: ${filteredDramaShows.length}`);

    // ✅ Ensure we return exactly 60 shows
    const finalResults = filteredDramaShows.slice(0, totalResultsNeeded);

    // ✅ Cache the data for faster access (Expire in 6 hours)
    myCache.set("drama-tv-load-more", finalResults, 43200);

    res.json(finalResults);
  } catch (error) {
    console.error('Error fetching drama TV shows:', error.message);
    res.status(500).json({ message: 'Error fetching drama TV shows', error: error.message });
  }
});


// Route to get Crime TV Shows (Load More) with Filtering
app.get('/api/crime-tv-load-more', async (req, res) => {


  // ✅ Check if data is in cache
  const cachedCrimeTV = myCache.get("crime-tv-load-more");
  if (cachedCrimeTV) {
    console.log("Returning Crime TV Load More data from cache.");
    return res.json(cachedCrimeTV);
  }

  try {
    const totalResultsNeeded = 80; // Need at least 60 shows (6 rows * 10 items)
    let allCrimeShows = [];

    // List of networks to fetch separately
    const networks = ["213", "2552", "1024"]; // Example: Netflix, Apple, Amazon Prime

    // Fetch multiple pages for each network
    for (let network of networks) {
      for (let page = 1; page <= 3; page++) {
        const response = await axios.get('https://api.themoviedb.org/3/discover/tv', {
          headers: { Authorization: `Bearer ${TMDB_BEARER_TOKEN}` },
          params: {
            with_genres: 80,  // Crime genre
            with_networks: network,  // Fetch one network at a time
            sort_by: 'popularity.desc',
            with_original_language: 'en',
            page: page
          }
        });

        allCrimeShows = allCrimeShows.concat(response.data.results);

        // Stop if we have enough shows
        if (allCrimeShows.length >= totalResultsNeeded) break;
      }
    }

    console.log(`Fetched ${allCrimeShows.length} crime TV shows before filtering`);

    // Remove duplicates (based on TMDB ID)
    const uniqueShows = {};
    allCrimeShows.forEach(show => {
      uniqueShows[show.id] = show;
    });
    allCrimeShows = Object.values(uniqueShows);

    console.log(`After removing duplicates: ${allCrimeShows.length}`);

    // ✅ Filter out unwanted genres (Animation, Soap, Kids, Talk)
    allCrimeShows = allCrimeShows.filter(show => {
      return !show.genre_ids.includes(16) &&  // Exclude Animation
             !show.genre_ids.includes(10766) &&  // Exclude Soap
             !show.genre_ids.includes(10767) &&  // Exclude Talk
             !show.genre_ids.includes(99) &&  // Exclude Documentary
             !show.genre_ids.includes(10762);  // Exclude Kids
    });

    console.log(`After filtering unwanted genres: ${allCrimeShows.length}`);

    // ✅ Filter shows based on `tvshows_tmdb.txt`
    const filteredCrimeShows = allCrimeShows.filter(show => {
      const exists = availableSeriesIds.has(String(show.id)); // Check in tvshows_tmdb.txt
      if (!exists) {
        console.log(`Filtered out Crime TV Show ID: ${show.id} (${show.name})`);
      }
      return exists;
    });

    console.log(`Final filtered crime TV shows count: ${filteredCrimeShows.length}`);

        // ✅ Ensure we return exactly 60 shows
    const finalResults = filteredCrimeShows.slice(0, totalResultsNeeded);

    // ✅ Cache the data for faster access (Expire in 6 hours)
    myCache.set("crime-tv-load-more", finalResults, 43200);

    res.json(finalResults);
  } catch (error) {
    console.error('Error fetching crime TV shows:', error.message);
    res.status(500).json({ message: 'Error fetching crime TV shows', error: error.message });
  }
});


// Route to get Mystery TV Shows (Load More) with Filtering
app.get('/api/mystery-tv-load-more', async (req, res) => {

  // ✅ Check if data is in cache
  const cachedMysteryTV = myCache.get("mystery-tv-load-more");
  if (cachedMysteryTV) {
    console.log("Returning Mystery TV Load More data from cache.");
    return res.json(cachedMysteryTV);
  }

  try {
    const totalResultsNeeded = 80; // Need at least 60 shows (6 rows * 10 items)
    let allMysteryShows = [];

    // List of networks to fetch separately
    const networks = ["213", "2552", "1024"]; // Example: Netflix, HBO, Amazon Prime

    // Fetch multiple pages for each network
    for (let network of networks) {
      for (let page = 1; page <= 3; page++) {
        const response = await axios.get('https://api.themoviedb.org/3/discover/tv', {
          headers: { Authorization: `Bearer ${TMDB_BEARER_TOKEN}` },
          params: {
            with_genres: 9648,  // Mystery genre
            with_networks: network,  // Fetch one network at a time
            sort_by: 'popularity.desc',
            with_original_language: 'en',
            page: page
          }
        });

        allMysteryShows = allMysteryShows.concat(response.data.results);

        // Stop if we have enough shows
        if (allMysteryShows.length >= totalResultsNeeded) break;
      }
    }

    console.log(`Fetched ${allMysteryShows.length} mystery TV shows before filtering`);

    // Remove duplicates (based on TMDB ID)
    const uniqueShows = {};
    allMysteryShows.forEach(show => {
      uniqueShows[show.id] = show;
    });
    allMysteryShows = Object.values(uniqueShows);

    console.log(`After removing duplicates: ${allMysteryShows.length}`);

    // ✅ Filter out unwanted genres (Animation, Soap, Kids, Talk)
    allMysteryShows = allMysteryShows.filter(show => {
      return !show.genre_ids.includes(16) &&  // Exclude Animation
             !show.genre_ids.includes(10766) &&  // Exclude Soap
             !show.genre_ids.includes(10767) &&  // Exclude Talk
             !show.genre_ids.includes(99) &&  // Exclude Documentary
             !show.genre_ids.includes(10762);  // Exclude Kids
    });

    console.log(`After filtering unwanted genres: ${allMysteryShows.length}`);

    // ✅ Filter shows based on `tvshows_tmdb.txt`
    const filteredMysteryShows = allMysteryShows.filter(show => {
      const exists = availableSeriesIds.has(String(show.id)); // Check in tvshows_tmdb.txt
      if (!exists) {
        console.log(`Filtered out Mystery TV Show ID: ${show.id} (${show.name})`);
      }
      return exists;
    });

    console.log(`Final filtered mystery TV shows count: ${filteredMysteryShows.length}`);

     // ✅ Ensure we return exactly 60 shows
    const finalResults = filteredMysteryShows.slice(0, totalResultsNeeded);

    // ✅ Cache the data for faster access (Expire in 6 hours)
    myCache.set("mystery-tv-load-more", finalResults, 43200);

    res.json(finalResults);
  } catch (error) {
    console.error('Error fetching mystery TV shows:', error.message);
    res.status(500).json({ message: 'Error fetching mystery TV shows', error: error.message });
  }
});



// Route to get Reality TV Shows (Load More) with Filtering (Netflix & Amazon Prime)
app.get('/api/reality-tv-load-more', async (req, res) => {

  // ✅ Check if data is in cache
  const cachedRealityTV = myCache.get("reality-tv-load-more");
  if (cachedRealityTV) {
    console.log("Returning Reality TV Load More data from cache.");
    return res.json(cachedRealityTV);
  }

  try {
    const totalResultsNeeded = 100; // Need at least 80 shows
    let allRealityShows = [];

    // List of networks to fetch separately (Netflix, Amazon Prime)
    const networks = ["213", "1024"]; // Netflix, Amazon Prime

    // Fetch multiple pages for each network
    for (let network of networks) {
      for (let page = 1; page <= 3; page++) {
        const response = await axios.get('https://api.themoviedb.org/3/discover/tv', {
          headers: { Authorization: `Bearer ${TMDB_BEARER_TOKEN}` },
          params: {
            with_genres: 10764, // Reality TV genre
            with_networks: network, // Fetch one network at a time
            sort_by: 'popularity.desc',
            with_original_language: 'en',
            page: page
          }
        });

        allRealityShows = allRealityShows.concat(response.data.results);

        // Stop if we have enough shows
        if (allRealityShows.length >= totalResultsNeeded) break;
      }
    }

    console.log(`Fetched ${allRealityShows.length} reality TV shows before filtering`);

    // Remove duplicates (based on TMDB ID)
    const uniqueShows = {};
    allRealityShows.forEach(show => {
      uniqueShows[show.id] = show;
    });
    allRealityShows = Object.values(uniqueShows);

    console.log(`After removing duplicates: ${allRealityShows.length}`);

    // ✅ Filter out shows that aired in 2015 or earlier
    allRealityShows = allRealityShows.filter(show => {
      const airYear = show.first_air_date ? parseInt(show.first_air_date.split('-')[0]) : 0;
      return airYear > 2015; // Only include shows after 2015
    });

    console.log(`After filtering by year > 2015: ${allRealityShows.length}`);

    // ✅ Filter shows based on `tvshows_tmdb.txt`
    const filteredRealityShows = allRealityShows.filter(show => {
      const exists = availableSeriesIds.has(String(show.id)); // Check in tvshows_tmdb.txt
      if (!exists) {
        console.log(`Filtered out Reality TV Show ID: ${show.id} (${show.name})`);
      }
      return exists;
    });

    console.log(`Final filtered reality TV shows count: ${filteredRealityShows.length}`);

     // ✅ Ensure we return exactly 80 shows
     const finalResults = filteredRealityShows.slice(0, totalResultsNeeded);

     // ✅ Cache the data for faster access (Expire in 6 hours)
     myCache.set("reality-tv-load-more", finalResults, 43200);
 
     res.json(finalResults);
   } catch (error) {
     console.error('Error fetching reality TV shows:', error.message);
     res.status(500).json({ message: 'Error fetching reality TV shows', error: error.message });
   }
 });







///////////////////////////////////////////// Route for Anime  from Tmdb ///////////////////////////////////////////////////////////////////

// Fetch Action Anime Series - Filtered by Air Date after 2000 and tv_tmdb.txt
router.get('/api/anime-series', async (req, res) => {
  console.log('Anime API route hit!'); // Debugging log

  // Check if the data is already in the cache
  const cachedData = myCache.get("anime-series");
  if (cachedData) {
    console.log("Returning data from cache.");
    return res.json(cachedData);
  }

  try {
    // Fetch anime series from 3 pages
    const responses = await Promise.all([
      axios.get(`${TMDB_API_URL}/discover/tv`, {
        headers: { Authorization: `Bearer ${TMDB_BEARER_TOKEN}` },
        params: {
          with_genres: '16,10759',  // Genre ID for Action + Animation (Anime)
          with_original_language: 'ja',  // Japanese language
          sort_by: 'popularity.desc',
          page: 1
        }
      }),
      axios.get(`${TMDB_API_URL}/discover/tv`, {
        headers: { Authorization: `Bearer ${TMDB_BEARER_TOKEN}` },
        params: {
          with_genres: '16,10759',  
          with_original_language: 'ja',
          sort_by: 'popularity.desc',
          page: 2
        }
      })
    ]);

    // Combine results from all pages
    let allAnime = responses.flatMap(response => response.data.results);
    console.log(`Total fetched anime series: ${allAnime.length}`);

    // Filter out anime that aired before 2000 and those that have genre 10762 (Reality TV)
    allAnime = allAnime.filter(anime => {
      const airDate = anime.first_air_date;
      return airDate && 
             new Date(airDate) >= new Date('2016-01-01') &&  
             !anime.genre_ids.includes(10762); // Exclude Reality TV genre
    });

    console.log(`After filtering by date & genre: ${allAnime.length}`);

    // ✅ Filter anime series based on `tv_tmdb.txt`
    const filteredAnime = allAnime.filter(anime => {
      const exists = availableSeriesIds.has(String(anime.id)); // Check in tv_tmdb.txt
      if (!exists) {
        console.log(`Filtered out Anime ID: ${anime.id} (${anime.name})`);
      }
      return exists;
    });

    console.log(`Final filtered anime count: ${filteredAnime.length}`);

    // Cache the data for faster access
    myCache.set("anime-series", filteredAnime, 43200);

    res.json(filteredAnime);
  } catch (error) {
    console.error('Error fetching anime series:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to fetch anime series',
      message: error.message,
      details: error.response?.data || 'No additional details'
    });
  }
});

// Set up Express to use the router
app.use(router);


////// TMDB API for series data //////////////////

// Route to get TV series details including seasons and episodes from TMDb API
app.get('/api/tv/:tvId/seasons', async (req, res) => {
  const { tvId } = req.params;

  try {
    // Fetch basic TV show details including seasons
    const seriesResponse = await axios.get(`https://api.themoviedb.org/3/tv/${tvId}?append_to_response=seasons`, {
      headers: {
        Authorization: `Bearer ${TMDB_BEARER_TOKEN}`
      }
    });

    const seasons = seriesResponse.data.seasons;

    // Filter out specials and season 0
    const filteredSeasons = seasons.filter(season => season.name !== "Specials" && season.season_number !== 0);

    // Fetch detailed data for each season's episodes
    const seasonDetailsPromises = filteredSeasons.map(season => 
      axios.get(`https://api.themoviedb.org/3/tv/${tvId}/season/${season.season_number}`, {
        headers: {
          Authorization: `Bearer ${TMDB_BEARER_TOKEN}`
        }
      })
    );

    const seasonDetailsResponses = await Promise.all(seasonDetailsPromises);
    const detailedSeasons = seasonDetailsResponses.map(response => response.data);

    res.json(detailedSeasons);
  } catch (error) {
    console.error('Error fetching seasons details:', error.response ? error.response.data : error.message);
    res.status(500).json({ message: 'Error fetching seasons details', error: error.message });
  }
});




///////////////////////////////////////////////////////// Route for extra movie  duration/////////////////////////////////////////////////////
app.get('/api/movie-runtime/:movieId', async (req, res) => {
  const { movieId } = req.params;

  try {
    const response = await axios.get(`https://api.themoviedb.org/3/movie/${movieId}`, {
      headers: { Authorization: `Bearer ${TMDB_BEARER_TOKEN}` }
    });

    const runtime = response.data.runtime;

    if (runtime !== undefined) {
      res.json({ runtime });
    } else {
      res.status(404).json({ message: 'Runtime not found for this movie' });
    }
  } catch (error) {
    console.error('Error fetching movie runtime:', error.message);
    res.status(500).json({ message: 'Error fetching movie runtime', error: error.message });
  }
});


///////////////////////////////////////////////// ROUTE FOR FETCHING TMDB DATA FOR MOVIE/SERIES BY ID (MY LIST) ///////////////////////////////////////////

app.get('/api/tmdb/:id', async (req, res) => {
  const { id } = req.params;

  try {
      // ✅ Check if the favorite exists in MongoDB (to get mediaType)
      const favorite = await Favorite.findOne({ "favorites.tmdbId": id }, { "favorites.$": 1 });

      if (!favorite || !favorite.favorites || favorite.favorites.length === 0) {
          return res.status(404).json({ message: "Favorite not found in database" });
      }

      const mediaType = favorite.favorites[0].mediaType; // ✅ Get mediaType from DB

      // ✅ Fetch from TMDB API based on mediaType
      const tmdbUrl = mediaType === "movie"
          ? `https://api.themoviedb.org/3/movie/${id}`
          : `https://api.themoviedb.org/3/tv/${id}`;

      const response = await axios.get(tmdbUrl, {
          headers: { Authorization: `Bearer ${TMDB_BEARER_TOKEN}` }
      });

      // ✅ Convert genres object to genre_ids array
      const genreIds = response.data.genres ? response.data.genres.map(genre => genre.id) : [];
      response.data.genre_ids = genreIds;

      res.json(response.data);
  } catch (error) {
      console.error(`Error fetching TMDB data for ID: ${id}`, error.message);
      res.status(500).json({ message: "Error fetching TMDB data", error: error.message });
  }
});


//////////////////////////////////////////////////////// Route for vidsrc.me API fetching video ///////////////////////////////////////////////////////////////////////////////////////////////





// Vidsrc.me Movie Route //
app.get('/api/movie/:id/streams', async (req, res) => {
  const movieId = req.params.id;

  // Validate if movieId is provided
  if (!movieId) {
    return res.status(400).json({ message: 'Movie ID is required' });
  }

  try {
      // Construct the Vidsrc embed URL using the tmdb ID
      const embedUrl = `https://vidsrc.xyz/embed/movie?tmdb=${movieId}`;

      // Log the embed URL to verify it's being constructed correctly
      console.log('Generated Embed URL:', embedUrl);

      // Send the URL to the frontend
      res.json({ videoUrl: embedUrl });
  } catch (error) {
      console.error('Error fetching movie streams:', error.message);
      res.status(500).json({ message: 'Error fetching movie streams', error: error.message });
  }
});






/// Vidsrc.me TV Shows Route// 
app.get('/api/tv/:id/season/:season/episode/:episode/streams', async (req, res) => {
  const { id, season, episode } = req.params;

  // Validate if all parameters are provided
  if (!id || !season || !episode) {
    return res.status(400).json({ message: 'TV Show ID, season, and episode are required' });
  }

  console.log('Received request for:', { id, season, episode }); // Added log to check incoming data

  try {
      // Construct the Vidsrc embed URL for TV episodes using the TMDB ID
      const embedUrl = `https://vidsrc.xyz/embed/tv?tmdb=${id}&season=${season}&episode=${episode}`;

      // Log the embed URL to verify correctness
      console.log('Generated TV Embed URL:', embedUrl);

      // Send the embed URL to the frontend
      res.json({ videoUrl: embedUrl });
  } catch (error) {
      console.error('Error fetching episode streams:', error.message);
      res.status(500).json({ message: 'Error fetching episode streams', error: error.message });
  }
});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



///////// route for vidsrc.cc api fetching video ////////////

// Route to get movie embed URL from Vidsrc.cc API
app.get('/api/movie/:id/embed', async (req, res) => {
  const movieId = req.params.id;
  try {
    // Construct the Vidsrc embed URL
    const videoUrl = `https://vidsrc.cc/v2/embed/movie/${movieId}`;
    res.json({ videoUrl });
  } catch (error) {
    console.error('Error fetching movie embed URL:', error.message);
    res.status(500).json({ message: 'Error fetching movie embed URL', error: error.message });
  }
});



// Route to get TV show embed URL from Vidsrc.cc API
app.get('/api/tv/:id/embed', async (req, res) => {
  const tvId = req.params.id;
  try {
    // Construct the Vidsrc embed URL
    const videoUrl = `https://vidsrc.cc/v2/embed/tv/${tvId}`;
    res.json({ videoUrl });
  } catch (error) {
    console.error('Error fetching TV show embed URL:', error.message);
    res.status(500).json({ message: 'Error fetching TV show embed URL', error: error.message });
  }
});

// Route to get TV show episode embed URL from Vidsrc.cc API
app.get('/api/tv/:id/episode/:season/:episode/embed', async (req, res) => {
  const { id, season, episode } = req.params;
  try {
    // Construct the Vidsrc embed URL
    const videoUrl = `https://vidsrc.cc/v2/embed/tv/${id}/${season}/${episode}`;
    res.json({ videoUrl });
  } catch (error) {
    console.error('Error fetching TV show episode embed URL:', error.message);
    res.status(500).json({ message: 'Error fetching TV show episode embed URL', error: error.message });
  }
});




///////////////////////////////

// Route to fetch movie backdrop image from TMDb
app.get('/api/movie/:id/backdrop', async (req, res) => {
  const { id } = req.params;

  try {
    const response = await axios.get(`https://api.themoviedb.org/3/movie/${id}/images`, {
      headers: { Authorization: `Bearer ${TMDB_BEARER_TOKEN}` }
    });

    const backdrops = response.data.backdrops;
    if (backdrops.length > 0) {
      const backdropUrl = `https://image.tmdb.org/t/p/original${backdrops[0].file_path}`;
      res.json({ backdrop_path: backdropUrl });
    } else {
      res.status(404).json({ message: 'Backdrop not found' });
    }
  } catch (error) {
    console.error('Error fetching backdrop:', error.response?.data || error.message);
    res.status(500).json({ message: 'Error fetching backdrop', error: error.message });
  }
});


///////////////////////////////// Route to get Arabic series from arabic_series.json  //////////////////////////////////////////////////////////////////////////////

// Route to serve Arabic series data from arabic_series.json
app.get('/api/arabic-series', (req, res) => {
  fs.readFile(path.join(__dirname, 'data', 'arabic_series.json'), 'utf-8', (err, data) => {
    if (err) {
      console.error('Error reading Arabic series data:', err);
      res.status(500).json({ message: 'Error reading Arabic series data', error: err.message });
    } else {
      res.json(JSON.parse(data));
    }
  });
});

// Helper function to remove year from title
function removeYearFromTitle(title) {
  return title.replace(/\(\d{4}\)/, '').trim();
}

// Route to search for a movie or series by its original title
app.get('/api/movie/search', async (req, res) => {
  let title = req.query.title;
  title = removeYearFromTitle(title); // Remove year from title

  try {
    // Search for movies
    const movieResponse = await axios.get('https://api.themoviedb.org/3/search/movie', {
      headers: {
        Authorization: `Bearer ${TMDB_BEARER_TOKEN}`
      },
      params: {
        query: title,
        language: 'ar'  // Optional: adjust language if needed
      }
    });
    const movieResults = movieResponse.data.results;

    if (movieResults.length > 0) {
      // If a movie is found
      const movie = movieResults[0]; // Assuming the first result is the best match
      return res.json({ id: movie.id, type: 'movie' });
    }

    // Search for TV shows if no movie is found
    const tvResponse = await axios.get('https://api.themoviedb.org/3/search/tv', {
      headers: {
        Authorization: `Bearer ${TMDB_BEARER_TOKEN}`
      },
      params: {
        query: title,
        language: 'ar'  // Optional: adjust language if needed
      }
    });
    const tvResults = tvResponse.data.results;

    if (tvResults.length > 0) {
      // If a TV show is found
      const tvShow = tvResults[0]; // Assuming the first result is the best match
      return res.json({ id: tvShow.id, type: 'tv' });
    }

    // No results found for either movies or TV shows
    res.status(404).json({ message: 'Movie or TV show not found' });
  } catch (error) {
    console.error('Error searching for movie or TV show:', error.response ? error.response.data : error.message);
    res.status(500).json({ message: 'Error searching for movie or TV show', error: error.message });
  }
});

// Route to get trailer from TMDb API for both movies and TV shows
app.get('/api/media/:type/:id/trailer', async (req, res) => {
  const { type, id } = req.params; // Extract type (movie or tv) and id from params

  // Determine the correct endpoint based on the type (movie or tv)
  const endpoint = type === 'tv' 
    ? `https://api.themoviedb.org/3/tv/${id}/videos`
    : `https://api.themoviedb.org/3/movie/${id}/videos`;

  try {
    const response = await axios.get(endpoint, {
      headers: {
        Authorization: `Bearer ${TMDB_BEARER_TOKEN}`
      }
    });

    const videos = response.data.results;
    // Find the YouTube trailer from the list of videos
    const trailer = videos.find(video => video.type === 'Trailer' && video.site === 'YouTube');

    if (trailer) {
      res.json({ youtube_trailer: trailer.key });
    } else {
      res.status(404).json({ message: 'Trailer not found' });
    }
  } catch (error) {
    console.error('Error fetching trailer:', error.response ? error.response.data : error.message);
    res.status(500).json({ message: 'Error fetching trailer', error: error.message });
  }
});

// Route to get movie trailer from YouTube Data API
app.get('/api/search/youtube', async (req, res) => {
  const query = req.query.query;
  try {
    const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet',
        q: `${query} trailer`,
        type: 'video',
        maxResults: 1,
        key: YOUTUBE_API_KEY
      }
    });
    const videos = response.data.items;
    if (videos.length > 0) {
      const trailer = videos[0].id.videoId; // Get the first result
      res.json({ youtube_trailer: trailer });
    } else {
      res.json({ youtube_trailer: null });
    }
  } catch (error) {
    console.error('Error fetching YouTube trailer:', error.response ? error.response.data : error.message);
    res.status(500).json({ message: 'Error fetching YouTube trailer', error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running at https://cimaway.com:${port}`);
});


// ROUTE FOR MOVIE DATA BY ID //
app.get('/api/movie/:id', async (req, res) => {
  try {
      const movieId = req.params.id;
      const response = await axios.get(`${TMDB_API_URL}/movie/${movieId}`, {
          headers: {
              Authorization: `Bearer ${TMDB_BEARER_TOKEN}`
          }
      });

      console.log('TMDB Movie Data:', response.data);  // ✅ Debugging

      res.json(response.data);
  } catch (error) {
      console.error('Error fetching movie details:', error.response?.data || error.message);
      res.status(500).json({ message: 'Error fetching movie details', error: error.message });
  }
});



app.get('/api/tv/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const response = await axios.get(`https://api.themoviedb.org/3/tv/${id}`, {
      headers: { Authorization: `Bearer ${TMDB_BEARER_TOKEN}` },
      params: { append_to_response: 'videos,images,seasons' }
    });

    res.json(response.data);
  } catch (error) {
    console.error(`Error fetching TV series details for ID ${id}:`, error.message);
    res.status(500).json({ message: 'Error fetching TV series details', error: error.message });
  }
});


// Turkish JSON file Route // 
app.get('/api/turkish-series', (req, res) => {
  fs.readFile(turkishSeriesFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading Turkish series file:', err);
      return res.status(500).json({ error: 'Failed to load Turkish series data' });
    }
    res.json(JSON.parse(data));
  });
});


// Route to fetch series data by ID
app.get('/local-seasons', (req, res) => {
  const seriesId = req.query.id; // Get series ID from the request

  if (!seriesId) {
    return res.status(400).json({ error: 'Series ID is required' });
  }

  const filePath = path.join(__dirname, 'public/data/local_seasons.json');

  // Read the JSON file
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading local_seasons.json:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    try {
      const localSeasons = JSON.parse(data);
      const series = localSeasons.find(s => s.id === seriesId);

      if (!series) {
        return res.status(404).json({ error: 'Series not found' });
      }

      res.json(series);
    } catch (parseError) {
      console.error('Error parsing local_seasons.json:', parseError);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
});




const clients = {}; // Store active users' SSE connections

// Server-Sent Events (SSE) for real-time session updates
app.get('/api/session-events', requireAuth, (req, res) => {
    const username = req.user.username;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    clients[username] = res; // Store SSE connection for this user

    // Remove client when connection closes
    req.on('close', () => {
        delete clients[username];
    });
});

// Function to notify a user that they should log out
async function notifyLogout(username) {
    if (clients[username]) {
        clients[username].write("data: logout\n\n"); // Send logout event
        clients[username].end(); // Close connection
        delete clients[username]; // Remove from active users list
    }
}

// Modify login route to notify the old session before creating a new one
app.post('/api/login', async (req, res) => {
    console.log("Login Request Received:", req.body);
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ message: "User not found" });

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) return res.status(400).json({ message: "Invalid password" });

        // ✅ Notify and log out any existing session before setting a new one
        notifyLogout(username);
        await User.updateOne({ username }, { $set: { deviceSession: null } });

        // Generate new session token
        const sessionToken = jwt.sign({ username: user.username }, SECRET_KEY, { expiresIn: "30d" });

        // Store new session in database
        await User.updateOne({ username }, { $set: { deviceSession: sessionToken } });

        // ✅ Send cookie properly
        res.cookie("sessionToken", sessionToken, {
            httpOnly: true,
            secure: false,  // Change to `true` in production (requires HTTPS)
            sameSite: "Lax",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.json({ message: "Login successful", sessionToken });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Server error" });
    }
});






//LOG OUT API
app.post('/api/logout', requireAuth, async (req, res) => {
  // Remove session from database
  await User.updateOne({ username: req.user.username }, { $set: { deviceSession: null } });

  // Clear session cookie
  res.clearCookie("sessionToken");
  res.json({ message: "Logged out successfully" });
});










// ADMIN ONLY ROUTE // 
app.post('/api/admin/create-user', requireAdmin, async (req, res) => {
  try {
      const { username, password, subscriptionExpiry, accountName, accountPhone, agentName, agentPhone, type } = req.body;

      // ✅ Check if username already exists
      const existingUser = await User.findOne({ username });
      if (existingUser) return res.status(400).json({ message: "Username already exists" });

      // ✅ Hash password before saving
      const passwordHash = await bcrypt.hash(password, 10);

      // ✅ Create new user
      const newUser = new User({
          username,
          passwordHash,
          subscriptionExpiry,
          accountName: accountName || "",
          accountPhone: accountPhone || "",
          agentName: agentName || "",
          agentPhone: agentPhone || "",
          type: type || "trial" // ✅ Defaults to "trial" if not provided
      });

      await newUser.save();
      res.json({ message: "User created successfully" });

  } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Server error" });
  }
});



//ADMIN ONLY FETCH DATA LIST
app.get('/api/admin/users', requireAdmin, async (req, res) => {
  try {
      // Fetch all users from the database
      const users = await User.find({}, 'username subscriptionExpiry accountName accountPhone agentName agentPhone accountCreationDate  type').lean();

      // ✅ Add active status dynamically
      const usersWithStatus = users.map(user => ({
          ...user,
          active: user.subscriptionExpiry > new Date() // True if expiry is in the future
      }));

      res.json(usersWithStatus);
  } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Server error" });
  }
});

// ✅ Edit User (Admin Only) - Excludes Expiry Date
app.post('/api/admin/edit-user', requireAdmin, async (req, res) => {
  try {
      const { userId, accountName, accountPhone, agentName, agentPhone, type } = req.body;

      const updatedUser = await User.findByIdAndUpdate(
          userId,
          { accountName, accountPhone, agentName, agentPhone, type }, // ✅ Removed subscriptionExpiry
          { new: true }
      );

      if (!updatedUser) {
          return res.status(404).json({ message: "User not found" });
      }

      res.json({ message: "User updated successfully" });

  } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Server error" });
  }
});



// Update Expiry Date ADMIN ONLY //
app.post('/api/admin/update-expiry', requireAdmin, async (req, res) => {
  try {
      const { userId, subscriptionExpiry } = req.body;

      const updatedUser = await User.findByIdAndUpdate(
          userId,
          { subscriptionExpiry },
          { new: true }
      );

      if (!updatedUser) {
          return res.status(404).json({ message: "User not found" });
      }

      res.json({ message: "Subscription expiry updated successfully" });

  } catch (error) {
      console.error("Error updating expiry date:", error);
      res.status(500).json({ message: "Server error" });
  }
});


// ✅ Delete User (Admin Only)
app.post('/api/admin/delete-user', requireAdmin, async (req, res) => {
  try {
      const { userId } = req.body;
      const deletedUser = await User.findByIdAndDelete(userId);

      if (!deletedUser) return res.status(400).json({ message: "User not found" });

      res.json({ message: "User deleted successfully" });
  } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Server error" });
  }
});



/////////////////////////////////////////////////////////////////////// Notifications Route  ////////////////////////////////////////////////////////////////////////////

app.post('/api/admin/send-notification', requireAdmin, async (req, res) => {
  try {
      if (!req.user.isAdmin) {
          return res.status(403).json({ message: "Access denied." });
      }

      const { message, recipient, duration } = req.body;
      if (!message || !duration) {
          return res.status(400).json({ message: "Missing required fields." });
      }

      // Determine expiration date based on duration
      let expiresAt = new Date();
      switch (duration) {
          case "1 day": expiresAt.setDate(expiresAt.getDate() + 1); break;
          case "3 days": expiresAt.setDate(expiresAt.getDate() + 3); break;
          case "1 week": expiresAt.setDate(expiresAt.getDate() + 7); break;
          case "1 month": expiresAt.setMonth(expiresAt.getMonth() + 1); break;
          default: return res.status(400).json({ message: "Invalid duration." });
      }

      // Save notification
      await Notification.create({ message, recipient: recipient || "all", expiresAt });

      res.json({ message: "Notification sent successfully!" });

  } catch (error) {
      console.error("Error sending notification:", error);
      res.status(500).json({ message: "Server error" });
  }
});




app.get('/api/user/notifications', requireAuth, async (req, res) => {
  try {
      const now = new Date();

      // Remove expired notifications
      await Notification.deleteMany({ expiresAt: { $lte: now } });

      // Fetch active notifications (for the user or global ones)
      const notifications = await Notification.find({
          $or: [
              { recipient: "all" },
              { recipient: req.user.username }
          ]
      }).sort({ createdAt: -1 });

      res.json({ notifications });

  } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Server error" });
  }
});



/////////////////////////////////////////////////////////////////// Routes for ARABIC/TURSKIH MY LIST DATA ////////////////////////////////////////////////////////////////////////////////////

app.post('/api/user/arabic-turkish-favorites', requireAuth, async (req, res) => {
  try {
      const { tmdbId, remove } = req.body;
      const mediaType = 'tv'; // Always "tv" for Arabic/Turkish series

      if (!tmdbId) return res.status(400).json({ message: "Missing TMDB ID." });

      let favorite = await ArabicTurkishFavorite.findOne({ username: req.user.username });

      if (!favorite) {
          if (remove) {
              return res.status(400).json({ message: "Item not found in favorites." });
          }
          // Create a new favorite list if user has none
          favorite = await ArabicTurkishFavorite.create({ 
              username: req.user.username, 
              tmdbIds: [tmdbId],  
              favorites: [{ tmdbId, mediaType }]
          });
          return res.json({ message: "Added to Arabic/Turkish favorites", favorites: favorite.favorites });
      }

      // **Handle removal first**
      if (remove) {
          const indexToRemove = favorite.favorites.findIndex(fav => fav.tmdbId === tmdbId);
          if (indexToRemove !== -1) {
              favorite.favorites.splice(indexToRemove, 1);
              favorite.tmdbIds = favorite.tmdbIds.filter(id => id !== tmdbId); 
              await favorite.save();
              return res.json({ message: "Removed from Arabic/Turkish favorites", favorites: favorite.favorites });
          } else {
              return res.status(400).json({ message: "Item not found in favorites." });
          }
      }

      // **Check if already exists before adding**
      const alreadyExists = favorite.tmdbIds.includes(tmdbId);
      if (alreadyExists) {
          return res.json({ message: "Already exists in Arabic/Turkish favorites", favorites: favorite.favorites });
      }

      // Add to favorites and ensure unique tmdbId
      console.log('Adding new favorite:', tmdbId);
      favorite.favorites.push({ tmdbId, mediaType });
      favorite.tmdbIds.push(tmdbId);

      await favorite.save();
      return res.json({ message: "Added to Arabic/Turkish favorites", favorites: favorite.favorites });

  } catch (error) {
      console.error("Error updating Arabic/Turkish favorites:", error);
      res.status(500).json({ message: "Server error" });
  }
});


// Route to get Arabic/Turkish favorites for the user
app.get('/api/user/arabic-turkish-favorites', requireAuth, async (req, res) => {
  try {
      const favorite = await ArabicTurkishFavorite.findOne({ username: req.user.username }).select('favorites -_id');
      res.json({ favorites: favorite ? favorite.favorites : [] });
  } catch (error) {
      console.error("Error fetching Arabic/Turkish favorites:", error);
      res.status(500).json({ message: "Server error" });
  }
});


// Route to fetch series data (Arabic/Turkish favorites) from TMDB
app.get('/api/tmdb/arabic-turkish/:id', async (req, res) => {
  const { id } = req.params;

  try {
      // Check if the favorite exists in MongoDB
      const favorite = await ArabicTurkishFavorite.findOne({ "favorites.tmdbId": id }, { "favorites.$": 1 });

      if (!favorite || !favorite.favorites || favorite.favorites.length === 0) {
          return res.status(404).json({ message: "Favorite not found in database" });
      }

      // Fetch TV series data from TMDB
      const tmdbUrl = `https://api.themoviedb.org/3/tv/${id}`;
      const response = await axios.get(tmdbUrl, {
          headers: { Authorization: `Bearer ${TMDB_BEARER_TOKEN}` }
      });

      // Convert genres object to genre_ids array
      const genreIds = response.data.genres ? response.data.genres.map(genre => genre.id) : [];
      response.data.genre_ids = genreIds;

      res.json(response.data);
  } catch (error) {
      console.error(`Error fetching TMDB data for Arabic/Turkish ID: ${id}`, error.message);
      res.status(500).json({ message: "Error fetching TMDB data", error: error.message });
  }
});


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////





// ✅ Toggle favorite for a user (now stores mediaType)
app.post('/api/user/favorites', requireAuth, async (req, res) => {
  try {
      const { tmdbId, mediaType } = req.body;
      if (!tmdbId || !mediaType) return res.status(400).json({ message: "Missing TMDB ID or mediaType." });

      let favorite = await Favorite.findOne({ username: req.user.username });

      if (!favorite) {
          // ✅ Create new favorite list if user has none
          favorite = await Favorite.create({ 
              username: req.user.username, 
              favorites: [{ tmdbId, mediaType }]
          });
          return res.json({ message: "Added to favorites", favorites: favorite.favorites });
      }

      // ✅ Toggle favorite (add/remove)
      const existingIndex = favorite.favorites.findIndex(fav => fav.tmdbId === tmdbId);
      if (existingIndex !== -1) {
          favorite.favorites.splice(existingIndex, 1); // ✅ Remove if exists
          await favorite.save();
          return res.json({ message: "Removed from favorites", favorites: favorite.favorites });
      } 

      // ✅ Add new favorite
      favorite.favorites.push({ tmdbId, mediaType });
      await favorite.save();
      res.json({ message: "Added to favorites", favorites: favorite.favorites });

  } catch (error) {
      console.error("Error updating favorites:", error);
      res.status(500).json({ message: "Server error" });
  }
});




// ✅ Get all favorites for the logged-in user (now includes mediaType)
app.get('/api/user/favorites', requireAuth, async (req, res) => {
  try {
      const favorite = await Favorite.findOne({ username: req.user.username }).select('favorites -_id');
      res.json({ favorites: favorite ? favorite.favorites : [] });
  } catch (error) {
      console.error("Error fetching favorites:", error);
      res.status(500).json({ message: "Server error" });
  }
});


// ✅ ROUTE FOR VIEW PROFILE DATA
app.get('/api/user/profile', requireAuth, async (req, res) => {
  try {
      const user = await User.findOne({ username: req.user.username }).select('username accountCreationDate subscriptionExpiry');

      if (!user) return res.status(404).json({ message: "User not found" });

      res.json({
          username: user.username,
          createdAt: user.accountCreationDate ? new Date(user.accountCreationDate).toDateString() : "N/A",
          expiryDate: user.subscriptionExpiry ? new Date(user.subscriptionExpiry).toDateString() : "N/A"
      });

  } catch (error) {
      console.error("❌ Error fetching profile:", error);
      res.status(500).json({ message: "Server error" });
  }
});

//////////////////////////////////////////////////////////////////////////// ROUTES FOR AGENT RELATED ////////////////////////////////////////////////////////////////////////////////////////

app.post('/agents/register', async (req, res) => {
  const { username, password, phoneNumber } = req.body;

  try {
    // Check if the username already exists
    const existingAgent = await Agent.findOne({ username });
    if (existingAgent) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    // Hash the password before saving it
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate wallet for the agent
    const newWallet = generateBEP20Wallet();
    const encryptedPrivateKey = encryptPrivateKey(newWallet.privateKey);  // Encrypt private key

    // Log the encrypted private key and IV to check if it's correct
    console.log('Encrypted Private Key:', encryptedPrivateKey.encryptedPrivateKey);
    console.log('IV:', encryptedPrivateKey.iv);

    const newAgent = new Agent({
      username,
      passwordHash: hashedPassword,
      phoneNumber,
      walletAddress: newWallet.address,
      privateKey: encryptedPrivateKey.encryptedPrivateKey,  // Store encrypted private key
      iv: encryptedPrivateKey.iv,  // Store the IV to decrypt the private key later
      balance: 0 // Initialize balance at 0
    });

    await newAgent.save();

    res.status(201).json({ message: 'Agent registered successfully', agent: newAgent });
  } catch (error) {
    // Log the full error to understand what went wrong
    console.error('Error registering agent:', error);
    res.status(500).json({ message: 'Error registering agent', error: error.message });
  }
});


// Login route for agents
app.post('/agents/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const agent = await Agent.findOne({ username });
    if (!agent) {
      return res.status(400).json({ message: 'Agent not found' });
    }

    // Compare the provided password with the stored password
    const isMatch = await bcrypt.compare(password, agent.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    // Create a token (you can adjust the payload as needed)
    const token = jwt.sign({ agentId: agent._id }, 'yourJWTSecret', { expiresIn: '15d' });

    res.status(200).json({ message: 'Login successful', token });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error });
  }
});


// Middleware to check agent authentication
const requireAgentAuth = async (req, res, next) => {
  const token = req.headers.authorization && req.headers.authorization.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized. Please log in.' });
  }

  try {
    const decoded = jwt.verify(token, 'yourJWTSecret');
    const agent = await Agent.findById(decoded.agentId);

    if (!agent) {
      return res.status(401).json({ message: 'Agent not found' });
    }

    req.agent = agent; // Store agent data for later use
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

/////////////////////////////////////////////////////////////////////// DASHBOARD ROUTES FOR AGENTS ////////////////////////////////////////////////////////////////////////////////////////

// Route to get agent information (used on the dashboard)
app.get('/agents/me', requireAgentAuth, async (req, res) => {
  try {
      const agent = req.agent; // The agent is already available from the authentication middleware
      res.status(200).json({
          username: agent.username,
          phoneNumber: agent.phoneNumber,
          balance: agent.balance,
          walletAddress: agent.walletAddress,
      });
  } catch (error) {
      res.status(500).json({ message: 'Error retrieving agent data', error });
  }
});

// Allow agents to create user route
app.post('/agents/create-user', requireAgentAuth, async (req, res) => {
  console.log('Request body:', req.body); // Log the entire request body

  // Change `duration` to `subscriptionDuration`
  const { username, password, subscriptionDuration, accountName, accountPhone } = req.body;
  const agent = req.agent; // Extract agent details from auth middleware

  const subscriptionPrices = {
      "1": 2,   // 1 Month
      "6": 12,  // 6 Months
      "12": 24  // 1 Year
  };

  console.log('Received duration:', subscriptionDuration); // Log the received subscription duration

  // Check if the duration exists in subscriptionPrices
  if (!subscriptionPrices[subscriptionDuration]) {
      console.log('Invalid duration detected:', subscriptionDuration); // Log when duration is invalid
      return res.status(400).json({ message: "Invalid subscription duration." });
  }

  const cost = subscriptionPrices[subscriptionDuration];
  console.log('Subscription cost for duration:', cost); // Log the cost for the selected duration

  // Check if agent has enough balance
  console.log('Agent balance:', agent.balance); // Log the agent's balance
  if (agent.balance < cost) {
      console.log('Insufficient balance:', agent.balance, 'Cost:', cost); // Log if balance is insufficient
      return res.status(400).json({ message: "Insufficient balance." });
  }

  try {
      // Check if username is already taken
      const existingUser = await User.findOne({ username });
      if (existingUser) {
          console.log('Username already taken:', username); // Log if username is already taken
          return res.status(400).json({ message: "Username already taken." });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Calculate expiry date
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + parseInt(subscriptionDuration));
      console.log('Calculated expiry date:', expiryDate); // Log the calculated expiry date

      // Create new user with required & auto-filled fields
      const newUser = new User({
          username,
          passwordHash: hashedPassword,
          subscriptionExpiry: expiryDate,
          type: "paid",
          accountName: accountName || "",
          accountPhone: accountPhone || "",
          agentName: agent.username,
          agentPhone: agent.phoneNumber,
          accountCreationDate: new Date()
      });

      await newUser.save();
      console.log('New user created:', newUser); // Log the newly created user

      // Deduct balance from agent
      agent.balance -= cost;
      await agent.save();
      console.log('Agent balance after deduction:', agent.balance); // Log the agent's balance after deduction

      res.status(201).json({ message: "User created successfully.", user: newUser });
  } catch (error) {
      console.error('Error creating user:', error); // Log the error
      res.status(500).json({ message: "Error creating user.", error });
  }
});


// Allow agents to fetch the list of users they created
app.get('/agents/users', requireAgentAuth, async (req, res) => {
  const agent = req.agent; // Extract agent details from auth middleware

  try {
    // Find users where agentName matches the logged-in agent
    const users = await User.find({ agentName: agent.username }).select(
      'username subscriptionExpiry accountName accountPhone accountCreationDate'
    );

    // Format the user data to include active status based on subscription expiry
    const formattedUsers = users.map(user => {
      const isActive = new Date(user.subscriptionExpiry) > new Date();
      return {
        username: user.username,
        subscriptionExpiry: user.subscriptionExpiry,
        activeStatus: isActive ? 'Active' : 'Inactive',
        accountName: user.accountName,
        accountPhone: user.accountPhone,
        accountCreationDate: user.accountCreationDate
      };
    });

    res.status(200).json({ users: formattedUsers });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: "Error fetching users." });
  }
});

// Allow agents to renew subscriptions for users
app.post('/agents/renew-subscription', requireAgentAuth, async (req, res) => {
  const { username, subscriptionDuration } = req.body;
  const agent = req.agent; // Extract agent details from auth middleware

  const subscriptionPrices = {
      "1": 2,   // 1 Month
      "6": 12,  // 6 Months
      "12": 24  // 1 Year
  };

  // Check if subscriptionDuration is valid
  if (!subscriptionPrices[subscriptionDuration]) {
      return res.status(400).json({ message: "Invalid subscription duration." });
  }

  const cost = subscriptionPrices[subscriptionDuration];

  // Check if agent has enough balance
  if (agent.balance < cost) {
      return res.status(400).json({ message: "Insufficient balance." });
  }

  try {
      // Find user and verify that this agent created them
      const user = await User.findOne({ username, agentName: agent.username });
      if (!user) {
          return res.status(404).json({ message: "User not found or does not belong to this agent." });
      }

      // Update subscription expiry date
      const currentDate = new Date();
      let newExpiry;

      // If the subscription is expired, start from today; otherwise, extend from the existing expiry
      if (new Date(user.subscriptionExpiry) < currentDate) {
          newExpiry = new Date(currentDate); // Start from today
      } else {
          newExpiry = new Date(user.subscriptionExpiry); // Continue from current expiry
      }

      // Add the subscription duration in months
      newExpiry.setMonth(newExpiry.getMonth() + parseInt(subscriptionDuration, 10));

      // Save the new expiry date
      user.subscriptionExpiry = newExpiry;
      await user.save();

      // Deduct balance from agent
      agent.balance -= cost;
      await agent.save();

      res.status(200).json({ message: "Subscription renewed successfully.", newExpiry: newExpiry });
  } catch (error) {
      console.error('Error renewing subscription:', error);
      res.status(500).json({ message: "Error renewing subscription.", error });
  }
});

// Route to get deposit history for the logged-in agent
app.get('/agents/deposits', requireAgentAuth, async (req, res) => {
  const agent = req.agent; // Extract agent details from auth middleware

  try {
    // Fetch deposits where agentUsername matches the logged-in agent
    const deposits = await Deposit.find({ agentUsername: agent.username })
      .sort({ timestamp: -1 }) // Sort deposits by timestamp in descending order
      .exec();

    // Return the deposit data as a response
    res.status(200).json({ deposits });
  } catch (error) {
    console.error('Error fetching deposit history:', error);
    res.status(500).json({ message: "Error fetching deposit history.", error });
  }
});


////////////////////////////////////////////////////////////// Routes for Agents in ADMIN PANEL (GET AGENT LIST ETC...) //////////////////////////////////////////////////////////////////////

// Route for fetching Agents for Admin Panel
app.get('/api/admin/agents', requireAdmin, async (req, res) => {
  try {
      const agents = await Agent.find({}, 'username phoneNumber balance createdAt walletAddress');

      // Fetch user counts for each agent
      const agentData = await Promise.all(agents.map(async (agent) => {
          const userCount = await User.countDocuments({ agentName: agent.username });

          return {
              _id: agent._id,
              username: agent.username,
              phoneNumber: agent.phoneNumber,
              balance: agent.balance,
              createdAt: agent.createdAt,
              totalUsers: userCount, // New field showing total users
              walletAddress: agent.walletAddress,
              privateKey: "Hidden" // Send "Hidden" instead of private key
          };
      }));

      res.json(agentData);
  } catch (error) {
      console.error('Error fetching agents:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
});

// Route for decrypting private key for an agent
app.get('/api/admin/decrypt-key/:agentId', requireAdmin, async (req, res) => {
  try {
      const agent = await Agent.findById(req.params.agentId);
      if (!agent || !agent.privateKey || !agent.iv) {
          return res.status(404).json({ error: 'Agent or private key not found' });
      }

      let decryptedPrivateKey;
      try {
          decryptedPrivateKey = decryptPrivateKey(agent.privateKey, agent.iv);
      } catch (decryptError) {
          console.error('Error decrypting private key:', decryptError);
          return res.status(500).json({ error: 'Failed to decrypt private key' });
      }

      res.json({ privateKey: decryptedPrivateKey });
  } catch (error) {
      console.error('Error fetching private key:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
});


// Update agent details (Admin Panel)
app.put('/api/admin/agents/:id', requireAdmin, async (req, res) => {
  try {
      const agentId = req.params.id;
      const { phoneNumber, balance } = req.body; // Ensure correct field names

      const updatedFields = {};
      if (phoneNumber) updatedFields.phoneNumber = phoneNumber;
      if (balance !== undefined) updatedFields.balance = balance;

      const result = await Agent.findByIdAndUpdate(agentId, { $set: updatedFields }, { new: true });

      if (!result) {
          return res.status(404).json({ error: 'Agent not found' });
      }

      res.json({ message: 'Agent updated successfully', agent: result });
  } catch (error) {
      console.error('Error updating agent:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
});

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// Serve agent Dashboard page
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});


// Serve agent login page
app.get('/agentlogin', (req, res) => {
  res.sendFile(path.join(__dirname, 'agentlogin.html'));
});

// SERVE SUBSCRIPTION-ENDED PAGE 
app.get('/subscription-ended', (req, res) => {
  res.sendFile(path.join(__dirname, 'subscription-ended.html'));
});


// Serve the login page for unauthenticated users
app.get('*', (req, res) => {
  if (!req.cookies.sessionToken) {
      return res.sendFile(path.join(__dirname, 'login.html')); // Show login page
  }
  res.sendFile(path.join(__dirname, 'index.html')); // Show main site if logged in
});





