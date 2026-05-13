// book-details.js — connected to Django REST API
const API_BASE = "http://localhost:8000"; // ← change to your actual API URL

function authHeaders(extra = {}) {
    const token = localStorage.getItem("authToken");
    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Token ${token}` } : {}),
        ...extra,
    };
}

// ── Bootstrap ────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    if (!id) {
        showError("No book ID provided.");
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/api/books/${id}/`, {
            headers: { Accept: "application/json" },
        });

        if (res.status === 404) { showError("Book not found."); return; }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const book = await res.json();
        renderBook(book);

    } catch (err) {
        console.error("Failed to load book:", err);
        showError("Could not load book details. Please try again later.");
    }
});

// ── Render ───────────────────────────────────────────────────────────────────

function renderBook(book) {
    // Image
    const img = document.getElementById("bookImage");
    if (img) {
        img.src = book.image || "../assets/images/default-book.jpg";
        img.alt = book.title;
        img.onerror = () => { img.src = "../assets/images/default-book.jpg"; };
    }

    setText("title",       "Book Title: " + book.title);
    setText("author",      book.author);
    setText("category",    book.genre);
    setText("description", book.description || "No description available.");

    // Borrow/Return button logic
    const borrowBtn = document.querySelector(".btn-outline");
    if (!borrowBtn) return;

    const session       = getSessionSafe();
    const borrowedList  = session?.borrowedList || [];
    const alreadyBorrowed = borrowedList.some(b => String(b.id) === String(book.id));

    updateStatusUI(alreadyBorrowed ? "borrowed" : book.status, borrowBtn);

    borrowBtn.onclick = () => handleBorrowReturn(book, borrowBtn, session);
}

// ── Borrow / Return ───────────────────────────────────────────────────────────

async function handleBorrowReturn(book, btn, session) {
    if (!session) {
        alert("You must be logged in to borrow books.");
        window.location.href = "../pages/login.html";
        return;
    }

    session.borrowedList  = session.borrowedList  || [];
    session.returnedList  = session.returnedList  || [];
    session.totalBorrowed = session.totalBorrowed || 0;

    const isCurrentlyBorrowed = session.borrowedList.some(
        b => String(b.id) === String(book.id)
    );

    if (isCurrentlyBorrowed) {
        // ── Return ──
        if (!confirm(`Return "${book.title}"?`)) return;

        try {
            const res = await fetch(`${API_BASE}/api/books/${book.id}/`, {
                method:  "PATCH",
                headers: authHeaders(),
                body:    JSON.stringify({ status: "available" }),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
        } catch (err) {
            console.warn("Could not update book status on server:", err);
            // Continue with local update anyway
        }

        const today     = new Date().toISOString().split("T")[0];
        const bookEntry = session.borrowedList.find(b => String(b.id) === String(book.id));
        session.borrowedList = session.borrowedList.filter(b => String(b.id) !== String(book.id));
        session.returnedList.push({ ...bookEntry, returnDate: today });
        session.returnedCount = session.returnedList.length;

        saveSession(session);
        updateStatusUI("available", btn);

    } else {
        // ── Borrow ──
        if (book.status !== "available") {
            alert("This book is currently not available.");
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/api/books/${book.id}/`, {
                method:  "PATCH",
                headers: authHeaders(),
                body:    JSON.stringify({ status: "borrowed" }),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
        } catch (err) {
            console.warn("Could not update book status on server:", err);
        }

        const today   = new Date();
        const fmt     = d => d.toISOString().split("T")[0];
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 7);

        session.borrowedList.push({
            id:    book.id,
            title: book.title,
            date:  fmt(today),
            due:   fmt(dueDate),
        });
        session.totalBorrowed++;

        saveSession(session);
        updateStatusUI("borrowed", btn);
    }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text || "";
}

function updateStatusUI(bookStatus, btn) {
    const statusEl = document.getElementById("status");
    if (statusEl) statusEl.textContent = bookStatus;
    if (btn) btn.textContent = bookStatus === "borrowed" ? "Return Book" : "Borrow Book";
}

function showError(msg) {
    document.body.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;
                    height:60vh;font-family:'Segoe UI',sans-serif;color:#ef4444;">
            <h2>${msg}</h2>
        </div>`;
}

function getSessionSafe() {
    try { return getSession(); }
    catch { return JSON.parse(localStorage.getItem("session") || "null"); }
}

function saveSession(session) {
    try { /* use your existing saveSession if available */ }
    catch {}
    localStorage.setItem("session", JSON.stringify(session));
}