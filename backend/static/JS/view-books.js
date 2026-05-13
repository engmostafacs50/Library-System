// view-books.js  —  connected to Django REST API
const API_BASE = "http://localhost:8000"; // ← change to your actual API URL

document.addEventListener("DOMContentLoaded", () => {
    // Handle ?category= query param (sets the dropdown before first render)
    const params           = new URLSearchParams(window.location.search);
    const selectedCategory = params.get("category");
    const categorySelect   = document.getElementById("select-by-category");

    if (selectedCategory && categorySelect) {
        categorySelect.value = selectedCategory;
    }

    renderBooks();

    if (categorySelect) {
        categorySelect.addEventListener("change", renderBooks);
    }
});

async function renderBooks() {
    const container      = document.getElementById("booksContainer");
    const categorySelect = document.getElementById("select-by-category");
    if (!container) return;

    // Show loading state
    container.innerHTML = `
        <p style="color:#94a3b8;text-align:center;width:100%;padding:40px 0;">
            Loading books…
        </p>`;

    const selectedValue = categorySelect?.value || "all";

    // Build API URL — use genre endpoint when a category is selected
    let url;
    if (selectedValue !== "all") {
        url = `${API_BASE}/api/books/genre/${encodeURIComponent(selectedValue)}/`;
    } else {
        url = `${API_BASE}/api/books/`;
    }

    let books;
    try {
        const res = await fetch(url, {
            headers: { "Accept": "application/json" },
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();

        // DRF paginated response has a `results` key; plain list does not
        books = Array.isArray(data) ? data : (data.results ?? []);
    } catch (err) {
        console.error("Failed to fetch books:", err);
        container.innerHTML = `
            <p style="color:#ef4444;text-align:center;width:100%;padding:40px 0;">
                Could not load books. Please try again later.
            </p>`;
        return;
    }

    if (books.length === 0) {
        container.innerHTML = `
            <p style="color:#94a3b8;text-align:center;width:100%;">
                No books found in this category.
            </p>`;
        return;
    }

    container.innerHTML = books.map(book => {
        // image is stored as a base64 data-URL string in your TextField
        const imgSrc = book.image
            ? book.image                                    // base64 data-URL
            : "../assets/images/default-book.jpg";         // fallback

        const availableColor = book.status === "available" ? "#22c55e" : "#ef4444";
        const statusLabel    = book.status === "available" ? "✓ Available" : "✗ Borrowed";

        return `
            <a href="book-details.html?id=${book.id}" class="book-card"
               data-category="${escapeHtml(book.genre?.toLowerCase() || "")}">
                <img src="${imgSrc}" alt="${escapeHtml(book.title)}"
                     onerror="this.src='../assets/images/default-book.jpg'">
                <div class="book-info">
                    <h3>${escapeHtml(book.title)}</h3>
                    <p style="font-size:0.8rem;color:#94a3b8;margin:2px 0 6px;">
                        ${escapeHtml(book.author)}
                    </p>
                    <span class="tag">${escapeHtml(book.genre || "General")}</span>
                    <p style="font-size:0.7rem;color:${availableColor};margin-top:8px;">
                        ${statusLabel}
                    </p>
                </div>
            </a>`;
    }).join("");
}

// ── helpers ──────────────────────────────────────────────────────────────────

function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/[&<>"']/g, ch => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[ch]));
}