/* ══════════════════════════════
   MANAGE BOOKS — manage-books.js
══════════════════════════════ */

document.addEventListener("DOMContentLoaded", () => {
    initRowAnimations();
    initDeleteButtons();
    initEditButtons();
    initSearch();
    initSortableHeaders();
});

/* ══════════════════════════════
   1. STAGGERED ROW ENTRANCE
══════════════════════════════ */
function initRowAnimations() {
    const rows = document.querySelectorAll("tbody tr");
    rows.forEach((row, i) => {
        row.style.opacity = "0";
        row.style.transform = "translateY(16px)";
        row.style.transition = "opacity 0.4s ease, transform 0.4s ease";
        setTimeout(() => {
            row.style.opacity = "1";
            row.style.transform = "translateY(0)";
        }, 80 + i * 60);
    });
}

/* ══════════════════════════════
   2. DELETE WITH CONFIRMATION TOAST
══════════════════════════════ */
function initDeleteButtons() {
    document.querySelectorAll(".btn-delete").forEach(btn => {
        btn.addEventListener("click", () => {
            const row       = btn.closest("tr");
            const titleCell = row.querySelector("td a") || row.cells[2];
            const bookTitle = titleCell ? titleCell.textContent.trim() : "this book";

            showConfirmToast(`Delete "${bookTitle}"?`, () => {
                // Animate row out, then remove it
                row.style.transition = "opacity 0.35s ease, transform 0.35s ease";
                row.style.opacity    = "0";
                row.style.transform  = "translateX(30px)";
                setTimeout(() => {
                    row.remove();
                    showNotification(`"${bookTitle}" was deleted.`, "error");
                    updateEmptyState();
                }, 350);
            });
        });
    });
}

/* ══════════════════════════════
   3. EDIT BUTTON — highlight row
══════════════════════════════ */
function initEditButtons() {
    document.querySelectorAll(".btn-edit").forEach(btn => {
        btn.addEventListener("click", () => {
            const row = btn.closest("tr");

            // Brief highlight pulse
            row.style.transition = "background 0.2s ease";
            row.style.background = "rgba(99, 102, 241, 0.18)";
            setTimeout(() => {
                row.style.background = "";
            }, 600);

            const titleCell = row.querySelector("td a") || row.cells[2];
            const bookTitle = titleCell ? titleCell.textContent.trim() : "book";
            showNotification(`Editing "${bookTitle}" …`, "info");

            // TODO: open your edit modal or navigate to edit page
            // window.location.href = `edit-book.html?id=${rowId}`;
        });
    });
}

/* ══════════════════════════════
   4. LIVE SEARCH / FILTER
   Requires a search input with id="searchInput" in the HTML.
   Example:
     <input id="searchInput" placeholder="Search books…">
══════════════════════════════ */
function initSearch() {
    const input = document.getElementById("searchInput");
    if (!input) return;

    input.addEventListener("input", () => {
        const q    = input.value.trim().toLowerCase();
        const rows = document.querySelectorAll("tbody tr");
        let   hits = 0;

        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            const show = text.includes(q);
            row.style.display = show ? "" : "none";
            if (show) hits++;
        });

        updateEmptyState(hits === 0 && q !== "");
    });
}

/* ══════════════════════════════
   5. SORTABLE COLUMN HEADERS
   Click any <th> to sort that column (asc → desc → reset)
══════════════════════════════ */
function initSortableHeaders() {
    const headers = document.querySelectorAll("thead th");
    let lastSorted = { index: -1, asc: true };

    headers.forEach((th, colIndex) => {
        // Skip image and action columns
        if (colIndex === 1 || colIndex === 5) return;

        th.style.cursor = "pointer";
        th.title = "Click to sort";

        // Add indicator span
        const indicator = document.createElement("span");
        indicator.className  = "sort-indicator";
        indicator.textContent = " ⇅";
        indicator.style.cssText = "opacity:.35; font-size:10px; margin-left:4px;";
        th.appendChild(indicator);

        th.addEventListener("click", () => {
            const asc = lastSorted.index === colIndex ? !lastSorted.asc : true;
            lastSorted = { index: colIndex, asc };

            // Reset all indicators
            headers.forEach(h => {
                const ind = h.querySelector(".sort-indicator");
                if (ind) { ind.textContent = " ⇅"; ind.style.opacity = "0.35"; }
            });

            // Update clicked indicator
            indicator.textContent = asc ? " ↑" : " ↓";
            indicator.style.opacity = "1";

            sortTable(colIndex, asc);
        });
    });
}

function sortTable(colIndex, asc) {
    const tbody = document.querySelector("tbody");
    const rows  = Array.from(tbody.querySelectorAll("tr"));

    rows.sort((a, b) => {
        const aText = a.cells[colIndex]?.textContent.trim().toLowerCase() || "";
        const bText = b.cells[colIndex]?.textContent.trim().toLowerCase() || "";
        return asc
            ? aText.localeCompare(bText)
            : bText.localeCompare(aText);
    });

    rows.forEach(row => tbody.appendChild(row));

    // Re-run stagger on sorted rows
    rows.forEach((row, i) => {
        row.style.opacity   = "0";
        row.style.transform = "translateY(10px)";
        setTimeout(() => {
            row.style.opacity   = "1";
            row.style.transform = "translateY(0)";
        }, i * 40);
    });
}

