const db = JSON.parse(localStorage.getItem("library_project_db")) || {
  username: "User Pro",
  borrowedList: [
    { id: 1, title: "Clean Code", date: "2024-03-15", due: "2024-04-15" },
  ],
  returnedList: [],
  returnedCount: 1,
  totalBorrowed: 2,
};

const saveDB = () =>
  localStorage.setItem("library_project_db", JSON.stringify(db));

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("user-welcome")) {
    document.getElementById("user-welcome").innerText =
      `Welcome, ${db.username}!`;
    document.getElementById("stat-active").innerText = db.borrowedList.length;
    document.getElementById("stat-returned").innerText = db.returnedCount;
    document.getElementById("stat-total").innerText = db.totalBorrowed;
    document.querySelector(".profile-img").src =
      "../assets/images/profile-default.jpg";
  }

  const borrowedTable = document.getElementById("borrowed-table-body");
  if (borrowedTable) {
    borrowedTable.innerHTML = db.borrowedList.length
      ? db.borrowedList
          .map(
            (b, i) => `
        <tr>
          <td>${b.title}</td>
          <td>${b.date}</td>
          <td style="color:#fbbf24">${b.due}</td>
          <td><button class="btn-return" onclick="returnBook(${i})">Return</button></td>
        </tr>`,
          )
          .join("")
      : '<tr><td colspan="4">No active loans found.</td></tr>';
  }

  const returnedTable = document.getElementById("returned-table-body");
  if (returnedTable) {
    returnedTable.innerHTML = db.returnedList.length
      ? db.returnedList
          .map(
            (b) => `
        <tr>
          <td>${b.title}</td>
          <td>${b.date}</td>
          <td style="color:#10b981">Returned</td> 
        </tr>`,
          )
          .join("")
      : '<tr><td colspan="3">No returned books yet.</td></tr>';
  }
});

window.returnBook = (i) => {
  if (
    confirm(`Are you sure you want to return "${db.borrowedList[i].title}"?`)
  ) {
    const book = db.borrowedList.splice(i, 1)[0];
    db.returnedList.push(book);
    db.returnedCount++;
    saveDB();
    location.reload();
  }
};
