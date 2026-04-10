const STORAGE_KEY = "libraryBooks";

document.addEventListener("DOMContentLoaded", () => {
    loadBooks();
});

function loadBooks() {
    const books = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    const container = document.getElementById("booksContainer");

    if (books.length === 0) {
        container.innerHTML = "<p>No books found</p>";
        return;
    }

    container.innerHTML = "";

    books.forEach(book => {
        const div = document.createElement("div");

        div.innerHTML = `
            <div class="book-card">
                <img src="${book.imageUrl}" style="width:120px;height:160px;">
                <h3>${book.title}</h3>
                <p>${book.author}</p>
                <span>${book.category}</span>
            </div>
        `;

        container.appendChild(div);
    });
}