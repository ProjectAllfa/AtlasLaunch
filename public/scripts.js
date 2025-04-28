
//////////////////////////////////////////////////////////////// Remote Control Keys Navigation header/NavBar ///////////////////////////////////////////////////////////////


//////////////////////////////////////////////////////////////// ADD TO HOME PROMPT MODAL ///////////////////////////////////////////////////////////////////////////////////

window.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('add_to_home_prompt') === 'true') {
    showAddToHomeModal();
  }
});

function showAddToHomeModal() {
  const modal = document.createElement('div');
  modal.classList.add('cimaway-add-home-overlay');
  modal.innerHTML = `
    <div class="cimaway-add-home-modal">
      <span class="cimaway-add-home-close">&times;</span>
      <i class="fas fa-mobile-alt cimaway-add-home-icon"></i>
      <h2 class="cimaway-add-home-title">ADD TO HOME SCREEN</h2>
      <p class="cimaway-add-home-gray">
      In Safari, tap the 
      <span class="cimaway-share-icon-svg"></span> 
      button and choose
      </p>
      <p class="cimaway-add-home-white">"Add To Home Screen"</p>
      <p class="cimaway-add-home-sub">
        You'll now be able to use Cimaway on your iPhone with 1 tap.
      </p>
      <img src="/images/addtohomelogo.png" alt="Cimaway Logo" class="cimaway-add-home-logo">
    </div>
  `;
  document.body.appendChild(modal);

  // Disable background scrolling
  document.body.classList.add('modal-open');

  // Attach event listener to the close button
  const closeButton = modal.querySelector('.cimaway-add-home-close');
  closeButton.addEventListener('click', closeModal);

  // Clean URL
  if (window.history.replaceState) {
    const cleanURL = window.location.origin + window.location.pathname;
    window.history.replaceState({}, document.title, cleanURL);
  }
}

// Close modal and enable background scrolling
function closeModal() {
  document.querySelector('.cimaway-add-home-overlay').remove();
  document.body.classList.remove('modal-open');
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

window.addEventListener('scroll', function() {
  const header = document.querySelector('header');
  if (window.scrollY > 0) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }
});


function goHome() {
  window.location.href = '/'; // Replace 'index.html' with your home page URL
}


// Toggle mobile menu
function toggleMobileMenu() {
  const menu = document.getElementById("mobile-nav");

  if (!menu.classList.contains("active")) {
    // Open the menu with slide animation
    menu.classList.add("active");
  } else {
    // Close the menu
    menu.classList.remove("active");
  }
}

// Close menu when clicking outside
document.addEventListener("click", function (event) {
  const menu = document.getElementById("mobile-nav");
  const hamburger = document.querySelector(".hamburger");

  if (
    menu.classList.contains("active") &&
    !menu.contains(event.target) &&
    !hamburger.contains(event.target)
  ) {
    menu.classList.remove("active");
  }
});

// Close menu when a link is clicked
document.querySelectorAll("#mobile-nav span").forEach(link => {
  link.addEventListener("click", () => {
    const menu = document.getElementById("mobile-nav");
    menu.classList.remove("active");
  });
});

// Close menu on X button click
document.querySelector(".burger-close-btn").addEventListener("click", () => {
  const menu = document.getElementById("mobile-nav");
  menu.classList.remove("active");
});




// Function to load a random movie from the trending list or a custom list
async function loadRandomFeaturedMovie(customMoviesList = null) {
  try {
      let data;

      // If a custom list of movies is passed, use that; otherwise, fetch trending movies
      if (customMoviesList && customMoviesList.length > 0) {
          data = { results: customMoviesList };  // Mimic the structure of the trending API response
      } else {
          const response = await fetch('/api/trending-now');
          data = await response.json();
      }

      if (data && data.results.length > 0) {
          const randomMovie = data.results[Math.floor(Math.random() * data.results.length)];
          displayFeaturedMovie(randomMovie);  // Pass the full movie object
      } else {
          console.error('No movies found.');
      }
  } catch (error) {
      console.error('Error fetching movies:', error.message);
  }
}

function displayFeaturedMovie(movie) {
  const title = movie.title || movie.name || 'Unknown Title';
  const year = movie.release_date ? movie.release_date.split('-')[0] : (movie.first_air_date ? movie.first_air_date.split('-')[0] : 'Unknown');
  const languages = movie.original_language ? movie.original_language.toUpperCase() : 'Unknown Language';
  const genres = getGenreNames(movie.genre_ids);
  const description = movie.overview || 'No description available';

  const backdropUrl = movie.backdrop_path ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` : 'default-backdrop.jpg';
  const posterUrl = movie.poster_path ? `https://image.tmdb.org/t/p/original${movie.poster_path}` : 'default-poster.jpg'; // Add fallback poster
  const matchScore = movie.vote_average ? `${Math.round(movie.vote_average * 10)}% Match` : 'Match N/A';

  // Check if screen size is small
  const isSmallScreen = window.innerWidth <= 768;

  // Use the poster image for small screens, backdrop image for large screens
  const backgroundUrl = isSmallScreen ? posterUrl : backdropUrl;

  // Apply the background image
  document.getElementById('featured-movie-backdrop').style.backgroundImage = `url('${backgroundUrl}')`;

  document.getElementById('featured-movie-title').textContent = title;
  document.getElementById('featured-movie-description').textContent = description;
  document.getElementById('featured-movie-genres').innerHTML =  
    `<span class="featured-genres-label">Genres:</span> 
     <span class="featured-genres-value">${genres}</span>`;

  document.getElementById('featured-movie-meta').innerHTML =  
    `<span class="featured-score">${matchScore}</span> 
     <span class="featured-movie-year-language">${year} <span class="featured-movie-language-tag">${languages}</span></span>
     <p id="featured-hd-tag">HD</p>
     <p id="featured-age-tag" class="featured-age-tag" style="display: none;"></p>`;

  // Remove existing button container if it exists
  const existingButtonContainer = document.getElementById('featured-button-container');
  if (existingButtonContainer) {
    existingButtonContainer.remove();
  }

  // Add Buttons Below Details (More Info + Add to My List in a row)
  const movieDetails = document.getElementById('featured-movie-details');
  const buttonContainer = document.createElement('div');
  buttonContainer.id = 'featured-button-container';
  buttonContainer.style.display = 'flex';  // Ensures buttons are next to each other
  buttonContainer.style.gap = '10px';      // Adds space between buttons

  const infoButton = document.createElement('button');
  infoButton.id = 'featured-open-button';
  infoButton.classList.add('featured-open-button');
  infoButton.innerHTML = `<i class="fa fa-info-circle"></i> <span>More Info</span>`;
  infoButton.addEventListener('click', () => openModal(movie));

  const favoriteButton = document.createElement('button');
  favoriteButton.id = 'featured-favorite-button';
  favoriteButton.classList.add('featured-favorite-button');
  favoriteButton.innerHTML = `<i class="fa fa-plus"></i> <span>My List</span>`;
  favoriteButton.addEventListener('click', () => {
      const mediaType = movie.first_air_date ? "tv" : "movie"; 
      toggleFavorite(movie.id, mediaType);
  });

  // Append buttons inside container
  buttonContainer.appendChild(infoButton);
  buttonContainer.appendChild(favoriteButton);
  movieDetails.appendChild(buttonContainer);

  // Remove any existing network logo before adding a new one
  const oldLogoContainer = document.getElementById('featured-logo-container');
  if (oldLogoContainer) {
    oldLogoContainer.remove();
  }

  const sectionLogos = {
    'netflix': 'https://github.com/ProjectAllfa/images/blob/main/netflix-logo-3.png?raw=true',
    'amazon-prime': 'https://github.com/ProjectAllfa/images/blob/main/amazon-logo-3.png?raw=true',
    'apple-tv': 'https://github.com/ProjectAllfa/images/blob/main/apple-logo-3.png?raw=true',
    'disney-plus': 'https://github.com/ProjectAllfa/images/blob/main/disney-logo-3.png?raw=true',
    'hbo': 'https://github.com/ProjectAllfa/images/blob/main/hbo-logo-3.png?raw=true'
  };

  const activeSection = window.activeSection;
  if (activeSection && sectionLogos[activeSection]) {
    const logoContainer = document.createElement('div');
    logoContainer.id = 'featured-logo-container';

    const logoImg = document.createElement('img');
    logoImg.src = sectionLogos[activeSection];
    logoImg.classList.add('section-logo');

    logoContainer.appendChild(logoImg);
    movieDetails.appendChild(logoContainer);
  }

  const mediaType = movie.media_type || (movie.first_air_date ? "tv" : "movie");
  fetch(`/api/certification/${movie.id}/${mediaType}`)  
    .then(response => response.json())
    .then(data => {
        const ageTag = document.getElementById('featured-age-tag');
        const certification = data.certification && data.certification !== "N/A" ? data.certification : null;

        if (certification) {
            ageTag.textContent = certification;
            ageTag.style.display = 'inline-block';
        } else {
            ageTag.style.display = 'none';
        }
    })
    .catch(error => console.error('Error fetching certification:', error));
}


// Initialize the featured movie section when the page loads (Home Page)
document.addEventListener('DOMContentLoaded', loadRandomFeaturedMovie);

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// ✅ Fetch Available Episode IDs from Server
let episodeIds = new Set();
async function fetchAvailableEpisodes() {
    try {
        const response = await fetch('/api/episodes/available');
        const data = await response.json();
        episodeIds = new Set(data.availableEpisodes);
        console.log(`✅ Loaded ${episodeIds.size} available episodes.`);
    } catch (error) {
        console.error('❌ Error fetching available episodes:', error);
    }
}

// ✅ Call this function when the page loads
document.addEventListener('DOMContentLoaded', fetchAvailableEpisodes);


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////


document.querySelectorAll('.scroll-btn').forEach(button => {
  button.addEventListener('click', function () {
    console.log("Scroll button clicked:", this);

    let container = this.nextElementSibling; // Selects the next sibling, which should be the .movie-row

    if (!container || !container.classList.contains('movie-row')) {
      container = this.previousElementSibling; // If next sibling is not .movie-row, check previous
    }

    if (container && container.classList.contains('movie-row')) {
      console.log("Scrolling:", container.id);
      const scrollAmount = container.clientWidth;
      if (this.classList.contains('left-btn')) {
        container.scrollLeft -= scrollAmount;
      } else {
        container.scrollLeft += scrollAmount;
      }
    } else {
      console.error("No valid .movie-row found for", this);
    }
  });
});

function attachScrollButtons() {
  document.querySelectorAll('.scroll-btn').forEach(button => {
    button.removeEventListener('click', scrollMovies); // Remove existing to prevent duplicates
    button.addEventListener('click', scrollMovies);
  });
}

function scrollMovies() {
  console.log("Scroll button clicked:", this);

  let container = this.nextElementSibling; // Selects the next sibling, which should be .movie-row
  if (!container || !container.classList.contains('movie-row')) {
    container = this.previousElementSibling;
  }

  if (container && container.classList.contains('movie-row')) {
    console.log("Scrolling:", container.id);
    const scrollAmount = container.clientWidth;
    if (this.classList.contains('left-btn')) {
      container.scrollLeft -= scrollAmount;
    } else {
      container.scrollLeft += scrollAmount;
    }
  } else {
    console.error("No valid .movie-row found for", this);
  }
}

// Reattach event after DOM content is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  attachScrollButtons();

  // If Arabic series are loaded later, run attachScrollButtons after a short delay
  setTimeout(attachScrollButtons, 2000); 
});


//////////////////// search /////////////////
const searchBtn = document.getElementById('search-btn');
const searchInput = document.getElementById('search-bar');
const closeSearchBtn = document.getElementById('close-search');
const searchContainer = document.querySelector('.search-container');
const searchResultsContainer = document.getElementById('search-results');

// Select all elements to restore when search is empty
const elementsToRestore = document.querySelectorAll('body > *:not(#search-results):not(header):not(#movie-modal):not(#arabic-movies-modal):not(#arabic-series-modal)');

// Open search when clicking the search button
searchBtn.addEventListener('click', () => {
    searchContainer.classList.add('active'); // Keep search UI open
    searchInput.style.display = 'block'; // Ensure input stays visible
    closeSearchBtn.style.display = 'block'; // Show close button
    searchInput.focus(); // Focus on the input
});

// Close search when clicking the close button
closeSearchBtn.addEventListener('click', () => {
    searchInput.value = ''; // Clear the search input
    searchResultsContainer.innerHTML = ''; // Clear search results
    
    
     // ✅ Check if "Showing results for ..." exists before hiding it
     const searchHeader = document.getElementById('showing-results-text');
     if (searchHeader) {
         searchHeader.style.display = 'none'; // Hide search header safely
     }

    searchResultsContainer.style.display = 'none'; // Hide search results
    searchContainer.classList.remove('active'); // Hide search UI
    closeSearchBtn.style.display = 'none'; // Hide close button
    restoreHomePage(); // ✅ Restore FULL home page correctly
});

// Handle search input
let typingTimeout;

searchInput.addEventListener('input', function () {
  clearTimeout(typingTimeout);
  const query = this.value.trim(); // Get exact input field text

  if (query.length === 0) {
    searchResultsContainer.innerHTML = ''; // ✅ Clear results
    searchResultsContainer.style.display = 'none'; // ✅ Hide search results
    restoreHomePage();
    return;
  }

  if (query.length < 2) return; // ✅ Ignore short input

  // ✅ Debounce the input (Waits 300ms before triggering search)
  typingTimeout = setTimeout(() => {
    searchContent(query);
    searchResultsContainer.style.display = 'flex'; // Show results
    searchResultsContainer.classList.remove('hidden'); // ✅ Ensure it's fully restored
    hideHomePage();
  }, 300);
});


// Close only the input field when clicking outside (Keep search results visible)
document.addEventListener("click", function (event) {
    if (!searchContainer.contains(event.target) && event.target !== searchBtn) {
        searchInput.style.display = 'none'; // Hide input field
        closeSearchBtn.style.display = 'none'; // Hide close button
    }
});

// Prevent input field from closing when clicking inside
searchContainer.addEventListener("click", (event) => {
    event.stopPropagation();
});

// ✅ Store original visibility states before hiding
const originalVisibility = new Map();

// ✅ Function to hide home page when searching
function hideHomePage() {
  elementsToRestore.forEach(element => {
    if (!originalVisibility.has(element)) {
      originalVisibility.set(element, element.style.display); // Store original state
    }
    element.classList.add('hidden');
  });

  // ✅ Force-hide Arabic, Turkish series & movies sections
  document.querySelectorAll('.movie-section h2').forEach(header => {
    if (header.textContent.includes("Arabic Movies") || 
        header.textContent.includes("Arabic Series") || 
        header.textContent.includes("Turkish Series")) {
      const section = header.closest('.movie-section');
      if (!originalVisibility.has(section)) {
        originalVisibility.set(section, section.style.display);
      }
      section.classList.add('hidden');
    }
  });

  // 🔹 Hide all "View More" sections instead of removing them
  document.querySelectorAll(".more-results-container").forEach(el => {
    if (!originalVisibility.has(el)) {
      originalVisibility.set(el, el.style.display);
    }
    el.style.display = "none";
  });

  // 🔹 Hide Arabic & Turkish series full lists and featured sections
  const sectionsToHide = [
    "arabic-series-results", "displaylocalfeaturedseries-section",
    "turkish-series-results",
    "arabic-movies-results", "displaylocalfeaturedmovie-section",
    "mylist-container"
  ];

  sectionsToHide.forEach(id => {
    const element = document.getElementById(id);
    if (element && !originalVisibility.has(element)) {
      originalVisibility.set(element, element.style.display);
    }
    if (element) element.style.display = "none";
  });
}

// ✅ Function to fully restore home page when search is empty or closed
function restoreHomePage() {
  // ✅ Restore elements based on their original state
  originalVisibility.forEach((originalDisplay, element) => {
    if (element) {
      element.style.display = originalDisplay; // Restore only if it was visible before
      element.classList.remove('hidden');
    }
  });

  // ✅ Clear stored states after restoring
  originalVisibility.clear();
}



// Function to fetch TMDb results
async function fetchTmdbResults(query) {
  try {
    const response = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching TMDb results:', error);
    return { movies: [], tvShows: [] };
  }
}

// Function to display TMDb movies based on the search query
function displayTmdbMovies(moviesData, container) {
  moviesData.forEach(movie => {
    const movieTitle = movie.title || 'Unknown Movie';
    const moviePoster = movie.poster_path ? `https://image.tmdb.org/t/p/w342${movie.poster_path}` : 'default-poster.jpg'; // Example poster

    const movieElement = document.createElement('div');
    movieElement.classList.add('movie-card'); 
    movieElement.innerHTML = `
    <img src="${moviePoster}" alt="Movie Poster" width="200" style="cursor: pointer;">
  `;
    movieElement.addEventListener('click', () => openModal(movie));
    container.appendChild(movieElement);
  });
}

// Function to display TMDb series based on the search query
function displayTmdbSeries(seriesData, container) {
  seriesData.forEach(series => {
    const seriesTitle = series.name || 'Unknown Series';
    const seriesPoster = series.poster_path ? `https://image.tmdb.org/t/p/w342${series.poster_path}` : 'default-poster.jpg'; // Example poster

    const seriesElement = document.createElement('div');
    seriesElement.classList.add('movie-card');
    seriesElement.innerHTML = `
      <img src="${seriesPoster}" alt="Series Poster" width="200" style="cursor: pointer;">
    `;

    seriesElement.addEventListener('click', () => openModal(series));
    container.appendChild(seriesElement);
  });
}

