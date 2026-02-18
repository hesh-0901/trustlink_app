import { db } from "../js/firebase-init.js";
import {
  doc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ==========================================
   SESSION CHECK
========================================== */

const userId =
  localStorage.getItem("userId") ||
  sessionStorage.getItem("userId");

if (!userId) {
  window.location.href = "../index.html";
}

/* ==========================================
   FORCE LOGOUT
========================================== */

function forceLogout() {
  localStorage.clear();
  sessionStorage.clear();
  window.location.href = "../index.html";
}

/* ==========================================
   UPDATE HEADER UI
========================================== */

function updateHeaderUI(user) {

  const fullNameEl = document.getElementById("headerFullName");
  const usernameEl = document.getElementById("headerUsername");
  const avatarContainer = document.getElementById("headerAvatar");

  if (fullNameEl) {
    fullNameEl.textContent =
      `${user.firstName} ${user.lastName}`;
  }

  if (usernameEl) {
    usernameEl.textContent = user.username;
    usernameEl.classList.remove("opacity-0");
    usernameEl.classList.add("opacity-100");
  }

  if (avatarContainer) {

    // On injecte une vraie image avatar
    avatarContainer.innerHTML = `
      <img
        src="https://api.dicebear.com/7.x/avataaars/png?seed=${user.username}&backgroundColor=b6e3f4,c0aede,d1d4f9"
        class="w-full h-full rounded-full object-cover"
        alt="avatar"
      />
    `;
  }
}

/* ==========================================
   REALTIME USER LISTENER
========================================== */

function initRealtimeUser() {

  const userRef = doc(db, "users", userId);

  onSnapshot(userRef, (snap) => {

    if (!snap.exists()) {
      forceLogout();
      return;
    }

    const user = snap.data();

    if (!user.isActive) {
      forceLogout();
      return;
    }

    updateHeaderUI(user);

  }, (error) => {
    console.error("Realtime user error:", error);
  });
}

/* ==========================================
   LOGOUT BUTTON
========================================== */

function initLogout() {

  const logoutBtn = document.getElementById("headerLogout");

  if (!logoutBtn) return;

  logoutBtn.addEventListener("click", () => {
    forceLogout();
  });
}

/* ==========================================
   INIT DIRECT (PAS DOMContentLoaded)
========================================== */

// ⚠️ IMPORTANT : exécuter directement
initRealtimeUser();
initLogout();
