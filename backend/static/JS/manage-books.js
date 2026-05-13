// manage-books.js  —  connected to Django REST API
const API_BASE = "http://localhost:8000"; // ← change to your actual API URL

// Reads the auth token from localStorage (set this when the admin logs in)
function authHeaders() {
    const token = localStorage.getItem("authToken");
    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Token ${token}` } : {}),
    };
}

// ── Bootstrap ────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
    renderTable();
    initSearch();
    initSortableHeaders();
});

// ── Fetch & Render ───────────────────────────────────────────────────────────

async function renderTable() {
    const tbody = document.querySelector("tbody");
    tbody.innerHTML = `
        <tr><td colspan="7" style="text-align:center;padding:40px;color:#94a3b8;">
            Loading…
        </td></tr>`;

    try {
        const res = await fetch(`${API_BASE}/api/books/`, {
            headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data  = await res.json();
        const books = Array.isArray(data) ? data : (data.results ?? []);

        tbody.innerHTML = "";
        books.forEach((book, i) => tbody.appendChild(createRow(book, i)));

        updateEmptyState();
    } catch (err) {
        console.error("Failed to load books:", err);
        tbody.innerHTML = `
            <tr><td colspan="7" style="text-align:center;padding:40px;color:#ef4444;">
                Failed to load books. Check your API connection.
            </td></tr>`;
    }
}

function createRow(book, i = 0) {
    const tr      = document.createElement("tr");
    tr.dataset.id = book.id;
    tr.style.cssText = "opacity:0;transform:translateY(16px);transition:opacity 0.4s ease,transform 0.4s ease;";

    // Image: base64 data-URL stored in TextField, or emoji fallback
    const coverCell = book.image
        ? `<img src="${book.image}" alt="${escapeHtml(book.title)}"
               style="width:40px;height:55px;object-fit:cover;border-radius:4px;"
               onerror="this.style.display='none'">`
        : `<span style="font-size:28px;">📖</span>`;

    const statusBadge = book.status === "available"
        ? `<span style="color:#86efac;">✓ Available</span>`
        : `<span style="color:#fbbf24;">⏳ Borrowed</span>`;

    tr.innerHTML = `
        <td>${book.id}</td>
        <td>${coverCell}</td>
        <td><a href="book-details.html?id=${book.id}">${escapeHtml(book.title)}</a></td>
        <td>${escapeHtml(book.author)}</td>
        <td>${escapeHtml(book.genre)}</td>
        <td>${statusBadge}</td>
        <td>
            <button class="btn-edit"   data-id="${book.id}">Edit</button>
            <button class="btn-delete" data-id="${book.id}">Delete</button>
        </td>`;

    setTimeout(() => {
        tr.style.opacity   = "1";
        tr.style.transform = "translateY(0)";
    }, 80 + i * 60);

    // Attach listeners immediately (no global re-init needed)
    tr.querySelector(".btn-delete").addEventListener("click", () => handleDelete(book, tr));
    tr.querySelector(".btn-edit").addEventListener("click",   () => handleEdit(book, tr));

    return tr;
}

// ── Delete ───────────────────────────────────────────────────────────────────

function handleDelete(book, row) {
    showConfirmToast(`Delete "${book.title}"?`, async () => {
        try {
            const res = await fetch(`${API_BASE}/api/books/${book.id}/`, {
                method:  "DELETE",
                headers: authHeaders(),
            });

            if (res.status === 204 || res.ok) {
                row.style.transition = "opacity 0.35s ease,transform 0.35s ease";
                row.style.opacity    = "0";
                row.style.transform  = "translateX(30px)";
                setTimeout(() => {
                    row.remove();
                    showNotification(`"${book.title}" was deleted.`, "error");
                    updateEmptyState();
                }, 350);
            } else if (res.status === 403) {
                showNotification("Permission denied. Admin only.", "error");
            } else {
                throw new Error(`HTTP ${res.status}`);
            }
        } catch (err) {
            console.error("Delete failed:", err);
            showNotification("Delete failed. Try again.", "error");
        }
    });
}

// ── Edit (inline row) ────────────────────────────────────────────────────────

function handleEdit(book, row) {
    if (row.classList.contains("editing")) return;
    row.classList.add("editing");

    injectEditStyles();

    const originalHTML = row.innerHTML;

    row.innerHTML = `
        <td>${book.id}</td>
        <td><span style="font-size:24px;">📖</span></td>
        <td><input class="edit-input" data-field="title"  value="${escapeAttr(book.title)}"  /></td>
        <td><input class="edit-input" data-field="author" value="${escapeAttr(book.author)}" /></td>
        <td>
            <select class="edit-input" data-field="genre">
                ${["Programming","Fiction","Sci-Fi","Science","History","Other"].map(g =>
                    `<option value="${g}" ${book.genre === g ? "selected" : ""}>${g}</option>`
                ).join("")}
            </select>
        </td>
        <td>
            <select class="edit-input" data-field="status">
                <option value="available" ${book.status === "available" ? "selected" : ""}>✓ Available</option>
                <option value="borrowed"  ${book.status === "borrowed"  ? "selected" : ""}>⏳ Borrowed</option>
            </select>
        </td>
        <td>
            <button class="btn-save"   data-id="${book.id}">Save</button>
            <button class="btn-cancel" data-id="${book.id}">Cancel</button>
        </td>`;

    // Save
    row.querySelector(".btn-save").addEventListener("click", async () => {
        row.querySelectorAll(".edit-input").forEach(inp => {
            book[inp.dataset.field] = inp.value.trim();
        });

        try {
            const res = await fetch(`${API_BASE}/api/books/${book.id}/`, {
                method:  "PATCH",
                headers: authHeaders(),
                body:    JSON.stringify({
                    title:  book.title,
                    author: book.author,
                    genre:  book.genre,
                    status: book.status,
                }),
            });

            if (!res.ok) {
                if (res.status === 403) throw new Error("Permission denied.");
                throw new Error(`HTTP ${res.status}`);
            }

            const updated = await res.json();
            row.classList.remove("editing");
            const newRow = createRow(updated);
            row.parentNode.replaceChild(newRow, row);
            showNotification(`"${updated.title}" updated successfully.`, "success");

        } catch (err) {
            console.error("Update failed:", err);
            showNotification(err.message || "Update failed.", "error");
        }
    });

    // Cancel
    row.querySelector(".btn-cancel").addEventListener("click", () => {
        row.classList.remove("editing");
        row.innerHTML = originalHTML;
        // Re-attach original listeners
        row.querySelector(".btn-delete").addEventListener("click", () => handleDelete(book, row));
        row.querySelector(".btn-edit").addEventListener("click",   () => handleEdit(book, row));
    });
}

// ── Search (client-side filter on already-loaded rows) ───────────────────────

function initSearch() {
    const input = document.getElementById("searchInput");
    if (!input) return;

    input.addEventListener("input", () => {
        const q    = input.value.trim().toLowerCase();
        const rows = document.querySelectorAll("tbody tr:not(#emptyStateRow)");
        let   hits = 0;
        rows.forEach(row => {
            const show = row.textContent.toLowerCase().includes(q);
            row.style.display = show ? "" : "none";
            if (show) hits++;
        });
        updateEmptyState(hits === 0 && q !== "");
    });
}

// ── Sortable headers ─────────────────────────────────────────────────────────

function initSortableHeaders() {
    const headers    = document.querySelectorAll("thead th");
    let   lastSorted = { index: -1, asc: true };

    headers.forEach((th, colIndex) => {
        if (colIndex === 1 || colIndex === 6) return;
        th.style.cursor = "pointer";
        th.title        = "Click to sort";

        const indicator = document.createElement("span");
        indicator.className   = "sort-indicator";
        indicator.textContent = " ⇅";
        indicator.style.cssText = "opacity:.35;font-size:10px;margin-left:4px;";
        th.appendChild(indicator);

        th.addEventListener("click", () => {
            const asc = lastSorted.index === colIndex ? !lastSorted.asc : true;
            lastSorted = { index: colIndex, asc };
            headers.forEach(h => {
                const ind = h.querySelector(".sort-indicator");
                if (ind) { ind.textContent = " ⇅"; ind.style.opacity = "0.35"; }
            });
            indicator.textContent = asc ? " ↑" : " ↓";
            indicator.style.opacity = "1";
            sortTable(colIndex, asc);
        });
    });
}

function sortTable(colIndex, asc) {
    const tbody = document.querySelector("tbody");
    const rows  = Array.from(tbody.querySelectorAll("tr:not(#emptyStateRow)"));
    rows.sort((a, b) => {
        const aT = a.cells[colIndex]?.textContent.trim().toLowerCase() || "";
        const bT = b.cells[colIndex]?.textContent.trim().toLowerCase() || "";
        return asc ? aT.localeCompare(bT) : bT.localeCompare(aT);
    });
    rows.forEach((row, i) => {
        tbody.appendChild(row);
        row.style.opacity   = "0";
        row.style.transform = "translateY(10px)";
        setTimeout(() => { row.style.opacity = "1"; row.style.transform = "translateY(0)"; }, i * 40);
    });
}

// ── Empty state ───────────────────────────────────────────────────────────────

function updateEmptyState(isEmpty) {
    const tbody    = document.querySelector("tbody");
    const existing = document.getElementById("emptyStateRow");

    if (typeof isEmpty === "undefined") {
        const visible = Array.from(tbody.querySelectorAll("tr"))
            .filter(r => r.id !== "emptyStateRow" && r.style.display !== "none");
        isEmpty = visible.length === 0;
    }

    if (isEmpty && !existing) {
        const colCount = document.querySelectorAll("thead th").length || 7;
        const tr = document.createElement("tr");
        tr.id = "emptyStateRow";
        tr.innerHTML = `
            <td colspan="${colCount}" style="text-align:center;padding:48px 20px;
                color:rgba(148,163,184,0.45);font-size:14px;">
                No books found.
            </td>`;
        tbody.appendChild(tr);
    } else if (!isEmpty && existing) {
        existing.remove();
    }
}

// ── Toast notifications ───────────────────────────────────────────────────────

function showNotification(message, type = "info") {
    const colors = {
        info   : { bg: "rgba(99,102,241,0.15)",  border: "rgba(99,102,241,0.4)",  color: "#a5b4fc" },
        success: { bg: "rgba(34,197,94,0.12)",   border: "rgba(34,197,94,0.35)",  color: "#86efac" },
        error  : { bg: "rgba(244,63,94,0.13)",   border: "rgba(244,63,94,0.35)",  color: "#fda4af" },
    };
    const c = colors[type] || colors.info;
    const toast = document.createElement("div");
    toast.textContent  = message;
    toast.style.cssText = `
        position:fixed;bottom:28px;right:28px;z-index:9999;
        padding:12px 22px;border-radius:12px;font-size:14px;
        font-family:"Segoe UI",sans-serif;
        background:${c.bg};border:1px solid ${c.border};color:${c.color};
        backdrop-filter:blur(12px);box-shadow:0 8px 32px rgba(0,0,0,0.35);
        opacity:0;transform:translateY(12px);
        transition:opacity 0.3s ease,transform 0.3s ease;`;
    document.body.appendChild(toast);
    requestAnimationFrame(() => requestAnimationFrame(() => {
        toast.style.opacity = "1"; toast.style.transform = "translateY(0)";
    }));
    setTimeout(() => {
        toast.style.opacity = "0"; toast.style.transform = "translateY(12px)";
        setTimeout(() => toast.remove(), 320);
    }, 3000);
}

function showConfirmToast(message, onConfirm) {
    const existing = document.getElementById("libConfirmToast");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.id = "libConfirmToast";
    toast.style.cssText = `
        position:fixed;bottom:28px;right:28px;z-index:9999;
        padding:16px 22px;border-radius:14px;font-size:14px;
        font-family:"Segoe UI",sans-serif;
        background:rgba(15,23,42,0.96);border:1px solid rgba(244,63,94,0.35);
        color:#e2e8f0;backdrop-filter:blur(14px);
        box-shadow:0 8px 40px rgba(0,0,0,0.5);
        display:flex;flex-direction:column;gap:14px;min-width:260px;
        opacity:0;transform:translateY(16px);
        transition:opacity 0.3s ease,transform 0.3s ease;`;
    toast.innerHTML = `
        <span style="line-height:1.5;">${message}</span>
        <div style="display:flex;gap:10px;justify-content:flex-end;">
            <button id="confirmNo"  style="padding:7px 18px;border-radius:8px;
                border:1px solid rgba(255,255,255,0.1);background:transparent;
                color:#94a3b8;font-size:13px;cursor:pointer;">Cancel</button>
            <button id="confirmYes" style="padding:7px 18px;border-radius:8px;border:none;
                background:linear-gradient(135deg,#e11d48,#f43f5e);
                color:#fff;font-size:13px;font-weight:600;cursor:pointer;">Delete</button>
        </div>`;
    document.body.appendChild(toast);
    requestAnimationFrame(() => requestAnimationFrame(() => {
        toast.style.opacity = "1"; toast.style.transform = "translateY(0)";
    }));

    const close = () => {
        toast.style.opacity = "0"; toast.style.transform = "translateY(12px)";
        setTimeout(() => toast.remove(), 320);
    };
    document.getElementById("confirmYes").addEventListener("click", () => { close(); onConfirm(); });
    document.getElementById("confirmNo").addEventListener("click", close);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function escapeHtml(str) {
    if (!str) return "";
    return String(str).replace(/[&<>"']/g, ch =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
}

function escapeAttr(str) {
    return escapeHtml(str).replace(/"/g, "&quot;");
}

function injectEditStyles() {
    if (document.getElementById("inline-edit-style")) return;
    const style = document.createElement("style");
    style.id = "inline-edit-style";
    style.textContent = `
        .edit-input {
            background:rgba(99,102,241,0.1);border:1px solid rgba(99,102,241,0.4);
            color:#e2e8f0;border-radius:6px;padding:5px 8px;font-size:13px;
            width:100%;outline:none;
        }
        .edit-input:focus { border-color:rgba(99,102,241,0.8);background:rgba(99,102,241,0.15); }
        .btn-save {
            padding:5px 14px;border-radius:6px;border:none;
            background:linear-gradient(135deg,#6366f1,#818cf8);
            color:#fff;font-size:12px;font-weight:600;cursor:pointer;margin-right:4px;
        }
        .btn-cancel {
            padding:5px 14px;border-radius:6px;border:1px solid rgba(255,255,255,0.1);
            background:transparent;color:#94a3b8;font-size:12px;cursor:pointer;
        }`;
    document.head.appendChild(style);
}