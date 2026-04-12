const STORAGE_KEY = "libraryBooks";
const DEFAULT_BOOKS = [
  {
    id: 1,
    title: "Clean Code",
    author: "Robert C. Martin",
    genre: "Programming",
    status: "available",
    image: "../assets/images/clean-code.jpg",
    emoji: null,
    description: "A handbook of agile software craftsmanship."
  },
  // {
  //   id: 2,
  //   title: "The Pragmatic Programmer",
  //   author: "Andrew Hunt",
  //   genre: "Programming",
  //   status: "available",
  //   image: "../assets/images/The Pragmatic Programmer.png",
  //   emoji: null,
  //   description: "Your journey to mastery as a developer."
  // },
  {
    id: 2,
    title: "Design Patterns",
    author: "Gang of Four",
    genre: "Programming",
    status: "borrowed",
    image: "../assets/images/design-pattern.jpg",
    emoji: null,
    description: "Classic object-oriented design patterns."
  },
  {
    id: 3,
    title: "1984",
    author: "George Orwell",
    genre: "Fiction",
    status: "available",
    image: null,
    emoji: "../assets/images/",
    description: "Dystopian novel about surveillance."
  },
  {
    id: 4,
    title: "Dune",
    author: "Frank Herbert",
    genre: "Sci-Fi",
    status: "available",
    image: null,
    emoji: null,
    description: "Epic story set in a desert world."
  }
];

/* ── Seed Data (First Load Only) ── */
function seedBooks() {
  const existing = localStorage.getItem(STORAGE_KEY);

  if (!existing) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_BOOKS));
  }
}

/* ── Get All Books ── */
function getBooks() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
}

/* ── Save Books ── */
function saveBooks(books) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
}

/* ── Get Book By ID ── */
function getBookById(id) {
  return getBooks().find(b => b.id === Number(id)) || null;
}

/* ── Add Book ── */
function addBook(bookData) {
  const books = getBooks();

  const maxId = books.reduce((max, b) => Math.max(max, b.id), 0);

  const newBook = {
    id: maxId + 1,
    status: "available",
    image: null,
    emoji: "📘",
    ...bookData
  };

  books.push(newBook);
  saveBooks(books);

  return newBook;
}

/* ── Update Book ── */
function updateBook(updatedBook) {
  const books = getBooks();

  const index = books.findIndex(b => b.id === updatedBook.id);

  if (index !== -1) {
    books[index] = updatedBook;
    saveBooks(books);
  }
}

/* ── Delete Book ── */
function deleteBook(id) {
  const books = getBooks().filter(b => b.id !== Number(id));
  saveBooks(books);
}

/* ── Toggle Borrow Status ── */
function toggleBookStatus(id) {
  const books = getBooks();

  const book = books.find(b => b.id === Number(id));

  if (book) {
    book.status = book.status === "available" ? "borrowed" : "available";
    saveBooks(books);
  }
}

seedBooks();