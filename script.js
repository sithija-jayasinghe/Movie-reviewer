const API_KEY = '3137e2ba';
const BASE_URL = 'http://www.omdbapi.com/';

// State to manage application data
const appState = {
    newReleases: [],
    trending: [],
    upcoming: [],
    watchlist: JSON.parse(localStorage.getItem('movora_watchlist')) || [],
    currentPage: 1,
    currentSearch: '',
    currentType: 'movie',
    currentResults: []
};

// --- UTILS ---

/**
 * Show Toast Notification
 * @param {string} message 
 * @param {string} type - 'success' or 'error'
 */
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.classList.add('toast');
    if (type === 'error') toast.classList.add('error');

    const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
    
    toast.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/**
 * Toggle Watchlist
 * @param {Object} movie 
 */
function toggleWatchlist(movie) {
    const index = appState.watchlist.findIndex(m => m.imdbID === movie.imdbID);
    
    if (index === -1) {
        appState.watchlist.push(movie);
        showToast(`Added "${movie.Title}" to Watchlist`);
    } else {
        appState.watchlist.splice(index, 1);
        showToast(`Removed "${movie.Title}" from Watchlist`, 'error'); // Using error style for remove
    }
    
    localStorage.setItem('movora_watchlist', JSON.stringify(appState.watchlist));
    updateWatchlistUI();
}

function updateWatchlistUI() {
    const modalBtn = document.getElementById('modal-watchlist-btn');
    if (modalBtn) {
        const imdbID = modalBtn.dataset.imdbID;
        const inList = appState.watchlist.some(m => m.imdbID === imdbID);
        updateWatchlistButtonState(modalBtn, inList);
    }
    
    // If we are on a watchlist page (future feature), re-render
}

function updateWatchlistButtonState(btn, inList) {
    if (inList) {
        btn.innerHTML = '<i class="fas fa-check"></i> In Watchlist';
        btn.style.backgroundColor = 'var(--accent-color)';
        btn.style.color = '#000';
    } else {
        btn.innerHTML = '<i class="fas fa-plus"></i> Add to Watchlist';
        btn.style.backgroundColor = 'transparent';
        btn.style.color = 'var(--accent-color)';
    }
}

// --- SORTING ---

function sortMovies(movies, criteria) {
    const sorted = [...movies];
    switch (criteria) {
        case 'year-desc':
            return sorted.sort((a, b) => parseInt(b.Year) - parseInt(a.Year));
        case 'year-asc':
            return sorted.sort((a, b) => parseInt(a.Year) - parseInt(b.Year));
        case 'title-asc':
            return sorted.sort((a, b) => a.Title.localeCompare(b.Title));
        default:
            return sorted;
    }
}

function setupSortListener(containerId) {
    const sortSelect = document.getElementById('sort-select');
    if (!sortSelect) return;

    sortSelect.addEventListener('change', (e) => {
        const criteria = e.target.value;
        const sortedMovies = sortMovies(appState.currentResults, criteria);
        renderMovies(sortedMovies, containerId);
    });
}

// --- API ---

/**
 * Fetch movies from OMDB API
 */
async function fetchMovies(query, type = 'movie', page = 1) {
    try {
        const response = await fetch(`${BASE_URL}?apikey=${API_KEY}&s=${query}&type=${type}&page=${page}`);
        const data = await response.json();

        if (data.Response === "True") {
            return data.Search;
        } else {
            if (page === 1) console.error(`Error fetching movies:`, data.Error);
            return [];
        }
    } catch (error) {
        console.error("Network error:", error);
        showToast("Network error. Please check your connection.", "error");
        return [];
    }
}

async function fetchMovieDetails(imdbID) {
    try {
        const response = await fetch(`${BASE_URL}?apikey=${API_KEY}&i=${imdbID}&plot=full`);
        const data = await response.json();
        return data.Response === "True" ? data : null;
    } catch (error) {
        return null;
    }
}

