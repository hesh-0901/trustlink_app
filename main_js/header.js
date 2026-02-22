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
   GENERATE MODERN AVATAR (DiceBear)
========================================== */

function generateAvatarUrl(user) {

  const seed = encodeURIComponent(user.username || "user");
  const role = (user.role || "").toLowerCase();
  const gender = (user.gender || "").toLowerCase();

  const isAdmin = role.includes("admin");
  const isFemale = gender.includes("femme");

  const clothing = isAdmin
    ? "blazerShirt"
    : "shirt";

  return (
    "https://api.dicebear.com/7.x/personas/png" +
    `?seed=${seed}` +
    `&backgroundColor=f3f4f6` +
    `&radius=50` +
    `&size=256` +
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
    avatarImg.src = generateAvatarUrl(user);
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
