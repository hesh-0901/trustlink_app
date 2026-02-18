import { db } from "../js/firebase-init.js";
import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ===============================
   SESSION
================================ */

const userId =
  localStorage.getItem("userId") ||
  sessionStorage.getItem("userId");

if (!userId) {
  window.location.href = "/trustlink_app/index.html";
}

/* ===============================
   GENERATE GRADIENT
================================ */

function generateGradient(seed) {

  const colors = [
    ["#1E2BE0", "#3D4BFF"],
    ["#0F1ACD", "#1E2BE0"],
    ["#1E40AF", "#2563EB"],
    ["#1D4ED8", "#3B82F6"]
  ];

  const index = seed.charCodeAt(0) % colors.length;
  const selected = colors[index];

  return `linear-gradient(135deg, ${selected[0]}, ${selected[1]})`;
}

/* ===============================
   LOAD HEADER USER
================================ */

async function loadHeaderUser() {

  const userRef = doc(db, "users", userId);
  const snap = await getDoc(userRef);

  if (!snap.exists()) return;

  const user = snap.data();

  const fullNameEl = document.getElementById("headerFullName");
  const usernameEl = document.getElementById("headerUsername");
  const initialsEl = document.getElementById("headerInitials");
  const avatarEl = document.getElementById("headerAvatar");
  const genderBadgeEl = document.getElementById("headerGenderBadge");

  const initials =
    (user.firstName?.[0] || "") +
    (user.lastName?.[0] || "");

  if (initialsEl) {
    initialsEl.textContent = initials.toUpperCase();
  }

  if (avatarEl) {
    avatarEl.style.background =
      generateGradient(user.firstName || "A");
    avatarEl.classList.add("scale-100");
  }

  if (fullNameEl) {
    fullNameEl.textContent =
      `${user.firstName} ${user.lastName}`;
  }

  if (usernameEl) {
    usernameEl.textContent = user.username;
    setTimeout(() => {
      usernameEl.classList.remove("opacity-0");
      usernameEl.classList.add("opacity-100");
    }, 300);
  }

  if (genderBadgeEl) {
    if (user.gender === "Homme") {
      genderBadgeEl.innerHTML =
        `<i class="bi bi-gender-male"></i>`;
    } else if (user.gender === "Femme") {
      genderBadgeEl.innerHTML =
        `<i class="bi bi-gender-female"></i>`;
    }
  }
}

/* ===============================
   LOGOUT
================================ */

const logoutBtn = document.getElementById("headerLogout");

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "/trustlink_app/index.html";
  });
}

/* ===============================
   INIT
================================ */

setTimeout(() => {
  loadHeaderUser();
}, 100);