// --- RENDERING ---

/**
 * Render Skeleton Loaders
 */
function renderSkeletons(containerId, count = 5) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    for (let i = 0; i < count; i++) {
        const skeleton = document.createElement('div');
        skeleton.classList.add('skeleton', 'skeleton-card');
        container.appendChild(skeleton);
    }
}

/**
 * Render movies to the DOM
 */
function renderMovies(movies, containerId, append = false) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!append) container.innerHTML = '';

    if (!movies || movies.length === 0) {
        if (!append) container.innerHTML = '<p style="color: #aaa; text-align: center; width: 100%;">No movies found.</p>';
        return;
    }

    movies.forEach((movie, index) => {
        const movieCard = document.createElement('div');
        movieCard.classList.add('movie-card');
        
        // Staggered Animation Delay
        movieCard.style.animationDelay = `${index * 0.1}s`;

        const poster = (movie.Poster && movie.Poster !== 'N/A') ? movie.Poster : 'https://via.placeholder.com/300x450?text=No+Image';

        movieCard.innerHTML = `
            <img src="${poster}" alt="${movie.Title}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x450?text=Image+Not+Found'">
            <div class="movie-info">
                <h3>${movie.Title}</h3>
                <div class="rating">
                    <span class="score"><i class="fas fa-star"></i> ${movie.Year}</span>
                </div>
            </div>
        `;

        movieCard.addEventListener('click', () => openModal(movie.imdbID));
        container.appendChild(movieCard);
    });
}

// --- MODAL ---

const modal = document.getElementById("movie-modal");
const closeModal = document.querySelector(".close-modal");

if (closeModal) {
    closeModal.onclick = () => {
        modal.style.display = "none";
        document.body.classList.remove('modal-open');
    }
}

window.onclick = (event) => {
    if (event.target == modal) {
        modal.style.display = "none";
        document.body.classList.remove('modal-open');
    }
}

async function openModal(imdbID) {
    // Show loading state in modal if needed, or just wait
    const movie = await fetchMovieDetails(imdbID);
    if (!movie) {
        showToast("Could not load movie details", "error");
        return;
    }

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

    // Watchlist Button Logic
    let watchlistBtn = document.getElementById('modal-watchlist-btn');
    if (!watchlistBtn) {
        // Create button if it doesn't exist (it wasn't in original HTML)
        watchlistBtn = document.createElement('button');
        watchlistBtn.id = 'modal-watchlist-btn';
        watchlistBtn.classList.add('btn-watchlist-modal');
        // Insert after rating
        const ratingEl = document.querySelector('.modal-rating');
        if (ratingEl) ratingEl.after(watchlistBtn);
    }

    watchlistBtn.dataset.imdbID = movie.imdbID;
    watchlistBtn.onclick = () => toggleWatchlist(movie);
    
    const inList = appState.watchlist.some(m => m.imdbID === movie.imdbID);
    updateWatchlistButtonState(watchlistBtn, inList);

    modal.style.display = "block";
    document.body.classList.add('modal-open');
}

// --- SEARCH & DISCOVER ---

async function handleSearch(query) {
    if (!query) return;
    
    appState.currentSearch = query;
    appState.currentPage = 1;

    // Determine container
    let targetContainerId = 'new-releases';
    if (document.querySelector('.page-movies')) targetContainerId = 'movies-grid';
    if (document.querySelector('.page-tvshows')) targetContainerId = 'tvshows-grid';

    // Show Skeletons
    renderSkeletons(targetContainerId, 8);

    const results = await fetchMovies(query, appState.currentType);
    
    const container = document.getElementById(targetContainerId);
    if (container) {
        const sectionHeader = container.parentElement.querySelector('h2');
        if (sectionHeader) sectionHeader.innerText = `Results for: "${query}"`;
        
        // Store results for sorting
        appState.currentResults = results;
        
        // Check if sort exists and apply current sort
        const sortSelect = document.getElementById('sort-select');
        const criteria = sortSelect ? sortSelect.value : 'default';
        const displayMovies = sortMovies(results, criteria);

        renderMovies(displayMovies, targetContainerId);
        
        // Setup Load More
        setupLoadMore(targetContainerId, results.length > 0);

        // Hide other sections on home
        if (document.querySelector('.page-home')) {
            ['trending-movies', 'upcoming-releases'].forEach(id => {
                const el = document.getElementById(id);
                if (el && el.parentElement) el.parentElement.style.display = 'none';
            });
        }
    }
}

