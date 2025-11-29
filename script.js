const API_KEY = '3137e2ba';
const BASE_URL = 'http://www.omdbapi.com/';

// State to manage application data
const appState = {
    newReleases: [],
    trending: [],
    upcoming: [],
    bestOn: []
};

/**
 * Fetch movies from OMDB API
 * @param {string} query - Search query (e.g., 'Marvel', '2024')
 * @param {string} type - Type of content ('movie', 'series', 'episode')
 * @returns {Promise<Array>} - Array of movie objects
 */
async function fetchMovies(query, type = 'movie') {
    try {
        const response = await fetch(`${BASE_URL}?apikey=${API_KEY}&s=${query}&type=${type}`);
        const data = await response.json();

        if (data.Response === "True") {
            return data.Search;
        } else {
            console.error(`Error fetching movies for query "${query}":`, data.Error);
            return [];
        }
    } catch (error) {
        console.error("Network error:", error);
        return [];
    }
}

/**
 * Fetch detailed movie information by ID
 * @param {string} imdbID 
 * @returns {Promise<Object>}
 */
async function fetchMovieDetails(imdbID) {
    try {
        const response = await fetch(`${BASE_URL}?apikey=${API_KEY}&i=${imdbID}&plot=full`);
        const data = await response.json();

        if (data.Response === "True") {
            return data;
        } else {
            console.error("Error fetching details:", data.Error);
            return null;
        }
    } catch (error) {
        console.error("Network error:", error);
        return null;
    }
}

/**
 * Render movies to the DOM
 * @param {Array} movies - Array of movie objects
 * @param {string} containerId - ID of the container element
 */
function renderMovies(movies, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = ''; // Clear existing content

    if (!movies || movies.length === 0) {
        container.innerHTML = '<p>No movies found.</p>';
        return;
    }

    movies.forEach(movie => {
        const movieCard = document.createElement('div');
        movieCard.classList.add('movie-card');

        // Ensure we have a poster URL, fallback to placeholder when missing
        const poster = (movie && movie.Poster && movie.Poster !== 'N/A') ? movie.Poster : 'https://via.placeholder.com/300x450?text=No+Image';

        movieCard.innerHTML = `
            <img src="${poster}" alt="${movie.Title}" onerror="this.src='https://via.placeholder.com/300x450?text=Image+Not+Found'">
            <div class="movie-info">
                <h3>${movie.Title}</h3>
                <div class="rating">
                    <span class="score"><i class="fas fa-star"></i> ${movie.Year}</span>
                </div>
            </div>
        `;

        // Add click event to view details
        movieCard.addEventListener('click', () => {
            openModal(movie.imdbID);
        });

        container.appendChild(movieCard);
    });
}

// Modal Elements
const modal = document.getElementById("movie-modal");
const closeModal = document.querySelector(".close-modal");

// Close modal when clicking on 'x'
if (closeModal) {
    closeModal.onclick = function () {
        modal.style.display = "none";
        document.body.classList.remove('modal-open');
    }
}

// Close modal when clicking outside
window.onclick = function (event) {
    if (event.target == modal) {
        modal.style.display = "none";
        document.body.classList.remove('modal-open');
    }
}

/**
 * Open Modal with Movie Details
 * @param {string} imdbID 
 */
async function openModal(imdbID) {
    const movie = await fetchMovieDetails(imdbID);
    if (!movie) return;

    document.getElementById('modal-title').innerText = movie.Title;
    document.getElementById('modal-year').innerText = movie.Year;
    document.getElementById('modal-rated').innerText = movie.Rated;
    document.getElementById('modal-runtime').innerText = movie.Runtime;
    document.getElementById('modal-genre').innerText = movie.Genre;
    document.getElementById('modal-score').innerText = movie.imdbRating;
    document.getElementById('modal-plot').innerText = movie.Plot;
    document.getElementById('modal-actors').innerText = movie.Actors;
    document.getElementById('modal-director').innerText = movie.Director;

    let poster = movie.Poster !== "N/A" ? movie.Poster : 'https://via.placeholder.com/300x450?text=No+Poster';
    document.getElementById('modal-img').src = poster;
    document.getElementById('modal-img').onerror = function() {
        this.src = 'https://via.placeholder.com/300x450?text=Image+Not+Found';
    };

    modal.style.display = "block";
    document.body.classList.add('modal-open');
}

/**
 * Handle Search
 */
async function handleSearch(query) {
    if (!query) return;

    const results = await fetchMovies(query);
    
    // Determine where to show results based on current page
    let targetContainerId = 'new-releases'; // Default for home
    if (document.querySelector('.page-movies')) targetContainerId = 'movies-grid';
    if (document.querySelector('.page-tvshows')) targetContainerId = 'tvshows-grid';

    const container = document.getElementById(targetContainerId);
    if (container) {
        // Update title if possible
        const sectionHeader = container.parentElement.querySelector('h2');
        if (sectionHeader) sectionHeader.innerText = `Search Results: "${query}"`;
        
        renderMovies(results, targetContainerId);
        
        // Hide other sections on home page if searching (guard for missing sections)
        if (document.querySelector('.page-home')) {
            const trendingEl = document.getElementById('trending-movies');
            const upcomingEl = document.getElementById('upcoming-releases');
            const bestEl = document.getElementById('best-movies');

            if (trendingEl && trendingEl.parentElement) trendingEl.parentElement.style.display = 'none';
            if (upcomingEl && upcomingEl.parentElement) upcomingEl.parentElement.style.display = 'none';
            if (bestEl && bestEl.parentElement) bestEl.parentElement.style.display = 'none';
        }
    }
}

