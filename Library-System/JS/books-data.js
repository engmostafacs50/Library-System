const BOOKS_KEY = "library_catalog";

// No default books — all data is user-generated.

/* ── Seed: initialize with empty catalog on first load ── */
function seedBooks() {
  if (!localStorage.getItem(BOOKS_KEY)) {
    localStorage.setItem(BOOKS_KEY, JSON.stringify([]));
  }
}

/* ── Get All Books ── */
function getBooks() {
  return JSON.parse(localStorage.getItem(BOOKS_KEY)) || [];
}

/* ── Save Books ── */
function saveBooks(books) {
  localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
}

/* ── Get Book By ID ── */
function getBookById(id) {
  return getBooks().find((b) => b.id === Number(id)) || null;
}

/* ── Add Book ── */
function addBook(bookData) {
  const books = getBooks();
  const maxId = books.reduce((max, b) => Math.max(max, b.id), 0);
  const newBook = {
    id: maxId + 1,
    status: "available",
    image: null,
    emoji: null,
    ...bookData,
  };
  books.push(newBook);
  saveBooks(books);
  return newBook;
}

/* ── Update Book ── */
function updateBook(updatedBook) {
  const books = getBooks();
  const index = books.findIndex((b) => b.id === updatedBook.id);
  if (index !== -1) {
    books[index] = updatedBook;
    saveBooks(books);
  }
}

/* ── Delete Book ── */
function deleteBook(id) {
  const books = getBooks().filter((b) => b.id !== Number(id));
  saveBooks(books);
}

/* ── Toggle Borrow Status ── */
function toggleBookStatus(id) {
  const books = getBooks();
  const book = books.find((b) => b.id === Number(id));
  if (book) {
    book.status = book.status === "available" ? "borrowed" : "available";
    saveBooks(books);
  }
}

seedBooks();