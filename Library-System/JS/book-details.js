const params = new URLSearchParams(window.location.search);
const id = Number(params.get("id"));

const books = JSON.parse(localStorage.getItem("libraryBooks")) || [];

const book = books.find(b => b.id === id);

if (!book) {
    document.body.innerHTML = "<h2>Book not found</h2>";
} else {
    document.getElementById("title").textContent = "Book Title : " + book.title;
    document.getElementById("author").textContent = book.author;
    document.getElementById("category").textContent = book.category;
    document.getElementById("description").textContent = book.description;
    document.getElementById("status").textContent = book.status;
    document.getElementById("bookImage").src = book.image;

    const borrowBtn = document.querySelector(".btn-outline");

    if (book.status === "Borrowed") {
        borrowBtn.disabled = true;
        borrowBtn.textContent = "Already Borrowed";
    }

    borrowBtn.onclick = function () {
        book.status = "Borrowed";
        localStorage.setItem("libraryBooks", JSON.stringify(books));

        document.getElementById("status").textContent = "Borrowed";
        borrowBtn.disabled = true;
        borrowBtn.textContent = "Already Borrowed";
    };
}