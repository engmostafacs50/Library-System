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

  // ── Check if this user already borrowed this book ──
  const session = getSession() || {};
  const borrowedList = session.borrowedList || [];
  const alreadyBorrowed = borrowedList.some(b => String(b.id) === String(book.id));

  borrowBtn.textContent = alreadyBorrowed ? "Return Book" : "Borrow Book";
  document.getElementById("status").textContent = alreadyBorrowed ? "borrowed" : book.status;

  borrowBtn.onclick = function () {
    const session = getSession();

    if (!session) {
      alert("You must be logged in to borrow books.");
      window.location.href = "../pages/login.html";
      return;
    }

    session.borrowedList  = session.borrowedList  || [];
    session.returnedList  = session.returnedList  || [];
    session.totalBorrowed = session.totalBorrowed || 0;

    const isCurrentlyBorrowed = session.borrowedList.some(
      b => String(b.id) === String(book.id)
    );

    if (isCurrentlyBorrowed) {
      // ── Return Book ──
      if (!confirm(`Return "${book.title}"?`)) return;

      const today = new Date().toISOString().split("T")[0];
      const bookEntry = session.borrowedList.find(b => String(b.id) === String(book.id));

      session.borrowedList = session.borrowedList.filter(
        b => String(b.id) !== String(book.id)
      );

      session.returnedList.push({ ...bookEntry, returnDate: today });
      session.returnedCount = session.returnedList.length;

      // Update book status in library
      toggleBookStatus(book.id);

      saveSession(session);

      borrowBtn.textContent = "Borrow Book";
      document.getElementById("status").textContent = "available";

    } else {
      // ── Borrow Book ──
      const today = new Date();
      const format = d => d.toISOString().split("T")[0];
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7);

      const newBook = {
        id:    book.id,
        title: book.title,
        date:  format(today),
        due:   format(dueDate)
      };

      session.borrowedList.push(newBook);
      session.totalBorrowed++;

      // Update book status in library
      toggleBookStatus(book.id);

      saveSession(session);

      borrowBtn.textContent = "Return Book";
      document.getElementById("status").textContent = "borrowed";
    }
  };
}