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
  window.location.href = "index.html";
}

function forceLogout() {
  localStorage.clear();
  sessionStorage.clear();
  window.location.href = "index.html";
}

/* ==========================================
   MODERN BUSINESS AVATAR (DiceBear Personas)
========================================== */

function generateModernAvatar(user) {

  // 🔹 Si l'utilisateur a uploadé une vraie photo
  if (user.avatarUrl) {
    return `
      <img src="${user.avatarUrl}"
           alt="avatar"
           class="w-12 h-12 rounded-full object-cover shadow-md"/>
    `;
  }

  const seed = encodeURIComponent(user.username || "user");

  const gender = (user.gender || "").toLowerCase();
  const isFemale = gender.includes("femme");

  const role = (user.role || "").toLowerCase();
  const isAdmin = role.includes("admin");

  // 🎯 Style vêtements selon rôle
  const clothing = isAdmin
    ? "blazer,shirt"
    : "shirt";

  // 🔹 URL propre sans retour ligne
  const avatarUrl =
    `https://api.dicebear.com/7.x/personas/svg` +
    `?seed=${seed}` +
    `&gender=${isFemale ? "female" : "male"}` +
    `&clothing=${clothing}` +
    `&backgroundType=solid`;

  return `
    <img src="${avatarUrl}"
         alt="avatar"
         class="w-12 h-12 rounded-full shadow-md"/>
  `;
}

/* ==========================================
   UPDATE HEADER UI
========================================== */

function updateHeaderUI(user) {

  const fullNameEl = document.getElementById("headerFullName");
  const usernameEl = document.getElementById("headerUsername");
  const avatarWrapper = document.getElementById("headerAvatarWrapper");
  const roleBadge = document.getElementById("roleBadge");

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

  // Avatar
  if (avatarWrapper) {
    avatarWrapper.innerHTML = generateModernAvatar(user);
  }

  // Badge rôle
  if (roleBadge && user.role) {
    roleBadge.classList.remove("hidden");
    roleBadge.textContent = user.role;

    roleBadge.style.background =
      user.role === "super_admin"
        ? "#DC2626"
        : user.role === "admin"
        ? "#2563EB"
        : "#475569";
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
   LOGOUT INIT
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
