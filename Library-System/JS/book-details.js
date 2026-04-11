// ✅ Depends on books-data.js being loaded first (via <script> in HTML)

const params = new URLSearchParams(window.location.search);
const id = Number(params.get("id"));

// Use books-data.js helper
const book = getBookById(id);

if (!book) {
    document.body.innerHTML = "<h2>Book not found</h2>";
} else {
    document.getElementById("title").textContent = "Book Title: " + book.title;
    document.getElementById("author").textContent = book.author;
    document.getElementById("category").textContent = book.genre;
    document.getElementById("description").textContent = book.description;
    document.getElementById("status").textContent = book.status;

    const img = document.getElementById("bookImage");
    img.src = book.image || "../assets/images/default.png";

    const borrowBtn = document.querySelector(".btn-outline");
    borrowBtn.textContent = book.status === "borrowed" ? "Return Book" : "Borrow Book";

    borrowBtn.onclick = function () {
        // Use books-data.js helper — updates localStorage directly
        toggleBookStatus(book.id);

        // Reload updated book from storage
        const updated = getBookById(book.id);
        book.status = updated.status;

        borrowBtn.textContent = book.status === "borrowed" ? "Return Book" : "Borrow Book";
        document.getElementById("status").textContent = book.status;
    };
}