/**
 * Discover a Random Movie
 */
async function discoverRandomMovie() {
    const keywords = ['Inception', 'Matrix', 'Interstellar', 'Titanic', 'Avatar', 'Gladiator', 'Joker', 'Avengers', 'Batman', 'Spiderman', 'Godfather', 'Pulp Fiction', 'Fight Club', 'Forrest Gump', 'Star Wars', 'Lord of the Rings', 'Harry Potter', 'Jurassic Park', 'Lion King', 'Frozen'];
    const randomKeyword = keywords[Math.floor(Math.random() * keywords.length)];
    
    // Fetch movies for the random keyword
    const movies = await fetchMovies(randomKeyword);
    
    if (movies && movies.length > 0) {
        // Pick a random movie from the results
        const randomMovie = movies[Math.floor(Math.random() * movies.length)];
        openModal(randomMovie.imdbID);
    } else {
        alert('Could not find a random movie. Please try again.');
    }
}

/**
 * Update Hero Section with a Random Movie
 */
async function updateHeroSection() {
    const heroMovies = ['Avatar', 'Interstellar', 'Dune', 'The Batman', 'Oppenheimer', 'Inception', 'Avengers: Endgame', 'Joker', 'Gladiator', 'Titanic'];
    const randomTitle = heroMovies[Math.floor(Math.random() * heroMovies.length)];
    
    const movies = await fetchMovies(randomTitle);
    if (movies && movies.length > 0) {
        // Get the first exact match or just the first result
        const movie = movies[0];
        const details = await fetchMovieDetails(movie.imdbID);
        
        if (details) {
            document.getElementById('hero-title').innerText = details.Title;
            document.getElementById('hero-description').innerText = details.Plot;
            
            let poster = details.Poster !== "N/A" ? details.Poster : 'https://via.placeholder.com/500x750?text=No+Image';
            // Try to get a higher res image if possible (OMDB usually sends 300px width)
            // We can't easily get high res from OMDB free tier, so we stick with what we have.
            document.getElementById('hero-image').src = poster;

            // Update Watch Trailer button to open modal (since we don't have real trailer links)
            const watchBtn = document.getElementById('hero-watch-btn');
            if (watchBtn) {
                watchBtn.onclick = () => openModal(details.imdbID);
            }
        }
    }
}

/**
 * Initialize the application
 */
async function initApp() {
    console.log("Initializing App...");

    // Search Event Listener
    const searchInput = document.querySelector('.search-bar input');
    if (searchInput) {
        searchInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                handleSearch(this.value);
            }
        });
    }

    // Discover Button Listener
    const discoverBtn = document.getElementById('btn-discover');
    if (discoverBtn) {
        discoverBtn.addEventListener('click', discoverRandomMovie);
    }

    // Page Specific Logic
    if (document.querySelector('.page-home')) {
        initHomePage();
    } else if (document.querySelector('.page-movies')) {
        initMoviesPage();
    } else if (document.querySelector('.page-tvshows')) {
        initTVShowsPage();
    }
}

async function initHomePage() {
    // Update Hero Section
    updateHeroSection();

    // New Releases -> "2024"
    const newReleases = await fetchMovies('2024');
    renderMovies(newReleases, 'new-releases');

    // Trending -> "Action"
    const trending = await fetchMovies('Action');
    renderMovies(trending, 'trending-movies');

    // Upcoming -> "2025"
    const upcoming = await fetchMovies('2025');
    renderMovies(upcoming, 'upcoming-releases');

    // Genre Pills Logic for Home Page
    const genres = document.querySelectorAll('.genre-pill');
    genres.forEach(pill => {
        pill.addEventListener('click', async () => {
            // Remove active class from all pills
            genres.forEach(p => p.classList.remove('active'));
            // Add active class to clicked pill
            pill.classList.add('active');

            const genre = pill.dataset.genre;
            
            // Fetch movies for the selected genre
            const genreMovies = await fetchMovies(genre);
            
            // Update "New Releases" section to show genre results
            // We use 'new-releases' as the main display area
            const newReleasesSection = document.getElementById('new-releases');
            const sectionHeader = newReleasesSection.parentElement.querySelector('h2');
            
            if (sectionHeader) {
                sectionHeader.innerText = `${genre} Movies`;
            }
            
            renderMovies(genreMovies, 'new-releases');

            // Optionally, we could also update other sections or hide them
            // For now, let's keep it simple and just update the top section
            // to reflect the user's choice immediately.
        });
    });
}

async function initMoviesPage() {
    // Initial load
    const movies = await fetchMovies('2024', 'movie');
    renderMovies(movies, 'movies-grid');

    // Genre Pills Logic
    const genres = document.querySelectorAll('.genre-pill');
    genres.forEach(pill => {
        pill.addEventListener('click', async () => {
            genres.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            const genre = pill.dataset.genre;
            const results = await fetchMovies(genre, 'movie');
            renderMovies(results, 'movies-grid');
        });
    });
}

async function initTVShowsPage() {
    // Initial load
    const shows = await fetchMovies('2024', 'series');
    renderMovies(shows, 'tvshows-grid');

    // Genre Pills Logic
    const genres = document.querySelectorAll('.genre-pill');
    genres.forEach(pill => {
        pill.addEventListener('click', async () => {
            genres.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            const genre = pill.dataset.genre;
            const results = await fetchMovies(genre, 'series');
            renderMovies(results, 'tvshows-grid');
        });
    });
}


// Start the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);
