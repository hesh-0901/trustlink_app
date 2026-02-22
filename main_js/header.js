import { db } from "/trustlink_app/js/firebase-init.js";
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
   HASH GENERATOR (avatar stable)
========================================== */

function generateHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

/* ==========================================
   UPDATE HEADER UI
========================================== */

function updateHeaderUI(user) {

  const fullNameEl = document.getElementById("headerFullName");
  const usernameEl = document.getElementById("headerUsername");
  const avatarImg = document.getElementById("headerAvatar");
  const roleBadge = document.getElementById("roleBadge");

  // =====================
  // NOM
  // =====================

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

  // =====================
  // AVATAR 3D HUMANOÏDE
  // =====================

  const seed = user.username || user.firstName || "user";
  const gender = (user.gender || "").toLowerCase().trim();
  const role = (user.role || "").toLowerCase().trim();

  let bodyType = "male";
  if (gender === "femme") {
    bodyType = "female";
  }

  const hash = generateHash(seed);

  // ReadyPlayerMe render endpoint (PNG 2D render of 3D avatar)
  const avatarUrl =
    `https://api.readyplayer.me/avatar?` +
    `seed=${hash}&` +
    `bodyType=${bodyType}&` +
    `size=256`;

  avatarImg.src = avatarUrl;

  // =====================
  // RESET STYLE
  // =====================

  avatarImg.classList.remove(
    "border-yellow-500",
    "border-blue-600",
    "border-purple-600",
    "shadow-yellow-400"
  );

  if (roleBadge) {
    roleBadge.classList.add("hidden");
    roleBadge.classList.remove(
      "bg-yellow-500",
      "bg-blue-600",
      "bg-purple-600"
    );
  }

  // =====================
  // ROLE SYSTEM
  // =====================

  if (role === "super_admin") {

    avatarImg.classList.add("border-yellow-500", "shadow-yellow-400");

    if (roleBadge) {
      roleBadge.textContent = "SUPER";
      roleBadge.classList.remove("hidden");
      roleBadge.classList.add("bg-yellow-500");
    }

  } else if (role === "admin") {

    avatarImg.classList.add("border-purple-600");

    if (roleBadge) {
      roleBadge.textContent = "ADMIN";
      roleBadge.classList.remove("hidden");
      roleBadge.classList.add("bg-purple-600");
    }

  } else if (role === "business") {

    avatarImg.classList.add("border-blue-600");

    if (roleBadge) {
      roleBadge.textContent = "PRO";
      roleBadge.classList.remove("hidden");
      roleBadge.classList.add("bg-blue-600");
    }

  } else {

    avatarImg.classList.add("border-transparent");
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