// Function to fetch TMDb IDs from a text file
async function fetchTmdbIds(fileName) {
  try {
    const response = await fetch(`/data/${fileName}`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const text = await response.text();
    return new Set(text.split('\n').map(id => id.trim()).filter(id => id)); // Return a Set for fast lookup
  } catch (error) {
    console.error(`Error fetching ${fileName}:`, error);
    return new Set();
  }
}

// Function to search through Arabic movies and series data and TMDb data
async function searchContent(query) {
  try {
    // Hide all elements except the search results container
    elementsToRestore.forEach(element => element.classList.add('hidden'));

    const resultsContainer = document.getElementById('search-results');
    if (!resultsContainer) {
      console.error("❌ #search-results container not found.");
      return;
    }

    // ✅ Clear previous results before adding new ones (Fix for duplicate results)
    resultsContainer.innerHTML = "";

    // ✅ Ensure "Showing results for:" exists ONLY ONCE
    let searchHeader = document.getElementById('showing-results-text');
    let searchQueryText = document.getElementById('search-query-text');

    if (!searchHeader) {
      // Create a new wrapper to hold both the text and button
      const searchHeaderWrapper = document.createElement('div');
      searchHeaderWrapper.id = "showing-results-wrapper";
    
      searchHeader = document.createElement('span');
      searchHeader.id = "showing-results-text";
      searchHeader.innerHTML = `Showing results for: <span id="search-query-text"></span>`;
    
      const closeButton = document.createElement('button');
      closeButton.id = "results-text-button";
      closeButton.innerHTML = `<span class="icon">➜</span>Back<span></span>`; 
      closeButton.addEventListener('click', showHomeContent); // Hook to close search
    
      searchHeaderWrapper.appendChild(searchHeader);
      searchHeaderWrapper.appendChild(closeButton);
      resultsContainer.prepend(searchHeaderWrapper);
    }
    
    if (!searchQueryText) {
      searchQueryText = document.createElement('span');
      searchQueryText.id = "search-query-text";
      searchHeader.appendChild(searchQueryText);
    }

    // ✅ Only update text once per search
    searchQueryText.textContent = query;
    searchHeader.style.display = 'block';

    // ✅ Fetch movies and series (Now includes Turkish series)
    const [moviesResponse, arabicSeriesResponse, turkishSeriesResponse] = await Promise.all([
      fetch(`/api/arabic-movies/search?query=${encodeURIComponent(query)}`),
      fetch(`/api/arabic-series/search?query=${encodeURIComponent(query)}`),
      fetch(`/api/turkish-series/search?query=${encodeURIComponent(query)}`) // 🔹 New fetch request
    ]);

    if (!moviesResponse.ok || !arabicSeriesResponse.ok || !turkishSeriesResponse.ok) {
      throw new Error('Network response was not ok');
    }

    const moviesData = await moviesResponse.json();
    const arabicSeriesData = await arabicSeriesResponse.json();
    const turkishSeriesData = await turkishSeriesResponse.json(); // 🔹 Store Turkish series data

    // ✅ Fetch TMDb IDs
    const [movieIds, seriesIds, episodeIds] = await Promise.all([
      fetchTmdbIds('mov_tmdb.txt'),
      fetchTmdbIds('tv_tmdb.txt'),
      fetchTmdbIds('eps_tmdb.txt')
    ]);

    // ✅ Fetch TMDb movies and series data
    const tmdbData = await fetchTmdbResults(query);

    // ✅ Display results properly
    if (Array.isArray(moviesData)) displayMovies(moviesData, query, resultsContainer);
    if (Array.isArray(arabicSeriesData)) displaySeries(arabicSeriesData, query, resultsContainer);
    if (Array.isArray(turkishSeriesData)) displayTurkishSeries(turkishSeriesData, query, resultsContainer); // 🔹 Display Turkish series
    if (Array.isArray(tmdbData.movies)) displayTmdbMovies(
      tmdbData.movies.filter(movie => movieIds.has(movie.id.toString())),
      resultsContainer
    );
    if (Array.isArray(tmdbData.tvShows)) displayTmdbSeries(
      tmdbData.tvShows.filter(series => seriesIds.has(series.id.toString())),
      resultsContainer
    );

    // ✅ Show "No results" message if nothing is found
    if (resultsContainer.children.length === 1) {
      resultsContainer.innerHTML += '<p>No results found</p>';
    }

    // Always add the event listener for "Back" button
    const backButton = document.getElementById('results-text-button');
    if (backButton) {
      backButton.addEventListener('click', showHomeContent); // Ensure event listener is always added
    }

  } catch (error) {
    console.error('Error searching content:', error);
  }
}



// Function to display movies based on the search query
function displayMovies(moviesData, query, container) {
  if (!moviesData || moviesData.length === 0) return;

  const filteredMovies = moviesData.filter(movie => {
    const title = (movie.movie_name || '').toLowerCase();
    return title.includes(query);
  });

  filteredMovies.forEach(movie => {
    const moviePoster = movie.info.poster || 'default-poster.jpg'; // ✅ Use movie poster, fallback if missing

    const movieElement = document.createElement('div');
    movieElement.classList.add('series-item');
    movieElement.innerHTML = `
      <img src="${moviePoster}" alt="Movie Poster" width="200" style="cursor: pointer;">
    `;

    // ✅ Debugging
    console.log("Movie Data:", movie);
    console.log("Movie ID:", movie.id);

    // ✅ Ensure `movie.id` is a string before passing it
    if (movie.id) {
      movieElement.addEventListener('click', () => openModalFromTMDB(String(movie.id)));
    } else {
      console.error("❌ Movie ID is missing:", movie);
    }

    container.appendChild(movieElement);
  });
}


// ✅ Function to display series based on the search query
function displaySeries(seriesData, query, container) {
  if (!seriesData || seriesData.length === 0) return; // ✅ Handle no results case

  const filteredSeries = seriesData.filter(series => {
    const name = (series.series_name || '').toLowerCase();
    return name.includes(query);
  });

  filteredSeries.forEach(series => {
    const seriesPoster = series.poster || 'default-poster.jpg'; // ✅ Use series poster, fallback if missing

    const seriesElement = document.createElement('div');
    seriesElement.classList.add('series-item');
    seriesElement.innerHTML = `
      <img src="${seriesPoster}" alt="Series Poster" width="200" style="cursor: pointer;">
    `;

    // 🔹 Fetch full series data from local-seasons before opening the modal
    seriesElement.addEventListener('click', async () => {
      try {
        const fullSeriesResponse = await fetch(`/api/seasons?id=${series.id}`);
        if (!fullSeriesResponse.ok) throw new Error('Failed to fetch full series data');

        const fullSeriesData = await fullSeriesResponse.json();
        openArabicSeriesModal(fullSeriesData); // ✅ Open modal with full data
      } catch (error) {
        console.error('Error fetching full series data:', error);
      }
    });

    container.appendChild(seriesElement);
  });
}

// ✅ Function to display Turkish series based on the search query
function displayTurkishSeries(seriesData, query, container) {
  if (!seriesData || seriesData.length === 0) return; // ✅ Handle no results case

  const filteredSeries = seriesData.filter(series => {
    const name = (series.series_name || '').toLowerCase();
    return name.includes(query);
  });

  filteredSeries.forEach(series => {
    const seriesPoster = series.poster || 'default-poster.jpg'; // ✅ Use series poster, fallback if missing

    const seriesElement = document.createElement('div');
    seriesElement.classList.add('series-item');
    seriesElement.innerHTML = `
      <img src="${seriesPoster}" alt="Series Poster" width="200" style="cursor: pointer;">
    `;

    // 🔹 Fetch full series data from local-seasons before opening the modal
    seriesElement.addEventListener('click', async () => {
      try {
        const fullSeriesResponse = await fetch(`/api/seasons?id=${series.id}`);
        if (!fullSeriesResponse.ok) throw new Error('Failed to fetch full series data');

        const fullSeriesData = await fullSeriesResponse.json();
        openArabicSeriesModal(fullSeriesData); // ✅ Open modal with full data (Reuses Arabic Series Modal)
      } catch (error) {
        console.error('Error fetching full series data:', error);
      }
    });

    container.appendChild(seriesElement);
  });
}


// Example function to open the movie modal
function openArabicMoviesModal(movie, url) {
  // Implement the logic to open the movie modal
  console.log('Open movie modal:', movie, url);
}

// Example function to open the series modal
function openArabicSeriesModal(series) {
  // Implement the logic to open the series modal
  console.log('Open series modal:', series);
}

// Helper function to get genre names based on genre IDs
async function getGenreNames(genreIds) {
  try {
    const response = await fetch('/api/genres');
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const genres = await response.json();
    return genreIds.map(id => genres[id]).join(', ');
  } catch (error) {
    console.error('Error fetching genre names:', error);
    return 'Unknown Genres';
  }
}

// ✅ Function to restore home page when using the back button in search
function showHomeContent() {
  // ✅ Restore elements based on their original state
  originalVisibility.forEach((originalDisplay, element) => {
    if (element) {
      element.style.display = originalDisplay; // Restore only if it was visible before
      element.classList.remove('hidden');
    }
  });

  // ✅ Clear stored states after restoring
  originalVisibility.clear();

  // Hide search results
  const resultsContainer = document.getElementById('search-results');
  resultsContainer.style.display = 'none';
  resultsContainer.classList.add('hidden');
  resultsContainer.innerHTML = ''; // ✅ Clear previous search results

  document.getElementById('close-search').style.display = 'none'; // Hide close button

  // ✅ Ensure "Showing results for ..." text is cleared when closing search
  const searchHeader = document.getElementById('showing-results-text');
  const searchQueryText = document.getElementById('search-query-text');
  const searchInput = document.getElementById('search-bar'); // ✅ Get search input field

  if (searchHeader) searchHeader.style.display = 'none'; // Hide header safely
  if (searchQueryText) searchQueryText.textContent = ''; // Clear displayed query text
  if (searchInput) searchInput.value = ''; // ✅ Clear the search input field
}


////////////////////////////////////////////////////////// Movies Page Button (navbar) //////////////////////////////////////////////////////////////////////

async function loadMoviesPage() {
  try {
    console.log("Loading Movies Page...");

      // ✅ Reset active section to prevent network logos from being stuck
      window.activeSection = null;

    const moviesContainer = document.getElementById("movies-content");
    if (!moviesContainer) {
      console.error("Error: 'movies-content' div is missing from the HTML.");
      return;
    }

  document.querySelectorAll(".movie-section").forEach(section => section.remove()); // Remove old sections

   // 🔹 Remove all "View More" sections
   document.querySelectorAll(".more-results-container").forEach(el => el.remove());

    moviesContainer.classList.remove("hidden"); // Ensure visibility
    moviesContainer.style.display = "block"; 
    moviesContainer.innerHTML = ""; // Clear previous content

        // Hide My list containers
const myListContainers = document.getElementById("mylist-container");
if (myListContainers) myListContainers.style.display = "none";

    // Hide Arabic series full list and featured section
const arabicSeriesResults = document.getElementById("arabic-series-results");
if (arabicSeriesResults) arabicSeriesResults.style.display = "none";

const arabicSeriesFeatured = document.getElementById("displaylocalfeaturedseries-section");
if (arabicSeriesFeatured) arabicSeriesFeatured.style.display = "none";

// ✅ Hide Turkish series full list 
const turkishSeriesResults = document.getElementById("turkish-series-results");
if (turkishSeriesResults) turkishSeriesResults.style.display = "none";

    // Hide Arabic Movies full list and featured section
    const arabicMoviesResults = document.getElementById("arabic-movies-results");
    if (arabicMoviesResults) arabicMoviesResults.style.display = "none";
    
    const arabicMoviesFeatured = document.getElementById("displaylocalfeaturedmovie-section");
    if (arabicMoviesFeatured) arabicMoviesFeatured.style.display = "none";

       // 🔴 Hide search Results Container if it exists
       const searchResultsContainer = document.querySelector('#search-results');
       if (searchResultsContainer) {
         searchResultsContainer.style.display = 'none';
       }

// ✅ Ensure the featured trending container section is visible
const featuredMoviesSection = document.getElementById("featured-trending-container");
if (featuredMoviesSection) {
  featuredMoviesSection.classList.remove("hidden"); // Remove the hidden class
  featuredMoviesSection.style.display = "block"; // Ensure display is set to block
}

// For the featured movie section
const featuredMovieSection = document.getElementById("featured-movie-section");
if (featuredMovieSection) {
  featuredMovieSection.classList.remove("hidden"); // Remove the hidden class
  featuredMovieSection.style.display = "block"; // Ensure display is set to block
}


    const response = await fetch('/api/movies');
    if (!response.ok) throw new Error("Failed to fetch movies");

    const moviesData = await response.json();
    console.log("Fetched all movies:", moviesData);

    let allMoviesArray = []; // ✅ Store all movies for random selection

    // 🔹 Custom names for movie genres
    const movieGenreNameMap = {
      "action": "Action Movies",
      "comedy": "Comedy Movies",
      "horror": "Horror Movies",
      "sciFi": "Sci-Fi Movies",
      "war": "War Movies",
      "crime": "Crime Movies"
    };

    for (const [genre, movies] of Object.entries(moviesData)) {
      if (movies.length === 0) continue; // Skip empty genres

      allMoviesArray = allMoviesArray.concat(movies); // ✅ Collect all movies for random selection

      const genreName = movieGenreNameMap[genre] || (genre.charAt(0).toUpperCase() + genre.slice(1));
      const containerId = `${genre}-movies`;

      const section = document.createElement("div");
      section.classList.add("movie-section");
      section.innerHTML = `
        <div class="section-header">
          <h2>${genreName}</h2>  <!-- ✅ Uses custom names -->
          <button class="view-more-btn">View More</button>
        </div>
        <div class="movie-container">
          <button class="scroll-btn left-btn" data-target="${containerId}">&lt;</button>
          <div class="movie-row" id="${containerId}"></div>
          <button class="scroll-btn right-btn" data-target="${containerId}">&gt;</button>
        </div>
      `;

      moviesContainer.appendChild(section);
      displayItems(movies, containerId, "movie", "tmdb");
    }

    // ✅ Call your `loadRandomFeaturedMovie` function with all movies
    if (allMoviesArray.length > 0) {
      loadRandomFeaturedMovie(allMoviesArray);
    } else {
      console.warn("No movies available to display in the featured section.");
    }

    // ✅ Scroll buttons functionality
    document.querySelectorAll(".scroll-btn").forEach(button => {
      button.addEventListener("click", function () {
        const targetId = this.getAttribute("data-target");
        const movieRow = document.getElementById(targetId);
        if (!movieRow) return;
    
        const scrollAmount = movieRow.clientWidth;
        movieRow.scrollBy({ 
          left: this.classList.contains("left-btn") ? -scrollAmount : scrollAmount, 
          behavior: "smooth" 
        });
      });
    });

    // ✅ Add event listeners to all "View More" buttons
document.querySelectorAll(".view-more-btn").forEach(button => {
  button.addEventListener("click", function () {
    const genre = this.parentElement.querySelector("h2").textContent.replace(" Movies", "").toLowerCase(); 
    fetchMoreMoviesByGenre(genre);
  });
});


  } catch (error) {
    console.error("Error loading Movies page:", error);
  }
}

async function fetchMoreMoviesByGenre(genre) {
  try {
    console.log(`Fetching more movies for: ${genre}`);

    // Define unique routes for each genre
    const genreApiRoutes = {
      "action": "/api/action-movies-load-more",
      "comedy": "/api/comedy-movies-load-more",
      "horror": "/api/horror-movies-load-more",
      "sci-fi": "/api/scifi-movies-load-more",
      "war": "/api/war-movies-load-more",
      "crime": "/api/crime-movies-load-more"
    };

    const apiUrl = genreApiRoutes[genre];
    if (!apiUrl) {
      console.error(`No API route found for genre: ${genre}`);
      return;
    }

    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error(`Failed to fetch more ${genre} movies`);

    const movies = await response.json();
    console.log(`Fetched more ${genre} movies:`, movies);

    // Pick a random movie from results and display it as featured
    if (movies.length > 0) {
      const randomMovie = movies[Math.floor(Math.random() * movies.length)];
      displayFeaturedMovie(randomMovie);
    }

    // ✅ Use the same function from the homepage
    displayMoreItems(movies, `${genre}-movies`, "movie", "tmdb", 0, 8);

  } catch (error) {
    console.error(`Error loading more ${genre} movies:`, error);
  }
}

////////////////////////////////////////////////////////// TV Shows Page Button (navbar) //////////////////////////////////////////////////////////////////////

async function loadTVShowsPage() {
  try {
    console.log("Loading TV Shows Page...");

      // ✅ Reset active section to prevent network logos from being stuck
      window.activeSection = null;

    const tvShowsContainer = document.getElementById("movies-content");
    if (!tvShowsContainer) {
      console.error("Error: 'movies-content' div is missing from the HTML.");
      return;
    }

    document.querySelectorAll(".movie-section").forEach(section => section.remove());

   // 🔹 Remove all "View More" sections
   document.querySelectorAll(".more-results-container").forEach(el => el.remove());
    
    tvShowsContainer.classList.remove("hidden"); // Ensure visibility
    tvShowsContainer.style.display = "block"; 
    tvShowsContainer.innerHTML = "";

    
        // Hide My list containers
const myListContainers = document.getElementById("mylist-container");
if (myListContainers) myListContainers.style.display = "none";


        // Hide Arabic series full list and featured section
const arabicSeriesResults = document.getElementById("arabic-series-results");
if (arabicSeriesResults) arabicSeriesResults.style.display = "none";

const arabicSeriesFeatured = document.getElementById("displaylocalfeaturedseries-section");
if (arabicSeriesFeatured) arabicSeriesFeatured.style.display = "none";

// ✅ Hide Turkish series full list 
const turkishSeriesResults = document.getElementById("turkish-series-results");
if (turkishSeriesResults) turkishSeriesResults.style.display = "none";


    // Hide Arabic Movies full list and featured section
    const arabicMoviesResults = document.getElementById("arabic-movies-results");
    if (arabicMoviesResults) arabicMoviesResults.style.display = "none";
    
    const arabicMoviesFeatured = document.getElementById("displaylocalfeaturedmovie-section");
    if (arabicMoviesFeatured) arabicMoviesFeatured.style.display = "none";

     // 🔴 Hide search Results Container if it exists
     const searchResultsContainer = document.querySelector('#search-results');
     if (searchResultsContainer) {
       searchResultsContainer.style.display = 'none';
     }

// ✅ Ensure the featured trending container section is visible
const featuredMoviesSection = document.getElementById("featured-trending-container");
if (featuredMoviesSection) {
  featuredMoviesSection.classList.remove("hidden"); // Remove the hidden class
  featuredMoviesSection.style.display = "block"; // Ensure display is set to block
}

// For the featured movie section
const featuredMovieSection = document.getElementById("featured-movie-section");
if (featuredMovieSection) {
  featuredMovieSection.classList.remove("hidden"); // Remove the hidden class
  featuredMovieSection.style.display = "block"; // Ensure display is set to block
}

    const response = await fetch('/api/tvshows');
    if (!response.ok) throw new Error("Failed to fetch TV shows");

    const tvShowsData = await response.json();
    console.log("Fetched all TV shows:", tvShowsData);

    let allTVShowsArray = [];

    // 🔹 Custom section names
    const genreNameMap = {
      "reality": "Reality TV Shows",
      "comedy": "Comedy TV Shows",
      "drama": "Drama TV Shows",
      "mystery": "Mystery TV Shows",
      "actionAdventure": "Action TV Shows",
      "crime": "Crime TV Shows"
      
    };

    for (const [genre, tvShows] of Object.entries(tvShowsData)) {
      if (tvShows.length === 0) continue;

      allTVShowsArray = allTVShowsArray.concat(tvShows);

      const genreName = genreNameMap[genre] || (genre.charAt(0).toUpperCase() + genre.slice(1));
      const containerId = `${genre}-movies`;

      const section = document.createElement("div");
      section.classList.add("movie-section");
      section.innerHTML = `
        <div class="section-header">
          <h2>${genreName}</h2>  
          <button class="view-more-btn">View More</button>
        </div>
        <div class="movie-container">
          <button class="scroll-btn left-btn" data-target="${containerId}">&lt;</button>
          <div class="movie-row" id="${containerId}"></div>
          <button class="scroll-btn right-btn" data-target="${containerId}">&gt;</button>
        </div>
      `;

      tvShowsContainer.appendChild(section);
      displayItems(tvShows, containerId, "movie", "tmdb");
    }

    if (allTVShowsArray.length > 0) {
      loadRandomFeaturedMovie(allTVShowsArray);
    } else {
      console.warn("No TV shows available to display in the featured section.");
    }

    document.querySelectorAll(".scroll-btn").forEach(button => {
      button.addEventListener("click", function () {
        const targetId = this.getAttribute("data-target");
        const tvShowRow = document.getElementById(targetId);
        if (!tvShowRow) return;
    
        const scrollAmount = tvShowRow.clientWidth;
        tvShowRow.scrollBy({ 
          left: this.classList.contains("left-btn") ? -scrollAmount : scrollAmount, 
          behavior: "smooth" 
        });
      });
    });

    // ✅ Add event listeners to all "View More" buttons
    document.querySelectorAll(".view-more-btn").forEach(button => {
      button.addEventListener("click", function () {
        const genre = this.parentElement.querySelector("h2").textContent.replace(" TV Shows", "").toLowerCase(); 
        fetchMoreTVShowsByGenre(genre);
      });
    });

  } catch (error) {
    console.error("Error loading TV Shows page:", error);
  }
}

async function fetchMoreTVShowsByGenre(genre) {
  try {
    console.log(`Fetching more TV shows for: ${genre}`);

    // Define unique API routes for each TV show genre
    const genreApiRoutes = {
      "reality": "/api/reality-tv-load-more",
      "comedy": "/api/comedy-tv-load-more",
      "drama": "/api/drama-tv-load-more",
      "mystery": "/api/mystery-tv-load-more",
      "action": "/api/action-tv-load-more",
      "crime": "/api/crime-tv-load-more"
      
    };

    const apiUrl = genreApiRoutes[genre.replace(/\s/g, "-")];
    if (!apiUrl) {
      console.error(`No API route found for genre: ${genre}`);
      return;
    }

    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error(`Failed to fetch more ${genre} TV shows`);

    const tvShows = await response.json();
    console.log(`Fetched more ${genre} TV shows:`, tvShows);

    // Pick a random show from results and display it as featured
    if (tvShows.length > 0) {
      const randomShow = tvShows[Math.floor(Math.random() * tvShows.length)];
      displayFeaturedMovie(randomShow);
    }

    // ✅ Use the same function to display additional shows
    displayMoreItems(tvShows, `${genre}-movies`, "movie", "tmdb", 0, 8);

  } catch (error) {
    console.error(`Error loading more ${genre} TV shows:`, error);
  }
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


document.addEventListener('DOMContentLoaded', () => {

  activeSection = null;

    
    // Fetch Trending Now (Movies and Series)
    fetch('/api/trending-now')
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        // data.results will contain both movies and series
        displayItems(data.results, 'trending-now');
    })
    .catch(error => {
        console.error('Error fetching trending now:', error.message);
    });


///////

function autoScrollTrendingNow() {
  const trendingContainer = document.getElementById('trending-now');
  if (!trendingContainer) {
    console.error('Trending container not found!');
    return;
  }

  // Scroll amount and speed variables
  const scrollSpeed = window.innerWidth < 600 ? 1 : 2;
  let scrollDirection = 1; // 1 for right, -1 for left

  function scrollContent() {
    trendingContainer.scrollLeft += scrollSpeed * scrollDirection;

    // Check if the scroll has reached the end or start to reverse direction
    if (trendingContainer.scrollLeft >= trendingContainer.scrollWidth - trendingContainer.clientWidth) {
      scrollDirection = -1; // Reverse to left
    } else if (trendingContainer.scrollLeft <= 0) {
      scrollDirection = 1; // Reverse to right
    }

    requestAnimationFrame(scrollContent);
  }

  // Start the scrolling
  scrollContent();
}

// Start auto-scrolling on page load
window.onload = autoScrollTrendingNow;

///////

  
    // Fetch Netflix movies
    fetch('/api/netflix-movies')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        displayItems(data, 'netflix-movies', 'movie');
      })
      .catch(error => {
        console.error('Error fetching Netflix movies:', error.message);
      });
  
    // Fetch Netflix series
    fetch('/api/netflix-series')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        displayItems(data, 'netflix-series', 'tvshow', 'netflix');
      })
      .catch(error => {
        console.error('Error fetching Netflix series:', error.message);
      });
  });


  



 // Fetch Anime Series from your server
fetch('/api/anime-series')
.then(response => {
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
})
.then(data => {
  console.log('Anime series data:', data); // Add this log to see the data
  displayItems(data, 'anime-series', 'tvshow'); // Display in the anime section
})
.catch(error => {
  console.error('Error fetching Anime Series:', error.message);
});

///////////////////////// genre mapping /////////////////////


let genreMaps = { movie: {}, series: {} };

// Fetch and load genre data from genres.json
let genreMap = {};

// Fetch and load genre data from genres.json
fetch('/data/genres.json')
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  })
  .then(data => {
    genreMap = data;
    console.log('Genre map loaded:', genreMap);
  })
  .catch(error => console.error('Error loading genre data:', error));


// Function to get genre names from genre IDs
function getGenreNames(genreIds) {
  return genreIds.map(id => {
    let name = Object.keys(genreMap).find(key => genreMap[key] === id);
    
    if (!name) return 'Unknown';

    // Replace underscores with spaces and capitalize each word
    return name
      .toLowerCase() // Convert to lowercase
      .replace(/_/g, ' ') // Replace underscores with spaces
      .split(' ') // Split into words
      .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize first letter
      .join(' '); // Join back into a string
  }).join(', ');
}

////////////////////////////////////////////////////////////////////////// Display More Items ////////////////////////////////////////////////////////////////////////////////////////////


// Function to handle displaying items (clear homepage, including the section that triggered, and show new results)
function displayMoreItems(items, sectionId, type, source, startIndex, rowsToShow) {
  // Clear all sections on the homepage, including the section that triggered the button
  const sections = document.querySelectorAll('.movie-section, .series-section'); // Adjust selectors if needed
  sections.forEach(section => {
    section.innerHTML = '';  // Clear the content of all sections
  });

  // Create a container for the results and append it to the body (or to a specific container)
  const moreResultsContainer = document.createElement('div');
  moreResultsContainer.classList.add('more-results-container');  // Unique class for the results container
  document.body.appendChild(moreResultsContainer); // Add to the body or specific container

  // Load rows of 10 items each (6 rows total)
  loadRows(items, moreResultsContainer, type, source, startIndex, rowsToShow); 

}

// Function to load rows of items (10 per row)
function loadRows(items, container, type, source, startIndex, numRows) {
  let currentIndex = startIndex;

  if (!items || items.length === 0) {
    console.warn("No items to display, hiding the container.");
    container.style.display = "none";  // Hide container if no items
    return;
  }

  container.style.display = "block"; // Ensure the container is visible if items exist

  for (let row = 0; row < numRows; row++) {
    // Create a wrapper to hold both the row and the scroll buttons
    const rowWrapper = document.createElement('div');
    rowWrapper.classList.add('row-wrapper');

    // Create the row container
    const rowElement = document.createElement('div');
    rowElement.classList.add('row');

    let itemsAdded = 0; // Track how many items are added to this row

    // Display 10 items per row
    for (let i = 0; i < 10 && currentIndex < items.length; i++, currentIndex++) {
      const itemElement = createItemElement(items[currentIndex], type, source);
      rowElement.appendChild(itemElement);
      itemsAdded++;
    }

    // If no items were added to this row, don't append it
    if (itemsAdded === 0) {
      console.warn(`Skipping empty row ${row + 1}`);
      continue;
    }

    // Create left scroll button
    const leftBtn = document.createElement('button');
    leftBtn.classList.add('scroll-btn', 'left-btn');
    leftBtn.innerHTML = '&lt;';

    // Create right scroll button
    const rightBtn = document.createElement('button');
    rightBtn.classList.add('scroll-btn', 'right-btn');
    rightBtn.innerHTML = '&gt;';

    // Append the buttons and the row to the wrapper
    rowWrapper.appendChild(leftBtn);
    rowWrapper.appendChild(rowElement);
    rowWrapper.appendChild(rightBtn);

    // Append the row wrapper to the main results container
    container.appendChild(rowWrapper);

    // Scroll button functionality for the specific row
    leftBtn.addEventListener('click', () => {
      rowElement.scrollBy({ left: -1100, behavior: 'smooth' });
    });

    rightBtn.addEventListener('click', () => {
      rowElement.scrollBy({ left: 1100, behavior: 'smooth' });
    });
  }

  console.log(`Displayed ${numRows * 10} items in rows`);
}

