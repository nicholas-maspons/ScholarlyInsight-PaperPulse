// Import Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, query, where, serverTimestamp, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBT7dz8IbhA4qvRvoUNngxGrifczYsOGpA",
  authDomain: "scholarlyinsight-paperpulse.firebaseapp.com",
  projectId: "scholarlyinsight-paperpulse",
  storageBucket: "scholarlyinsight-paperpulse.firebasestorage.app",
  messagingSenderId: "689451064267",
  appId: "1:689451064267:web:8231f66811640fb896744e",
  measurementId: "G-ED3WDV2Q12"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

//---------------------------------------------------
// Page Loaded - Add Event Listeners
//---------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  console.log('Loaded');

  document.getElementById("all-prefix").addEventListener('click', allButton);
  document.getElementById("search").addEventListener('click', search);
  document.getElementById("toggle-filter").addEventListener('click', toggleFilters);

  const prefixBoxes = document.getElementsByName("prefix");
  for (const box of prefixBoxes) {
    if (box.id !== "all-prefix") {
      box.addEventListener('click', prefixFilter);
    }
  }

  const loginButton = document.getElementById("login-button");
  if (loginButton) {
    loginButton.addEventListener('click', loginUser);
  }

  onAuthStateChanged(auth, (user) => {
    const navLinks = document.getElementById('nav-links');
    navLinks.innerHTML = '';

    if (user) {
      console.log("User signed in:", user.email);
      navLinks.innerHTML = `
        <li><a class="button" href="/">Home</a></li>
        <li><a class="button" id="logout-button">Logout</a></li>
      `;
      document.getElementById("logout-button").addEventListener('click', logoutUser);

      loadFavorites(user.uid);
    } else {
      console.log("No user signed in.");
      navLinks.innerHTML = `
        <li><a class="button" href="/">Home</a></li>
        <li><a class="button" id="signup-button">Sign Up</a></li>
      `;
      document.getElementById("signup-button").addEventListener('click', signupUser);
    }
  });
});

//---------------------------------------------------
// Firebase Authentication Functions
//---------------------------------------------------
async function loginUser() {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  try {
    await signInWithEmailAndPassword(auth, email, password);
    alert("Logged in successfully!");
    window.location.reload();
  } catch (error) {
    console.error("Login error:", error);
    alert("Login failed: " + error.message);
  }
}

async function signupUser() {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  try {
    await createUserWithEmailAndPassword(auth, email, password);
    alert("Account created!");
    window.location.reload();
  } catch (error) {
    console.error("Signup error:", error);
    alert("Sign up failed: " + error.message);
  }
}

async function logoutUser() {
  try {
    await signOut(auth);
    alert("Signed out successfully.");
    window.location.reload();
  } catch (error) {
    console.error("Sign-out error:", error);
  }
}

//---------------------------------------------------
// UI Helpers
//---------------------------------------------------
function prefixFilter() {
  if (document.getElementById('all-prefix').checked) {
    document.getElementById('all-prefix').checked = false;
  }
}

function allButton() {
  if (document.getElementById("all-prefix").checked) {
    const options = document.getElementsByName("prefix");
    for (let i = 0; i < options.length - 1; i++) {
      if (options[i].checked) {
        options[i].checked = false;
      }
    }
  }
}

function toggleFilters() {
  let state = document.getElementById("advanced-search");
  getComputedStyle(state).display === "none" ? state.style.display = "flex" : state.style.display = "none";
}

//---------------------------------------------------
// Search and Save/Remove Functions
//---------------------------------------------------
async function search() {
  const input = document.getElementById('search-query').value;
  const maxResults = 10;
  const term_filters = document.getElementsByName("prefix");
  var param = 'all:None';

  if (input !== '') {
    param = '';
    if (term_filters[term_filters.length-1].checked) {
      for (let i = 0; i < term_filters.length-1; i++) {
        param += (i === term_filters.length-2) ? `${term_filters[i].value}:${input}` : `${term_filters[i].value}:${input}+AND+`;
      }
    } else {
      for (let i = 0; i < term_filters.length-1; i++) {
        if (term_filters[i].checked) {
          param += `${term_filters[i].value}:${input}`;
        }
      }
    }
  }

  try {
    const response = await fetch(`/search?search_query=${param}&max_results=${maxResults}`);
    const articles = await response.json();

    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = '';

    if (articles.length === 0) {
      resultsContainer.innerHTML = '<p>No articles found.</p>';
    } else {
      articles.forEach(article => {
        const articleElement = document.createElement('div');
        articleElement.classList.add('article');

        articleElement.innerHTML = `
          <div class="article-header">
            <h3><a href="${article.link}" target="_blank">${article.title}</a></h3>
            <span class="star" title="Save to favorites">&#9733;</span>
          </div>
          <p><strong>Authors:</strong> <span class="authors">${article.authors.join(', ')}</span></p>
          <p><strong>Summary:</strong> ${article.summary}</p>
        `;

        const starButton = articleElement.querySelector('.star');
        starButton.addEventListener('click', (e) => saveFavorite(article, e.target));

        resultsContainer.appendChild(articleElement);
      });
    }
  } catch (error) {
    console.error('Error fetching articles:', error);
    document.getElementById('results').innerHTML = '<p>There was an error fetching the data.</p>';
  }
}

async function saveFavorite(article, starElement) {
  const user = auth.currentUser;
  if (!user) {
    alert("⚠️ You must be signed in to save articles.");
    return;
  }

  try {
    const favQuery = query(
      collection(db, "favorites"),
      where("uid", "==", user.uid),
      where("link", "==", article.link)
    );
    const favSnapshot = await getDocs(favQuery);

    if (!favSnapshot.empty) {
      favSnapshot.forEach(async (docItem) => {
        await deleteDoc(doc(db, "favorites", docItem.id));
      });

      if (starElement) {
        starElement.style.color = "black";
      }

    } else {
      await addDoc(collection(db, "favorites"), {
        uid: user.uid,
        title: article.title,
        link: article.link,
        authors: article.authors,
        summary: article.summary,
        savedAt: serverTimestamp()
      });

      if (starElement) {
        starElement.style.color = "gold";
      }
    }
  } catch (error) {
    console.error("Error saving/removing favorite:", error);
    alert("Operation failed.");
  }
}

async function loadFavorites(uid) {
  try {
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = '<p>Loading your saved articles...</p>';

    const favQuery = query(collection(db, "favorites"), where("uid", "==", uid));
    const favSnapshot = await getDocs(favQuery);

    if (favSnapshot.empty) {
      resultsContainer.innerHTML = '<p>You have no saved articles yet.</p>';
      return;
    }

    resultsContainer.innerHTML = '';
    favSnapshot.forEach(docItem => {
      const data = docItem.data();

      const articleElement = document.createElement('div');
      articleElement.classList.add('article');

      articleElement.innerHTML = `
        <div class="article-header">
          <h3><a href="${data.link}" target="_blank">${data.title}</a></h3>
          <button class="remove-btn" style="margin-left: 10px;">🗑 Remove</button>
        </div>
        <p><strong>Authors:</strong> <span class="authors">${data.authors.join(', ')}</span></p>
        <p><strong>Summary:</strong> ${data.summary}</p>
      `;

      const removeButton = articleElement.querySelector('.remove-btn');
      removeButton.addEventListener('click', async () => {
        await deleteDoc(doc(db, "favorites", docItem.id));
        articleElement.remove();
      });

      resultsContainer.appendChild(articleElement);
    });
  } catch (error) {
    console.error('Error loading favorites:', error);
    document.getElementById('results').innerHTML = '<p>Error loading your favorites.</p>';
  }
}
