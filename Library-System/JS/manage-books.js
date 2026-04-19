document.addEventListener("DOMContentLoaded", () => {
    renderTable();
    initSearch();
    initSortableHeaders();
});

/* ══════════════════════════════
   1. RENDER TABLE FROM localStorage
══════════════════════════════ */
function renderTable() {
    const books = getBooks();
    const tbody = document.querySelector("tbody");
    tbody.innerHTML = "";

    books.forEach((book, i) => {
        tbody.appendChild(createRow(book, i));
    });

    initDeleteButtons();
    initEditButtons();
    updateEmptyState();
}

function createRow(book, i = 0) {
    const tr = document.createElement("tr");
    tr.dataset.id = book.id;
    tr.style.opacity = "0";
    tr.style.transform = "translateY(16px)";
    tr.style.transition = "opacity 0.4s ease, transform 0.4s ease";

    const coverCell = book.image
        ? `<img src="${book.image}" alt="${book.title}" style="width:40px;height:55px;object-fit:cover;border-radius:4px;">`
        : `<span style="font-size:28px;">${book.emoji || "📖"}</span>`;

    const statusBadge = book.status === "available"
        ? `<span style="color:#86efac;">✓ Available</span>`
        : `<span style="color:#fbbf24;">⏳ Borrowed</span>`;

    tr.innerHTML = `
        <td>${book.id}</td>
        <td>${coverCell}</td>
        <td><a href="book-details.html?id=${book.id}">${book.title}</a></td>
        <td>${book.author}</td>
        <td>${book.genre}</td>
        <td>${statusBadge}</td>
        <td>
            <button class="btn-edit"   data-id="${book.id}">Edit</button>
            <button class="btn-delete" data-id="${book.id}">Delete</button>
        </td>
    `;

    setTimeout(() => {
        tr.style.opacity = "1";
        tr.style.transform = "translateY(0)";
    }, 80 + i * 60);

    return tr;
}