// Function to create an item element (movie or series card)
function createItemElement(item, type, source) {
  const itemElement = document.createElement('div');
  itemElement.classList.add('movie-card');
  itemElement.classList.add(`${type}-item`);

  itemElement.innerHTML = `
    <img class="movie-poster" src="https://image.tmdb.org/t/p/w342${item.poster_path}" alt="${item.title || item.name}" style="cursor: pointer;">
  `;

  itemElement.addEventListener('click', () => {
    openModal(item);
  });

  return itemElement;
}

// Add event listener to the "View More" button for the Amazon Prime section
document.getElementById('view-more-amazon-prime').addEventListener('click', () => {

  activeSection = 'amazon-prime';

  // Clear all sections, including the one triggering the View More
  const sections = document.querySelectorAll('.movie-section, .series-section'); // Adjust if you have other types of sections
  sections.forEach(section => {
    section.innerHTML = '';  // Clear content of all sections
  });

  // Fetch Series for the "View More" page (Amazon Prime Series example)
  fetch('/api/amazon-prime-load-more')
    .then(response => response.json())
    .then(data => {
      console.log('Amazon Prime Series (View More):', data);

      // Pick a random movie from the "View More" results
      const randomMovie = data[Math.floor(Math.random() * data.length)];

      // Pass the full movie object to the featured movie display (no need to refetch data)
      displayFeaturedMovie(randomMovie);

      // Display the new results in rows, 10 items per row, 6 rows total
      displayMoreItems(data, 'amazon-prime-series', 'series', 'amazon-prime', 0, 8);  // Display 6 rows of 10 items each initially
    })
    .catch(error => {
      console.error('Error fetching Amazon Prime series for view more:', error.message);
    });
});


// Add event listener to the "View More" button for the Apple TV section
document.getElementById('view-more-apple-tv').addEventListener('click', () => {

  activeSection = 'apple-tv';

  // Clear all sections, including the one triggering the View More
  const sections = document.querySelectorAll('.movie-section, .series-section'); // Adjust if you have other types of sections
  sections.forEach(section => {
    section.innerHTML = '';  // Clear content of all sections
  });

  // Fetch Series for the "View More" page (Apple TV Series example)
  fetch('/api/apple-tv-load-more')
    .then(response => response.json())
    .then(data => {
      console.log('Apple TV Series (View More):', data);

      // Pick a random movie from the "View More" results
      const randomMovie = data[Math.floor(Math.random() * data.length)];

      // Pass the full movie object to the featured movie display
      displayFeaturedMovie(randomMovie);

      // Display the new results in rows, 10 items per row, 6 rows total
      displayMoreItems(data, 'apple-tv-series', 'series', 'apple-tv', 0, 8);  // Display 6 rows of 10 items each initially
    })
    .catch(error => {
      console.error('Error fetching Apple TV series for view more:', error.message);
    });
});

// Add event listener to the "View More" button for the HBO section
document.getElementById('view-more-hbo').addEventListener('click', () => {
  
  activeSection = 'hbo';

  // Clear all sections, including the one triggering the View More
  const sections = document.querySelectorAll('.movie-section, .series-section'); // Adjust if you have other types of sections
  sections.forEach(section => {
    section.innerHTML = '';  // Clear content of all sections
  });

  // Fetch Series for the "View More" page (HBO Series example)
  fetch('/api/hbo-load-more')
    .then(response => response.json())
    .then(data => {
      console.log('HBO Series (View More):', data);

      // Pick a random movie from the "View More" results
      const randomMovie = data[Math.floor(Math.random() * data.length)];

      // Pass the full movie object to the featured movie display
      displayFeaturedMovie(randomMovie);

      // Display the new results in rows, 10 items per row, 6 rows total
      displayMoreItems(data, 'hbo-series', 'series', 'hbo', 0, 8);  // Display 6 rows of 10 items each initially
    })
    .catch(error => {
      console.error('Error fetching HBO series for view more:', error.message);
    });
});



// Add event listener to the "View More" button for the Disney+ section
document.getElementById('view-more-disney-plus').addEventListener('click', () => {

  activeSection = 'disney-plus';

  // Clear all sections, including the one triggering the View More
  const sections = document.querySelectorAll('.movie-section, .series-section'); // Adjust if you have other types of sections
  sections.forEach(section => {
    section.innerHTML = '';  // Clear content of all sections
  });

  // Fetch Series for the "View More" page (Disney+ Series example)
  fetch('/api/disney-plus-load-more')
    .then(response => response.json())
    .then(data => {
      console.log('Disney+ Series (View More):', data);

      // Pick a random movie from the "View More" results
      const randomMovie = data[Math.floor(Math.random() * data.length)];

      // Pass the full movie object to the featured movie display (no need to refetch data)
      displayFeaturedMovie(randomMovie);

      // Display the new results in rows, 10 items per row, 5 rows total
      displayMoreItems(data, 'disney-plus-series', 'series', 'disney-plus', 0, 5);  // Display 5 rows of 10 items each initially
    })
    .catch(error => {
      console.error('Error fetching Disney+ series for view more:', error.message);
    });
});


// Add event listener to the "View More" button for the Documentary section
document.getElementById('view-more-documentary').addEventListener('click', () => {
  // Clear all sections, including the one triggering the View More
  const sections = document.querySelectorAll('.movie-section, .series-section'); // Adjust if you have other types of sections
  sections.forEach(section => {
    section.innerHTML = '';  // Clear content of all sections
  });

  // Fetch Series for the "View More" page (Documentary Series example)
  fetch('/api/documentary-load-more')
    .then(response => response.json())
    .then(data => {
      console.log('Documentary Series (View More):', data);

      // Pick a random movie from the "View More" results
      const randomMovie = data[Math.floor(Math.random() * data.length)];

      // Pass the full movie object to the featured movie display (no need to refetch data)
      displayFeaturedMovie(randomMovie);

      // Display the new results in rows, 10 items per row, 6 rows total
      displayMoreItems(data, 'documentary-series', 'series', 'documentary', 0, 8);  // Display 6 rows of 10 items each initially
    })
    .catch(error => {
      console.error('Error fetching Documentary series for view more:', error.message);
    });
});

// Add event listener to the "View More" button for the Netflix section
document.getElementById('view-more-netflix-series').addEventListener('click', () => {

  activeSection = 'netflix'; // ✅ Set active section

  // Clear all sections, including the one triggering the View More
  const sections = document.querySelectorAll('.movie-section, .series-section'); // Adjust if you have other types of sections
  sections.forEach(section => {
    section.innerHTML = '';  // Clear content of all sections
  });

  // Fetch Series for the "View More" page (Netflix Series example)
  fetch('/api/netflix-series-load-more')
    .then(response => response.json())
    .then(data => {
      console.log('Netflix Series (View More):', data);

      // Pick a random movie from the "View More" results
      const randomMovie = data[Math.floor(Math.random() * data.length)];

      // Pass the full movie object to the featured movie display (no need to refetch data)
      displayFeaturedMovie(randomMovie);

      // Display the new results in rows, 10 items per row, 6 rows total
      displayMoreItems(data, 'netflix-series', 'series', 'netflix', 0, 8);  // Display 6 rows of 10 items each initially
    })
    .catch(error => {
      console.error('Error fetching Netflix series for view more:', error.message);
    });
});


////////////////////////////////////////////////////////////////////////// Home Display Items ////////////////////////////////////////////////////////////////////////////////////////////

function displayItems(items, containerId, type) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container with ID ${containerId} not found.`);
    return;
  }
  container.innerHTML = ''; // Clear existing content

  items.forEach(item => {
    const itemElement = document.createElement('div');
    itemElement.classList.add('movie-card');  // Add movie-card class to container
    itemElement.classList.add(`${type}-item`);

    // Setting the item HTML (Netflix logo removed)
    itemElement.innerHTML = `
      <img class="movie-poster" src="https://image.tmdb.org/t/p/w342${item.poster_path}" alt="${item.title || item.name}" style="cursor: pointer;">
    `;

    // Adding click event listener
    itemElement.addEventListener('click', () => {
      openModal(item);
    });

    container.appendChild(itemElement);
  });
}



// Fetch Apple TV Series from API
fetch('/api/apple-tv')
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  })
  .then(data => {
    console.log('Apple TV series data:', data); // Debugging log
    displayItems(data, 'apple-tv', 'tv'); // Display in the Apple TV section
  })
  .catch(error => {
    console.error('Error fetching Apple TV Series:', error.message);
  });


 // Fetch Amazon Prime Video Series from API
fetch('/api/amazon-prime')
.then(response => {
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
})
.then(data => {
  console.log('Amazon Prime Video series data:', data); // Debugging log
  displayItems(data, 'amazon-prime', 'tv'); // Display in the Amazon Prime Video section
})
.catch(error => {
  console.error('Error fetching Amazon Prime Video Series:', error.message);
});

// Fetch HBO Series from API
fetch('/api/hbo')
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  })
  .then(data => {
    console.log('HBO series data:', data); // Debugging log
    displayItems(data, 'hbo', 'tv'); // Display in the HBO section
  })
  .catch(error => {
    console.error('Error fetching HBO Series:', error.message);
  });


// Fetch Disney+ Series from API
fetch('/api/disney-plus')
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  })
  .then(data => {
    console.log('Disney+ series data:', data); // Debugging log
    displayItems(data, 'disney-plus', 'tv'); // Display in the Disney+ section
  })
  .catch(error => {
    console.error('Error fetching Disney+ Series:', error.message);
  });


// Fetch Documentary Series (from both Netflix and Apple TV) from API
fetch('/api/documentary')
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  })
  .then(data => {
    console.log('Documentaries data:', data); // Debugging log
    displayItems(data, 'documentaries', 'tv'); // Display in the Documentary section
  })
  .catch(error => {
    console.error('Error fetching Documentary Series:', error.message);
  });

  


  let currentPlayer = null; // Global variable to hold the current player instance

///////////////////////////////// OPEN MODAL FUNCTION MAIN //////////////////////////////

  function openModal(item, isFromTMDB = false) {
    const modal = document.getElementById('movie-modal');
    const title = item.title || item.name;
    const year = item.release_date ? item.release_date.split('-')[0] : item.first_air_date.split('-')[0];
    const languages = item.original_language;
       // ✅ Ensure genre_ids is defined before calling getGenreNames()
       const genres = item.genre_ids && Array.isArray(item.genre_ids) ? getGenreNames(item.genre_ids) : "Unknown";

    const description = item.overview;
      const rating = item.vote_average ? item.vote_average.toFixed(1) : 'N/A'; // Fetch rating

      const titleElement = document.getElementById('modal-title');
      const descriptionElement = document.getElementById('modal-description');
      const lastWatchedText = document.getElementById("last-watched-text"); // ✅ Define last watched element

      
  
      // Set text content
      titleElement.textContent = item.title;
      descriptionElement.textContent = item.overview;
  
      // Function to check if the text is in Arabic
      function isArabic(text) {
          return /[\u0600-\u06FF]/.test(text);
      }
  
      // Apply font size based on language
      if (isArabic(item.title)) {
          titleElement.style.fontSize = "1.8rem"; // Increase font size for Arabic
      } else {
          titleElement.style.fontSize = "1.5rem"; // Default size for English
      }
  
      if (isArabic(item.overview)) {
          descriptionElement.style.fontSize = "1.4rem"; // Bigger font for Arabic
      } else {
          descriptionElement.style.fontSize = "1rem"; // Default for English
      }


      // ✅ Disable scrolling when modal is open
      document.body.style.overflow = "hidden";

// Determine if the item is a TV show or movie
const mediaType = item.title ? 'movie' : 'tv';
console.log(`📌 Opened Modal - TMDB ID: ${item.id} Type: ${mediaType}`);

// ✅ Get Play Buttons
const moviePlayButton = document.getElementById('play-button');
const seriesPlayButton = document.getElementById('series-play-button');

if (mediaType === 'movie') {
    lastWatchedText.style.opacity = "0"; 
    moviePlayButton.style.display = "flex";  
    seriesPlayButton.style.display = "none"; 

    if (moviePlayButton) {
        requestAnimationFrame(() => {
            setTimeout(() => {
                moviePlayButton.focus();
            }, 50); // ⚡️ Just a tiny 50ms wait after rendering
        });
    }

} else if (mediaType === 'tv') {
    lastWatchedText.style.opacity = "1"; 
    console.log(`📌 Fetching last watched for TV ID: ${item.id}`);
    
    moviePlayButton.style.display = "none";  
    seriesPlayButton.style.display = "flex"; 

    if (seriesPlayButton) {
        requestAnimationFrame(() => {
            setTimeout(() => {
                seriesPlayButton.focus();
            }, 50); // ⚡️ Just a tiny 50ms wait
        });
    }

    // ✅ Fetch last watched episode for this series
    fetchLastWatchedEpisode(item.id).then(lastWatched => {
        if (lastWatched && lastWatched.seasonNumber && lastWatched.episodeNumber) {
            // ✅ If last watched exists, set to "Continue" and play that episode
            seriesPlayButton.textContent = "▶ Continue";
            seriesPlayButton.onclick = () => playLastWatchedEpisode(item.id, lastWatched);
        } else {
            // ✅ If no last watched, set to "Play" and start from S1E1
            seriesPlayButton.textContent = "▶ Play";
            seriesPlayButton.onclick = () => playFirstEpisode(item.id);
        }
    }).catch(error => {
        console.error("❌ Error fetching last watched:", error);
        seriesPlayButton.textContent = "Play ▶"; // Default to Play if error
        seriesPlayButton.onclick = () => playFirstEpisode(item.id);
    });
}

// ✅ Create "Add to My List" button separately
let favoriteButton = document.getElementById('favorite-button');
if (!favoriteButton) {
    favoriteButton = document.createElement('button');
    favoriteButton.id = 'favorite-button';
    favoriteButton.innerHTML = `<i class="fa fa-plus"></i> <span>Add to My List</span>`;
    favoriteButton.classList.add('favorite-button'); // Add styling class
}

// ✅ Ensure the button is visible and functional
favoriteButton.style.display = 'flex';
favoriteButton.onclick = () => {
    console.log(`📌 Toggle Favorite Clicked - TMDB ID: ${item.id} Type: ${mediaType}`); // ✅ Debugging
    toggleFavorite(item.id, mediaType); // ✅ Pass the corrected mediaType
};

// ✅ Insert Next to Play Button (If Exists)
if (moviePlayButton && moviePlayButton.parentNode) {
    moviePlayButton.parentNode.appendChild(favoriteButton); // Append next to Play button
} else {
    console.warn("⚠️ Play button not found, appending favorite button to modal.");
    modal.appendChild(favoriteButton);
}

// ✅ Function to play the last watched episode
function playLastWatchedEpisode(seriesId, lastWatched) {
    let season = lastWatched.seasonNumber;
    let episode = lastWatched.episodeNumber;

    console.log(`🎬 Resuming Last Watched Episode: S${season}E${episode}`);
    fetchEpisodeStream(seriesId, season, episode);
}

// ✅ Function to start from the first episode
function playFirstEpisode(seriesId) {
    console.log("🎬 Playing First Episode: S1E1");

        // ✅ Mark S1E1 as watched before playing
        markEpisodeWatched(seriesId, 1, 1);

         // ✅ Find the episode in the UI and apply the watched class
    document.querySelectorAll('.episode-item').forEach(item => {
      if (parseInt(item.dataset.seasonNumber) === 1 && parseInt(item.dataset.episodeNumber) === 1) {
          item.classList.add('watched'); // ✅ Mark as watched instantly
      }
  });

      // ✅ Update Last Watched Text Instantly
      updateLastWatchedText(1, 1);

      // ✅ Update Play Button to "Continue"
    updateSeriesPlayButton(seriesId, 1, 1);

    fetchEpisodeStream(seriesId, 1, 1);
}



      // Ensure that tvId is passed correctly from the item object
      const tvId = item.id;  // This assumes that item.id is the TMDB TV show ID

      // Log to confirm that tvId is correct
      console.log('tvId:', tvId);

         // ✅ Get modal-year-language element BEFORE using it
    const modalYearLanguage = document.getElementById('modal-year-language');

    // Update modal content
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-year-language').innerHTML = `
            <span class="match-tag">${(item.vote_average * 10).toFixed(0)}% Match</span> 
            <span class="year-tag">${year}</span> 
            <span class="language-tag">${languages}</span>  
            <span class="hd-tag">HD</span> 
            <span class="age-rating-tag" style="display: none;"></span>
             <span class="duration-tag"></span> 

    `;
    document.getElementById('modal-genres').innerHTML = `
  <span class="genre-label">Genres:</span> <span class="genre-list">${genres}</span>
`;

    document.getElementById('modal-description').textContent = description;


    // If it's a movie, fetch and display the duration
    if (mediaType === 'movie') {
      fetch(`/api/movie-runtime/${item.id}`)
          .then(response => response.json())
          .then(data => {
              if (data.runtime) {
                  const formattedDuration = formatDuration(data.runtime);
                  document.querySelector('.duration-tag').textContent = formattedDuration; // Correct placement
              }
          })
          .catch(error => console.error('Error fetching movie duration:', error));
  }



// ✅ If it's a TV show, fetch and display total number of seasons (based on buttons)
if (mediaType === 'tv') {
  // Wait until seasons are loaded in the dropdown
  const checkDropdown = setInterval(() => {
      const seasonDropdown = document.getElementById('season-dropdown');

      if (seasonDropdown) {
          const seasonButtons = seasonDropdown.querySelectorAll('button'); // 🔥 Find all season buttons
          
          if (seasonButtons.length > 0) {
              clearInterval(checkDropdown); // ✅ Stop checking once buttons are ready

              const totalSeasons = seasonButtons.length;
              const seasonText = totalSeasons === 1 ? '1 Season' : `${totalSeasons} Seasons`;

              // ✅ Ensure we append to modalYearLanguage
              const modalYearLanguage = document.getElementById('modal-year-language');
              if (modalYearLanguage) {
                  modalYearLanguage.innerHTML += `  <span class="seasons-tag">${seasonText}</span>`;
              } else {
                  console.warn("❌ modal-year-language element not found!");
              }
          }
      }
  }, 100); // ✅ Check every 100ms until buttons are ready
}



 // When fetching certification data
fetch(`/api/certification/${item.id}/${mediaType}`)
.then(response => response.json())
.then(data => {
    console.log("Fetched Certification:", data); // Debugging log
    const ageTag = document.querySelector('.age-rating-tag');

    // Check if certification exists
    const certification = data.certification && data.certification !== "N/A" ? data.certification : null;

    if (certification) {
        ageTag.textContent = certification;
        ageTag.style.display = 'inline-block'; // Show when available
    } else {
        ageTag.style.display = 'none'; // Hide if no certification
    }
})
.catch(error => console.error('Error fetching certification:', error));
 

    // ✅ ADD USER SCORE HERE (Right after the description update)
    const scoreContainer = document.getElementById('modal-score');
    if (scoreContainer) {
        scoreContainer.innerHTML = `<span class="score">${item.vote_average ? item.vote_average.toFixed(1) : 'N/A'}</span> / 10`;
    }


     // Clear season and episode details
     const seasonDropdown = document.getElementById('season-dropdown');
     const episodesContainer = document.getElementById('episodes-container');
    
     const arrow = document.querySelector('.arrow'); // Reference to the arrow element

     seasonDropdown.innerHTML = ''; // Clear previous dropdown options
     episodesContainer.innerHTML = ''; // Clear previous episodes content

    // Use the backdrop image as a placeholder if available
    const backdropUrl = item.backdrop_path ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}` : '';
    const posterUrl = item.poster_path ? `https://image.tmdb.org/t/p/original${item.poster_path}` : 'default-poster-url.jpg';
    const trailerDiv = document.getElementById('modal-trailer');
    trailerDiv.setAttribute('data-backdrop', backdropUrl);

    if (backdropUrl) {
        trailerDiv.innerHTML = `
          <div class="poster-placeholder" style="background-image: url('${backdropUrl}');"></div>
        `;
    } else {
        trailerDiv.innerHTML = `
          <div class="poster-placeholder" style="background-image: url('${posterUrl}');"></div>
        `;
    }
    

// Hide or show season dropdown based on media type
if (mediaType === 'tv') {
  seasonDropdown.style.display = 'block'; // Ensure dropdown is visible
  episodesContainer.style.display = 'block'; // Ensure episodes container is visible
  arrow.style.display = 'inline-block'; // Show arrow for TV shows

  document.getElementById('play-button').style.display = 'none';

  // Fetch detailed season and episode data only if it's a TV show
fetch(`/api/tv/${item.id}/seasons`)
.then(response => {
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    return response.json();
})
.then(data => {
    console.log('Seasons details:', data); // Debugging log

    const seasonDropdown = document.getElementById('season-buttons-container');
    const episodesContainer = document.getElementById('episodes-container');
    const mainDropdownButton = document.getElementById('season-dropdown'); // Reference to the main dropdown button

    // Clear previous season buttons and episodes content
    seasonDropdown.innerHTML = '';
    episodesContainer.innerHTML = '';

    if (data && data.length > 0) {
        // ✅ Filter out seasons with no available episodes
        const filteredSeasons = data.filter(season =>
            season.episodes.some(episode =>
                episodeIds.has(`${tvId}_${season.season_number}x${episode.episode_number}`)
            )
        );

        if (filteredSeasons.length === 0) {
            episodesContainer.innerHTML = '<p>No available seasons</p>';
            return;
        }

        // ✅ Store seasons globally
        window.allSeasons = filteredSeasons;

        // ✅ Store total episode counts per season
        window.seasonEpisodesCount = {};
        filteredSeasons.forEach(season => {
            window.seasonEpisodesCount[season.season_number] = season.episodes.length;
        });

        console.log("✅ Loaded allSeasons globally:", window.allSeasons);
        console.log("✅ Loaded seasonEpisodesCount:", window.seasonEpisodesCount);

        // ✅ Populate with buttons instead of <option>
        filteredSeasons.forEach(season => {
            const button = document.createElement('button');
            button.textContent = `Season ${season.season_number}`;
            button.classList.add('season-button'); // Optional for styling
            button.dataset.seasonNumber = season.season_number;
            seasonDropdown.appendChild(button);

            button.onclick = () => {
                const selectedSeasonNumber = parseInt(button.dataset.seasonNumber, 10);
                const seasonData = filteredSeasons.find(season => parseInt(season.season_number, 10) === selectedSeasonNumber);
                if (seasonData) {
                    // Update the main dropdown button text with the selected season
                    mainDropdownButton.textContent = `Season ${selectedSeasonNumber}`;

                    displaySeasonEpisodes(tvId, seasonData);
                    highlightSelectedButton(button); // ✅ Optional: Highlight active
                    
                    // Close the dropdown after selecting a season
                    seasonDropdown.style.display = 'none';
                    const arrow = document.querySelector(".arrow");
                    arrow.classList.remove('flipped'); // Unflip the arrow
                } else {
                    console.error('Season data not found for season number:', selectedSeasonNumber);
                }
            };
        });

        // ✅ Auto-click the first button (like auto-selecting first season)
        const firstButton = seasonDropdown.querySelector('button');
        if (firstButton) {
            firstButton.click(); // Trigger click to load first season automatically
        }
    } else {
        episodesContainer.innerHTML = '<p>No seasons available</p>';
    }
})
.catch(error => {
    console.error('Error fetching seasons data:', error);
    episodesContainer.innerHTML = '<p>Error fetching seasons data</p>';
});

} else {
  
  seasonDropdown.style.display = 'none'; // Ensure dropdown is hidden
  episodesContainer.style.display = 'none'; // Ensure episodes container is hidden
  arrow.style.display = 'none'; // Hide arrow for movies

// Inside openModal function (Modify the play button part)
const playButton = document.getElementById('play-button');


if (mediaType === 'movie') {
    playButton.style.display = 'block'; // Show play button


    if (isFromTMDB) {
      playButton.onclick = () => {
          console.log("🎬 Fetching movie from MY API...");
          
          // ✅ Stop the trailer before playing the Arabic movie
          const trailerIframe = document.querySelector('#movie-modal iframe');
          if (trailerIframe) {
              trailerIframe.src = '';  // Clears the trailer source
          }
  
          const trailerDiv = document.getElementById('modal-trailer');
          const backdropUrl = trailerDiv.getAttribute('data-backdrop'); // Retrieve stored backdrop
          
          if (backdropUrl) {
              trailerDiv.innerHTML = `<div class="poster-placeholder" style="background-image: url('${backdropUrl}');"></div>`;
          }
  
          playMovie(item.id); // Call your custom API for Arabic movies
      };

      // Hide "Favorite" button (My List)
      const favoriteButton = document.getElementById('favorite-button');
      if (favoriteButton) {
          favoriteButton.style.display = 'none';
      }

    } else {
        playButton.onclick = () => {
            console.log("🎬 Fetching movie from Vidsrc...");
            fetchMovieStream(item.id); // Call Vidsrc API
        };
    }
}
}