function setupLoadMore(containerId, hasResults) {
    // Remove existing load more button
    const existingBtn = document.querySelector('.load-more-container');
    if (existingBtn) existingBtn.remove();

    if (!hasResults) return;

    const container = document.getElementById(containerId);
    const btnContainer = document.createElement('div');
    btnContainer.classList.add('load-more-container');
    
    const btn = document.createElement('button');
    btn.classList.add('btn-load-more');
    btn.innerText = 'Load More';
    
    btn.onclick = async () => {
        btn.innerText = 'Loading...';
        appState.currentPage++;
        const query = appState.currentSearch || (document.querySelector('.page-tvshows') ? 'series' : '2024');
        const type = document.querySelector('.page-tvshows') ? 'series' : 'movie';
        
        const moreMovies = await fetchMovies(query, type, appState.currentPage);
        if (moreMovies && moreMovies.length > 0) {
            
            appState.currentResults = [...appState.currentResults, ...moreMovies];
            
            renderMovies(moreMovies, containerId, true);
            btn.innerText = 'Load More';
        } else {
            btn.innerText = 'No more results';
            btn.disabled = true;
        }
    };

    btnContainer.appendChild(btn);
    container.parentElement.appendChild(btnContainer);
}

async function discoverRandomMovie() {
    const keywords = ['Inception', 'Matrix', 'Interstellar', 'Titanic', 'Avatar', 'Gladiator', 'Joker', 'Avengers', 'Batman', 'Spiderman'];
    const randomKeyword = keywords[Math.floor(Math.random() * keywords.length)];
    
    showToast("Discovering a movie for you...");
    
    const movies = await fetchMovies(randomKeyword);
    if (movies && movies.length > 0) {
        const randomMovie = movies[Math.floor(Math.random() * movies.length)];
        openModal(randomMovie.imdbID);
    }
}

// --- HERO & INIT ---

async function updateHeroSection() {
    const heroMovies = ['Avatar', 'Interstellar', 'Dune', 'The Batman', 'Oppenheimer', 'Inception'];
    const randomTitle = heroMovies[Math.floor(Math.random() * heroMovies.length)];
    
    const movies = await fetchMovies(randomTitle);
    if (movies && movies.length > 0) {
        const movie = movies[0];
        const details = await fetchMovieDetails(movie.imdbID);
        
        if (details) {
            document.getElementById('hero-title').innerText = details.Title;
            document.getElementById('hero-description').innerText = details.Plot;
            
            // Dynamic Background
            const heroSection = document.querySelector('.hero');
            let overlay = heroSection.querySelector('.hero-bg-overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.classList.add('hero-bg-overlay');
                heroSection.prepend(overlay);
            }
            
            const highResPoster = details.Poster !== "N/A" ? details.Poster : '';
            if (highResPoster) {
                overlay.style.backgroundImage = `url('${highResPoster}')`;
                document.getElementById('hero-image').src = highResPoster;
            }

            const watchBtn = document.getElementById('hero-watch-btn');
            if (watchBtn) watchBtn.onclick = () => openModal(details.imdbID);
        }
    }
}

