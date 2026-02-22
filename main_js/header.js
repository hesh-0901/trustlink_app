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
   PREMIUM BUSINESS AVATAR ENGINE
========================================== */

function generatePremiumAvatar(user) {

  const seed = encodeURIComponent(user.username || "user");

  const genderRaw = (user.gender || "").toLowerCase();
  const roleRaw = (user.role || "").toLowerCase();

  const isFemale = genderRaw.includes("femme");
  const isAdmin = roleRaw.includes("admin");

  // 👔 Vêtements selon rôle
  const clothing = isAdmin
    ? "blazerShirt"
    : "shirt";

  return (
    "https://api.dicebear.com/7.x/personas/svg" +
    `?seed=${seed}` +
    `&size=256` +
    `&radius=50` +
    `&backgroundColor=f3f4f6` +
    `&gender=${isFemale ? "female" : "male"}` +
    `&clothing=${clothing}`
  );
}
/* ==========================================
   UPDATE HEADER UI
========================================== */

function updateHeaderUI(user) {

  const fullNameEl = document.getElementById("headerFullName");
  const usernameEl = document.getElementById("headerUsername");
  const avatarImg = document.getElementById("headerAvatar");
  const roleBadge = document.getElementById("roleBadge");

  if (fullNameEl) {
    fullNameEl.textContent =
      `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
  }

  if (usernameEl) {
    usernameEl.textContent = user.username ?? "";
    usernameEl.classList.remove("opacity-0");
    usernameEl.classList.add("opacity-100");
  }

  if (avatarImg) {
    avatarImg.src = generatePremiumAvatar(user);
  }

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
