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
   PRO AVATAR ENGINE
========================================== */

function generateProAvatar(user) {

  const seed = user.username + user.walletBase + user.birthDate;
  const hash = generateHash(seed);
  const gender = (user.gender || "").toLowerCase();

  const isFemale = gender === "femme";

  // 🎨 Modern corporate backgrounds
  const backgrounds = [
    "#2563EB", // blue
    "#7C3AED", // purple
    "#0EA5E9", // sky
    "#10B981", // emerald
    "#F59E0B", // amber
    "#EF4444", // red
    "#1E293B", // dark slate
    "#EC4899"  // pink
  ];

  const skins = [
    "#F2D6CB",
    "#EAC086",
    "#C68642",
    "#8D5524"
  ];

  const hairColors = [
    "#111827",
    "#3F3F46",
    "#4B5563",
    "#92400E",
    "#B45309"
  ];

  const bg = backgrounds[hash % backgrounds.length];
  const skin = skins[hash % skins.length];
  const hair = hairColors[hash % hairColors.length];

  const hasBeard = !isFemale && hash % 3 === 0;
  const hasGlasses = hash % 4 === 0;

  return `
  <svg viewBox="0 0 200 200" width="48" height="48">
    
    <!-- Background -->
    <circle cx="100" cy="100" r="100" fill="${bg}" />

    <!-- Neck -->
    <rect x="85" y="120" width="30" height="30" fill="${skin}" />

    <!-- Clothes -->
    <path d="M40 200 Q100 140 160 200 Z" fill="${isFemale ? "#ffffff" : "#1f2937"}"/>

    <!-- Face -->
    <circle cx="100" cy="90" r="45" fill="${skin}" />

    <!-- Hair -->
    ${
      isFemale
        ? `<path d="M50 85 Q100 20 150 85 Q145 40 100 35 Q55 40 50 85 Z" fill="${hair}" />`
        : `<path d="M55 70 Q100 25 145 70 Q140 45 100 40 Q60 45 55 70 Z" fill="${hair}" />`
    }

    <!-- Eyes -->
    <circle cx="85" cy="95" r="5" fill="#1F2937"/>
    <circle cx="115" cy="95" r="5" fill="#1F2937"/>

    <!-- Smile -->
    <path d="M80 115 Q100 130 120 115" stroke="#1F2937" stroke-width="3" fill="none" stroke-linecap="round"/>

    <!-- Beard -->
    ${
      hasBeard
        ? `<path d="M75 105 Q100 150 125 105 Z" fill="${hair}" />`
        : ""
    }

    <!-- Glasses -->
    ${
      hasGlasses
        ? `
        <circle cx="85" cy="95" r="10" stroke="#111827" stroke-width="3" fill="none"/>
        <circle cx="115" cy="95" r="10" stroke="#111827" stroke-width="3" fill="none"/>
        <line x1="95" y1="95" x2="105" y2="95" stroke="#111827" stroke-width="3"/>
        `
        : ""
    }

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
    avatarWrapper.innerHTML = generateProAvatar(user);
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
