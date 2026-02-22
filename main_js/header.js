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
   BUSINESS AVATAR ENGINE
========================================== */

function generateBusinessAvatar(user) {

  const seed =
    (user.username || "") +
    (user.walletBase || "") +
    (user.birthDate || "");

  const hash = generateHash(seed);

  const gender = (user.gender || "").toLowerCase();
  const isFemale = gender.includes("femme");

  const role = (user.role || "").toLowerCase();
  const isAdmin = role.includes("admin");

  /* 🎨 Couleurs strictes */
  const backgrounds = [
    "#1E293B", // slate dark
    "#0F172A", // navy
    "#111827", // charcoal
    "#1F2937", // gray dark
    "#312E81"  // indigo deep
  ];

  const skins = [
    "#F1D0B5",
    "#D8A47F",
    "#B97A56",
    "#8A5A44"
  ];

  const hairColors = [
    "#0F172A",
    "#1F2937",
    "#374151",
    "#3F3F46"
  ];

  const bg = backgrounds[hash % backgrounds.length];
  const skin = skins[hash % skins.length];
  const hair = hairColors[hash % hairColors.length];

  const hasBeard = !isFemale && hash % 2 === 0;
  const hasGlasses = hash % 3 === 0;

  /* 👔 Admin = costume */
  const suitColor = "#111827";
  const tieColors = ["#7C3AED", "#DC2626", "#2563EB", "#059669"];
  const tie = tieColors[hash % tieColors.length];

  /* 👕 User = t-shirt sobre */
  const shirtColors = ["#334155", "#1F2937", "#374151"];
  const shirt = shirtColors[hash % shirtColors.length];

  return `
  <svg viewBox="0 0 200 200" width="48" height="48">

    <!-- Background -->
    <circle cx="100" cy="100" r="100" fill="${bg}" />

    <!-- Neck -->
    <rect x="85" y="115" width="30" height="35" fill="${skin}" />

    <!-- Clothes -->
    ${
      isAdmin
        ? `
        <!-- Suit -->
        <path d="M40 200 Q100 135 160 200 Z" fill="${suitColor}"/>
        <!-- Shirt -->
        <polygon points="85,140 100,160 115,140" fill="#ffffff"/>
        <!-- Tie -->
        <polygon points="95,140 105,140 102,175 98,175" fill="${tie}"/>
        `
        : `
        <!-- T-shirt -->
        <path d="M40 200 Q100 150 160 200 Z" fill="${shirt}"/>
        `
    }

    <!-- Face -->
    <circle cx="100" cy="85" r="45" fill="${skin}" />

    <!-- Hair -->
    ${
      isFemale
        ? `<path d="M50 80 Q100 25 150 80 Q140 45 100 40 Q60 45 50 80 Z" fill="${hair}" />`
        : `<path d="M55 65 Q100 30 145 65 Q140 50 100 45 Q60 50 55 65 Z" fill="${hair}" />`
    }

    <!-- Eyes -->
    <circle cx="85" cy="90" r="4" fill="#0F172A"/>
    <circle cx="115" cy="90" r="4" fill="#0F172A"/>

    <!-- Mouth (neutral business) -->
    <line x1="85" y1="115" x2="115" y2="115" stroke="#0F172A" stroke-width="3" stroke-linecap="round"/>

    <!-- Beard -->
    ${
      hasBeard
        ? `<path d="M75 105 Q100 145 125 105 Z" fill="${hair}" />`
        : ""
    }

    <!-- Glasses -->
    ${
      hasGlasses
        ? `
        <circle cx="85" cy="90" r="9" stroke="#000" stroke-width="2" fill="none"/>
        <circle cx="115" cy="90" r="9" stroke="#000" stroke-width="2" fill="none"/>
        <line x1="94" y1="90" x2="106" y2="90" stroke="#000" stroke-width="2"/>
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

  if (avatarWrapper) {
    avatarWrapper.innerHTML = generateBusinessAvatar(user);
  }

  if (roleBadge && user.role) {
    roleBadge.classList.remove("hidden");
    roleBadge.textContent = user.role;

    roleBadge.style.background =
      user.role === "super_admin"
        ? "#B91C1C"
        : user.role === "admin"
        ? "#1D4ED8"
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

function initLogout() {
  const logoutBtn = document.getElementById("headerLogout");
  if (!logoutBtn) return;
  logoutBtn.addEventListener("click", forceLogout);
}

initRealtimeUser();
initLogout();
