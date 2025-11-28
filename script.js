const API_KEY = '3137e2ba';
const BASE_URL = 'http://www.omdbapi.com/';

// State to manage application data
const appState = {
    newReleases: [],
    trending: [],
    upcoming: []
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

// Test the API connection
// fetchMovies('Avengers').then(movies => {
//     console.log("Test Fetch (Avengers):", movies);
// });

/**
 * Render movies to the DOM
 * @param {Array} movies - Array of movie objects
 * @param {string} containerId - ID of the container element
 */
function renderMovies(movies, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = ''; // Clear existing content

    if (!movies || movies.length === 0) {
        container.innerHTML = '<p>No movies found.</p>';
        return;
    }

    movies.forEach(movie => {
        const movieCard = document.createElement('div');
        movieCard.classList.add('movie-card');

        // Handle missing posters
        const poster = movie.Poster !== "N/A" ? movie.Poster : 'https://via.placeholder.com/300x450?text=No+Poster';

        movieCard.innerHTML = `
            <img src="${poster}" alt="${movie.Title}">
            <div class="movie-info">
                <h3>${movie.Title}</h3>
                <div class="rating">
                    <span class="score"><i class="fas fa-star"></i> ${movie.Year}</span>
                </div>
            </div>
        `;

        // Add click event to view details (future implementation)
        movieCard.addEventListener('click', () => {
            console.log(`Clicked on ${movie.Title} (${movie.imdbID})`);
            // TODO: Open details view
        });

        container.appendChild(movieCard);
    });
}

/**
 * Initialize the application
 */
async function initApp() {
    console.log("Initializing App...");

    // Fetch data for different sections
    // Using specific queries to simulate categories since OMDB is limited

    // New Releases -> "2024"
    const newReleases = await fetchMovies('2024');
    renderMovies(newReleases, 'new-releases');

    // Trending -> "Marvel"
    const trending = await fetchMovies('Marvel');
    renderMovies(trending, 'trending-movies');

    // Upcoming -> "2025"
    const upcoming = await fetchMovies('2025');
    renderMovies(upcoming, 'upcoming-releases');
}

// Start the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);
