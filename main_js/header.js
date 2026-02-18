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
  // GENRE
  // =====================

  const seed = user.username || user.firstName || "user";
  const gender = (user.gender || "").toLowerCase().trim();
  const role = (user.role || "").toLowerCase().trim();

  let style = "notionists-neutral";

  if (gender === "homme") {
    style = "notionists";
  } else if (gender === "femme") {
    style = "notionists-neutral";
  }

  // =====================
  // TEINT AFRIQUE
  // =====================

  const skinTones = "&skinColor=darkBrown,brown,tanned";

  const avatarUrl =
    "https://api.dicebear.com/7.x/" + style + "/png" +
    "?seed=" + encodeURIComponent(seed) +
    skinTones +
    "&radius=50" +
    "&size=256" +
    "&backgroundColor=f3f4f6";

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
