/* ========================
   Load Terms from JSON
======================== */
let terms = [];

async function loadTerms() {
  try {
    const res = await fetch('terms.json', { cache: 'no-store' });
    terms = await res.json();
    populateCategories();
    setWordOfTheDay();
    displayTerms();
  } catch (err) {
    console.error("Error loading terms:", err);
    document.getElementById("termList").innerHTML = "<p>Couldn't load terms.</p>";
  }
}

/* ========================
   Elements
======================== */
const termList = document.getElementById('termList');
const searchBar = document.getElementById('searchBar');
const categoryFilter = document.getElementById('categoryFilter');
const wotdBox = document.getElementById('wotd');
const historyList = document.getElementById('searchHistory');

/* ========================
   Categories
======================== */
function populateCategories() {
  const categories = [...new Set(terms.map(t => t.category).filter(Boolean))].sort();
  categoryFilter.innerHTML = `<option value="">All</option>`;
  categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    categoryFilter.appendChild(opt);
  });
}

/* ========================
   Highlight matches
======================== */
function highlightMatch(text, query) {
  if (!query) return text;
  return text.replace(new RegExp(`(${query})`, 'gi'), '<mark>$1</mark>');
}

/* ========================
   Display Terms
======================== */
function displayTerms() {
  const searchQuery = (searchBar.value || '').toLowerCase();
  const selectedCategory = categoryFilter.value;

  const filtered = terms.filter(term => {
    const matchesCategory = selectedCategory === '' || term.category === selectedCategory;
    const matchesSearch =
      term.name.toLowerCase().includes(searchQuery) ||
      (term.definition || '').toLowerCase().includes(searchQuery) ||
      (term.example || '').toLowerCase().includes(searchQuery);
    return matchesCategory && matchesSearch;
  });

  termList.innerHTML = '';

  if (filtered.length === 0) {
    termList.innerHTML = '<p>No terms found.</p>';
    return;
  }

  filtered.forEach(term => {
    const card = document.createElement('div');
    card.className = 'term';
    card.innerHTML = `
      <h2>${highlightMatch(term.name, searchQuery)}</h2>
      <p><strong>Category:</strong> ${term.category || '—'}</p>
      <p><strong>Definition:</strong> ${highlightMatch(term.definition || '—', searchQuery)}</p>
      ${term.example ? `<p><strong>Example:</strong> ${highlightMatch(term.example, searchQuery)}</p>` : ''}
      ${term.formula ? `<p><strong>Formula:</strong> ${term.formula}</p>` : ''}
    `;
    termList.appendChild(card);
  });
}

/* ========================
   Search History (localStorage)
======================== */
function saveSearchHistory(query) {
  if (!query) return;
  let history = JSON.parse(localStorage.getItem('searchHistory')) || [];
  // remove exact duplicate (case-insensitive)
  history = history.filter(item => item.toLowerCase() !== query.toLowerCase());
  // add to front
  history.unshift(query);
  // keep only 5
  history = history.slice(0, 5);
  localStorage.setItem('searchHistory', JSON.stringify(history));
}

function showSearchHistory(currentQuery) {
  const history = JSON.parse(localStorage.getItem('searchHistory')) || [];
  if (!searchBar.matches(':focus') || !history.length) {
    historyList.style.display = 'none';
    return;
  }

  // filter by what user typed
  const toShow = history.filter(item =>
    item.toLowerCase().includes((currentQuery || '').toLowerCase())
  );

  if (!toShow.length) {
    historyList.style.display = 'none';
    return;
  }

  historyList.innerHTML = '';
  toShow.forEach(item => {
    const li = document.createElement('li');
    li.textContent = item;
    li.onclick = () => {
      searchBar.value = item;
      displayTerms();
      historyList.style.display = 'none';
    };
    historyList.appendChild(li);
  });

  historyList.style.display = 'block';
}

/* ========================
   Word of the Day (stable per day)
======================== */
function setWordOfTheDay() {
  if (!terms.length) return;

  const todayKey = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const saved = JSON.parse(localStorage.getItem('wotd')) || {};
  let pick;

  if (saved.date === todayKey && saved.name) {
    pick = terms.find(t => t.name === saved.name) || terms[0];
  } else {
    const rand = Math.floor(Math.random() * terms.length);
    pick = terms[rand];
    localStorage.setItem('wotd', JSON.stringify({ date: todayKey, name: pick.name }));
  }

  wotdBox.innerHTML = `
    <h3>📌 Word of the Day</h3>
    <p><strong>${pick.name}</strong></p>
    <p>${pick.definition || ''}</p>
    ${pick.example ? `<p><em>Example:</em> ${pick.example}</p>` : ''}
  `;
}

/* ========================
   Event Listeners
======================== */
searchBar.addEventListener('input', () => {
  const q = searchBar.value.trim();
  saveSearchHistory(q);
  displayTerms();
  showSearchHistory(q);
});

searchBar.addEventListener('focus', () => {
  showSearchHistory(searchBar.value.trim());
});

// hide dropdown when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.search-container')) {
    historyList.style.display = 'none';
  }
});

categoryFilter.addEventListener('change', displayTerms);

/* ========================
   Service Worker (offline)
   Change './sw.js' to your filename if needed.
======================== */
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js')
    .then((reg) => {
      console.log("Service worker registered ✅", reg);
    })
    .catch((err) => {
      console.log("Service worker failed ❌", err);
    });
}

/* ========================
   Start!
======================== */
loadTerms();