// Fetch Movies Function //
function fetchMovieStream(movieId) {
  // Send a request to your backend to get the video URL
  fetch(`/api/movie/${movieId}/streams`)
      .then(response => response.json())
      .then(data => {
          console.log('Received data from server:', data); // Log the received data

          if (data && data.videoUrl) {

               // Append Arabic subtitle parameter
            const videoUrlWithSubs = `${data.videoUrl}&ds_lang=ar`;
            console.log(`Setting video source to: ${videoUrlWithSubs}`);

              playVideo(videoUrlWithSubs); // Pass the video URL to play in the video player
          } else {
              console.error('No video URL found for this movie.');
          }
      })
      .catch(error => {
          console.error('Error fetching movie stream:', error);
      });
}

// Play Movie Function //

function playVideo(videoUrl) {
  try {
    // Check if the video URL is provided
    if (!videoUrl) {
      console.error('Video URL is missing.');
      return;
    }

    // Remove existing overlay if it already exists
    const existingOverlay = document.getElementById('fullscreen-overlay');
    if (existingOverlay) {
      existingOverlay.remove();
    }

    // Stop and remove the trailer inside the modal
    const trailerIframe = document.querySelector('#movie-modal iframe');
    if (trailerIframe) {
      trailerIframe.src = '';  // Clears the trailer source
    }

    // Create a fullscreen overlay div
    const fullscreenOverlay = document.createElement('div');
    fullscreenOverlay.id = 'fullscreen-overlay';
    fullscreenOverlay.style.position = 'fixed';
    fullscreenOverlay.style.left = '0';
    fullscreenOverlay.style.top = '0';
    fullscreenOverlay.style.width = '100%';
    fullscreenOverlay.style.height = '100%';
    fullscreenOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
    fullscreenOverlay.style.zIndex = '1000';
    fullscreenOverlay.style.display = 'flex';
    fullscreenOverlay.style.alignItems = 'center';
    fullscreenOverlay.style.justifyContent = 'center';
    fullscreenOverlay.style.overflow = 'hidden';

    // Create iframe and set the video URL as its source
    const iframe = document.createElement('iframe');
    iframe.src = videoUrl;
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.allow = 'autoplay; encrypted-media';
    iframe.allowFullscreen = true;

    // Append iframe to the overlay
    fullscreenOverlay.appendChild(iframe);

    // Add a close button
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '20px';
    closeButton.style.right = '20px';
    closeButton.style.fontSize = '20px';
    closeButton.style.color = '#fff';
    closeButton.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    closeButton.style.border = 'none';
    closeButton.style.padding = '10px';
    closeButton.style.cursor = 'pointer';

    // Close button event listener
    closeButton.addEventListener('click', () => {
      // Remove overlay from DOM
      if (fullscreenOverlay) {
        fullscreenOverlay.remove();
      }

      // Stop the movie when closing
      iframe.src = '';

      // **DO NOT HIDE THE MODAL**
      // Keeping the movie modal open

 // Restore the backdrop image inside modal-trailer
 const trailerDiv = document.getElementById('modal-trailer');
 const backdropUrl = trailerDiv.getAttribute('data-backdrop'); // Get the stored backdrop URL

 if (backdropUrl) {
     trailerDiv.innerHTML = `<div class="poster-placeholder" style="background-image: url('${backdropUrl}');"></div>`;
 }

 // ✅ NEW: Refocus the play button after closing
  requestAnimationFrame(() => {
    setTimeout(() => {
      const moviePlayButton = document.getElementById('play-button');
      if (moviePlayButton && moviePlayButton.style.display !== 'none') {
        moviePlayButton.focus();
      }
    }, 50); // Small delay to let DOM settle
  });

    });

    // Append the close button to the overlay
    fullscreenOverlay.appendChild(closeButton);

    // Append the overlay to the document body
    document.body.appendChild(fullscreenOverlay);

  } catch (error) {
    console.error('Error fetching movie stream:', error);
  }
}



// Function to display episodes for a given season
async function displaySeasonEpisodes(tvId, season) {
  const episodesContainer = document.getElementById('episodes-container');

  // ✅ Ensure episodesContainer is cleared before adding new ones
  episodesContainer.innerHTML = '';

  if (!season || !season.episodes || season.episodes.length === 0) {
    episodesContainer.innerHTML = '<p>No episodes available</p>';
    return;
  }

  // ✅ Fetch watched episodes for this series
  const watchedEpisodes = await fetchWatchedEpisodes(tvId);

  // ✅ Remove any lingering episode items from previous selections
  document.querySelectorAll('.episode-item').forEach(item => item.remove());

  season.episodes.forEach((episode, index) => {
    // ✅ Construct episode key in correct format: "tvId_seasonNumberxEpisodeNumber"
    const episodeKey = `${tvId}_${season.season_number}x${episode.episode_number}`;

    // ✅ Filter episodes using eps_tmdb.txt
    if (!episodeIds.has(episodeKey)) {
      console.log(`Skipping episode ${episode.episode_number} (not in eps_tmdb.txt)`);
      return;
    }

    const episodeItem = document.createElement('div');
    episodeItem.classList.add('episode-item');
    episodeItem.dataset.seasonNumber = season.season_number;
    episodeItem.dataset.episodeNumber = episode.episode_number;

    // ✅ Check if this episode was watched and mark it
    if (watchedEpisodes.some(ep => ep.episodeNumber === episode.episode_number && ep.seasonNumber === season.season_number)) {
      episodeItem.classList.add('watched'); // ✅ Highlight watched episodes
    }

    // Get episode name or fallback to 'Episode X'
    const episodeTitle = episode.name ? `${index + 1}. ${episode.name}` : `Episode ${episode.episode_number}`;

    // ✅ Extract runtime
    const episodeRuntime = episode.runtime ? `${episode.runtime}m` : "N/A";

    // Show episode number, image, and description
    episodeItem.innerHTML = `
      <div class="episode-item-content">
        <div class="episode-image">
         <img src="${episode.still_path ? `https://image.tmdb.org/t/p/${window.innerWidth < 600 ? 'w780' : 'w300'}${episode.still_path}` : trailerDiv.getAttribute('data-backdrop')}" alt="Episode ${episode.episode_number}">
         <div class="play-icon">
          <i class="fa fa-play"></i>
        </div>
        </div>
        <div class="episode-info">
          <h5 class="episode-number">${episodeTitle}</h5>  <!-- Use episodeTitle here -->
          <p class="episode-description">${episode.overview || item.overview}</p>
            <p class="episode-runtime" id="main-episode-runtime">${episodeRuntime}</p> <!-- ✅ Ensure runtime is last -->
        </div>
      </div>
    `;

    // ✅ Add click event for fetching episode stream and marking as watched
    episodeItem.addEventListener('click', async () => {
      await markEpisodeWatched(tvId, season.season_number, episode.episode_number);
      fetchEpisodeStream(tvId, season.season_number, episode.episode_number);
      episodeItem.classList.add('watched'); // ✅ Highlight episode instantly

    // ✅ Update Last Watched Text Instantly
    updateLastWatchedText(season.season_number, episode.episode_number);

        // ✅ Update Play Button to "Continue"
        updateSeriesPlayButton(tvId, season.season_number, episode.episode_number);

    });

    episodesContainer.appendChild(episodeItem);
  });

  // ✅ Ensure only current season's episodes are displayed
  document.querySelectorAll('.episode-item').forEach(item => {
    if (item.dataset.seasonNumber !== season.season_number.toString()) {
      item.remove();
    }
  });

  // ✅ If no episodes remain after filtering, show a message
  if (episodesContainer.innerHTML === '') {
    episodesContainer.innerHTML = '<p>No available episodes</p>';
  }
}


// Fetch Watched Episodes From MongoDB
async function fetchWatchedEpisodes(seriesId) {
  try {
    const response = await fetch(`/api/user/watched/${seriesId}`);
    if (!response.ok) throw new Error('Failed to fetch watched episodes');
    return await response.json();
  } catch (error) {
    console.error('❌ Error fetching watched episodes:', error);
    return [];
  }
}

// Mark Episode As Watched
async function markEpisodeWatched(seriesId, seasonNumber, episodeNumber) {
  try {
    const response = await fetch('/api/user/watched', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seriesId, seasonNumber, episodeNumber })
    });

    if (!response.ok) throw new Error('Failed to mark episode as watched');
    console.log(`✅ Marked episode S${seasonNumber}E${episodeNumber} as watched`);
  } catch (error) {
    console.error('❌ Error marking episode as watched:', error);
  }
}

//Instant update for Last Watched Text
function updateLastWatchedText(season, episode) {
  const lastWatchedText = document.getElementById("last-watched-text");

  if (season && episode) {
      lastWatchedText.textContent = `Last Watched: Season ${season} Episode ${episode}`;
      lastWatchedText.style.visibility = "visible"; // ✅ Ensure it's visible
  } else {
      lastWatchedText.style.visibility = "hidden"; // ✅ Hide if no last watched
  }

  console.log(`✅ Updated Last Watched Instantly: S${season}E${episode}`);
}

// Update Series Play/Continue button Immediately
function updateSeriesPlayButton(seriesId, season, episode) {
  const seriesPlayButton = document.getElementById('series-play-button');

  if (seriesPlayButton) {
      seriesPlayButton.textContent = "Continue ▶";
      seriesPlayButton.onclick = () => playLastWatchedEpisode(seriesId, { seasonNumber: season, episodeNumber: episode });

      console.log(`✅ Updated Play Button to "Continue" for S${season}E${episode}`);
  }
}



// Function to fetch the episode stream URL and open the video player
function fetchEpisodeStream(tvId, seasonNumber, episodeNumber) {
  if (!tvId || !seasonNumber || !episodeNumber) {
    console.error('Missing required parameters:', { tvId, seasonNumber, episodeNumber });
    return;
  }

  console.log(`Fetching stream for TV Show: ${tvId}, Season: ${seasonNumber}, Episode: ${episodeNumber}`);

  fetch(`/api/tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}/streams`)
    .then(response => response.json())
    .then(data => {
      if (data && data.videoUrl) {
        // ✅ Append Arabic subtitle parameter and enable Auto-Next
        const videoUrlWithSubs = `${data.videoUrl}&ds_lang=ar&autonext=1`;
        console.log(`Setting video source to: ${videoUrlWithSubs}`);

        // ✅ Open video player after getting the URL
        openVideoPlayer(videoUrlWithSubs, tvId, seasonNumber, episodeNumber);
      } else {
        console.error("❌ No video URL found for this episode.");
      }
    })
    .catch(error => {
      console.error('Error fetching episode stream:', error);
    });
}


// Function to open the video player and play the fetched stream URL
function openVideoPlayer(videoUrl, tvId, seasonNumber, episodeNumber) {
  try {
      if (!videoUrl) {
          console.error('Video URL  is missing.');
          return;
      }

      // Remove existing overlay if it exists
      const existingOverlay = document.getElementById('fullscreen-overlay');
      if (existingOverlay) existingOverlay.remove();

      // Stop and remove the trailer inside the modal
      const trailerIframe = document.querySelector('#movie-modal iframe');
      if (trailerIframe) trailerIframe.src = '';

      // Create fullscreen overlay
      const fullscreenOverlay = document.createElement('div');
      fullscreenOverlay.id = 'fullscreen-overlay';
      fullscreenOverlay.style.position = 'fixed';
      fullscreenOverlay.style.left = '0';
      fullscreenOverlay.style.top = '0';
      fullscreenOverlay.style.width = '100%';
      fullscreenOverlay.style.height = '100%';
      fullscreenOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
      fullscreenOverlay.style.zIndex = '1000';
      fullscreenOverlay.style.display = 'flex';
      fullscreenOverlay.style.alignItems = 'center';
      fullscreenOverlay.style.justifyContent = 'center';
      fullscreenOverlay.style.overflow = 'hidden';

      // Create iframe and set video URL
      const iframe = document.createElement('iframe');
      iframe.src = videoUrl;
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = 'none';
      iframe.allow = 'autoplay; encrypted-media';
      iframe.allowFullscreen = true;

      fullscreenOverlay.appendChild(iframe);

      // Close button
      const closeButton = document.createElement('button');
      closeButton.textContent = 'Close';
      closeButton.style.position = 'absolute';
      closeButton.style.top = '20px';
      closeButton.style.right = '20px';
      closeButton.style.fontSize = '20px';
      closeButton.style.color = '#fff';
      closeButton.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      closeButton.style.border = 'none';
      closeButton.style.padding = '10px';
      closeButton.style.cursor = 'pointer';

      closeButton.addEventListener('click', () => {
          if (fullscreenOverlay) fullscreenOverlay.remove();
          iframe.src = '';
          const trailerDiv = document.getElementById('modal-trailer');
          const backdropUrl = trailerDiv.getAttribute('data-backdrop');
          if (backdropUrl) {
              trailerDiv.innerHTML = `<div class="poster-placeholder" style="background-image: url('${backdropUrl}');"></div>`;
          }

               // ✅ Refocus the series play button after closing
      requestAnimationFrame(() => {
        setTimeout(() => {
          const seriesPlayButton = document.getElementById('series-play-button');
          if (seriesPlayButton && seriesPlayButton.style.display !== 'none') {
            seriesPlayButton.focus();
          }
        }, 10); // Small delay to let DOM settle
      });

      });

      fullscreenOverlay.appendChild(closeButton);

// ✅ "Next Episode" Button
let nextEpisodeBtn = document.getElementById("main-next-episode");
if (!nextEpisodeBtn) {
    nextEpisodeBtn = document.createElement("button");
    nextEpisodeBtn.id = "main-next-episode";
    nextEpisodeBtn.textContent = "▶ Next Episode ";

    // ✅ Apply class for styling instead of inline styles
    nextEpisodeBtn.classList.add("next-episode-btn");

    // ✅ Click event to play next episode (Handles Season Changes)
    nextEpisodeBtn.addEventListener("click", async () => {
        console.log(`Skipping to next episode... Current: S${seasonNumber}E${episodeNumber}`);

        // ✅ Ensure `seasonEpisodesCount` exists before using it
        if (!window.seasonEpisodesCount || !seasonEpisodesCount[seasonNumber]) {
            console.warn(`⚠️ seasonEpisodesCount for S${seasonNumber} is missing.`);
            return;
        }

        let totalEpisodes = seasonEpisodesCount[seasonNumber];

        // ✅ Check if this is the last episode of the season
        if (episodeNumber >= totalEpisodes) {
            console.log(`✅ End of Season ${seasonNumber}, moving to next season...`);

            // Move to next season
            seasonNumber++;

            // ✅ Find the next season in `window.allSeasons`
            let nextSeason = window.allSeasons.find(s => s.season_number === seasonNumber);
            if (!nextSeason) {
                console.warn(`❌ No more seasons available.`);
                return; // Stop if no more seasons exist
            }

            // ✅ Update `seasonEpisodesCount` with the new season’s episodes
            seasonEpisodesCount[seasonNumber] = nextSeason.episodes.length;
            console.log(`✅ Loaded Season ${seasonNumber}, total episodes: ${seasonEpisodesCount[seasonNumber]}`);

            // ✅ Update the UI to display the new season’s episodes
            displaySeasonEpisodes(tvId, nextSeason);

            // Start at episode 1 of the new season
            episodeNumber = 1;
        } else {
            // ✅ Otherwise, just move to the next episode
            episodeNumber++;
        }

        console.log(`Now playing: S${seasonNumber}E${episodeNumber}`);

// ✅ Mark episode as watched in DB
await markEpisodeWatched(tvId, seasonNumber, episodeNumber);

// ✅ Instantly mark the episode as watched in UI
document.querySelectorAll(".episode-item").forEach(item => {
  if (parseInt(item.dataset.seasonNumber) === seasonNumber && 
      parseInt(item.dataset.episodeNumber) === episodeNumber) {
      item.classList.add("watched");
  }
});

// ✅ Update UI immediately (without waiting for DB fetch)
updateLastWatchedText(seasonNumber, episodeNumber);
updateSeriesPlayButton(tvId, seasonNumber, episodeNumber); // ✅ Use this instead of updateContinueButton

// ✅ Fetch last watched from DB in the background (ensures accuracy)
fetchLastWatchedEpisode(tvId);


        fetchEpisodeStream(tvId, seasonNumber, episodeNumber);
    });

    fullscreenOverlay.appendChild(nextEpisodeBtn);
}


// ✅ Append overlay to document
document.body.appendChild(fullscreenOverlay);



  } catch (error) {
      console.error('Error opening video player:', error);
  }
}



 // Fetch the trailer URL from TMDb
 fetch(`/api/media/${mediaType}/${item.id}/trailer`)
     .then(response => response.json())
     .then(data => {
         if (data && data.youtube_trailer) {
             const trailerUrl = `https://www.youtube.com/embed/${data.youtube_trailer}?autoplay=1&controls=0&modestbranding=1&rel=0&iv_load_policy=3&fs=0&showinfo=0&disablekb=1`;

             // Replace placeholder with Plyr video player
             trailerDiv.innerHTML = `
               <div class="plyr__video-embed" id="player">
                 <iframe
                   src="${trailerUrl}"
                   allow="autoplay; encrypted-media"
                   allowfullscreen>
                 </iframe>
               </div>
                 <button id="mute-button" class="mute-button">
        <i id="mute-icon" class="fa fa-volume-up"></i> <!-- Add an icon for mute -->
    </button>
             `;

             // Initialize Plyr
             currentPlayer = new Plyr('#player', {
                 controls: [], // Hide all controls
                 autoplay: true,
                 muted: false,
                 loop: { active: false },
                 fullscreen: false,
                 clickToPlay: false, // Prevent pausing by click
                 disableContextMenu: true, // Disable right-click context menu
                 cc_load_policy: 0,  // Try disabling CC
             });


                  // ✅ Listen for when the video ends and remove it
        currentPlayer.on('ended', () => {
          console.log("🎬 Trailer finished playing. Removing video...");
          trailerDiv.innerHTML = `<div class="poster-placeholder" style="background-image: url('${backdropUrl}');"></div>`;
      });

           
            // Get the mute button and icon
            const muteButton = document.getElementById('mute-button');
            const muteIcon = document.getElementById('mute-icon');

            // Add the event listener to toggle mute state
            muteButton.addEventListener('click', function() {
                if (currentPlayer.muted) {
                    currentPlayer.muted = false; // Unmute
                    muteIcon.classList.remove('fa-volume-mute');
                    muteIcon.classList.add('fa-volume-up');
                } else {
                    currentPlayer.muted = true; // Mute
                    muteIcon.classList.remove('fa-volume-up');
                    muteIcon.classList.add('fa-volume-mute');
                }
});


               

         } else {
             trailerDiv.innerHTML = `<div class="poster-placeholder" style="background-image: url('${backdropUrl || posterUrl}');"></div>`;
         }
     })
     .catch(error => {
         console.error('Error fetching trailer:', error.message);
         trailerDiv.innerHTML = '<p>Trailer not available.</p>';
     });

    // Display the modal
    modal.style.display = 'block';

     // Close modal functionality
     document.querySelector('.close-btn').addEventListener('click', () => {
      modal.style.display = 'none';

      
  
      // Stop the video playback
      if (currentPlayer) {
          currentPlayer.destroy(); // Destroys the Plyr instance and stops the video
      }
  
      // Clear the trailer iframe
      const trailerIframe = document.querySelector('#player iframe');
      if (trailerIframe) {
          trailerIframe.src = ''; // Stop the video by clearing the iframe's src
          trailerIframe.style.display = 'none'; // Optionally hide the iframe as well
      }
      
      // ✅ Re-enable scrolling when the modal is closed
      document.body.style.overflow = "auto";

  });

}

// Helper function to fetch Last Watched episode next to Season Dropdown
async function fetchLastWatchedEpisode(seriesId) {
  try {
    const response = await fetch(`/api/user/last-watched/${seriesId}`);
    if (!response.ok) throw new Error("Failed to fetch last watched episode");

    const lastWatched = await response.json();
    const lastWatchedText = document.getElementById("last-watched-text");

    // ✅ If no watched data, hide the text but keep space reserved
    if (!lastWatched || !lastWatched.seasonNumber || !lastWatched.episodeNumber) {
      lastWatchedText.style.visibility = "hidden"; // Hide text but keep layout intact
      return null; // ✅ Return null if no last watched data
    }

    // ✅ Show the element and update text with last watched season & episode
    lastWatchedText.style.visibility = "visible"; // Show text when available
    lastWatchedText.textContent = 
      `Last Watched: Season ${lastWatched.seasonNumber} Episode ${lastWatched.episodeNumber}`;

    console.log(`✅ Updated last watched: S${lastWatched.seasonNumber}E${lastWatched.episodeNumber}`);

    return lastWatched; // ✅ Return last watched data so openModal() can use it
  } catch (error) {
    console.error("❌ Error fetching last watched episode:", error);
    return null; // ✅ Return null on error
  }
}