async function initApp() {
    console.log("Initializing Movora Premium...");

    // Search Listener
    const searchInput = document.querySelector('.search-bar input');
    if (searchInput) {
        searchInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') handleSearch(this.value);
        });
    }

    // Discover Listener
    const discoverBtn = document.getElementById('btn-discover');
    if (discoverBtn) discoverBtn.addEventListener('click', discoverRandomMovie);

    // Page Logic
    if (document.querySelector('.page-home')) {
        initHomePage();
    } else if (document.querySelector('.page-movies')) {
        appState.currentType = 'movie';
        initMoviesPage();
    } else if (document.querySelector('.page-tvshows')) {
        appState.currentType = 'series';
        initTVShowsPage();
    }

    // Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Service Worker Registered'))
            .catch(err => console.log('Service Worker Error:', err));
    }
}

async function initHomePage() {
    updateHeroSection();
    
    renderSkeletons('new-releases', 5);
    renderSkeletons('trending-movies', 5);
    renderSkeletons('upcoming-releases', 5);

    const [newReleases, trending, upcoming] = await Promise.all([
        fetchMovies('2024'),
        fetchMovies('Action'),
        fetchMovies('2025')
    ]);

    renderMovies(newReleases, 'new-releases');
    renderMovies(trending, 'trending-movies');
    renderMovies(upcoming, 'upcoming-releases');

    // Genre Pills
    const genres = document.querySelectorAll('.genre-pill');
    genres.forEach(pill => {
        pill.addEventListener('click', async () => {
            genres.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            const genre = pill.dataset.genre;
            
            renderSkeletons('new-releases', 5);
            const genreMovies = await fetchMovies(genre);
            
            const sectionHeader = document.getElementById('new-releases').parentElement.querySelector('h2');
            if (sectionHeader) sectionHeader.innerText = `${genre} Movies`;
            
            renderMovies(genreMovies, 'new-releases');
        });
    });
}

async function initMoviesPage() {
    renderSkeletons('movies-grid', 10);
    setupSortListener('movies-grid'); // Setup Sort

    const movies = await fetchMovies('2024', 'movie');
    appState.currentResults = movies; // Store state
    renderMovies(movies, 'movies-grid');
    setupLoadMore('movies-grid', true);
    appState.currentSearch = '2024'; // Default for load more

    const genres = document.querySelectorAll('.genre-pill');
    genres.forEach(pill => {
        pill.addEventListener('click', async () => {
            genres.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            const genre = pill.dataset.genre;
            
            appState.currentSearch = genre;
            appState.currentPage = 1;
            renderSkeletons('movies-grid', 10);
            
            const results = await fetchMovies(genre, 'movie');
            appState.currentResults = results; // Store state
            
            // Reset sort to default when changing genre? Or keep it? Let's keep it.
            const sortSelect = document.getElementById('sort-select');
            const criteria = sortSelect ? sortSelect.value : 'default';
            const displayMovies = sortMovies(results, criteria);

            renderMovies(displayMovies, 'movies-grid');
            setupLoadMore('movies-grid', true);
        });
    });
}

async function initTVShowsPage() {
    renderSkeletons('tvshows-grid', 10);
    setupSortListener('tvshows-grid'); // Setup Sort

    const shows = await fetchMovies('2024', 'series');
    appState.currentResults = shows; // Store state
    renderMovies(shows, 'tvshows-grid');
    setupLoadMore('tvshows-grid', true);
    appState.currentSearch = '2024';

    const genres = document.querySelectorAll('.genre-pill');
    genres.forEach(pill => {
        pill.addEventListener('click', async () => {
            genres.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            const genre = pill.dataset.genre;
            
            appState.currentSearch = genre;
            appState.currentPage = 1;
            renderSkeletons('tvshows-grid', 10);
            
            const results = await fetchMovies(genre, 'series');
            appState.currentResults = results; // Store state

            const sortSelect = document.getElementById('sort-select');
            const criteria = sortSelect ? sortSelect.value : 'default';
            const displayMovies = sortMovies(results, criteria);

            renderMovies(displayMovies, 'tvshows-grid');
            setupLoadMore('tvshows-grid', true);
        });
    });
}

document.addEventListener('DOMContentLoaded', initApp);
