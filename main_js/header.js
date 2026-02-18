import { db } from "../js/firebase-init.js";
import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ==========================================
   SESSION CHECK
========================================== */

const userId =
  localStorage.getItem("userId") ||
  sessionStorage.getItem("userId");

if (!userId) {
  window.location.href = "/trustlink_app/index.html";
}

/* ==========================================
   LOAD HEADER USER
========================================== */

async function loadHeaderUser() {

  try {

    const userRef = doc(db, "users", userId);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = "/trustlink_app/index.html";
      return;
    }

    const user = snap.data();

    const fullNameEl = document.getElementById("headerFullName");
    const usernameEl = document.getElementById("headerUsername");
    const avatarEl = document.getElementById("headerAvatar");

    /* ===== Full Name ===== */
    if (fullNameEl) {
      fullNameEl.textContent =
        `${user.firstName} ${user.lastName}`;
    }

    /* ===== Username Fade In ===== */
    if (usernameEl) {
      usernameEl.textContent = user.username;
      setTimeout(() => {
        usernameEl.classList.remove("opacity-0");
        usernameEl.classList.add("opacity-100");
      }, 250);
    }

    /* ===== Avatar Generation ===== */
    if (avatarEl) {

      // DiceBear style avataaars (flat illustration like your example)
      avatarEl.src =
        `https://api.dicebear.com/7.x/avataaars/png?seed=${user.username}&backgroundColor=b6e3f4,c0aede,d1d4f9`;

    }

  } catch (error) {
    console.error("Header load error:", error);
  }

}

/* ==========================================
   LOGOUT
========================================== */

function initLogout() {

  const logoutBtn = document.getElementById("headerLogout");

  if (!logoutBtn) return;

  logoutBtn.addEventListener("click", () => {

    localStorage.clear();
    sessionStorage.clear();

    window.location.href = "/trustlink_app/index.html";

  });

}

/* ==========================================
   INIT
========================================== */

document.addEventListener("DOMContentLoaded", () => {
  loadHeaderUser();
  initLogout();
});
