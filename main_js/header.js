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
   MODERN AVATAR (DiceBear Personas)
========================================== */

function generateModernAvatar(user) {

  // Si plus tard tu ajoutes une vraie photo
  if (user.avatarUrl) {
    return `
      <img src="${user.avatarUrl}"
           class="w-12 h-12 rounded-full object-cover shadow-md"/>
    `;
  }

  const seed = encodeURIComponent(user.username || "user");

  const gender = (user.gender || "").toLowerCase();
  const isFemale = gender.includes("femme");

  const role = (user.role || "").toLowerCase();
  const isAdmin = role.includes("admin");

  // Couleurs vêtements selon rôle
  const adminClothes = ["blazer", "shirt", "suit"];
  const userClothes = ["shirt", "tshirt"];

  const clothes = isAdmin
    ? adminClothes.join(",")
    : userClothes.join(",");

  return `
    <img 
      src="https://api.dicebear.com/7.x/personas/svg
      ?seed=${seed}
      &gender=${isFemale ? "female" : "male"}
      &clothing=${clothes}
      &backgroundType=solid"
      class="w-12 h-12 rounded-full shadow-md"
    />
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
    avatarWrapper.innerHTML = generateModernAvatar(user);
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

function initLogout() {
  const logoutBtn = document.getElementById("headerLogout");
  if (!logoutBtn) return;
  logoutBtn.addEventListener("click", forceLogout);
}

initRealtimeUser();
initLogout();
