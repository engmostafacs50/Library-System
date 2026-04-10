const BOOKS = [
  {
    title:  "Clean Code",
    author: "Robert C. Martin",
    genre:  "Programming",
    status: "available",
    image:  "../assets/images/clean-code.jpg",
    link:   "book-details.html"
  },
  {
    title:  "The Pragmatic Programmer",
    author: "Andrew Hunt",
    genre:  "Programming",
    status: "available",
    image:  "../assets/images/The Pragmatic Programmer.png",
    link:   "book-details.html"
  },
  {
    title:  "Design Patterns",
    author: "Gang of Four",
    genre:  "Programming",
    status: "borrowed",
    image:  "../assets/images/design-pattern.jpg",
    link:   "book-details.html"
  },
  {
    title:  "1984",
    author: "George Orwell",
    genre:  "Fiction",
    status: "available",
    image:  null,
    emoji:  "📖",
    link:   "book-details.html"
  },
  {
    title:  "Dune",
    author: "Frank Herbert",
    genre:  "Sci-Fi",
    status: "available",
    image:  null,
    emoji:  "🏜️",
    link:   "book-details.html"
  },
  {
    title:  "Thinking, Fast and Slow",
    author: "Daniel Kahneman",
    genre:  "Psychology",
    status: "borrowed",
    image:  null,
    emoji:  "🧠",
    link:   "book-details.html"
  },

  /* ── TO ADD A NEW BOOK, copy and paste this block: ──
  {
    title:  "Your Book Title",
    author: "Author Name",
    genre:  "Genre",
    status: "available",   // or "borrowed"
    image:  null,          // or "../assets/images/your-image.jpg"
    emoji:  "📗",
    link:   "book-details.html"
  },
  */
];


/* ============================================================
   ⚙️  ENGINE — no need to edit anything below this line
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {

  const input     = document.querySelector(".search-box input");
  const searchBtn = document.querySelector(".search-btn");
  const grid      = document.querySelector(".books-grid");
  const STORAGE_KEY = "library_last_search";

  /* ── Render all books into the grid ── */
  function renderBooks() {
    grid.innerHTML = "";
    BOOKS.forEach(book => {
      const card = document.createElement("a");
      card.className  = "book-card hidden";
      card.href       = book.link;

      const cover = book.image
        ? `<img src="${book.image}" alt="${book.title}">`
        : `<div class="cover-placeholder">
             ${book.emoji}
             <small>${book.genre}</small>
           </div>`;

      const badgeStatus = book.status === "available"
        ? `<span class="badge badge-available">✓ Available</span>`
        : `<span class="badge badge-borrowed">⏳ Borrowed</span>`;

      card.innerHTML = `
        ${cover}
        <div class="book-info">
          <div class="book-title">${book.title}</div>
          <div class="book-author">${book.author}</div>
          <div class="badges">
            <span class="badge badge-genre">${book.genre}</span>
            ${badgeStatus}
          </div>
        </div>
      `;

      grid.appendChild(card);
    });
  }

  /* ── Empty state ── */
  const emptyState = document.createElement("div");
  emptyState.className = "empty-state";
  emptyState.innerHTML = `
    <div class="empty-icon">📚</div>
    <p class="empty-title">Start searching to discover books</p>
    <p class="empty-sub">Search by title, author, or genre</p>
  `;
  grid.after(emptyState);

  /* ── No results ── */
  const noResults = document.createElement("div");
  noResults.className = "empty-state hidden";
  noResults.innerHTML = `
    <div class="empty-icon">🔍</div>
    <p class="empty-title">No books found</p>
    <p class="empty-sub">Try a different title, author, or genre</p>
  `;
  emptyState.after(noResults);

  /* ── Search logic ── */
  function runSearch() {
    const query = input.value.trim().toLowerCase();
    localStorage.setItem(STORAGE_KEY, input.value.trim());

    const cards = grid.querySelectorAll(".book-card");

    if (!query) {
      cards.forEach(card => card.classList.add("hidden"));
      emptyState.classList.remove("hidden");
      noResults.classList.add("hidden");
      return;
    }

    let visible = 0;
    cards.forEach(card => {
      const title  = card.querySelector(".book-title")?.textContent.toLowerCase()  || "";
      const author = card.querySelector(".book-author")?.textContent.toLowerCase() || "";
      const genres = [...card.querySelectorAll(".badge-genre")]
                       .map(b => b.textContent.toLowerCase()).join(" ");

      const match = title.includes(query) || author.includes(query) || genres.includes(query);

      if (match) {
        card.classList.remove("hidden");
        card.classList.add("card-reveal");
        visible++;
      } else {
        card.classList.add("hidden");
        card.classList.remove("card-reveal");
      }
    });

    emptyState.classList.add("hidden");
    noResults.classList.toggle("hidden", visible > 0);
  }

  /* ── Event listeners ── */
  searchBtn.addEventListener("click", runSearch);
  input.addEventListener("keydown", e => { if (e.key === "Enter") runSearch(); });
  input.addEventListener("input", () => {
    if (input.value.trim() === "") localStorage.removeItem(STORAGE_KEY);
    runSearch();
  });

  /* ── Init ── */
  renderBooks();

  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    input.value = saved;
    runSearch();
  }

  /* ── Companion CSS ── */
  const style = document.createElement("style");
  style.textContent = `
    .hidden { display: none !important; }

    @keyframes cardReveal {
      from { opacity: 0; transform: translateY(12px) scale(0.97); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
    .card-reveal { animation: cardReveal 0.35s cubic-bezier(0.22, 1, 0.36, 1) both; }

    .empty-state {
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      gap: 10px; padding: 60px 24px; text-align: center;
    }
    .empty-icon { font-size: 52px; filter: grayscale(0.3); margin-bottom: 6px; }
    .empty-title { font-size: 16px; font-weight: 600; color: rgba(226,232,240,0.85); }
    .empty-sub { font-size: 13px; color: rgba(148,163,184,0.5); }
  `;
  document.head.appendChild(style);
});