/* ══════════════════════════════
   2. DELETE
══════════════════════════════ */
function initDeleteButtons() {
    document.querySelectorAll(".btn-delete").forEach(btn => {
        btn.addEventListener("click", () => {
            const bookId    = Number(btn.dataset.id);
            const row       = btn.closest("tr");
            const titleCell = row.querySelector("td a") || row.cells[2];
            const bookTitle = titleCell ? titleCell.textContent.trim() : "this book";

            showConfirmToast(`Delete "${bookTitle}"?`, () => {
                deleteBook(bookId);

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

/* 3. EDIT — inline row editing */
function initEditButtons() {
    document.querySelectorAll(".btn-edit").forEach(btn => {
        btn.addEventListener("click", () => {
            const bookId = Number(btn.dataset.id);
            const row    = btn.closest("tr");

            // Prevent double-editing
            if (row.classList.contains("editing")) return;
            row.classList.add("editing");

            const book = getBookById(bookId);
            if (!book) return;

            // Save original cells content to restore on Cancel
            const originalHTML = row.innerHTML;

            // Turn row into editable fields
            row.innerHTML = `
                <td>${book.id}</td>
                <td><span style="font-size:24px;">${book.emoji || "📖"}</span></td>
                <td><input class="edit-input" data-field="title"  value="${book.title}"  /></td>
                <td><input class="edit-input" data-field="author" value="${book.author}" /></td>
                <td><input class="edit-input" data-field="genre"  value="${book.genre}"  /></td>
                <td>
                    <select class="edit-input" data-field="status">
                        <option value="available" ${book.status === "available" ? "selected" : ""}>✓ Available</option>
                        <option value="borrowed"  ${book.status === "borrowed"  ? "selected" : ""}>⏳ Borrowed</option>
                    </select>
                </td>
                <td>
                    <button class="btn-save"   data-id="${book.id}">Save</button>
                    <button class="btn-cancel" data-id="${book.id}">Cancel</button>
                </td>
            `;

            // Style inputs
            const style = document.createElement("style");
            if (!document.getElementById("inline-edit-style")) {
                style.id = "inline-edit-style";
                style.textContent = `
                    .edit-input {
                        background: rgba(99,102,241,0.1);
                        border: 1px solid rgba(99,102,241,0.4);
                        color: #e2e8f0;
                        border-radius: 6px;
                        padding: 5px 8px;
                        font-size: 13px;
                        width: 100%;
                        outline: none;
                    }
                    .edit-input:focus {
                        border-color: rgba(99,102,241,0.8);
                        background: rgba(99,102,241,0.15);
                    }
                    .btn-save {
                        padding: 5px 14px; border-radius: 6px; border: none;
                        background: linear-gradient(135deg,#6366f1,#818cf8);
                        color: #fff; font-size: 12px; font-weight: 600; cursor: pointer;
                        margin-right: 4px;
                    }
                    .btn-cancel {
                        padding: 5px 14px; border-radius: 6px;
                        border: 1px solid rgba(255,255,255,0.1);
                        background: transparent; color: #94a3b8;
                        font-size: 12px; cursor: pointer;
                    }
                `;
                document.head.appendChild(style);
            }

            // Save button
            row.querySelector(".btn-save").addEventListener("click", () => {
                const inputs = row.querySelectorAll(".edit-input");
                inputs.forEach(input => {
                    book[input.dataset.field] = input.value.trim();
                });

                updateBook(book);

                row.classList.remove("editing");
                row.innerHTML = "";

                const newRow = createRow(book);
                row.parentNode.replaceChild(newRow, row);

                // Re-attach listeners to new row
                newRow.querySelector(".btn-edit")?.addEventListener("click", () => {
                    document.querySelectorAll(".btn-edit").forEach(b => {
                        if (Number(b.dataset.id) === book.id) b.click();
                    });
                });

                initDeleteButtons();
                initEditButtons();
                showNotification(`"${book.title}" updated successfully.`, "success");
            });

            // Cancel button
            row.querySelector(".btn-cancel").addEventListener("click", () => {
                row.classList.remove("editing");
                row.innerHTML = originalHTML;
                initDeleteButtons();
                initEditButtons();
            });
        });
    });
}

/*4. SEARCH*/
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

/*5. SORTABLE HEADERS */
function initSortableHeaders() {
    const headers = document.querySelectorAll("thead th");
    let lastSorted = { index: -1, asc: true };

    headers.forEach((th, colIndex) => {
        if (colIndex === 1 || colIndex === 6) return;

        th.style.cursor = "pointer";
        th.title = "Click to sort";

        const indicator = document.createElement("span");
        indicator.className  = "sort-indicator";
        indicator.textContent = " ⇅";
        indicator.style.cssText = "opacity:.35; font-size:10px; margin-left:4px;";
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
    const rows  = Array.from(tbody.querySelectorAll("tr"));

    rows.sort((a, b) => {
        const aText = a.cells[colIndex]?.textContent.trim().toLowerCase() || "";
        const bText = b.cells[colIndex]?.textContent.trim().toLowerCase() || "";
        return asc ? aText.localeCompare(bText) : bText.localeCompare(aText);
    });

    rows.forEach(row => tbody.appendChild(row));
    rows.forEach((row, i) => {
        row.style.opacity   = "0";
        row.style.transform = "translateY(10px)";
        setTimeout(() => {
            row.style.opacity   = "1";
            row.style.transform = "translateY(0)";
        }, i * 40);
    });
}

function updateEmptyState(isEmpty) {
    const tbody    = document.querySelector("tbody");
    const existing = document.getElementById("emptyStateRow");

    if (typeof isEmpty === "undefined") {
        const visibleRows = Array.from(tbody.querySelectorAll("tr"))
            .filter(r => r.id !== "emptyStateRow" && r.style.display !== "none");
        isEmpty = visibleRows.length === 0;
    }

    if (isEmpty && !existing) {
        const colCount = document.querySelectorAll("thead th").length || 7;
        const tr = document.createElement("tr");
        tr.id = "emptyStateRow";
        tr.innerHTML = `
            <td colspan="${colCount}" style="
                text-align:center; padding:48px 20px;
                color:rgba(148,163,184,0.45); font-size:14px;">
                No books found.
            </td>`;
        tbody.appendChild(tr);
    } else if (!isEmpty && existing) {
        existing.remove();
    }
}

function showNotification(message, type = "info") {
    const colors = {
        info   : { bg: "rgba(99,102,241,0.15)",  border: "rgba(99,102,241,0.4)",  color: "#a5b4fc" },
        success: { bg: "rgba(34,197,94,0.12)",   border: "rgba(34,197,94,0.35)",  color: "#86efac" },
        error  : { bg: "rgba(244,63,94,0.13)",   border: "rgba(244,63,94,0.35)",  color: "#fda4af" },
    };
    const c = colors[type] || colors.info;

    const toast = document.createElement("div");
    toast.textContent = message;
    toast.style.cssText = `
        position:fixed; bottom:28px; right:28px; z-index:9999;
        padding:12px 22px; border-radius:12px; font-size:14px;
        font-family:"Segoe UI",sans-serif;
        background:${c.bg}; border:1px solid ${c.border}; color:${c.color};
        backdrop-filter:blur(12px); box-shadow:0 8px 32px rgba(0,0,0,0.35);
        opacity:0; transform:translateY(12px);
        transition:opacity 0.3s ease, transform 0.3s ease;
    `;

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
        position:fixed; bottom:28px; right:28px; z-index:9999;
        padding:16px 22px; border-radius:14px; font-size:14px;
        font-family:"Segoe UI",sans-serif;
        background:rgba(15,23,42,0.96); border:1px solid rgba(244,63,94,0.35);
        color:#e2e8f0; backdrop-filter:blur(14px);
        box-shadow:0 8px 40px rgba(0,0,0,0.5);
        display:flex; flex-direction:column; gap:14px; min-width:260px;
        opacity:0; transform:translateY(16px);
        transition:opacity 0.3s ease, transform 0.3s ease;
    `;

    toast.innerHTML = `
        <span style="line-height:1.5;">${message}</span>
        <div style="display:flex; gap:10px; justify-content:flex-end;">
            <button id="confirmNo" style="
                padding:7px 18px; border-radius:8px;
                border:1px solid rgba(255,255,255,0.1);
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