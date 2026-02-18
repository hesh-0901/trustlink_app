import { db } from "../../js/firebase-init.js";
import { doc, getDoc }
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ===============================
   ROUTE PROTECTION
================================ */
const userId = localStorage.getItem("userId");

if (!userId) {
  window.location.href = "/trustlink_app/index.html";
}

/* ===============================
   LOAD USER
================================ */
async function loadUser() {

  try {

    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      localStorage.clear();
      window.location.href = "/trustlink_app/index.html";
      return;
    }

    const user = userSnap.data();

    if (!user.isActive) {
      localStorage.clear();
      window.location.href = "/trustlink_app/index.html";
      return;
    }

    // Nom
    document.getElementById("userName").textContent =
      `${user.firstName ?? ""} ${user.lastName ?? ""}`;

    // Avatar
    const initials =
      (user.firstName?.[0] || "") +
      (user.lastName?.[0] || "");

    document.getElementById("userAvatar").textContent =
      initials.toUpperCase();

    // Badge admin
    if (user.role === "super_admin") {
      document.getElementById("adminBadge").classList.remove("hidden");
    }

    // Balance animée
    animateBalance(user.balance || 0, user.currency || "USD");

  } catch (error) {
    console.error(error);
  }
}

/* ===============================
   BALANCE ANIMATION
================================ */
function animateBalance(amount, currency) {

  const element = document.getElementById("balanceAmount");
  const currencyLabel = document.getElementById("currencyLabel");

  let start = 0;
  const duration = 800;
  const increment = amount / (duration / 16);

  const counter = setInterval(() => {
    start += increment;
    if (start >= amount) {
      start = amount;
      clearInterval(counter);
    }
    element.textContent = start.toFixed(2);
  }, 16);

  currencyLabel.textContent = currency;
}

/* ===============================
   LOGOUT
================================ */
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.clear();
  window.location.href = "/trustlink_app/index.html";
});

loadUser();
