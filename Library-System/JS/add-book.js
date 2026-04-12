/* ── add-book.js ── */

const dropZone   = document.getElementById("dropZone");
const dropInner  = document.getElementById("dropInner");
const imageInput = document.getElementById("imageInput");
const preview    = document.getElementById("imagePreview");
const removeBtn  = document.getElementById("removeImg");
const emojiGrid  = document.getElementById("emojiGrid");

let selectedImage = null; // base64 string
let selectedEmoji = null;

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
    selectedEmoji = null;
    clearEmojiSelection();
    showPreview(selectedImage);
  };
  reader.readAsDataURL(file);
}

function showPreview(src) {
  preview.src = src;
  preview.style.display = "block";
  dropInner.style.display = "none";
  removeBtn.style.display = "block";
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

/* ── Emoji Picker ── */
emojiGrid.addEventListener("click", (e) => {
  const btn = e.target.closest(".emoji-btn");
  if (!btn) return;
  const emoji = btn.dataset.emoji;

  if (btn.classList.contains("selected")) {
    btn.classList.remove("selected");
    selectedEmoji = null;
    return;
  }

  clearEmojiSelection();
  btn.classList.add("selected");
  selectedEmoji = emoji;
  hidePreview(); // clear image if emoji chosen
});

function clearEmojiSelection() {
  document.querySelectorAll(".emoji-btn.selected").forEach(b => b.classList.remove("selected"));
  selectedEmoji = null;
}

/* ── Save Book ── */
function handleAddBook() {
  const title  = document.getElementById("bookTitle").value.trim();
  const author = document.getElementById("bookAuthor").value.trim();
  const genre  = document.getElementById("bookGenre").value;
  const status = document.getElementById("bookStatus").value;
  const desc   = document.getElementById("bookDesc").value.trim();

  if (!title || !author) {
    showToast("Title and Author are required.", "error");
    return;
  }

  const newBook = addBook({
    title,
    author,
    genre,
    status,
    description: desc,
    image: selectedImage || null,
    emoji: selectedEmoji || null,
  });

  showToast(`"${newBook.title}" added successfully!`, "success");
  clearForm();
}

/* ── Clear Form ── */
function clearForm() {
  document.getElementById("bookTitle").value  = "";
  document.getElementById("bookAuthor").value = "";
  document.getElementById("bookDesc").value   = "";
  document.getElementById("bookGenre").selectedIndex = 0;
  document.getElementById("bookStatus").selectedIndex = 0;
  hidePreview();
  clearEmojiSelection();
}

/* ── Toast ── */
function showToast(msg, type = "success") {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.className = `toast ${type}`;
  toast.style.display = "block";
  setTimeout(() => { toast.style.display = "none"; }, 3500);
}