// Helper function to format duration from minutes to "1h 30m"
function formatDuration(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

document.addEventListener("DOMContentLoaded", function() {
  const seasonDropdown = document.getElementById("season-dropdown");
  const seasonButtonsContainer = document.getElementById('season-buttons-container');
  const arrow = document.querySelector(".arrow");

  // Toggle showing/hiding the season buttons when clicking the dropdown
  seasonDropdown.addEventListener('click', (event) => {
    event.stopPropagation(); // Prevent the click event from bubbling up to the document
    if (seasonButtonsContainer.style.display === 'none' || seasonButtonsContainer.style.display === '') {
      seasonButtonsContainer.style.display = 'block';
      arrow.classList.add('flipped'); // Flip the arrow

      // Autofocus the first season button when the dropdown opens
      const firstButton = seasonButtonsContainer.querySelector('button');
      if (firstButton) {
        firstButton.focus(); // Focus the first season button
      }
    } else {
      seasonButtonsContainer.style.display = 'none';
      arrow.classList.remove('flipped'); // Unflip the arrow
    }
  });

  // Close the dropdown if a season button is clicked
  seasonButtonsContainer.addEventListener('click', (event) => {
    if (event.target && event.target.matches("button")) { // Make sure a season button was clicked
      seasonButtonsContainer.style.display = 'none';
      arrow.classList.remove('flipped'); // Reset the arrow
      
    // ✅ Use MutationObserver to detect when the first episode appears
    const observer = new MutationObserver((mutationsList, observer) => {
      const firstEpisodeItem = document.querySelector('.episode-item');
      if (firstEpisodeItem) {
        firstEpisodeItem.setAttribute('tabindex', '-1');
        firstEpisodeItem.focus();
        observer.disconnect(); // Stop observing once we find it
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    }
  });

  // Close the dropdown if clicking anywhere outside the dropdown or season buttons container
  document.addEventListener('click', (event) => {
    if (!seasonDropdown.contains(event.target) && !seasonButtonsContainer.contains(event.target)) {
      seasonButtonsContainer.style.display = 'none';
      arrow.classList.remove('flipped'); // Reset the arrow
    }
  });

  // Prevent navigation outside the dropdown with arrow keys (up, down, left, right)
  seasonButtonsContainer.addEventListener('keydown', (event) => {
    const buttons = Array.from(seasonButtonsContainer.querySelectorAll('button'));
    const firstButton = buttons[0];
    const lastButton = buttons[buttons.length - 1];

    // Prevent the arrow key navigation from leaving the season buttons container
    if (event.key === 'ArrowDown') {
      // Move focus to the next button
      const currentButton = document.activeElement;
      let nextButton = currentButton.nextElementSibling;
      if (nextButton) {
        nextButton.focus();
      } else {
        firstButton.focus(); // Loop back to the first button
      }
      event.preventDefault(); // Prevent default action
    } 
    else if (event.key === 'ArrowUp') {
      // Move focus to the previous button
      const currentButton = document.activeElement;
      let prevButton = currentButton.previousElementSibling;
      if (prevButton) {
        prevButton.focus();
      } else {
        lastButton.focus(); // Loop back to the last button
      }
      event.preventDefault(); // Prevent default action
    }
    // Optional: You can also block left/right arrow keys if they interfere with navigation
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
    }
  });
});


function highlightSelectedButton(selectedButton) {
  const buttons = document.querySelectorAll('#season-dropdown .season-button');
  buttons.forEach(button => {
      button.classList.remove('active');
  });
  selectedButton.classList.add('active');
}



//////////////////////////////////////////////////////////// arabic series  /////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////// Turkish Series Code ///////////////////////////////////////////////////

// Function to display the list of Turkish series
async function displayTurkishSeriesList() {
  const maxItems = 3; // Now matches Arabic series count

  try {
    const response = await fetch('api/turkish-series/random');
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const seriesData = await response.json();
    const container = document.getElementById('turkish-series');
    container.innerHTML = ''; // Clear existing content

    if (Array.isArray(seriesData)) {
      seriesData.slice(0, maxItems).forEach(series => {
        const seriesPoster = series.poster || 'default-poster.jpg'; // ✅ Now uses series.poster

        const seriesElement = document.createElement('div');
        seriesElement.classList.add('series-item');
        seriesElement.innerHTML = `
          <img src="${seriesPoster}" alt="Series Poster" style="cursor: pointer;">
        `;

        // 🔹 Fetch full series data from local-seasons using ID when clicked
        seriesElement.addEventListener('click', async () => {
          try {
            const fullSeriesResponse = await fetch(`/api/seasons?id=${series.id}`);
            if (!fullSeriesResponse.ok) throw new Error('Failed to fetch full series data');

            const fullSeriesData = await fullSeriesResponse.json();
            openArabicSeriesModal(fullSeriesData); // Pass the fetched data to the modal
          } catch (error) {
            console.error('Error fetching full series data:', error);
          }
        });

        container.appendChild(seriesElement);
      });
    } else {
      console.error('Expected an array of series data.');
    }
  } catch (error) {
    console.error('Error fetching Turkish series data:', error);
  }
}


document.addEventListener("DOMContentLoaded", () => {
  displayTurkishSeriesList();
});


///////////////////////////////////////////////////// End of Turkish series code ////////////////////////////////////////


// Function to load Arabic Shows page
function loadArabicShowsPage() {
  displayFullSeriesList('arabic');
}

// Function to load Turkish Shows page
function loadTurkishShowsPage() {
  displayFullSeriesList('turkish');
}

// Add event listeners for Arabic and Turkish Shows buttons
document.addEventListener("DOMContentLoaded", function () {
  const arabicShowsBtn = document.getElementById('arabicshows-text');
  const turkishShowsBtn = document.getElementById('turkishshows-text');

  if (arabicShowsBtn) {
    arabicShowsBtn.addEventListener('click', loadArabicShowsPage);
  } else {
    console.error("Arabic Shows button not found in the DOM!");
  }

  if (turkishShowsBtn) {
    turkishShowsBtn.addEventListener('click', loadTurkishShowsPage);
  } else {
    console.error("Turkish Shows button not found in the DOM!");
  }
});


//////////////////////////////////////////////////////////// Display arabic series with view all button //////////////////////////////////////////////


// Function to display the list of Arabic series
async function displayArabicSeriesList() {
  const maxItems = 10; // Easily adjustable number of series to display

  try {
    const response = await fetch('api/arabic-series/random?limit=10');
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const seriesData = await response.json();
    const container = document.getElementById('arabic-series');
    container.innerHTML = ''; // Clear existing content

    if (Array.isArray(seriesData)) {
      seriesData.slice(0, maxItems).forEach(series => {
        const seriesPoster = series.poster || 'default-poster.jpg'; // ✅ Now uses series.poster

        const seriesElement = document.createElement('div');
        seriesElement.classList.add('series-item');
        seriesElement.innerHTML = `
          <img src="${seriesPoster}" alt="Series Poster" style="cursor: pointer;">
        `;

        // 🔹 Fetch full series data from local-seasons using ID when clicked
        seriesElement.addEventListener('click', async () => {
          try {
            const fullSeriesResponse = await fetch(`/api/seasons?id=${series.id}`);
            if (!fullSeriesResponse.ok) throw new Error('Failed to fetch full series data');

            const fullSeriesData = await fullSeriesResponse.json();
            openArabicSeriesModal(fullSeriesData); // Pass the fetched data to the modal
          } catch (error) {
            console.error('Error fetching full series data:', error);
          }
        });

        container.appendChild(seriesElement);
      });
    } else {
      console.error('Expected an array of series data.');
    }
  } catch (error) {
    console.error('Error fetching Arabic series data:', error);
  }
}


// Function to display the full series list for Arabic or Turkish series
async function displayFullSeriesList(type) {
  try {
    const dataFile = type === 'turkish' ? 'api/turkish-series/view-more' : 'api/arabic-series/view-more';

    const response = await fetch(dataFile);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const seriesData = await response.json();

    // Hide all homepage sections including Arabic/Turkish series and featured movie
    document.querySelectorAll('.movie-section').forEach(section => {
      section.style.display = 'none';
    });

    // Specifically hide the featured movie section
    const featuredMovieSection = document.getElementById('featured-movie-section');
    if (featuredMovieSection) {
      featuredMovieSection.style.display = 'none';
    }

    // 🔴 Hide Arabic Movies Results if it's visible
    const arabicMoviesResults = document.getElementById('arabic-movies-results');
    if (arabicMoviesResults) {
      arabicMoviesResults.style.display = 'none';
    }

    // 🔴 Hide Local Featured Movie Section
    const localFeaturedMovieSection = document.getElementById('displaylocalfeaturedmovie-section');
    if (localFeaturedMovieSection) {
      localFeaturedMovieSection.style.display = 'none';
    }
    
    // 🔴 Hide More Results Container if it exists
const moreResultsContainer = document.querySelector('.more-results-container');
if (moreResultsContainer) {
  moreResultsContainer.style.display = 'none';
}


    // 🔴 Hide search Results Container if it exists
    const searchResultsContainer = document.querySelector('#search-results');
    if (searchResultsContainer) {
      searchResultsContainer.style.display = 'none';
    }

            // Hide My list containers
const myListContainers = document.getElementById("mylist-container");
if (myListContainers) myListContainers.style.display = "none";
    

  
    // 🔴 Remove previous Arabic or Turkish series results before displaying new ones
    document.querySelectorAll('.series-results').forEach(resultContainer => {
      resultContainer.remove();
    });

    // Create a new container for the series list
    resultsContainer = document.createElement('div');
    resultsContainer.id = `${type}-series-results`;
    resultsContainer.classList.add('series-results');

    // Append it to the body or main content area
    document.body.appendChild(resultsContainer);

    // Load 8 rows with 10 items each (total 80 results)
    let currentIndex = 0;
    const totalResults = Math.min(80, seriesData.length); // Load up to 80 items

    for (let rowIndex = 0; rowIndex < 8; rowIndex++) {
      // Create a container for each row with scroll buttons
      const rowContainer = document.createElement('div');
      rowContainer.classList.add('movie-container');

      // Left scroll button
      const leftBtn = document.createElement('button');
      leftBtn.classList.add('scroll-btn', 'left-btn');
      leftBtn.innerHTML = '&lt;';

      // Row for series items
      const seriesRow = document.createElement('div');
      seriesRow.classList.add('movie-row');
      seriesRow.id = `${type}-series-row-${rowIndex}`;

      // Right scroll button
      const rightBtn = document.createElement('button');
      rightBtn.classList.add('scroll-btn', 'right-btn');
      rightBtn.innerHTML = '&gt;';

      // Populate row with 10 series items
      let itemsAdded = 0;
      for (let i = 0; i < 10 && currentIndex < totalResults; i++) {
        const series = seriesData[currentIndex];

        if (!series.poster) continue; // Skip if no poster is available

        const seriesPoster = series.poster || 'default-poster.jpg'; // ✅ Now uses series.poster

        const seriesElement = document.createElement('div');
        seriesElement.classList.add('series-item');
        seriesElement.innerHTML = `
          <img src="${seriesPoster}" alt="Series Poster" style="cursor: pointer;">
        `;

        // 🔹 Fetch full series data from local-seasons using ID when clicked
        seriesElement.addEventListener('click', async () => {
          try {
            const fullSeriesResponse = await fetch(`/api/seasons?id=${series.id}`);
            if (!fullSeriesResponse.ok) throw new Error('Failed to fetch full series data');

            const fullSeriesData = await fullSeriesResponse.json();
            openArabicSeriesModal(fullSeriesData); // Pass the fetched data to the modal
          } catch (error) {
            console.error('Error fetching full series data:', error);
          }
        });

        seriesRow.appendChild(seriesElement);
        currentIndex++;
        itemsAdded++;
      }

      // Only append the row if it contains items
      if (itemsAdded > 0) {
        rowContainer.appendChild(leftBtn);
        rowContainer.appendChild(seriesRow);
        rowContainer.appendChild(rightBtn);
        resultsContainer.appendChild(rowContainer);

        // Scroll functionality
        leftBtn.addEventListener('click', () => {
          seriesRow.scrollBy({ left: -1100, behavior: 'smooth' });
        });

        rightBtn.addEventListener('click', () => {
          seriesRow.scrollBy({ left: 1100, behavior: 'smooth' });
        });
      }
    }

    // Display the local-featured-series section
    displayLocalFeaturedSeries(seriesData);

  } catch (error) {
    console.error(`Error fetching ${type} series data:`, error);
  }
}




async function displayLocalFeaturedSeries(seriesData) {
  const randomSeries = seriesData[Math.floor(Math.random() * seriesData.length)];
  console.log("Selected series:", randomSeries); // Debugging

  if (!randomSeries || !randomSeries.id) {
    console.error("Error: Series ID is missing or undefined", randomSeries);
    return;
  }

  const fetchedData = await fetchSeriesData(randomSeries.id);
  if (!fetchedData) return;

  // Detect screen size
  const isSmallScreen = window.innerWidth <= 768;

  // Choose image based on screen size
  const backdropUrl = fetchedData.backdrop_path 
    ? `https://image.tmdb.org/t/p/w1280${fetchedData.backdrop_path}` 
    : 'default-backdrop.jpg';

  const posterUrl = fetchedData.poster_path 
    ? `https://image.tmdb.org/t/p/w500${fetchedData.poster_path}` 
    : 'default-poster.jpg';

  const backgroundUrl = isSmallScreen ? posterUrl : backdropUrl;

  const rating = fetchedData.vote_average 
    ? `${Math.round(fetchedData.vote_average * 10)}% Match` 
    : 'N/A';
  const year = fetchedData.first_air_date ? fetchedData.first_air_date.split('-')[0] : 'Unknown Year';
  const language = fetchedData.original_language?.toUpperCase() || 'N/A';
  const genre = randomSeries.type || 'Unknown Genre';
  const description = randomSeries.description || 'No description available';

  const existingSection = document.getElementById('displaylocalfeaturedseries-section');
  if (existingSection) {
    existingSection.remove();
  }

  const featuredSection = document.createElement('div');
  featuredSection.id = 'displaylocalfeaturedseries-section';

  featuredSection.innerHTML = `
    <div id="displaylocalfeaturedseries-backdrop" style="background-image: url('${backgroundUrl}');"></div>
    <div id="displaylocalfeaturedseries-gradient"></div>
    <div id="displaylocalfeaturedseries-gradient-left"></div>
    <div id="displaylocalfeaturedseries-gradient-top"></div>

    <div id="displaylocalfeaturedseries-details">
      <div id="displaylocalfeaturedseries-title">${randomSeries.series_name}</div>
      <div id="displaylocalfeaturedseries-meta">
        <span class="displaylocalfeaturedseries-score">${rating}</span>
        <span id="displaylocalfeaturedseries-year-language">${year} <span class="displaylocalfeaturedseries-language-tag">${language}</span></span>
        <p id="displaylocalfeaturedseries-hd-tag">HD</p>
        <p id="displaylocalfeaturedseries-age-tag">PG TV</p>
      </div>
  
      <div id="displaylocalfeaturedseries-description">${description}</div>

      <div id="displaylocalfeaturedseries-genres">
        <span class="displaylocalfeaturedseries-genres-label">Genre: </span>
        <span class="displaylocalfeaturedseries-genres-value">${genre}</span>
      </div>
      
      <button id="featured-series-more-info" class="displaylocalfeaturedseries-open-button">
        <i class="fas fa-info-circle"></i> <span>More Info</span>
      </button>
    </div>
  `;

  const arabicResults = document.getElementById('arabic-series-results');
  const turkishResults = document.getElementById('turkish-series-results');
  
  const resultsContainer = arabicResults || turkishResults;
  
  if (resultsContainer) {
    resultsContainer.parentNode.insertBefore(featuredSection, resultsContainer);
  } else {
    document.body.appendChild(featuredSection);
  }
  

  // Add button logic
  const moreInfoButton = document.getElementById("featured-series-more-info");
  if (moreInfoButton) {
    moreInfoButton.addEventListener('click', async function () {
      console.log("Fetching full series data for ID:", randomSeries.id);

      try {
        const fullSeriesResponse = await fetch(`/api/seasons?id=${randomSeries.id}`);
        if (!fullSeriesResponse.ok) throw new Error('Failed to fetch full series data');

        const fullSeriesData = await fullSeriesResponse.json();
        openArabicSeriesModal(fullSeriesData);
      } catch (error) {
        console.error('Error fetching full series data:', error);
      }
    });
  } else {
    console.error("More Info button not found.");
  }
}


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Function to fetch full series details from TMDb
async function fetchSeriesData(seriesId) {
  try {
    if (!seriesId) throw new Error('Invalid series ID');

    const response = await fetch(`/api/tv/${seriesId}`);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Series details fetch failed: ${response.status} - ${errorText}`);
    }

    const seriesData = await response.json();
    return seriesData;
  } catch (error) {
    console.error('Error fetching series details:', error);
    return null;
  }
}

// Function to fetch all seasons & episodes from TMDb
async function fetchSeasonsAndEpisodes(seriesId) {
  try {
    const response = await fetch(`/api/tv/${seriesId}/seasons`);
    if (!response.ok) throw new Error(`Failed to fetch seasons: ${response.status}`);

    const data = await response.json();
    return data; // Returns all seasons with episode details
  } catch (error) {
    console.error(`Error fetching seasons for series ${seriesId}:`, error);
    return [];
  }
}


////////////////////////////////////////////////////////////



// Function to open the Arabic Series modal with full details
async function openArabicSeriesModal(seriesData) {
  const modal = document.getElementById('arabic-series-modal');
  const modalContent = document.querySelector('.ar-modal-content');
  const modalHeader = document.querySelector('.modal-header');
  const backdropElement = document.getElementById('arabic-series-backdrop');
  const trailerContainer = document.getElementById('arabic-series-trailer-container');
  const playButton = document.getElementById('ar-play-continue-btn'); // ✅ Play/Continue Button
   // ✅ Set up Favorite Button
   const arFavoriteButton = document.getElementById('ar-favorite-button');

  if (!modal || !modalContent || !modalHeader || !backdropElement || !trailerContainer) {
    console.error('Modal elements are missing.');
    return;
  }

  const seriesId = seriesData.id;
  const fetchedData = await fetchSeriesData(seriesId);
  if (!fetchedData) return;

  // ✅ Extract backdrop image or fallback
  const backdrop = fetchedData.backdrop_path 
    ? `https://image.tmdb.org/t/p/w1280${fetchedData.backdrop_path}` 
    : 'default-backdrop.jpg';

  // ✅ Ensure videos array exists
  const videos = fetchedData.videos?.results || [];

  // ✅ Prioritize "Trailer", then "Teaser", then first available video
  const trailer = videos.find(video => video.type === 'Trailer' && video.site === 'YouTube') ||
                  videos.find(video => video.type === 'Teaser' && video.site === 'YouTube') ||
                  videos[0]; // Fallback to any video

  // ✅ Autoplay YouTube trailer with no interaction
  const trailerUrl = trailer 
    ? `https://www.youtube.com/embed/${trailer.key}?autoplay=1&mute=1&controls=0&disablekb=1&modestbranding=1&rel=0&playsinline=1`
    : null;

    

  // ✅ Debugging logs to check fetched videos
  console.log("TMDb Videos:", videos);
  console.log("Selected Trailer:", trailerUrl);

  const rating = fetchedData.vote_average
  ? `${Math.round(fetchedData.vote_average * 10)}% Match`
  : 'N/A';
  const year = fetchedData.first_air_date ? fetchedData.first_air_date.split('-')[0] : 'Unknown';
  const language = fetchedData.original_language?.toUpperCase() || 'N/A';
  const totalSeasons = fetchedData.number_of_seasons || 'N/A';

  // ✅ Extract necessary data from arabic_series.json
  const seasons = seriesData.seasons || [];
  const seriesName = seriesData.series_name || 'Unknown Series';
  

  // ✅ Populate modal with combined data
  const titleElement = document.getElementById('arabic-series-title');
  const descriptionElement = document.getElementById('arabic-series-description');
  const genreElement = document.getElementById('arabic-series-genre');
  const detailsElement = document.getElementById('arabic-series-details');

  if (titleElement) titleElement.textContent = seriesName;
  if (descriptionElement) descriptionElement.textContent = seriesData.description || "No description available";
  if (genreElement) {
    genreElement.innerHTML = `
      <span class="ar-genre-label">Genres:</span> 
      <span class="ar-genre-value">${seriesData.type || 'Unknown'}</span>
    `;
  }
  
  if (detailsElement) {
    detailsElement.innerHTML = `
    <span class="ar-rating">${rating}</span>
    <span class="ar-year">${year}</span>
    <span class="ar-language">${language}</span>
    <span class="hd-tag">HD</span> 
    <span class="ar-age-tag">PG TV</span> 
    <span class="ar-seasons">${totalSeasons} ${totalSeasons === 1 ? 'Season' : 'Seasons'}</span>
    `;
  }
// ✅ Set Trailer in Modal
if (trailerUrl) {
  trailerContainer.innerHTML = `
      <div class="plyr__video-embed" id="ar-player" style="opacity: 0; transition: opacity 0.5s ease;"> 
          <iframe src="${trailerUrl}" allow="autoplay; encrypted-media" allowfullscreen></iframe>
      </div>
      <button id="ar-mute-button" class="ar-mute-button" style="opacity: 0; transition: opacity 0.5s ease;">
          <i id="ar-mute-icon" class="fa fa-volume-up"></i> 
      </button>
  `;

  const trailerContainerDiv = document.getElementById("ar-player");
  const muteButton = document.getElementById("ar-mute-button");

  // ✅ Initialize Plyr instance
  currentPlayer = new Plyr('#ar-player', {
     controls: [],
     autoplay: true,
     muted: false,
     loop: { active: false },
     fullscreen: false,
     clickToPlay: false, // Prevent pausing by click
     disableContextMenu: true, // Disable right-click context menu
     cc_load_policy: 0,
  });

  

  // ✅ Listen for Plyr "playing" event (Ensures the video is actually playing)
  currentPlayer.on('playing', () => {
    trailerContainerDiv.style.opacity = "1"; // Show video once it's playing
    muteButton.style.opacity = "1"; // Show mute button
  });


    // ✅ Remove video when it finishes playing
    currentPlayer.on('ended', () => {
      console.log("Trailer finished playing. Removing video...");
      trailerContainer.innerHTML = `<div class="poster-placeholder" style="background-image: url('${backdrop}');"></div>`;
    });

  // ✅ Mute Button Functionality
  const muteIcon = document.getElementById("ar-mute-icon");
  muteButton.addEventListener("click", function () {
    if (currentPlayer.muted) {
      currentPlayer.muted = false;
      muteIcon.classList.remove("fa-volume-mute");
      muteIcon.classList.add("fa-volume-up");
    } else {
      currentPlayer.muted = true;
      muteIcon.classList.remove("fa-volume-up");
      muteIcon.classList.add("fa-volume-mute");
    }
  });
} else {
  trailerContainer.innerHTML = `<div class="poster-placeholder" style="background-image: url('${backdrop}');"></div>`;
}


  // ✅ Set Backdrop
  backdropElement.style.backgroundImage = `url('${backdrop}')`;
  backdropElement.style.backgroundSize = 'cover';
  backdropElement.style.backgroundPosition = 'center';
  backdropElement.style.position = 'relative';
  const seasonContainer = document.getElementById('arabic-series-seasons');
  seasonContainer.innerHTML = ''; // Clear previous seasons


// ✅ Select existing elements
const seasonDropdown = document.getElementById('arabic-series-season-dropdown');
const dropdownArrow = document.getElementById('ar-dropdown-arrow');

// ✅ Populate Dropdown Options
seasonDropdown.innerHTML = seasons.map(season => {
  const displayNumber = season.real_season_number ?? season.season_number; // ✅ Use real_season_number if available
  return `<option value="${season.season_number}">Season ${displayNumber}</option>`;
}).join('');




  // ✅ Create Episode Container
  let episodeContainer = document.getElementById('arabic-series-episodes');
  if (!episodeContainer) {
    episodeContainer = document.createElement('div');
    episodeContainer.id = 'arabic-series-episodes';
    seasonContainer.appendChild(episodeContainer);
  }

// ✅ Function to Update Episodes
const updateEpisodes = async (seasonNumber) => {
  const episodeContainer = document.getElementById('arabic-series-episodes');

  // ✅ Fully clear previous episodes
  episodeContainer.innerHTML = ''; 

  const selectedSeason = seasons.find(s => s.season_number === seasonNumber);
  if (selectedSeason) {
      const seasonList = await createSeasonList(seasons, seriesData.id, seriesData.series_name, fetchedData, selectedSeason);
      
      // ✅ Ensure only one season list is displayed at a time
      episodeContainer.innerHTML = ''; 
      episodeContainer.appendChild(seasonList);
  }
};


  // ✅ Load First Season's Episodes
  if (seasons.length > 0) {
    updateEpisodes(seasons[0].season_number);
  }


  // ✅ Dropdown Change Listener (Fix for not updating properly)
seasonDropdown.addEventListener('change', (event) => {
  const selectedSeasonNumber = parseInt(event.target.value);
  updateEpisodes(selectedSeasonNumber);
});

  
  let isDropdownOpen = false; // ✅ Track dropdown state

  // ✅ Toggle arrow when clicking the dropdown
  seasonDropdown.addEventListener('click', () => {
    isDropdownOpen = !isDropdownOpen;
    dropdownArrow.style.transform = isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)';
  });
  
  // ✅ Reset arrow when selecting an option
  seasonDropdown.addEventListener('change', () => {
    isDropdownOpen = false;
    dropdownArrow.style.transform = 'rotate(0deg)';
  });
  
  // ✅ Detect when clicking outside to reset arrow
  document.addEventListener('click', (event) => {
    if (!seasonDropdown.contains(event.target) && !dropdownArrow.contains(event.target)) {
      isDropdownOpen = false;
      dropdownArrow.style.transform = 'rotate(0deg)';
    }
  });

  fetchLastWatchedArabic(seriesData.id, seasons).then(lastWatched => {
    const playButton = document.getElementById("ar-play-continue-btn");
  
    if (!playButton) return;
  
    if (lastWatched && lastWatched.episodeUrl) {
      playButton.textContent = "▶ Continue";
      playButton.style.display = "block";
      playButton.onclick = () => {
        removeTrailer(); // ✅ Ensure trailer is removed before playing
        playEpisode(seriesData.id, lastWatched.seasonNumber, `Episode ${lastWatched.episodeNumber}`, lastWatched.episodeUrl, seasons);
      };
    } else {
      console.warn("⚠️ No watched episodes found. Defaulting to Season 1, Episode 1.");
      
      // ✅ Ensure `seasons` is not empty
      if (Array.isArray(seasons) && seasons.length > 0 && seasons[0].episodes?.length > 0) {
        playButton.textContent = "▶ Play";
        playButton.style.display = "block";
        playButton.onclick = () => {
          removeTrailer(); // ✅ Ensure trailer is removed before playing
          playEpisode(seriesData.id, seasons[0].season_number, `Episode 1`, seasons[0].episodes[0].url, seasons);
        };
      } else {
        console.error("❌ Error: No seasons or episodes found. Cannot set Play button.");
        playButton.style.display = "none"; // Hide button if data is missing
      }
    }
  });
  

  // ✅ Event listener for the Favorite Button
arFavoriteButton.onclick = function() {
  // Add to the user's favorites (add it to the list)
  toggleArabicTurkishFavorite(seriesData.id); // Use seriesData instead of series
};


  modal.style.display = 'block';

  document.body.classList.add("modal-open"); // Disable background scrolling

   // Add event listener only while the modal is open
   document.addEventListener("click", closeArabicModalHandler);
}


// Function to handle closing when clicking the close button
function closeArabicModalHandler(event) {
  if (event.target.classList.contains("ar-close-btn")) {
      closeArabicSeriesModal();
  }
}

// ✅ Function to create season list with updated episode details
async function createSeasonList(seasons, seriesId, seriesName, fetchedData, selectedSeason) {
  const seasonList = document.createElement("ul");
  seasonList.id = "season-list";
  seasonList.style.padding = "0";  
  seasonList.style.margin = "0";   
  seasonList.style.width = "100%"; 

  // ✅ Remove any lingering episode lists before adding new ones
  document.querySelectorAll(".ar-episode-list").forEach(list => list.remove());

  // ✅ Ensure there's only **one** episode list in the DOM
  const existingEpisodeContainer = document.getElementById("episode-list-container");
  if (existingEpisodeContainer) {
    existingEpisodeContainer.innerHTML = ""; // Clear previous episodes
  }

  // ✅ Fetch TMDb episodes (Only for image & description)
  const tmdbSeasons = await fetchSeasonsAndEpisodes(seriesId);
  console.log(`🟢 TMDb Data for Series ID ${seriesId}:`, tmdbSeasons);

  // ✅ Fetch watched episodes for this series
  const watchedEpisodes = await fetchWatchedArabicEpisodes(seriesId);

  // ✅ Ensure selectedSeason exists
  if (!selectedSeason) {
    console.warn("⚠️ No selected season found.");
    return;
  }

  const episodeList = document.createElement("ul");
  episodeList.id = `episodes-season-${selectedSeason.season_number}`;
  episodeList.classList.add("ar-episode-list");
  episodeList.style.padding = "0";  
  episodeList.style.margin = "0";   
  episodeList.style.width = "100%"; 

  // ✅ Use real_season_number for TMDb, fallback to season_number if missing
  const tmdbSeasonNumber = selectedSeason.real_season_number ?? selectedSeason.season_number;
  const tmdbSeason = tmdbSeasons.find(s => s.season_number === tmdbSeasonNumber);
  console.log(`🟡 TMDb Data for Season ${tmdbSeasonNumber}:`, tmdbSeason);

  for (const episode of selectedSeason.episodes || []) {
    const episodeNumberMatch = episode.title.match(/\d+/);
    const episodeNumber = episodeNumberMatch ? parseInt(episodeNumberMatch[0]) : 0;

    // ✅ Find TMDb episode data (ONLY for image & description, per episode)
    const tmdbEpisode = tmdbSeason?.episodes?.find(ep => ep.episode_number === episodeNumber);
    console.log(`🔵 TMDb Data for Episode ${episodeNumber} in Season ${tmdbSeasonNumber}:`, tmdbEpisode);

    let episodeImage = "default-episode-poster.png"; 
    if (tmdbEpisode?.still_path) {
      episodeImage = `https://image.tmdb.org/t/p/w780${tmdbEpisode.still_path}`;
    } else if (fetchedData?.backdrop_path) {
      episodeImage = `https://image.tmdb.org/t/p/w780${fetchedData.backdrop_path}`;
    } else if (episode.info.poster) {
      episodeImage = episode.info.poster;
    }

    let episodeDescription = episode.info.story || "No description available";
    if (tmdbEpisode?.overview) {
      const arabicDescription = tmdbEpisode.overview.split("\n").find(line => /[\u0600-\u06FF]/.test(line));
      episodeDescription = arabicDescription || tmdbEpisode.overview || episode.info.story;
    }

    let runtimeElement = "";
    if (tmdbEpisode?.runtime) {
      runtimeElement = `<p class="ar-episode-runtime">${tmdbEpisode.runtime}m</p>`;
    }

    const episodeItem = document.createElement("li");
    episodeItem.classList.add("ar-episode-item");

    if (watchedEpisodes.some(ep => ep.episodeNumber === episodeNumber && ep.seasonNumber === selectedSeason.season_number)) {
      episodeItem.classList.add("watched");
    }

    episodeItem.addEventListener("click", async (event) => {
      event.stopPropagation(); 
      removeTrailer(); 

      if (!episodeNumber) {
        console.error("❌ Could not extract episode number from:", episode.title);
        return;
      }

      await markArabicEpisodeWatched(seriesId, selectedSeason.season_number, episodeNumber);
      episodeItem.classList.add("watched");

      // ✅ Update Last Watched Text Immediately
      const lastWatchedText = document.getElementById("last-watched-arabic");
      if (lastWatchedText) {
        const displaySeason = selectedSeason.real_season_number ?? selectedSeason.season_number;
        lastWatchedText.textContent = `Last Watched: Season ${displaySeason} Episode ${episodeNumber}`;
        lastWatchedText.style.opacity = "1";
      }

      // ✅ Update "Continue" Button Dynamically
      const playButton = document.getElementById("ar-play-continue-btn");
      if (playButton) {
        playButton.textContent = "▶ Continue";
        playButton.onclick = () => {
          playEpisode(seriesId, selectedSeason.season_number, episode.title, episode.url, seasons);
        };
      }

      playEpisode(seriesId, selectedSeason.season_number, episode.title, episode.url, seasons);
    });

    episodeItem.innerHTML = `
      <div class="ar-episode-image">
        <img src="${episodeImage}" alt="${episode.title || "Untitled Episode"}">
        <div class="ar-play-icon">
          <i class="fa fa-play"></i>
        </div>
      </div>
      <div class="ar-episode-info">
        <h4>${episode.title || "Untitled Episode"} (Ep ${episodeNumber})</h4>
        <p class="ar-episode-description">${episodeDescription}</p>
        ${runtimeElement}
      </div>
    `;

    episodeList.appendChild(episodeItem);
  }

  // ✅ Ensure only one season's episodes are displayed
  if (existingEpisodeContainer) {
    existingEpisodeContainer.innerHTML = ""; // Clear previous episodes
    existingEpisodeContainer.appendChild(episodeList);
  } else {
    seasonList.appendChild(episodeList);
  }

  return seasonList;
}



// Function to Remove Trailer from Arabic-Series-Modal //
function removeTrailer() {
  const trailerContainer = document.getElementById('arabic-series-trailer-container');
  if (trailerContainer) {
    trailerContainer.innerHTML = ''; // ✅ Clears the trailer from the modal
  }
}

// ✅ Helper Function to save Watched Arabic Series to MongoDB
async function markArabicEpisodeWatched(seriesId, seasonNumber, episodeNumber) {
  try {
    const response = await fetch('/api/user/watched', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        seriesId, 
        seasonNumber, 
        episodeNumber  
      })
    });

    const data = await response.json(); // ✅ Log server response for debugging

    if (!response.ok) {
      console.error(`❌ Failed to save watched episode: S${seasonNumber}E${episodeNumber}`, data);
      return false;  // ❌ Return false to indicate failure
    }

    console.log(`✅ Marked Arabic episode as watched in DB: S${seasonNumber}E${episodeNumber}`, data);

    // ✅ Force refresh to ensure the watched episode persists
    await fetchWatchedArabicEpisodes(seriesId);
    return true;  // ✅ Return true if successfully saved
  } catch (error) {
    console.error('❌ Error marking Arabic episode as watched:', error);
    return false;  // ❌ Return false on error
  }
}

