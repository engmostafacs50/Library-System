"use strict";

const API_RETURN = "/api/return/";
const API_BORROW = "/api/borrow/";

// ── Helpers ───────────────────────────────────────────────────────────────────
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
    return null;
}

function authHeaders() {
    return {
        "Content-Type": "application/json",
        "X-CSRFToken": getCookie("csrftoken") || "",
    };
}

function show(id) { document.getElementById(id).style.display = "block"; }
function hide(id) { document.getElementById(id).style.display = "none";  }

function formatDate(dateStr) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric", month: "short", day: "numeric",
    });
}

function conditionBadge(condition) {
    const map = {
        good:    { label: "Good ✅",     cls: "condition-good"    },
        damaged: { label: "Damaged ⚠️",  cls: "condition-damaged" },
        lost:    { label: "Lost ❌",     cls: "condition-lost"    },
    };
    const c = map[condition] || { label: condition, cls: "" };
    return `<span class="condition-badge ${c.cls}">${c.label}</span>`;
}

function fineBadge(fine) {
    const amount = parseFloat(fine);
    if (!amount) return "";
    return `<span class="fine-badge">💸 Fine: $${amount.toFixed(2)}</span>`;
}

async function loadReturnedBooks() {
    const container = document.getElementById("returnedList");

    try {
        const res = await fetch(API_RETURN, {
            method:      "GET",
            credentials: "include",
            headers:     authHeaders(),
        });

        hide("loadingMsg");

        if (res.status === 401) {
            window.location.href = "/login/";
            return;
        }

        if (!res.ok) throw new Error(`Server error: ${res.status}`);

        const data = await res.json();
        // handle paginated or plain array
        const records = Array.isArray(data) ? data : (data.results || []);

        container.innerHTML = "";

        if (!records.length) {
            show("emptyMsg");
            return;
        }

        records.forEach((record, i) => {
            const item = document.createElement("div");
            item.className = "book-history-item";
            item.style.animationDelay = `${i * 0.07}s`;

            item.innerHTML = `
                <div class="book-card-header">
                    <h4>${record.book_title || "—"}</h4>
                    ${conditionBadge(record.condition)}
                </div>
                <div class="book-card-meta">
                    <p><span>Borrowed:</span> ${formatDate(record.borrow_date)}</p>
                    <p><span>Returned:</span> ${formatDate(record.return_date)}</p>
                    <p><span>Due was:</span>  ${formatDate(record.due_date)}</p>
                </div>
                ${fineBadge(record.fine)}
                <button
                    class="borrow-again-btn"
                    id="btn-${record.borrowed_book}"
                    onclick="borrowAgain(${record.borrowed_book}, this)">
                     Borrow Again
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

// ── Borrow Again ──────────────────────────────────────────────────────────────
window.borrowAgain = async (borrowedBookId, btn) => {
    btn.disabled    = true;
    btn.textContent = "Processing…";

    try {
        // 1. Get all borrows to find the book id from the original borrow
        const borrowRes = await fetch(API_BORROW, {
            credentials: "include",
            headers:     authHeaders(),
        });
        const borrowData = await borrowRes.json();
        const borrows    = Array.isArray(borrowData) ? borrowData : (borrowData.results || []);
        const record     = borrows.find(b => b.id === borrowedBookId);

        if (!record) {
            // fallback: get book id from return record list
            alert("Could not find original borrow record. Please try from the books page.");
            btn.disabled    = false;
            btn.textContent = "Borrow Again";
            return;
        }

        // 2. Create new borrow (no due_date – admin sets it on approval)
        const res = await fetch(API_BORROW, {
            method:      "POST",
            credentials: "include",
            headers:     authHeaders(),
            body:        JSON.stringify({ book: record.book }),
        });

        if (res.ok) {
            alert("Borrow request submitted! Awaiting admin approval.");
            window.location.href = "/borrowed-books/";
        } else {
            const err = await res.json();
            const msg = err.detail || JSON.stringify(err);
            alert("Error: " + msg);
            btn.disabled    = false;
            btn.textContent = "Borrow Again";
        }

    } catch (err) {
        alert("Something went wrong. Please try again.");
        btn.disabled    = false;
        btn.textContent = "Borrow Again";
        console.error(err);
    }
};

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", loadReturnedBooks);