document.addEventListener('DOMContentLoaded', () => {
    const categorySelect = document.getElementById('select-by-category');
    const books = document.querySelectorAll('.book-card');

    categorySelect.addEventListener('change', () => {
        const selectedValue = categorySelect.value.toLowerCase();

        books.forEach(book => {
            const bookCategory = book.getAttribute('data-category').toLowerCase();
            
            if (selectedValue === 'all' || bookCategory === selectedValue) {
                book.style.display = 'block';
                book.style.opacity = '0';
                setTimeout(() => {
                    book.style.opacity = '1';
                    book.style.transition = 'opacity 0.4s';
                }, 10);
            } else {
                book.style.display = 'none';
            }
        });
    });
});