// ✅ Fetch Watched Episodes for Arabic Series
async function fetchWatchedArabicEpisodes(seriesId) {
  try {
    const response = await fetch(`/api/user/watched/${seriesId}`);
    if (!response.ok) throw new Error("Failed to fetch watched episodes");

    const watchedEpisodes = await response.json();
    console.log("🟢 Watched Episodes Fetched:", watchedEpisodes); // ✅ Debugging log

    return watchedEpisodes;
  } catch (error) {
    console.error("❌ Error fetching watched episodes:", error);
    return [];
  }
}

// ✅ Fetch Last Watched Arabic Episode (Now Uses Only `season_number` for MongoDB Consistency)
async function fetchLastWatchedArabic(seriesId, seasons) {
  try {
    const response = await fetch(`/api/user/last-watched/${seriesId}`);
    if (!response.ok) throw new Error("Failed to fetch last watched episode");

    const lastWatched = await response.json();
    const lastWatchedText = document.getElementById("last-watched-arabic");

    lastWatchedText.style.display = "block"; // Keep layout consistent

    // ✅ If no watched data, clear text and set opacity to 0
    if (!lastWatched || !lastWatched.seasonNumber || !lastWatched.episodeNumber) {
      console.warn("⚠️ No last watched data found, clearing UI.");
      lastWatchedText.textContent = "";
      lastWatchedText.style.opacity = "0";
      return null;
    }

    console.log("🔍 Last Watched Data:", lastWatched);

    // ✅ Find the correct season using `season_number` (as stored in MongoDB)
    const matchedSeason = seasons.find(season => season.season_number === lastWatched.seasonNumber);

    if (!matchedSeason) {
      console.warn("⚠️ Last watched season not found in available seasons.", {
        lastWatchedSeason: lastWatched.seasonNumber,
        availableSeasons: seasons.map(s => ({
          season_number: s.season_number,
          real_season_number: s.real_season_number
        }))
      });

      // Clear UI if no match found
      lastWatchedText.textContent = "";
      lastWatchedText.style.opacity = "0";
      return null;
    }

    console.log("✅ Matched Last Watched Season:", matchedSeason);

    // ✅ Find the correct episode within that season
    const matchedEpisode = matchedSeason.episodes.find(ep => {
      const epNumberMatch = ep.title.match(/\d+/);
      return epNumberMatch && parseInt(epNumberMatch[0]) === lastWatched.episodeNumber;
    });

    if (!matchedEpisode) {
      console.warn("⚠️ Last watched episode not found in season.");
      lastWatchedText.textContent = "";
      lastWatchedText.style.opacity = "0";
      return null;
    }

    // ✅ Attach the found episode URL to lastWatched
    lastWatched.episodeUrl = matchedEpisode.url;

    // ✅ Update UI with last watched season & episode
    const displaySeason = matchedSeason.real_season_number ?? matchedSeason.season_number;
    lastWatchedText.textContent = `Last Watched: Season ${displaySeason} Episode ${lastWatched.episodeNumber}`;
    lastWatchedText.style.opacity = "1";

    console.log(`✅ Updated last watched Arabic: S${matchedSeason.season_number}E${lastWatched.episodeNumber}`);
    
    return lastWatched; // ✅ Return the enriched object including episode URL

  } catch (error) {
    console.error("❌ Error fetching last watched Arabic episode:", error);
    return null;
  }
}


///////////////////////////////////////////////////////////

// Function to close the Arabic Series modal and remove trailer
function closeArabicSeriesModal() {
  console.log("Close button clicked - Hiding Arabic Series modal");

  const modal = document.getElementById('arabic-series-modal');
  const trailerContainer = document.getElementById('arabic-series-trailer-container');

  if (modal) {
    modal.style.display = 'none'; // Hide modal
    
    document.body.classList.remove("modal-open"); // Re-enable scrolling

    // ✅ Remove trailer to stop audio
    if (trailerContainer) {
      trailerContainer.innerHTML = `<div class="poster-placeholder"></div>`;
      console.log("✅ Trailer removed!");
    }
     // ✅ Remove the event listener after modal closes
     document.removeEventListener("click", closeArabicModalHandler);
     console.log("✅ Event listener removed!");
     
  } else {
    console.error('❌ Arabic Series modal not found in DOM!');
  }
}

async function refreshWatchedEpisodes(seriesId, seasonNumber, seasons) {
  if (!Array.isArray(seasons) || seasons.length === 0) {
    console.error("❌ Error: 'seasons' is missing when calling refreshWatchedEpisodes.");
    return;
  }

  const watchedEpisodes = await fetchWatchedArabicEpisodes(seriesId);

  // ✅ Always use `season_number` when tracking watched episodes
  const correctSeasonNumber = seasonNumber;
  const episodeList = document.getElementById(`episodes-season-${correctSeasonNumber}`);

  if (!episodeList) return;

  episodeList.querySelectorAll(".ar-episode-item").forEach(item => {
    const episodeTitleElement = item.querySelector("h4");
    if (!episodeTitleElement) return;

    const episodeNumberMatch = episodeTitleElement.textContent.match(/\d+/);
    const episodeNumber = episodeNumberMatch ? parseInt(episodeNumberMatch[0]) : null;

    if (watchedEpisodes.some(ep => ep.episodeNumber === episodeNumber && ep.seasonNumber === correctSeasonNumber)) {
      item.classList.add("watched");
    }
  });

  // ✅ Fetch last watched episode & update "Play/Continue" button dynamically
  const lastWatched = await fetchLastWatchedArabic(seriesId, seasons);
  if (lastWatched) {
    const playButton = document.getElementById("ar-play-continue-btn");
    if (playButton) {
      playButton.textContent = "▶ Continue";
      playButton.onclick = () => {
        playEpisode(seriesId, lastWatched.seasonNumber, `Episode ${lastWatched.episodeNumber}`, lastWatched.episodeUrl, seasons);
      };
    }
  }
}


async function setupArabicNextEpisodeButton(seriesId, seasonNumber, episodeTitle, seasons) {
  console.log("📌 Setting up Next Episode Button...");

  if (!Array.isArray(seasons) || seasons.length === 0) {
    console.warn("⚠️ Seasons data is missing or not an array!", seasons);
    return;
  }

  const nextEpisodeBtn = document.getElementById("arabic-next-episode");
  if (!nextEpisodeBtn) {
    console.warn("⚠️ Next Episode button not found.");
    return;
  }

  if (!seriesId || typeof seriesId !== "string") {
    console.error(`❌ Invalid seriesId detected: ${seriesId}`);
    return;
  }

  // ✅ Find the correct season using both `season_number` and `real_season_number`
  const currentSeasonIndex = seasons.findIndex(season =>
    season.season_number === seasonNumber || season.real_season_number === seasonNumber
  );

  if (currentSeasonIndex === -1) {
    console.warn(`⚠️ Could not find season ${seasonNumber}`, {
      requestedSeason: seasonNumber,
      availableSeasons: seasons.map(s => ({
        season_number: s.season_number,
        real_season_number: s.real_season_number
      }))
    });
    return;
  }

  const currentSeason = seasons[currentSeasonIndex];
  console.log(`📌 Found current season: ${currentSeason.season_number} (Real: ${currentSeason.real_season_number ?? "N/A"})`);

  const episodeNumberMatch = episodeTitle.match(/\d+/);
  const currentEpisodeNumber = episodeNumberMatch ? parseInt(episodeNumberMatch[0]) : 0;

  if (!currentEpisodeNumber) {
    console.warn(`⚠️ Could not extract episode number from title: "${episodeTitle}"`);
    return;
  }

  console.log(`📌 Current Episode Number: ${currentEpisodeNumber}`);

  // ✅ Find Next Episode in the Same Season
  const sortedEpisodes = currentSeason.episodes
    .map(ep => ({ title: ep.title, url: ep.url, number: parseInt(ep.title.match(/\d+/)?.[0]) }))
    .filter(ep => !isNaN(ep.number))
    .sort((a, b) => a.number - b.number); // ✅ Ensure correct order

  const nextEpisode = sortedEpisodes.find(ep => ep.number === currentEpisodeNumber + 1);

  if (nextEpisode) {
    console.log(`✅ Next Episode Found: ${nextEpisode.title}`);

    nextEpisodeBtn.onclick = async () => {
      console.log(`🎬 Playing Next: ${nextEpisode.title} (S${currentSeason.season_number})`);

      const success = await markArabicEpisodeWatched(seriesId, currentSeason.season_number, nextEpisode.number);

      if (success) {
        refreshWatchedEpisodes(seriesId, currentSeason.season_number, seasons);

        // ✅ Update Last Watched UI
        const lastWatchedText = document.getElementById("last-watched-arabic");
        if (lastWatchedText) {
          lastWatchedText.textContent = `Last Watched: Season ${currentSeason.season_number} Episode ${nextEpisode.number}`;
          lastWatchedText.style.opacity = "1";
        }

        // ✅ UPDATE THE CONTINUE BUTTON IMMEDIATELY
        const playButton = document.getElementById("ar-play-continue-btn");
        if (playButton) {
          playButton.textContent = "▶ Continue";
          playButton.onclick = () => {
            playEpisode(seriesId, currentSeason.season_number, nextEpisode.title, nextEpisode.url, seasons);
          };
        }
      }

      playEpisode(seriesId, currentSeason.season_number, nextEpisode.title, nextEpisode.url, seasons);
    };
    return;
  }

  // ✅ If No More Episodes in the Current Season, Move to the Next Season
  console.log(`🔸 End of Season ${currentSeason.season_number}, checking next season...`);

  const nextSeason = seasons[currentSeasonIndex + 1];
  if (nextSeason && nextSeason.episodes.length > 0) {
    // ✅ Sort episodes numerically and pick the first one
    const sortedNextSeasonEpisodes = nextSeason.episodes
      .map(ep => ({ title: ep.title, url: ep.url, number: parseInt(ep.title.match(/\d+/)?.[0]) }))
      .filter(ep => !isNaN(ep.number))
      .sort((a, b) => a.number - b.number);

    const firstEpisode = sortedNextSeasonEpisodes[0]; // ✅ Get the correct first episode

    if (firstEpisode) {
      console.log(`✅ Transitioning to Season ${nextSeason.season_number}, Episode ${firstEpisode.number}`);

      nextEpisodeBtn.onclick = async () => {
        console.log(`🎬 Playing Next: ${firstEpisode.title} (S${nextSeason.season_number})`);

        const success = await markArabicEpisodeWatched(seriesId, nextSeason.season_number, firstEpisode.number);

        if (success) {
          refreshWatchedEpisodes(seriesId, nextSeason.season_number, seasons);

          // ✅ Update Last Watched UI
          const lastWatchedText = document.getElementById("last-watched-arabic");
          if (lastWatchedText) {
            lastWatchedText.textContent = `Last Watched: Season ${nextSeason.season_number} Episode ${firstEpisode.number}`;
            lastWatchedText.style.opacity = "1";
          }

          // ✅ UPDATE THE CONTINUE BUTTON IMMEDIATELY
          const playButton = document.getElementById("ar-play-continue-btn");
          if (playButton) {
            playButton.textContent = "▶ Continue";
            playButton.onclick = () => {
              playEpisode(seriesId, nextSeason.season_number, firstEpisode.title, firstEpisode.url, seasons);
            };
          }
        }

        playEpisode(seriesId, nextSeason.season_number, firstEpisode.title, firstEpisode.url, seasons);
      };
    } else {
      console.log("🏁 No valid first episode found in the next season.");
      nextEpisodeBtn.style.display = "none";
    }
  } else {
    console.log("🏁 No more seasons available.");
    nextEpisodeBtn.style.display = "none"; // Hide button when no next episode exists
  }
}


