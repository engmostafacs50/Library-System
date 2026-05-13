// search.js — connected to Django REST API
const API_BASE = "http://localhost:8000"; // ← change to your actual API URL

document.addEventListener("DOMContentLoaded", () => {
    const input     = document.querySelector(".search-box input");
    const searchBtn = document.querySelector(".search-btn");
    const grid      = document.querySelector(".books-grid");

    if (!grid) return;

    // ── Empty / No-results states ─────────────────────────────────────────────

    const emptyState = document.createElement("div");
    emptyState.className = "empty-state";
    emptyState.innerHTML = `
        <div class="empty-icon">📚</div>
        <p class="empty-title">Start searching to discover books</p>
        <p class="empty-sub">Search by title, author, or genre</p>
    `;
    grid.after(emptyState);

    const noResults = document.createElement("div");
    noResults.className = "empty-state hidden";
    noResults.innerHTML = `
        <div class="empty-icon">🔍</div>
        <p class="empty-title">No books found</p>
        <p class="empty-sub">Try a different title, author, or genre</p>
    `;
    emptyState.after(noResults);

    // ── Inject styles ─────────────────────────────────────────────────────────

    const style = document.createElement("style");
    style.textContent = `
        .hidden { display: none !important; }

        @keyframes cardReveal {
            from { opacity: 0; transform: translateY(12px) scale(0.97); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .card-reveal { animation: cardReveal 0.35s cubic-bezier(0.22,1,0.36,1) both; }

        .empty-state {
            display: flex; flex-direction: column;
            align-items: center; justify-content: center;
            gap: 10px; padding: 60px 24px; text-align: center;
        }
        .empty-icon  { font-size: 52px; filter: grayscale(0.3); margin-bottom: 6px; }
        .empty-title { font-size: 16px; font-weight: 600; color: rgba(226,232,240,0.85); }
        .empty-sub   { font-size: 13px; color: rgba(148,163,184,0.5); }
    `;
    document.head.appendChild(style);

    // ── Restore last search ───────────────────────────────────────────────────

    const LAST_SEARCH_KEY = "library_last_search";
    const saved = localStorage.getItem(LAST_SEARCH_KEY);
    if (saved && input) {
        input.value = saved;
        runSearch(saved);
    }

    // ── Events ────────────────────────────────────────────────────────────────

    let debounce;
    if (input) {
        input.addEventListener("input", () => {
            clearTimeout(debounce);
            debounce = setTimeout(() => runSearch(input.value.trim()), 300);
        });
        input.addEventListener("keydown", e => {
            if (e.key === "Enter") { clearTimeout(debounce); runSearch(input.value.trim()); }
        });
    }

    if (searchBtn) {
        searchBtn.addEventListener("click", () => runSearch(input?.value.trim() || ""));
    }

    // ── Core search ───────────────────────────────────────────────────────────

    async function runSearch(query) {
        if (!query) {
            grid.innerHTML = "";
            emptyState.classList.remove("hidden");
            noResults.classList.add("hidden");
            localStorage.removeItem(LAST_SEARCH_KEY);
            return;
        }

        localStorage.setItem(LAST_SEARCH_KEY, query);

        // Show loading skeleton
        grid.innerHTML = `
            <p style="color:#94a3b8;text-align:center;width:100%;padding:40px 0;">
                Searching…
            </p>`;
        emptyState.classList.add("hidden");
        noResults.classList.add("hidden");

        let books = [];
        try {
            const res = await fetch(
                `${API_BASE}/api/books/?search=${encodeURIComponent(query)}`,
                { headers: { Accept: "application/json" } }
            );
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            books = Array.isArray(data) ? data : (data.results ?? []);
        } catch (err) {
            console.error("Search failed:", err);
            grid.innerHTML = `
                <p style="color:#ef4444;text-align:center;width:100%;padding:40px 0;">
                    Search failed. Please try again.
                </p>`;
            return;
        }

        grid.innerHTML = "";

        if (books.length === 0) {
            noResults.classList.remove("hidden");
            return;
        }

        books.forEach((book, i) => {
            const card = document.createElement("a");
            card.className = "book-card card-reveal";
            card.href      = `book-details.html?id=${book.id}`;
            card.style.animationDelay = `${i * 50}ms`;
            card.dataset.category = (book.genre || "").toLowerCase();

            // Image: base64 data-URL stored in API, or emoji fallback
            const cover = book.image
                ? `<img src="${book.image}" alt="${escapeHtml(book.title)}"
                       onerror="this.src='../assets/images/default-book.jpg'">`
                : `<div class="cover-placeholder">📖<small>${escapeHtml(book.genre || "")}</small></div>`;

            const badgeStatus = book.status === "available"
                ? `<span class="badge badge-available">Available</span>`
                : `<span class="badge badge-borrowed">Borrowed</span>`;

            card.innerHTML = `
                ${cover}
                <div class="book-info">
                    <div class="book-title">${escapeHtml(book.title)}</div>
                    <div class="book-author">${escapeHtml(book.author)}</div>
                    <div class="badges">
                        <span class="badge badge-genre">${escapeHtml(book.genre || "General")}</span>
                        ${badgeStatus}
                    </div>
                </div>`;

            grid.appendChild(card);
        });
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    function escapeHtml(str) {
        if (!str) return "";
        return String(str).replace(/[&<>"']/g, ch =>
            ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
    }
});