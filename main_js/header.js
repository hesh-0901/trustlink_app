import { db } from "../js/firebase-init.js";
import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ===============================
   SESSION
================================ */

const userId =
  localStorage.getItem("userId") ||
  sessionStorage.getItem("userId");

if (!userId) {
  window.location.href = "/trustlink_app/index.html";
}

/* ===============================
   LOAD USER HEADER
================================ */

async function loadHeaderUser() {

  const userRef = doc(db, "users", userId);
  const snap = await getDoc(userRef);

  if (!snap.exists()) return;

  const user = snap.data();

  const fullNameEl = document.getElementById("headerFullName");
  const usernameEl = document.getElementById("headerUsername");
  const genderIconEl = document.getElementById("headerGenderIcon");

  if (fullNameEl) {
    fullNameEl.textContent =
      `${user.firstName} ${user.lastName}`;
  }

  if (usernameEl) {
    usernameEl.textContent = user.username;
    setTimeout(() => {
      usernameEl.classList.remove("opacity-0");
      usernameEl.classList.add("opacity-100");
    }, 200);
  }

  if (genderIconEl) {
    if (user.gender === "Homme") {
      genderIconEl.innerHTML =
        `<i class="bi bi-gender-male"></i>`;
    } else if (user.gender === "Femme") {
      genderIconEl.innerHTML =
        `<i class="bi bi-gender-female"></i>`;
    }
  }
}

/* ===============================
   LOGOUT
================================ */

const logoutBtn = document.getElementById("headerLogout");

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "/trustlink_app/index.html";
  });
}

/* ===============================
   INIT
================================ */

setTimeout(() => {
  loadHeaderUser();
}, 100);
