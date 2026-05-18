/* ── API ── */
const API_BASE = "/api/books/";

/* ── add-book.js ── */

const dropZone = document.getElementById("dropZone");
const dropInner = document.getElementById("dropInner");
const imageInput = document.getElementById("imageInput");
const preview = document.getElementById("imagePreview");
const removeBtn = document.getElementById("removeImg");

let selectedImage = null; // base64 string

/* ── Drag & Drop ── */
dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.classList.add("drag-over");
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("drag-over");
});

dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("drag-over");
  const file = e.dataTransfer.files[0];
  if (file) loadImageFile(file);
});

/* Click on drop zone (not on the label) */
dropZone.addEventListener("click", (e) => {
  if (e.target.classList.contains("file-link")) return;
  if (selectedImage) return; // already has image
  imageInput.click();
});

/* Browse button */
imageInput.addEventListener("change", () => {
  if (imageInput.files[0]) loadImageFile(imageInput.files[0]);
});

function loadImageFile(file) {
  if (!file.type.startsWith("image/")) {
    showToast("Please select a valid image file.", "error");
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    showToast("Image must be under 5 MB.", "error");
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    selectedImage = e.target.result;
    showPreview(selectedImage);
  };
  reader.readAsDataURL(file);
}

function showPreview(src) {
  preview.src = src;
  preview.style.display = "block";
  dropInner.style.display = "none";
  removeBtn.style.display = "flex";
}

function hidePreview() {
  preview.src = "";
  preview.style.display = "none";
  dropInner.style.display = "flex";
  removeBtn.style.display = "none";
  selectedImage = null;
  imageInput.value = "";
}

removeBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  hidePreview();
});

/**
 * POST a new book to the Django REST API.
 * Reads the auth token from localStorage (key: "authToken").
 * Returns the created book object on success, throws on failure.
 */
async function addBook({ title, author, genre, status, description, image }) {
  const token = localStorage.getItem("authToken");

  const payload = { title, author, genre, status, description };

  // Only include the image field when one was actually chosen.
  // The backend is expected to accept a base64 data-URL string.
  if (image) {
    payload.image = image;
  }

  const response = await fetch(API_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Token ${token}` }),
    },
    body: JSON.stringify(payload),
  });

  if (response.status === 401 || response.status === 403) {
    throw new Error("You must be logged in as an admin to add books.");
  }

  if (!response.ok) {
    // Surface field-level validation errors from DRF when available.
    let detail = `Server error (${response.status}).`;
    try {
      const err = await response.json();
      // DRF returns errors as { field: ["msg", ...] } or { detail: "msg" }
      const messages = Object.entries(err)
        .map(([field, msgs]) =>
          field === "detail"
            ? msgs
            : `${field}: ${Array.isArray(msgs) ? msgs.join(", ") : msgs}`,
        )
        .join(" | ");
      if (messages) detail = messages;
    } catch (_) {
      /* ignore JSON parse failure */
    }
    throw new Error(detail);
  }

  return response.json();
}

/* ── Save Book ── */
async function handleAddBook() {
  const title = document.getElementById("bookTitle").value.trim();
  const author = document.getElementById("bookAuthor").value.trim();
  const genre = document.getElementById("bookGenre").value;
  const status = document.getElementById("bookStatus").value;
  const desc = document.getElementById("bookDesc").value.trim();

  if (!title || !author) {
    showToast("Title and Author are required.", "error");
    return;
  }

  // Disable the save button while the request is in flight.
  const saveBtn = document.querySelector("[onclick='handleAddBook()']");
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = "Saving…";
  }

  try {
    const newBook = await addBook({
      title,
      author,
      genre,
      status,
      description: desc,
      image: selectedImage || null,
    });

    showToast(`"${newBook.title}" added successfully!`, "success");
    clearForm();
  } catch (err) {
    showToast(err.message || "Failed to add book.", "error");
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = "Save Book";
    }
  }
}

/* ── Clear Form ── */
function clearForm() {
  document.getElementById("bookTitle").value = "";
  document.getElementById("bookAuthor").value = "";
  document.getElementById("bookDesc").value = "";
  document.getElementById("bookGenre").selectedIndex = 0;
  document.getElementById("bookStatus").selectedIndex = 0;
  hidePreview();
}

/* ── Toast ── */
function showToast(msg, type = "success") {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.className = `toast ${type}`;
  toast.style.display = "block";
  setTimeout(() => {
    toast.style.display = "none";
  }, 3500);
}
