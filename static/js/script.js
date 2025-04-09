// later: make function that removes leading/trailing whitespace and lowercases the user input. etc etc.
document.addEventListener('DOMContentLoaded', () => {
    console.log('Loaded')
    document.getElementById("search").addEventListener('click', search)  // takes no args rn, but boxes checked off would be what gets passed in later
    document.getElementById("toggle-filter").addEventListener('click', toggleFilters) // no () bc i am not calling immediately. we must wait patiently 
})

function toggleFilters() {
    let state = document.getElementById("advanced-search")

    // console.log(getComputedStyle(state).display)
    getComputedStyle(state).display === "none" ? state.style.display = "flex" : state.style.display = "none"
    // style.display changes the inline styling. get computed sees what the computed style is, which can be from css file or inline
}


// in most cases, the content we want to see is in the body of the response
// the body is not visible when printing response or .body. It must be processed/parsed
// the body is all of our data, but it is not accessible directly from the response object. so we need to use a method on it to convert it to wtvr
// async function apiCall() {
//     // base URL: http://export.arxiv.org/api/{method_name}?{parameters} | then i add details
//     // query seems to be the only method
//     const response = await fetch('https://export.arxiv.org/api/query?search_query=au:hawking&max_results=2')
//     const data = await response.text()
//     // .json() does not work because the response is XML
//     // console.log(response)
//     console.log(data)

// }

async function search() {
    const query = document.getElementById('search-query').value;
    // const maxResults = document.getElementById('maxResults').value;
    const maxResults = 10;

    try {
        const response = await fetch(`/search?search_query=${query}&max_results=${maxResults}`);
        const articles = await response.json();

        // Clear previous results
        const resultsContainer = document.getElementById('results');
        resultsContainer.innerHTML = '';

        // Display new results
        if (articles.length === 0) {
            resultsContainer.innerHTML = '<p>No articles found.</p>';
        } else {
            articles.forEach(article => {
                const articleElement = document.createElement('div');
                articleElement.classList.add('article');

                articleElement.innerHTML = `
                    <h3><a href="${article.link}" target="_blank">${article.title}</a></h3>
                    <p><strong>Authors:</strong> <span class="authors">${article.authors.join(', ')}</span></p>
                    <p><strong>Summary:</strong> ${article.summary}</p>
                `;
                //console.log(articleElement)
                resultsContainer.appendChild(articleElement);
            });
        }
    } catch (error) {
        console.error('Error fetching articles:', error);
        const resultsContainer = document.getElementById('results');
        resultsContainer.innerHTML = '<p>There was an error fetching the data.</p>';
    }
    
}

// search_query appears in the url once, with +AND+ being used for logic to eventualyl create one long singular search_query parameter. & seperates paramaters, such as max_results from the whole search_query
// max_results is always 10 (if we want). we increment start by 10