async function playEpisode(seriesId, seasonNumber, episodeTitle, episodeUrl, seasons) {
  try {
    console.log(`🎬 Playing Episode: ${episodeTitle} | URL: ${episodeUrl}`);

    const encodedEpisodeUrl = encodeURIComponent(episodeUrl);
    const url = `https://www.cimaway.com/episode_api/get_watch_server?episode_url=${encodedEpisodeUrl}`;
    console.log(`📡 Requesting Watch Server: ${url}`);

    const response = await fetch(url);
    if (!response.ok) throw new Error("Network response was not ok");

    const data = await response.json();
    if (data.error || !data.watch_server) {
      console.error("❌ Watch Server Error:", data.error || "URL missing.");
      return;
    }

    const watchServerUrl = data.watch_server;

    // 🎯 PRIORITY: Show the video player FIRST
    const existingOverlay = document.getElementById("fullscreen-overlay");
    if (existingOverlay) existingOverlay.remove();

    const fullscreenOverlay = document.createElement("div");
    fullscreenOverlay.id = "fullscreen-overlay";
    Object.assign(fullscreenOverlay.style, {
      position: "fixed",
      left: "0",
      top: "0",
      width: "100%",
      height: "100%",
      backgroundColor: "rgba(0, 0, 0, 0.9)",
      zIndex: "1000",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden"
    });

    const iframe = document.createElement("iframe");
    iframe.src = watchServerUrl;
    Object.assign(iframe.style, {
      width: "100%",
      height: "100%",
      border: "none"
    });
    iframe.allow = "autoplay; encrypted-media";
    iframe.allowFullscreen = true;
    fullscreenOverlay.appendChild(iframe);

    const closeButton = document.createElement("button");
    closeButton.textContent = "Close";
    Object.assign(closeButton.style, {
      position: "absolute",
      top: "20px",
      right: "20px",
      fontSize: "20px",
      color: "#fff",
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      border: "none",
      padding: "10px",
      cursor: "pointer"
    });
    closeButton.addEventListener("click", () => fullscreenOverlay.remove());
    fullscreenOverlay.appendChild(closeButton);

    const nextEpisodeBtn = document.createElement("button");
    nextEpisodeBtn.id = "arabic-next-episode";
    nextEpisodeBtn.textContent = "▶ Next Episode";
    nextEpisodeBtn.classList.add("ar-next-episode-btn");
    Object.assign(nextEpisodeBtn.style, {
      position: "absolute",
      fontSize: "18px",
      color: "#fff",
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      border: "none",
      padding: "10px",
      cursor: "pointer"
    });
    fullscreenOverlay.appendChild(nextEpisodeBtn);

    document.body.appendChild(fullscreenOverlay);

    // 🧠 Now do the rest in background
    if (!Array.isArray(seasons) || seasons.length === 0) {
      console.error("❌ Error: 'seasons' is missing when calling playEpisode.");
      return;
    }

    const currentSeason = seasons.find(season => season.season_number === seasonNumber);
    if (!currentSeason) {
      console.warn(`⚠️ Could not find season ${seasonNumber}`);
      return;
    }

    const correctSeasonNumber = currentSeason.season_number;
    console.log(`✅ Found Correct Season: ${correctSeasonNumber}`);

    const episodeNumberMatch = episodeTitle.match(/\d+/);
    const episodeNumber = episodeNumberMatch ? parseInt(episodeNumberMatch[0]) : null;

    if (episodeNumber) {
      console.log(`📌 Marking Episode as Watched: S${correctSeasonNumber}E${episodeNumber}`);
      const success = await markArabicEpisodeWatched(seriesId, correctSeasonNumber, episodeNumber);

      if (success) {
        console.log(`✅ Marked as Watched`);

        const lastWatchedText = document.getElementById("last-watched-arabic");
        if (lastWatchedText) {
          const displaySeason = currentSeason.real_season_number ?? currentSeason.season_number;
          lastWatchedText.textContent = `Last Watched: Season ${displaySeason} Episode ${episodeNumber}`;
          lastWatchedText.style.opacity = "1";
        }

        refreshWatchedEpisodes(seriesId, correctSeasonNumber, seasons);
      } else {
        console.warn(`⚠️ Failed to mark watched`);
      }
    } else {
      console.warn(`⚠️ Could not extract episode number`);
    }

    setupArabicNextEpisodeButton(seriesId, correctSeasonNumber, episodeTitle, seasons);

  } catch (error) {
    console.error("❌ Error fetching episode URL:", error);
  }
}


// Initial call to fetch and display Arabic series
displayArabicSeriesList();

/////////////////////////////////////////////////////////////// arabic movies ////////////////////////////////////////////////////////////////////

// Function to fetch and log movie URL
async function fetchMovieUrl(movieTitle, movieUrl) {
  try {
    const encodedMovieTitle = encodeURIComponent(movieTitle);
    const encodedMovieUrl = encodeURIComponent(movieUrl);
    const url = `http://127.0.0.1:5001/get_watch_server?movie_name=${encodedMovieTitle}&url=${encodedMovieUrl}`;

    console.log(`Request URL: ${url}`); // Debugging

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    console.log(data);

    // Handle movie watch URL if needed
    if (data.watch_server_url) {
      console.log('Watch server URL:', data.watch_server_url);
      // Further processing here
    }
  } catch (error) {
    console.error('Error fetching movie URL:', error);
  }
}

