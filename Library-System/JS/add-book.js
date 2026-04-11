document.addEventListener("DOMContentLoaded", function() {
    const form = document.getElementById("addBookForm");

    form.addEventListener("submit", function(e) {
        e.preventDefault();

        const id = document.getElementById("bookId").value.trim();
        const title = document.getElementById("bookName").value.trim();
        const author = document.getElementById("author").value.trim();
        const category = document.getElementById("category").value;
        const desc = document.getElementById("description").value.trim();

    
        if (!id || !title || !author || !category) {
            alert("All fields except description are required!");
            return;
        }

        if (id <= 0) {
            alert("Please enter a valid positive ID.");
            return;
        }

    
        const STORAGE_KEY = "libraryBooks";
        let books = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

        if (books.some(b => b.id == id)) {
            alert("This Book ID already exists!");
            return;
        }

        const newBook = {
            id: id,
            title: title,
            author: author,
            genre: category,
            description: desc,
            status: "available",
            emoji: "📚"
        };

        books.push(newBook);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(books));

        alert(`Successfully added: ${title}`);
        window.location.href = "manage-books.html";
    });
});