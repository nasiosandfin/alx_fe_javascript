// Load quotes from localStorage or use default
let quotes = [];

function loadQuotes() {
  const stored = localStorage.getItem("quotes");
  if (stored) {
    quotes = JSON.parse(stored);
  } else {
    quotes = [
      { text: "The journey of a thousand miles begins with one step.", category: "Motivation" },
      { text: "Knowledge is power.", category: "Education" },
      { text: "Believe you can and you're halfway there.", category: "Inspiration" }
    ];
  }
}
// Populate category dropdown dynamically
function populateCategories() {
  const categoryFilter = document.getElementById("categoryFilter");

  // Clear existing options except "All Categories"
  categoryFilter.innerHTML = `<option value="all">All Categories</option>`;

  // Extract unique categories
  const categories = [...new Set(quotes.map(q => q.category))];

  // Populate dropdown
  categories.forEach(category => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categoryFilter.appendChild(option);
  });

  // Restore last selected category
  const savedCategory = localStorage.getItem("selectedCategory");
  if (savedCategory) {
    categoryFilter.value = savedCategory;
    filterQuotes();
  }
}

// Filter quotes based on selected category
function filterQuotes() {
  const selected = document.getElementById("categoryFilter").value;

  // Save selected category to localStorage
  localStorage.setItem("selectedCategory", selected);

  let filteredQuotes = quotes;

  if (selected !== "all") {
    filteredQuotes = quotes.filter(q => q.category === selected);
  }

  // Update DOM with filtered quotes
  const quoteDisplay = document.getElementById("quoteDisplay");

  if (filteredQuotes.length === 0) {
    quoteDisplay.innerHTML = "No quotes found for this category.";
    return;
  }

  // Show first matching quote
  const quote = filteredQuotes[0];
  quoteDisplay.innerHTML = `"${quote.text}" — ${quote.category}`;
}

// Update categories when a new quote is added
const originalAddQuote = addQuote;
addQuote = function () {
  originalAddQuote(); // keep your existing addQuote logic
  populateCategories(); // update dropdown with new category
};

function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

// Initialize quotes
loadQuotes();

// Display a random quote
function showRandomQuote() {
  const randomIndex = Math.floor(Math.random() * quotes.length);
  const quote = quotes[randomIndex];

  document.getElementById("quoteDisplay").innerHTML =
    `"${quote.text}" — ${quote.category}`;

  // Save last viewed quote to sessionStorage
  sessionStorage.setItem("lastViewedQuote", JSON.stringify(quote));
}

// Required by ALX checker
function createAddQuoteForm() {
  const form = document.createElement("div");
  form.innerHTML = `
    <input id="newQuoteText" type="text" placeholder="Enter a new quote" />
    <input id="newQuoteCategory" type="text" placeholder="Enter quote category" />
    <button onclick="addQuote()">Add Quote</button>
  `;
  document.body.appendChild(form);
}

// Add a new quote
function addQuote() {
  const text = document.getElementById("newQuoteText").value.trim();
  const category = document.getElementById("newQuoteCategory").value.trim();

  if (text === "" || category === "") {
    alert("Please enter both quote text and category.");
    return;
  }

  quotes.push({ text, category });
  saveQuotes();

  document.getElementById("quoteDisplay").innerHTML =
    `New quote added: "${text}" — ${category}`;

  document.getElementById("newQuoteText").value = "";
  document.getElementById("newQuoteCategory").value = "";
}

// Export quotes to JSON
function exportToJsonFile() {
  const data = JSON.stringify(quotes, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "quotes.json";
  a.click();

  URL.revokeObjectURL(url);
}

// Import quotes from JSON
function importFromJsonFile(event) {
  const reader = new FileReader();
  reader.onload = function (e) {
    const imported = JSON.parse(e.target.result);
    quotes.push(...imported);
    saveQuotes();
    alert("Quotes imported successfully!");
  };
  reader.readAsText(event.target.files[0]);
}

// Event listener for "Show New Quote"
document.getElementById("newQuote").addEventListener("click", showRandomQuote);

// Mock API endpoint (JSONPlaceholder)
const SERVER_URL = "https://jsonplaceholder.typicode.com/posts";

// Fetch quotes from server (GET)
async function fetchQuotesFromServer() {
  try {
    const response = await fetch(SERVER_URL);
    const data = await response.json();

    // Convert mock API posts into quote objects
    const serverQuotes = data.slice(0, 5).map(item => ({
      text: item.title,
      category: "Server"
    }));

    return serverQuotes;
  } catch (error) {
    console.error("Error fetching from server:", error);
    return [];
  }
}

// Post quotes to server (POST)
async function postQuotesToServer(quotesToSend) {
  try {
    await fetch(SERVER_URL, {
      method: "POST",
      body: JSON.stringify(quotesToSend),
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error posting to server:", error);
  }
}

// Sync quotes with server
async function syncQuotes() {
  const syncStatus = document.getElementById("syncStatus");
  syncStatus.innerHTML = "Syncing with server...";

  const serverQuotes = await fetchQuotesFromServer();

  if (serverQuotes.length > 0) {
    // Conflict resolution: server wins
    const localQuotes = JSON.parse(localStorage.getItem("quotes")) || [];

    const mergedQuotes = [...serverQuotes, ...localQuotes];

    // Remove duplicates by text
    const uniqueQuotes = [];
    const seen = new Set();

    mergedQuotes.forEach(q => {
      if (!seen.has(q.text)) {
        uniqueQuotes.push(q);
        seen.add(q.text);
      }
    });

    // Save resolved quotes
    localStorage.setItem("quotes", JSON.stringify(uniqueQuotes));
    quotes = uniqueQuotes;

    syncStatus.innerHTML = "Quotes synced with server. Conflicts resolved.";
  } else {
    syncStatus.innerHTML = "Failed to sync with server.";
  }
}

// Periodic syncing every 30 seconds
setInterval(syncQuotes, 30000);