// Function to display the list of Arabic movies
async function displayArabicMoviesList() {
  try {
    const response = await fetch('api/arabic-movies/random');
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const moviesData = await response.json();
    const container = document.getElementById('arabic-movies');
    container.innerHTML = ''; // Clear existing content

    if (Array.isArray(moviesData)) { // Handle array of movies
      moviesData.forEach(movie => {
        const movieId = movie.id; // Extract TMDB ID from the root
        const moviePoster = movie.info.poster || 'default-poster.jpg'; // Example poster
        const movieTitle = movie.movie_name || 'Unknown Movie';

        const movieElement = document.createElement('div');
        movieElement.classList.add('movie-item');
        movieElement.innerHTML = `
          <img src="${moviePoster}" alt="${movieTitle}" class="arabic-movie-poster" style="cursor: pointer;">
        `;

        // Pass the correct TMDB ID to openModal
        movieElement.addEventListener('click', () => openModalFromTMDB(movie.id)); // Use movie.id here

        container.appendChild(movieElement);
      });
    } else {
      console.error('Invalid movie data format.');
    }
  } catch (error) {
    console.error('Error fetching Arabic movies data:', error);
  }
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// Function to display the full Arabic movie list without sections
async function displayFullArabicMoviesList() {
  try {
    const response = await fetch('api/arabic-movies/view-more');
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const moviesData = await response.json();

    // Hide all homepage sections including Arabic movies and featured movie
    document.querySelectorAll('.movie-section').forEach(section => {
      section.style.display = 'none';
    });

    // Specifically hide the featured movie section
    const featuredMovieSection = document.getElementById('featured-movie-section');
    if (featuredMovieSection) {
      featuredMovieSection.style.display = 'none';
    }

    // 🔴 Hide Turkish Series Results if it exists
    const turkishSeriesResults = document.getElementById('turkish-series-results');
    if (turkishSeriesResults) {
      turkishSeriesResults.style.display = 'none';
    }

    // 🔴 Hide Arabic Series Results if it exists
    const arabicSeriesResults = document.getElementById('arabic-series-results');
    if (arabicSeriesResults) {
      arabicSeriesResults.style.display = 'none';
    }

    // 🔴 Hide Local Featured Series Section
    const localFeaturedSeriesSection = document.getElementById('displaylocalfeaturedseries-section');
    if (localFeaturedSeriesSection) {
      localFeaturedSeriesSection.style.display = 'none';
    }

    
    // 🔴 Hide search Results Container if it exists
    const searchResultsContainer = document.querySelector('#search-results');
    if (searchResultsContainer) {
      searchResultsContainer.style.display = 'none';
    }
    

    // 🔴 Hide More Results Container if it exists
const moreResultsContainer = document.querySelector('.more-results-container');
if (moreResultsContainer) {
  moreResultsContainer.style.display = 'none';
}


        // Hide My list containers
        const myListContainers = document.getElementById("mylist-container");
        if (myListContainers) myListContainers.style.display = "none";
        
        


    // Remove any previous results container if it exists
    let resultsContainer = document.getElementById('arabic-movies-results');
    if (resultsContainer) {
      resultsContainer.remove();
    }

    // Create a new container for the movie list
    resultsContainer = document.createElement('div');
    resultsContainer.id = 'arabic-movies-results';
    resultsContainer.classList.add('movies-results');

    // Append it to the body or main content area
    document.body.appendChild(resultsContainer);

    // Load 8 rows with 10 items each (total 80 results)
    let currentIndex = 0;
    const totalResults = Math.min(80, moviesData.length); // Load up to 80 items

    for (let rowIndex = 0; rowIndex < 8; rowIndex++) {
      if (currentIndex >= totalResults) break; // Stop if no more movies

      // Create a container for each row with scroll buttons
      const rowContainer = document.createElement('div');
      rowContainer.classList.add('movie-container');

      // Left scroll button
      const leftBtn = document.createElement('button');
      leftBtn.classList.add('scroll-btn', 'left-btn');
      leftBtn.innerHTML = '&lt;';

      // Row for movie items
      const movieRow = document.createElement('div');
      movieRow.classList.add('movie-row');
      movieRow.id = `arabic-movie-row-${rowIndex}`;

      // Right scroll button
      const rightBtn = document.createElement('button');
      rightBtn.classList.add('scroll-btn', 'right-btn');
      rightBtn.innerHTML = '&gt;';

      // Append buttons and row container
      rowContainer.appendChild(leftBtn);
      rowContainer.appendChild(movieRow);
      rowContainer.appendChild(rightBtn);
      resultsContainer.appendChild(rowContainer);

      let rowHasMovies = false;

      // Populate row with 10 movies
      for (let i = 0; i < 10 && currentIndex < totalResults; i++) {
        const movie = moviesData[currentIndex];
        const moviePoster = movie.info.poster || 'default-poster.jpg';

        const movieElement = document.createElement('div');
        movieElement.classList.add('movie-item', 'movie-card');
        movieElement.innerHTML = `<img src="${moviePoster}" alt="Movie Poster" style="cursor: pointer;">`;

        movieElement.addEventListener('click', () => openModalFromTMDB(movie.id));
        movieRow.appendChild(movieElement);

        currentIndex++;
        rowHasMovies = true;
      }

      // If the row has no movies, remove it
      if (!rowHasMovies) {
        rowContainer.style.display = 'none';
      }

      // Scroll functionality
      leftBtn.addEventListener('click', () => {
        movieRow.scrollBy({ left: -1100, behavior: 'smooth' });
      });

      rightBtn.addEventListener('click', () => {
        movieRow.scrollBy({ left: 1100, behavior: 'smooth' });
      });
    }

    // Display the local-featured-movie section
    displayLocalFeaturedMovie(moviesData);

  } catch (error) {
    console.error('Error fetching Arabic movie data:', error);
  }
}



// Function to fetch movie data from TMDB API by movie ID
async function fetchMovieData(movieId) {
  try {
    const response = await fetch(`/api/movie/${movieId}`);
    const movieData = await response.json();

    // Log the fetched data to the console
    console.log("Fetched movie data:", movieData);

    return movieData;
  } catch (error) {
    console.error('Error fetching movie data from TMDB:', error);
    return null;
  }
}

async function displayLocalFeaturedMovie(moviesData) {
  let selectedMovie;
  let fetchedData;
  let attempts = 0;
  const maxAttempts = moviesData.length; // Prevent infinite loop if no valid backdrops exist

  // Keep picking a random movie until one with a valid backdrop is found
  while (attempts < maxAttempts) {
    selectedMovie = moviesData[Math.floor(Math.random() * moviesData.length)];
    console.log("Trying movie:", selectedMovie); // Debugging

    if (!selectedMovie || !selectedMovie.id) {
      console.error("Error: Movie ID is missing or undefined", selectedMovie);
      return;
    }

    fetchedData = await fetchMovieData(selectedMovie.id);
    if (fetchedData && (fetchedData.backdrop_path || fetchedData.poster_path)) {
      break; // Valid movie found
    }

    attempts++;
  }

  // Fallback to default backdrop and poster if no valid movie was found
  const backdropUrl = fetchedData && fetchedData.backdrop_path 
    ? `https://image.tmdb.org/t/p/w1280${fetchedData.backdrop_path}` 
    : 'default-backdrop.jpg';

  const posterUrl = fetchedData && fetchedData.poster_path 
    ? `https://image.tmdb.org/t/p/w500${fetchedData.poster_path}` 
    : 'default-poster.jpg';

  // Detect screen size
  const isSmallScreen = window.innerWidth <= 768;

  // Choose image based on screen size
  const backgroundUrl = isSmallScreen ? posterUrl : backdropUrl;

  const rating = fetchedData.vote_average 
    ? `${Math.round(fetchedData.vote_average * 10)}% Match` 
    : 'N/A';
  const year = fetchedData.release_date ? fetchedData.release_date.split('-')[0] : 'Unknown Year';
  const language = fetchedData.original_language?.toUpperCase() || 'N/A';
  const genre = selectedMovie.info.type || 'Unknown Genre';
  const description = selectedMovie.info.story || 'No description available';

  const existingSection = document.getElementById('displaylocalfeaturedmovie-section');
  if (existingSection) {
    existingSection.remove();
  }

  // Remove the year (whether in parentheses or standalone) and "مشاهدة فيلم" from the movie title
  const movieTitle = selectedMovie.movie_name
    .replace(/\s?\(\d{4}\)$/, '')  // Remove year in parentheses (e.g. (2024))
    .replace(/\s?\d{4}$/, '')      // Remove standalone year (e.g. 2024)
    .replace('مشاهدة فيلم', '');    // Remove "مشاهدة فيلم" phrase

  const featuredSection = document.createElement('div');
  featuredSection.id = 'displaylocalfeaturedmovie-section';

  featuredSection.innerHTML = `
    <div id="displaylocalfeaturedmovie-backdrop" style="background-image: url('${backgroundUrl}');"></div>
    <div id="displaylocalfeaturedmovie-gradient"></div>
    <div id="displaylocalfeaturedmovie-gradient-left"></div>
    <div id="displaylocalfeaturedmovie-gradient-top"></div>

    <div id="displaylocalfeaturedmovie-details">
      <div id="displaylocalfeaturedmovie-title">${movieTitle}</div>
      <div id="displaylocalfeaturedmovie-meta">
        <span class="displaylocalfeaturedmovie-score">${rating}</span>
        <span id="displaylocalfeaturedmovie-year-language">${year} <span class="displaylocalfeaturedmovie-language-tag">${language}</span></span>
        <p id="displaylocalfeaturedmovie-hd-tag">HD</p>
        <p id="displaylocalfeaturedmovie-age-tag">PG</p>
      </div>

      <div id="displaylocalfeaturedmovie-description">${description}</div>

      <div id="displaylocalfeaturedmovie-genres">
        <span class="displaylocalfeaturedmovie-genres-label">Genre: </span>
        <span class="displaylocalfeaturedmovie-genres-value">${genre}</span>
      </div>
      
      <button id="featured-movie-more-info" class="displaylocalfeaturedmovie-open-button">
        <i class="fas fa-info-circle"></i> <span>More Info</span>
      </button>
    </div>
  `;

  const resultsContainer = document.getElementById('arabic-movies-results');
  if (resultsContainer) {
    resultsContainer.parentNode.insertBefore(featuredSection, resultsContainer);
  } else {
    document.body.appendChild(featuredSection);
  }

  // Ensure button exists before adding event listener
  const moreInfoButton = document.getElementById("featured-movie-more-info");
  if (moreInfoButton) {
    moreInfoButton.addEventListener('click', function () {
      console.log("Opening modal for movie ID:", selectedMovie.id); // Debugging
      openModalFromTMDB(selectedMovie.id);
    });
  } else {
    console.error("More Info button not found.");
  }
}




document.addEventListener('DOMContentLoaded', function() {
  // Add the event listener for the "View All Movies" button
  document.getElementById('ar-movies-viewall').addEventListener('click', function() {
    // Fetch and display the full Arabic movie list
    displayFullArabicMoviesList();  // Call the function to display the full list
    
  });
  
});




// Function to load Arabic Movies page
function loadArabicMoviesPage() {
  displayFullArabicMoviesList();
}

// Add event listener for Arabic Movies button
document.addEventListener("DOMContentLoaded", function () {
  const arabicMoviesBtn = document.getElementById('arabicmovies-text');

  if (arabicMoviesBtn) {
    arabicMoviesBtn.addEventListener('click', loadArabicMoviesPage);
  } else {
    console.error("Arabic Movies button not found in the DOM!");
  }
});



///////////////////////////////////////////////////////////////////////////////////////////////////////////translation////////////////////////////////////////////////
async function openModalFromTMDB(movieId) {
  try {
    // ✅ Fetch TMDb movie data
    const tmdbResponse = await fetch(`/api/movie/${movieId}`);

    if (!tmdbResponse.ok) {
      throw new Error(`Failed to fetch TMDb movie data: ${tmdbResponse.status}`);
    }
    const movieData = await tmdbResponse.json();
    console.log('✅ Movie Data from TMDb:', movieData);

    // ✅ Ensure movieData has genre_ids
    if (!movieData.genre_ids && movieData.genres) {
      movieData.genre_ids = movieData.genres.map(g => g.id);
    }

       // ✅ Fetch Arabic movie data from MongoDB
       const arabicMoviesResponse = await fetch(`/api/arabic-movies/${movieId}`);
       if (!arabicMoviesResponse.ok) {
         throw new Error(`Failed to fetch Arabic movie data: ${arabicMoviesResponse.status}`);
       }
       const arabicMovie = await arabicMoviesResponse.json();

    if (arabicMovie) {
      console.log('✅ Found Arabic Movie:', arabicMovie);

      // ✅ Get Arabic Title (from Arabic JSON or fallback to TMDb)
      let arabicTitle = arabicMovie.movie_name || movieData.title;

      // ✅ Remove unwanted prefixes ("مشاهدة فيلم", "مشاهدة مسلسل", etc.)
      const phrasesToRemove = ["مشاهدة فيلم", "مشاهدة مسلسل", "فيلم", "مسلسل"];
      phrasesToRemove.forEach(phrase => {
        arabicTitle = arabicTitle.replace(new RegExp(`^${phrase}\\s*`, "g"), '').trim();
      });

      // ✅ Remove year from the Arabic title if it exists
      arabicTitle = arabicTitle.replace(/\(?\d{4}\)?\s*$/, '').trim(); // Removes YYYY at end, with or without ()

      // ✅ Override TMDb data with Arabic data
      movieData.title = arabicTitle;
      movieData.overview = arabicMovie.info.story || movieData.overview; // Use 'story' instead of 'overview

      // ✅ Fix genres by converting Arabic " | " separated text into an array
      if (arabicMovie.info.type) {
        movieData.genres = arabicMovie.info.type.split('|').map(genre => ({ name: genre.trim() }));
      } else {
        movieData.genres = []; // Ensure it's always an array
      }

      // ✅ Store the Arabic movie URL
      movieData.watchUrl = arabicMovie.url;
    } else {
      console.warn(`⚠️ No Arabic data found for TMDb ID: ${movieId}`);
    }

    // ✅ Debugging: Log final movie data before opening the modal
    console.log('🟢 Final Movie Data Before Modal:', movieData);

    // ✅ Store movie ID & URL in modal dataset
    const modal = document.getElementById('movie-modal');
    modal.dataset.movieId = movieData.id;
    modal.dataset.movieUrl = movieData.watchUrl || "";

    // ✅ Store and set the backdrop for proper restoration after trailer stops
    const trailerDiv = document.getElementById('modal-trailer');
    const backdropUrl = `https://image.tmdb.org/t/p/w1280${movieData.backdrop_path}`;
    trailerDiv.setAttribute('data-backdrop', backdropUrl);

    // ✅ Open modal with updated data
    openModal(movieData, true);
  } catch (error) {
    console.error('❌ Error fetching movie data:', error);
  }
}


/////////////////////////////////////////////////////////////////////////////////////////



// Function to open the modal with movie details and fetch backdrop/trailer from TMDb
async function openArabicMoviesModal(movieData, movieUrl) {
  const modal = document.getElementById('arabic-movies-modal');
  if (!modal) {
    console.error('Modal element is missing.');
    return;
  }

  // ✅ Store the movie URL in a hidden attribute inside the modal
  modal.setAttribute('data-movie-url', movieUrl);

  // Extract movie details
  const poster = movieData.info.poster || 'default-poster.jpg';
  const movieTitle = movieData.info.title || 'Unknown Movie';
  const description = movieData.info.story || 'No description available';
  const genre = movieData.info.type || 'Unknown Genre';
  const tmdbId = movieData.info.id;

  if (!tmdbId) {
    console.warn('No TMDb ID found for this movie.');
    return;
  }

  // Select modal elements
  const titleElement = document.getElementById('arabic-movies-title');
  const descriptionElement = document.getElementById('arabic-movies-description');
  const genreElement = document.getElementById('arabic-movies-genre');
  const trailerIframe = document.getElementById('arabic-movies-trailer');
  const modalBackdrop = document.getElementById('arabic-movies-backdrop'); // Target the backdrop div

  // Set movie details
  titleElement.textContent = movieTitle;
  descriptionElement.textContent = description;
  genreElement.textContent = `Genre: ${genre}`;

  try {
    // ✅ Fetch backdrop image
    const backdropResponse = await fetch(`/api/movie/${tmdbId}/backdrop`);
    const backdropData = await backdropResponse.json();
    const backdropUrl = backdropData.backdrop_path || poster;

    // ✅ Apply backdrop image
    modalBackdrop.style.backgroundImage = `url('${backdropUrl}')`;
    modalBackdrop.style.backgroundSize = "cover";
    modalBackdrop.style.backgroundPosition = "center";

    // ✅ Hide poster element (since we're using the backdrop)
    const posterElement = document.getElementById('arabic-movies-poster');
    if (posterElement) {
      posterElement.style.display = 'none'; // Hide the poster if it exists
    }

    // ✅ Fetch trailer
    const trailerResponse = await fetch(`/api/media/movie/${tmdbId}/trailer`);
    const trailerData = await trailerResponse.json();
    
    if (trailerData.youtube_trailer) {
      const trailerUrl = `https://www.youtube.com/embed/${trailerData.youtube_trailer}?autoplay=1&controls=0&modestbranding=1&rel=0&iv_load_policy=3&fs=0&showinfo=0&disablekb=1`;

      // ✅ Show trailer iframe
      trailerIframe.src = trailerUrl;
      trailerIframe.style.display = 'block';
    } else {
      // ✅ If no trailer, hide iframe
      trailerIframe.style.display = 'none';
    }
  } catch (error) {
    console.error('Error fetching movie data:', error);
    modalBackdrop.style.backgroundImage = `url('${poster}')`; // Fallback to poster if there's an issue
    trailerIframe.style.display = 'none';
  }

  // ✅ Attach event listener to close modal and stop trailer
  const closeButton = modal.querySelector('.close-btn');
  if (closeButton) {
    closeButton.removeEventListener('click', closeArabicMoviesModal);
    closeButton.addEventListener('click', closeArabicMoviesModal);
  }

  modal.style.display = 'block';
}


// Function to close the modal and stop the trailer
function closeArabicMoviesModal() {
  console.log("Close button clicked - Hiding Arabic Movies modal");

  const modal = document.getElementById('arabic-movies-modal');
  const trailerIframe = document.getElementById('arabic-movies-trailer');

  if (modal) {
    modal.style.display = 'none'; // Hide the modal
  } else {
    console.error('❌ Arabic Movies modal not found in DOM!');
  }

  // ✅ Stop the trailer by resetting the iframe src
  if (trailerIframe) {
    trailerIframe.src = "";
  }
}

async function playMovie() {
  try {
    const modal = document.getElementById('movie-modal');
    const movieId = modal.dataset.movieId; // Get TMDB ID from modal

    if (!movieId) {
      console.error('❌ Movie ID is missing.');
      return;
    }

    // ✅ Fetch the movie from MongoDB via your Node.js API
    const movieResponse = await fetch(`/api/arabic-movies/${movieId}`);
    if (!movieResponse.ok) {
      throw new Error(`Failed to fetch movie from MongoDB. Status: ${movieResponse.status}`);
    }

    const movie = await movieResponse.json();

    if (!movie || !movie.movie_name || !movie.url) {
      console.error(`❌ Movie data is incomplete or not found for ID: ${movieId}`);
      return;
    }

    const encodedMovieName = encodeURIComponent(movie.movie_name);
    const encodedMovieUrl = encodeURIComponent(movie.url);

    // ✅ Fetch watch server URL from your Flask API
    const apiUrl = `https://www.cimaway.com/main_api/get_watch_server?url=${encodedMovieUrl}`;
    console.log(`📡 Request URL: ${apiUrl}`);

    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`Network response was not ok. Status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ API response:', data);

    if (data.error) {
      console.error(data.error);
      return;
    }

    const movieWatchUrl = data.watch_server_url?.watch_server;

    if (typeof movieWatchUrl === 'string') {
      // ✅ Create fullscreen overlay for movie playback
      const fullscreenOverlay = document.createElement('div');
      fullscreenOverlay.id = 'fullscreen-overlay';
      fullscreenOverlay.style = `
        position: fixed;
        left: 0; top: 0;
        width: 100%; height: 100%;
        background-color: rgba(0, 0, 0, 0.9);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
      `;

      const iframe = document.createElement('iframe');
      iframe.src = movieWatchUrl;
      iframe.style = "width: 100%; height: 100%; border: none;";
      iframe.allow = "autoplay; encrypted-media";
      iframe.allowFullscreen = true;

      fullscreenOverlay.appendChild(iframe);

      const closeButton = document.createElement('button');
      closeButton.textContent = 'Close';
      closeButton.style = `
        position: absolute;
        top: 20px; right: 20px;
        font-size: 20px;
        color: #fff;
        background: rgba(0, 0, 0, 0.7);
        border: none;
        padding: 10px;
        cursor: pointer;
      `;
      closeButton.addEventListener('click', () => {
        document.body.removeChild(fullscreenOverlay);
      });

      fullscreenOverlay.appendChild(closeButton);
      document.body.appendChild(fullscreenOverlay);
    } else {
      console.error('❌ Movie watch URL is missing or not a string.');
    }
  } catch (error) {
    console.error('❌ Error fetching movie watch URL:', error);
  }
}



// Initial call to fetch and display Arabic movies
displayArabicMoviesList();


//////////////////////////////////////////////////////////////////////////// Notifications Bell ///////////////////////////////////////////////////////////////////////////////////////

// Notifications Button in Navbar
function toggleNotificationsMenu() {
  const notificationsMenu = document.getElementById("notifications-menu");
  const notificationsBadge = document.getElementById('notifications-badge'); // Get the badge element

  if (!notificationsMenu) {
      console.error("❌ Notifications menu not found.");
      return;
  }

  // ✅ Toggle visibility of the menu
  const isVisible = notificationsMenu.classList.toggle("show");

  // ✅ If the menu is opened, hide the badge
  if (isVisible) {
      notificationsBadge.style.display = "none"; // Hide badge when menu is opened
      // Add event listener to close when clicking outside
      document.addEventListener("click", closeNotificationsMenu);
  }
}

// ✅ Function to close menu when clicking outside
function closeNotificationsMenu(event) {
  const notificationsMenu = document.getElementById("notifications-menu");
  const iconContainer = document.querySelector(".notifications-icon-container");

  if (notificationsMenu && !notificationsMenu.contains(event.target) && !iconContainer.contains(event.target)) {
      notificationsMenu.classList.remove("show");
      document.removeEventListener("click", closeNotificationsMenu); // ✅ Remove listener after closing
  }
}

// Fetch and Display active Notifications
async function loadNotifications() {
  try {
      const response = await fetch('/api/user/notifications', { credentials: 'include' });
      const data = await response.json();

      const notificationsList = document.getElementById('notifications-list');
      const notificationsBadge = document.getElementById('notifications-badge'); // Get the badge element

      notificationsList.innerHTML = ""; // Clear previous notifications

      if (data.notifications.length === 0) {
          notificationsList.innerHTML = "<li>No new notifications</li>";
          notificationsBadge.style.display = "none"; // Hide badge if no notifications
      } else {
          data.notifications.forEach(notification => {
              const li = document.createElement('li');
              li.textContent = notification.message;
              notificationsList.appendChild(li);
          });

          // Show badge with the total number of notifications
          notificationsBadge.style.display = "block";
          notificationsBadge.textContent = data.notifications.length; // Set the total count
      }

  } catch (error) {
      console.error("Error loading notifications:", error);
  }
}

// ✅ Load notifications on page load
loadNotifications();


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


document.addEventListener("DOMContentLoaded", () => {
  const eventSource = new EventSource('/api/session-events');

  eventSource.onmessage = (event) => {
      if (event.data === "logout") {
          console.log("❌ Session expired. Closing player and redirecting...");

          // ✅ Close any active video player (modify selector as needed)
          const videoPlayer = document.querySelector('video');
          if (videoPlayer) {
              videoPlayer.pause();
              videoPlayer.src = "";
              console.log("📺 Video player closed.");
          }

          // ✅ Remove any iframe embeds (for external players)
          const iframes = document.querySelectorAll('iframe');
          if (iframes.length > 0) {
              iframes.forEach(iframe => iframe.remove());
              console.log("🖼️ Iframe embeds removed.");
          }

          // ✅ Redirect to login page
          window.location.href = '/login';
      }
  };

  eventSource.onerror = () => {
      console.log("⚠️ SSE Connection Lost. Attempting to reconnect...");
     eventSource.close();
  };
});

async function logoutUser() {
  try {
    const response = await fetch('/api/logout', {
      method: 'POST',
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error("Logout failed");
    }

    // ✅ Redirect to login page (or homepage)
    window.location.href = "/login";

  } catch (error) {
    console.error("❌ Error logging out:", error);
  }
}

async function checkSession() {
  try {
      const response = await fetch('/api/check-session', { credentials: 'include' });
      const data = await response.json();

      if (data.redirect) {
          console.log("🚨 User inactive or expired. Redirecting...");
          window.location.href = data.redirect; // ✅ Redirect to subscription-ended
      } else if (window.location.pathname === "/subscription-ended") {
          console.log("✅ User is active. Redirecting to home...");
          window.location.href = "/"; // ✅ Redirect active users back to the main site
      }
  } catch (error) {
      console.log("❌ No active session. Redirecting to login.");
      window.location.href = "/login";
  }
}
checkSession(); // Run check on page load

///////////////////////////////////////////////////////////// ARABIC/TURKISH MY LIST //////////////////////////////////////////////////////////////////////////////////////////////


///

// Load both general and Arabic/Turkish favorites when "My List" button is clicked
function loadBothLists() {
  loadMyList();              // Load general favorites
  loadArabicTurkishList();   // Load Arabic/Turkish favorites
}


///
async function toggleArabicTurkishFavorite(tmdbId, isRemoving = false) {
  console.log("📌 Toggle Arabic/Turkish Favorite - TMDB ID:", tmdbId, "Removing:", isRemoving);

  if (!tmdbId) {
      console.error("❌ TMDB ID is missing!");
      return;
  }

  try {
      // Check if the series is already in Arabic/Turkish favorites (only if not removing)
      if (!isRemoving) {
          const checkResponse = await fetch('/api/user/arabic-turkish-favorites', { credentials: 'include' });
          const checkData = await checkResponse.json();
          console.log("✅ Check Data:", checkData); // Debugging line to inspect the checkData response

          // If it's already in the favorites, we just notify and stop further execution
          if (checkData.favorites.some(fav => fav.tmdbId === tmdbId)) {
              showFavoriteNotification("Already exists in Arabic/Turkish Favorites!");
              return;
          }
      }

      // Log to confirm correct payload
      const payload = { 
          tmdbId, 
          remove: isRemoving, 
          mediaType: "tv" // Explicitly add mediaType here
      };
      console.log("✅ Payload being sent to server:", payload);

      // Proceed with adding/removing the favorite
      const response = await fetch('/api/user/arabic-turkish-favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload)
      });

      const data = await response.json();
      console.log("✅ Server Response:", data);

      // If the item was already in favorites (for add case)
      if (data.message === "Already exists in Arabic/Turkish favorites") {
          showFavoriteNotification(data.message);
          return; // Avoid logging as error
      }

      // If adding the item to favorites
      if (data.message === "Added to Arabic/Turkish favorites") {
          showFavoriteNotification(data.message);
      }

      // If removing the item from favorites
      if (data.message === "Removed from Arabic/Turkish favorites") {
          showFavoriteNotification(data.message);
          loadBothLists(); // Update the list after removal
      }

  } catch (error) {
      console.error("❌ Error updating Arabic/Turkish favorites:", error);
  }
}


// Fetch Arabic/Turkish favorites for the user
async function loadArabicTurkishList() {
  const featuredContainer = document.getElementById('featured-trending-container');
  const otherFeaturedContainer = document.getElementById('featured-movie-section');
  const moviesContent = document.getElementById('movies-content');
  const movieSections = document.querySelectorAll('.movie-section');

  if (!featuredContainer || movieSections.length === 0) {
      console.error("❌ Error: Sections not found.");
      return;
  }

  try {
      const response = await fetch('/api/user/arabic-turkish-favorites', { credentials: 'include' });
      const data = await response.json();

      // Hide featured section & movie sections
      featuredContainer.style.display = 'none';
      otherFeaturedContainer.style.display = 'none';
      moviesContent.style.display = 'none';
      movieSections.forEach(section => section.style.display = 'none');

      
   
    // Hide Arabic series full list and featured section
const arabicSeriesResults = document.getElementById("arabic-series-results");
if (arabicSeriesResults) arabicSeriesResults.style.display = "none";

const arabicSeriesFeatured = document.getElementById("displaylocalfeaturedseries-section");
if (arabicSeriesFeatured) arabicSeriesFeatured.style.display = "none";

// ✅ Hide Turkish series full list 
const turkishSeriesResults = document.getElementById("turkish-series-results");
if (turkishSeriesResults) turkishSeriesResults.style.display = "none";

    // Hide Arabic Movies full list and featured section
    const arabicMoviesResults = document.getElementById("arabic-movies-results");
    if (arabicMoviesResults) arabicMoviesResults.style.display = "none";
    
    const arabicMoviesFeatured = document.getElementById("displaylocalfeaturedmovie-section");
    if (arabicMoviesFeatured) arabicMoviesFeatured.style.display = "none";

    

    // 🔴 Hide More Results Container if it exists
const moreResultsContainer = document.querySelector('.more-results-container');
if (moreResultsContainer) {
  moreResultsContainer.style.display = 'none';
}



      // Create "My List" container
      let myListContainer = document.getElementById("mylist-container");
      if (!myListContainer) {
          myListContainer = document.createElement('div');
          myListContainer.id = 'mylist-container';
          document.body.appendChild(myListContainer);
      }

      // Make sure list container is visible 
      myListContainer.classList.remove("hidden"); // Ensure visibility
      myListContainer.style.display = "block"; 
      myListContainer.innerHTML = '';

      if (!data.favorites || data.favorites.length === 0) {
          myListContainer.innerHTML = `<h2 style="text-align: center;">Your Arabic/Turkish list is empty.</h2>`;
      } else {
          const listSection = document.createElement("div");
          listSection.classList.add("mylist-section");

          // Add "My List" title
          const sectionTitle = document.createElement("h2");
          sectionTitle.textContent = `My Arabic/Turkish List`;
          sectionTitle.style.textAlign = "left";
          listSection.appendChild(sectionTitle);

          const listContainer = document.createElement("div");
          listContainer.classList.add("mylist-container");

          // Fetch movie/series details from TMDB for display
          const promises = data.favorites.map(fav =>
              fetch(`/api/tmdb/arabic-turkish/${fav.tmdbId}`).then(res => res.json().then(movie => ({ ...movie, media_type: "tv" }))) // media_type is hardcoded as "tv"
          );

          const results = await Promise.all(promises);
          let listRow = document.createElement("div");
          listRow.classList.add("mylist-row");
          let itemCount = 0;

          results.forEach(movie => {
              if (!movie || movie.status_code === 34) return;

              const movieElement = document.createElement("div");
              movieElement.classList.add("mylist-card");

              const removeButton = document.createElement("button");
              removeButton.classList.add("remove-favorite-button");
              removeButton.innerHTML = "✖";
              removeButton.onclick = (event) => {
                  event.stopPropagation();
                  toggleArabicTurkishFavorite(movie.id, true);
                  movieElement.remove();
              };

              movieElement.innerHTML = `
                  <img src="https://image.tmdb.org/t/p/w500${movie.poster_path}" 
                       alt="${movie.title || movie.name}" 
                       class="mylist-poster"/>
              `;
              movieElement.appendChild(removeButton);

              // Fetch full series data when clicking
              movieElement.addEventListener('click', async () => {
                  try {
                      const seriesResponse = await fetch(`/api/seasons?id=${movie.id}`);
                      const seriesData = await seriesResponse.json();
                      openArabicSeriesModal(seriesData);
                  } catch (error) {
                      console.error("❌ Error fetching local series data:", error);
                  }
              });

              listRow.appendChild(movieElement);
              itemCount++;

              if (itemCount === 6) {
                  listContainer.appendChild(listRow);
                  listRow = document.createElement("div");
                  listRow.classList.add("mylist-row");
                  itemCount = 0;
              }
          });

          if (itemCount > 0) {
              listContainer.appendChild(listRow);
          }

          listSection.appendChild(listContainer);
          myListContainer.appendChild(listSection);
      }

  } catch (error) {
      console.error("❌ Error loading Arabic/Turkish list:", error);
  }
}

///////////////////////////////////////////////////////////// MAIN MODAL MY LIST ///////////////////////////////////////////////////////////////////////////////////////////////////

async function toggleFavorite(tmdbId, mediaType, isRemoving = false) {
  console.log("📌 Toggle Favorite Clicked - TMDB ID:", tmdbId, "Type:", mediaType, "Removing:", isRemoving);

  try {
      // ✅ Check if already exists in favorites (only when adding)
      if (!isRemoving) {
          const checkResponse = await fetch('/api/user/favorites', { credentials: 'include' });
          const checkData = await checkResponse.json();

          if (checkData.favorites.some(fav => fav.tmdbId === tmdbId)) {
              showFavoriteNotification("Already exists in My List!");
              return; // ✅ Stop execution if already exists
          }
      }

      // ✅ Proceed with adding/removing favorite
      const response = await fetch('/api/user/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ tmdbId, mediaType, remove: isRemoving }) // ✅ Ensure `remove` flag is passed
      });

      const data = await response.json();
      console.log("✅ Server Response:", data);

      showFavoriteNotification(data.message);

      // ✅ Reload My List when removing
      if (isRemoving) {
        loadBothLists();
      }

  } catch (error) {
      console.error("❌ Error updating favorites:", error);
  }
}


/* ✅ Show Notification Popup */
function showFavoriteNotification(message) {
    const popup = document.getElementById("favorite-popup");
    popup.textContent = message;
    popup.classList.add("show");

    // ✅ Hide after 2 seconds
    setTimeout(() => {
        popup.classList.add("hide");
        setTimeout(() => {
            popup.classList.remove("show", "hide");
        }, 300); // Allow transition to complete
    }, 2000);
}



// ✅ Fetch user favorites on page load (now logs full objects)
async function getFavorites() {
  try {
      const response = await fetch('/api/user/favorites', { credentials: 'include' });
      const data = await response.json();

      console.log("User Favorites:", data.favorites); // ✅ Logs full objects with tmdbId & mediaType
  } catch (error) {
      console.error("Error fetching favorites:", error);
  }
}
getFavorites(); // Load favorites on page load


async function loadMyList() {
  const featuredContainer = document.getElementById('featured-trending-container');
  const movieSections = document.querySelectorAll('.movie-section');

  if (!featuredContainer || movieSections.length === 0) {
      console.error("❌ Error: Sections not found.");
      return;
  }

  try {
      const response = await fetch('/api/user/favorites', { credentials: 'include' });
      const data = await response.json();

      // ✅ Hide featured section & movie sections
      featuredContainer.style.display = 'none';
      movieSections.forEach(section => section.style.display = 'none');

      // ✅ Create "My List" container
      let myListContainer = document.getElementById("mylist-container");
      if (!myListContainer) {
          myListContainer = document.createElement('div');
          myListContainer.id = 'mylist-container';
          document.body.appendChild(myListContainer);
      }

      myListContainer.innerHTML = ''; // ✅ Clear previous content

      if (!data.favorites || data.favorites.length === 0) {
          myListContainer.innerHTML = '<h2 style="text-align: center;">Your list is empty.</h2>';
      } else {
          // ✅ Create My List section
          const listSection = document.createElement("div");
          listSection.classList.add("mylist-section");

          // ✅ Add "My List" title
          const sectionTitle = document.createElement("h2");
          sectionTitle.textContent = "My List";
          sectionTitle.style.textAlign = "left";
          listSection.appendChild(sectionTitle);

          const listContainer = document.createElement("div");
          listContainer.classList.add("mylist-container");

          // ✅ Fetch movie/series details using `/api/tmdb/:id`
          const promises = data.favorites.map(fav =>
              fetch(`/api/tmdb/${fav.tmdbId}`).then(res => res.json().then(movie => ({ ...movie, media_type: fav.mediaType }))) // ✅ Ensure mediaType is included
          );

          const results = await Promise.all(promises);
          let listRow = document.createElement("div");
          listRow.classList.add("mylist-row");
          let itemCount = 0;

          results.forEach(movie => {
              if (!movie || movie.status_code === 34) return; // Skip if not found

              // ✅ Create movie card
              const movieElement = document.createElement("div");
              movieElement.classList.add("mylist-card");

              // ✅ Create "X" button for removal
              const removeButton = document.createElement("button");
              removeButton.classList.add("remove-favorite-button");
              removeButton.innerHTML = "✖"; // X symbol
              removeButton.onclick = (event) => {
                  event.stopPropagation(); // ✅ Prevent modal opening
                  toggleFavorite(movie.id, movie.media_type, true); // ✅ Ensure `isRemoving = true`
                  movieElement.remove(); // ✅ Remove from UI instantly
              };

              movieElement.innerHTML = `
                  <img src="https://image.tmdb.org/t/p/w500${movie.poster_path}" 
                       alt="${movie.title || movie.name}" 
                       class="mylist-poster"/>
              `;

              // ✅ Add "X" button on hover
              movieElement.appendChild(removeButton);

              // ✅ Add click event to open modal
              movieElement.addEventListener('click', () => openModal(movie));

              // ✅ Append movie to the row
              listRow.appendChild(movieElement);
              itemCount++;

              // ✅ If row reaches 6 items, append it and start a new row
              if (itemCount === 6) {
                  listContainer.appendChild(listRow);
                  listRow = document.createElement("div");
                  listRow.classList.add("mylist-row");
                  itemCount = 0;
              }
          });

          // ✅ Append any remaining items in the last row
          if (itemCount > 0) {
              listContainer.appendChild(listRow);
          }

          listSection.appendChild(listContainer);
          myListContainer.appendChild(listSection);
      }

  } catch (error) {
      console.error("❌ Error loading My List:", error);
  }
}


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// ✅ Open Profile Modal & Fetch Data
async function openProfileModal() {
  try {
      const response = await fetch('/api/user/profile', { credentials: 'include' });
      const data = await response.json();

      if (!response.ok) throw new Error(data.message || "Failed to fetch profile");

      // ✅ Format dates to MM/DD/YYYY
      const formatDate = (dateString) => {
          const date = new Date(dateString);
          return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
      };

      document.getElementById('profile-username').textContent = data.username;
      document.getElementById('profile-created').textContent = formatDate(data.createdAt);
      document.getElementById('profile-expiry').textContent = formatDate(data.expiryDate);
      document.getElementById('profile-status-text').textContent = "Active";

      // ✅ Calculate remaining days
      const expiryDate = new Date(data.expiryDate);
      const today = new Date();
      const timeDiff = expiryDate - today;
      const daysLeft = Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24))); // Convert to days

      // ✅ Display subscription remaining time
      document.getElementById('profile-days-left').textContent = `Your subscription ends in ${daysLeft} days`;

      // ✅ Disable scrolling when modal is open
      document.body.style.overflow = "hidden";

      // ✅ Show the modal
      document.getElementById('profile-modal').style.display = "flex"; 

  } catch (error) {
      console.error("❌ Error fetching profile:", error);
  }
}

// Open Profile Menu DropDown
function toggleProfileMenu() {
  const profileMenu = document.getElementById("profile-menu");
  const profileDropdown = document.querySelector(".profile-dropdown");

  // Toggle active class to rotate arrow
  profileDropdown.classList.toggle("active");

  const isVisible = profileMenu.style.display === "block";

  // Toggle visibility and triangle pointer
  profileMenu.style.display = isVisible ? "none" : "block";
  profileMenu.classList.toggle("show", !isVisible);
}

// ✅ Close menu when clicking outside
document.addEventListener("click", (event) => {
  const profileDropdown = document.querySelector(".profile-dropdown");
  const profileMenu = document.getElementById("profile-menu");

  if (!profileDropdown.contains(event.target)) {
    profileDropdown.classList.remove("active");
    profileMenu.style.display = "none";
    profileMenu.classList.remove("show");
  }
});




// ✅ Ensure the modal and button exist before adding event listeners
document.addEventListener("DOMContentLoaded", () => {
    const closeButton = document.querySelector('.profile-close-btn');
    const profileModal = document.getElementById('profile-modal');

    if (closeButton) {
        closeButton.addEventListener('click', () => {
            profileModal.style.display = "none";
             // ✅ Re-enable scrolling when closing modal
              document.body.style.overflow = "auto";
        });
    }
// Click Outside Close
    window.addEventListener('click', (event) => {
        if (event.target === profileModal) {
            profileModal.style.display = "none";
        // ✅ Re-enable scrolling when closing modal
        document.body.style.overflow = "auto";
        }
    });
});
