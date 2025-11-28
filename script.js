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
fetchMovies('Avengers').then(movies => {
    console.log("Test Fetch (Avengers):", movies);
});