/* ══════════════════════════════
   6. EMPTY STATE MESSAGE
══════════════════════════════ */
function updateEmptyState(isEmpty) {
    const tbody    = document.querySelector("tbody");
    const existing = document.getElementById("emptyStateRow");

    // Auto-detect if not passed explicitly
    if (typeof isEmpty === "undefined") {
        const visibleRows = Array.from(tbody.querySelectorAll("tr"))
            .filter(r => r.id !== "emptyStateRow" && r.style.display !== "none");
        isEmpty = visibleRows.length === 0;
    }

    if (isEmpty && !existing) {
        const colCount = document.querySelectorAll("thead th").length || 6;
        const tr = document.createElement("tr");
        tr.id = "emptyStateRow";
        tr.innerHTML = `
            <td colspan="${colCount}" style="
                text-align:center;
                padding: 48px 20px;
                color: rgba(148,163,184,0.45);
                font-size: 14px;
            ">
                📚 No books found.
            </td>`;
        tbody.appendChild(tr);
    } else if (!isEmpty && existing) {
        existing.remove();
    }
}

/* ══════════════════════════════
   7. TOAST NOTIFICATION
══════════════════════════════ */
function showNotification(message, type = "info") {
    // type: "info" | "error" | "success"
    const colors = {
        info   : { bg: "rgba(99,102,241,0.15)",  border: "rgba(99,102,241,0.4)",   color: "#a5b4fc" },
        success: { bg: "rgba(34,197,94,0.12)",   border: "rgba(34,197,94,0.35)",   color: "#86efac" },
        error  : { bg: "rgba(244,63,94,0.13)",   border: "rgba(244,63,94,0.35)",   color: "#fda4af" },
    };
    const c = colors[type] || colors.info;

    const toast = document.createElement("div");
    toast.className = "lib-toast";
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 28px;
        right: 28px;
        z-index: 9999;
        padding: 12px 22px;
        border-radius: 12px;
        font-size: 14px;
        font-family: "Segoe UI", sans-serif;
        background: ${c.bg};
        border: 1px solid ${c.border};
        color: ${c.color};
        backdrop-filter: blur(12px);
        box-shadow: 0 8px 32px rgba(0,0,0,0.35);
        opacity: 0;
        transform: translateY(12px);
        transition: opacity 0.3s ease, transform 0.3s ease;
    `;

    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            toast.style.opacity   = "1";
            toast.style.transform = "translateY(0)";
        });
    });

    setTimeout(() => {
        toast.style.opacity   = "0";
        toast.style.transform = "translateY(12px)";
        setTimeout(() => toast.remove(), 320);
    }, 3000);
}

/* ══════════════════════════════
   8. CONFIRM TOAST  (inline, no alert())
══════════════════════════════ */
function showConfirmToast(message, onConfirm) {
    // Remove any existing confirm toast
    const existing = document.getElementById("libConfirmToast");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.id = "libConfirmToast";
    toast.style.cssText = `
        position: fixed;
        bottom: 28px;
        right: 28px;
        z-index: 9999;
        padding: 16px 22px;
        border-radius: 14px;
        font-size: 14px;
        font-family: "Segoe UI", sans-serif;
        background: rgba(15,23,42,0.96);
        border: 1px solid rgba(244,63,94,0.35);
        color: #e2e8f0;
        backdrop-filter: blur(14px);
        box-shadow: 0 8px 40px rgba(0,0,0,0.5);
        display: flex;
        flex-direction: column;
        gap: 14px;
        min-width: 260px;
        opacity: 0;
        transform: translateY(16px);
        transition: opacity 0.3s ease, transform 0.3s ease;
    `;

    toast.innerHTML = `
        <span style="line-height:1.5;">${message}</span>
        <div style="display:flex; gap:10px; justify-content:flex-end;">
            <button id="confirmNo"  style="
                padding:7px 18px; border-radius:8px; border:1px solid rgba(255,255,255,0.1);
                background:transparent; color:#94a3b8; font-size:13px; cursor:pointer;">
                Cancel
            </button>
            <button id="confirmYes" style="
                padding:7px 18px; border-radius:8px; border:none;
                background:linear-gradient(135deg,#e11d48,#f43f5e);
                color:#fff; font-size:13px; font-weight:600; cursor:pointer;">
                Delete
            </button>
        </div>
    `;

    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            toast.style.opacity   = "1";
            toast.style.transform = "translateY(0)";
        });
    });

    const close = () => {
        toast.style.opacity   = "0";
        toast.style.transform = "translateY(12px)";
        setTimeout(() => toast.remove(), 320);
    };

    document.getElementById("confirmYes").addEventListener("click", () => {
        close();
        onConfirm();
    });

    document.getElementById("confirmNo").addEventListener("click", close);
}