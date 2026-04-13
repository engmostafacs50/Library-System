// returned-books.js

document.addEventListener('DOMContentLoaded', () => {
    loadReturnedBooks();
    syncReturnedFromMainDB();
});

function syncReturnedFromMainDB() {
    const mainDB = JSON.parse(localStorage.getItem("library_user")) || {};
    const mainReturned = mainDB.returnedList || [];

    let localReturned = JSON.parse(localStorage.getItem('userReturnedHistory')) || [];

    const merged = [...localReturned];

    mainReturned.forEach(book => {
        const exists = merged.some(b => b.title === book.title);
        if (!exists) {
            merged.push({
                title: book.title,
                id: book.id || 'N/A',
                date: book.returnDate || book.date || new Date().toISOString().split('T')[0],
                returnDate: book.returnDate || book.date
            });
        }
    });

    if (JSON.stringify(localReturned) !== JSON.stringify(merged)) {
        localStorage.setItem('userReturnedHistory', JSON.stringify(merged));
        loadReturnedBooks();
    }
}

function addReturnRecord() {
    const title  = document.getElementById('return-title').value;
    const id     = document.getElementById('return-id').value;
    const author = document.getElementById('return-author').value; // BUG FIX: author was never read
    const date   = document.getElementById('return-date').value;

    if (!title || !date) {
        alert("Please fill in the title and return date.");
        return;
    }

    const book = { title, id, author, date, returnDate: date };

    let list = JSON.parse(localStorage.getItem('userReturnedHistory')) || [];
    list.unshift(book);
    localStorage.setItem('userReturnedHistory', JSON.stringify(list));

    document.getElementById('return-title').value  = '';
    document.getElementById('return-id').value     = '';
    document.getElementById('return-author').value = '';
    document.getElementById('return-date').value   = '';

    loadReturnedBooks();
}

function loadReturnedBooks() {
    const container = document.getElementById('returnedList');
    const emptyMsg = document.getElementById('emptyMsg');
    const list = JSON.parse(localStorage.getItem('userReturnedHistory')) || [];

    if (!container) return;

    if (list.length === 0) {
        if (emptyMsg) emptyMsg.style.display = 'block';
        container.innerHTML = '';
        if (emptyMsg) container.appendChild(emptyMsg);
        return;
    }

    if (emptyMsg) emptyMsg.style.display = 'none';
    container.innerHTML = '';

    list.forEach((book, index) => {
        const item = document.createElement('div');
        item.className = 'book-history-item';
        item.innerHTML = `
            <h4 style="margin:0 0 8px 0; color:#818cf8;">${escapeHtml(book.title)}</h4>
            <p style="font-size:0.85rem; color:#94a3b8; margin:5px 0;">ID: ${escapeHtml(book.id || 'N/A')}</p>
            <p style="font-size:0.85rem; color:#94a3b8; margin:5px 0;">Author: ${escapeHtml(book.author || 'N/A')}</p>
            <small style="color:#34d399;">📅 Returned on: ${escapeHtml(book.date || book.returnDate || 'Unknown')}</small>
            <div style="margin-top: 15px;">
                <button class="btn-borrow-again" onclick="borrowAgain(${index})">📖 Borrow Again</button>
            </div>
        `;
        container.appendChild(item);
    });
}

window.borrowAgain = (index) => {
    const returnedList = JSON.parse(localStorage.getItem('userReturnedHistory')) || [];
    const book = returnedList[index];

    if (!book) return;

    if (confirm(`Do you want to borrow "${book.title}" again?`)) {
        let mainDB = JSON.parse(localStorage.getItem("library_user"));

        if (!mainDB) {
            mainDB = {
                id: 1,
                username: "User Pro",
                borrowedList: [],
                returnedList: [],
                returnedCount: 0,
                totalBorrowed: 0
            };
        }

        const today = new Date();
        const dueDate = new Date();
        dueDate.setDate(today.getDate() + 30);
        const formatDate = (date) => date.toISOString().split('T')[0];

        const newBook = {
            id: book.id || Date.now(),
            title: book.title,
            date: formatDate(today),
            due: formatDate(dueDate)
        };

        mainDB.borrowedList.push(newBook);
        mainDB.totalBorrowed++;

        if (mainDB.returnedList) {
            mainDB.returnedList = mainDB.returnedList.filter(b => b.title !== book.title);
            // BUG FIX: returnedCount was never decremented when borrowing again — now derived from list length
            mainDB.returnedCount = mainDB.returnedList.length;
        }

        localStorage.setItem("library_user", JSON.stringify(mainDB));

        // BUG FIX: sync the new borrow back to the library_users store (addBorrowToUser was never called)
        if (typeof addBorrowToUser === "function") {
            addBorrowToUser(mainDB.id, newBook);
        }

        const updatedReturnedList = returnedList.filter((_, i) => i !== index);
        localStorage.setItem('userReturnedHistory', JSON.stringify(updatedReturnedList));

        if (typeof toggleBookStatus === 'function') {
            toggleBookStatus(book.id);
        }

        alert(`"${book.title}" has been borrowed again! Check your Borrowed Books page.`);
        location.reload();
    }
};

function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    str = String(str); // coerce numbers, booleans, etc. to string safely
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}