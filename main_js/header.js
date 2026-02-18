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
  const avatarImg = document.getElementById("headerAvatar");

  // Nom complet
  if (fullNameEl) {
    fullNameEl.textContent =
      `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
  }

  // Username
  if (usernameEl) {
    usernameEl.textContent = user.username ?? "";
    usernameEl.classList.remove("opacity-0");
    usernameEl.classList.add("opacity-100");
  }

  // Avatar réaliste stable
  if (avatarImg) {

    const seed = user.username || user.firstName || "user";

    const avatarUrl =
      "https://api.dicebear.com/7.x/personas/png" +
      "?seed=" + encodeURIComponent(seed) +
      "&backgroundColor=f3f4f6" +
      "&radius=50" +
      "&size=256" +
      "&clothes=blazerShirt" +
      "&mouth=smile";

    // Fallback si erreur réseau
    avatarImg.onerror = () => {
      avatarImg.src =
        "https://api.dicebear.com/7.x/personas/png?seed=fallback";
    };

    avatarImg.src = avatarUrl;
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

  logoutBtn.addEventListener("click", forceLogout);
}

/* ==========================================
   INIT
========================================== */

initRealtimeUser();
initLogout();
