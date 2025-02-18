const apiKey = '4bb505a44d679717fbf255881a7c138e'; // Your API key

document.getElementById('searchButton').addEventListener('click', async () => {
    const query = document.getElementById('searchInput').value.trim();
    
    if (query === '') {
        alert('Please enter a movie or series name!');
        return;
    }

    // Encode query to handle special characters
    const apiUrl = `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(query)}&api_key=${apiKey}`;

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error('Network response was not ok'); // Added error handling for network issues
        }
        const data = await response.json();
        
        displayResults(data.results); // Call function to show results
    } catch (error) {
        console.error('Error fetching data:', error);
        document.getElementById('result').innerHTML = '<p>Something went wrong! Try again.</p>';
    }
});

function displayResults(movies) {
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = ''; // Clear previous results

    if (!movies || movies.length === 0) {
        resultDiv.innerHTML = '<p>No results found!</p>';
        return;
    }

    movies.forEach(movie => { // Loop through all movies instead of showing only one
        const movieCard = document.createElement('div');
        movieCard.classList.add('movie-card'); // Added CSS class for styling
        //set background image to the movie poster
        movieCard.style.backgroundImage = movie.poster_path 
            ? `url('https://image.tmdb.org/t/p/w500${movie.poster_path}')`
            : `url('placeholder.jpg')`; // Added placeholder image for movies without a poster

        movieCard.innerHTML = `
            <img class="movie-poster" src="https://image.tmdb.org/t/p/w500${movie.poster_path}" alt="${movie.title}">
            <div class="movie-info">
                <h3>${movie.title} (${movie.release_date ? movie.release_date.slice(0, 4) : 'N/A'})</h3>
                <p>${movie.overview ? movie.overview.slice(0, 100) + '...' : 'No description available.'}</p>
                <a href="https://www.themoviedb.org/movie/${movie.id}" target="_blank" class="details-link">View More</a>
            </div>
        `;

        resultDiv.appendChild(movieCard); // Append each movie to the result div
    });
}
