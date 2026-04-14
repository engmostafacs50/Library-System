document.addEventListener("DOMContentLoaded", loadReturnedBooks);

function loadReturnedBooks() {
  const container = document.getElementById("returnedList");
  const emptyMsg  = document.getElementById("emptyMsg");

  const db   = JSON.parse(localStorage.getItem("library_session")) || {};
  const list = db.returnedList || [];

  container.innerHTML = "";

  if (list.length === 0) {
    emptyMsg.style.display = "block";
    return;
  }

  emptyMsg.style.display = "none";

  list.forEach((book, index) => {
    const item = document.createElement("div");
    item.className = "book-history-item";

    item.innerHTML = `
      <h4>${book.title}</h4>
      <p>ID: ${book.id}</p>
      <p>Returned: ${book.returnDate}</p>
      <button onclick="borrowAgain(${index})">Borrow Again</button>
    `;

    container.appendChild(item);
  });
}

/* ── Borrow Again ── */
window.borrowAgain = (index) => {
  const db   = JSON.parse(localStorage.getItem("library_session"));
  const book = db.returnedList[index];

  if (!book) return;

  if (db.borrowedList.some(b => String(b.id) === String(book.id))) {
    alert("Already borrowed!");
    return;
  }

  const today  = new Date();
  const format = d => d.toISOString().split("T")[0];

  const newBook = {
    id:    book.id,
    title: book.title,
    date:  format(today),
    due:   format(new Date(new Date().setDate(today.getDate() + 7))) // fixed: use fresh Date()
  };

  db.borrowedList.push(newBook);
  db.returnedList.splice(index, 1);
  db.returnedCount  = db.returnedList.length;
  db.totalBorrowed  = (db.totalBorrowed || 0) + 1; //fix: keep total count correct

  localStorage.setItem("library_session", JSON.stringify(db));

  //fix: update book status in the library so it shows as "borrowed"
  if (typeof toggleBookStatus === "function") {
    toggleBookStatus(book.id);
  }

  location.reload();
};