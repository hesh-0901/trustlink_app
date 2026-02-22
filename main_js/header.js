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

function forceLogout() {
  localStorage.clear();
  sessionStorage.clear();
  window.location.href = "../index.html";
}

/* ==========================================
   HASH GENERATOR
========================================== */

function generateHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

/* ==========================================
   AVATAR ENGINE PREMIUM
========================================== */

function generatePremiumAvatar(user) {

  const seed = user.username + user.walletBase + user.birthDate;
  const hash = generateHash(seed);
  const gender = (user.gender || "").toLowerCase();

  // 🎨 Corporate backgrounds
  const backgrounds = [
    "#E2E8F0", // slate
    "#F1F5F9",
    "#E0E7FF",
    "#F8FAFC",
    "#FEF3C7"
  ];

  const skins = [
    "#F1C27D",
    "#E0AC69",
    "#C68642",
    "#8D5524"
  ];

  const bg = backgrounds[hash % backgrounds.length];
  const skin = skins[hash % skins.length];

  const hairColor = ["#111827", "#3F3F46", "#4B5563"][hash % 3];

  const isFemale = gender === "femme";

  return `
  <svg viewBox="0 0 200 200" width="48" height="48">
    <circle cx="100" cy="100" r="100" fill="${bg}" />

    <!-- Neck -->
    <rect x="85" y="120" width="30" height="30" fill="${skin}" />

    <!-- Face -->
    <circle cx="100" cy="90" r="45" fill="${skin}" />

    <!-- Hair -->
    ${
      isFemale
        ? `<path d="M55 90 Q100 30 145 90 V60 Q100 10 55 60 Z" fill="${hairColor}" />`
        : `<path d="M60 70 Q100 30 140 70 V60 Q100 20 60 60 Z" fill="${hairColor}" />`
    }

    <!-- Eyes -->
    <circle cx="85" cy="90" r="4" fill="#1F2937"/>
    <circle cx="115" cy="90" r="4" fill="#1F2937"/>

    <!-- Nose -->
    <rect x="98" y="95" width="4" height="10" rx="2" fill="#D4A373"/>

    <!-- Clothes -->
    <path d="M50 200 Q100 150 150 200 Z" fill="${isFemale ? "#6366F1" : "#334155"}"/>
  </svg>
  `;
}

/* ==========================================
   UPDATE HEADER UI
========================================== */

function updateHeaderUI(user) {

  const fullNameEl = document.getElementById("headerFullName");
  const usernameEl = document.getElementById("headerUsername");
  const avatarWrapper = document.getElementById("headerAvatarWrapper");

  if (fullNameEl) {
    fullNameEl.textContent =
      `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
  }

  if (usernameEl) {
    usernameEl.textContent = user.username ?? "";
    usernameEl.classList.remove("opacity-0");
    usernameEl.classList.add("opacity-100");
  }

  if (avatarWrapper) {
    avatarWrapper.innerHTML = generatePremiumAvatar(user);
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

function initLogout() {
  const logoutBtn = document.getElementById("headerLogout");
  if (!logoutBtn) return;
  logoutBtn.addEventListener("click", forceLogout);
}

initRealtimeUser();
initLogout();
