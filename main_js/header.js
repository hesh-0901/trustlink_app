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
  const adminBadge = document.getElementById("adminBadge");

  // =========================
  // NOM
  // =========================

  if (fullNameEl) {
    fullNameEl.textContent =
      `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
  }

  if (usernameEl) {
    usernameEl.textContent = user.username ?? "";
    usernameEl.classList.remove("opacity-0");
    usernameEl.classList.add("opacity-100");
  }

  if (!avatarImg) return;

  // =========================
  // GENRE + ROLE
  // =========================

  const seed = user.username || user.firstName || "user";
  const rawGender = (user.gender || "").toString().trim().toLowerCase();
  const role = (user.role || "").toString().trim().toLowerCase();

  let style = "personas";

  if (rawGender === "homme") {
    style = "micah";
  } else if (rawGender === "femme") {
    style = "lorelei";
  }

  // =========================
  // TEINT AFRIQUE (plus foncé)
  // =========================

  const africanSkinTones =
    "tanned,darkBrown,brown";

  // =========================
  // URL AVATAR
  // =========================

  const avatarUrl =
    "https://api.dicebear.com/7.x/" + style + "/png" +
    "?seed=" + encodeURIComponent(seed) +
    "&backgroundColor=f3f4f6" +
    "&radius=50" +
    "&size=256" +
    "&skinColor=" + africanSkinTones;

  avatarImg.src = avatarUrl;

  // =========================
  // ROLE STYLING
  // =========================

  avatarImg.classList.remove("border-yellow-500", "border-blue-500");

  if (role === "super_admin") {

    // Anneau doré
    avatarImg.classList.add("border-yellow-500");

    if (adminBadge) {
      adminBadge.classList.remove("hidden");
      adminBadge.textContent = "ADMIN";
    }

  } else if (role === "business") {

    // Anneau bleu corporate
    avatarImg.classList.add("border-blue-500");

    if (adminBadge) {
      adminBadge.classList.add("hidden");
    }

  } else {

    if (adminBadge) {
      adminBadge.classList.add("hidden");
    }
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
