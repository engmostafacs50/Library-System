// view-books.js
document.addEventListener('DOMContentLoaded', () => {
    renderBooks();

    const categorySelect = document.getElementById('select-by-category');
    if (categorySelect) {
        categorySelect.addEventListener('change', () => {
            renderBooks();
        });
    }
});

function renderBooks() {
    const container = document.getElementById('booksContainer');
    if (!container) return;

    const books = getBooks();
    const selectedValue = document.getElementById('select-by-category')?.value || 'all';

    let filteredBooks = books;
    if (selectedValue !== 'all') {
        filteredBooks = books.filter(book =>
            book.genre && book.genre.toLowerCase() === selectedValue.toLowerCase()
        );
    }

    if (filteredBooks.length === 0) {
        container.innerHTML = '<p style="color: #94a3b8; text-align: center; width: 100%;">No books found in this category.</p>';
        return;
    }

    container.innerHTML = filteredBooks.map(book => `
        <a href="book-details.html?id=${book.id}" class="book-card" data-category="${book.genre?.toLowerCase() || ''}">
            <img src="${book.image || '../assets/images/default-book.jpg'}" alt="${book.title}">
            <div class="book-info">
                <h3>${escapeHtml(book.title)}</h3>
                <span class="tag">${escapeHtml(book.genre || 'General')}</span>
                <p style="font-size: 0.7rem; color: ${book.status === 'available' ? '#22c55e' : '#ef4444'}; margin-top: 8px;">
                    ${book.status === 'available' ? '✓ Available' : '✗ Borrowed'}
                </p>
            </div>
        </a>
    `).join('');
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}