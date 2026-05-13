const API_RETURN = "/api/return/";
const API_BORROW = "/api/borrow/";

// ── Helpers ──────────────────────────────────────────────────────────────────
function show(id) { document.getElementById(id).style.display = "block"; }
function hide(id) { document.getElementById(id).style.display = "none";  }

function conditionBadge(condition) {
    const map = { good: "Good ✅", damaged: "Damaged ⚠️", lost: "Lost ❌" };
    return `<span class="condition-badge condition-${condition}">
                ${map[condition] || condition}
            </span>`;
}

// ── Load returned books from backend ─────────────────────────────────────────
async function loadReturnedBooks() {
    const container = document.getElementById("returnedList");

    try {
        const res = await fetch(API_RETURN, {
            method:      "GET",
            credentials: "include",         // sends JWT cookie automatically
        });

        hide("loadingMsg");

        if (res.status === 401) {
            window.location.href = "/";     // not logged in → login page
            return;
        }

        if (!res.ok) throw new Error(`Server error: ${res.status}`);

        const data = await res.json();
        container.innerHTML = "";

        if (data.length === 0) {
            show("emptyMsg");
            return;
        }

        data.forEach(record => {
            const item = document.createElement("div");
            item.className = "book-history-item";
            item.innerHTML = `
                <h4>${record.book_title}</h4>
                <p>📅 Returned: ${record.return_date}</p>
                <p>👤 ${record.borrower_username}</p>
                ${conditionBadge(record.condition)}
                <button
                    class="borrow-again-btn"
                    id="btn-${record.borrowed_book}"
                    onclick="borrowAgain(${record.borrowed_book}, this)">
                    🔄 Borrow Again
                </button>
            `;
            container.appendChild(item);
        });

    } catch (err) {
        hide("loadingMsg");
        const errorEl = document.getElementById("errorMsg");
        errorEl.textContent = "Failed to load returns. Please refresh the page.";
        show("errorMsg");
        console.error(err);
    }
}

// ── Borrow Again ─────────────────────────────────────────────────────────────
window.borrowAgain = async (borrowedBookId, btn) => {
    const due_date = prompt("Enter new due date (YYYY-MM-DD):");
    if (!due_date) return;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(due_date)) {
        alert("Invalid date format. Use YYYY-MM-DD.");
        return;
    }

    btn.disabled    = true;
    btn.textContent = "Processing...";

    try {
        // 1. Get original borrow to find the book ID
        const borrowRes = await fetch(API_BORROW, { credentials: "include" });
        const borrows   = await borrowRes.json();
        const record    = borrows.find(b => b.id === borrowedBookId);

        if (!record) {
            alert("Could not find original borrow record.");
            btn.disabled    = false;
            btn.textContent = "🔄 Borrow Again";
            return;
        }

        // 2. Create new borrow
        const res = await fetch(API_BORROW, {
            method:      "POST",
            credentials: "include",
            headers:     { "Content-Type": "application/json" },
            body:        JSON.stringify({ book: record.book, due_date }),
        });

        if (res.ok) {
            alert("✅ Book borrowed again successfully!");
            window.location.href = "/borrowed-books/";
        } else {
            const err = await res.json();
            alert("Error: " + JSON.stringify(err));
            btn.disabled    = false;
            btn.textContent = "🔄 Borrow Again";
        }

    } catch (err) {
        alert("Something went wrong. Please try again.");
        btn.disabled    = false;
        btn.textContent = "🔄 Borrow Again";
        console.error(err);
    }
};

// ── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", loadReturnedBooks);