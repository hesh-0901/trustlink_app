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
   PREMIUM AVATAR GENERATOR
========================================== */

function generatePremiumAvatar(user) {

  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");

  const first = user.firstName?.[0] || "";
  const last = user.lastName?.[0] || "";
  const initials = (first + last).toUpperCase() || "U";

  const seed = user.username || "user";

  // Cache performance
  const cacheKey = "avatar_" + seed;
  const cached = localStorage.getItem(cacheKey);
  if (cached) return cached;

  // Hash → Hue
  function stringToHue(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash % 360);
  }

  const hue = stringToHue(seed);
  const color1 = `hsl(${hue}, 70%, 45%)`;
  const color2 = `hsl(${(hue + 40) % 360}, 70%, 35%)`;

  // Gradient
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, color1);
  gradient.addColorStop(1, color2);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // Glass overlay
  ctx.fillStyle = "rgba(255,255,255,0.05)";
  ctx.fillRect(0, 0, size, size);

  // Initiales
  ctx.fillStyle = "#ffffff";
  ctx.font = "600 96px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(initials, size / 2, size / 2);

  const image = canvas.toDataURL("image/png");
  localStorage.setItem(cacheKey, image);

  return image;
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
    avatarImg.src = generatePremiumAvatar(user);
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
